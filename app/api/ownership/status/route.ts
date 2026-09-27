import { NextResponse } from "next/server";
import { verifyPiAccessToken } from "@/lib/server/pi-me";
import { resolveAccountOwnership } from "@/lib/server/resolve-account-ownership";
import { ownershipKvConfigured } from "@/lib/server/ownership-registry";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const accessToken =
      typeof body?.accessToken === "string" ? body.accessToken.trim() : "";
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Missing accessToken" },
        { status: 400 },
      );
    }

    const user = await verifyPiAccessToken(accessToken);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Invalid access token" },
        { status: 401 },
      );
    }

    const { owned, record } = await resolveAccountOwnership(
      user,
      paymentId || null,
    );

    return NextResponse.json({
      ok: true,
      owned,
      kvConfigured: ownershipKvConfigured(),
      productId: record?.productId ?? null,
      paymentId: record?.paymentId ?? null,
      txid: record?.txid ?? null,
      username: user.username,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
