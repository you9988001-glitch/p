import type { Product } from "@/lib/sdklite-types";
import { catalogPriceMatchesUnlock } from "@/lib/payment-env";

/** Match Portal catalog → configured id, slug, or 3.141 π unlock product. */
export function resolveUnlockProduct(
  products: Product[] | null | undefined,
  configuredId: string,
): Product | null {
  if (!products?.length) return null;
  const id = configuredId.trim();
  if (id) {
    const exact = products.find((p) => p.id === id || p.slug === id);
    if (exact) return exact;
  }
  const priced = products.find((p) => catalogPriceMatchesUnlock(p.price_in_pi));
  if (priced) return priced;
  return products.length === 1 ? products[0]! : null;
}
