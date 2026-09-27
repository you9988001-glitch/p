import crypto from "crypto";
import { NextResponse } from "next/server";

function base64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwtHS256(payload: Record<string, unknown>, secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(payload));
  const data = `${h}.${p}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${data}.${sig}`;
}

/** Pass Pi–compatible Pi /v2/me verification (optional session JWT). */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const accessToken =
      typeof body?.accessToken === "string" ? body.accessToken.trim() : "";
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Missing accessToken" },
        { status: 400 },
      );
    }
    const r = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: "Token verification failed", pi: user },
        { status: 401 },
      );
    }
    const username =
      (user as { username?: string }).username ||
      (user as { user?: { username?: string } }).user?.username;
    const uid =
      (user as { uid?: string }).uid ||
      (user as { user?: { uid?: string } }).user?.uid;

    let session: string | null = null;
    const secret =
      process.env.PROOF_TOKEN_SECRET?.trim() ||
      process.env.SESSION_SECRET?.trim();
    if (secret && username) {
      session = signJwtHS256(
        {
          typ: "pi-auth-session",
          username,
          uid: uid || null,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
        secret,
      );
    }

    return NextResponse.json({
      ok: true,
      user: { username, uid: uid || null },
      session,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
