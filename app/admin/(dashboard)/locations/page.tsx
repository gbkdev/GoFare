"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, UploadCloud } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState({ name: "", city: "Addis Ababa", description: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/locations?status=all${search ? `&q=${search}` : ""}`);
    const data = await res.json();
    setLocations(data.locations ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
      if (!res.ok) throw new Error(data.error ?? "Failed");
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
    const res = await fetch(`/api/admin/locations/${loc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !loc.is_active }),
    });
    if (res.ok) {
      toast.success(loc.is_active ? "Location deactivated." : "Location activated.");
      load();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Locations</h1>
          <p className="mt-1 text-sm text-slate-500">Manage the places passengers can search from and to.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <UploadCloud className="h-4 w-4" /> Import JSON
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Add location
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search locations..."
          className="w-full text-sm outline-none"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">City</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Loading…</td></tr>
            )}
            {!loading && locations.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">No locations yet. Add your first one.</td></tr>
            )}
            {locations.map((loc) => (
              <tr key={loc.id}>
                <td className="px-5 py-3 font-medium text-slate-800">{loc.name}</td>
                <td className="px-5 py-3 text-slate-500">{loc.city}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${loc.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {loc.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => openEdit(loc)} className="mr-3 font-medium text-brand-600 hover:underline">Edit</button>
                  <button onClick={() => toggleActive(loc)} className="font-medium text-slate-500 hover:underline">
                    {loc.is_active ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit location" : "Add location"}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">Location name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              placeholder="Jemo"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">City</label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <button
            onClick={save}
            disabled={saving || !form.name.trim()}
            className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save location"}
          </button>
        </div>
      </Modal>

      <ImportJsonModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import locations from JSON"
        endpoint="/api/admin/locations/import"
        sampleJson={LOCATION_SAMPLE}
        onImported={load}
      />
    </div>
  );
}
