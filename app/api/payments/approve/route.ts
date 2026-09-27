import { NextResponse } from "next/server";
import { piApprovePayment } from "@/lib/server/pi-platform-payments";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
    if (!paymentId) {
      return NextResponse.json(
        { ok: false, error: "Missing paymentId" },
        { status: 400 },
      );
    }
    const result = await piApprovePayment(paymentId);
    if ("error" in result && result.error) {
      return NextResponse.json(
        { ok: false, error: result.error, pi: result.pi },
        { status: result.status },
      );
    }
    return NextResponse.json(
      { ok: result.ok, pi: result.pi },
      { status: result.status },
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
