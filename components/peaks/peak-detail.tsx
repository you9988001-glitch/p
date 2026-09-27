"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePeaks } from "@/contexts/peaks-context";
import { usePiAuth } from "@/contexts/pi-auth-context";
import type { LivePeakTime } from "@/lib/peaks/live-time";
import { LiveTimeCard } from "@/components/peaks/live-time-card";
import { AntipodeResultSheet } from "@/components/peaks/antipode-result-sheet";
import type { AntipodeTapResult } from "@/lib/peaks/antipode-tap";
import { PEAK_DETAIL_PRODUCT_ID } from "@/lib/product-config";
import {
  MAINNET_UNLOCK_PI,
  PAYMENT_ENV,
  catalogPriceMatchesUnlock,
} from "@/lib/payment-env";
import {
  paywallAuthHint,
  paywallShowRetry,
} from "@/lib/paywall-auth-hint";
import { resolveUnlockProduct } from "@/lib/resolve-unlock-product";
import {
  bandOf,
  continentName,
  getPeakById,
  flagEmoji,
  flagUrl,
  formatElevation,
  type Peak,
} from "@/lib/peaks/data";
import {
  Button,
  IconBack,
  IconCheck,
  IconCheckCircle,
  IconGlobe,
  IconLayers,
  IconStar,
  IconStarFilled,
  Pill,
} from "@/components/peaks/ui";
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

function FactRow({ text }: { text: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-[var(--pk-moss)]" />
      <span className="text-[1.9rem] leading-relaxed text-[var(--pk-ink)]">
        {text}
      </span>
    </li>
  );
}

function MetaRow({
  icon,
  label,
  caption,
  value,
}: {
  icon: ReactNode;
  label: string;
  caption?: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pk-forest-soft)] text-[var(--pk-forest-deep)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[1.4rem] font-semibold uppercase tracking-wide text-[var(--pk-faint)]">
          {label}
        </p>
        {caption ? (
          <p className="mt-0.5 text-[1.44rem] leading-snug text-[var(--pk-muted)]">
            {caption}
          </p>
        ) : null}
        <p className="mt-1 text-[1.9rem] font-medium leading-snug text-[var(--pk-ink)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function displayRange(range: string | null | undefined): string {
  if (!range || !String(range).trim()) return "Not confirmed";
  const r = String(range).trim();
  if (["MT", "PK", "HLL", "VLC", "PKS"].includes(r.toUpperCase())) {
    return "Not confirmed";
  }
  return r;
}

function displayProminence(m: number | null | undefined): string {
  if (m == null || !Number.isFinite(m)) return "Not confirmed";
  return `${formatElevation(m)} of prominence`;
}

function displayFormation(ft: string | null | undefined): string {
  if (!ft || !String(ft).trim()) return "Not confirmed";
  const map: Record<string, string> = {
    volcanic: "Volcanic",
    fold: "Fold (orogenic)",
    "fault-block": "Fault-block",
    dome: "Dome",
    other: "Other",
  };
  return map[ft] ?? ft;
}

function displayNaturalFeatures(nf: string | null | undefined): string {
  if (!nf || !String(nf).trim()) return "Not confirmed";
  return String(nf).trim();
}

