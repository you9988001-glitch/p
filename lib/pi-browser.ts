/** Heuristic — Pi Browser WebView (mainnet checkout requires this). */
export function isPiBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /PiBrowser|Pi Browser|MinePi|PiApp/i.test(ua);
}
