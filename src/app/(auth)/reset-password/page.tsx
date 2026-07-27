"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase's browser client auto-detects the recovery code/tokens in the
    // URL and exchanges them for a session on its own (detectSessionInUrl).
    // We must NOT also call exchangeCodeForSession/setSession ourselves --
    // the code is single-use, and a second manual exchange will always fail
    // with "invalid or expired" even though the first (automatic) one
    // already succeeded. Instead we just wait for the session to appear.
    const supabase = createClient();
    let settled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (settled) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        settled = true;
        setReady(true);
      }
    });

    // In case the auto-detect already completed before this listener
    // attached, check for an existing session directly too.
    supabase.auth.getSession().then(({ data }) => {
      if (!settled && data.session) {
        settled = true;
        setReady(true);
      }
    });

    // If nothing shows up after a few seconds, the link really is bad.
    const timeout = setTimeout(() => {
      if (!settled) {
        setError("This reset link is invalid or has expired. Request a new one.");
      }
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md w-full px-4 py-12">
        <h1 className="text-2xl font-bold mb-1">Reset password</h1>
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-4">{error}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-md w-full px-4 py-12">
        <h1 className="text-2xl font-bold mb-1">Reset password</h1>
        <p className="text-sm text-gray-500 mt-4">Verifying your reset link...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md w-full px-4 py-12">
        <h1 className="text-2xl font-bold mb-1">Reset password</h1>
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mt-4">
          Password updated. Redirecting you to log in...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md w-full px-4 py-12">
      <h1 className="text-2xl font-bold mb-1">Set a new password</h1>
      <p className="text-sm text-gray-500 mb-6">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">New password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-green-700 text-white py-2 text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save new password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
