"use client";

import { useEffect, useState } from "react";
import { X, Bookmark, ArrowRight, Trash2, Clock, Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { RecentSearch } from "@/components/public/recent-searches";

export type SavedRoute = {
  id: string; // `${fromId}-${toId}`
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  savedAt: string;
};

const SAVED_STORAGE_KEY = "gofare:saved-routes";
const RECENT_STORAGE_KEY = "gofare:recent-searches";

export function getSavedRoutes(): SavedRoute[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveRoute(from: { id: string; name: string }, to: { id: string; name: string }) {
  if (typeof window === "undefined" || !from.id || !to.id) return false;
  try {
    const list = getSavedRoutes();
    const id = `${from.id}-${to.id}`;
    if (list.some((r) => r.id === id)) return false;
    const updated = [{ id, fromId: from.id, fromName: from.name, toId: to.id, toName: to.name, savedAt: new Date().toISOString() }, ...list];
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("gofare:saved-updated"));
    return true;
  } catch {
    return false;
  }
}

export function removeSavedRoute(id: string) {
  if (typeof window === "undefined") return;
  try {
    const list = getSavedRoutes().filter((r) => r.id !== id);
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("gofare:saved-updated"));
  } catch {}
}

export function isRouteSaved(fromId?: string, toId?: string): boolean {
  if (!fromId || !toId) return false;
  const list = getSavedRoutes();
  return list.some((r) => r.fromId === fromId && r.toId === toId);
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectRoute: (from: { id: string; name: string }, to: { id: string; name: string }) => void;
};

export function SavedRoutesModal({ open, onClose, onSelectRoute }: Props) {
  const [saved, setSaved] = useState<SavedRoute[]>([]);
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  function refresh() {
    setSaved(getSavedRoutes());
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) ?? "[]"));
    } catch {
      setRecent([]);
    }
  }

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  useEffect(() => {
    function handleUpdate() {
      refresh();
    }
    window.addEventListener("gofare:saved-updated", handleUpdate);
    return () => window.removeEventListener("gofare:saved-updated", handleUpdate);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-6 shadow-soft max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Bookmark className="h-4 w-4 fill-brand-600" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Saved Routes</h2>
              <p className="text-xs text-slate-500">Quick access to your regular commutes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-6">
          {/* Saved Section */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Your Bookmarks ({saved.length})
            </h3>
            {saved.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <Bookmark className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-700">No saved routes yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Tap the bookmark icon when looking up a price to save it here for instant 1-tap checks.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {saved.map((r) => (
                  <div
                    key={r.id}
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:border-brand-300 hover:shadow-card"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectRoute({ id: r.fromId, name: r.fromName }, { id: r.toId, name: r.toName });
                        onClose();
                      }}
                      className="flex flex-1 items-center gap-2 text-left"
                    >
                      <span className="font-semibold text-slate-800 text-sm">{r.fromName}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800 text-sm">{r.toName}</span>
                    </button>
                    <button
                      type="button"
                      aria-label="Remove saved route"
                      onClick={() => removeSavedRoute(r.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Searches Quick-Add */}
          {recent.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Clock className="h-3.5 w-3.5" /> Recent searches
              </h3>
              <div className="space-y-2">
                {recent.map((s) => {
                  const alreadySaved = saved.some((r) => r.fromId === s.fromId && r.toId === s.toId);
                  return (
                    <div
                      key={`recent-${s.fromId}-${s.toId}`}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRoute({ id: s.fromId, name: s.fromName }, { id: s.toId, name: s.toName });
                          onClose();
                        }}
                        className="flex flex-1 items-center gap-2 text-left font-medium"
                      >
                        <span>{s.fromName}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span>{s.toName}</span>
                        {s.price != null && (
                          <span className="ml-auto font-semibold text-fare">
                            {formatPrice(s.price, s.currency ?? "ETB")}
                          </span>
                        )}
                      </button>
                      {!alreadySaved && (
                        <button
                          type="button"
                          onClick={() => saveRoute({ id: s.fromId, name: s.fromName }, { id: s.toId, name: s.toName })}
                          className="ml-2 flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2 py-1 font-semibold text-slate-700 hover:border-brand-300 active:scale-95 transition"
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
      </div>
    </div>
  );
}
