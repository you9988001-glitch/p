/** Payment copy for Peaks 3141 & Voice 3141 — Pi Mainnet (App Studio). */
export const MAINNET_UNLOCK_PI = 3.141 as const;

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
  loadingProduct:
    "Loading product from App Studio… If this stays empty, the product catalog did not sync yet.",
  deedOwnedStatus: "OWNED · Mainnet unlock",
  deedPaidLabel: (amount: number | string) => `${amount} π`,
} as const;
