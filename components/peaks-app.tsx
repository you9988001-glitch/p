"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  patchPeaksUiResume,
  readPeaksUiResume,
  writePeaksUiResume,
} from "@/lib/peaks/ui-resume";
import { PeaksProvider, usePeaks } from "@/contexts/peaks-context";
import { LoadingScreen, StorageNotice, ToastHost } from "@/components/peaks/pieces";
import { BottomNav } from "@/components/peaks/bottom-nav";
import { HomeScreen } from "@/components/peaks/home-screen";
import { ContinentScreen } from "@/components/peaks/continent-screen";
import { CountryScreen } from "@/components/peaks/country-screen";
import { CatalogScreen } from "@/components/peaks/catalog-screen";
import { FavoritesScreen } from "@/components/peaks/favorites-screen";
import { FoundScreen } from "@/components/peaks/found-screen";
import { CuratorNotePage } from "@/components/peaks/curator-note";
import { DiscoveriesPage } from "@/components/peaks/discoveries-page";

const PeakDetail = dynamic(
  () =>
    import("@/components/peaks/peak-detail").then((m) => ({
      default: m.PeakDetail,
    })),
  { ssr: false, loading: () => null },
);

function Shell() {
  const { ready, tab, nav, discoveries } = usePeaks();
  const [openId, setOpenIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return readPeaksUiResume()?.openId ?? null;
  });
  const [curatorOpen, setCuratorOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return readPeaksUiResume()?.curatorNote === true;
  });
  const [discoveriesOpen, setDiscoveriesOpen] = useState(false);
  const resumeOpenDone = useRef(false);

  const snapCuratorForReturn = useCallback(() => {
    writePeaksUiResume({
      tab,
      nav,
      openId,
      curatorNote: true,
    });
  }, [tab, nav, openId]);

  useEffect(() => {
    if (resumeOpenDone.current) return;
    resumeOpenDone.current = true;
    const r = readPeaksUiResume();
    if (r?.openId) setOpenIdState(r.openId);
    if (r?.curatorNote) setCuratorOpen(true);
  }, []);

  useEffect(() => {
    const flushOpen = () => {
      const r = readPeaksUiResume();
      if (openId) {
        patchPeaksUiResume({
          openId,
          tab: r?.tab ?? "home",
          nav: r?.nav ?? { screen: "home" },
          curatorNote: r?.curatorNote === true,
        });
      }
    };
    window.addEventListener("pagehide", flushOpen);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushOpen();
    });
    return () => {
      window.removeEventListener("pagehide", flushOpen);
    };
  }, [openId]);

  const setOpenId = useCallback((id: string | null) => {
    setOpenIdState(id);
    patchPeaksUiResume({ openId: id, curatorNote: false });
    if (!id) {
      setCuratorOpen(false);
      setDiscoveriesOpen(false);
    }
  }, []);

  if (!ready) return <LoadingScreen />;

  return (
    <div className="pk-app-bg relative min-h-[100dvh]">
      <main className="pk-fade-in pk-safe-top pb-28">
        {tab === "home" && nav.screen === "home" && <HomeScreen />}
        {tab === "home" && nav.screen === "found" && (
          <FoundScreen onOpen={setOpenId} />
        )}
        {tab === "home" && nav.screen === "continent" && (
          <ContinentScreen continentId={nav.continentId} />
        )}
        {tab === "home" && nav.screen === "country" && (
          <CountryScreen
            continentId={nav.continentId}
            countryCode={nav.countryCode}
            countryName={nav.countryName}
            onOpen={setOpenId}
          />
        )}
        {tab === "catalog" && <CatalogScreen onOpen={setOpenId} />}
        {tab === "favorites" && <FavoritesScreen onOpen={setOpenId} />}
      </main>

      <BottomNav />
      <StorageNotice />
      <ToastHost />

      {openId && !curatorOpen && !discoveriesOpen ? (
        <PeakDetail
          peakId={openId}
          onOpenPeakId={setOpenId}
          onClose={() => setOpenId(null)}
          onOpenCuratorNote={() => {
            snapCuratorForReturn();
            setCuratorOpen(true);
          }}
          onOpenDiscoveries={() => setDiscoveriesOpen(true)}
        />
      ) : null}
      {curatorOpen ? (
        <CuratorNotePage
          currentApp="peaks3141"
          beforeExternalNav={snapCuratorForReturn}
          onBack={() => {
            setCuratorOpen(false);
            patchPeaksUiResume({ curatorNote: false });
          }}
        />
      ) : null}
      {discoveriesOpen ? (
        <DiscoveriesPage
          discoveries={discoveries}
          onBack={() => setDiscoveriesOpen(false)}
          onOpenPeak={(id) => {
            setDiscoveriesOpen(false);
            setOpenId(id);
          }}
        />
      ) : null}
    </div>
  );
}

export function Peaks3141App() {
  return (
    <PeaksProvider>
      <Shell />
    </PeaksProvider>
  );
}
