import { PAYMENT_ENV } from "@/lib/payment-env";
import { isPiBrowser } from "@/lib/pi-browser";

export function paywallAuthHint(input: {
  isAuthenticated: boolean;
  hasError: boolean;
  authMessage: string;
  productsLoaded: boolean;
}): string {
  if (input.isAuthenticated) return "";
  if (input.hasError) {
    return input.authMessage.trim() || PAYMENT_ENV.authFailed;
  }
  if (!input.productsLoaded) {
    return input.authMessage.trim() || PAYMENT_ENV.authConnecting;
  }
  if (isPiBrowser()) {
    return PAYMENT_ENV.piLoginIncomplete;
  }
  return PAYMENT_ENV.signInHint;
}

export function paywallShowRetry(input: {
  isAuthenticated: boolean;
  hasError: boolean;
  productsLoaded: boolean;
}): boolean {
  if (input.isAuthenticated) return false;
  return input.hasError || isPiBrowser() || input.productsLoaded;
}
