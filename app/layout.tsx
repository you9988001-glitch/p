import type React from "react";
import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import { AppWrapper } from "@/components/app-wrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peaks 3141",
  description: "A field guide to 3141 notable mountains across seven regions.",
  generator: "v0.app",
};

export const viewport: Viewport = {
  themeColor: "#1a0b2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={GeistMono.variable}
      style={
        {
          "--font-pk-sans": "'Outfit', sans-serif",
          "--font-pk-display": "'Cormorant Garamond', serif",
        } as React.CSSProperties
      }
    >
      <body className="font-sans antialiased" style={{ background: "#0a0414", margin: 0 }}>
        <div
          id="ca-boot-splash"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(124,58,237,0.35), transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(45,212,191,0.22), transparent 50%), #0a0414",
            color: "#eef3f7",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 320 }}>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#2dd4bf",
                fontWeight: 700,
              }}
            >
              CODE ARCHE · Peaks 3141
            </p>
            <p style={{ margin: "16px 0 0", fontSize: 28, fontWeight: 700 }}>Connecting…</p>
            <div
              style={{
                margin: "22px auto 0",
                width: 180,
                height: 6,
                borderRadius: 999,
                background: "rgba(0,0,0,0.35)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "45%",
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, transparent, #2dd4bf, transparent)",
                  animation: "ca-boot-slide 1.4s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html:
              "@keyframes ca-boot-slide{0%{transform:translateX(-120%)}100%{transform:translateX(220%)}}",
          }}
        />
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}
