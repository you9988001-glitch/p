import { getPiPayment, isValidUnlockPayment } from "@/lib/server/pi-get-payment";
import {
  defaultProductId,
  getUnlockRecord,
  saveUnlockRecord,
  type UnlockRecord,
} from "@/lib/server/ownership-registry";
import type { PiMeUser } from "@/lib/server/pi-me";

/** Account-wide unlock (cross-device) via KV + optional paymentId backfill. */
export async function resolveAccountOwnership(
  user: PiMeUser,
  paymentIdHint?: string | null,
): Promise<{ owned: boolean; record: UnlockRecord | null }> {
  const productId = defaultProductId();

  const existing = await getUnlockRecord(user.uid);
  if (existing?.productId) {
    return { owned: true, record: existing };
  }

  const hint = paymentIdHint?.trim();
  if (!hint) {
    return { owned: false, record: null };
  }

  const { ok, payment } = await getPiPayment(hint);
  if (!ok || !payment || !isValidUnlockPayment(payment, user.uid, productId)) {
    return { owned: false, record: null };
  }

  const txid = payment.transaction?.txid ?? "";
  const record: UnlockRecord = {
    uid: user.uid,
    username: user.username,
    productId,
    paymentId: payment.identifier || hint,
    txid,
    completedAt: new Date().toISOString(),
  };
  await saveUnlockRecord(record);
  return { owned: true, record };
}
