import type { Product } from "@/lib/sdklite-types";
import { MAINNET_UNLOCK_PI } from "@/lib/payment-env";
import { PEAK_DETAIL_PRODUCT_ID } from "@/lib/product-config";

/** Mainnet unlock row when App Studio catalog is not used. */
export function fallbackUnlockProducts(): Product[] {
  return [
    {
      id: PEAK_DETAIL_PRODUCT_ID,
      slug: PEAK_DETAIL_PRODUCT_ID,
      name: "Peaks 3141",
      description: "Mainnet unlock — 3.141 π",
      price_in_pi: MAINNET_UNLOCK_PI,
      total_quantity: 0,
      is_active: true,
      created_at: "1970-01-01T00:00:00.000Z",
    },
  ];
}
