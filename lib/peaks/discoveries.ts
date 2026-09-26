export type AntipodeDiscovery = {
  fromId: string;
  toId: string;
  discoveredAt: number;
};

export const DISCOVERIES_INTRO = [
  "Between any point on Earth and its exact opposite lies the whole planet — an ocean of unknown ground.",
  "Most of the time, that far point belongs to no name in this catalog: open water, a country not yet gathered here. But once in a while, by nothing but the shape of the Earth itself, one entry finds its own echo on the other side — a peak, a voice, standing where you least expected it.",
  "This is not a connection we drew. It was always there, waiting to be found.",
] as const;

export const PEAKS_ANTIPODE_MATCH_ODDS =
  "In Peaks 3141, about 13.8% of peaks have a catalog match on the opposite side of Earth (432 of 3,141).";

export const MAX_DISCOVERIES = 500;

export function sanitizeDiscoveries(
  value: unknown,
  valid: Set<string>,
): AntipodeDiscovery[] {
  if (!Array.isArray(value)) return [];
  const out: AntipodeDiscovery[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const fromId = o.fromId;
    const toId = o.toId;
    const discoveredAt = o.discoveredAt;
    if (typeof fromId !== "string" || typeof toId !== "string") continue;
    if (typeof discoveredAt !== "number" || !Number.isFinite(discoveredAt))
      continue;
    if (valid.size && (!valid.has(fromId) || !valid.has(toId))) continue;
    out.push({ fromId, toId, discoveredAt });
    if (out.length >= MAX_DISCOVERIES) break;
  }
  return out.sort((a, b) => b.discoveredAt - a.discoveredAt);
}

export function appendDiscovery(
  prev: AntipodeDiscovery[],
  fromId: string,
  toId: string,
): AntipodeDiscovery[] {
  if (fromId === toId) return prev;
  const now = Date.now();
  const rest = prev.filter(
    (d) => !(d.fromId === fromId && d.toId === toId),
  );
  return [{ fromId, toId, discoveredAt: now }, ...rest].slice(
    0,
    MAX_DISCOVERIES,
  );
}
