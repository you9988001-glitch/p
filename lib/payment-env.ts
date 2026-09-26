/** Payment copy for Peaks 3141 & Voice 3141 — Pi Mainnet. */
export const MAINNET_UNLOCK_PI = 3.141 as const;

/** Pi checkout uses Portal catalog price — must match MAINNET_UNLOCK_PI. */
export function catalogPriceMatchesUnlock(priceInPi: number): boolean {
  return Number.isFinite(priceInPi) && Math.abs(priceInPi - MAINNET_UNLOCK_PI) < 0.0001;
}

export const PAYMENT_ENV = {
  badge: "MAINNET π",
  /** Top-of-form notice — same on both apps */
  intro:
    "3141 entries, grounded in real existence — curated and evenly distributed across 250 countries by CODE ARCHE. Launched for Pi Network's 7th anniversary. One payment, yours to keep for as long as Pi Network stays live.",
  /** Ownership proof notice — same body, closing line after purchase */
  ownedIntro:
    "3141 entries, grounded in real existence — curated and evenly distributed across 250 countries by CODE ARCHE. Launched for Pi Network's 7th anniversary. Permanently collected.",
  credit: "— Built with Cursor Agent, Claude, and Perplexity.",
  testNote: "Mainnet Pi — real payment from your wallet.",
  buttonLabel: (amount: number | string) => `Pay ${amount} π · unlock all`,
  priceLabel: (amount: number | string) => `${amount} π`,
  busyLabel: "Opening Pi checkout…",
  unavailable: "Payment unavailable",
  checkingTitle: "Checking unlock…",
  checkingBody: "Confirming this Pi account’s purchase before checkout.",
  unlockedTitle: "Already unlocked",
  unlockedBody: (appName: string) => `This account already owns ${appName}.`,
  payTitle: "Unlock full access",
  footer: "Mainnet checkout. Pi is transferred per Pi Network payment rules.",
  signInHint: "Sign in with Pi Browser to load the payment form.",
  authConnecting: "Connecting to Pi Network…",
  authFailed: "Could not connect to Pi. Check your network and try again.",
  piLoginIncomplete:
    "Pi Browser is open, but login did not finish. Open this app using the exact Production URL from Developer Portal (same address as in the bar above), wait if the connection icon flickers, then tap Try again.",
  noUnlockProduct:
    "No unlock product loaded. Set NEXT_PUBLIC_PEAKS_UNLOCK_PRODUCT_ID on Vercel to your Portal product id (3.141 π) and redeploy.",
  loadingProduct:
    "Loading unlock product from Pi… If this stays empty, check Developer Portal catalog sync.",
  catalogPriceMismatch: (catalog: number) =>
    `Developer Portal product must be ${MAINNET_UNLOCK_PI} π (catalog shows ${catalog} π). Fix the product price before checkout.`,
  deedOwnedStatus: "OWNED · Mainnet unlock",
  deedPaidLabel: (amount: number | string) => `${amount} π`,
} as const;
