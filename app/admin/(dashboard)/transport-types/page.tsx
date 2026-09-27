"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RotateCcw, Bus, Car, Users } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import type { TransportType } from "@/lib/types";

function getTransportIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("taxi")) return <Car className="h-5 w-5" />;
  if (n.includes("bus")) return <Bus className="h-5 w-5" />;
  return <Users className="h-5 w-5" />;
}

export default function TransportTypesPage() {
  const [types, setTypes] = useState<TransportType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TransportType | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/transport-types");
      const data = await res.json();
      setTypes(data.transportTypes ?? []);
    } catch {
      toast.error("Failed to load transport types.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
    // Optimistic toggle
    setTypes((prev) =>
      prev.map((item) => (item.id === t.id ? { ...item, is_active: !t.is_active } : item))
    );

    const res = await fetch(`/api/admin/transport-types/${t.id}`, {
      method: t.is_active ? "DELETE" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: t.is_active ? undefined : JSON.stringify({ is_active: true }),
    });
    if (res.ok) {
      toast.success(t.is_active ? "Transport type deactivated." : "Transport type activated.");
    } else {
      setTypes((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, is_active: t.is_active } : item))
      );
      toast.error("Something went wrong.");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Transport Types
            </h1>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {types.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Categorize routes by vehicle modes (Minibus, Taxi, Bus, Light Rail).
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-soft hover:bg-brand-700 active:scale-95 dark:bg-brand-500 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Transport Type
        </button>
      </div>

      {/* Grid of Transport Types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {loading && (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="mt-2 text-xs">Loading transport types…</p>
          </div>
        )}
        {!loading && types.length === 0 && (
          <div className="col-span-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No transport types found. Add your first one above.
          </div>
        )}
        {!loading &&
          types.map((t) => (
            <div
              key={t.id}
              className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                    {getTransportIcon(t.name)}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{t.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold mt-1 ${
                        t.is_active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${t.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEdit(t)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => toggleActive(t)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    t.is_active
                      ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-400"
                  }`}
                >
                  {t.is_active ? (
                    <>
                      <Trash2 className="h-3.5 w-3.5" /> Deactivate
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" /> Restore
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Transport Type" : "Add Transport Type"}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Type Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Minibus, Taxi, Bus, Light Rail"
              className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white transition"
            />
          </div>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="w-full rounded-2xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600 transition"
          >
            {saving ? "Saving…" : "Save Transport Type"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
