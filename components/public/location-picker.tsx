"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type LocationOption = { id: string; name: string; city?: string };

type Props = {
  label: string;
  placeholder: string;
  value: LocationOption | null;
  onChange: (loc: LocationOption) => void;
  excludeId?: string | null;
  popular: LocationOption[];
};

export function LocationPicker({ label, placeholder, value, onChange, excludeId, popular }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.locations ?? []);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  const list = (query.trim().length > 0 ? results : popular).filter((l) => l.id !== excludeId);

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left transition",
          "hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-slate-800 dark:bg-slate-900/90",
          open && "border-brand-400 ring-2 ring-brand-400"
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-slate-400" />
        <span className={cn("truncate text-base", value ? "font-medium text-slate-900 dark:text-white" : "text-slate-400")}>
          {value ? value.name : placeholder}
        </span>
        {value && (
          <X
            className="ml-auto h-4 w-4 shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            onClick={(e) => {
              e.stopPropagation();
              setQuery("");
              onChange({ id: "", name: "" });
            }}
          />
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a location..."
              className="w-full text-sm outline-none placeholder:text-slate-400 dark:bg-transparent dark:text-white"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {!query && (
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Popular locations
              </p>
            )}
            {loading && <p className="px-3 py-2 text-sm text-slate-400">Searching…</p>}
            {!loading && list.length === 0 && query && (
              <p className="px-3 py-2 text-sm text-slate-400">No locations match "{query}".</p>
            )}
            {list.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => {
                  onChange(loc);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-brand-50 dark:hover:bg-slate-800"
              >
                <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
                <span className="font-medium text-slate-800 dark:text-slate-200">{loc.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
