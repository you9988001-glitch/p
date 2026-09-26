"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  patchPeaksUiResume,
  readPeaksUiResume,
  writePeaksUiResume,
} from "@/lib/peaks/ui-resume";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { KeyWriter, storeOf, type StoreApi } from "@/lib/peaks/store";
import {
  findPeakById,
  indexToPeak,
  loadPeakIndex,
  type ContinentId,
  type Peak,
  type PeakIndexRow,
} from "@/lib/peaks/data";
import {
  appendDiscovery,
  sanitizeDiscoveries,
  type AntipodeDiscovery,
} from "@/lib/peaks/discoveries";

export type TabId = "home" | "catalog" | "favorites";
export type ViewMode = "list" | "grid";

export type NavState =
  | { screen: "home" }
  | { screen: "found" }
  | { screen: "continent"; continentId: ContinentId }
  | {
      screen: "country";
      continentId: ContinentId;
      countryCode: string | null;
      countryName: string;
    };

export interface Toast {
  id: string;
  message: string;
}

const COLLECTION_KEY = "peaks.collection";
const PREFS_KEY = "peaks.prefs";
const MAX_RECENT = 24;

interface Collection {
  found: string[];
  favorites: string[];
  recent: string[];
  discoveries?: AntipodeDiscovery[];
}

interface Prefs {
  view: ViewMode;
  tab: TabId;
}

function extractObject(rec: unknown): Record<string, unknown> {
  if (!rec || typeof rec !== "object") return {};
  const maybe = rec as { blob?: unknown };
  const blob = "blob" in maybe ? maybe.blob : rec;
  if (!blob || typeof blob !== "object") return {};
  const inner = (blob as { blob?: unknown }).blob;
  if (inner && typeof inner === "object") return inner as Record<string, unknown>;
  return blob as Record<string, unknown>;
}

function cleanIds(value: unknown, valid: Set<string>, cap: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of value) {
    if (typeof v !== "string") continue;
    if (valid.size && !valid.has(v)) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= cap) break;
  }
  return out;
}

interface PeaksContextValue {
  ready: boolean;
  storageTrouble: boolean;
  indexReady: boolean;

  foundCount: number;
  favCount: number;
  isFound: (id: string) => boolean;
  isFav: (id: string) => boolean;
  toggleFound: (id: string) => void;
  toggleFav: (id: string) => void;

  discoveries: AntipodeDiscovery[];
  recordAntipodeDiscovery: (fromId: string, toId: string) => void;

  recentPeaks: Peak[];
  favoritePeaks: Peak[];
  foundPeaks: Peak[];
  peakIndex: PeakIndexRow[];

  view: ViewMode;
  setView: (v: ViewMode) => void;
  tab: TabId;
  setTab: (t: TabId) => void;
  nav: NavState;
  setNav: (n: NavState) => void;

  toasts: Toast[];
  toast: (message: string) => void;
}

const PeaksContext = createContext<PeaksContextValue | undefined>(undefined);

