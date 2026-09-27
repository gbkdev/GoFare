"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  MapPin,
  Route,
  Bus,
  BarChart3,
  FileWarning,
  LogOut,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/public/theme-toggle";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/routes", label: "Routes & Prices", icon: Route },
  { href: "/admin/transport-types", label: "Transport Types", icon: Bus },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/reports", label: "Reports", icon: FileWarning },
];

export function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const content = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300 dark:bg-slate-950 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
        <Link href="/admin" className="flex items-center gap-2.5 text-white font-bold text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-xs">
            🚕
          </span>
          <span>GoFare Admin</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Management
        </p>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-brand-600 text-white font-semibold shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-800">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Public Website
          </p>
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800/80 hover:text-white transition"
          >
            <span className="flex items-center gap-3">
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span>Go to Live App</span>
            </span>
            <span className="text-xs text-slate-500">↗</span>
          </Link>
        </div>
      </nav>

      {/* Bottom Footer Actions (Theme + Logout) */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/50">
          <span className="text-xs font-medium text-slate-400">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Pinned on md+ screens) */}
      <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col sticky top-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer (Slide-over overlay on < md screens) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Sliding sheet */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slide-right">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
