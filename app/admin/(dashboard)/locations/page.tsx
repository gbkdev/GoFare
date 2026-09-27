"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Search, UploadCloud, X, MapPin, Edit2, Power } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import { ImportJsonModal } from "@/components/admin/import-json-modal";
import type { Location } from "@/lib/types";

const LOCATION_SAMPLE = `[
  { "name": "Jemo", "city": "Addis Ababa" },
  { "name": "Mexico", "city": "Addis Ababa", "description": "Mexico Square area" }
]`;

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState({ name: "", city: "Addis Ababa", description: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/locations?status=all");
      const data = await res.json();
      setLocations(data.locations ?? []);
    } catch {
      toast.error("Failed to load locations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Fast client-side filtering for zero-latency instant search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return locations.filter((loc) => {
      const matchQuery = !q || loc.name.toLowerCase().includes(q) || loc.city.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? loc.is_active
          : !loc.is_active;
      return matchQuery && matchStatus;
    });
  }, [locations, search, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", city: "Addis Ababa", description: "" });
    setModalOpen(true);
  }

  function openEdit(loc: Location) {
    setEditing(loc);
    setForm({ name: loc.name, city: loc.city, description: loc.description ?? "" });
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/locations/${editing.id}` : "/api/admin/locations", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save location.");
      toast.success(editing ? "Location updated." : "Location added.");
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast.error(typeof e.message === "string" ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(loc: Location) {
    // Optimistic UI update for instant feedback
    setLocations((prev) =>
      prev.map((item) => (item.id === loc.id ? { ...item, is_active: !loc.is_active } : item))
    );

    try {
      const res = await fetch(`/api/admin/locations/${loc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !loc.is_active }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(loc.is_active ? "Location deactivated." : "Location activated.");
    } catch {
      // Revert on error
      setLocations((prev) =>
        prev.map((item) => (item.id === loc.id ? { ...item, is_active: loc.is_active } : item))
      );
      toast.error("Could not update location status.");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section with responsive stacking */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Locations
            </h1>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {locations.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage origins, hubs, and destinations across Addis Ababa.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition active:scale-95"
          >
            <UploadCloud className="h-4 w-4" /> Import JSON
          </button>
          <button
            onClick={openCreate}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-soft hover:bg-brand-700 active:scale-95 dark:bg-brand-500 dark:hover:bg-brand-600 transition"
          >
            <Plus className="h-4 w-4" /> Add location
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input with instant clear */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search locations by name or city..."
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

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize transition ${
                statusFilter === s
                  ? "bg-brand-600 text-white dark:bg-brand-500"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP TABLE VIEW (hidden on mobile, visible on md+) */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">City</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    <p className="mt-2 text-xs">Loading locations…</p>
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    No locations match your filter.
                  </td>
                </tr>
              )}
              {filtered.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-brand-600 dark:bg-blue-950/60 dark:text-brand-400">
                        <MapPin className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <div>{loc.name}</div>
                        {loc.description && (
                          <div className="text-xs font-normal text-slate-400">{loc.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{loc.city}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        loc.is_active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${loc.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {loc.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(loc)}
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                        title="Edit location"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(loc)}
                        className={`rounded-lg p-1.5 transition ${
                          loc.is_active
                            ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        }`}
                        title={loc.is_active ? "Deactivate" : "Activate"}
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

      {/* MOBILE CARD VIEW (visible on < md screens for effortless phone usage) */}
      <div className="md:hidden space-y-3">
        {loading && (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="mt-2 text-xs">Loading locations…</p>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No locations found.
          </div>
        )}
        {filtered.map((loc) => (
          <div
            key={loc.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-600 dark:bg-blue-950/60 dark:text-brand-400">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 dark:text-white truncate">{loc.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {loc.city} {loc.description ? `· ${loc.description}` : ""}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  loc.is_active
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {loc.is_active ? "Active" : "Off"}
              </span>
              <button
                onClick={() => openEdit(loc)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Edit"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => toggleActive(loc)}
                className={`rounded-xl border p-2 transition ${
                  loc.is_active
                    ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400"
                    : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-400"
                }`}
                aria-label={loc.is_active ? "Deactivate" : "Activate"}
              >
                <Power className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Location" : "Add Location"}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Location Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white transition"
              placeholder="e.g. Jemo, Mexico, Bole"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              City
            </label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white transition"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white transition"
              placeholder="e.g. Mexico Square roundabout near bus terminal"
            />
          </div>
          <button
            onClick={save}
            disabled={saving || !form.name.trim()}
            className="w-full rounded-2xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600 transition"
          >
            {saving ? "Saving…" : "Save Location"}
          </button>
        </div>
      </Modal>

      {/* Import JSON Modal */}
      <ImportJsonModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Locations from JSON"
        endpoint="/api/admin/locations/import"
        sampleJson={LOCATION_SAMPLE}
        onImported={load}
      />
    </div>
  );
}
