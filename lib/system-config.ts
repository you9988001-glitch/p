/** Pi SDK + backend — override on Vercel via NEXT_PUBLIC_* env vars. */

const DEFAULT_BACKEND =
  "https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com";

function readSandbox(): boolean {
  const v = process.env.NEXT_PUBLIC_PI_SANDBOX?.trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return false;
}

export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SDK_LITE_URL:
    "https://pi-apps.github.io/pi-sdk-lite/build/production/sdklite.js",
  BACKEND_URL:
    process.env.NEXT_PUBLIC_PI_BACKEND_URL?.trim() || DEFAULT_BACKEND,
  SANDBOX: readSandbox(),
};
