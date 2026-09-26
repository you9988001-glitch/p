import type { ContinentId } from "@/lib/peaks/data";
import { COUNTRIES_BY_CONTINENT } from "@/lib/peaks/data";
import { isoCountryAtPoint } from "@/lib/geo/country-at-point";

export type PeaksAntipodeNav = {
  continentId: ContinentId;
  countryCode: string | null;
  countryName: string;
  isoAtPoint: string;
};

export function peaksCatalogForIso(
  iso: string,
): Omit<PeaksAntipodeNav, "isoAtPoint"> | null {
  const cc = iso.toUpperCase();
  for (const [continentId, rows] of Object.entries(COUNTRIES_BY_CONTINENT)) {
    for (const row of rows) {
      if (row.code?.toUpperCase() === cc) {
        return {
          continentId: continentId as ContinentId,
          countryCode: row.code,
          countryName: row.name,
        };
      }
    }
  }
  return null;
}

export type AntipodeNavBlockReason = "ocean" | "not-in-catalog";

/** Resolve antipode coordinates → Peaks country list entry (or block reason). */
export async function peaksNavAtAntipode(
  lat: number,
  lon: number,
): Promise<{
  nav: PeaksAntipodeNav | null;
  blockReason: AntipodeNavBlockReason | null;
  isoAtPoint: string | null;
}> {
  const iso = await isoCountryAtPoint(lat, lon);
  if (!iso) return { nav: null, blockReason: "ocean", isoAtPoint: null };
  const row = peaksCatalogForIso(iso);
  if (!row)
    return { nav: null, blockReason: "not-in-catalog", isoAtPoint: iso };
  return { nav: { ...row, isoAtPoint: iso }, blockReason: null, isoAtPoint: iso };
}
