"use client";

import { usePeaks } from "@/contexts/peaks-context";
import { formatInt } from "@/lib/peaks/data";
import { PeakCollection } from "@/components/peaks/peak-card";
import {
  Button,
  cx,
  EmptyState,
  IconGrid,
  IconList,
  IconStar,
} from "@/components/peaks/ui";

export function FavoritesScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const { favoritePeaks, view, setView, setTab } = usePeaks();

  return (
    <div className="mx-auto max-w-md px-5 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[1.7rem] text-[var(--pk-ink)]">
          Favorites
        </h1>
        {favoritePeaks.length > 0 && (
          <div className="inline-flex overflow-hidden rounded-full border border-[var(--pk-line)]">
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              className={cx(
                "pk-press flex h-9 w-10 items-center justify-center",
                view === "list"
                  ? "bg-[var(--pk-forest)] text-[var(--pk-on-hero)]"
                  : "bg-[var(--pk-panel)] text-[var(--pk-muted)]",
              )}
            >
              <IconList className="h-5 w-5" />
            </button>
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              className={cx(
                "pk-press flex h-9 w-10 items-center justify-center",
                view === "grid"
                  ? "bg-[var(--pk-forest)] text-[var(--pk-on-hero)]"
                  : "bg-[var(--pk-panel)] text-[var(--pk-muted)]",
              )}
            >
              <IconGrid className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {favoritePeaks.length > 0 && (
        <p className="pk-nums mt-1 text-sm text-[var(--pk-muted)]">
          {formatInt(favoritePeaks.length)} saved
        </p>
      )}

      <div className="mt-4 pb-4">
        {favoritePeaks.length === 0 ? (
          <EmptyState
            icon={<IconStar className="h-7 w-7" />}
            title="No favorites yet"
            body="Star a peak from its page to keep it here for quick reference."
            action={
              <Button variant="primary" onClick={() => setTab("catalog")}>
                Browse catalog
              </Button>
            }
          />
        ) : (
          <PeakCollection peaks={favoritePeaks} view={view} onOpen={onOpen} />
        )}
      </div>
    </div>
  );
}
