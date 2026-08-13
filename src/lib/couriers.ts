// Best-effort map of Pakistani courier companies to their general tracking
// pages. We deliberately link to the courier's tracking landing page (not a
// deep link with the tracking number baked in) since courier tracking URL
// formats change without notice — the customer pastes the number in
// themselves. Couriers with no public web tracking (e.g. app-only) map to
// null and we just show the number as text.
export const COURIER_TRACKING_URLS: Record<string, string | null> = {
  TCS: "https://www.tcsexpress.com/track",
  "Leopards Courier": "https://leopardscourier.com/tracking",
  PostEx: "https://postex.pk/tracking",
  Trax: "https://trax.com.pk/",
  "M&P": null,
  "Call Courier": "https://callcourier.com.pk/tracking",
  Bykea: null,
  Other: null,
};
