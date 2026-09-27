"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Zap, UploadCloud, RefreshCw } from "lucide-react";
import { BulkAdjustModal } from "./bulk-adjust-modal";
import { ImportJsonModal } from "./import-json-modal";

const ROUTE_SAMPLE = `[
  { "from_location": "Jemo", "to_location": "Mexico", "transport_type": "Taxi", "price": 50, "currency": "ETB" },
  { "from_location": "Bole", "to_location": "Piassa", "transport_type": "Minibus", "price": 30 }
]`;

type Props = {
  transportTypes: { id: string; name: string }[];
  totalRoutes: number;
};

export function OverviewBulkActions({ transportTypes, totalRoutes }: Props) {
  const [bulkAdjustOpen, setBulkAdjustOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  function handleSuccess() {
    window.location.reload();
  }

  return (
    <>
      {/* Top Header Quick Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setBulkAdjustOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/80 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 shadow-xs transition active:scale-95"
        >
          <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span>⚡ Bulk Adjust Prices</span>
        </button>

        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition active:scale-95"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Import JSON (Upsert)</span>
        </button>

        <Link
          href="/admin/routes"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 active:scale-95 dark:bg-brand-500"
        >
          <Plus className="h-4 w-4" />
          <span>Add Route</span>
        </Link>
      </div>

      {/* Prominent Mass Price & Tariff Update Feature Card on Overview */}
      <div className="rounded-3xl border border-amber-200/90 bg-linear-to-br from-amber-50/90 via-white to-amber-50/50 p-6 shadow-sm dark:border-amber-900/60 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                <Zap className="h-4 w-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Mass Price & Tariff Management
              </h2>
              <span className="rounded-full bg-amber-200/70 dark:bg-amber-900/70 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-200">
                New
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              When fuel tariffs or transport fares change across Addis Ababa, update all routes at
              once by flat amount (+/- ETB), percentage (+/- %), or re-upload a revised JSON tariff list.
              All past prices are automatically preserved in each route's Price History audit trail.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setBulkAdjustOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-soft transition hover:bg-amber-700 active:scale-95"
            >
              <Zap className="h-4 w-4" />
              <span>1-Click Bulk Adjust</span>
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition active:scale-95"
            >
              <RefreshCw className="h-4 w-4 text-brand-500" />
              <span>Bulk JSON Upsert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BulkAdjustModal
        open={bulkAdjustOpen}
        onClose={() => setBulkAdjustOpen(false)}
        transportTypes={transportTypes}
        onAdjusted={handleSuccess}
      />

      <ImportJsonModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import / Update Routes from JSON"
        endpoint="/api/admin/routes/import"
        sampleJson={ROUTE_SAMPLE}
        onImported={handleSuccess}
        allowUpdateExisting={true}
      />
    </>
  );
}
