import capitals from "@/lib/geo/country-capitals.json";
import {
  antipodeCoords,
  regionLabelForAntipode,
} from "@/lib/geo/antipode";
import type { AntipodeTapResult } from "@/lib/peaks/antipode-tap";

export type Season = "Spring" | "Summer" | "Autumn" | "Winter";

export interface LivePeakTime {
  timeZone: string;
  localTime: string;
  hemisphere: "Northern" | "Southern";
  season: Season;
  regionLabel?: string;
  antipodeLat?: number;
  antipodeLon?: number;
  tapResult?: AntipodeTapResult;
}

const TZ_OVERRIDES: Record<string, string> = {
  XK: "Europe/Belgrade",
  TA: "Atlantic/St_Helena",
  AC: "Atlantic/St_Helena",
  HM: "Indian/Kerguelen",
  BV: "Etc/GMT+1",
};

const SOUTHERN_HEMISPHERE_CODES = new Set([
  "AR", "AU", "BO", "BW", "BR", "CL", "SZ", "FJ", "ID", "LS", "MG", "MW",
  "MZ", "NA", "NZ", "PG", "PY", "PE", "WS", "SB", "ZA", "TL", "TO", "UY",
  "VU", "ZM", "ZW", "AO", "PF", "NC", "CK", "KM", "MU", "RE", "SC", "NF",
  "TF", "GS", "AQ", "TV", "NR", "NU", "PN", "WF", "MG",
  "EC", "KE", "CD", "CG", "GA", "KI",
]);

function seasonForNorthern(dayOfYear: number): Season {
  if (dayOfYear < 79 || dayOfYear >= 355) return "Winter";
  if (dayOfYear < 172) return "Spring";
  if (dayOfYear < 266) return "Summer";
  return "Autumn";
}

function flip(season: Season): Season {
  if (season === "Winter") return "Summer";
  if (season === "Summer") return "Winter";
  if (season === "Spring") return "Autumn";
  return "Spring";
}

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86400000);
}

function resolveHemisphere(
  countryCode: string,
  lat?: number | null,
): "Northern" | "Southern" {
  if (lat != null && Number.isFinite(lat)) {
    return lat < 0 ? "Southern" : "Northern";
  }
  return SOUTHERN_HEMISPHERE_CODES.has(countryCode.toUpperCase())
    ? "Southern"
    : "Northern";
}

function formatInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

export function parseLocalHour(localTime: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(localTime.trim());
  if (!m) return null;
  const h = Number(m[1]);
  return h >= 0 && h <= 23 ? h : null;
}

export function isDaytimeLocal(localTime: string): boolean {
  const h = parseLocalHour(localTime);
  if (h == null) return true;
  return h >= 6 && h < 20;
}

export async function getLivePeakTime(
  countryCode: string | null | undefined,
  now = new Date(),
  lat?: number | null,
): Promise<LivePeakTime | null> {
  if (!countryCode) return null;
  const cc = countryCode.toUpperCase();

  try {
    const override = TZ_OVERRIDES[cc];
    let timeZone = override;
    if (!timeZone) {
      const ct = (await import("countries-and-timezones")).default;
      const country = ct.getCountry(cc);
      if (!country?.timezones?.length) return null;
      timeZone = country.timezones[0];
    }
    const localTime = formatInZone(now, timeZone);
    const hemisphere = resolveHemisphere(countryCode, lat);
    const baseSeason = seasonForNorthern(dayOfYear(now));
    const season = hemisphere === "Northern" ? baseSeason : flip(baseSeason);
    return { timeZone, localTime, hemisphere, season };
  } catch {
    return null;
  }
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

export async function liveTimeAtAntipode(
  ap: { lat: number; lon: number },
  now = new Date(),
): Promise<Omit<LivePeakTime, "tapResult">> {
  const tzLookup = (await import("tz-lookup")).default;
  const timeZone = tzLookup(ap.lat, ap.lon);
  const localTime = formatInZone(now, timeZone);
  const hemisphere: "Northern" | "Southern" =
    ap.lat < 0 ? "Southern" : "Northern";
  const baseSeason = seasonForNorthern(dayOfYear(now));
  const season = hemisphere === "Northern" ? baseSeason : flip(baseSeason);
  return {
    timeZone,
    localTime,
    hemisphere,
    season,
    regionLabel: regionLabelForAntipode(ap, timeZone),
    antipodeLat: ap.lat,
    antipodeLon: ap.lon,
  };
}

export async function getAntipodeLiveTime(
  countryCode: string | null | undefined,
  lat?: number | null,
  lon?: number | null,
  now = new Date(),
): Promise<LivePeakTime | null> {
  if (!countryCode) return null;
  const ref = resolveReferenceCoords(countryCode, lat, lon);
  if (!ref) return null;

  try {
    const { resolvePeaksAntipodeTap } = await import("@/lib/peaks/antipode-tap");
    const { ap, tap } = await resolvePeaksAntipodeTap({
      countryCode,
      lat,
      lon,
    });
    if (!ap) {
      return {
        timeZone: "UTC",
        localTime: "--:--",
        hemisphere: "Northern",
        season: "Spring",
        tapResult: tap,
      };
    }
    const base = await liveTimeAtAntipode(ap, now);
    return { ...base, tapResult: tap };
  } catch {
    return {
      timeZone: "UTC",
      localTime: "--:--",
      hemisphere: "Northern",
      season: "Spring",
      tapResult: { kind: "location-unavailable" },
    };
  }
}
