"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export type RecentSearch = {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  price: number | null;
  currency: string | null;
  searchedAt: string;
};

const STORAGE_KEY = "gofare:recent-searches";
const MAX_ITEMS = 5;

export function saveRecentSearch(entry: Omit<RecentSearch, "searchedAt">) {
  if (typeof window === "undefined") return;
  try {
    const existing: RecentSearch[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const filtered = existing.filter((s) => !(s.fromId === entry.fromId && s.toId === entry.toId));
    const updated = [{ ...entry, searchedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private browsing etc.) — silently skip
  }
}

export function RecentSearches({ onSelect }: { onSelect: (s: RecentSearch) => void }) {
  const [items, setItems] = useState<RecentSearch[]>([]);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
    } catch {
      setItems([]);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto mt-10 max-w-3xl px-4">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Clock className="h-4 w-4 text-slate-400" /> Recent searches
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((s) => (
          <button
            key={`${s.fromId}-${s.toId}`}
            onClick={() => onSelect(s)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm hover:border-brand-300"
          >
            <span className="font-medium text-slate-700">{s.fromName}</span>
            <ArrowRight className="h-3 w-3 text-slate-400" />
            <span className="font-medium text-slate-700">{s.toName}</span>
            {s.price != null && (
              <span className="font-semibold text-fare">{formatPrice(s.price, s.currency ?? "ETB")}</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
