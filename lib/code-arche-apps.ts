/** CODE ARCHE app directory — curator note “More from this Curator” links. */

export type CodeArcheAppId =
  | "pass-pi"
  | "arche1"
  | "arche0"
  | "peaks3141"
  | "voice3141"
  | "pulse-pi";

export type CodeArcheApp = {
  id: CodeArcheAppId;
  name: string;
  /** Open in Pi Browser / external tab. */
  url: string;
  /** Short badge, e.g. permanent testnet. */
  badge?: string;
};

/** Frontend host derived from each app’s App Studio backend id in system-config.
 *  NOTE: this is the shared App Studio engine host — NOT the public Pi app URL.
 *  Public Peaks/Voice links use Pi Portal Production URL (Vercel / custom domain). */
export const APP_STUDIO_HOST =
  "https://appstudio-u7cm9zhmha0ruwv8.piappengine.com";

function publicAppUrl(envKey: string, fallback: string): string {
  const v = process.env[envKey]?.trim();
  return v && v.startsWith("https://") ? v : fallback;
}

/** Pi Portal Production URL (Vercel or custom domain). */
export const PEAKS3141_URL = publicAppUrl(
  "NEXT_PUBLIC_PEAKS3141_URL",
  "https://p-rho-rust.vercel.app",
);

export const VOICE3141_URL = publicAppUrl(
  "NEXT_PUBLIC_VOICE3141_URL",
  "https://v-beta-two.vercel.app",
);

/**
 * Curator order (fixed): Pass Pi → ARCHE1 → ARCHE0 → Peaks3141 → Voice3141 → Pulse Pi.
 * Peaks/Voice public URLs: set NEXT_PUBLIC_* on Vercel or use defaults below.
 */
export const CODE_ARCHE_APPS: CodeArcheApp[] = [
  {
    id: "pass-pi",
    name: "Pass Pi",
    url: "https://www.trinity314.com",
  },
  {
    id: "arche1",
    name: "ARCHE1",
    url: "https://www.arche1.com",
  },
  {
    id: "arche0",
    name: "ARCHE0",
    url: "https://www.arche0.com",
  },
  {
    id: "peaks3141",
    name: "Peaks3141",
    url: PEAKS3141_URL,
  },
  {
    id: "voice3141",
    name: "Voice3141",
    url: VOICE3141_URL,
  },
  {
    id: "pulse-pi",
    name: "Pulse Pi",
    url: "https://atasteofpi7348.pinet.com",
    badge: "Permanent testnet",
  },
];

/** Exact curator philosophy copy (word for word). */
export const CURATOR_NOTE_LINES: string[] = [
  "[The Philosophy of Code Arche: The Two Divergent Paths of Peak and Voice]",
  "Peaks3141 and Voice3141 were born together — the same day, the same hour, twins conceived at once. These two applications diverge from the very origin of creation and existence.",
  "Peak: The Mirror of Untouched Nature",
  "Peak exists as a natural formation, brought forth without human intervention. Therefore, we have not imposed any arbitrary links or artificial functions between them. Each peak stands nobly in its own place in its original state, laying bare the raw reality without adornment.",
  "Voice: Harmony Woven by Human Hands",
  "In contrast, Voice is a cultural entity brought to life through human touch and breath. Thus, the world of these instruments connects through human hands. Sound elements with similar textures embrace one another to form a singular harmony.",
  "Peaks3141 & Voice3141 — Curated by CODE ARCHE",
];

export function isCuratorHeading(line: string): boolean {
  return (
    line.startsWith("[") ||
    line === "Peak: The Mirror of Untouched Nature" ||
    line === "Voice: Harmony Woven by Human Hands" ||
    line.startsWith("Peaks3141 & Voice3141")
  );
}
