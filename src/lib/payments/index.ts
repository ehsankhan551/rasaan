// Payment abstraction layer.
//
// Today: COD is free/instant, and "online" runs in TEST/SIMULATE mode (auto
// marked as paid) so the whole order flow can be built and demoed without a
// real merchant account.
//
// To go live with real online payments:
//   1. Sign up for a Pakistan-friendly gateway (Safepay is a good fit -
//      supports cards, JazzCash, EasyPaisa: https://getsafepay.com).
//   2. Add SAFEPAY_API_KEY / SAFEPAY_SECRET_KEY to .env.local (see
//      .env.local.example).
//   3. Replace the body of `chargeOnline` below with a real call to
//      Safepay's checkout/session API, and redirect the customer to the
//      hosted payment page it returns instead of marking `status: "paid"`
//      immediately.
//   4. Handle Safepay's webhook/callback to confirm payment and update the
//      `payments` + `orders` rows (payment_status) — do NOT trust the
//      client redirect alone to mark an order paid.

export type ChargeResult = {
  status: "paid" | "pending" | "failed";
  providerRef: string;
};

export async function chargeOnline(orderId: string, amount: number): Promise<ChargeResult> {
  const hasRealGateway = Boolean(process.env.SAFEPAY_API_KEY);

  if (!hasRealGateway) {
    // TEST MODE: simulate an instant successful payment.
    return {
      status: "paid",
      providerRef: "TEST-MODE-" + orderId.slice(0, 8),
    };
  }

  // TODO: real Safepay integration goes here once SAFEPAY_API_KEY is set.
  // For now, fall through to test mode so the app never hard-fails.
  return {
    status: "paid",
    providerRef: "TEST-MODE-" + orderId.slice(0, 8),
  };
}
