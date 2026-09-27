export type PiMeUser = {
  uid: string;
  username: string | null;
};

export async function verifyPiAccessToken(
  accessToken: string,
): Promise<PiMeUser | null> {
  const r = await fetch("https://api.minepi.com/v2/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await r.json().catch(() => ({}))) as {
    uid?: string;
    username?: string;
    user?: { uid?: string; username?: string };
  };
  if (!r.ok) return null;
  const uid = data.uid || data.user?.uid;
  if (!uid || typeof uid !== "string") return null;
  const username =
    typeof data.username === "string"
      ? data.username
      : typeof data.user?.username === "string"
        ? data.user.username
        : null;
  return { uid, username };
}
