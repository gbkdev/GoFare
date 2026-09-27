"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Zap, AlertTriangle } from "lucide-react";
import { Modal } from "./modal";

type Props = {
  open: boolean;
  onClose: () => void;
  transportTypes: { id: string; name: string }[];
  onAdjusted: () => void;
};

export function BulkAdjustModal({
  open,
  onClose,
  transportTypes,
  onAdjusted,
}: Props) {
  const [transportTypeId, setTransportTypeId] = useState<string>("all");
  const [adjustmentType, setAdjustmentType] = useState<"flat" | "percentage">("flat");
  const [value, setValue] = useState<string>("5");
  const [rounding, setRounding] = useState<"none" | "integer" | "round_5">("none");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Live simulation of how sample prices will look
  const numVal = parseFloat(value) || 0;
  const sampleFares = [15, 30, 65, 120];

  function calcSample(orig: number) {
    let p = adjustmentType === "flat" ? orig + numVal : orig + orig * (numVal / 100);
    if (rounding === "integer") p = Math.round(p);
    else if (rounding === "round_5") p = Math.round(p / 5) * 5;
    else p = Math.round(p * 100) / 100;
    return Math.max(0, p);
  }

  async function handleApply() {
    if (!reason.trim()) {
      toast.error("Please enter a reason for the price adjustment (for the audit trail).");
      return;
    }
    if (isNaN(numVal) || numVal === 0) {
      toast.error("Please enter a non-zero adjustment value.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/routes/bulk-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transport_type_id: transportTypeId,
          adjustment_type: adjustmentType,
          value: numVal,
          rounding,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to adjust prices.");

      toast.success(
        `Successfully updated ${data.updatedCount ?? 0} route fare(s)! Changes recorded to history.`
      );
      onAdjusted();
      onClose();
    } catch (e: any) {
      toast.error(typeof e.message === "string" ? e.message : "Adjustment failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="1-Click Bulk Price Adjustment">
      <div className="space-y-4">
        {/* Informative alert */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p>
            This action will recalculate and update prices for all active matching routes at once.
            All old prices are permanently preserved in each route's price history.
          </p>
        </div>

        {/* 1. Target Scope */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Target Transport Mode
          </label>
          <select
            value={transportTypeId}
            onChange={(e) => setTransportTypeId(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">All Transport Modes (Entire Database)</option>
            {transportTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} only
              </option>
            ))}
          </select>
        </div>

        {/* 2. Adjustment Type & Value */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Adjustment Type
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as "flat" | "percentage")}
              className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            >
              <option value="flat">Fixed Amount (ETB)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {adjustmentType === "flat" ? "Amount (+/- ETB)" : "Percentage (+/- %)"}
            </label>
            <div className="relative">
              <input
                type="number"
                step={adjustmentType === "flat" ? "0.5" : "1"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={adjustmentType === "flat" ? "e.g. 5 or -2" : "e.g. 10 or -5"}
                className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                {adjustmentType === "flat" ? "ETB" : "%"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Rounding Options */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Fare Rounding
          </label>
          <select
            value={rounding}
            onChange={(e) => setRounding(e.target.value as "none" | "integer" | "round_5")}
            className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
          >
            <option value="none">Exact decimals (e.g. 32.50 ETB)</option>
            <option value="integer">Round to nearest 1 ETB (e.g. 33 ETB)</option>
            <option value="round_5">Round to nearest 5 ETB (e.g. 35 ETB)</option>
          </select>
        </div>

        {/* 4. Live Simulation Preview */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
          <span className="font-semibold text-slate-900 dark:text-white">Sample Calculation Preview:</span>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {sampleFares.map((f) => (
              <div key={f} className="rounded-xl bg-white dark:bg-slate-900 p-2 text-center shadow-2xs">
                <span className="text-slate-400 line-through text-[11px]">{f} ETB</span>
                <span className="text-brand-500 block text-xs font-bold mt-0.5">
                  → {calcSample(f)} ETB
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Reason (Required for audit history) */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Reason for Adjustment <span className="text-rose-500">*</span>
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. October 2026 fuel price hike announced by City Transport Bureau"
            className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleApply}
          disabled={loading || !reason.trim() || numVal === 0}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600 active:scale-95"
        >
          <Zap className="h-4 w-4" />
          {loading ? "Applying Price Adjustment…" : "Apply to All Matching Routes"}
        </button>
      </div>
    </Modal>
  );
}
