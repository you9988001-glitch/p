"use client";

import { useCallback } from "react";
import { usePeaks } from "@/contexts/peaks-context";
import { formatElevation, type Peak } from "@/lib/peaks/data";
import { useLongPress } from "@/lib/peaks/use-long-press";
import { PeakArt, FoundDot } from "@/components/peaks/pieces";
import { cx, IconStar, IconStarFilled } from "@/components/peaks/ui";

function FavButton({ id }: { id: string }) {
  const { isFav, toggleFav } = usePeaks();
  const fav = isFav(id);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFav(id);
      }}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={fav}
      className={cx(
        "pk-press inline-flex h-9 w-9 items-center justify-center rounded-full",
        fav ? "text-[var(--pk-amber)]" : "text-[var(--pk-faint)]",
      )}
    >
      {fav ? <IconStarFilled className="h-5 w-5" /> : <IconStar className="h-5 w-5" />}
    </button>
  );
}

export function PeakListRow({
  peak,
  onOpen,
  onRequestRemove,
}: {
  peak: Peak;
  onOpen: (id: string) => void;
  onRequestRemove?: (peak: Peak) => void;
}) {
  const { isFound } = usePeaks();
  const found = isFound(peak.id);
  const onLong = useCallback(() => {
    onRequestRemove?.(peak);
  }, [onRequestRemove, peak]);
  const { bind, didLongPress } = useLongPress(onLong);

  return (
    <button
      type="button"
      {...(onRequestRemove ? bind : {})}
      onClick={() => {
        if (didLongPress()) return;
        onOpen(peak.id);
      }}
      className="pk-press flex w-full items-center gap-3 rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-panel)] p-2.5 text-left select-none"
      style={onRequestRemove ? { touchAction: "manipulation" } : undefined}
    >
      <PeakArt peak={peak} className="h-16 w-16 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="pk-clamp-1 font-display text-[1.05rem] leading-snug text-[var(--pk-ink)]">
            {peak.name}
          </p>
          {found && <FoundDot />}
        </div>
        <p className="pk-nums mt-1 text-sm font-semibold text-[var(--pk-forest-deep)]">
          {formatElevation(peak.elevationM)}
        </p>
      </div>
      <FavButton id={peak.id} />
    </button>
  );
}

export function PeakGridCard({
  peak,
  onOpen,
  onRequestRemove,
}: {
  peak: Peak;
  onOpen: (id: string) => void;
  onRequestRemove?: (peak: Peak) => void;
}) {
  const { isFound } = usePeaks();
  const found = isFound(peak.id);
  const onLong = useCallback(() => {
    onRequestRemove?.(peak);
  }, [onRequestRemove, peak]);
  const { bind, didLongPress } = useLongPress(onLong);

  return (
    <button
      type="button"
      {...(onRequestRemove ? bind : {})}
      onClick={() => {
        if (didLongPress()) return;
        onOpen(peak.id);
      }}
      className="pk-press flex flex-col overflow-hidden rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-panel)] text-left select-none"
      style={onRequestRemove ? { touchAction: "manipulation" } : undefined}
    >
      <div className="relative">
        <PeakArt peak={peak} className="aspect-[4/3] w-full" />
        <div className="absolute right-2 top-2">
          <div className="rounded-full bg-black/40 p-0.5 backdrop-blur">
            <FavButton id={peak.id} />
          </div>
        </div>
        {found && (
          <div className="absolute left-2 top-2">
            <FoundDot />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="pk-clamp-1 font-display text-[1rem] leading-snug text-[var(--pk-ink)]">
          {peak.name}
        </p>
        <p className="pk-nums mt-1.5 text-[0.82rem] font-semibold text-[var(--pk-forest-deep)]">
          {formatElevation(peak.elevationM)}
        </p>
      </div>
    </button>
  );
}

export function PeakCollection({
  peaks,
  view,
  onOpen,
  onRequestRemove,
}: {
  peaks: Peak[];
  view: "list" | "grid";
  onOpen: (id: string) => void;
  onRequestRemove?: (peak: Peak) => void;
}) {
  if (view === "grid") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {peaks.map((p) => (
          <PeakGridCard
            key={p.id}
            peak={p}
            onOpen={onOpen}
            onRequestRemove={onRequestRemove}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {peaks.map((p) => (
        <PeakListRow
          key={p.id}
          peak={p}
          onOpen={onOpen}
          onRequestRemove={onRequestRemove}
        />
      ))}
    </div>
  );
}
