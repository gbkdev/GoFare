"use client";

import { ArrowDown, Info, Car, Bus, Users, MoreHorizontal } from "lucide-react";
import { formatPrice, formatRelativeDate } from "@/lib/utils";
import type { PriceQuoteOption } from "@/lib/types";
import { ReportRouteForm } from "./report-route-form";

type Props = {
  fromName: string;
  toName: string;
  found: boolean;
  options: PriceQuoteOption[];
};

const ICONS: Record<string, any> = {
  car: Car,
  bus: Bus,
  users: Users,
};

function TransportIcon({ icon }: { icon: string | null }) {
  const Icon = (icon && ICONS[icon]) || MoreHorizontal;
  return <Icon className="h-5 w-5" />;
}

export function PriceResult({ fromName, toName, found, options }: Props) {
  if (!found) {
    return (
      <div className="animate-fade-up rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">No price yet</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">
          We don't have a price for {fromName} → {toName} yet.
        </h3>
        <p className="mt-1 text-sm text-slate-500">Try a different destination, or help us fill the gap.</p>
        <div className="mt-6">
          <ReportRouteForm defaultFrom={fromName} defaultTo={toName} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
        <span>{fromName}</span>
        <ArrowDown className="h-4 w-4" />
        <span>{toName}</span>
      </div>

      {/* One card per transport type — taxi, minibus, bus, etc. shown separately */}
      <div className={`grid gap-4 ${options.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {options.map((o, i) => (
          <div
            key={o.route_price_id}
            className={`overflow-hidden rounded-3xl border shadow-card ${
              i === 0 ? "border-brand-200 bg-brand-gradient text-white" : "border-slate-200 bg-white"
            }`}
          >
            <div className="px-6 py-7 text-center">
              <div
                className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${
                  i === 0 ? "bg-white/15 text-white" : "bg-brand-50 text-brand-600"
                }`}
              >
                <TransportIcon icon={o.transport_icon} />
              </div>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                  i === 0 ? "text-brand-100" : "text-slate-400"
                }`}
              >
                {o.transport_type}
              </p>
              <p className={`mt-2 text-4xl font-bold tracking-tight ${i === 0 ? "text-white" : "text-slate-900"}`}>
                {formatPrice(o.price, o.currency)}
              </p>
              <p className={`mt-2 text-xs ${i === 0 ? "text-brand-100" : "text-slate-400"}`}>
                Last updated: {formatRelativeDate(o.updated_at)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Price information is based on the latest price entered by the administrator and may
          change in real-world transportation conditions.
        </p>
      </div>
    </div>
  );
}
