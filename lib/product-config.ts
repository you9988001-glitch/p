export const PRODUCT_CONFIG = {
  /** App Studio catalog product id for unlocking mountain detail pages */
  PRODUCT_6aa4e2f28d51c110434a316c: "6aa4e2f28d51c110434a316c",
} as const;

/** Primary paid unlock for Peaks 3141 detail access (override after new Portal app). */
export const PEAK_DETAIL_PRODUCT_ID =
  process.env.NEXT_PUBLIC_PEAKS_UNLOCK_PRODUCT_ID?.trim() ||
  PRODUCT_CONFIG.PRODUCT_6aa4e2f28d51c110434a316c;

/** Set unlock product to exactly 3.141 π in Developer Portal (match Voice). */
