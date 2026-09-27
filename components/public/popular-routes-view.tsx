"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  ArrowRight,
  Flame,
  Trophy,
  Search,
  Bookmark,
  Sparkles,
  Zap,
  X,
  Compass,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { PopularRoute } from "@/lib/types";
import { isRouteSaved, saveRoute, removeSavedRoute } from "./saved-routes-modal";
import { toast } from "sonner";

type Props = {
  onSelectRoute: (from: { id: string; name: string }, to: { id: string; name: string }) => void;
  onExploreAll: () => void;
};

type FilterCategory = "all" | "top5" | "under50" | "under100";

export function PopularRoutesView({ onSelectRoute, onExploreAll }: Props) {
  const [routes, setRoutes] = useState<PopularRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());

  function syncSaved() {
    if (typeof window === "undefined") return;
    try {
      const list = JSON.parse(localStorage.getItem("gofare:saved-routes") ?? "[]");
      setSavedSet(new Set(list.map((r: any) => `${r.fromId}-${r.toId}`)));
    } catch {
      setSavedSet(new Set());
    }
  }

  useEffect(() => {
    syncSaved();
    window.addEventListener("gofare:saved-updated", syncSaved);
    return () => window.removeEventListener("gofare:saved-updated", syncSaved);
  }, []);

  useEffect(() => {
    fetch("/api/routes?limit=30")
      .then((r) => r.json())
      .then((d) => setRoutes(d.routes ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Compute maximum searches for proportional popularity bar
  const maxSearches = Math.max(...routes.map((r) => r.search_count || 1), 1);

  // Filter routes
  const filtered = routes.filter((r, idx) => {
    if (filter === "top5" && idx >= 5) return false;
    if (filter === "under50" && (r.min_price == null || r.min_price > 50)) return false;
    if (filter === "under100" && (r.min_price == null || r.min_price > 100)) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.from_name.toLowerCase().includes(q) || r.to_name.toLowerCase().includes(q);
  });

  const topRoute = routes[0];

  function toggleSave(r: PopularRoute, e: React.MouseEvent) {
    e.stopPropagation();
    const key = `${r.from_location_id}-${r.to_location_id}`;
    if (savedSet.has(key)) {
      removeSavedRoute(key);
      toast("Route removed from saved");
    } else {
      saveRoute(
        { id: r.from_location_id, name: r.from_name },
        { id: r.to_location_id, name: r.to_name }
      );
      toast.success("Saved to bookmarks!");
    }
    syncSaved();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-up">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500 animate-pulse" />
              Live Commute Trends
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Zap className="h-3 w-3 text-brand-500" /> Past 30 Days
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Popular Routes
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time ranked transit fares based on passenger lookups in Addis Ababa
          </p>
        </div>

        <button
          onClick={onExploreAll}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-brand-400 hover:text-brand-600 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-400"
        >
          <Compass className="h-4 w-4" /> Full Directory
        </button>
      </div>

      {/* #1 SPOTLIGHT HERO CARD */}
      {!loading && topRoute && !search && filter === "all" && (
        <div
          onClick={() =>
            onSelectRoute(
              { id: topRoute.from_location_id, name: topRoute.from_name },
              { id: topRoute.to_location_id, name: topRoute.to_name }
            )
          }
          className="group relative mb-8 cursor-pointer overflow-hidden rounded-3xl border border-amber-300/80 bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 p-6 shadow-soft transition hover:border-amber-400 hover:shadow-lg dark:border-amber-500/30 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/10"
        >
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl dark:bg-amber-400/5" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                  <Trophy className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  #1 Most Searched Journey
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                <span>{topRoute.from_name}</span>
                <ArrowRight className="h-5 w-5 text-amber-500 transition group-hover:translate-x-1" />
                <span>{topRoute.to_name}</span>
              </div>

              {topRoute.search_count > 0 && (
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  🔥 {topRoute.search_count} searches logged by commuters this month
                </p>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-amber-100 sm:border-0 pt-3 sm:pt-0 dark:border-slate-800">
              <div className="text-left sm:text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Starting From
                </span>
                <span className="text-2xl sm:text-3xl font-black text-fare">
                  {formatPrice(topRoute.min_price ?? 0, topRoute.currency ?? "ETB")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => toggleSave(topRoute, e)}
                  aria-label="Save route"
                  className={`rounded-xl p-2.5 transition active:scale-95 ${
                    savedSet.has(`${topRoute.from_location_id}-${topRoute.to_location_id}`)
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-white/80 text-slate-400 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <Bookmark
                    className={`h-4.5 w-4.5 ${
                      savedSet.has(`${topRoute.from_location_id}-${topRoute.to_location_id}`)
                        ? "fill-white"
                        : ""
                    }`}
                  />
                </button>

                <div className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition group-hover:bg-amber-600 active:scale-95">
                  Check Fare
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search popular journeys (e.g. Bole, Mexico, Jemo)..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm shadow-xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-brand-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: "All Trending" },
              { id: "top5", label: "Top 5" },
              { id: "under50", label: "Under 50 ETB" },
              { id: "under100", label: "Under 100 ETB" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filter === item.id
                  ? "bg-brand-600 text-white shadow-xs dark:bg-brand-500"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="ml-auto text-xs font-medium text-slate-400 dark:text-slate-500">
            {filtered.length} route{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* SKELETON LOADING STATE */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-slate-200/60 bg-white/60 p-4 dark:border-slate-800/60 dark:bg-slate-900/60"
            />
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
          <TrendingUp className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
            No popular routes match
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Try a different search term or explore all routes in the database.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-900/60"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* POPULAR ROUTE CARDS GRID */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((r, index) => {
            const isSaved = savedSet.has(`${r.from_location_id}-${r.to_location_id}`);
            const popularityPercent = Math.max(
              Math.min(Math.round(((r.search_count || 1) / maxSearches) * 100), 100),
              12
            );

            return (
              <div
                key={`${r.from_location_id}-${r.to_location_id}`}
                onClick={() =>
                  onSelectRoute(
                    { id: r.from_location_id, name: r.from_name },
                    { id: r.to_location_id, name: r.to_name }
                  )
                }
                className="group relative cursor-pointer flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-400 hover:shadow-soft active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {/* Rank Badge */}
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs ${
                          index === 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                            : index === 1
                            ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                            : index === 2
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {index < 3 ? <Sparkles className="h-4 w-4" /> : `#${index + 1}`}
                      </span>

                      <div>
                        {/* Origin → Destination */}
                        <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          <span>{r.from_name}</span>
                          <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-500" />
                          <span>{r.to_name}</span>
                        </div>
                        {r.search_count > 0 ? (
                          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            {r.search_count} search{r.search_count === 1 ? "" : "es"} logged
                          </p>
                        ) : (
                          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            Verified route
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bookmark Toggle */}
                    <button
                      type="button"
                      aria-label="Bookmark route"
                      onClick={(e) => toggleSave(r, e)}
                      className={`rounded-lg p-2 transition ${
                        isSaved
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
                          : "text-slate-300 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-600 dark:hover:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  {/* Relative Popularity Indicator Bar */}
                  {r.search_count > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-500"
                          style={{ width: `${popularityPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with Price */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Estimated Fare
                  </span>
                  <div className="flex items-center gap-2">
                    {r.min_price != null ? (
                      <span className="text-base font-black text-fare">
                        {formatPrice(r.min_price, r.currency ?? "ETB")}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Tap to check</span>
                    )}
                    <span className="text-xs font-semibold text-brand-600 transition group-hover:translate-x-0.5 dark:text-brand-400">
                      →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
