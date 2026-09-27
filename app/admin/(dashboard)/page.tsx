import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  MapPin,
  Route,
  DollarSign,
  Search,
  ArrowRight,
  TrendingUp,
  FileWarning,
} from "lucide-react";
import { OverviewBulkActions } from "@/components/admin/overview-bulk-actions";

async function getStats() {
  const supabase = createClient();

  const [
    { count: totalLocations },
    { count: totalRoutes },
    { count: activePrices },
    { count: searchesToday },
    { count: pendingReports },
    { data: transportTypes },
  ] = await Promise.all([
    supabase.from("locations").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("route_prices").select("*", { count: "exact", head: true }),
    supabase.from("route_prices").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("search_logs")
      .select("*", { count: "exact", head: true })
      .gte("searched_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from("route_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("transport_types").select("id, name").eq("is_active", true),
  ]);

  const { data: popular } = await supabase.rpc("get_popular_routes", { days_back: 30, max_results: 6 });

  return {
    totalLocations: totalLocations ?? 0,
    totalRoutes: totalRoutes ?? 0,
    activePrices: activePrices ?? 0,
    searchesToday: searchesToday ?? 0,
    pendingReports: pendingReports ?? 0,
    popular: popular ?? [],
    transportTypes: transportTypes ?? [],
  };
}

export default async function AdminOverviewPage() {
  const stats = await getStats();

  const cards = [
    {
      label: "Active locations",
      value: stats.totalLocations,
      icon: MapPin,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400",
      href: "/admin/locations",
    },
    {
      label: "Total routes",
      value: stats.totalRoutes,
      icon: Route,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400",
      href: "/admin/routes",
    },
    {
      label: "Active prices",
      value: stats.activePrices,
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400",
      href: "/admin/routes",
    },
    {
      label: "Searches today",
      value: stats.searchesToday,
      icon: Search,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400",
      href: "/admin/analytics",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section with Bulk Actions and Add Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time snapshot of the Addis Ababa transit fare database.
          </p>
        </div>
      </div>

      {/* Prominent Mass Price & Tariff Update Section */}
      <OverviewBulkActions
        transportTypes={stats.transportTypes}
        totalRoutes={stats.totalRoutes}
      />

      {/* Pending Reports Alert if any */}
      {stats.pendingReports > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
          <div className="flex items-center gap-3">
            <FileWarning className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {stats.pendingReports} pending missing route report{stats.pendingReports > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                Passengers reported routes that are not yet in the system.
              </p>
            </div>
          </div>
          <Link
            href="/admin/reports"
            className="shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition"
          >
            Review Reports
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="group relative rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </p>
          </Link>
        ))}
      </div>

      {/* Most Searched Routes Widget */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Most Searched Routes (Last 30 Days)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Top queries from commuters in Addis Ababa
              </p>
            </div>
          </div>
          <Link
            href="/admin/analytics"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Full Analytics →
          </Link>
        </div>

        {stats.popular.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
            No search activity recorded yet.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/60">
            {stats.popular.map((r: any, idx: number) => {
              const maxSearch = stats.popular[0]?.search_count || 1;
              const pct = Math.round((r.search_count / maxSearch) * 100);

              return (
                <div
                  key={`${r.from_location_id}-${r.to_location_id}`}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {r.from_name} <span className="text-brand-500">→</span> {r.to_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pl-9 sm:pl-0">
                    <div className="w-24 sm:w-32 bg-slate-100 rounded-full h-2 overflow-hidden dark:bg-slate-800">
                      <div
                        className="bg-brand-600 dark:bg-brand-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-16 text-right">
                      {r.search_count.toLocaleString()} searches
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
