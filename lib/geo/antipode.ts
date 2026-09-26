/** Point on the opposite side of Earth (approx. antipode). */
export function antipodeCoords(
  lat: number,
  lon: number,
): { lat: number; lon: number } {
  let lon2 = lon + 180;
  while (lon2 > 180) lon2 -= 360;
  while (lon2 < -180) lon2 += 360;
  return { lat: -lat, lon: lon2 };
}

export function regionLabelForAntipode(
  ap: { lat: number; lon: number },
  timeZone: string,
): string {
  const place =
    timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
  const latH = `${Math.abs(ap.lat).toFixed(1)}° ${ap.lat >= 0 ? "N" : "S"}`;
  const lonH = `${Math.abs(ap.lon).toFixed(1)}° ${ap.lon >= 0 ? "E" : "W"}`;
  return `${place} · ${latH}, ${lonH}`;
}
