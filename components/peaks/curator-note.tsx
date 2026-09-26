"use client";

import {
  CODE_ARCHE_APPS,
  CURATOR_NOTE_LINES,
  isCuratorHeading,
  type CodeArcheAppId,
} from "@/lib/code-arche-apps";
import { IconBack } from "@/components/peaks/ui";

export function CuratorNotePage({
  currentApp,
  onBack,
  beforeExternalNav,
}: {
  currentApp: CodeArcheAppId;
  onBack: () => void;
  /** Pi Browser may kill the webview before pagehide — save resume synchronously. */
  beforeExternalNav?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[130] flex flex-col bg-[var(--pk-bg)]">
      <div className="pk-safe-top flex shrink-0 items-center gap-2 border-b border-[var(--pk-line)] px-3 pb-3 pt-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="pk-press inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--pk-ink)] hover:bg-[var(--pk-panel)]"
        >
          <IconBack className="h-5 w-5" />
        </button>
        <h1 className="text-[0.95rem] font-semibold tracking-wide text-[var(--pk-ink)]">
          Curator&apos;s note
        </h1>
      </div>

      <div className="pk-safe-bottom min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-5">
        <div className="mx-auto max-w-md space-y-4 text-[0.92rem] leading-relaxed text-[var(--pk-muted)]">
          {CURATOR_NOTE_LINES.map((line) =>
            isCuratorHeading(line) ? (
              <p
                key={line}
                className={
                  line.startsWith("[")
                    ? "font-display text-[1.15rem] font-semibold leading-snug text-[var(--pk-ink)]"
                    : line.startsWith("Peaks3141 &")
                      ? "pt-1 text-[0.88rem] font-semibold text-[var(--pk-amber)]"
                      : "pt-2 text-[0.98rem] font-semibold text-[var(--pk-ink)]"
                }
              >
                {line}
              </p>
            ) : (
              <p key={line}>{line}</p>
            ),
          )}
        </div>

        <div className="mx-auto mt-10 max-w-md">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--pk-faint)]">
            More from this Curator
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {CODE_ARCHE_APPS.map((app) => {
              const here = app.id === currentApp;
              const body = (
                <>
                  <span className="min-w-0 flex-1 truncate font-medium text-[var(--pk-ink)]">
                    {app.name}
                  </span>
                  {app.badge ? (
                    <span className="shrink-0 rounded-full bg-[var(--pk-amber-soft)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[color-mix(in_oklch,var(--pk-amber)_65%,black)]">
                      {app.badge}
                    </span>
                  ) : null}
                  {here ? (
                    <span className="shrink-0 text-[0.72rem] text-[var(--pk-faint)]">
                      You are here
                    </span>
                  ) : null}
                </>
              );
              if (here || !app.url) {
                return (
                  <li
                    key={app.id}
                    className="flex items-center gap-2 rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-panel)] px-3 py-2.5"
                  >
                    {body}
                  </li>
                );
              }
              return (
                <li key={app.id}>
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={() => beforeExternalNav?.()}
                    onClick={() => beforeExternalNav?.()}
                    className="pk-press flex w-full items-center gap-2 rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-panel)] px-3 py-2.5 text-left"
                  >
                    {body}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
