import { kv } from "@vercel/kv";
import { PEAK_DETAIL_PRODUCT_ID } from "@/lib/product-config";

const APP_KEY = "peaks3141";

export type UnlockRecord = {
  uid: string;
  username: string | null;
  productId: string;
  paymentId: string;
  txid: string;
  completedAt: string;
};

function kvKey(uid: string) {
  return `ownership:${APP_KEY}:${uid}`;
}

export function ownershipKvConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL?.trim() &&
      process.env.KV_REST_API_TOKEN?.trim(),
  );
}

export async function getUnlockRecord(
  uid: string,
): Promise<UnlockRecord | null> {
  if (!ownershipKvConfigured()) return null;
  try {
    const rec = await kv.get<UnlockRecord>(kvKey(uid));
    return rec ?? null;
  } catch (e) {
    console.error("[ownership] KV read failed", e);
    return null;
  }
}

export async function saveUnlockRecord(record: UnlockRecord): Promise<boolean> {
  if (!ownershipKvConfigured()) {
    console.warn("[ownership] KV not configured — set KV_REST_API_* on Vercel");
    return false;
  }
  try {
    await kv.set(kvKey(record.uid), record);
    return true;
  } catch (e) {
    console.error("[ownership] KV write failed", e);
    return false;
  }
}

export function defaultProductId(): string {
  return (
    process.env.NEXT_PUBLIC_PEAKS_UNLOCK_PRODUCT_ID?.trim() ||
    PEAK_DETAIL_PRODUCT_ID
  );
}
