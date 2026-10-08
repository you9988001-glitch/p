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
import { PEAK_DETAIL_PRODUCT_ID } from "@/lib/product-config";
import { sealPurchaseDeed } from "@/components/peaks/ownership-deed-card";
import {
  buildRestoreSealDeed,
  readLocalDeed,
  writeLocalDeed,
  type OwnershipDeed,
} from "@/lib/peaks/ownership-deed";
import {
  hasUnlockAccess,
  isRestoreOwned,
  OWNERSHIP_DEED_SEALED_EVENT,
  purchaseQtyForUnlock,
  TEST_PI_PRICE,
  UNLOCK_FALLBACK,
} from "@/lib/peaks/unlock-gate";
import { PAYMENT_ENV, catalogPriceMatchesUnlock } from "@/lib/payment-env";
import { resolveUnlockProduct } from "@/lib/resolve-unlock-product";
import { isPaywallPreviewOnly } from "@/lib/paywall-preview-only";

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

  productPrice: number | null;
  productCatalogIssue: string | null;
  purchasesReady: boolean;
  isUnlocked: boolean;
  purchaseUnlock: () => Promise<OwnershipDeed | null>;
  refreshUnlockStatus: () => Promise<void>;
}

const PeaksContext = createContext<PeaksContextValue | undefined>(undefined);

