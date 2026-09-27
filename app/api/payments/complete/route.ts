import { NextResponse } from "next/server";
import { verifyPiAccessToken } from "@/lib/server/pi-me";
import { getPiPayment, isValidUnlockPayment } from "@/lib/server/pi-get-payment";
import {
  defaultProductId,
  saveUnlockRecord,
} from "@/lib/server/ownership-registry";
import { piCompletePayment } from "@/lib/server/pi-platform-payments";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
    const txid = typeof body?.txid === "string" ? body.txid.trim() : "";
    const accessToken =
      typeof body?.accessToken === "string" ? body.accessToken.trim() : "";
    if (!paymentId || !txid) {
      return NextResponse.json(
        { ok: false, error: "Missing paymentId or txid" },
        { status: 400 },
      );
    }
    const result = await piCompletePayment(paymentId, txid);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "error" in result ? result.error : "complete failed",
          pi: result.pi,
        },
        { status: result.status },
      );
    }

    let ownershipSaved = false;
    if (accessToken) {
      const user = await verifyPiAccessToken(accessToken);
      const { ok, payment } = await getPiPayment(paymentId);
      const productId = defaultProductId();
      if (
        user &&
        ok &&
        payment &&
        isValidUnlockPayment(payment, user.uid, productId)
      ) {
        ownershipSaved = await saveUnlockRecord({
          uid: user.uid,
          username: user.username,
          productId,
          paymentId,
          txid,
          completedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      alreadyCompleted: result.alreadyCompleted,
      ownershipSaved,
      pi: result.pi,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
