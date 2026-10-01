"use client";

import { getPiAccessToken } from "@/lib/pi-access-token";
import type { UserPurchaseBalance } from "@/lib/sdklite-types";

export type OwnershipSyncResult = {
  ok: boolean;
  owned: boolean;
  kvConfigured: boolean;
  alreadyInKv: boolean;
  wroteToKv: boolean;
  productId: string | null;
  paymentId: string | null;
  uid: string | null;
  error?: string;
};

/**
 * Force a server-side ownership check (Pi payment verify + KV read/write).
 * Does not use local deed as proof — only what the API returns.
 */
export async function syncOwnershipToServer(
  paymentIdHint?: string | null,
): Promise<OwnershipSyncResult> {
  const accessToken = getPiAccessToken();
  if (!accessToken) {
    return {
      ok: false,
      owned: false,
      kvConfigured: false,
      alreadyInKv: false,
      wroteToKv: false,
      productId: null,
      paymentId: null,
      uid: null,
      error: "Not signed in with Pi (missing access token).",
    };
  }
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
      kvConfigured?: boolean;
      alreadyInKv?: boolean;
      wroteToKv?: boolean;
      productId?: string | null;
      paymentId?: string | null;
      uid?: string | null;
      error?: string;
    };
    if (!r.ok || !j.ok) {
      return {
        ok: false,
        owned: false,
        kvConfigured: Boolean(j.kvConfigured),
        alreadyInKv: false,
        wroteToKv: false,
        productId: null,
        paymentId: null,
        uid: null,
        error: j.error || `Server error (${r.status})`,
      };
    }
    return {
      ok: true,
      owned: Boolean(j.owned),
      kvConfigured: Boolean(j.kvConfigured),
      alreadyInKv: Boolean(j.alreadyInKv),
      wroteToKv: Boolean(j.wroteToKv),
      productId: j.productId ?? null,
      paymentId: j.paymentId ?? null,
      uid: j.uid ?? null,
    };
  } catch (e) {
    return {
      ok: false,
      owned: false,
      kvConfigured: false,
      alreadyInKv: false,
      wroteToKv: false,
      productId: null,
      paymentId: null,
      uid: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Cross-device unlock via Vercel ownership registry (+ Pi payment verify). */
export async function fetchAccountOwnershipPurchases(
  paymentIdHint?: string | null,
): Promise<UserPurchaseBalance[] | null> {
  const result = await syncOwnershipToServer(paymentIdHint);
  if (result.ok && result.owned && result.productId) {
    return [{ productId: result.productId, quantity: 1 }];
  }
  return null;
}
