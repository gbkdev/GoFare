"use client";

import { ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { PopularRoute } from "@/lib/types";

type Props = {
  routes: PopularRoute[];
  onSelect: (route: PopularRoute) => void;
};

export function PopularRoutes({ routes, onSelect }: Props) {
  if (routes.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-3xl px-4">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Popular routes</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {routes.map((r) => (
          <button
            key={`${r.from_location_id}-${r.to_location_id}`}
            onClick={() => onSelect(r)}
            className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:border-brand-300 hover:shadow-card"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              {r.from_name}
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
              {r.to_name}
            </span>
            {r.min_price != null ? (
              <span className="text-sm font-bold text-fare">{formatPrice(r.min_price, r.currency ?? "ETB")}</span>
            ) : (
              <span className="text-xs text-slate-400">No price yet</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
