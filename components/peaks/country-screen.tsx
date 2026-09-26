"use client";

import { useEffect, useMemo, useState } from "react";
import {
  flagEmoji,
  flagUrl,
  formatElevation,
  loadContinentPeaks,
  type ContinentId,
  type Peak,
} from "@/lib/peaks/data";
import { usePeaks } from "@/contexts/peaks-context";
import { PeakListRow } from "@/components/peaks/peak-card";

export function CountryScreen({
  continentId,
  countryCode,
  countryName,
  onOpen,
}: {
  continentId: ContinentId;
  countryCode: string | null;
  countryName: string;
  onOpen: (id: string) => void;
}) {
  const { setNav } = usePeaks();
  const [peaks, setPeaks] = useState<Peak[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    setPeaks(null);
    loadContinentPeaks(continentId).then((rows) => {
      if (!alive) return;
      const filtered = rows.filter((p) => {
        if (countryCode) return (p.countryCode || "").toUpperCase() === countryCode.toUpperCase();
        return p.country === countryName;
      });
      filtered.sort((a, b) => b.elevationM - a.elevationM || a.name.localeCompare(b.name));
      setPeaks(filtered);
    });
    return () => {
      alive = false;
    };
  }, [continentId, countryCode, countryName]);

  const shown = useMemo(() => {
    if (!peaks) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return peaks;
    return peaks.filter((p) => p.name.toLowerCase().includes(needle));
  }, [peaks, q]);

  const src = flagUrl(countryCode, 80);

  return (
    <div className="mx-auto max-w-md px-5 pb-8 pt-3">
      <button
        type="button"
        onClick={() => setNav({ screen: "continent", continentId })}
        className="pk-press mb-4 text-[0.8rem] font-semibold tracking-wide text-[var(--pk-forest)]"
      >
        ← Countries
      </button>

      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[var(--pk-line)] bg-black/30 text-2xl">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{flagEmoji(countryCode)}</span>
          )}
        </span>
        <div>
          <h1 className="font-display text-[1.9rem] leading-none text-[var(--pk-ink)]">
            {countryName}
          </h1>
          <p className="mt-1 text-[0.82rem] text-[var(--pk-muted)]">
            {peaks ? `${shown.length} peaks` : "Loading peaks…"}
          </p>
        </div>
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search peaks…"
        className="mb-3 w-full rounded-xl border border-[var(--pk-line)] bg-black/25 px-3.5 py-2.5 text-sm text-[var(--pk-ink)] outline-none placeholder:text-[var(--pk-faint)] focus:border-[var(--pk-forest)]"
      />

      {!peaks && (
        <div className="pk-card p-5 text-center text-sm text-[var(--pk-muted)]">
          Loading catalog…
        </div>
      )}

      <div className="grid gap-2">
        {shown.map((p) => (
          <PeakListRow key={p.id} peak={p} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
