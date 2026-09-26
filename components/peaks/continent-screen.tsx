"use client";

import { useMemo } from "react";
import {
  COUNTRIES_BY_CONTINENT,
  continentMeta,
  flagEmoji,
  flagUrl,
  formatInt,
  formatElevation,
  type ContinentId,
} from "@/lib/peaks/data";
import { usePeaks } from "@/contexts/peaks-context";

export function ContinentScreen({ continentId }: { continentId: ContinentId }) {
  const { setNav } = usePeaks();
  const meta = continentMeta(continentId);
  const countries = useMemo(() => {
    const rows = COUNTRIES_BY_CONTINENT[continentId] ?? [];
    return [...rows].sort((a, b) => a.name.localeCompare(b.name, "en"));
  }, [continentId]);

  return (
    <div className="px-5 pb-8 pt-3">
      <button
        type="button"
        onClick={() => setNav({ screen: "home" })}
        className="pk-press mb-4 text-[0.8rem] font-semibold tracking-wide text-[var(--pk-forest)]"
      >
        ← Regions
      </button>

      <header className="mb-5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--pk-faint)]">
          Region
        </p>
        <h1 className="font-display mt-1 text-[2.1rem] leading-none text-[var(--pk-ink)]">
          {meta?.name ?? continentId}
        </h1>
        <p className="mt-2 text-[0.9rem] text-[var(--pk-muted)]">{meta?.blurb}</p>
        <p className="pk-nums mt-3 text-[0.8rem] text-[var(--pk-amber)]">
          {formatInt(countries.length)} countries · {formatInt(meta?.peakCount ?? 0)} peaks
        </p>
      </header>

      <div className="grid grid-cols-1 gap-2">
        {countries.map((c) => {
          const src = flagUrl(c.code, 80);
          return (
            <button
              key={`${c.code ?? c.name}`}
              type="button"
              onClick={() =>
                setNav({
                  screen: "country",
                  continentId,
                  countryCode: c.code,
                  countryName: c.name,
                })
              }
              className="pk-press pk-card flex items-center gap-3 px-3.5 py-3 text-left"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--pk-line)] bg-black/30 text-xl">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span aria-hidden>{flagEmoji(c.code)}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[1.2rem] leading-none text-[var(--pk-ink)]">
                  {c.name}
                </span>
                <span className="mt-1 block text-[0.78rem] text-[var(--pk-muted)]">
                  {formatInt(c.count)} peaks · high {formatElevation(c.maxElev)}
                </span>
              </span>
              <span className="text-[var(--pk-faint)]">›</span>
            </button>
          );
        })}
        {countries.length === 0 && (
          <p className="pk-card p-4 text-sm text-[var(--pk-muted)]">
            No countries in this region yet.
          </p>
        )}
      </div>
    </div>
  );
}
