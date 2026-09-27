"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Search, History, UploadCloud, X, Route as RouteIcon, Edit2, Power, Zap } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import { ImportJsonModal } from "@/components/admin/import-json-modal";
import { BulkAdjustModal } from "@/components/admin/bulk-adjust-modal";
import { formatPrice } from "@/lib/utils";

const ROUTE_SAMPLE = `[
  { "from_location": "Jemo", "to_location": "Mexico", "transport_type": "Taxi", "price": 50, "currency": "ETB" },
  { "from_location": "Bole", "to_location": "Piassa", "transport_type": "Minibus", "price": 30 }
]`;

type RouteRow = {
  id: string;
  price: number;
  currency: string;
  is_active: boolean;
  updated_at: string;
  from_location: { id: string; name: string };
  to_location: { id: string; name: string };
  transport_type: { id: string; name: string; icon: string | null };
};

type Option = { id: string; name: string };

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [locations, setLocations] = useState<Option[]>([]);
  const [transportTypes, setTransportTypes] = useState<Option[]>([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkAdjustOpen, setBulkAdjustOpen] = useState(false);
  const [editing, setEditing] = useState<RouteRow | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRouteName, setHistoryRouteName] = useState("");
  const [form, setForm] = useState({
    from_location_id: "",
    to_location_id: "",
    transport_type_id: "",
    price: "",
    currency: "ETB",
    notes: "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/routes?status=all");
      const data = await res.json();
      setRoutes(data.routes ?? []);
    } catch {
      toast.error("Failed to load routes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/locations?status=active").then((r) => r.json()),
      fetch("/api/admin/transport-types").then((r) => r.json()),
      fetch("/api/admin/routes?status=all").then((r) => r.json()),
    ])
      .then(([locData, typeData, routeData]) => {
        setLocations(locData.locations ?? []);
        setTransportTypes(typeData.transportTypes ?? []);
        setRoutes(routeData.routes ?? []);
      })
      .catch(() => toast.error("Error loading initial data."))
      .finally(() => setLoading(false));
  }, []);

  // Instant client-side filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return routes.filter((r) => {
      const fromMatch = r.from_location?.name?.toLowerCase().includes(q) ?? false;
      const toMatch = r.to_location?.name?.toLowerCase().includes(q) ?? false;
      const typeMatch = r.transport_type?.name?.toLowerCase().includes(q) ?? false;
      const queryOk = !q || fromMatch || toMatch || typeMatch;

      const typeFilterOk =
        selectedType === "all" || r.transport_type?.id === selectedType;

      const statusFilterOk =
        selectedStatus === "all"
          ? true
          : selectedStatus === "active"
          ? r.is_active
          : !r.is_active;

      return queryOk && typeFilterOk && statusFilterOk;
    });
  }, [routes, search, selectedType, selectedStatus]);

  function openCreate() {
    setEditing(null);
    setForm({
      from_location_id: locations[0]?.id ?? "",
      to_location_id: locations[1]?.id ?? "",
      transport_type_id: transportTypes[0]?.id ?? "",
      price: "",
      currency: "ETB",
      notes: "",
      reason: "",
    });
    setModalOpen(true);
  }

  function openEdit(route: RouteRow) {
    setEditing(route);
    setForm({
      from_location_id: route.from_location.id,
      to_location_id: route.to_location.id,
      transport_type_id: route.transport_type.id,
      price: String(route.price),
      currency: route.currency,
      notes: "",
      reason: "",
    });
    setModalOpen(true);
  }

  async function viewHistory(route: RouteRow) {
    setHistoryRouteName(`${route.from_location.name} → ${route.to_location.name} (${route.transport_type.name})`);
    try {
      const res = await fetch(`/api/admin/routes/${route.id}`);
      const data = await res.json();
      setHistory(data.history ?? []);
      setHistoryOpen(true);
    } catch {
      toast.error("Could not load price history.");
    }
  }

  async function save() {
    setSaving(true);
    try {
      const payload = editing
        ? { price: Number(form.price), currency: form.currency, notes: form.notes || null, reason: form.reason || undefined }
        : {
            from_location_id: form.from_location_id,
            to_location_id: form.to_location_id,
            transport_type_id: form.transport_type_id,
            price: Number(form.price),
            currency: form.currency,
            notes: form.notes || null,
          };

      const res = await fetch(editing ? `/api/admin/routes/${editing.id}` : "/api/admin/routes", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to save route.");
      toast.success(editing ? "Route updated." : "Route added.");
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(route: RouteRow) {
    // Optimistic toggle
    setRoutes((prev) =>
      prev.map((r) => (r.id === route.id ? { ...r, is_active: !route.is_active } : r))
    );

    try {
      const res = await fetch(`/api/admin/routes/${route.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !route.is_active }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(route.is_active ? "Route disabled." : "Route enabled.");
    } catch {
      // Revert on error
      setRoutes((prev) =>
        prev.map((r) => (r.id === route.id ? { ...r, is_active: route.is_active } : r))
      );
      toast.error("Could not update route status.");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section with responsive stacking */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Routes & Prices
            </h1>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {routes.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Official transport fares shown to commuters on the GoFare app.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setBulkAdjustOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-soft transition active:scale-95"
            title="Adjust multiple route prices at once"
          >
            <Zap className="h-4 w-4" /> ⚡ Bulk Adjust Prices
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition active:scale-95"
            title="Import or bulk update routes from JSON"
          >
            <UploadCloud className="h-4 w-4" /> Import JSON (Upsert)
          </button>
          <button
            onClick={openCreate}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-soft hover:bg-brand-700 active:scale-95 dark:bg-brand-500 dark:hover:bg-brand-600 transition"
          >
            <Plus className="h-4 w-4" /> Add route
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by origin, destination, or mode..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status filter chips */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {(["all", "active", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize transition ${
                  selectedStatus === s
                    ? "bg-brand-600 text-white dark:bg-brand-500"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Transport Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedType("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              selectedType === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
            }`}
          >
            All Modes
          </button>
          {transportTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                selectedType === t.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP TABLE VIEW (hidden on mobile, visible on md+) */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[650px]">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5">From</th>
                <th className="px-6 py-3.5">To</th>
                <th className="px-6 py-3.5">Mode</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Updated</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    <p className="mt-2 text-xs">Loading routes…</p>
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    No routes match your search filters.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">
                    {r.from_location?.name}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">
                    {r.to_location?.name}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {r.transport_type?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {formatPrice(r.price, r.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        r.is_active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${r.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {r.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500">
                    {new Date(r.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(r)}
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                        title="Edit price & details"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => viewHistory(r)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
                        title="Price history"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(r)}
                        className={`rounded-lg p-1.5 transition ${
                          r.is_active
                            ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        }`}
                        title={r.is_active ? "Disable route" : "Enable route"}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW (visible on < md screens) */}
      <div className="md:hidden space-y-3">
        {loading && (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="mt-2 text-xs">Loading routes…</p>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No routes found.
          </div>
        )}
        {filtered.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            {/* Origin -> Destination & Price */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-base">
                  <span className="truncate">{r.from_location?.name}</span>
                  <span className="text-brand-500">→</span>
                  <span className="truncate">{r.to_location?.name}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-brand-700 dark:bg-blue-950/60 dark:text-brand-400">
                    {r.transport_type?.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      r.is_active
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {r.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block rounded-xl bg-slate-900 dark:bg-slate-800 px-3 py-1.5 text-base font-extrabold text-white">
                  {formatPrice(r.price, r.currency)}
                </span>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {new Date(r.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <button
                onClick={() => viewHistory(r)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
              >
                <History className="h-3.5 w-3.5" /> History
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(r)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Price
                </button>
                <button
                  onClick={() => toggleActive(r)}
                  className={`rounded-xl border p-1.5 transition ${
                    r.is_active
                      ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-400"
                  }`}
                  aria-label={r.is_active ? "Disable" : "Enable"}
                >
                  <Power className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Route Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Update Route Price" : "Add Route & Fare"}>
        <div className="space-y-4">
          {!editing ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  From (Origin)
                </label>
                <select
                  value={form.from_location_id}
                  onChange={(e) => setForm({ ...form, from_location_id: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  To (Destination)
                </label>
                <select
                  value={form.to_location_id}
                  onChange={(e) => setForm({ ...form, to_location_id: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Transport Type
                </label>
                <select
                  value={form.transport_type_id}
                  onChange={(e) => setForm({ ...form, transport_type_id: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  {transportTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3.5 text-sm text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold">{editing.from_location.name} → {editing.to_location.name}</span>
              <span className="ml-2 text-xs text-slate-500">({editing.transport_type.name})</span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Price (ETB)
            </label>
            <input
              type="number"
              step="0.5"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-base font-bold text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              placeholder="e.g. 50"
            />
          </div>

          {editing && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Reason for Change (Audit Log)
              </label>
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                placeholder="e.g. Official government tariff hike"
              />
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || !form.price}
            className="w-full rounded-2xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600 transition"
          >
            {saving ? "Saving…" : editing ? "Update Price" : "Save Route"}
          </button>
        </div>
      </Modal>

      {/* Price History Modal */}
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title={`Price History`}>
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{historyRouteName}</p>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No price changes recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((h, i) => (
                <div key={h.id || i} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {formatPrice(h.price, h.currency)}
                    </span>
                    {h.reason && (
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{h.reason}</p>
                    )}
                  </div>
                  <span className="text-slate-400">
                    {new Date(h.changed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Import JSON Modal with Upsert option */}
      <ImportJsonModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Routes from JSON"
        endpoint="/api/admin/routes/import"
        sampleJson={ROUTE_SAMPLE}
        onImported={load}
        allowUpdateExisting={true}
      />

      {/* Bulk Price Adjustment Modal */}
      <BulkAdjustModal
        open={bulkAdjustOpen}
        onClose={() => setBulkAdjustOpen(false)}
        transportTypes={transportTypes}
        onAdjusted={load}
      />
    </div>
  );
}
