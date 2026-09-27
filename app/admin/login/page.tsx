"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, ArrowLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    router.push(params.get("redirectTo") ?? "/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-8 relative">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to GoFare
      </Link>

      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-white animate-scale-up">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-white text-lg shadow-xs">
            🚕
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">GoFare Admin</h1>
            <p className="text-xs text-slate-400">Transit management console</p>
          </div>
        </div>

        {params.get("deactivated") && (
          <p className="mt-4 rounded-xl bg-amber-950/60 border border-amber-900/60 px-3 py-2 text-xs text-amber-300">
            Your admin account has been deactivated. Contact a super admin.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Admin Email
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 focus-within:border-brand-500 transition">
              <Mail className="h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm bg-transparent text-white placeholder:text-slate-600 outline-none"
                placeholder="admin@gofare.et"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 focus-within:border-brand-500 transition">
              <Lock className="h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm bg-transparent text-white placeholder:text-slate-600 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-950/50 border border-rose-900/60 p-2.5 text-xs text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-soft hover:bg-brand-500 disabled:opacity-50 transition"
          >
            {loading ? "Signing in…" : "Sign In to Admin"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LoginForm />
    </Suspense>
  );
}
