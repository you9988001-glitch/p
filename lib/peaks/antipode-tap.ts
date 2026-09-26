import { antipodeCoords } from "@/lib/geo/antipode";
import { describeOpenOcean } from "@/lib/geo/ocean-label";
import { haversineKm } from "@/lib/geo/haversine";
import { isoCountryAtPoint } from "@/lib/geo/country-at-point";
import capitals from "@/lib/geo/country-capitals.json";
import { ALL_PEAKS } from "@/lib/peaks/data";
import { peaksCatalogForIso } from "@/lib/peaks/antipode-nav";

export const ANTIPODE_DETAIL_MAX_KM = 300;

export type AntipodeTapResult =
  | {
      kind: "open-detail";
      peakId: string;
      peakName: string;
      distanceKm: number;
    }
  | {
      kind: "outside-catalog";
      countryName: string;
      iso: string;
    }
  | {
      kind: "no-nearby-peak";
      countryName: string;
      iso: string;
    }
  | { kind: "antarctica" }
  | { kind: "ocean"; description: string; coords: string }
  | { kind: "location-unavailable" };

type PeakLoc = { id: string; name: string; lat: number; lon: number };

let peakLocCache: PeakLoc[] | null = null;

function loadPeakLocations(): PeakLoc[] {
  if (peakLocCache) return peakLocCache;
  const out: PeakLoc[] = [];
  for (const p of ALL_PEAKS) {
    if (
      p.lat != null &&
      p.lon != null &&
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lon)
    ) {
      out.push({ id: p.id, name: p.name, lat: p.lat, lon: p.lon });
    }
  }
  peakLocCache = out;
  return out;
}

function formatCoords(lat: number, lon: number): string {
  const latH = `${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? "N" : "S"}`;
  const lonH = `${Math.abs(lon).toFixed(1)}° ${lon >= 0 ? "E" : "W"}`;
  return `${latH}, ${lonH}`;
}

function resolveReferenceCoords(
  countryCode: string,
  lat?: number | null,
  lon?: number | null,
): { lat: number; lon: number } | null {
  if (
    lat != null &&
    lon != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lon)
  ) {
    return { lat, lon };
  }
  const row = (capitals as Record<string, [number, number]>)[
    countryCode.toUpperCase()
  ];
  if (!row) return null;
  return { lat: row[0], lon: row[1] };
}

async function countryDisplayName(iso: string): Promise<string> {
  try {
    const ct = (await import("countries-and-timezones")).default;
    return ct.getCountry(iso)?.name ?? iso;
  } catch {
    return iso;
  }
}

export async function resolvePeaksAntipodeTap(input: {
  countryCode: string | null | undefined;
  lat?: number | null;
  lon?: number | null;
}): Promise<{ ap: { lat: number; lon: number } | null; tap: AntipodeTapResult }> {
  if (!input.countryCode) {
    return { ap: null, tap: { kind: "location-unavailable" } };
  }
  const ref = resolveReferenceCoords(
    input.countryCode,
    input.lat,
    input.lon,
  );
  if (!ref) {
    return { ap: null, tap: { kind: "location-unavailable" } };
  }

  let ap: { lat: number; lon: number };
  try {
    ap = antipodeCoords(ref.lat, ref.lon);
    const tzLookup = (await import("tz-lookup")).default;
    tzLookup(ap.lat, ap.lon);
  } catch {
    return { ap: null, tap: { kind: "location-unavailable" } };
  }

  const peaks = loadPeakLocations();
  let best: PeakLoc | null = null;
  let bestKm = Infinity;
  for (const p of peaks) {
    const d = haversineKm(ap.lat, ap.lon, p.lat, p.lon);
    if (d < bestKm) {
      bestKm = d;
      best = p;
    }
  }
  if (best && bestKm <= ANTIPODE_DETAIL_MAX_KM) {
    return {
      ap,
      tap: {
        kind: "open-detail",
        peakId: best.id,
        peakName: best.name,
        distanceKm: Math.round(bestKm),
      },
    };
  }

  const iso = await isoCountryAtPoint(ap.lat, ap.lon);
  if (!iso) {
    return {
      ap,
      tap: {
        kind: "ocean",
        description: describeOpenOcean(ap.lat, ap.lon),
        coords: formatCoords(ap.lat, ap.lon),
      },
    };
  }

  if (iso === "AQ" || ap.lat <= -60) {
    return { ap, tap: { kind: "antarctica" } };
  }

  const inCatalog = peaksCatalogForIso(iso);
  if (inCatalog) {
    return {
      ap,
      tap: {
        kind: "no-nearby-peak",
        countryName: await countryDisplayName(iso),
        iso,
      },
    };
  }

  return {
    ap,
    tap: {
      kind: "outside-catalog",
      countryName: await countryDisplayName(iso),
      iso,
    },
  };
}
