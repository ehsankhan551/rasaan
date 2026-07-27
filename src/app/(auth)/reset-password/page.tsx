"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function establishSession() {
      const code = params.get("code");

      // PKCE flow: a `code` param is present in the URL.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError("This reset link is invalid or has expired. Request a new one.");
          return;
        }
        setReady(true);
        return;
      }

      // Implicit flow: tokens arrive in the URL hash fragment.
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setError("This reset link is invalid or has expired. Request a new one.");
          return;
        }
        setReady(true);
        return;
      }

      // No recovery tokens found -- either the link is malformed, or the
      // user already has an active session and navigated here directly.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
      } else {
        setError("This reset link is invalid or has expired. Request a new one.");
      }
    }

    establishSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
