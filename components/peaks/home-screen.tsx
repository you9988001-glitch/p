"use client";

import { useState } from "react";
import {
  CONTINENTS,
  TOTAL_PEAKS,
  formatInt,
  type ContinentId,
} from "@/lib/peaks/data";
import { usePeaks } from "@/contexts/peaks-context";
import { OwnershipProofCard } from "@/components/peaks/ownership-deed-card";
import { LegalFooter } from "@/components/peaks/legal-footer";

const ACCENTS: Record<ContinentId, string> = {
  asia: "from-[#ffd166]/44 to-[#f4a261]/28",
  europe: "from-[#7dd3fc]/30 to-[#2dd4bf]/20",
  africa: "from-[#e8c36a]/35 to-[#f07178]/20",
  "north-america": "from-[#5eead4]/30 to-[#38bdf8]/25",
  "south-america": "from-[#a78bfa]/35 to-[#2dd4bf]/20",
  oceania: "from-[#38bdf8]/30 to-[#2dd4bf]/25",
  antarctica: "from-[#e2e8f0]/25 to-[#7dd3fc]/20",
};

export function HomeScreen() {
  const { foundCount, setNav } = usePeaks();
  const progress = foundCount / TOTAL_PEAKS;
  const peaksRemaining = Math.max(0, TOTAL_PEAKS - foundCount);
  const [narrativeOpen, setNarrativeOpen] = useState(false);

  return (
    <div className="px-5 pb-8 pt-4">
      <header className="mb-6">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[var(--pk-forest)]">
          CODE ARCHE · Peaks
        </p>
        <h1 className="font-display mt-2 text-[2.35rem] leading-[1.05] text-[var(--pk-amber)]">
          Peaks 3141
        </h1>
        <div className="mt-3 space-y-2.5">
          <button
            type="button"
            onClick={() => setNarrativeOpen((v) => !v)}
            aria-expanded={narrativeOpen}
            className="pk-press animate-[pulse_8s_cubic-bezier(0.4,0,0.6,1)_infinite] text-left text-[0.9rem] font-bold leading-[1.65] text-[var(--pk-ink)]"
          >
            [The Birth Narrative of Peaks] {narrativeOpen ? "▾" : "▸"}
          </button>
          <div
            className={`grid overflow-hidden transition-[grid-template-rows] duration-500 ease-out ${
              narrativeOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div
              className={`min-h-0 transition-all duration-500 ease-out ${
                narrativeOpen
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-1.5 opacity-0"
              }`}
            >
              <p className="text-[1.44rem] font-semibold leading-[1.55] text-[color:color-mix(in_oklab,var(--pk-amber)_88%,var(--pk-bg)_12%)]">
                Just like the eternal and unchanging mathematical truth of Pi
                (3.14159), this app was born to embody the unwavering aspirations
                held by pioneers. It was meticulously crafted by examining the grand
                breath of untouched nature evenly distributed across 250 countries
                worldwide, purely capturing the essence of mountains that stand
                quietly in their places without human intervention. Though its roots
                are grand and majestic, it is more than enough if this entire
                narrative can simply be held as a small possession in the palm of
                your hand for daily life.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setNav({ screen: "found" })}
          className="pk-press pk-card mt-5 w-full p-4 text-left"
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--pk-faint)]">
                World atlas
              </p>
              <p className="pk-nums mt-1 text-xl text-[var(--pk-forest-deep)]">
                {formatInt(TOTAL_PEAKS)}
                <span className="text-[var(--pk-faint)]">
                  {" "}
                  / {formatInt(peaksRemaining)}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.62rem] uppercase tracking-wider text-[var(--pk-amber)]">
                Found ›
              </p>
              <p className="pk-nums text-sm text-[var(--pk-amber)]">
                {formatInt(foundCount)}
              </p>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/35">
            <div
              className="h-full rounded-full pk-hero-grad transition-[width] duration-500"
              style={{ width: `${Math.min(100, Math.max(2, (foundCount / TOTAL_PEAKS) * 100 || 2))}%` }}
            />
          </div>
          <p className="mt-2 text-[0.72rem] text-[var(--pk-faint)]">
            Tap Found to browse marked peaks · {((progress || 0) * 100).toFixed(progress < 0.01 ? 2 : 1)}%
          </p>
        </button>
      </header>

      <section className="grid grid-cols-1 gap-3">
        {CONTINENTS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setNav({ screen: "continent", continentId: c.id })}
            className="pk-press pk-card relative overflow-hidden p-4 text-left"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${ACCENTS[c.id]}`}
            />
            <div className="relative flex items-start justify-between gap-3 max-sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-display text-[1.55rem] leading-none text-[var(--pk-ink)] max-sm:text-[1.4rem]">
                  {c.name}
                </p>
                <p className="pk-clamp-2 mt-2 text-[0.84rem] leading-snug text-[var(--pk-muted)] max-sm:text-[0.76rem]">
                  {c.blurb}
                </p>
              </div>
              <div className="shrink-0 rounded-xl border border-[var(--pk-line)] bg-black/25 px-2.5 py-2 text-right max-sm:rounded-lg max-sm:px-2 max-sm:py-1.5">
                <p className="pk-nums text-sm text-[var(--pk-forest-deep)] max-sm:text-[0.79rem]">
                  {formatInt(c.peakCount)}
                </p>
                <p className="text-[0.62rem] uppercase tracking-wider text-[var(--pk-faint)] max-sm:text-[0.56rem]">
                  peaks
                </p>
                <p className="pk-nums mt-1 text-[0.75rem] text-[var(--pk-amber)] max-sm:mt-0.5 max-sm:text-[0.68rem]">
                  {formatInt(c.countryCount)} flags
                </p>
              </div>
            </div>
          </button>
        ))}
      </section>

      <OwnershipProofCard />
      <LegalFooter />
    </div>
  );
}
