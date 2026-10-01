/** App Studio testnet upload: show paywall, never open paid content (mainnet app stays full unlock). */
export function isPaywallPreviewOnly(): boolean {
  const v = process.env.NEXT_PUBLIC_PAYWALL_PREVIEW_ONLY?.trim().toLowerCase();
  return v === "true" || v === "1";
}
