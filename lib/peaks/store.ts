// Durable per-user storage backed by the Pi user-state API.
// A tiny debounced writer keeps saves under the backend rate limits and never drops
// the last good state when a write is rejected.

export interface StoreApi {
  get: (key: string) => Promise<{ blob: unknown } | null>;
  set: (key: string, blob: Record<string, unknown>) => Promise<void>;
}

/** In-memory fallback used when the SDK is not available (e.g. App Studio iframe). */
export function makeMemStore(): StoreApi {
  const mem = new Map<string, Record<string, unknown>>();
  return {
    get: async (key) => {
      const v = mem.get(key);
      return v ? { blob: v } : null;
    },
    set: async (key, blob) => {
      mem.set(key, blob);
    },
  };
}

interface SdkLike {
  state?: {
    get?: (key: string) => Promise<{ blob: unknown } | null>;
    set?: (key: string, blob: Record<string, unknown>) => Promise<void>;
  };
}

/** Adapt the template SDK instance (state.get / state.set) to StoreApi. */
export function storeOf(sdk: SdkLike | null): StoreApi {
  if (!sdk || !sdk.state || !sdk.state.get || !sdk.state.set) {
    return makeMemStore();
  }
  const get = sdk.state.get.bind(sdk.state);
  const set = sdk.state.set.bind(sdk.state);
  return {
    get: (key) => get(key),
    set: (key, blob) => set(key, blob),
  };
}

const MIN_PER_KEY_MS = 5200;
const MIN_ACROSS_KEYS_MS = 1100;

/**
 * Per-key debounced writer with backoff. Coalesces rapid changes, spaces writes across
 * keys, and retries rejected writes without losing the pending state.
 */
export class KeyWriter {
  private store: StoreApi;
  private key: string;
  private debounceMs: number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: (() => Record<string, unknown>) | null = null;
  private lastWrite = 0;
  private inFlight = false;
  private backoff = 3000;
  private onTrouble: (v: boolean) => void;

  private static lastAnyWrite = 0;

  constructor(
    store: StoreApi,
    key: string,
    debounceMs: number,
    onTrouble: (v: boolean) => void,
  ) {
    this.store = store;
    this.key = key;
    this.debounceMs = debounceMs;
    this.onTrouble = onTrouble;
  }

  /** Debounced write of the latest snapshot. */
  queue(builder: () => Record<string, unknown>) {
    this.pending = builder;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.debounceMs);
  }

  /** Write as soon as the rate limits allow. */
  now(builder: () => Record<string, unknown>) {
    this.pending = builder;
    if (this.timer) clearTimeout(this.timer);
    this.flush();
  }

  private schedule(delay: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), Math.max(120, delay));
  }

  private async flush() {
    if (this.inFlight || !this.pending) return;

    const now = Date.now();
    const sincePerKey = now - this.lastWrite;
    const sinceAny = now - KeyWriter.lastAnyWrite;
    if (sincePerKey < MIN_PER_KEY_MS) {
      this.schedule(MIN_PER_KEY_MS - sincePerKey);
      return;
    }
    if (sinceAny < MIN_ACROSS_KEYS_MS) {
      this.schedule(MIN_ACROSS_KEYS_MS - sinceAny);
      return;
    }

    const builder = this.pending;
    this.inFlight = true;
    try {
      const blob = builder();
      KeyWriter.lastAnyWrite = Date.now();
      await this.store.set(this.key, blob);
      this.lastWrite = Date.now();
      this.pending = null;
      this.backoff = 3000;
      this.onTrouble(false);
    } catch {
      // Keep the pending state and retry with backoff — never lose progress.
      this.onTrouble(true);
      this.schedule(this.backoff);
      this.backoff = Math.min(this.backoff * 1.8, 30000);
    } finally {
      this.inFlight = false;
    }
  }

  /** Force any pending write out immediately (used on page hide). */
  flushNow() {
    if (this.pending) this.flush();
  }
}
