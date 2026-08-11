"use client";

import { useActionState, useTransition } from "react";
import { inviteRider, cancelRiderInvite, type InviteRiderState } from "./actions";

const initialState: InviteRiderState = null;

export default function InviteRiderForm({
  pendingInvites,
}: {
  pendingInvites: { email: string; invited_at: string }[];
}) {
  const [state, formAction, pending] = useActionState(inviteRider, initialState);
  const [cancelPending, startCancelTransition] = useTransition();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-8">
      <h2 className="font-semibold mb-1">Invite a rider</h2>
      <p className="text-xs text-gray-500 mb-3">
        Enter the email of someone you want as a rider. If they don&apos;t have a Rasaan account
        yet, they&apos;ll automatically become a rider the moment they sign up.
      </p>
      <form action={formAction} className="flex flex-wrap gap-2 items-center">
        <input
          type="email"
          name="email"
          required
          placeholder="rider@example.com"
          className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          disabled={pending}
          className="rounded-lg bg-green-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
        >
          {pending ? "Inviting..." : "Send Invite"}
        </button>
      </form>
      {state?.error && <p className="text-xs text-red-600 mt-2">{state.error}</p>}
      {state?.success && <p className="text-xs text-green-700 mt-2">{state.success}</p>}

      {pendingInvites.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Pending invites</p>
          <div className="space-y-1.5">
            {pendingInvites.map((inv) => (
              <div
                key={inv.email}
                className="flex items-center justify-between text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5"
              >
                <span className="text-amber-700">{inv.email}</span>
                <button
                  disabled={cancelPending}
                  onClick={() => startCancelTransition(() => cancelRiderInvite(inv.email))}
                  className="text-gray-500 hover:text-red-600"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
