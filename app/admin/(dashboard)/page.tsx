import { createClient } from "@/lib/supabase/server";
import { MapPin, Route, DollarSign, Search } from "lucide-react";

async function getStats() {
  const supabase = createClient();

  const [{ count: totalLocations }, { count: totalRoutes }, { count: activePrices }, { count: searchesToday }] =
    await Promise.all([
      supabase.from("locations").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("route_prices").select("*", { count: "exact", head: true }),
      supabase.from("route_prices").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase
        .from("search_logs")
        .select("*", { count: "exact", head: true })
        .gte("searched_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);

  const { data: popular } = await supabase.rpc("get_popular_routes", { days_back: 30, max_results: 5 });

  return {
    totalLocations: totalLocations ?? 0,
    totalRoutes: totalRoutes ?? 0,
    activePrices: activePrices ?? 0,
    searchesToday: searchesToday ?? 0,
    popular: popular ?? [],
  };
}

export default async function AdminOverviewPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total locations", value: stats.totalLocations, icon: MapPin },
    { label: "Total routes", value: stats.totalRoutes, icon: Route },
    { label: "Active prices", value: stats.activePrices, icon: DollarSign },
    { label: "Searches today", value: stats.searchesToday, icon: Search },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
      <p className="mt-1 text-sm text-slate-500">A snapshot of your transport price database.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <Icon className="h-5 w-5 text-brand-500" />
            <p className="mt-3 text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-slate-900">Most searched routes (30 days)</h2>
        {stats.popular.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No searches recorded yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {stats.popular.map((r: any) => (
              <li key={`${r.from_location_id}-${r.to_location_id}`} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-slate-700">
                  {r.from_name} → {r.to_name}
                </span>
                <span className="text-sm text-slate-400">{r.search_count} searches</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
