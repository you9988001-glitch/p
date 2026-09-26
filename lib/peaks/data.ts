// Peaks 3141 — types, meta helpers, lazy loaders.
// Heavy peak lists live in JSON shards so the first screen stays light.

import metaJson from "@/lib/peaks/meta.json";
import shardAfrica1 from "@/lib/peaks/by-continent/africa-1.json";
import shardAfrica2 from "@/lib/peaks/by-continent/africa-2.json";
import shardAntarctica from "@/lib/peaks/by-continent/antarctica.json";
import shardAsia1 from "@/lib/peaks/by-continent/asia-1.json";
import shardAsia2 from "@/lib/peaks/by-continent/asia-2.json";
import shardEurope from "@/lib/peaks/by-continent/europe.json";
import shardNorthAmerica from "@/lib/peaks/by-continent/north-america.json";
import shardOceania from "@/lib/peaks/by-continent/oceania.json";
import shardSouthAmerica from "@/lib/peaks/by-continent/south-america.json";

export const TOTAL_PEAKS = 3141;

export type ContinentId =
  | "asia"
  | "europe"
  | "africa"
  | "north-america"
  | "south-america"
  | "oceania"
  | "antarctica";

export interface Peak {
  id: string;
  name: string;
  country: string;
  countryCode?: string | null;
  range: string | null;
  elevationM: number;
  continent: ContinentId;
  facts: string[];
  lat?: number | null;
  lon?: number | null;
  prominenceM?: number | null;
  formationType?: string | null;
  naturalFeatures?: string | null;
  summary?: string | null;
}

export interface PeakIndexRow {
  id: string;
  name: string;
  country: string;
  countryCode?: string | null;
  elevationM: number;
  continent: ContinentId;
  range: string;
}

export interface ContinentMeta {
  id: ContinentId;
  name: string;
  blurb: string;
  peakCount: number;
  countryCount: number;
}

export interface CountryRow {
  code: string | null;
  name: string;
  count: number;
  maxElev: number;
}

export interface Filters {
  q: string;
  continent: ContinentId | "";
  country: string;
  band: string;
}

export const EMPTY_FILTERS: Filters = {
  q: "",
  continent: "",
  country: "",
  band: "",
};