export function PeaksProvider({ children }: { children: ReactNode }) {
  const { sdk, isAuthenticated, products, restoredPurchases, refreshPurchases } =
    usePiAuth();

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

  const unlockProduct = useMemo(
    () => resolveUnlockProduct(products, PEAK_DETAIL_PRODUCT_ID),
    [products],
  );

  const [localDeed, setLocalDeed] = useState<OwnershipDeed | null>(() =>
    typeof window === "undefined" ? null : readLocalDeed(),
  );
  const [purchaseConfirmed, setPurchaseConfirmed] = useState(false);

  const purchasesReady = restoredPurchases !== null;

  const unlockGate = useMemo(
    () =>
      hasUnlockAccess(restoredPurchases, unlockProduct, localDeed, [
        localDeed?.productId,
        localDeed?.productSlug,
      ]),
    [localDeed, restoredPurchases, unlockProduct],
  );

  const isUnlocked =
    (unlockGate || purchaseConfirmed) && !isPaywallPreviewOnly();

  useEffect(() => {
    const syncDeed = () => setLocalDeed(readLocalDeed());
    syncDeed();
    window.addEventListener(OWNERSHIP_DEED_SEALED_EVENT, syncDeed);
    return () =>
      window.removeEventListener(OWNERSHIP_DEED_SEALED_EVENT, syncDeed);
  }, []);

  useEffect(() => {
    if (unlockGate) setPurchaseConfirmed(true);
  }, [unlockGate]);

  const restoreOwned = useMemo(
    () =>
      isRestoreOwned(restoredPurchases, unlockProduct, [
        localDeed?.productId,
        localDeed?.productSlug,
      ]),
    [localDeed?.productId, localDeed?.productSlug, restoredPurchases, unlockProduct],
  );

  useEffect(() => {
    if (!restoreOwned || localDeed) return;
    const next = buildRestoreSealDeed({
      productId: unlockProduct?.id ?? UNLOCK_FALLBACK.productId,
      productSlug: unlockProduct?.slug ?? UNLOCK_FALLBACK.productSlug,
      productName: unlockProduct?.name ?? UNLOCK_FALLBACK.productName,
      priceInPi: TEST_PI_PRICE,
    });
    writeLocalDeed(next);
    setLocalDeed(next);
  }, [localDeed, restoreOwned, unlockProduct]);

  const refreshUnlockStatus = useCallback(async () => {
    await refreshPurchases();
    setLocalDeed(readLocalDeed());
  }, [refreshPurchases]);

  const purchaseUnlock = useCallback(async (): Promise<OwnershipDeed | null> => {
    if (!sdk) {
      toast("Peaks3141 is not available right now.");
      return null;
    }

    const productMeta = unlockProduct ?? {
      id: UNLOCK_FALLBACK.productId,
      slug: UNLOCK_FALLBACK.productSlug,
      name: UNLOCK_FALLBACK.productName,
      price_in_pi: UNLOCK_FALLBACK.priceInPi,
    };

    const resolveOwnedDeed = async (): Promise<OwnershipDeed | null> => {
      const existing = readLocalDeed();
      if (
        hasUnlockAccess(restoredPurchases, unlockProduct, existing, [
          existing?.productId,
          existing?.productSlug,
          productMeta.id,
          productMeta.slug,
        ])
      ) {
        setLocalDeed(existing);
        setPurchaseConfirmed(true);
        return existing;
      }

      await refreshPurchases();
      let qty = 0;
      try {
        const { purchases } = await sdk.state.restore();
        qty = purchaseQtyForUnlock(purchases, unlockProduct, [
          localDeed?.productId,
          localDeed?.productSlug,
          productMeta.id,
          productMeta.slug,
        ]);
      } catch {
        /* restore failed */
      }
      if (qty <= 0) return null;

      const deed =
        existing ??
        buildRestoreSealDeed({
          productId: productMeta.id,
          productSlug: productMeta.slug,
          productName: productMeta.name,
          priceInPi: TEST_PI_PRICE,
        });
      if (!existing) writeLocalDeed(deed);
      setLocalDeed(deed);
      setPurchaseConfirmed(true);
      return deed;
    };

    const already = await resolveOwnedDeed();
    if (already) {
      toast("Already unlocked on this Pi account.");
      return already;
    }

    if (!unlockProduct) {
      toast("Peaks3141 is not available right now.");
      return null;
    }
    if (!catalogPriceMatchesUnlock(unlockProduct.price_in_pi)) {
      toast(PAYMENT_ENV.catalogPriceMismatch(unlockProduct.price_in_pi));
      return null;
    }

    try {
      const result = await sdk.makePurchase(unlockProduct.slug);
      if (!result?.ok) {
        const recovered = await resolveOwnedDeed();
        if (recovered) {
          toast("Already unlocked on this Pi account.");
          return recovered;
        }
        toast("Purchase did not complete. Please try again.");
        return null;
      }
      const deed = await sealPurchaseDeed({
        productId: unlockProduct.id,
        productSlug: unlockProduct.slug,
        productName: unlockProduct.name,
        priceInPi: TEST_PI_PRICE,
        paymentId: result.paymentId,
        txid: result.txid,
        sdk,
      });
      setLocalDeed(deed);
      setPurchaseConfirmed(true);
      for (let i = 0; i < 4; i += 1) {
        await refreshPurchases();
        try {
          const { purchases } = await sdk.state.restore();
          if (
            purchaseQtyForUnlock(purchases, unlockProduct, [
              deed.productId,
              deed.productSlug,
            ]) > 0
          ) {
            break;
          }
        } catch {
          /* retry */
        }
        await new Promise((r) => window.setTimeout(r, 700));
      }
      await refreshPurchases();
      toast("Purchase sealed — collection proof saved");
      return deed;
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code !== "purchase_cancelled" && code !== "product_not_found") {
        const recovered = await resolveOwnedDeed();
        if (recovered) {
          toast("Already unlocked on this Pi account.");
          return recovered;
        }
      }
      toast(
        code === "purchase_cancelled"
          ? "Purchase cancelled"
          : code === "product_not_found"
            ? "This product is unavailable in App Studio"
            : "Purchase could not be completed",
      );
      return null;
    }
  }, [
    localDeed?.productId,
    localDeed?.productSlug,
    refreshPurchases,
    restoredPurchases,
    sdk,
    toast,
    unlockProduct,
  ]);

  const productCatalogIssue = useMemo(() => {
    if (!unlockProduct) return null;
    if (!catalogPriceMatchesUnlock(unlockProduct.price_in_pi)) {
      return PAYMENT_ENV.catalogPriceMismatch(unlockProduct.price_in_pi);
    }
    return null;
  }, [unlockProduct]);

  const productPrice =
    unlockProduct && !productCatalogIssue ? TEST_PI_PRICE : null;

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
    productPrice,
    productCatalogIssue,
    purchasesReady,
    isUnlocked,
    purchaseUnlock,
    refreshUnlockStatus,
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
