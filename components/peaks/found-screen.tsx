"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { usePeaks } from "@/contexts/peaks-context";
import { formatInt, type Peak } from "@/lib/peaks/data";
import { PeakCollection } from "@/components/peaks/peak-card";
import {
  Button,
  cx,
  EmptyState,
  IconCheckCircle,
  IconGrid,
  IconList,
} from "@/components/peaks/ui";

export function FoundScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const { foundPeaks, foundCount, view, setView, setNav, toggleFound, toast } =
    usePeaks();
  const [pending, setPending] = useState<Peak | null>(null);

  const confirmRemove = () => {
    if (!pending) return;
    const name = pending.name;
    if (foundPeaks.some((p) => p.id === pending.id)) {
      toggleFound(pending.id);
      toast(`Removed ${name} from Found`);
    }
    setPending(null);
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-3">
      <button
        type="button"
        onClick={() => setNav({ screen: "home" })}
        className="pk-press mb-4 text-[0.8rem] font-semibold tracking-wide text-[var(--pk-forest)]"
      >
        ← Home
      </button>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-[1.7rem] text-[var(--pk-ink)]">Found</h1>
        {foundPeaks.length > 0 && (
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

      {foundPeaks.length > 0 && (
        <p className="pk-nums mt-1 text-sm text-[var(--pk-muted)]">
          {formatInt(foundCount)} marked
        </p>
      )}

      <div className="mt-4 pb-4">
        {foundPeaks.length === 0 ? (
          <EmptyState
            icon={<IconCheckCircle className="h-7 w-7" />}
            title="No finds yet"
            body="Mark a peak on its detail page — it will appear here. Long-press a card to remove it."
            action={
              <Button variant="primary" onClick={() => setNav({ screen: "home" })}>
                Browse regions
              </Button>
            }
          />
        ) : (
          <PeakCollection
            peaks={foundPeaks}
            view={view}
            onOpen={onOpen}
            onRequestRemove={setPending}
          />
        )}
      </div>

      {pending && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/75 p-5 pk-fade-in">
              <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-sm rounded-3xl border border-[var(--pk-line)] bg-[var(--pk-panel)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--pk-forest)]">
                  Remove mark
                </p>
                <h2 className="font-display mt-2 text-[1.45rem] text-[var(--pk-ink)]">
                  Remove {pending.name}?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--pk-muted)]">
                  This peak will leave your Found list. You can mark it again
                  anytime.
                </p>
                <div className="mt-5 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPending(null)}
                  >
                    No
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={confirmRemove}
                  >
                    Yes
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
