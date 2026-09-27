"use client";

import { Home, Search, Plus, Bookmark, TrendingUp } from "lucide-react";

type Props = {
  activeTab?: string;
  savedCount?: number;
  onHome: () => void;
  onSearch: () => void;
  onAdd: () => void;
  onSaved: () => void;
  onPopular: () => void;
};

export function MobileBottomNav({
  activeTab = "home",
  savedCount = 0,
  onHome,
  onSearch,
  onAdd,
  onSaved,
  onPopular,
}: Props) {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 px-2 py-2 backdrop-blur-lg shadow-[0_-4px_24px_rgba(18,39,82,0.07)] md:hidden pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors dark:border-slate-800/80 dark:bg-slate-950/95"
    >
      <div className="mx-auto flex max-w-md items-center justify-around">
        {/* 1. Home */}
        <button
          type="button"
          onClick={onHome}
          className={`group flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center transition active:scale-95 ${
            activeTab === "home"
              ? "text-brand-600 dark:text-brand-400 font-bold"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-semibold tracking-tight">Home</span>
        </button>

        {/* 2. Search */}
        <button
          type="button"
          onClick={onSearch}
          className={`group flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center transition active:scale-95 ${
            activeTab === "search"
              ? "text-brand-600 dark:text-brand-400 font-bold"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-semibold tracking-tight">Search</span>
        </button>

        {/* 3. Add Route (Center Elevated Action) */}
        <div className="flex flex-1 flex-col items-center justify-center -mt-5">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add or report route"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white shadow-lg shadow-brand-500/30 ring-4 ring-white dark:ring-slate-950 transition active:scale-90 hover:brightness-105"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
          <span className="mt-1 text-[10px] font-semibold tracking-tight text-slate-600 dark:text-slate-400">Add</span>
        </div>

        {/* 4. Saved */}
        <button
          type="button"
          onClick={onSaved}
          className={`group relative flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center transition active:scale-95 ${
            activeTab === "saved"
              ? "text-brand-600 dark:text-brand-400 font-bold"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <Bookmark className="h-5 w-5" />
            {savedCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white shadow-sm">
                {savedCount > 9 ? "9+" : savedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-tight">Saved</span>
        </button>

        {/* 5. Popular */}
        <button
          type="button"
          onClick={onPopular}
          className={`group flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center transition active:scale-95 ${
            activeTab === "popular"
              ? "text-brand-600 dark:text-brand-400 font-bold"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-[10px] font-semibold tracking-tight">Popular</span>
        </button>
      </div>
    </nav>
  );
}
