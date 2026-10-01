"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { PEAK_DETAIL_PRODUCT_ID } from "@/lib/product-config";
import { syncOwnershipToServer } from "@/lib/fetch-account-ownership";
import {
  buildPurchaseDeed,
  buildRestoreSealDeed,
  deedFromUnknown,
  formatDeedDate,
  OWNERSHIP_STATE_KEY,
  readLocalDeed,
  writeLocalDeed,
  type OwnershipDeed,
} from "@/lib/peaks/ownership-deed";
import {
  isRestoreOwned,
  OWNERSHIP_DEED_SEALED_EVENT,
  TEST_PI_PRICE,
  UNLOCK_FALLBACK,
} from "@/lib/peaks/unlock-gate";
import { Button } from "@/components/peaks/ui";
import { PAYMENT_ENV } from "@/lib/payment-env";

function extractBlob(rec: unknown): Record<string, unknown> {
  if (!rec || typeof rec !== "object") return {};
  const maybe = rec as { blob?: unknown };
  const blob = "blob" in maybe ? maybe.blob : rec;
  if (!blob || typeof blob !== "object") return {};
  const inner = (blob as { blob?: unknown }).blob;
  if (inner && typeof inner === "object") return inner as Record<string, unknown>;
  return blob as Record<string, unknown>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <p className="shrink-0 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--pk-faint)]">
        {label}
      </p>
      <p className="pk-nums min-w-0 overflow-hidden break-all text-right text-[0.88rem] leading-snug text-[var(--pk-ink)] [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

export function OwnershipDeedBody({ deed }: { deed: OwnershipDeed }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--pk-amber)]/40 bg-[var(--pk-amber-soft)]/45 px-4 py-3">
        <p className="text-[0.88rem] leading-relaxed text-[var(--pk-ink)]">
          {PAYMENT_ENV.ownedIntro}
        </p>
        <p className="mt-2 text-[0.8rem] leading-relaxed text-[var(--pk-muted)]">
          {PAYMENT_ENV.credit}
        </p>
      </div>

      <div className="divide-y divide-[var(--pk-line-soft)]">
        <Row label="Status" value={PAYMENT_ENV.deedOwnedStatus} />
        <Row label="Paid" value={PAYMENT_ENV.deedPaidLabel(deed.priceInPi)} />
        <Row label="Owned since" value={formatDeedDate(deed.purchasedAt)} />
        <Row label="Sealed on device" value={formatDeedDate(deed.sealedAt)} />
        <Row label="Product" value={deed.productName} />
        <Row
          label="Payment ID"
          value={deed.paymentId ?? "Restored on Pi · id sealed after checkout"}
        />
        <Row
          label="Tx ID"
          value={deed.txid ?? "Restored on Pi · tx sealed after checkout"}
        />
        {deed.username ? (
          <Row label="Pi user" value={`@${deed.username}`} />
        ) : null}
      </div>
    </div>
  );
}

/** Always available: Sync to Redis, with Payment ID field (works after cache clear). */
function OwnershipSyncModal({
  deed,
  onClose,
  onSynced,
}: {
  deed: OwnershipDeed | null;
  onClose: () => void;
  onSynced: (deed: OwnershipDeed) => void;
}) {
  const { sdk } = usePiAuth();
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [paymentIdInput, setPaymentIdInput] = useState(
    () => deed?.paymentId?.trim() || "",
  );
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setPaymentIdInput(deed?.paymentId?.trim() || "");
  }, [deed?.paymentId]);

  const handleSyncToAccount = async () => {
    if (syncing) return;
    const paymentId = paymentIdInput.trim();
    if (!paymentId) {
      setSyncNote(
        "Payment ID를 입력하세요. (캐시 삭제 후에는 로컬에 ID가 없습니다. Pi 결제 내역의 Payment ID가 필요합니다.)",
      );
      return;
    }
    setSyncing(true);
    setSyncNote(null);
    try {
      const result = await syncOwnershipToServer(paymentId);
      if (!result.ok) {
        setSyncNote(result.error || "Server sync failed.");
        return;
      }
      if (!result.kvConfigured) {
        setSyncNote(
          "KV not configured on Vercel — cannot write ownership:peaks3141.",
        );
        return;
      }
      if (result.alreadyInKv || (result.wroteToKv && result.owned)) {
        const pid = result.paymentId || paymentId;
        const txid = result.txid || deed?.txid || "";
        const next = buildPurchaseDeed({
          productId: result.productId || deed?.productId || UNLOCK_FALLBACK.productId,
          productSlug: deed?.productSlug || UNLOCK_FALLBACK.productSlug,
          productName: deed?.productName || UNLOCK_FALLBACK.productName,
          priceInPi: deed?.priceInPi ?? TEST_PI_PRICE,
          paymentId: pid,
          txid,
          username: result.username,
        });
        writeLocalDeed(next);
        if (sdk) {
          try {
            await sdk.state.set(OWNERSHIP_STATE_KEY, { deed: next });
          } catch {
            /* local ok */
          }
        }
        onSynced(next);
        setSyncNote(
          result.alreadyInKv
            ? `Already on server: ownership:peaks3141:${result.uid ?? "…"}`
            : `Wrote ownership:peaks3141:${result.uid ?? "…"}`,
        );
        return;
      }
      if (!result.owned) {
        setSyncNote(
          "Pi did not confirm this Payment ID as a completed Peaks unlock for your account.",
        );
        return;
      }
      setSyncNote(
        "Verified owned, but Redis write failed — check KV env on project p.",
      );
    } finally {
      setSyncing(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/80 p-4 pk-fade-in sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--pk-line)] bg-[var(--pk-panel-solid)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.65)] md:max-w-lg"
      >
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--pk-forest)]">
          CODE ARCHE · ownership
        </p>
        <h2 className="font-display mt-2 text-[1.7rem] text-[var(--pk-ink)]">
          {deed ? "Peaks 3141 ownership proof" : "Sync Peaks ownership"}
        </h2>
        {deed ? (
          <div className="mt-4">
            <OwnershipDeedBody deed={deed} />
          </div>
        ) : (
          <p className="mt-3 text-[0.88rem] leading-relaxed text-[var(--pk-muted)]">
            이 기기 캐시에 구매 기록이 없습니다. Pi에서 완료된 Peaks 결제의
            Payment ID를 넣으면 서버(Redis)에 ownership:peaks3141 을 남깁니다.
          </p>
        )}

        <label className="mt-4 block">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--pk-faint)]">
            Payment ID
          </span>
          <input
            value={paymentIdInput}
            onChange={(e) => setPaymentIdInput(e.target.value)}
            placeholder="paste Pi payment id"
            className="pk-nums mt-1.5 w-full rounded-xl border border-[var(--pk-line)] bg-black/25 px-3 py-2.5 text-[0.9rem] text-[var(--pk-ink)] outline-none focus:border-[var(--pk-amber)]"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>

        {syncNote ? (
          <p className="mt-3 text-[0.8rem] leading-relaxed text-[var(--pk-amber)]">
            {syncNote}
          </p>
        ) : null}

        <Button
          className="mt-5 w-full"
          variant="primary"
          disabled={syncing}
          onClick={() => void handleSyncToAccount()}
        >
          {syncing ? "Syncing to account…" : "Sync ownership to account"}
        </Button>
        <p className="mt-2 text-center text-[0.72rem] leading-relaxed text-[var(--pk-faint)]">
          Pi 검증 후 Redis에 ownership:peaks3141 기록 (로컬 캐시만으로는 불가)
        </p>
        <Button className="mt-3 w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>,
    document.body,
  );
}

