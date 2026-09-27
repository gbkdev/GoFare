"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  ArrowRight,
  Car,
  Bus,
  Users,
  MoreHorizontal,
  Bookmark,
  PlusCircle,
  X,
  SlidersHorizontal,
  Compass,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { saveRoute, removeSavedRoute } from "./saved-routes-modal";
import { toast } from "sonner";

type RouteItem = {
  id: string;
  price: number;
  currency: string;
  notes: string | null;
  from_location: { id: string; name: string };
  to_location: { id: string; name: string };
  transport_type: { id: string; name: string; icon: string | null };
};

const MODE_ICONS: Record<string, any> = {
  taxi: Car,
  minibus: Bus,
  "shared taxi": Users,
  bus: Bus,
};

function getModeIcon(name?: string) {
  if (!name) return MoreHorizontal;
  const key = name.toLowerCase();
  for (const [k, icon] of Object.entries(MODE_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return MoreHorizontal;
}

type Props = {
  onSelectRoute: (from: { id: string; name: string }, to: { id: string; name: string }) => void;
  onOpenAdd: () => void;
};

type SortOption = "price-asc" | "price-desc" | "name-asc";

export function BrowseAllRoutesView({ onSelectRoute, onOpenAdd }: Props) {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("price-asc");
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

  async function loadRoutes() {
    setLoading(true);
    try {
      const res = await fetch("/api/routes/all");
      const data = await res.json();
      setRoutes(data.routes ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  // Compute unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    routes.forEach((r) => {
      if (r.transport_type?.name) set.add(r.transport_type.name);
    });
    return ["all", ...Array.from(set)];
  }, [routes]);

  // Compute lowest fare in database
  const minPrice = useMemo(() => {
    if (routes.length === 0) return 0;
    return Math.min(...routes.map((r) => r.price));
  }, [routes]);

  // Filter & Sort
  const filtered = useMemo(() => {
    let result = routes.filter((r) => {
      const matchesCategory =
        activeCategory === "all" ||
        r.transport_type?.name?.toLowerCase() === activeCategory.toLowerCase();

      if (!matchesCategory) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const fromName = r.from_location?.name?.toLowerCase() ?? "";
      const toName = r.to_location?.name?.toLowerCase() ?? "";
      const typeName = r.transport_type?.name?.toLowerCase() ?? "";
      return fromName.includes(q) || toName.includes(q) || typeName.includes(q);
    });

    result.sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "name-asc") return a.from_location.name.localeCompare(b.from_location.name);
      return 0;
    });

    return result;
  }, [routes, activeCategory, search, sortBy]);

  function toggleSave(r: RouteItem, e: React.MouseEvent) {
    e.stopPropagation();
    const key = `${r.from_location.id}-${r.to_location.id}`;
    if (savedSet.has(key)) {
      removeSavedRoute(key);
      toast("Route removed from saved");
    } else {
      saveRoute(
        { id: r.from_location.id, name: r.from_location.name },
        { id: r.to_location.id, name: r.to_location.name }
      );
      toast.success("Saved to bookmarks!");
    }
    syncSaved();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-up">
      {/* Top Banner & Stats */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
              <Compass className="h-3.5 w-3.5 text-brand-500" />
              Public Transit Directory
            </span>
            {routes.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Sparkles className="h-3 w-3 text-amber-500" /> From {minPrice} ETB
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            All Prices & Locations
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Search through {routes.length} verified routes and public transit fares in Addis Ababa
          </p>
        </div>

        <button
          onClick={onOpenAdd}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-700 active:scale-95"
        >
          <PlusCircle className="h-4 w-4" /> Contribute New Route
        </button>
      </div>

      {/* Search & Sort Bar */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search location (e.g. Jemo, Mexico, Bole, Piassa)..."
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

          {/* Sort Dropdown */}
          <div className="relative flex items-center shrink-0">
            <ArrowUpDown className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-full rounded-2xl border border-slate-200 bg-white pl-9 pr-8 py-3 text-xs font-semibold text-slate-700 shadow-xs outline-none transition focus:border-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="price-asc">Lowest Price</option>
              <option value="price-desc">Highest Price</option>
              <option value="name-asc">Alphabetical (From)</option>
            </select>
          </div>
        </div>

        {/* Transport Mode Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const Icon = getModeIcon(cat === "all" ? "" : cat);
            const isAll = cat === "all";
            const isSelected = activeCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition active:scale-95 ${
                  isSelected
                    ? "bg-brand-600 text-white shadow-xs dark:bg-brand-500"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {!isAll && <Icon className="h-3.5 w-3.5" />}
                {isAll ? "All Modes" : cat}
              </button>
            );
          })}

          <span className="ml-auto text-xs font-medium text-slate-400 dark:text-slate-500">
            {filtered.length} of {routes.length} routes
          </span>
        </div>
      </div>

      {/* Routes Directory List */}
      <div className="space-y-3">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-slate-200/60 bg-white/60 p-4 dark:border-slate-800/60 dark:bg-slate-900/60"
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
            <Search className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
              No matching routes found
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              We couldn't find any registered routes matching "{search}".
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                Reset Search
              </button>
              <button
                onClick={onOpenAdd}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 shadow-xs"
              >
                <PlusCircle className="h-4 w-4" /> Add this route
              </button>
            </div>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((r) => {
              const isSaved = savedSet.has(`${r.from_location.id}-${r.to_location.id}`);
              const Icon = getModeIcon(r.transport_type?.name);

              return (
                <div
                  key={r.id}
                  onClick={() =>
                    onSelectRoute(
                      { id: r.from_location.id, name: r.from_location.name },
                      { id: r.to_location.id, name: r.to_location.name }
                    )
                  }
                  className="group relative cursor-pointer flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-400 hover:shadow-soft active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500"
                >
                  <div>
                    {/* Top Row: Transport Badge & Bookmark */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{r.transport_type?.name ?? "Transit"}</span>
                      </div>

                      <button
                        type="button"
                        aria-label="Save route"
                        onClick={(e) => toggleSave(r, e)}
                        className={`rounded-lg p-1.5 transition ${
                          isSaved
                            ? "bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
                            : "text-slate-300 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-600 dark:hover:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                      </button>
                    </div>

                    {/* Route Connector: From → To */}
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-sm sm:text-base dark:text-white">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="h-2 w-2 rounded-full bg-brand-500 ring-2 ring-brand-200 dark:ring-brand-900" />
                        <span>{r.from_location.name}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-500 shrink-0" />
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900 shrink-0" />
                        <span className="truncate">{r.to_location.name}</span>
                      </div>
                    </div>

                    {r.notes && (
                      <p className="mt-1.5 text-xs text-slate-400 truncate dark:text-slate-500">
                        {r.notes}
                      </p>
                    )}
                  </div>

                  {/* Bottom Row: Fare Price Tag & CTA */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800/80">
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      Standard Price
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-fare">
                        {formatPrice(r.price, r.currency)}
                      </span>
                      <span className="text-xs font-bold text-brand-600 transition group-hover:translate-x-0.5 dark:text-brand-400">
                        Check →
                      </span>
                    </div>
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
