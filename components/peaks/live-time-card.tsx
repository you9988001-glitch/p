"use client";

import { type ReactNode } from "react";
import type { LivePeakTime } from "@/lib/peaks/live-time";
import { isDaytimeLocal } from "@/lib/peaks/live-time";
import type { AntipodeTapResult } from "@/lib/peaks/antipode-tap";

function SkyIcon({ localTime }: { localTime: string }) {
  const day = isDaytimeLocal(localTime);
  return (
    <span className="text-[1.35rem] leading-none" aria-hidden>
      {day ? "☀️" : "🌙"}
    </span>
  );
}

function formatPlaceLead(description: string): string {
  const t = description.trim();
  if (!t) return "Open ocean";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function TapPanelKicker({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "ocean";
}) {
  const className =
    variant === "ocean"
      ? "text-[0.58rem] font-bold uppercase tracking-[0.2em] text-orange-400/90"
      : "text-[0.58rem] font-bold uppercase tracking-[0.2em] text-[var(--pk-sky)]";
  return <p className={className}>{children}</p>;
}

export function AntipodeTapNoticePanel({
  tap,
  embedded = false,
}: {
  tap: AntipodeTapResult;
  embedded?: boolean;
}) {
  const box = embedded
    ? "rounded-xl border border-[var(--pk-line)] bg-[var(--pk-panel-2)] px-3 py-2.5 text-[0.72rem] leading-snug text-[var(--pk-muted)]"
    : "mt-2 rounded-xl border border-[var(--pk-line)] bg-[var(--pk-panel-2)] px-3 py-2.5 text-[0.72rem] leading-snug text-[var(--pk-muted)]";
  if (tap.kind === "outside-catalog") {
    return (
      <div className={box}
        role="status"
      >
        <TapPanelKicker>Outside the catalog</TapPanelKicker>
        <p className="mt-1.5 text-[0.88rem] font-semibold text-[var(--pk-ink)]">
          {tap.countryName}
        </p>
        <p className="mt-1">
          A real place on the far side of Earth. Peaks 3141 does not include
          mountains here — the map ends at 3,141 entries, not at the whole
          world.
        </p>
      </div>
    );
  }
  if (tap.kind === "no-nearby-peak") {
    return (
      <div className={box} role="status">
        <TapPanelKicker>No nearby peak</TapPanelKicker>
        <p className="mt-1.5 text-[0.88rem] font-semibold text-[var(--pk-ink)]">
          {tap.countryName}
        </p>
        <p className="mt-1">
          The antipode falls in {tap.countryName}, which we cover — but no
          catalog peak lies within 300 km of this exact point. You still
          learned where Earth&apos;s opposite side touches land.
        </p>
      </div>
    );
  }
  if (tap.kind === "antarctica") {
    return (
      <div className={box} role="status">
        <TapPanelKicker>Antarctica</TapPanelKicker>
        <p className="mt-1.5 text-[0.88rem] font-semibold text-[var(--pk-ink)]">
          Far-side ice
        </p>
        <p className="mt-1">
          Ice on the far side of the planet — no catalog peak close enough from
          here. A quiet end to the hunt, not an error.
        </p>
      </div>
    );
  }
  if (tap.kind === "ocean") {
    return (
      <div
        className={
          embedded
            ? "rounded-xl border border-orange-400/40 bg-orange-400/10 px-3 py-2.5 text-[0.72rem] leading-snug text-orange-300"
            : "mt-2 rounded-xl border border-orange-400/40 bg-orange-400/10 px-3 py-2.5 text-[0.72rem] leading-snug text-orange-300"
        }
        role="status"
      >
        <TapPanelKicker variant="ocean">Open ocean</TapPanelKicker>
        <p className="mt-1.5 text-[0.88rem] font-semibold text-orange-200">
          {formatPlaceLead(tap.description)}
        </p>
        <p className="mt-1">
          Open ocean at the antipode — no country and no catalog entry here.
          Finding where the line through Earth meets the sea is still the
          discovery.
        </p>
        <p className="mt-1 text-orange-400/90">({tap.coords})</p>
      </div>
    );
  }
  return (
    <div className={box} role="status">
      <TapPanelKicker>Beyond calculation</TapPanelKicker>
      <p className="mt-1.5 text-[0.88rem] font-semibold text-[var(--pk-ink)]">
        A place beyond calculation
      </p>
      <p className="mt-1">
        This entry sits outside what we can plot through the globe — not a
        broken hunt, just coordinates the catalog cannot anchor. Try another
        item with a mapped homeland to keep exploring.
      </p>
    </div>
  );
}

export function LiveTimeCard({
  live,
  kicker,
  contrast = false,
  inPair = false,
  onAntipodeTap,
  interactive = true,
}: {
  live: LivePeakTime;
  kicker: string;
  contrast?: boolean;
  inPair?: boolean;
  onAntipodeTap?: (tap: AntipodeTapResult) => void;
  interactive?: boolean;
}) {
  const isAntipode = contrast;
  const tap = live.tapResult;
  const tappable = isAntipode && interactive && tap && onAntipodeTap;

  const margin = inPair ? "" : contrast ? "mt-6" : "mt-5";
  const shellClass = contrast
    ? `${margin} scroll-mt-24 rounded-2xl border border-[var(--pk-sky)]/55 bg-gradient-to-br from-[var(--pk-panel)] to-[rgba(56,120,180,0.12)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`
    : `${margin} scroll-mt-24 rounded-2xl border border-[var(--pk-sky)]/45 bg-gradient-to-br from-[var(--pk-panel)] to-[rgba(56,120,180,0.08)] p-4`;
  const tapClass = isAntipode
    ? " pk-press cursor-pointer text-left transition hover:border-[var(--pk-sky)]/80 hover:brightness-110 active:scale-[0.99]"
    : "";

  const handleTap = () => {
    if (!tappable || !tap) return;
    onAntipodeTap!(tap);
  };

  const hint = isAntipode && interactive
    ? "Tap to see what lies on the opposite side of Earth"
    : null;

  const showHint = isAntipode && interactive && hint;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[var(--pk-forest)]">
          {kicker}
        </p>
        {live.localTime !== "--:--" ? (
          <SkyIcon localTime={live.localTime} />
        ) : null}
      </div>
      {live.localTime !== "--:--" ? (
        <>
          <p className="pk-nums mt-2 text-[1.7rem] font-semibold text-[var(--pk-ink)]">
            {live.localTime}{" "}
            <span className="text-[0.8rem] font-normal text-[var(--pk-muted)]">
              local
            </span>
          </p>
          {live.regionLabel ? (
            <p className="mt-1.5 text-[0.88rem] font-semibold text-[var(--pk-ink)]">
              {live.regionLabel}
            </p>
          ) : null}
          <p className="mt-0.5 text-[0.75rem] text-[var(--pk-muted)]">
            {live.season} · {live.hemisphere} hemisphere
          </p>
        </>
      ) : null}

      {showHint ? (
        <p className="mt-2 text-[0.68rem] font-medium text-[var(--pk-muted)]">
          {hint}
        </p>
      ) : null}
    </>
  );

  if (tappable) {
    return (
      <button
        type="button"
        onClick={handleTap}
        className={`${shellClass}${tapClass} w-full`}
      >
        {inner}
      </button>
    );
  }

  return <div className={shellClass}>{inner}</div>;
}
