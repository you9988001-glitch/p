/** Local + Pi-state ownership deed for Peaks 3141 one-time unlock. */

import { PAYMENT_ENV } from "@/lib/payment-env";
import { notifyDeedSealed } from "@/lib/peaks/unlock-gate";

export const OWNERSHIP_LOCAL_KEY = "peaks3141.ownership.deed.v1";
export const OWNERSHIP_STATE_KEY = "peaks3141.ownership";

export type OwnershipDeed = {
  productId: string;
  productSlug: string;
  productName: string;
  priceInPi: number;
  currency: "π";
  paymentId: string | null;
  txid: string | null;
  /** When the Pi purchase completed (preferred). */
  purchasedAt: string;
  /** When this device sealed the deed into storage. */
  sealedAt: string;
  source: "purchase" | "restore_seal";
  holderNote: string;
  username: string | null;
};

export function formatDeedDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  } catch {
    return iso;
  }
}

export function readLocalDeed(): OwnershipDeed | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(OWNERSHIP_LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OwnershipDeed;
    if (!parsed?.productSlug || !parsed?.purchasedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLocalDeed(deed: OwnershipDeed): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OWNERSHIP_LOCAL_KEY, JSON.stringify(deed));
  notifyDeedSealed();
}

export function buildPurchaseDeed(input: {
  productId: string;
  productSlug: string;
  productName: string;
  priceInPi: number;
  paymentId: string;
  txid: string;
  username?: string | null;
}): OwnershipDeed {
  const now = new Date().toISOString();
  return {
    productId: input.productId,
    productSlug: input.productSlug,
    productName: input.productName,
    priceInPi: input.priceInPi,
    currency: "π",
    paymentId: input.paymentId,
    txid: input.txid,
    purchasedAt: now,
    sealedAt: now,
    source: "purchase",
    holderNote: `${PAYMENT_ENV.ownedIntro}\n\n${PAYMENT_ENV.credit}`,
    username: input.username ?? null,
  };
}

export function buildRestoreSealDeed(input: {
  productId: string;
  productSlug: string;
  productName: string;
  priceInPi: number;
  username?: string | null;
}): OwnershipDeed {
  const now = new Date().toISOString();
  return {
    productId: input.productId,
    productSlug: input.productSlug,
    productName: input.productName,
    priceInPi: input.priceInPi,
    currency: "π",
    paymentId: null,
    txid: null,
    purchasedAt: now,
    sealedAt: now,
    source: "restore_seal",
    holderNote: `${PAYMENT_ENV.ownedIntro}\n\n${PAYMENT_ENV.credit}`,
    username: input.username ?? null,
  };
}

export function deedFromUnknown(raw: unknown): OwnershipDeed | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.productSlug !== "string" || typeof o.purchasedAt !== "string") {
    return null;
  }
  return {
    productId: String(o.productId ?? ""),
    productSlug: o.productSlug,
    productName: String(o.productName ?? "Peaks 3141 unlock"),
    priceInPi: Number(o.priceInPi ?? 0),
    currency: "π",
    paymentId: typeof o.paymentId === "string" ? o.paymentId : null,
    txid: typeof o.txid === "string" ? o.txid : null,
    purchasedAt: o.purchasedAt,
    sealedAt: typeof o.sealedAt === "string" ? o.sealedAt : o.purchasedAt,
    source: o.source === "purchase" ? "purchase" : "restore_seal",
    holderNote: String(
      o.holderNote ?? `${PAYMENT_ENV.ownedIntro}\n\n${PAYMENT_ENV.credit}`,
    ),
    username: typeof o.username === "string" ? o.username : null,
  };
}