export interface ElevationBand {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const ELEVATION_BANDS: ElevationBand[] = [
  { id: "b1", label: "Under 2,000 m", min: 0, max: 1999 },
  { id: "b2", label: "2,000 – 4,000 m", min: 2000, max: 3999 },
  { id: "b3", label: "4,000 – 6,000 m", min: 4000, max: 5999 },
  { id: "b4", label: "6,000 – 8,000 m", min: 6000, max: 7999 },
  { id: "b5", label: "Over 8,000 m", min: 8000, max: 100000 },
];

export function bandOf(elevationM: number): ElevationBand {
  return (
    ELEVATION_BANDS.find((b) => elevationM >= b.min && elevationM <= b.max) ??
    ELEVATION_BANDS[0]
  );
}

export function elevationTier(elevationM: number): number {
  if (elevationM >= 8000) return 5;
  if (elevationM >= 6000) return 4;
  if (elevationM >= 4000) return 3;
  if (elevationM >= 2000) return 2;
  return 1;
}

export function formatInt(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatElevation(m: number): string {
  return `${formatInt(m)} m`;
}

export const CONTINENTS: ContinentMeta[] = (
  metaJson as { continents: ContinentMeta[] }
).continents;

export const COUNTRIES_BY_CONTINENT = (
  metaJson as { countriesByContinent: Record<string, CountryRow[]> }
).countriesByContinent;

export function continentMeta(id: ContinentId): ContinentMeta | undefined {
  return CONTINENTS.find((c) => c.id === id);
}

export function continentName(id: ContinentId): string {
  return continentMeta(id)?.name ?? "—";
}

const cache = new Map<ContinentId, Peak[]>();
let indexCache: PeakIndexRow[] | null = null;
let indexPromise: Promise<PeakIndexRow[]> | null = null;

const CONTINENT_LOADERS: Record<
  ContinentId,
  Array<() => Promise<{ default?: { peaks: Peak[] }; peaks?: Peak[] }>>
> = {
  asia: [
    () => import("@/lib/peaks/by-continent/asia-1.json"),
    () => import("@/lib/peaks/by-continent/asia-2.json"),
  ],
  europe: [() => import("@/lib/peaks/by-continent/europe.json")],
  africa: [
    () => import("@/lib/peaks/by-continent/africa-1.json"),
    () => import("@/lib/peaks/by-continent/africa-2.json"),
  ],
  "north-america": [
    () => import("@/lib/peaks/by-continent/north-america.json"),
  ],
  "south-america": [
    () => import("@/lib/peaks/by-continent/south-america.json"),
  ],
  oceania: [() => import("@/lib/peaks/by-continent/oceania.json")],
  antarctica: [() => import("@/lib/peaks/by-continent/antarctica.json")],
};

function peaksFromMod(mod: {
  default?: { peaks: Peak[] };
  peaks?: Peak[];
}): Peak[] {
  return (mod.default?.peaks ?? mod.peaks ?? []) as Peak[];
}

/** Full catalog (same shards as lazy loaders) — for antipode pool & tools. */
export const ALL_PEAKS: Peak[] = [
  ...peaksFromMod(shardAfrica1),
  ...peaksFromMod(shardAfrica2),
  ...peaksFromMod(shardAntarctica),
  ...peaksFromMod(shardAsia1),
  ...peaksFromMod(shardAsia2),
  ...peaksFromMod(shardEurope),
  ...peaksFromMod(shardNorthAmerica),
  ...peaksFromMod(shardOceania),
  ...peaksFromMod(shardSouthAmerica),
];

const PEAK_BY_ID = new Map<string, Peak>(
  ALL_PEAKS.map((p) => [p.id, p]),
);

/** Sync catalog lookup (same role as Voice `getInstrument`). */
export function getPeakById(id: string): Peak | null {
  return PEAK_BY_ID.get(id) ?? null;
}

export async function loadContinentPeaks(id: ContinentId): Promise<Peak[]> {
  const hit = cache.get(id);
  if (hit) return hit;
  const parts = await Promise.all(CONTINENT_LOADERS[id].map((load) => load()));
  const peaks = parts.flatMap(peaksFromMod);
  cache.set(id, peaks);
  return peaks;
}

export async function loadPeakIndex(): Promise<PeakIndexRow[]> {
  if (indexCache) return indexCache;
  if (!indexPromise) {
    indexPromise = import("@/lib/peaks/index.json").then((mod) => {
      const raw = (mod as { default?: unknown }).default ?? mod;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { peaks?: unknown }).peaks)
          ? ((raw as { peaks: PeakIndexRow[] }).peaks)
          : [];
      indexCache = list as PeakIndexRow[];
      return indexCache;
    });
  }
  return indexPromise;
}

export async function findPeakById(id: string): Promise<Peak | null> {
  const cached = getPeakById(id);
  if (cached) return cached;
  try {
    const index = await loadPeakIndex();
    const row = index.find((p) => p.id === id);
    if (row) {
      const peaks = await loadContinentPeaks(row.continent);
      const hit = peaks.find((p) => p.id === id);
      if (hit) return hit;
    }
    // Fallback: scan all continent shards (guards stale / mismatched index).
    const continents = Object.keys(CONTINENT_LOADERS) as ContinentId[];
    for (const cid of continents) {
      const peaks = await loadContinentPeaks(cid);
      const hit = peaks.find((p) => p.id === id);
      if (hit) return hit;
    }
    return null;
  } catch {
    return null;
  }
}

export function indexToPeak(row: PeakIndexRow): Peak {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    countryCode: row.countryCode,
    range: row.range,
    elevationM: row.elevationM,
    continent: row.continent,
    facts: [
      `Elevation ${formatInt(row.elevationM)} m above sea level.`,
      `Located in ${row.country}.`,
    ],
  };
}

export function flagUrl(code?: string | null, size = 80): string | null {
  if (!code || code.length !== 2) return null;
  return `https://flagcdn.com/w${size}/${code.toLowerCase()}.png`;
}

export function flagEmoji(code?: string | null): string {
  if (!code || code.length !== 2) return "🏳️";
  const cc = code.toUpperCase();
  return String.fromCodePoint(
    ...[...cc].map((c) => 127397 + c.charCodeAt(0)),
  );
}
