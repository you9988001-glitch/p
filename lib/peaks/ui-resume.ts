/** Persist Peaks UI path so leaving via curator links can restore on return. */

import type { ContinentId } from "@/lib/peaks/data";

const KEY = "peaks3141.ui.resume.v1";

export type PeaksTabResume = "home" | "catalog" | "favorites";

export type PeaksNavResume =
  | { screen: "home" }
  | { screen: "found" }
  | { screen: "continent"; continentId: ContinentId }
  | {
      screen: "country";
      continentId: ContinentId;
      countryCode: string | null;
      countryName: string;
    };

export type PeaksUiResume = {
  tab: PeaksTabResume;
  nav: PeaksNavResume;
  openId: string | null;
  curatorNote: boolean;
};

const CONTINENTS: ContinentId[] = [
  "asia",
  "europe",
  "africa",
  "north-america",
  "south-america",
  "oceania",
  "antarctica",
];

function isContinentId(v: unknown): v is ContinentId {
  return typeof v === "string" && (CONTINENTS as string[]).includes(v);
}

function sanitizeNav(raw: unknown): PeaksNavResume {
  if (!raw || typeof raw !== "object") return { screen: "home" };
  const n = raw as Record<string, unknown>;
  if (n.screen === "found") return { screen: "found" };
  if (n.screen === "continent" && isContinentId(n.continentId)) {
    return { screen: "continent", continentId: n.continentId };
  }
  if (
    n.screen === "country" &&
    isContinentId(n.continentId) &&
    typeof n.countryName === "string" &&
    n.countryName
  ) {
    return {
      screen: "country",
      continentId: n.continentId,
      countryCode: typeof n.countryCode === "string" ? n.countryCode : null,
      countryName: n.countryName,
    };
  }
  return { screen: "home" };
}

export function readPeaksUiResume(): PeaksUiResume | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Record<string, unknown>;
    const tab =
      o.tab === "catalog" || o.tab === "favorites" || o.tab === "home"
        ? o.tab
        : "home";
    return {
      tab,
      nav: sanitizeNav(o.nav),
      openId: typeof o.openId === "string" ? o.openId : null,
      curatorNote: o.curatorNote === true,
    };
  } catch {
    return null;
  }
}

export function writePeaksUiResume(next: PeaksUiResume): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function patchPeaksUiResume(patch: Partial<PeaksUiResume>): void {
  const prev = readPeaksUiResume() ?? {
    tab: "home" as PeaksTabResume,
    nav: { screen: "home" } as PeaksNavResume,
    openId: null,
    curatorNote: false,
  };
  writePeaksUiResume({ ...prev, ...patch });
}
