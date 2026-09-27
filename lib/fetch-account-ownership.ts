"use client";

import { getPiAccessToken } from "@/lib/pi-access-token";
import type { UserPurchaseBalance } from "@/lib/sdklite-types";

/** Cross-device unlock via Vercel ownership registry (+ Pi payment verify). */
export async function fetchAccountOwnershipPurchases(
  paymentIdHint?: string | null,
): Promise<UserPurchaseBalance[] | null> {
  const accessToken = getPiAccessToken();
  if (!accessToken) return null;
  try {
    const r = await fetch("/api/ownership/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken,
        paymentId: paymentIdHint?.trim() || undefined,
      }),
    });
    const j = (await r.json().catch(() => ({}))) as {
      ok?: boolean;
      owned?: boolean;
      productId?: string | null;
    };
    if (j.ok && j.owned && j.productId) {
      return [{ productId: j.productId, quantity: 1 }];
    }
  } catch {
    /* fall through */
  }
  return null;
}
