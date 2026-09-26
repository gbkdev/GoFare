import Link from "next/link";
import { MapPinned } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient text-white">
            <MapPinned className="h-4.5 w-4.5" />
          </span>
          GoFare
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <Link href="/#routes" className="hover:text-slate-900">Routes</Link>
          <Link href="/about" className="hover:text-slate-900">About</Link>
        </nav>
      </div>
    </header>
  );
}
