import type { SupabaseClient } from "@supabase/supabase-js";

// Simple, transparent earn rate: 1 point per Rs 100 spent (floored). No
// redemption flow yet -- this is the earn + balance-tracking half of the
// program; redemption (points-off-at-checkout) can be layered on later
// without changing how points are earned or stored.
export const POINTS_PER_RUPEE_BLOCK = 100;

export function calcLoyaltyPoints(orderTotal: number): number {
  return Math.floor(Number(orderTotal) / POINTS_PER_RUPEE_BLOCK);
}

// Awards points for a delivered order exactly once. Safe to call from
// multiple places (rider markDelivered, vendor advanceOrderStatus) since it
// checks + sets orders.loyalty_awarded before crediting the customer.
export async function awardLoyaltyPoints(supabase: SupabaseClient, orderId: string) {
  const { data: order } = await supabase
    .from("orders")
    .select("customer_id, total, loyalty_awarded")
    .eq("id", orderId)
    .single();

  if (!order || order.loyalty_awarded) return;

  const points = calcLoyaltyPoints(order.total);

  if (points > 0) {
    await supabase.rpc("add_loyalty_points", {
      p_user_id: order.customer_id,
      p_points: points,
    });
  }

  await supabase.from("orders").update({ loyalty_awarded: true }).eq("id", orderId);
}
