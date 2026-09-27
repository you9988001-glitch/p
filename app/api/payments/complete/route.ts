import { NextResponse } from "next/server";
import { piCompletePayment } from "@/lib/server/pi-platform-payments";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
    const txid = typeof body?.txid === "string" ? body.txid.trim() : "";
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
    return NextResponse.json({
      ok: true,
      alreadyCompleted: result.alreadyCompleted,
      pi: result.pi,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
