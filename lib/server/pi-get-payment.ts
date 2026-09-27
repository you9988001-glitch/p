export type PiPaymentDto = {
  identifier?: string;
  user_uid?: string;
  amount?: number;
  memo?: string;
  metadata?: Record<string, unknown>;
  status?: {
    developer_completed?: boolean;
    cancelled?: boolean;
    user_cancelled?: boolean;
  };
  transaction?: { txid?: string; verified?: boolean } | null;
};

export async function getPiPayment(
  paymentId: string,
): Promise<{ ok: boolean; payment?: PiPaymentDto; status: number }> {
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 500 };
  }
  const url = `https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}`;
  const r = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Key ${apiKey}` },
  });
  const payment = (await r.json().catch(() => ({}))) as PiPaymentDto;
  return { ok: r.ok, payment, status: r.status };
}

const UNLOCK_AMOUNT = 3.141;

export function isValidUnlockPayment(
  payment: PiPaymentDto,
  uid: string,
  productId: string,
): boolean {
  if (payment.user_uid !== uid) return false;
  if (payment.status?.cancelled || payment.status?.user_cancelled) return false;
  if (!payment.status?.developer_completed) return false;
  const amount = Number(payment.amount);
  if (!Number.isFinite(amount) || Math.abs(amount - UNLOCK_AMOUNT) > 0.0001) {
    return false;
  }
  const meta = payment.metadata || {};
  const metaProduct =
    typeof meta.productId === "string" ? meta.productId : null;
  if (metaProduct && metaProduct !== productId) return false;
  return true;
}
