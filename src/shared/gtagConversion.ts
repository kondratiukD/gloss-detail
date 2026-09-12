declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const QUOTE_CONVERSION = {
  send_to: "AW-18446797738/bPQrCPr5vfUcEKqXj9xE",
  value: 1.0,
  currency: "UAH",
} as const;

/** Fire Google Ads conversion after a confirmed successful Request a Quote. */
export function reportQuoteConversion(): void {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", { ...QUOTE_CONVERSION });
}
