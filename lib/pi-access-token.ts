"use client";

/** Pi access token from the latest Pi.authenticate — server verifies via /v2/me. */
let accessToken: string | null = null;

export function setPiAccessToken(token: string | null): void {
  accessToken = token?.trim() || null;
}

export function getPiAccessToken(): string | null {
  return accessToken;
}
