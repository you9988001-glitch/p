"use client";

import { usePeaks } from "@/contexts/peaks-context";
import { elevationTier, type Peak } from "@/lib/peaks/data";
import { cx, IconMountain, Spinner } from "@/components/peaks/ui";

/* ---------------- Loading ---------------- */

export function LoadingScreen() {
  return (
    <div className="pk-app-bg flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl pk-hero-grad text-[var(--pk-on-hero)]">
        <IconMountain className="h-8 w-8" />
      </div>
      <div className="flex items-center gap-2 text-[var(--pk-muted)]">
        <Spinner className="h-4 w-4" />
        <span className="text-sm font-medium">Loading your field guide…</span>
      </div>
    </div>
  );
}

/* ---------------- Storage notice ---------------- */

export function StorageNotice() {
  const { storageTrouble } = usePeaks();
  if (!storageTrouble) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[220] flex justify-center px-4 pk-safe-top">
      <div className="pk-fade-in mt-2 rounded-full border border-[var(--pk-amber-soft)] bg-[var(--pk-amber-soft)] px-4 py-2 text-xs font-semibold text-[color-mix(in_oklch,var(--pk-amber)_55%,black)] shadow-sm">
        Saving to your Pi account is taking a moment…
      </div>
    </div>
  );
}

/* ---------------- Toast host ---------------- */

export function ToastHost() {
  const { toasts } = usePeaks();
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[210] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pk-toast max-w-[86%] rounded-full bg-[var(--pk-ink)] px-4 py-2.5 text-center text-sm font-medium text-[var(--pk-panel)] shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Progress bar ---------------- */

export function ProgressBar({
  value,
  className,
  tone = "hero",
}: {
  value: number; // 0..1
  className?: string;
  tone?: "hero" | "forest";
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={cx(
        "h-2.5 w-full overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--pk-line)_70%,transparent)]",
        className,
      )}
    >
      <div
        className={cx(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          tone === "hero"
            ? "bg-[var(--pk-on-hero)]"
            : "pk-hero-grad",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ---------------- Peak artwork ---------------- */
/*
 * List/home cards: procedural ridge silhouette only.
 * Detail page no longer uses a photo/hero image.
 */

const TIER_VARS = [
  "--pk-band-1",
  "--pk-band-2",
  "--pk-band-3",
  "--pk-band-4",
  "--pk-band-5",
];

// Small deterministic hash so the same peak always gets the same shape,
// without needing to store a "shape" field for all 3141 entries.
function hashOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

type SilhouetteShape = "twinSpire" | "sharpSpire" | "broadRidge" | "dome";

const SHAPES: SilhouetteShape[] = ["twinSpire", "sharpSpire", "broadRidge", "dome"];

const FRONT_PATHS: Record<SilhouetteShape, string> = {
  // two close, jagged summits — classic alpine look
  twinSpire: "M0 80 L34 40 L52 60 L74 22 L96 60 L120 44 L120 80 Z",
  // one dominant sharp spire, off-center — dramatic single peak
  sharpSpire: "M0 80 L18 62 L46 66 L70 16 L88 58 L120 50 L120 80 Z",
  // wide, gently rolling ridge — older, weathered ranges
  broadRidge: "M0 80 L20 52 L44 58 L60 40 L82 56 L104 46 L120 58 L120 80 Z",
  // rounded shoulder, single soft summit — volcanic / dome-shaped peaks
  dome: "M0 80 L14 66 Q60 18 106 66 L120 62 L120 80 Z",
};

const BACK_PATHS: Record<SilhouetteShape, string> = {
  twinSpire: "M0 80 L28 34 L46 52 L64 26 L84 50 L100 30 L120 54 L120 80 Z",
  sharpSpire: "M0 80 L24 48 L42 58 L58 30 L78 54 L100 40 L120 58 L120 80 Z",
  broadRidge: "M0 80 L16 60 L38 64 L54 50 L76 62 L98 54 L120 64 L120 80 Z",
  dome: "M0 80 L10 70 Q60 30 110 70 L120 68 L120 80 Z",
};

// Snow cap position roughly follows each shape's highest point.
const SNOW_PATHS: Record<SilhouetteShape, string> = {
  twinSpire: "M74 22 L69 30 L73 31 L71 35 L78 35 L76 31 L80 30 Z",
  sharpSpire: "M70 16 L65 25 L69 26 L67 30 L74 30 L72 26 L76 25 Z",
  broadRidge: "M60 40 L56 47 L60 48 L58 51 L64 51 L62 47 L66 47 Z",
  dome: "M60 18 L54 27 L60 26 L58 32 L66 32 L64 26 L68 27 Z",
};

export function PeakArt({
  peak,
  className,
  showSnow = true,
}: {
  peak: Peak;
  className?: string;
  showSnow?: boolean;
}) {
  const tier = elevationTier(peak.elevationM);
  const hue = TIER_VARS[tier - 1];
  const snowy = showSnow && tier >= 3;
  const shape = SHAPES[hashOf(peak.id) % SHAPES.length];

  return (
    <div
      className={cx("relative overflow-hidden", className)}
      style={{
        background: `linear-gradient(160deg, color-mix(in oklch, var(${hue}) 30%, var(--pk-panel)), color-mix(in oklch, var(${hue}) 12%, var(--pk-panel)))`,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 120 80"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        <path
          d={BACK_PATHS[shape]}
          fill={`color-mix(in oklch, var(${hue}) 45%, white)`}
          opacity={0.5}
        />
        <path
          d={FRONT_PATHS[shape]}
          fill={`color-mix(in oklch, var(${hue}) 70%, black)`}
          opacity={0.9}
        />
        {snowy && <path d={SNOW_PATHS[shape]} fill="white" opacity={0.92} />}
      </svg>
    </div>
  );
}

/* ---------------- FoundBadge ---------------- */

export function FoundDot() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--pk-forest)] text-[var(--pk-on-hero)]">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m5 12.5 4.5 4.5L19 7" />
      </svg>
    </span>
  );
}
