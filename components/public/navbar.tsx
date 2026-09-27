"use client";

import Link from "next/link";
import { MapPinned } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { InstallAppButton } from "./pwa-installer";

type Props = {
  activeTab?: string;
  onSelectTab?: (tab: "home" | "search" | "popular" | "saved" | "add") => void;
};

export function Navbar({ activeTab = "home", onSelectTab }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur transition-colors dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
        {onSelectTab ? (
          <button
            onClick={() => onSelectTab("home")}
            className="flex items-center gap-2 font-bold text-slate-900 transition active:scale-95 dark:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-xs">
              <MapPinned className="h-4.5 w-4.5" />
            </span>
            GoFare
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-xs">
              <MapPinned className="h-4.5 w-4.5" />
            </span>
            GoFare
          </Link>
        )}

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex dark:text-slate-400">
            {onSelectTab ? (
              <>
                <button
                  onClick={() => onSelectTab("home")}
                  className={`transition ${
                    activeTab === "home"
                      ? "font-bold text-brand-600 dark:text-brand-400"
                      : "hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => onSelectTab("search")}
                  className={`transition ${
                    activeTab === "search"
                      ? "font-bold text-brand-600 dark:text-brand-400"
                      : "hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All Prices & Locations
                </button>
                <button
                  onClick={() => onSelectTab("popular")}
                  className={`transition ${
                    activeTab === "popular"
                      ? "font-bold text-brand-600 dark:text-brand-400"
                      : "hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Popular
                </button>
                <button
                  onClick={() => onSelectTab("saved")}
                  className={`transition ${
                    activeTab === "saved"
                      ? "font-bold text-brand-600 dark:text-brand-400"
                      : "hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Saved
                </button>
                <button
                  onClick={() => onSelectTab("add")}
                  className={`transition ${
                    activeTab === "add"
                      ? "font-bold text-brand-600 dark:text-brand-400"
                      : "hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  + Contribute
                </button>
                <Link href="/about" className="hover:text-slate-900 dark:hover:text-white">
                  About
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
                  Home
                </Link>
                <Link href="/about" className="hover:text-slate-900 dark:hover:text-white">
                  About
                </Link>
              </>
            )}
          </nav>

          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          {/* PWA Install App Button */}
          <InstallAppButton />
        </div>
      </div>
    </header>
  );
}
