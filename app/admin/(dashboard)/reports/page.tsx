"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RouteReport, RouteReportStatus } from "@/lib/types";

const STATUS_STYLES: Record<RouteReportStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  reviewed: "bg-blue-50 text-blue-700",
  added: "bg-green-50 text-green-700",
  rejected: "bg-slate-100 text-slate-500",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<RouteReport[]>([]);
  const [filter, setFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/reports${filter !== "all" ? `?status=${filter}` : ""}`);
    const data = await res.json();
    setReports(data.reports ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function updateStatus(id: string, status: RouteReportStatus) {
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success("Report updated.");
      load();
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Missing Route Reports</h1>
      <p className="mt-1 text-sm text-slate-500">Routes passengers searched for that aren't in the database yet.</p>

      <div className="mt-4 flex gap-2">
        {["pending", "reviewed", "added", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${filter === s ? "bg-brand-600 text-white" : "bg-white text-slate-500 border border-slate-200"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {loading && <p className="text-sm text-slate-400">Loading…</p>}
        {!loading && reports.length === 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-400">
            No reports in this category.
          </p>
        )}
        {reports.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-card">
            <div>
              <p className="font-medium text-slate-800">{r.from_location} → {r.to_location}</p>
              {r.suggested_price != null && (
                <p className="text-xs text-slate-500">Suggested price: {r.suggested_price} ETB</p>
              )}
              {r.message && <p className="mt-1 text-xs text-slate-500">"{r.message}"</p>}
              <p className="mt-1 text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[r.status]}`}>{r.status}</span>
              <select
                value={r.status}
                onChange={(e) => updateStatus(r.id, e.target.value as RouteReportStatus)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="added">Added</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
