"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RotateCcw } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import type { TransportType } from "@/lib/types";

export default function TransportTypesPage() {
  const [types, setTypes] = useState<TransportType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TransportType | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/transport-types");
    const data = await res.json();
    setTypes(data.transportTypes ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setModalOpen(true);
  }

  function openEdit(t: TransportType) {
    setEditing(t);
    setName(t.name);
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/transport-types/${editing.id}` : "/api/admin/transport-types", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { name } : { name, sort_order: types.length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
      toast.success(editing ? "Transport type updated." : "Transport type added.");
      setModalOpen(false);
      setName("");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Could not save — it may already exist.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(t: TransportType) {
    const res = await fetch(`/api/admin/transport-types/${t.id}`, {
      method: t.is_active ? "DELETE" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: t.is_active ? undefined : JSON.stringify({ is_active: true }),
    });
    if (res.ok) {
      toast.success(t.is_active ? "Transport type deactivated." : "Transport type activated.");
      load();
    } else {
      toast.error("Something went wrong.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transport Types</h1>
          <p className="mt-1 text-sm text-slate-500">Taxi, minibus, bus — however your routes are categorized.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add type
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {loading && <p className="text-sm text-slate-400">Loading…</p>}
        {!loading && types.length === 0 && (
          <p className="col-span-full rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-400">
            No transport types yet.
          </p>
        )}
        {!loading && types.map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-800">{t.name}</p>
                <span className={`text-xs ${t.is_active ? "text-green-600" : "text-slate-400"}`}>
                  {t.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="mt-3 flex gap-3 text-xs font-medium">
              <button onClick={() => openEdit(t)} className="flex items-center gap-1 text-brand-600 hover:underline">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => toggleActive(t)} className="flex items-center gap-1 text-slate-500 hover:underline">
                {t.is_active ? <><Trash2 className="h-3.5 w-3.5" /> Delete</> : <><RotateCcw className="h-3.5 w-3.5" /> Restore</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit transport type" : "Add transport type"}>
        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Shared Taxi"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
