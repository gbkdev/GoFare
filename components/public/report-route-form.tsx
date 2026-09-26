"use client";

import { useState } from "react";
import { toast } from "sonner";

export function ReportRouteForm({ defaultFrom, defaultTo }: { defaultFrom: string; defaultTo: string }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
      >
        Help us improve — report this route
      </button>
    );
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/routes/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_location: defaultFrom,
          to_location: defaultTo,
          suggested_price: price ? Number(price) : null,
          message: message || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Thanks — we'll review this route.");
      setOpen(false);
    } catch {
      toast.error("Couldn't submit your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-3 rounded-2xl bg-slate-50 p-4 text-left">
      <p className="text-sm font-semibold text-slate-700">
        Report: {defaultFrom} → {defaultTo}
      </p>
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Suggested price (optional)"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Anything else? (optional)"
        rows={2}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="flex-1 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Submit report"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
