/**
 * Fires a marketing/conversion event to every pixel that happens to be present
 * on the page (Meta, TikTok, GTM dataLayer, gtag/GA4). Safe no-op when a pixel
 * is not installed or before the browser is ready.
 */
export type TrackEventName =
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration"
  | "Search";

type Win = Window & {
  fbq?: (...args: unknown[]) => void;
  ttq?: { track?: (...args: unknown[]) => void };
  gtag?: (...args: unknown[]) => void;
  dataLayer?: Record<string, unknown>[];
  snaptr?: (...args: unknown[]) => void;
  pintrk?: (...args: unknown[]) => void;
  twq?: (...args: unknown[]) => void;
  lintrk?: (...args: unknown[]) => void;
};

const TIKTOK_MAP: Record<TrackEventName, string> = {
  ViewContent: "ViewContent",
  AddToCart: "AddToCart",
  InitiateCheckout: "InitiateCheckout",
  AddPaymentInfo: "AddPaymentInfo",
  Purchase: "CompletePayment",
  Lead: "SubmitForm",
  CompleteRegistration: "CompleteRegistration",
  Search: "Search",
};

export function trackEvent(name: TrackEventName, data: Record<string, unknown> = {}, eventId?: string) {
  if (typeof window === "undefined") return;
  const w = window as Win;
  try {
    if (typeof w.fbq === "function") w.fbq("track", name, data, eventId ? { eventID: eventId } : undefined);
    if (w.ttq && typeof w.ttq.track === "function") w.ttq.track(TIKTOK_MAP[name] ?? name, data, eventId ? { event_id: eventId } : undefined);
    if (typeof w.gtag === "function") w.gtag("event", name, data);
    if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: name, ...data });
    if (typeof w.snaptr === "function") w.snaptr("track", name.toUpperCase(), data);
    if (typeof w.pintrk === "function") w.pintrk("track", name.toLowerCase(), data);
    if (typeof w.twq === "function") w.twq("event", name.toLowerCase(), data);
    if (typeof w.lintrk === "function") w.lintrk("track", { conversion_id: name });
  } catch {
    /* tracking must never break the UI */
  }
}
