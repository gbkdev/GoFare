"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileWarning, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import type { RouteReport, RouteReportStatus } from "@/lib/types";

const STATUS_STYLES: Record<RouteReportStatus, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60",
  reviewed: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60",
  added: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60",
  rejected: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<RouteReport[]>([]);
  const [filter, setFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports${filter !== "all" ? `?status=${filter}` : ""}`);
      const data = await res.json();
      setReports(data.reports ?? []);
    } catch {
      toast.error("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function updateStatus(id: string, status: RouteReportStatus) {
    // Optimistic UI update
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );

    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Report status changed to ${status}.`);
      } else {
        throw new Error("Update failed");
      }
    } catch {
      toast.error("Could not update report status.");
      load();
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Responsive Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Missing Route Reports
          </h1>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {reports.length}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          User submissions and missing transit inquiries reported by passengers.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["pending", "reviewed", "added", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold capitalize whitespace-nowrap transition ${
              filter === s
                ? "bg-brand-600 text-white dark:bg-brand-500 shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {loading && (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="mt-2 text-xs">Loading reports…</p>
          </div>
        )}
        {!loading && reports.length === 0 && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No reports in the "{filter}" category.
          </div>
        )}
        {!loading &&
          reports.map((r) => (
            <div
              key={r.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    {r.from_location} <span className="text-brand-500">→</span> {r.to_location}
                  </span>
                </div>

                {r.suggested_price != null && (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Suggested Fare: {r.suggested_price} ETB
                  </p>
                )}

                {r.message && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                    "{r.message}"
                  </p>
                )}

                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Reported on {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-between sm:justify-end">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[r.status]}`}>
                  {r.status}
                </span>

                <select
                  value={r.status}
                  onChange={(e) => updateStatus(r.id, e.target.value as RouteReportStatus)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-brand-500"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="added">Mark Added</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