export function PeaksProvider({ children }: { children: ReactNode }) {
  const { sdk, isAuthenticated } = usePiAuth();

  const [ready, setReady] = useState(true); // UI first — don't gate on storage
  const [indexReady, setIndexReady] = useState(false);
  const [storageTrouble, setStorageTrouble] = useState(false);
  const [peakIndex, setPeakIndex] = useState<PeakIndexRow[]>([]);
  const [validIds, setValidIds] = useState<Set<string>>(new Set());

  const [found, setFound] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [discoveries, setDiscoveries] = useState<AntipodeDiscovery[]>([]);
  const [view, setViewState] = useState<ViewMode>("list");
  const [tab, setTabState] = useState<TabId>("home");
  const [nav, setNavState] = useState<NavState>({ screen: "home" });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const resumeHydrated = useRef(false);
  const usedUiResume = useRef(false);

  const foundRef = useRef<string[]>([]);
  const favRef = useRef<string[]>([]);
  const recentRef = useRef<string[]>([]);
  const discoveriesRef = useRef<AntipodeDiscovery[]>([]);
  const prefsRef = useRef<Prefs>({ view: "list", tab: "home" });
  const collectionWriter = useRef<KeyWriter | null>(null);
  const prefsWriter = useRef<KeyWriter | null>(null);

  foundRef.current = found;
  favRef.current = favorites;
  recentRef.current = recent;
  discoveriesRef.current = discoveries;
  prefsRef.current = { view, tab };

  useEffect(() => {
    if (resumeHydrated.current) return;
    resumeHydrated.current = true;
    const r = readPeaksUiResume();
    if (!r) return;
    usedUiResume.current = true;
    setTabState(r.tab);
    setNavState(r.nav);
    prefsRef.current = { ...prefsRef.current, tab: r.tab };
  }, []);

  const setNav = useCallback((n: NavState) => {
    setNavState(n);
    patchPeaksUiResume({ nav: n });
  }, []);

  useEffect(() => {
    if (!resumeHydrated.current) return;
    writePeaksUiResume({
      tab,
      nav,
      openId: readPeaksUiResume()?.openId ?? null,
      curatorNote: readPeaksUiResume()?.curatorNote === true,
    });
  }, [tab, nav]);

  useEffect(() => {
    const flush = () => {
      writePeaksUiResume({
        tab,
        nav,
        openId: readPeaksUiResume()?.openId ?? null,
        curatorNote: readPeaksUiResume()?.curatorNote === true,
      });
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [tab, nav]);

  // Warm peak index in background (not on critical path for home cards)
  useEffect(() => {
    let cancelled = false;
    loadPeakIndex().then((rows) => {
      if (cancelled) return;
      setPeakIndex(rows);
      setValidIds(new Set(rows.map((r) => r.id)));
      setIndexReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist when auth available; otherwise keep local session state
  useEffect(() => {
    const store = storeOf(isAuthenticated ? (sdk as never) : null);
    collectionWriter.current = new KeyWriter(
      store,
      COLLECTION_KEY,
      1000,
      setStorageTrouble,
    );
    prefsWriter.current = new KeyWriter(store, PREFS_KEY, 900, setStorageTrouble);

    if (!isAuthenticated) return;

    let cancelled = false;
    (async () => {
      try {
        const [colRec, prefRec] = await Promise.all([
          store.get(COLLECTION_KEY),
          store.get(PREFS_KEY),
        ]);
        if (cancelled) return;
        const o = extractObject(colRec);
        const p = extractObject(prefRec);
        const ids = validIds.size
          ? validIds
          : new Set<string>(
              Array.isArray(o.found) ? (o.found as string[]) : [],
            );
        setFound(cleanIds(o.found, ids, 20000));
        setFavorites(cleanIds(o.favorites, ids, 20000));
        setRecent(cleanIds(o.recent, ids, MAX_RECENT));
        const disc = sanitizeDiscoveries(o.discoveries, ids);
        discoveriesRef.current = disc;
        setDiscoveries(disc);
        if (p.view === "grid") setViewState("grid");
        if (!usedUiResume.current) {
          if (p.tab === "catalog" || p.tab === "favorites") setTabState(p.tab);
        } else {
          prefsRef.current = { ...prefsRef.current, tab: prefsRef.current.tab };
        }
      } catch {
        /* fresh */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, sdk, validIds]);

  useEffect(() => {
    const flush = () => {
      collectionWriter.current?.flushNow();
      prefsWriter.current?.flushNow();
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const commitCollection = () => {
    collectionWriter.current?.now(() => ({
      found: [...foundRef.current],
      favorites: [...favRef.current],
      recent: [...recentRef.current],
      discoveries: [...discoveriesRef.current],
    }));
  };

  const commitPrefs = () => {
    prefsWriter.current?.queue(() => ({
      view: prefsRef.current.view,
      tab: prefsRef.current.tab,
    }));
  };

  const toast = (message: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600);
  };

  const foundSet = useMemo(() => new Set(found), [found]);
  const favSet = useMemo(() => new Set(favorites), [favorites]);
  const indexMap = useMemo(() => {
    const m = new Map<string, PeakIndexRow>();
    for (const r of peakIndex) m.set(r.id, r);
    return m;
  }, [peakIndex]);

  const isFound = (id: string) => foundSet.has(id);
  const isFav = (id: string) => favSet.has(id);

  const toggleFound = (id: string) => {
    const has = foundRef.current.includes(id);
    if (has) {
      setFound((prev) => prev.filter((x) => x !== id));
      setRecent((prev) => prev.filter((x) => x !== id));
      foundRef.current = foundRef.current.filter((x) => x !== id);
      recentRef.current = recentRef.current.filter((x) => x !== id);
    } else {
      setFound((prev) => [...prev, id]);
      setRecent((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT));
      foundRef.current = [...foundRef.current, id];
      recentRef.current = [id, ...recentRef.current.filter((x) => x !== id)].slice(
        0,
        MAX_RECENT,
      );
    }
    commitCollection();
  };

  const toggleFav = (id: string) => {
    const has = favRef.current.includes(id);
    setFavorites((prev) => (has ? prev.filter((x) => x !== id) : [...prev, id]));
    favRef.current = has
      ? favRef.current.filter((x) => x !== id)
      : [...favRef.current, id];
    commitCollection();
  };

  const recordAntipodeDiscovery = useCallback(
    (fromId: string, toId: string) => {
      if (!findPeakById(fromId) || !findPeakById(toId)) return;
      if (validIds.size && (!validIds.has(fromId) || !validIds.has(toId)))
        return;
      const next = appendDiscovery(
        discoveriesRef.current,
        fromId,
        toId,
      );
      discoveriesRef.current = next;
      setDiscoveries(next);
      commitCollection();
    },
    [validIds],
  );

  const setView = (v: ViewMode) => {
    setViewState(v);
    prefsRef.current = { ...prefsRef.current, view: v };
    commitPrefs();
  };

  const setTab = (t: TabId) => {
    setTabState(t);
    prefsRef.current = { ...prefsRef.current, tab: t };
    commitPrefs();
    patchPeaksUiResume({ tab: t });
    if (t === "home") setNav({ screen: "home" });
  };

  const recentPeaks = useMemo(
    () =>
      recent
        .map((id) => indexMap.get(id))
        .filter((p): p is PeakIndexRow => Boolean(p))
        .map(indexToPeak),
    [recent, indexMap],
  );

  const favoritePeaks = useMemo(
    () =>
      favorites
        .map((id) => indexMap.get(id))
        .filter((p): p is PeakIndexRow => Boolean(p))
        .map(indexToPeak)
        .sort((a, b) => b.elevationM - a.elevationM),
    [favorites, indexMap],
  );

  const foundPeaks = useMemo(
    () =>
      found
        .map((id) => indexMap.get(id))
        .filter((p): p is PeakIndexRow => Boolean(p))
        .map(indexToPeak)
        .sort((a, b) => b.elevationM - a.elevationM),
    [found, indexMap],
  );

  const value: PeaksContextValue = {
    ready,
    storageTrouble,
    indexReady,
    foundCount: found.length,
    favCount: favorites.length,
    isFound,
    isFav,
    toggleFound,
    toggleFav,
    discoveries,
    recordAntipodeDiscovery,
    recentPeaks,
    favoritePeaks,
    foundPeaks,
    peakIndex,
    view,
    setView,
    tab,
    setTab,
    nav,
    setNav,
    toasts,
    toast,
  };

  return (
    <PeaksContext.Provider value={value}>{children}</PeaksContext.Provider>
  );
}

export function usePeaks() {
  const ctx = useContext(PeaksContext);
  if (!ctx) throw new Error("usePeaks must be used within a PeaksProvider");
  return ctx;
}
