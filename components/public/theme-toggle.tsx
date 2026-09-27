"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDarkMode =
      localStorage.getItem("gofare-theme") === "dark" ||
      (!localStorage.getItem("gofare-theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    setDark(isDarkMode);
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, []);

  function toggleTheme() {
    const nextDark = !dark;
    setDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("gofare-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("gofare-theme", "light");
    }
  }

  if (!mounted) {
    return (
      <div className={`h-9 w-9 rounded-xl border border-slate-200/80 bg-white/50 p-2 dark:border-slate-800 dark:bg-slate-900/50 ${className}`} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:border-brand-400 hover:text-brand-600 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-400 ${className}`}
    >
      {dark ? (
        <Sun className="h-4.5 w-4.5 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-slate-600 transition-transform duration-300 group-hover:-rotate-12" />
      )}
    </button>
  );
}
