"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  ArrowRight,
  ArrowLeftRight,
  Trash2,
  Clock,
  Plus,
  Search,
  Zap,
  MapPin,
  Share2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  getSavedRoutes,
  removeSavedRoute,
  saveRoute,
  type SavedRoute,
} from "./saved-routes-modal";
import type { RecentSearch } from "./recent-searches";
import { toast } from "sonner";

type Props = {
  onSelectRoute: (from: { id: string; name: string }, to: { id: string; name: string }) => void;
  onExplore: () => void;
};

export function SavedRoutesView({ onSelectRoute, onExplore }: Props) {
  const [saved, setSaved] = useState<SavedRoute[]>([]);
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  function refresh() {
    setSaved(getSavedRoutes());
    try {
      setRecent(JSON.parse(localStorage.getItem("gofare:recent-searches") ?? "[]"));
    } catch {
      setRecent([]);
    }
  }

  useEffect(() => {
    refresh();
    window.addEventListener("gofare:saved-updated", refresh);
    return () => window.removeEventListener("gofare:saved-updated", refresh);
  }, []);

  function handleRemove(id: string) {
    removeSavedRoute(id);
    toast("Route removed from saved");
    refresh();
  }

  function handleSaveRecent(s: RecentSearch) {
    saveRoute({ id: s.fromId, name: s.fromName }, { id: s.toId, name: s.toName });
    toast.success("Saved to bookmarks!");
    refresh();
  }

  function handleClearRecent() {
    localStorage.removeItem("gofare:recent-searches");
    setRecent([]);
    toast("Recent search history cleared");
  }

  function handleShare(r: SavedRoute) {
    if (navigator.share) {
      navigator
        .share({
          title: `GoFare: ${r.fromName} → ${r.toName}`,
          text: `Check the transport fare from ${r.fromName} to ${r.toName} on GoFare!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-up">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
              <Bookmark className="h-3.5 w-3.5 fill-current" />
              Commute Shortcuts
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Zap className="h-3 w-3 text-amber-500" /> 1-Tap Lookup
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Saved Commutes
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Instant price lookups for your daily routes and return trips
          </p>
        </div>

        <button
          onClick={onExplore}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-brand-400 hover:text-brand-600 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-400"
        >
          <Search className="h-4 w-4" /> Browse More Routes
        </button>
      </div>

      {/* Bookmarked Routes Section */}
      <div className="space-y-4">
        {saved.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-950/40 dark:text-brand-400">
              <Bookmark className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No saved commutes yet
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400">
              Bookmark your frequent journeys — like Home ↔ Work or University — to check fares with a single tap before stepping onto transit.
            </p>
            <button
              onClick={onExplore}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition active:scale-95"
            >
              <Search className="h-4 w-4" /> Explore and Bookmark Routes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {saved.map((r) => (
              <div
                key={r.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-brand-400 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500"
              >
                <div>
                  {/* Commute Route Connector Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                      <MapPin className="h-3 w-3" /> Saved Route
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Share Button */}
                      <button
                        type="button"
                        aria-label="Share commute"
                        onClick={() => handleShare(r)}
                        className="rounded-lg p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition dark:text-slate-600 dark:hover:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      {/* Remove Button */}
                      <button
                        type="button"
                        aria-label="Remove saved route"
                        onClick={() => handleRemove(r.id)}
                        className="rounded-lg p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition dark:text-slate-600 dark:hover:text-red-400 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Route Name with visual pins */}
                  <div className="flex items-center gap-2.5 font-bold text-slate-900 text-base sm:text-lg dark:text-white">
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-brand-200 dark:ring-brand-900" />
                      <span>{r.fromName}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-500 shrink-0" />
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900 shrink-0" />
                      <span className="truncate">{r.toName}</span>
                    </span>
                  </div>
                </div>

                {/* Actions: Check Fare & Reverse Direction */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                  {/* Return Trip (Reverse) Button */}
                  <button
                    type="button"
                    title={`Check reverse journey: ${r.toName} → ${r.fromName}`}
                    onClick={() =>
                      onSelectRoute({ id: r.toId, name: r.toName }, { id: r.fromId, name: r.fromName })
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition active:scale-95 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5 text-brand-500" />
                    <span>Return Trip</span>
                  </button>

                  {/* Primary CTA */}
                  <button
                    type="button"
                    onClick={() =>
                      onSelectRoute({ id: r.fromId, name: r.fromName }, { id: r.toId, name: r.toName })
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-700 active:scale-95"
                  >
                    <span>Check Fares</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add from Recent Searches */}
      {recent.length > 0 && (
        <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Clock className="h-4 w-4 text-slate-400" /> Recent Search History
            </h2>
            <button
              onClick={handleClearRecent}
              className="text-xs font-medium text-slate-400 hover:text-red-500 transition"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recent.map((s) => {
              const alreadySaved = saved.some((r) => r.fromId === s.fromId && r.toId === s.toId);
              return (
                <div
                  key={`recent-${s.fromId}-${s.toId}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs shadow-2xs transition hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-800/40"
                >
                  <button
                    type="button"
                    onClick={() =>
                      onSelectRoute({ id: s.fromId, name: s.fromName }, { id: s.toId, name: s.toName })
                    }
                    className="flex flex-1 items-center gap-2 text-left font-medium text-slate-700 dark:text-slate-300 truncate"
                  >
                    <span className="truncate">{s.fromName}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{s.toName}</span>
                    {s.price != null && (
                      <span className="ml-auto font-bold text-fare shrink-0">
                        {formatPrice(s.price, s.currency ?? "ETB")}
                      </span>
                    )}
                  </button>

                  {!alreadySaved && (
                    <button
                      type="button"
                      title="Save this search"
                      onClick={() => handleSaveRecent(s)}
                      className="ml-2.5 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-bold text-[11px] text-slate-700 hover:border-brand-400 hover:text-brand-600 active:scale-95 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Plus className="h-3 w-3" /> Save
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
