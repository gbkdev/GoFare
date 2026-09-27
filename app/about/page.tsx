import { Navbar } from "@/components/public/navbar";
import { InstallAppButton } from "@/components/public/pwa-installer";
import { Smartphone, Zap, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">About GoFare</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
          GoFare helps people in Addis Ababa find the known transport price between two
          locations before they travel. Prices are entered and kept up to date by administrators —
          GoFare is a community price reference, not a booking or ride-hailing service.
        </p>

        {/* Feature Highlights */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-brand-600 dark:bg-blue-950/60 dark:text-brand-400">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">Instant Fares</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Check minibus, taxi, and bus rates before stepping out.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">Verified Fares</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Official rates kept up to date and verified by administrators.
            </p>
          </div>
        </div>

        {/* App Installation Section */}
        <div className="mt-10 rounded-3xl border border-brand-200 bg-linear-to-br from-brand-50 to-blue-100/50 p-6 dark:border-brand-900/60 dark:from-slate-900 dark:to-brand-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Install on your phone</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Add GoFare to your home screen for instant offline access.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <InstallAppButton className="px-5 py-2.5 text-sm" />
          </div>
        </div>
      </div>
    </main>
  );
}
