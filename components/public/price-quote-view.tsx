"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Info, Car, Bus, Users, MoreHorizontal, Bookmark, Share2 } from "lucide-react";
import { formatPrice, formatRelativeDate } from "@/lib/utils";
import type { PriceQuoteOption } from "@/lib/types";
import { isRouteSaved, saveRoute, removeSavedRoute } from "./saved-routes-modal";
import { ReportRouteForm } from "./report-route-form";
import { toast } from "sonner";

type Props = {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  found: boolean;
  options: PriceQuoteOption[];
  onBack: () => void;
};

const ICONS: Record<string, any> = {
  car: Car,
  bus: Bus,
  users: Users,
};

function TransportIcon({ icon }: { icon: string | null }) {
  const Icon = (icon && ICONS[icon]) || MoreHorizontal;
  return <Icon className="h-6 w-6" />;
}

export function PriceQuoteView({
  fromId,
  fromName,
  toId,
  toName,
  found,
  options,
  onBack,
}: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (fromId && toId) {
      setSaved(isRouteSaved(fromId, toId));
    }
  }, [fromId, toId]);

  function handleToggleSave() {
    if (!fromId || !toId) return;
    if (saved) {
      removeSavedRoute(`${fromId}-${toId}`);
      setSaved(false);
      toast("Route removed from saved");
    } else {
      saveRoute({ id: fromId, name: fromName }, { id: toId, name: toName });
      setSaved(true);
      toast.success("Route saved to bookmarks!");
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `GoFare: ${fromName} → ${toName}`,
        text: `Check the transport price from ${fromName} to ${toName} on GoFare!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-up">
      {/* Navigation bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Search
        </button>

        <div className="flex items-center gap-2">
          {found && (
            <button
              onClick={handleShare}
              aria-label="Share route"
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition active:scale-95 shadow-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleToggleSave}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition active:scale-95 shadow-xs ${
              saved
                ? "bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950/40 dark:border-brand-800 dark:text-brand-300"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-brand-600 text-brand-600 dark:fill-brand-400 dark:text-brand-400" : "text-slate-400"}`} />
            {saved ? "Saved" : "Save Route"}
          </button>
        </div>
      </div>

      {/* Route Badge Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft text-center mb-6 dark:border-slate-800 dark:bg-slate-900">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 rounded-full px-3 py-1 dark:bg-brand-950/40 dark:text-brand-300">
          Route Fare Details
        </span>
        <div className="mt-3 flex items-center justify-center gap-3 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          <span>{fromName}</span>
          <ArrowRight className="h-5 w-5 text-brand-500 shrink-0" />
          <span>{toName}</span>
        </div>
      </div>

      {!found ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-card space-y-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">No registered price yet</p>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            We don't have a verified price for {fromName} → {toName} yet.
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Help us and fellow commuters by submitting what you usually pay for this route.
          </p>
          <div className="pt-2">
            <ReportRouteForm defaultFrom={fromName} defaultTo={toName} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Options Grid */}
          <div className={`grid gap-4 ${options.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {options.map((o, i) => (
              <div
                key={o.route_price_id}
                className={`overflow-hidden rounded-3xl border shadow-card transition ${
                  i === 0
                    ? "border-brand-300 bg-brand-gradient text-white"
                    : "border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                }`}
              >
                <div className="p-6 text-center">
                  <div
                    className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${
                      i === 0 ? "bg-white/15 text-white" : "bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
                    }`}
                  >
                    <TransportIcon icon={o.transport_icon} />
                  </div>
                  <p
                    className={`text-xs font-bold uppercase tracking-[0.2em] ${
                      i === 0 ? "text-brand-100" : "text-slate-400"
                    }`}
                  >
                    {o.transport_type}
                  </p>
                  <p
                    className={`mt-2 text-4xl sm:text-5xl font-black tracking-tight ${
                      i === 0 ? "text-white" : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {formatPrice(o.price, o.currency)}
                  </p>
                  {o.notes && (
                    <p className={`mt-2 text-xs font-medium ${i === 0 ? "text-brand-100" : "text-slate-500 dark:text-slate-400"}`}>
                      {o.notes}
                    </p>
                  )}
                  <p className={`mt-3 text-[11px] ${i === 0 ? "text-brand-200" : "text-slate-400 dark:text-slate-500"}`}>
                    Last updated: {formatRelativeDate(o.updated_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Verification disclaimer */}
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-card dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p>
              Prices reflect recorded administrative fares and transport station averages in Addis Ababa.
              Fares may fluctuate during peak hours, night shifts, or adverse weather conditions.
            </p>
          </div>

          {/* Report discrepancy */}
          <div className="text-center pt-4">
            <p className="text-xs text-slate-400 dark:text-slate-500">Notice a price change or different fare?</p>
            <div className="mt-2 inline-block">
              <ReportRouteForm defaultFrom={fromName} defaultTo={toName} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
