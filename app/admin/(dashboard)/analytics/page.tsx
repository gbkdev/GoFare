"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart3, TrendingUp, Search, Compass } from "lucide-react";

type PopularRoute = { from_name: string; to_name: string; search_count: number };

export default function AnalyticsPage() {
  const [routes, setRoutes] = useState<PopularRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/routes?limit=12")
      .then((r) => r.json())
      .then((d) => setRoutes(d.routes ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalSearches = routes.reduce((acc, r) => acc + (r.search_count || 0), 0);
  const topRoute = routes[0];

  const chartData = routes.map((r) => ({
    name: `${r.from_name} → ${r.to_name}`,
    searches: r.search_count,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Search Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Commuter demand patterns and search trends across Addis Ababa over the last 30 days.
        </p>
      </div>

      {/* Top Stat Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Search className="h-4 w-4 text-brand-500" /> Total Inquiries
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalSearches.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">Searched across top routes</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> #1 Most Popular Route
          </div>
          <p className="mt-2 text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
            {topRoute ? `${topRoute.from_name} → ${topRoute.to_name}` : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {topRoute ? `${topRoute.search_count} queries` : "No data yet"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Compass className="h-4 w-4 text-indigo-500" /> Active Corridors
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            {routes.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Routes with commuter searches</p>
        </div>
      </div>

      {/* Analytics Chart & List */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <BarChart3 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Route Volume Breakdown</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Queries by route</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="mt-2 text-xs">Loading analytics data…</p>
          </div>
        ) : chartData.length === 0 || chartData.every((d) => d.searches === 0) ? (
          <div className="py-16 text-center text-sm text-slate-400 dark:text-slate-500">
            No search activity recorded yet.
          </div>
        ) : (
          <div className="mt-6">
            {/* Desktop / Tablet Bar Chart (visible on sm+) */}
            <div className="hidden sm:block">
              <ResponsiveContainer width="100%" height={Math.max(340, chartData.length * 36)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={180}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="searches" fill="#2563eb" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Mobile-friendly Progress Bar List (visible on < sm screens) */}
            <div className="sm:hidden space-y-3.5">
              {routes.map((r, i) => {
                const maxVal = routes[0]?.search_count || 1;
                const pct = Math.round((r.search_count / maxVal) * 100);

                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {r.from_name} → {r.to_name}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {r.search_count}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 dark:bg-brand-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