function PeakPaywall({
  onUnlocked,
  onPurchaseSealed,
}: {
  onUnlocked: () => void;
  onPurchaseSealed: () => void;
}) {
  const {
    sdk,
    products,
    restoredPurchases,
    refreshPurchases,
    isAuthenticated,
    hasError,
    authMessage,
    reinitialize,
  } = usePiAuth();
  const { toast } = usePeaks();
  const [busy, setBusy] = useState(false);
  const [localDeed, setLocalDeed] = useState<OwnershipDeed | null>(null);
  const [checkTimedOut, setCheckTimedOut] = useState(false);

  const product = useMemo(
    () => resolveUnlockProduct(products, PEAK_DETAIL_PRODUCT_ID),
    [products],
  );
  const productsLoaded = products !== null;
  const authHint = paywallAuthHint({
    isAuthenticated,
    hasError,
    authMessage,
    productsLoaded,
  });
  const showAuthRetry = paywallShowRetry({
    isAuthenticated,
    hasError,
    productsLoaded,
  });

  const catalogPriceOk =
    product != null && catalogPriceMatchesUnlock(product.price_in_pi);
  /** Show 3.141 π only when Portal catalog matches (checkout uses catalog price). */
  const productPrice = catalogPriceOk ? MAINNET_UNLOCK_PI : null;

  useEffect(() => {
    setLocalDeed(readLocalDeed());
  }, []);

  useEffect(() => {
    void refreshPurchases();
  }, [refreshPurchases]);

  useEffect(() => {
    if (restoredPurchases !== null) {
      setCheckTimedOut(false);
      return;
    }
    const t = window.setTimeout(() => setCheckTimedOut(true), 4000);
    return () => window.clearTimeout(t);
  }, [restoredPurchases]);

  const purchasesReady =
    restoredPurchases !== null || checkTimedOut || hasError;

  const restoreOwned = useMemo(
    () =>
      hasUnlockAccess(restoredPurchases, product, localDeed, [
        localDeed?.productId,
        localDeed?.productSlug,
      ]),
    [localDeed, product, restoredPurchases],
  );

  const owned = restoreOwned;

  useEffect(() => {
    if (owned) onUnlocked();
  }, [owned, onUnlocked]);

  useEffect(() => {
    if (!restoreOwned || localDeed) return;
    const next = buildRestoreSealDeed({
      productId: product?.id ?? UNLOCK_FALLBACK.productId,
      productSlug: product?.slug ?? UNLOCK_FALLBACK.productSlug,
      productName: product?.name ?? UNLOCK_FALLBACK.productName,
      priceInPi: TEST_PI_PRICE,
    });
    writeLocalDeed(next);
    setLocalDeed(next);
  }, [localDeed, product, restoreOwned]);

  const resolveOwnedDeed = async (): Promise<OwnershipDeed | null> => {
    if (!sdk) return null;
    await refreshPurchases();
    let qty = 0;
    try {
      const { purchases } = await sdk.state.restore();
      qty = purchaseQtyForUnlock(purchases, product, [
        localDeed?.productId,
        localDeed?.productSlug,
      ]);
    } catch {
      /* restore failed — do not treat local deed as ownership */
    }
    if (qty <= 0) return null;
    const existing = readLocalDeed();
    const deed =
      existing ??
      buildRestoreSealDeed({
        productId: product?.id ?? UNLOCK_FALLBACK.productId,
        productSlug: product?.slug ?? UNLOCK_FALLBACK.productSlug,
        productName: product?.name ?? UNLOCK_FALLBACK.productName,
        priceInPi: TEST_PI_PRICE,
      });
    if (!existing) writeLocalDeed(deed);
    setLocalDeed(deed);
    return deed;
  };

  const handlePay = async () => {
    if (!sdk || !product || !catalogPriceOk || busy || owned) return;
    setBusy(true);
    document.body.classList.add("pk-pi-checkout");
    try {
      const already = await resolveOwnedDeed();
      if (already) {
        onPurchaseSealed();
        toast("Already unlocked on this Pi account.");
        onUnlocked();
        return;
      }

      const result = await sdk.makePurchase(product.slug);
      if (result.ok) {
        const deed = await sealPurchaseDeed({
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          priceInPi: TEST_PI_PRICE,
          paymentId: result.paymentId,
          txid: result.txid,
          sdk,
        });
        setLocalDeed(deed);
        onPurchaseSealed();
        onUnlocked();
        // Restore can lag behind checkout — retry so gates + ownership card sync.
        for (let i = 0; i < 4; i += 1) {
          await refreshPurchases();
          try {
            const { purchases } = await sdk.state.restore();
            if (
              purchaseQtyForUnlock(purchases, product, [
                deed.productId,
                deed.productSlug,
              ]) > 0
            ) {
              break;
            }
          } catch {
            /* keep retrying */
          }
          await new Promise((r) => window.setTimeout(r, 700));
        }
        await refreshPurchases();
        toast("Purchase sealed — ownership proof saved");
        return;
      }

      const recovered = await resolveOwnedDeed();
      if (recovered) {
        onPurchaseSealed();
        toast("Already unlocked on this Pi account.");
        onUnlocked();
        return;
      }
      toast("Purchase did not complete. Please try again.");
    } catch (error) {
      const code = (error as { code?: string; name?: string }).code;
      if (code !== "purchase_cancelled" && code !== "product_not_found") {
        const recovered = await resolveOwnedDeed();
        if (recovered) {
          onPurchaseSealed();
          toast("Already unlocked on this Pi account.");
          onUnlocked();
          return;
        }
      }
      if (code === "purchase_cancelled") {
        toast("Purchase cancelled");
      } else if (code === "product_not_found") {
        toast("This product is unavailable in App Studio");
      } else {
        toast("Purchase could not be completed");
      }
    } finally {
      document.body.classList.remove("pk-pi-checkout");
      setBusy(false);
    }
  };

  const checking = !purchasesReady && !owned;
  const appName = "Peaks 3141";

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-10 pt-2 md:max-w-2xl">
      <div className="rounded-3xl border border-[var(--pk-line)] bg-[var(--pk-panel-solid)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
        <div className="rounded-2xl border border-[var(--pk-amber)]/40 bg-[var(--pk-amber-soft)]/45 px-4 py-3">
          <p className="text-[0.88rem] leading-relaxed text-[var(--pk-ink)]">
            {PAYMENT_ENV.intro}
          </p>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-[var(--pk-muted)]">
            {PAYMENT_ENV.credit}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--pk-forest)]">
            Pi payment
          </p>
          <span className="rounded-full bg-[var(--pk-amber-soft)] px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-[var(--pk-amber)]">
            {PAYMENT_ENV.badge}
          </span>
        </div>

        <h2 className="font-display mt-2 text-[1.85rem] leading-tight text-[var(--pk-ink)]">
          {checking
            ? PAYMENT_ENV.checkingTitle
            : owned
              ? PAYMENT_ENV.unlockedTitle
              : PAYMENT_ENV.payTitle}
        </h2>
        <p className="mt-2 text-[0.92rem] leading-relaxed text-[var(--pk-muted)]">
          {checking
            ? PAYMENT_ENV.checkingBody
            : owned
              ? PAYMENT_ENV.unlockedBody(appName)
              : PAYMENT_ENV.testNote}
        </p>

        {!checking && !owned ? (
          <>
            <div className="mt-5 rounded-2xl border border-[var(--pk-line)] bg-black/25 px-4 py-3">
              {!isAuthenticated ? (
                <p className="text-sm text-[var(--pk-amber)]">{authHint}</p>
              ) : product && !catalogPriceOk ? (
                <p className="text-sm text-[var(--pk-amber)]">
                  {PAYMENT_ENV.catalogPriceMismatch(product.price_in_pi)}
                </p>
              ) : productPrice === null ? (
                <p className="text-sm text-[var(--pk-amber)]">
                  {product
                    ? PAYMENT_ENV.loadingProduct
                    : PAYMENT_ENV.noUnlockProduct}
                </p>
              ) : (
                <>
                  <p className="font-display text-lg text-[var(--pk-ink)]">
                    {appName}
                  </p>
                  <p className="pk-nums mt-3 text-xl font-semibold text-[var(--pk-forest-deep)]">
                    {PAYMENT_ENV.priceLabel(productPrice)}
                  </p>
                </>
              )}
            </div>

            {showAuthRetry ? (
              <Button
                onClick={() => void reinitialize()}
                variant="primary"
                className="mt-5 w-full py-3.5"
                disabled={busy}
              >
                Try Pi login again
              </Button>
            ) : (
              <Button
                onClick={handlePay}
                variant="primary"
                className="mt-5 w-full py-3.5"
                disabled={productPrice === null || !sdk || busy}
              >
                {busy
                  ? PAYMENT_ENV.busyLabel
                  : productPrice !== null
                    ? PAYMENT_ENV.buttonLabel(productPrice)
                    : PAYMENT_ENV.unavailable}
              </Button>
            )}
            <p className="mt-3 text-center text-[0.75rem] leading-relaxed text-[var(--pk-faint)]">
              {PAYMENT_ENV.footer}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function PeakDetail({
  peakId,
  onClose,
  onOpenCuratorNote,
  onOpenDiscoveries,
  onOpenPeakId,
}: {
  peakId: string;
  onClose: () => void;
  onOpenCuratorNote: () => void;
  onOpenDiscoveries: () => void;
  onOpenPeakId: (id: string) => void;
}) {
  const {
    isFound,
    isFav,
    toggleFound,
    toggleFav,
    toast,
    setNav,
    setTab,
    recordAntipodeDiscovery,
  } = usePeaks();
  const { products, restoredPurchases, refreshPurchases } = usePiAuth();
  const peak = getPeakById(peakId);
  const [liveTime, setLiveTime] = useState<LivePeakTime | null>(null);
  const [oppositeLive, setOppositeLive] = useState<LivePeakTime | null>(null);
  const [antipodeSheet, setAntipodeSheet] = useState<AntipodeTapResult | null>(
    null,
  );
  useEffect(() => {
    const code = peak?.countryCode ?? null;
    const lat = peak?.lat ?? null;
    const lon = peak?.lon ?? null;
    if (!code) {
      setLiveTime(null);
      setOppositeLive(null);
      return;
    }
    let cancelled = false;
    const update = async () => {
      try {
        const { getLivePeakTime, getAntipodeLiveTime } = await import(
          "@/lib/peaks/live-time"
        );
        const next = await getLivePeakTime(code, undefined, lat);
        const opp = await getAntipodeLiveTime(code, lat, lon);
        if (!cancelled) {
          setLiveTime(next);
          setOppositeLive(opp);
        }
      } catch {
        if (!cancelled) {
          setLiveTime(null);
          setOppositeLive({
            timeZone: "UTC",
            localTime: "--:--",
            hemisphere: "Northern",
            season: "Spring",
            tapResult: { kind: "location-unavailable" },
          });
        }
      }
    };
    void update();
    const id = setInterval(() => void update(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [peakId, peak?.countryCode, peak?.lat, peak?.lon]);
  const [unlocked, setUnlocked] = useState(false);
  const [localDeed, setLocalDeed] = useState<OwnershipDeed | null>(null);
  const product = useMemo(
    () => products?.find((p) => p.id === PEAK_DETAIL_PRODUCT_ID) ?? null,
    [products],
  );

  useEffect(() => {
    setLocalDeed(readLocalDeed());
  }, []);

  useEffect(() => {
    void refreshPurchases();
  }, [refreshPurchases, peakId]);

  const alreadyOwned = useMemo(
    () =>
      hasUnlockAccess(restoredPurchases, product, localDeed, [
        localDeed?.productId,
        localDeed?.productSlug,
      ]),
    [localDeed, product, restoredPurchases],
  );

  const restoreOwned = useMemo(
    () =>
      isRestoreOwned(restoredPurchases, product, [
        localDeed?.productId,
        localDeed?.productSlug,
      ]),
    [localDeed?.productId, localDeed?.productSlug, product, restoredPurchases],
  );

  useEffect(() => {
    if (alreadyOwned) setUnlocked(true);
  }, [alreadyOwned]);

  useEffect(() => {
    const syncDeed = () => setLocalDeed(readLocalDeed());
    window.addEventListener(OWNERSHIP_DEED_SEALED_EVENT, syncDeed);
    return () =>
      window.removeEventListener(OWNERSHIP_DEED_SEALED_EVENT, syncDeed);
  }, []);

  useEffect(() => {
    if (!restoreOwned || localDeed) return;
    const next = buildRestoreSealDeed({
      productId: product?.id ?? UNLOCK_FALLBACK.productId,
      productSlug: product?.slug ?? UNLOCK_FALLBACK.productSlug,
      productName: product?.name ?? UNLOCK_FALLBACK.productName,
      priceInPi: TEST_PI_PRICE,
    });
    writeLocalDeed(next);
    setLocalDeed(next);
  }, [localDeed, product, restoreOwned]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!peak) {
    return (
      <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-4 bg-[var(--pk-bg)] px-6 text-center">
        <p className="text-[var(--pk-muted)]">Peak not found in catalog.</p>
        <button
          type="button"
          onClick={onClose}
          className="pk-press rounded-full border border-[var(--pk-line)] px-4 py-2 text-sm font-semibold text-[var(--pk-forest)]"
        >
          ← Back
        </button>
      </div>
    );
  }

  const found = isFound(peak.id);
  const fav = isFav(peak.id);
  const showContent = unlocked || alreadyOwned;

  const handleFound = () => {
    toggleFound(peak.id);
    toast(found ? "Removed from your finds" : `${peak.name} marked as found`);
  };

  const handleFavorite = () => {
    toggleFav(peak.id);
    toast(fav ? "Removed from favorites" : `Added ${peak.name} to favorites`);
  };

  /* Locked: payment only — no peak name / art / notes. */
  if (!showContent) {
    return (
      <div className="fixed inset-0 z-[120] flex flex-col bg-[var(--pk-bg)] pk-fade-in">
        <div className="pk-safe-top flex items-center justify-between px-3 pt-3">
          <button
            onClick={onClose}
            aria-label="Back"
            className="pk-press inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--pk-ink)] hover:bg-[var(--pk-panel-2)]"
          >
            <IconBack className="h-5 w-5" />
          </button>
          <span className="h-10 w-10" />
        </div>
        <h1 className="sr-only">Payment</h1>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PeakPaywall
            onUnlocked={() => setUnlocked(true)}
            onPurchaseSealed={() => setUnlocked(true)}
          />
        </div>
      </div>
    );
  }

  const flagSrc = flagUrl(peak.countryCode, 80);

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[var(--pk-bg)] pk-fade-in">
      <div className="pk-safe-top flex shrink-0 items-center justify-between px-3 pt-3">
        <button
          onClick={onClose}
          aria-label="Back"
          className="pk-press inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--pk-ink)] hover:bg-[var(--pk-panel-2)]"
        >
          <IconBack className="h-5 w-5" />
        </button>
        <span className="h-10 w-10" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md px-5 pb-6 pt-2 md:max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--pk-line)] bg-black/30 text-xl">
              {flagSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={flagSrc}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span aria-hidden>{flagEmoji(peak.countryCode)}</span>
              )}
            </span>
            <p className="min-w-0 text-[0.95rem] font-semibold leading-snug text-[var(--pk-ink)]">
              {peak.country}
            </p>
          </div>

          <h1 className="mt-4 font-display text-[2rem] leading-[1.1] text-[var(--pk-ink)]">
            {peak.name}
          </h1>
          <p className="mt-2 pk-nums text-lg font-semibold text-[var(--pk-forest-deep)]">
            {formatElevation(peak.elevationM)}
          </p>

          {peak.summary ? (
            <p className="mt-3 text-[1.9rem] leading-relaxed text-[var(--pk-muted)]">
              {peak.summary}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Pill tone="forest">{continentName(peak.continent)}</Pill>
            <Pill tone="sky">{bandOf(peak.elevationM).label}</Pill>
            <Pill tone="moss">Catalog unlocked</Pill>
            {found && (
              <Pill tone="moss">
                <IconCheck className="h-3.5 w-3.5" />
                Found
              </Pill>
            )}
          </div>

          <div className="mt-5 divide-y divide-[var(--pk-line-soft)] rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-panel)] px-4">
            <MetaRow
              icon={<IconLayers className="h-4.5 w-4.5" />}
              label="Type"
              value={displayRange(peak.range)}
            />
            <MetaRow
              icon={<IconGlobe className="h-4.5 w-4.5" />}
              label="Region"
              value={continentName(peak.continent)}
            />
            <MetaRow
              icon={<IconLayers className="h-4.5 w-4.5" />}
              label="Prominence"
              caption="How independently a peak rises above its surroundings."
              value={displayProminence(peak.prominenceM)}
            />
            <MetaRow
              icon={<IconLayers className="h-4.5 w-4.5" />}
              label="Formation type"
              caption="How the mountain was geologically shaped — by volcanic activity, folding, or other forces."
              value={displayFormation(peak.formationType)}
            />
            <MetaRow
              icon={<IconGlobe className="h-4.5 w-4.5" />}
              label="Natural features"
              caption="Snow, glacier presence, and the climate at this elevation."
              value={displayNaturalFeatures(peak.naturalFeatures)}
            />
          </div>

          <div id="field-notes" className="mt-6 scroll-mt-24">
            <p className="text-[1.4rem] font-bold uppercase tracking-[0.16em] text-[var(--pk-faint)]">
              Field notes
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {peak.facts.map((f, i) => (
                <FactRow key={i} text={f} />
              ))}
            </ul>
          </div>

          {liveTime || oppositeLive ? (
            <div className="mt-14 scroll-mt-24 flex flex-col">
              {liveTime ? (
                <LiveTimeCard
                  inPair
                  live={liveTime}
                  kicker={"Right now, in this peak's homeland"}
                />
              ) : (
                <p className="rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-panel)] px-4 py-3 text-[0.75rem] text-[var(--pk-muted)]">
                  Local time unavailable — homeland location data missing.
                </p>
              )}
              {oppositeLive ? (
                <div className={`${liveTime ? "mt-5" : ""} flex flex-col gap-2`}>
                  <p className="text-center text-[0.62rem] font-bold uppercase tracking-[0.2em] text-orange-400">
                    <span
                      className="mr-1.5 inline-block text-[1.24rem] leading-none"
                      aria-hidden
                    >
                      🌍
                    </span>
                    Same moment on Earth — opposite hemisphere
                  </p>
                  <LiveTimeCard
                    inPair
                    contrast
                    live={oppositeLive}
                    kicker="Right now, at this place"
                    onAntipodeTap={(tap) => {
                      if (tap.kind === "open-detail") {
                        recordAntipodeDiscovery(peakId, tap.peakId);
                      }
                      setAntipodeSheet(tap);
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <div
            id="sources"
            className={`${liveTime || oppositeLive ? "mt-12" : "mt-14"} scroll-mt-24 pb-2`}
          >
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--pk-faint)]">
              Sources
            </p>
            <div className="mt-3 space-y-2 text-[0.88rem] leading-relaxed text-[var(--pk-muted)]">
              <p>
                This catalog exists because the Curator believes no mountain
                should go unnamed for being unfamous. 3141 in tribute to π,
                spanning 250 countries and territories — each one checked to be
                real.
              </p>
              <p>
                Elevation, coordinates, and country: compiled from public
                geographic databases.
              </p>
              <p>
                Mountain range, prominence, formation type, and natural
                features: researched and calculated in collaboration with
                Cursor Agent and Claude.
              </p>
              <p>
                Local time and season: calculated from each peak&apos;s
                verified country using a maintained timezone dataset (same
                approach as Voice 3141). For countries with many time zones,
                one representative zone is used. Sunrise and sunset at the
                summit will be added in a later update.
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onOpenCuratorNote}
                className="pk-press min-w-0 flex-1 rounded-full border border-[var(--pk-line)] bg-[var(--pk-panel)] px-2 py-1.5 text-[0.72rem] font-semibold leading-tight text-[var(--pk-forest)] sm:text-[0.78rem]"
              >
                Curator&apos;s note
              </button>
              <button
                type="button"
                onClick={onOpenDiscoveries}
                className="pk-press min-w-0 flex-1 rounded-full border border-[var(--pk-line)] bg-[var(--pk-panel)] px-2 py-1.5 text-[0.72rem] font-semibold leading-tight text-[var(--pk-forest)] sm:text-[0.78rem]"
              >
                Discoveries
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setNav({ screen: "home" });
                }}
                className="pk-press min-w-0 flex-1 rounded-full border border-[var(--pk-line)] bg-[var(--pk-panel)] px-2 py-1.5 text-[0.72rem] font-semibold leading-tight text-[var(--pk-forest)] sm:text-[0.78rem]"
              >
                Regions
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pk-safe-bottom shrink-0 border-t border-[var(--pk-line)] bg-[rgba(20,8,36,0.92)] px-5 pt-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md gap-2 md:max-w-2xl">
          <Button
            onClick={handleFound}
            variant={found ? "outline" : "primary"}
            className="min-w-0 flex-1 py-3.5"
            aria-pressed={found}
          >
            {found ? (
              <IconCheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <IconFlagInline />
            )}
            <span className="truncate">Mark</span>
          </Button>
          <Button
            onClick={handleFavorite}
            variant={fav ? "outline" : "primary"}
            className="min-w-0 flex-1 py-3.5"
            aria-pressed={fav}
          >
            {fav ? (
              <IconStarFilled className="h-5 w-5 shrink-0" />
            ) : (
              <IconStar className="h-5 w-5 shrink-0" />
            )}
            <span className="truncate">Favorite</span>
          </Button>
        </div>
      </div>
      {antipodeSheet ? (
        <AntipodeResultSheet
          fromId={peakId}
          tap={antipodeSheet}
          onClose={() => setAntipodeSheet(null)}
        />
      ) : null}
    </div>
  );
}

function IconFlagInline() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M6 21V4M6 5h10l-1.5 3L16 11H6" />
    </svg>
  );
}
