"use client";

import { fetchAccountOwnershipPurchases } from "@/lib/fetch-account-ownership";
import { createMainnetUnlockPayment } from "@/lib/mainnet-create-payment";
import { readLocalDeed } from "@/lib/peaks/ownership-deed";
import { fallbackUnlockProducts } from "@/lib/unlock-catalog-fallback";
import type {
  ConsumeResponse,
  RestoreOptions,
  SDKLiteInstance,
  UserStateRecord,
} from "@/lib/sdklite-types";

const LS_PREFIX = "peaks3141:pi-state:";

async function resolvePurchases() {
  const deed = readLocalDeed();
  const hint = deed?.paymentId ?? null;
  const account = await fetchAccountOwnershipPurchases(hint);
  if (account?.length) {
    return { purchases: account };
  }
  if (deed?.paymentId && deed.txid && deed.source === "purchase") {
    return { purchases: [{ productId: deed.productId, quantity: 1 }] };
  }
  if (deed?.source === "restore_seal" && deed.productSlug) {
    return {
      purchases: [
        { productId: deed.productId || deed.productSlug, quantity: 1 },
      ],
    };
  }
  return { purchases: [] };
}

function readLocalState(key: string): UserStateRecord | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const blob = JSON.parse(raw) as Record<string, unknown>;
    return {
      blob,
      updatedAt: new Date().toISOString(),
      version: 1,
    };
  } catch {
    return null;
  }
}

function writeLocalState(key: string, blob: Record<string, unknown>): void {
  localStorage.setItem(LS_PREFIX + key, JSON.stringify(blob));
}

/** Pass Pi–style SDK surface — no App Studio / SDKLite. */
export function createMainnetStandaloneSdk(): SDKLiteInstance {
  return {
    login: async () => true,
    makePurchase: (productId) => createMainnetUnlockPayment(productId),
    isAdNetworkSupported: async () => false,
    showInterstitial: async () => false,
    showRewarded: async () => false,
    state: {
      get: async (key) => readLocalState(key),
      set: async (key, blob) => {
        writeLocalState(key, blob);
      },
      products: async () => ({ products: fallbackUnlockProducts() }),
      purchases: async () => resolvePurchases(),
      restore: async (_options?: RestoreOptions) => resolvePurchases(),
      consume: async (productId, quantity = 1): Promise<ConsumeResponse> => ({
        productId,
        quantity,
      }),
    },
  };
}
