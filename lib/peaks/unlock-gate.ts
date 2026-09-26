/** Hard unlock matching — never depend on catalog load alone. */

import type { UserPurchaseBalance } from "@/lib/sdklite-types";
import { PEAK_DETAIL_PRODUCT_ID } from "@/lib/product-config";
import { MAINNET_UNLOCK_PI } from "@/lib/payment-env";

export const OWNERSHIP_DEED_SEALED_EVENT = "peaks3141.ownership.deed.sealed";

/** Known App Studio product id (+ optional slug aliases). */
export const UNLOCK_PRODUCT_IDS = [PEAK_DETAIL_PRODUCT_ID] as const;

export const UNLOCK_FALLBACK = {
  productId: PEAK_DETAIL_PRODUCT_ID,
  productSlug: PEAK_DETAIL_PRODUCT_ID,
  productName: "Peaks 3141",
  /** App Studio / Mainnet display & deed amount (catalog may override). */
  priceInPi: MAINNET_UNLOCK_PI,
} as const;

/** Canonical Mainnet unlock price in paywall (match App Studio catalog). */
export const TEST_PI_PRICE = UNLOCK_FALLBACK.priceInPi;

export function notifyDeedSealed(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OWNERSHIP_DEED_SEALED_EVENT));
}

export function collectUnlockIds(
  product?: { id?: string; slug?: string } | null,
  extraIds: Array<string | null | undefined> = [],
): string[] {
  const ids = new Set<string>();
  for (const id of UNLOCK_PRODUCT_IDS) {
    if (id) ids.add(id);
  }
  if (product?.id) ids.add(product.id);
  if (product?.slug) ids.add(product.slug);
  for (const id of extraIds) {
    if (id) ids.add(id);
  }
  return [...ids];
}

export function purchaseQtyForUnlock(
  purchases: UserPurchaseBalance[] | null | undefined,
  product?: { id?: string; slug?: string } | null,
  extraIds: Array<string | null | undefined> = [],
): number {
  if (!purchases?.length) return 0;
  const ids = new Set(collectUnlockIds(product, extraIds));
  let qty = 0;
  for (const row of purchases) {
    if (ids.has(row.productId)) qty += row.quantity ?? 0;
  }
  return qty;
}

export function isRestoreOwned(
  purchases: UserPurchaseBalance[] | null | undefined,
  product?: { id?: string; slug?: string } | null,
  extraIds: Array<string | null | undefined> = [],
): boolean {
  return purchaseQtyForUnlock(purchases, product, extraIds) > 0;
}
