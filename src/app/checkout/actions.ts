"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { chargeOnline } from "@/lib/payments";

export type CheckoutItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
};

export type CheckoutState = { error?: string } | null;

// Creates the order + order_items (+ a payment stub for online orders) in one
// go. COD orders are ready to go immediately; online orders are marked
// "paid" here in TEST/SIMULATE mode only — see README for wiring a real
// gateway (Safepay) once the user has merchant credentials.
export async function placeOrder(
  shopId: string,
  items: CheckoutItem[],
  deliveryMode: "vendor" | "platform",
  paymentMethod: "cod" | "online",
  deliveryAddress: string,
  deliveryPhone: string,
  notes: string
): Promise<CheckoutState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in to place an order." };
  }
  if (!items.length) {
    return { error: "Your cart is empty." };
  }
  if (!deliveryAddress.trim() || !deliveryPhone.trim()) {
    return { error: "Please provide a delivery address and phone number." };
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryFee = deliveryMode === "platform" ? 100 : 0; // flat placeholder fee
  const total = subtotal + deliveryFee;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      shop_id: shopId,
      payment_method: paymentMethod,
      payment_status: "pending",
      delivery_mode: deliveryMode,
      delivery_address: deliveryAddress,
      delivery_phone: deliveryPhone,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      notes,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: orderError?.message ?? "Could not create order." };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      product_name: i.name,
      quantity: i.qty,
      unit_price: i.price,
    }))
  );

  if (itemsError) {
    return { error: itemsError.message };
  }

  if (deliveryMode === "platform") {
    await supabase.from("deliveries").insert({ order_id: order.id, status: "unassigned" });
  }

  if (paymentMethod === "online") {
    const charge = await chargeOnline(order.id, total);
    await supabase.from("payments").insert({
      order_id: order.id,
      provider: "safepay",
      status: charge.status,
      amount: total,
      provider_ref: charge.providerRef,
    });
    await supabase
      .from("orders")
      .update({ payment_status: charge.status })
      .eq("id", order.id);
  }

  redirect(`/account/orders?placed=${order.id}`);
}