/** Quiet home-footer card — open proof only when tapped. */
export function OwnershipProofCard() {
  const { sdk, products, restoredPurchases, isAuthenticated } = usePiAuth();
  const [deed, setDeed] = useState<OwnershipDeed | null>(null);
  const [open, setOpen] = useState(false);

  const product = useMemo(
    () => products?.find((p) => p.id === PEAK_DETAIL_PRODUCT_ID) ?? null,
    [products],
  );

  const restoreOwned = useMemo(
    () =>
      isRestoreOwned(restoredPurchases, product, [
        deed?.productId,
        deed?.productSlug,
      ]),
    [deed?.productId, deed?.productSlug, product, restoredPurchases],
  );

  useEffect(() => {
    const sync = () => setDeed(readLocalDeed());
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener(OWNERSHIP_DEED_SEALED_EVENT, sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener(OWNERSHIP_DEED_SEALED_EVENT, sync);
    };
  }, [restoredPurchases, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      let next = readLocalDeed();

      if (!next && sdk) {
        try {
          const rec = await sdk.state.get(OWNERSHIP_STATE_KEY);
          const blob = extractBlob(rec);
          next = deedFromUnknown(blob.deed ?? blob);
          if (next) writeLocalDeed(next);
        } catch {
          /* ignore */
        }
      }

      if (!next && restoreOwned) {
        next = buildRestoreSealDeed({
          productId: product?.id ?? UNLOCK_FALLBACK.productId,
          productSlug: product?.slug ?? UNLOCK_FALLBACK.productSlug,
          productName: product?.name ?? UNLOCK_FALLBACK.productName,
          priceInPi: UNLOCK_FALLBACK.priceInPi,
        });
        writeLocalDeed(next);
        if (sdk) {
          try {
            await sdk.state.set(OWNERSHIP_STATE_KEY, { deed: next });
          } catch {
            /* local deed still stands for display */
          }
        }
      }

      if (!cancelled && next) setDeed(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, restoreOwned, product, sdk]);

  const owned = restoreOwned || Boolean(deed);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pk-press mt-8 w-full rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-panel)] px-4 py-3.5 text-left"
      >
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--pk-forest)]">
          Ownership proof
        </p>
        <p className="mt-1 text-[0.95rem] text-[var(--pk-ink)]">
          {owned
            ? "View / sync Peaks 3141 ownership"
            : "Sync ownership to account (Redis)"}
        </p>
        {deed ? (
          <p className="pk-nums mt-1 text-[0.8rem] text-[var(--pk-faint)]">
            {PAYMENT_ENV.deedPaidLabel(deed.priceInPi)} ·{" "}
            {formatDeedDate(deed.purchasedAt)}
          </p>
        ) : (
          <p className="mt-1 text-[0.8rem] text-[var(--pk-faint)]">
            Tap to enter Payment ID and write ownership:peaks3141
          </p>
        )}
      </button>
      {open ? (
        <OwnershipSyncModal
          deed={deed}
          onClose={() => setOpen(false)}
          onSynced={(next) => setDeed(next)}
        />
      ) : null}
    </>
  );
}

/** Call after a successful makePurchase to seal payment evidence. */
export async function sealPurchaseDeed(args: {
  productId: string;
  productSlug: string;
  productName: string;
  priceInPi: number;
  paymentId: string;
  txid: string;
  sdk: {
    state: { set: (key: string, blob: Record<string, unknown>) => Promise<void> };
  } | null;
  username?: string | null;
}): Promise<OwnershipDeed> {
  const deed = buildPurchaseDeed(args);
  writeLocalDeed(deed);
  if (args.sdk) {
    try {
      await args.sdk.state.set(OWNERSHIP_STATE_KEY, { deed });
    } catch {
      /* local remains */
    }
  }
  return deed;
}
