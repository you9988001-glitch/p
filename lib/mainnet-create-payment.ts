"use client";

import { MAINNET_UNLOCK_PI } from "@/lib/payment-env";
import { getPiAccessToken } from "@/lib/pi-access-token";
import type { PurchaseResult, SDKLiteError } from "@/lib/sdklite-types";

function purchaseError(
  code: SDKLiteError["code"],
  message: string,
): SDKLiteError {
  const err = new Error(message) as SDKLiteError;
  err.name = "SDKLiteError";
  err.code = code;
  return err;
}

/** Pass Pi pattern: Pi.createPayment → Vercel /api/payments/* (not App Studio). */
export function createMainnetUnlockPayment(
  productId: string,
): Promise<PurchaseResult> {
  const Pi = window.Pi;
  if (!Pi?.createPayment) {
    return Promise.reject(
      purchaseError("purchase_error", "Pi.createPayment not available — use Pi Browser"),
    );
  }

  return new Promise((resolve, reject) => {
    Pi.createPayment(
      {
        amount: MAINNET_UNLOCK_PI,
        memo: "Peaks 3141 unlock",
        metadata: { productId, app: "peaks3141" },
      },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          const r = await fetch("/api/payments/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) {
            throw new Error(
              typeof j?.error === "string" ? j.error : "approve failed",
            );
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          const r = await fetch("/api/payments/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId,
              txid,
              accessToken: getPiAccessToken() || undefined,
            }),
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) {
            throw new Error(
              typeof j?.error === "string" ? j.error : "complete failed",
            );
          }
          resolve({ ok: true, productId, paymentId, txid });
        },
        onCancel: () => {
          reject(purchaseError("purchase_cancelled", "Purchase cancelled"));
        },
        onError: (error: { message?: string }) => {
          reject(
            purchaseError(
              "purchase_error",
              error?.message || "Purchase failed",
            ),
          );
        },
      },
    );
  });
}
