"use client";

import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------------- Icons (inline, 24x24 stroke) ---------------- */

type IconProps = { className?: string };

function S({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconMountain = ({ className }: IconProps) => (
  <S className={className}>
    <path d="m3 20 6.5-11 4 6 2-3L21 20z" />
    <path d="m8 14.5 1.5-2.5 1.4 2.1" />
  </S>
);

export const IconHome = ({ className }: IconProps) => (
  <S className={className}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10.5V20h12v-9.5" />
  </S>
);

export const IconSearch = ({ className }: IconProps) => (
  <S className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.5-3.5" />
  </S>
);

export const IconStar = ({ className }: IconProps) => (
  <S className={className}>
    <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.9 7.2 19l.9-5.4L4.2 9.7l5.4-.8z" />
  </S>
);

export const IconStarFilled = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? "h-5 w-5"} aria-hidden="true">
    <path d="m12 3.6 2.6 5.3 5.8.9-4.2 4.1 1 5.8L12 17.9l-5.2 2.8 1-5.8-4.2-4.1 5.8-.9z" />
  </svg>
);

export const IconCheck = ({ className }: IconProps) => (
  <S className={className}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </S>
);

export const IconCheckCircle = ({ className }: IconProps) => (
  <S className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12 2.4 2.4L15.5 9.6" />
  </S>
);

export const IconClose = ({ className }: IconProps) => (
  <S className={className}>
    <path d="M6 6 18 18M18 6 6 18" />
  </S>
);

export const IconBack = ({ className }: IconProps) => (
  <S className={className}>
    <path d="M15 5 8 12l7 7" />
  </S>
);

export const IconChevron = ({ className }: IconProps) => (
  <S className={className}>
    <path d="m9 6 6 6-6 6" />
  </S>
);

export const IconChevronDown = ({ className }: IconProps) => (
  <S className={className}>
    <path d="m6 9 6 6 6-6" />
  </S>
);

export const IconFilter = ({ className }: IconProps) => (
  <S className={className}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </S>
);

export const IconList = ({ className }: IconProps) => (
  <S className={className}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <path d="M4 6h.01M4 12h.01M4 18h.01" />
  </S>
);

export const IconGrid = ({ className }: IconProps) => (
  <S className={className}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
  </S>
);

export const IconPin = ({ className }: IconProps) => (
  <S className={className}>
    <path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10Z" />
    <circle cx="12" cy="11" r="2.2" />
  </S>
);

export const IconLayers = ({ className }: IconProps) => (
  <S className={className}>
    <path d="m12 4 8 4-8 4-8-4z" />
    <path d="m4 12 8 4 8-4" />
  </S>
);

export const IconGlobe = ({ className }: IconProps) => (
  <S className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17" />
  </S>
);

export const IconArrow = ({ className }: IconProps) => (
  <S className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </S>
);

export const IconFlag = ({ className }: IconProps) => (
  <S className={className}>
    <path d="M6 21V4M6 5h10l-1.5 3L16 11H6" />
  </S>
);

/* ---------------- Button ---------------- */

type ButtonVariant =
  | "primary"
  | "solid"
  | "outline"
  | "ghost"
  | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const BTN_BASE =
  "pk-press inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[0.95rem] font-semibold disabled:opacity-50 disabled:pointer-events-none select-none";

const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary: "pk-hero-grad text-[var(--pk-on-hero)] shadow-sm",
  solid: "bg-[var(--pk-ink)] text-[var(--pk-panel)]",
  outline: "border border-[var(--pk-line)] bg-[var(--pk-panel)] text-[var(--pk-ink)]",
  ghost: "text-[var(--pk-forest-deep)]",
  danger: "border border-[color-mix(in_oklch,var(--destructive)_40%,transparent)] text-[var(--destructive)]",
};

export function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  return <button className={cx(BTN_BASE, BTN_VARIANTS[variant], className)} {...rest} />;
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({ label, className, children, ...rest }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cx(
        "pk-press inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--pk-ink)]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-panel)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---------------- Pill ---------------- */

type PillTone = "neutral" | "forest" | "moss" | "amber" | "sky";

const PILL_TONES: Record<PillTone, string> = {
  neutral: "bg-[var(--pk-panel-2)] text-[var(--pk-muted)]",
  forest: "bg-[var(--pk-forest-soft)] text-[var(--pk-forest-deep)]",
  moss: "bg-[var(--pk-moss-soft)] text-[color-mix(in_oklch,var(--pk-moss)_70%,black)]",
  amber: "bg-[var(--pk-amber-soft)] text-[color-mix(in_oklch,var(--pk-amber)_60%,black)]",
  sky: "bg-[var(--pk-sky-soft)] text-[color-mix(in_oklch,var(--pk-sky)_60%,black)]",
};

export function Pill({
  tone = "neutral",
  className,
  children,
}: {
  tone?: PillTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold",
        PILL_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Eyebrow / SectionTitle ---------------- */

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--pk-faint)]">
      {children}
    </p>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-[1.35rem] leading-tight text-[var(--pk-ink)]">
      {children}
    </h2>
  );
}

/* ---------------- Spinner ---------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "pk-spin inline-block rounded-full border-2 border-current border-t-transparent",
        className ?? "h-5 w-5",
      )}
      aria-hidden="true"
    />
  );
}

/* ---------------- EmptyState ---------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--pk-forest-soft)] text-[var(--pk-forest-deep)]">
        {icon}
      </div>
      <p className="font-display text-lg text-[var(--pk-ink)]">{title}</p>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-[var(--pk-muted)]">
        {body}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
