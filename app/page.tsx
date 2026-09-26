"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/public/navbar";
import { LocationPicker, type LocationOption } from "@/components/public/location-picker";
import { PriceResult } from "@/components/public/price-result";
import { PopularRoutes } from "@/components/public/popular-routes";
import { RecentSearches, saveRecentSearch, type RecentSearch } from "@/components/public/recent-searches";
import type { PopularRoute, PriceQuoteOption } from "@/lib/types";

type QuoteState = { fromName: string; toName: string; found: boolean; options: PriceQuoteOption[] } | null;

export default function HomePage() {
  const [popularLocations, setPopularLocations] = useState<LocationOption[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<PopularRoute[]>([]);
  const [from, setFrom] = useState<LocationOption | null>(null);
  const [to, setTo] = useState<LocationOption | null>(null);
  const [quote, setQuote] = useState<QuoteState>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => setPopularLocations((d.locations ?? []).slice(0, 9)));
    fetch("/api/routes?limit=6")
      .then((r) => r.json())
      .then((d) => setPopularRoutes(d.routes ?? []));
  }, []);

  async function findPrice(fromLoc: LocationOption, toLoc: LocationOption) {
    if (!fromLoc.id || !toLoc.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/routes/price?from=${fromLoc.id}&to=${toLoc.id}`);
      const data = await res.json();
      setQuote({ fromName: fromLoc.name, toName: toLoc.name, found: data.found, options: data.options ?? [] });
      if (data.found && data.options?.[0]) {
        saveRecentSearch({
          fromId: fromLoc.id,
          fromName: fromLoc.name,
          toId: toLoc.id,
          toName: toLoc.name,
          price: data.options[0].price,
          currency: data.options[0].currency,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    if (from && to) findPrice(from, to);
  }

  function handlePopularRouteClick(route: PopularRoute) {
    const f = { id: route.from_location_id, name: route.from_name };
    const t = { id: route.to_location_id, name: route.to_name };
    setFrom(f);
    setTo(t);
    findPrice(f, t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleRecentClick(s: RecentSearch) {
    const f = { id: s.fromId, name: s.fromName };
    const t = { id: s.toId, name: s.toName };
    setFrom(f);
    setTo(t);
    findPrice(f, t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main>
      <Navbar />

      <section className="bg-brand-gradient px-4 pb-24 pt-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Know the price before you go.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-brand-100">
            Find the transport price between locations in Addis Ababa, quickly and easily.
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-16 max-w-xl px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="space-y-5">
            <LocationPicker
              label="From"
              placeholder="Search starting location..."
              value={from}
              onChange={setFrom}
              excludeId={to?.id}
              popular={popularLocations}
            />
            <LocationPicker
              label="To"
              placeholder="Search destination..."
              value={to}
              onChange={setTo}
              excludeId={from?.id}
              popular={popularLocations}
            />
            <button
              onClick={handleSubmit}
              disabled={!from?.id || !to?.id || loading}
              className="w-full rounded-2xl bg-brand-600 py-4 text-base font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Finding price…" : "Find Price"}
            </button>
          </div>
        </div>

        {quote && (
          <div className="mt-8">
            <PriceResult fromName={quote.fromName} toName={quote.toName} found={quote.found} options={quote.options} />
          </div>
        )}
      </div>

      <div id="routes">
        <PopularRoutes routes={popularRoutes} onSelect={handlePopularRouteClick} />
      </div>
      <RecentSearches onSelect={handleRecentClick} />

      <footer className="mx-auto mt-20 max-w-3xl px-4 pb-10 text-center text-xs text-slate-400">
        GoFare shows registered prices entered by administrators, not live fares. Prices may vary.
      </footer>
    </main>
  );
}
