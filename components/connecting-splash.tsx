"use client";

import { useEffect, useState } from "react";
import { usePiAuth } from "@/contexts/pi-auth-context";

type Tone = "peaks" | "voice";

const COPY = {
  peaks: {
    brand: "CODE ARCHE · Peaks 3141",
    title: "Connecting…",
  },
  voice: {
    brand: "CODE ARCHE · Voice 3141",
    title: "Connecting…",
  },
} as const;

/** Hardcoded colors so splash still paints if CSS variables fail. */
const THEME = {
  accent: "#2dd4bf",
  ink: "#eef3f7",
  muted: "#9db0c0",
  panel: "rgba(26, 11, 46, 0.92)",
  line: "rgba(45, 212, 191, 0.28)",
} as const;

/**
 * Friendly first-open splash while Pi auth boots.
 * Never blocks forever — auto-dismisses so a hung auth still reveals the app.
 */
export function ConnectingSplash({ tone }: { tone: Tone }) {
  const { isAuthenticated, hasError, authMessage, reinitialize } = usePiAuth();
  const [visible, setVisible] = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);
  const copy = COPY[tone];

  useEffect(() => {
    document.getElementById("ca-boot-splash")?.remove();
  }, []);

  useEffect(() => {
    const min = window.setTimeout(() => setMinElapsed(true), 700);
    const max = window.setTimeout(() => setVisible(false), 14000);
    return () => {
      window.clearTimeout(min);
      window.clearTimeout(max);
    };
  }, []);

  useEffect(() => {
    if (minElapsed && (isAuthenticated || hasError)) {
      const t = window.setTimeout(() => setVisible(false), hasError ? 0 : 350);
      return () => window.clearTimeout(t);
    }
  }, [isAuthenticated, hasError, minElapsed]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, rgba(124,58,237,0.35), transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(45,212,191,0.22), transparent 50%), #0a0414",
        fontFamily: "system-ui, sans-serif",
      }}
      role="status"
      aria-live="polite"
      aria-busy={!hasError}
    >
      <div
        className="w-full max-w-sm rounded-3xl border px-6 py-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        style={{ borderColor: THEME.line, background: THEME.panel }}
      >
        <p
          className="text-[0.68rem] font-semibold uppercase tracking-[0.28em]"
          style={{ color: THEME.accent }}
        >
          {copy.brand}
        </p>

        {!hasError ? (
          <div className="relative mx-auto mt-6 flex h-16 w-16 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full border-2 opacity-25"
              style={{ borderColor: THEME.accent }}
            />
            <span
              className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
              style={{
                borderTopColor: THEME.accent,
                borderRightColor: THEME.accent,
                animationDuration: "0.9s",
              }}
            />
          </div>
        ) : (
          <div
            className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
            style={{ background: "rgba(240,113,120,0.15)", color: "#f07178" }}
          >
            !
          </div>
        )}

        <h1 className="mt-5 text-[1.85rem] font-bold leading-tight" style={{ color: THEME.ink }}>
          {hasError ? "Connection stalled" : copy.title}
        </h1>
        {hasError && (
          <p className="mt-2 text-[0.95rem] leading-relaxed" style={{ color: THEME.muted }}>
            {authMessage}
          </p>
        )}

        {!hasError && (
          <div
            className="ca-connect-track mx-auto mt-6 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            <div
              className="ca-connect-bar h-full w-1/2 rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${THEME.accent}, transparent)`,
              }}
            />
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {hasError && (
            <button
              type="button"
              onClick={() => reinitialize()}
              className="rounded-full px-5 py-3 text-sm font-semibold"
              style={{ background: THEME.accent, color: "#071018" }}
            >
              Try again
            </button>
          )}
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded-full border px-5 py-2.5 text-sm font-semibold"
            style={{ borderColor: THEME.line, color: THEME.muted }}
          >
            {hasError ? "Continue anyway" : "Continue while connecting"}
          </button>
        </div>
      </div>
    </div>
  );
}
