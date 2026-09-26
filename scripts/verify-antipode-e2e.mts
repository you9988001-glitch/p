import { ALL_PEAKS } from "../lib/peaks/data.ts";
import { resolvePeaksAntipodeTap } from "../lib/peaks/antipode-tap.ts";

async function main() {
  console.log("=== Peaks3141 resolvePeaksAntipodeTap (lib/peaks/antipode-tap.ts) ===\n");
  console.log("ALL_PEAKS count:", ALL_PEAKS.length);

  let n = 0;
  for (const p of ALL_PEAKS) {
    const r = await resolvePeaksAntipodeTap({
      lat: p.lat,
      lon: p.lon,
      countryCode: p.countryCode,
    });
    if (r.tap.kind === "open-detail") n++;
  }
  console.log("Valid open-detail matches:", n);
  console.log("(compare target: 384)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
