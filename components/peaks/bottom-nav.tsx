"use client";

import { usePeaks, type TabId } from "@/contexts/peaks-context";
import { cx, IconHome, IconSearch, IconStar } from "@/components/peaks/ui";
import type { ComponentType } from "react";

type IconType = ComponentType<{ className?: string }>;

const TABS: { id: TabId; label: string; icon: IconType }[] = [
  { id: "home", label: "Regions", icon: IconHome },
  { id: "catalog", label: "Catalog", icon: IconSearch },
  { id: "favorites", label: "Favorites", icon: IconStar },
];

export function BottomNav() {
  const { tab, setTab, favCount } = usePeaks();
  return (
    <nav className="pk-safe-bottom fixed inset-x-0 bottom-0 z-[80] border-t border-[var(--pk-line)] bg-[color-mix(in_oklch,var(--pk-panel)_92%,transparent)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="pk-press relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5"
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <Icon
                  className={cx(
                    "h-6 w-6 transition-colors",
                    active ? "text-[var(--pk-forest-deep)]" : "text-[var(--pk-faint)]",
                  )}
                />
                {id === "favorites" && favCount > 0 && (
                  <span className="pk-nums absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-[var(--pk-amber)] px-1 text-center text-[0.6rem] font-bold leading-4 text-white">
                    {favCount}
                  </span>
                )}
              </span>
              <span
                className={cx(
                  "text-[0.68rem] font-semibold transition-colors",
                  active ? "text-[var(--pk-forest-deep)]" : "text-[var(--pk-faint)]",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
