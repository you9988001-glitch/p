"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  title?: string;
};

type State = {
  error: Error | null;
};

/** Keeps ConnectingSplash alive when the app tree throws. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[CODE ARCHE] App render failed", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#0a0414",
          color: "#eef3f7",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            borderRadius: 24,
            border: "1px solid rgba(45,212,191,0.28)",
            background: "rgba(26,11,46,0.92)",
            padding: "28px 24px",
            textAlign: "center",
          }}
        >
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
            CODE ARCHE
          </p>
          <h1 style={{ margin: "14px 0 8px", fontSize: 28, fontWeight: 700 }}>
            {this.props.title ?? "Something stalled"}
          </h1>
          <p style={{ margin: 0, color: "#9db0c0", lineHeight: 1.5, fontSize: 15 }}>
            The app hit a snag while opening. You can retry — you’re not stuck on a blank
            screen.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
            style={{
              marginTop: 22,
              width: "100%",
              border: 0,
              borderRadius: 999,
              padding: "12px 16px",
              background: "#2dd4bf",
              color: "#071018",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
