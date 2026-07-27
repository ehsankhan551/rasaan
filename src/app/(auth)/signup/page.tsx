"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = null;

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <div className="mx-auto max-w-md w-full px-4 py-12">
      <h1 className="text-2xl font-bold mb-1">Create your account</h1>
      <p className="text-sm text-gray-500 mb-6">
        Join Rasaan as a customer, shop vendor, or delivery rider.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">I am signing up as a</label>
          <select
            name="role"
            defaultValue="customer"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="customer">Customer — I want to order</option>
            <option value="vendor">Vendor — I have a shop to list</option>
            <option value="rider">Rider — I want to deliver orders</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input
            name="full_name"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            name="phone"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="03XXXXXXXXX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="At least 6 characters"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-green-700 text-white py-2 text-sm font-semibold disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-green-700 font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
