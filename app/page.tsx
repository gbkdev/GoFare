"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/public/navbar";
import { LocationPicker, type LocationOption } from "@/components/public/location-picker";
import { RecentSearches, saveRecentSearch, type RecentSearch } from "@/components/public/recent-searches";
import { MobileBottomNav } from "@/components/public/mobile-bottom-nav";
import { BrowseAllRoutesView } from "@/components/public/browse-all-routes-view";
import { PopularRoutesView } from "@/components/public/popular-routes-view";
import { SavedRoutesView } from "@/components/public/saved-routes-view";
import { AddRouteView } from "@/components/public/add-route-view";
import { PriceQuoteView } from "@/components/public/price-quote-view";
import { getSavedRoutes } from "@/components/public/saved-routes-modal";
import { InstallAppButton } from "@/components/public/pwa-installer";
import type { PriceQuoteOption } from "@/lib/types";

export type NavTab = "home" | "search" | "popular" | "saved" | "add" | "result";

type QuoteState = {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  found: boolean;
  options: PriceQuoteOption[];
} | null;

export default function HomePage() {
  const [popularLocations, setPopularLocations] = useState<LocationOption[]>([]);
  const [from, setFrom] = useState<LocationOption | null>(null);
  const [to, setTo] = useState<LocationOption | null>(null);
  const [quote, setQuote] = useState<QuoteState>(null);
  const [loading, setLoading] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => setPopularLocations((d.locations ?? []).slice(0, 9)));

    function syncSavedCount() {
      setSavedCount(getSavedRoutes().length);
    }
    syncSavedCount();
    window.addEventListener("gofare:saved-updated", syncSavedCount);
    return () => window.removeEventListener("gofare:saved-updated", syncSavedCount);
  }, []);

  function switchTab(tab: NavTab) {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function findPrice(fromLoc: LocationOption, toLoc: LocationOption) {
    if (!fromLoc.id || !toLoc.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/routes/price?from=${fromLoc.id}&to=${toLoc.id}`);
      const data = await res.json();
      setQuote({
        fromId: fromLoc.id,
        fromName: fromLoc.name,
        toId: toLoc.id,
        toName: toLoc.name,
        found: data.found,
        options: data.options ?? [],
      });

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

      // Transition to dedicated full-screen price quote view
      setActiveTab("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  function handleHomeSubmit() {
    if (from && to) {
      findPrice(from, to);
    }
  }

  function handleRouteSelect(f: { id: string; name: string }, t: { id: string; name: string }) {
    setFrom(f);
    setTo(t);
    findPrice(f, t);
  }

  function handleRecentClick(s: RecentSearch) {
    const f = { id: s.fromId, name: s.fromName };
    const t = { id: s.toId, name: s.toName };
    setFrom(f);
    setTo(t);
    findPrice(f, t);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 md:pb-12 dark:bg-slate-950 transition-colors duration-200">
      {/* Desktop Navbar with tab navigation */}
      <Navbar
        activeTab={activeTab === "result" ? "home" : activeTab}
        onSelectTab={(tab) => switchTab(tab)}
      />

      {/* VIEW 1: HOME VIEW */}
      {activeTab === "home" && (
        <main className="flex-1 animate-fade-up">
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
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8 dark:border-slate-800 dark:bg-slate-900">
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
                  type="button"
                  onClick={handleHomeSubmit}
                  disabled={!from?.id || !to?.id || loading}
                  className="w-full rounded-2xl bg-brand-600 py-4 text-base font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40 shadow-soft"
                >
                  {loading ? "Finding price…" : "Find Price"}
                </button>
              </div>
            </div>
          </div>

          {/* Recent searches shown on Home */}
          <RecentSearches onSelect={handleRecentClick} />

          <footer className="mx-auto mt-16 max-w-xl px-4 pb-10 text-center">
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Install GoFare on your phone for 1-tap price checks:
              </span>
              <InstallAppButton />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              GoFare shows registered prices entered by administrators, not live fares. Prices may vary.
            </p>
          </footer>
        </main>
      )}

      {/* VIEW 2: DEDICATED PRICE RESULT VIEW */}
      {activeTab === "result" && quote && (
        <main className="flex-1">
          <PriceQuoteView
            fromId={quote.fromId}
            fromName={quote.fromName}
            toId={quote.toId}
            toName={quote.toName}
            found={quote.found}
            options={quote.options}
            onBack={() => switchTab("home")}
          />
        </main>
      )}

      {/* VIEW 3: SEARCH / ALL PRICES & LOCATIONS VIEW */}
      {activeTab === "search" && (
        <main className="flex-1">
          <BrowseAllRoutesView
            onSelectRoute={handleRouteSelect}
            onOpenAdd={() => switchTab("add")}
          />
        </main>
      )}

      {/* VIEW 4: POPULAR ROUTES VIEW */}
      {activeTab === "popular" && (
        <main className="flex-1">
          <PopularRoutesView
            onSelectRoute={handleRouteSelect}
            onExploreAll={() => switchTab("search")}
          />
        </main>
      )}

      {/* VIEW 5: SAVED ROUTES VIEW */}
      {activeTab === "saved" && (
        <main className="flex-1">
          <SavedRoutesView
            onSelectRoute={handleRouteSelect}
            onExplore={() => switchTab("search")}
          />
        </main>
      )}

      {/* VIEW 6: ADD / CONTRIBUTE ROUTE VIEW */}
      {activeTab === "add" && (
        <main className="flex-1">
          <AddRouteView
            initialFrom={from?.name ?? ""}
            initialTo={to?.name ?? ""}
            onSuccess={() => {}}
          />
        </main>
      )}

      {/* 5-Button Responsive Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab === "result" ? "home" : activeTab}
        savedCount={savedCount}
        onHome={() => switchTab("home")}
        onSearch={() => switchTab("search")}
        onAdd={() => switchTab("add")}
        onSaved={() => switchTab("saved")}
        onPopular={() => switchTab("popular")}
      />
    </div>
  );
}
