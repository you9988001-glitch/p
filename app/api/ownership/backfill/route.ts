import { NextResponse } from "next/server";
import { getPiPayment, isValidUnlockPayment } from "@/lib/server/pi-get-payment";
import {
  defaultProductId,
  ownershipKvConfigured,
  saveUnlockRecord,
} from "@/lib/server/ownership-registry";

/**
 * One-shot server-side backfill: verify Pi paymentId and write ownership:peaks3141.
 * Protected by OWNERSHIP_BACKFILL_SECRET (header x-backfill-secret).
 */
export async function POST(req: Request) {
  try {
    const secret = process.env.OWNERSHIP_BACKFILL_SECRET?.trim();
    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "Backfill not configured" },
        { status: 503 },
      );
    }
    const header = req.headers.get("x-backfill-secret")?.trim() || "";
    if (header !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
    if (!paymentId) {
      return NextResponse.json(
        { ok: false, error: "Missing paymentId" },
        { status: 400 },
      );
    }

    if (!ownershipKvConfigured()) {
      return NextResponse.json(
        { ok: false, error: "KV not configured" },
        { status: 503 },
      );
    }

    const { ok, payment, status } = await getPiPayment(paymentId);
    if (!ok || !payment) {
      return NextResponse.json(
        { ok: false, error: "Pi payment lookup failed", status },
        { status: 502 },
      );
    }

    const productId = defaultProductId();
    const uid = payment.user_uid;
    if (!uid) {
      return NextResponse.json(
        { ok: false, error: "Payment has no user_uid" },
        { status: 400 },
      );
    }

    if (!isValidUnlockPayment(payment, uid, productId)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Payment failed unlock validation",
          amount: payment.amount ?? null,
          developer_completed: payment.status?.developer_completed ?? null,
          cancelled:
            payment.status?.cancelled || payment.status?.user_cancelled || false,
          metaProduct:
            typeof payment.metadata?.productId === "string"
              ? payment.metadata.productId
              : null,
          expectedProductId: productId,
        },
        { status: 422 },
      );
    }

    const record = {
      uid,
      username: null,
      productId,
      paymentId: payment.identifier || paymentId,
      txid: payment.transaction?.txid ?? "",
      completedAt: new Date().toISOString(),
    };
    const wrote = await saveUnlockRecord(record);
    return NextResponse.json({
      ok: true,
      wroteToKv: wrote,
      key: `ownership:peaks3141:${uid}`,
      paymentId: record.paymentId,
      productId: record.productId,
      txid: record.txid,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
