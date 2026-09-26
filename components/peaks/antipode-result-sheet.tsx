"use client";

import { useEffect, useState } from "react";
import type { AntipodeTapResult } from "@/lib/peaks/antipode-tap";
import type { LivePeakTime } from "@/lib/peaks/live-time";
import { getPeakById, formatElevation } from "@/lib/peaks/data";
import { PeakArt } from "@/components/peaks/pieces";
import {
  AntipodeTapNoticePanel,
  LiveTimeCard,
} from "@/components/peaks/live-time-card";
import { IconBack } from "@/components/peaks/ui";

function useHomelandLive(
  countryCode: string | null | undefined,
  lat?: number | null,
) {
  const [live, setLive] = useState<LivePeakTime | null>(null);
  useEffect(() => {
    if (!countryCode) {
      setLive(null);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      const { getLivePeakTime } = await import("@/lib/peaks/live-time");
      const next = await getLivePeakTime(countryCode, new Date(), lat);
      if (!cancelled) setLive(next);
    };
    void tick();
    const id = setInterval(() => void tick(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [countryCode, lat]);
  return live;
}

function MatchPair({
  fromId,
  toId,
  distanceKm,
}: {
  fromId: string;
  toId: string;
  distanceKm: number;
}) {
  const from = getPeakById(fromId);
  const to = getPeakById(toId);
  const fromLive = useHomelandLive(from?.countryCode, from?.lat);
  const toLive = useHomelandLive(to?.countryCode, to?.lat);

  if (!from || !to) {
    return (
      <p className="text-[0.8rem] text-[var(--pk-muted)]">
        Catalog entries unavailable.
      </p>
    );
  }

  const region = (p: typeof from) =>
    p ? `${p.countryCode} · ${formatElevation(p.elevationM)}` : undefined;

  const toLiveDisplay: LivePeakTime = toLive
    ? { ...toLive, regionLabel: region(to) }
    : {
        timeZone: "UTC",
        localTime: "--:--",
        hemisphere: "Northern",
        season: "Spring",
        regionLabel: region(to),
      };

  const fromLiveDisplay: LivePeakTime = fromLive
    ? { ...fromLive, regionLabel: region(from) }
    : {
        timeZone: "UTC",
        localTime: "--:--",
        hemisphere: "Northern",
        season: "Spring",
        regionLabel: region(from),
      };

  return (
    <>
      <p className="text-center text-[0.75rem] leading-snug text-[var(--pk-muted)]">
        Catalog match on the opposite side — ~{distanceKm} km from the antipode
        point. Saved to Discoveries.
      </p>
      <div className="relative mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[var(--pk-faint)]">
            From
          </p>
          <div className="mb-2 flex items-center gap-2">
            <PeakArt peak={from} className="h-11 w-11 shrink-0 rounded-xl" />
            <p className="font-display text-[0.9rem] font-semibold text-[var(--pk-ink)]">
              {from.name}
            </p>
          </div>
          <LiveTimeCard
            inPair
            interactive={false}
            live={fromLiveDisplay}
            kicker={"Right now, in this peak's homeland"}
          />
        </div>
        <span
          className="pointer-events-none absolute left-1/2 top-[42%] z-10 hidden -translate-x-1/2 text-[1.1rem] sm:block"
          aria-hidden
        >
          🌍
        </span>
        <div className="min-w-0">
          <p className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[var(--pk-faint)]">
            To
          </p>
          <div className="mb-2 flex items-center gap-2">
            <PeakArt peak={to} className="h-11 w-11 shrink-0 rounded-xl" />
            <p className="font-display text-[0.9rem] font-semibold text-[var(--pk-ink)]">
              {to.name}
            </p>
          </div>
          <LiveTimeCard
            inPair
            interactive={false}
            live={toLiveDisplay}
            kicker={"Right now, in this peak's homeland"}
          />
        </div>
      </div>
    </>
  );
}

export function AntipodeResultSheet({
  fromId,
  tap,
  onClose,
}: {
  fromId: string;
  tap: AntipodeTapResult;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isMatch = tap.kind === "open-detail";

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/75 p-0 pk-fade-in sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pk-antipode-sheet-title"
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-[var(--pk-line)] bg-[var(--pk-panel-solid)] shadow-[0_24px_60px_rgba(0,0,0,0.65)] sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto overscroll-contain px-4 pb-8 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="pk-press mb-3 inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-[0.8rem] font-medium text-[var(--pk-muted)] hover:bg-[var(--pk-panel-2)]"
          >
            <IconBack size={18} />
            Back
          </button>

          {isMatch ? (
            <>
              <p
                id="pk-antipode-sheet-title"
                className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-[var(--pk-sky)]"
              >
                <span className="mr-1" aria-hidden>
                  ✨
                </span>
                A rare find
              </p>
              <MatchPair
                fromId={fromId}
                toId={tap.peakId}
                distanceKm={tap.distanceKm}
              />
            </>
          ) : (
            <>
              <h2 id="pk-antipode-sheet-title" className="sr-only">
                Opposite side of Earth
              </h2>
              <AntipodeTapNoticePanel tap={tap} embedded />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
