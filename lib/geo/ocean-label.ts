import capitals from "@/lib/geo/country-capitals.json";
import { haversineKm } from "@/lib/geo/haversine";

const CAPS = capitals as Record<string, [number, number]>;

const COUNTRY_NAME: Record<string, string> = {
  AF: "Afghanistan",
  AL: "Albania",
  DZ: "Algeria",
  AR: "Argentina",
  AU: "Australia",
  BR: "Brazil",
  CA: "Canada",
  CL: "Chile",
  CN: "China",
  EG: "Egypt",
  FJ: "Fiji",
  FR: "France",
  DE: "Germany",
  IN: "India",
  ID: "Indonesia",
  IT: "Italy",
  JP: "Japan",
  KZ: "Kazakhstan",
  MX: "Mexico",
  NZ: "New Zealand",
  NO: "Norway",
  PG: "Papua New Guinea",
  PE: "Peru",
  RU: "Russia",
  SA: "Saudi Arabia",
  ZA: "South Africa",
  KR: "South Korea",
  ES: "Spain",
  GB: "United Kingdom",
  US: "United States",
};

function oceanBasin(lat: number, lon: number): string {
  const aLat = Math.abs(lat);
  if (lat <= -60) return "the Southern Ocean";
  if (aLat <= 23.5 && lon >= 40 && lon <= 120) return "the Indian Ocean";
  if (aLat <= 23.5 && (lon > 120 || lon < -80)) return "the Pacific Ocean";
  if (aLat <= 23.5) return "the Atlantic Ocean";
  if (lat > 0 && lon >= 100 && lon <= 180) return "the North Pacific";
  if (lat > 0 && lon >= -180 && lon <= -60) return "the North Pacific";
  if (lat > 0 && lon >= -60 && lon <= 20) return "the North Atlantic";
  if (lat > 0 && lon > 20 && lon < 100) return "the North Atlantic";
  if (lat < 0 && lon >= 100 && lon <= 180) return "the South Pacific";
  if (lat < 0 && lon >= -180 && lon <= -70) return "the South Pacific";
  if (lat < 0 && lon >= -70 && lon <= 20) return "the South Atlantic";
  if (lat < 0 && lon > 20 && lon < 100) return "the Indian Ocean";
  return "the open ocean";
}

export function nearestCountryLabel(lat: number, lon: number): string {
  let bestCode: string | null = null;
  let bestKm = Infinity;
  for (const [code, [clat, clon]] of Object.entries(CAPS)) {
    const d = haversineKm(lat, lon, clat, clon);
    if (d < bestKm) {
      bestKm = d;
      bestCode = code;
    }
  }
  if (!bestCode) return "open ocean";
  const name = COUNTRY_NAME[bestCode] ?? bestCode;
  return name;
}

export function describeOpenOcean(lat: number, lon: number): string {
  const basin = oceanBasin(lat, lon);
  const near = nearestCountryLabel(lat, lon);
  return `${basin}, near ${near}`;
}
