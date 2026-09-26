"use client";

import type { ReactNode } from "react";
import { PiAuthProvider } from "@/contexts/pi-auth-context";
import { ConnectingSplash } from "@/components/connecting-splash";
import { AppErrorBoundary } from "@/components/app-error-boundary";

/**
 * Splash stays outside the error boundary so a broken app tree
 * still leaves the user with a clear Connecting / Retry screen.
 */
export function AppWrapper({ children }: { children: ReactNode }) {
  return (
    <PiAuthProvider>
      <ConnectingSplash tone="peaks" />
      <AppErrorBoundary title="Peaks 3141 stalled">
        {children}
      </AppErrorBoundary>
    </PiAuthProvider>
  );
}
