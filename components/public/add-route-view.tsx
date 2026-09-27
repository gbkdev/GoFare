"use client";

import { useState } from "react";
import { PlusCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type Props = {
  initialFrom?: string;
  initialTo?: string;
  onSuccess?: () => void;
};

export function AddRouteView({ initialFrom = "", initialTo = "", onSuccess }: Props) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [price, setPrice] = useState("");
  const [transportType, setTransportType] = useState("Minibus");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from.trim() || !to.trim()) {
      toast.error("Please provide both starting location and destination.");
      return;
    }

    setSubmitting(true);
    try {
      const fullMessage = `${transportType ? `[${transportType}] ` : ""}${message.trim()}`.trim();

      const res = await fetch("/api/routes/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_location: from.trim(),
          to_location: to.trim(),
          suggested_price: price ? Number(price) : null,
          message: fullMessage || null,
        }),
      });

      if (!res.ok) throw new Error();

      setSubmitted(true);
      toast.success("Thank you! Your route report was submitted.");
      if (onSuccess) onSuccess();
    } catch {
      toast.error("Failed to submit route report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setFrom("");
    setTo("");
    setPrice("");
    setMessage("");
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center animate-fade-up">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Submission Received!</h2>
          <p className="mt-2 text-sm text-slate-500">
            Thank you for contributing. Our admins will verify this route ({from} → {to}) and publish it to the price directory.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
            >
              Add Another Route
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-2 dark:bg-emerald-950/40 dark:text-emerald-300">
          <PlusCircle className="h-3.5 w-3.5" /> Community Contribution
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Contribute a Route or Price
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Know the fare for a route missing from GoFare? Share it to help travelers across the city.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Starting Location (From) *
              </label>
              <input
                type="text"
                required
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="e.g. Jemo, Torhailoch..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-400/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Destination (To) *
              </label>
              <input
                type="text"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="e.g. Mexico, Megenagna..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-400/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Transport Mode
              </label>
              <select
                value={transportType}
                onChange={(e) => setTransportType(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-400/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800"
              >
                <option value="Minibus">Minibus</option>
                <option value="Taxi">Taxi (Lada / Ride)</option>
                <option value="Shared Taxi">Shared Taxi</option>
                <option value="Bus">Anbessa / Sheger Bus</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Estimated / Known Fare (ETB)
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 35"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-400/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Additional Notes or Station Details (optional)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Price is standard daytime rate. Station is located by the roundabout."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-400/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !from.trim() || !to.trim()}
            className="w-full rounded-2xl bg-brand-600 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-brand-700 active:scale-95 disabled:opacity-40"
          >
            {submitting ? "Submitting Route…" : "Submit Route for Verification"}
          </button>
        </form>
      </div>
    </div>
  );
}
