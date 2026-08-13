type Props = {
  orderStatus: string;
  deliveryMode: "vendor" | "platform";
  deliveryStatus?: string | null;
};

const PLATFORM_STEPS = [
  { key: "pending", label: "Order Placed" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Packed" },
  { key: "picked_up", label: "Picked Up" },
  { key: "on_the_way", label: "On the Way" },
  { key: "delivered", label: "Delivered" },
];

const VENDOR_STEPS = [
  { key: "pending", label: "Order Placed" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Packed" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

// Rider apps don't give us live GPS telemetry, so "Picked Up" and "On the
// Way" both complete the moment the rider marks the order picked up from
// the shop — that's the one real signal we have, rather than faking a
// separate "in transit" event.
function platformStepIndex(orderStatus: string, deliveryStatus?: string | null) {
  if (orderStatus === "delivered" || deliveryStatus === "delivered") return 6;
  if (deliveryStatus === "picked_up") return 5;
  if (deliveryStatus === "assigned") return 3;
  const order = ["pending", "accepted", "preparing", "ready"];
  const idx = order.indexOf(orderStatus);
  return idx === -1 ? 0 : idx;
}

function vendorStepIndex(orderStatus: string) {
  const order = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered"];
  const idx = order.indexOf(orderStatus);
  return idx === -1 ? 0 : idx;
}

export default function OrderTimeline({ orderStatus, deliveryMode, deliveryStatus }: Props) {
  if (orderStatus === "cancelled") {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 font-medium">
        This order was cancelled.
      </div>
    );
  }

  const steps = deliveryMode === "platform" ? PLATFORM_STEPS : VENDOR_STEPS;
  const currentIndex =
    deliveryMode === "platform"
      ? platformStepIndex(orderStatus, deliveryStatus)
      : vendorStepIndex(orderStatus);

  return (
    <div className="flex items-start overflow-x-auto py-2">
      {steps.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === steps.length - 1;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-[90px]">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  done ? "bg-green-700 text-white" : "bg-gray-200 text-gray-400"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <p className={`text-[10px] mt-1 text-center ${done ? "text-green-700 font-medium" : "text-gray-400"}`}>
                {step.label}
              </p>
            </div>
            {!isLast && (
              <div className={`h-0.5 flex-1 -mt-4 ${i < currentIndex ? "bg-green-700" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
