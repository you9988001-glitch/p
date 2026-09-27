/** Pass Pi–style Pi Platform API (mainnet, server-only). */

export async function piApprovePayment(paymentId: string) {
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) {
    return { ok: false as const, status: 500, error: "Missing PI_API_KEY env var" };
  }
  const url = `https://api.minepi.com/v2/payments/${paymentId}/approve`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
  });
  const pi = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, pi };
}

export async function piCompletePayment(paymentId: string, txid: string) {
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) {
    return { ok: false as const, status: 500, error: "Missing PI_API_KEY env var" };
  }
  const url = `https://api.minepi.com/v2/payments/${paymentId}/complete`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({ txid }),
  });
  const pi = await r.json().catch(() => ({}));
  const already =
    (!r.ok && pi && (pi as { error?: string }).error === "already_completed") ||
    (r.ok && pi && (pi as { error?: string }).error === "already_completed");
  if (!r.ok && !already) {
    return { ok: false as const, status: r.status, error: "pi complete failed", pi };
  }
  return { ok: true as const, status: 200, alreadyCompleted: Boolean(already), pi };
}
