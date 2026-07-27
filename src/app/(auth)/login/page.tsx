"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, type LoginState } from "./actions";

const initialState: LoginState = null;

function LoginForm() {
  const params = useSearchParams();
  const [state, formAction, pending] = useActionState(login, initialState);
  const justSignedUp = params.get("justSignedUp");
  const next = params.get("next") || "";

  return (
    <div className="mx-auto max-w-md w-full px-4 py-12">
      <h1 className="text-2xl font-bold mb-1">Log in</h1>
      <p className="text-sm text-gray-500 mb-6">Welcome back to Rasaan.</p>

      {justSignedUp && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-4">
          Account created. Check your email if confirmation is required, then log in below.
        </p>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-6">
        No account yet?{" "}
        <Link href="/signup" className="text-green-700 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
