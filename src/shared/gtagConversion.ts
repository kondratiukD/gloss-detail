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

const PHONE_CLICK_CONVERSION = {
  send_to: "AW-18446797738/OWLvCJ3KxvUcEKqXj9xE",
  value: 1.0,
  currency: "UAH",
} as const;

function reportConversion(payload: {
  send_to: string;
  value: number;
  currency: string;
}): void {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", { ...payload });
}

/** Fire Google Ads conversion after a confirmed successful Request a Quote. */
export function reportQuoteConversion(): void {
  reportConversion(QUOTE_CONVERSION);
}

/**
 * One delegated listener for all tel: links (header, burger, footer).
 * Capture phase so it works even when the burger menu mounts later.
 */
export function setupPhoneClickConversion(): void {
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href^="tel:"]');
      if (!link) return;
      reportConversion(PHONE_CLICK_CONVERSION);
    },
    true,
  );
}
