/** ISO 3166-1 alpha-2 at a WGS84 point (land/territory); null if not in catalogued country. */
export async function isoCountryAtPoint(
  lat: number,
  lon: number,
): Promise<string | null> {
  const { iso1A2Code } = await import("@rapideditor/country-coder");
  const code = iso1A2Code([lon, lat]);
  return typeof code === "string" && code.length === 2 ? code.toUpperCase() : null;
}
