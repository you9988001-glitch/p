"use client";

import { useState } from "react";
import { IconBack } from "@/components/peaks/ui";
import { PeakArt } from "@/components/peaks/pieces";
import { getPeakById, formatElevation, type Peak } from "@/lib/peaks/data";
import type { AntipodeDiscovery } from "@/lib/peaks/discoveries";
import {
  DISCOVERIES_INTRO,
  PEAKS_ANTIPODE_MATCH_ODDS,
} from "@/lib/peaks/discoveries";

function formatWhen(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(ms));
}

function PeakDiscoveryCard({
  label,
  peak,
  onOpen,
}: {
  label: string;
  peak: Peak;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="pk-press flex h-full min-w-0 flex-col rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-panel)] p-2.5 text-left"
    >
      <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[var(--pk-faint)]">
        {label}
      </p>
      <PeakArt peak={peak} className="mx-auto mt-2 h-14 w-14 shrink-0 rounded-xl" />
      <p className="pk-clamp-2 mt-2 font-display text-[0.82rem] leading-snug text-[var(--pk-ink)]">
        {peak.name}
      </p>
      <p className="pk-nums mt-1 text-[0.75rem] font-semibold text-[var(--pk-forest-deep)]">
        {formatElevation(peak.elevationM)}
      </p>
    </button>
  );
}

function DiscoverySplitView({
  discovery,
  onOpenPeak,
}: {
  discovery: AntipodeDiscovery;
  onOpenPeak: (peakId: string) => void;
}) {
  const from = getPeakById(discovery.fromId);
  const to = getPeakById(discovery.toId);

  return (
    <div className="mx-auto max-w-md">
      <p className="text-[0.88rem] text-[var(--pk-muted)]">
        {formatWhen(discovery.discoveredAt)}
      </p>
      <p className="mt-1 text-[0.8rem] leading-snug text-[var(--pk-muted)]">
        Earth&apos;s opposite sides met here — open either peak.
      </p>

      <div className="relative mt-6 grid grid-cols-2 gap-2">
        {from ? (
          <PeakDiscoveryCard
            label="From"
            peak={from}
            onOpen={() => onOpenPeak(from.id)}
          />
        ) : (
          <div className="rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-panel)] p-3 text-[0.75rem] text-[var(--pk-muted)]">
            From entry unavailable
          </div>
        )}
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-[1.1rem]"
          aria-hidden
        >
          🌍
        </span>
        {to ? (
          <PeakDiscoveryCard
            label="To"
            peak={to}
            onOpen={() => onOpenPeak(to.id)}
          />
        ) : (
          <div className="rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-panel)] p-3 text-[0.75rem] text-[var(--pk-muted)]">
            To entry unavailable
          </div>
        )}
      </div>
    </div>
  );
}

export function DiscoveriesPage({
  discoveries,
  onBack,
  onOpenPeak,
}: {
  discoveries: AntipodeDiscovery[];
  onBack: () => void;
  onOpenPeak: (peakId: string) => void;
}) {
  const [selected, setSelected] = useState<AntipodeDiscovery | null>(null);

  const handleHeaderBack = () => {
    if (selected) setSelected(null);
    else onBack();
  };

  return (
    <div className="fixed inset-0 z-[130] flex flex-col bg-[var(--pk-bg)]">
      <div className="pk-safe-top flex shrink-0 items-center gap-2 border-b border-[var(--pk-line)] px-3 pb-3 pt-3">
        <button
          type="button"
          onClick={handleHeaderBack}
          aria-label="Back"
          className="pk-press inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--pk-ink)] hover:bg-[var(--pk-panel)]"
        >
          <IconBack className="h-5 w-5" />
        </button>
        <h1 className="text-[0.95rem] font-semibold tracking-wide text-[var(--pk-ink)]">
          {selected ? "Discovery" : "Discoveries"}
        </h1>
      </div>

      <div className="pk-safe-bottom min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-5">
        {selected ? (
          <DiscoverySplitView
            discovery={selected}
            onOpenPeak={onOpenPeak}
          />
        ) : (
          <>
            <div className="mx-auto max-w-md space-y-4 text-[0.92rem] leading-relaxed text-[var(--pk-muted)]">
              {DISCOVERIES_INTRO.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            <p className="mx-auto mt-6 max-w-md text-[0.88rem] leading-relaxed text-[var(--pk-ink)]">
              {PEAKS_ANTIPODE_MATCH_ODDS}
            </p>

            <div className="mx-auto mt-10 max-w-md">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--pk-faint)]">
                Your discoveries
              </p>
              {discoveries.length === 0 ? (
                <p className="mt-4 text-[0.88rem] text-[var(--pk-muted)]">
                  No discoveries yet.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {discoveries.map((d) => {
                    const from = getPeakById(d.fromId);
                    const to = getPeakById(d.toId);
                    const fromName = from?.name ?? d.fromId;
                    const toName = to?.name ?? d.toId;
                    return (
                      <li key={`${d.fromId}-${d.toId}-${d.discoveredAt}`}>
                        <button
                          type="button"
                          onClick={() => setSelected(d)}
                          className="pk-press w-full rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-panel)] px-3 py-2.5 text-left"
                        >
                          <p className="text-[0.75rem] text-[var(--pk-muted)]">
                            From {fromName}
                          </p>
                          <p className="mt-0.5 text-[0.92rem] font-semibold text-[var(--pk-ink)]">
                            → {toName}
                          </p>
                          <p className="mt-1 text-[0.72rem] text-[var(--pk-faint)]">
                            {formatWhen(d.discoveredAt)}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
