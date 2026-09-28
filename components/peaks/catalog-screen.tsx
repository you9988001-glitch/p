"use client";

import { useMemo, useState } from "react";
import { usePeaks } from "@/contexts/peaks-context";
import {
  CONTINENTS,
  formatElevation,
  formatInt,
  indexToPeak,
  type ContinentId,
} from "@/lib/peaks/data";
import { PeakListRow } from "@/components/peaks/peak-card";
import { EmptyState, IconMountain, IconSearch } from "@/components/peaks/ui";

export function CatalogScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const { peakIndex, indexReady, setTab, setNav } = usePeaks();
  const [q, setQ] = useState("");
  const [continent, setContinent] = useState<ContinentId | "">("");

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = peakIndex;
    if (continent) rows = rows.filter((p) => p.continent === continent);
    if (needle) {
      rows = rows.filter((p) => {
        const bag = `${p.name} ${p.country} ${p.range}`.toLowerCase();
        return bag.includes(needle);
      });
    }
    return rows.slice(0, 120).map(indexToPeak);
  }, [peakIndex, q, continent]);

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-5 pb-6 md:max-w-2xl">
      <h1 className="font-display text-[1.9rem] text-[var(--pk-ink)]">Catalog</h1>
      <p className="mt-1 text-sm text-[var(--pk-muted)]">
        Fast search across {indexReady ? formatInt(peakIndex.length) : "…"} peaks.
      </p>

      <div className="relative mt-4">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pk-faint)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or country…"
          className="w-full rounded-xl border border-[var(--pk-line)] bg-black/25 py-2.5 pl-9 pr-3 text-sm text-[var(--pk-ink)] outline-none placeholder:text-[var(--pk-faint)] focus:border-[var(--pk-forest)]"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setContinent("")}
          className={`pk-press shrink-0 rounded-full border px-3 py-1.5 text-[0.75rem] ${
            !continent
              ? "border-transparent bg-[var(--pk-forest)] text-[var(--pk-on-hero)]"
              : "border-[var(--pk-line)] text-[var(--pk-muted)]"
          }`}
        >
          All
        </button>
        {CONTINENTS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setContinent(c.id)}
            className={`pk-press shrink-0 rounded-full border px-3 py-1.5 text-[0.75rem] ${
              continent === c.id
                ? "border-transparent bg-[var(--pk-forest)] text-[var(--pk-on-hero)]"
                : "border-[var(--pk-line)] text-[var(--pk-muted)]"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <p className="pk-nums mt-3 text-[0.75rem] text-[var(--pk-faint)]">
        Showing {results.length}
        {results[0] ? ` · top ${formatElevation(results[0].elevationM)}` : ""}
      </p>

      <div className="mt-3 grid gap-2">
        {!indexReady ? (
          <div className="pk-card p-5 text-center text-sm text-[var(--pk-muted)]">
            Warming catalog index…
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={<IconMountain className="h-7 w-7" />}
            title="No matches"
            body="Try another spelling, or browse by region cards on Home."
            action={
              <button
                type="button"
                className="text-sm font-semibold text-[var(--pk-forest)]"
                onClick={() => {
                  setTab("home");
                  setNav({ screen: "home" });
                }}
              >
                Back to regions
              </button>
            }
          />
        ) : (
          results.map((p) => <PeakListRow key={p.id} peak={p} onOpen={onOpen} />)
        )}
      </div>
    </div>
  );
}
