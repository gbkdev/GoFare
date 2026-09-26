"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, History, UploadCloud } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import { ImportJsonModal } from "@/components/admin/import-json-modal";
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
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<RouteRow | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
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
    const res = await fetch(`/api/admin/routes?status=all${search ? `&q=${search}` : ""}`);
    const data = await res.json();
    setRoutes(data.routes ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/admin/locations?status=active").then((r) => r.json()).then((d) => setLocations(d.locations ?? []));
    fetch("/api/admin/transport-types").then((r) => r.json()).then((d) => setTransportTypes(d.transportTypes ?? []));
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setEditing(null);
    setForm({ from_location_id: "", to_location_id: "", transport_type_id: "", price: "", currency: "ETB", notes: "", reason: "" });
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
    const res = await fetch(`/api/admin/routes/${route.id}`);
    const data = await res.json();
    setHistory(data.history ?? []);
    setHistoryOpen(true);
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
    const res = await fetch(`/api/admin/routes/${route.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !route.is_active }),
    });
    if (res.ok) {
      toast.success(route.is_active ? "Route disabled." : "Route enabled.");
      load();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Routes & Prices</h1>
          <p className="mt-1 text-sm text-slate-500">This is the data passengers see on the homepage.</p>
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
            <Plus className="h-4 w-4" /> Add route
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by location name..."
          className="w-full text-sm outline-none"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3">From</th>
              <th className="px-5 py-3">To</th>
              <th className="px-5 py-3">Transport</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Updated</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading…</td></tr>}
            {!loading && routes.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">No routes yet. Start building your transport price database by adding your first route.</td></tr>
            )}
            {routes.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3 font-medium text-slate-800">{r.from_location?.name}</td>
                <td className="px-5 py-3 font-medium text-slate-800">{r.to_location?.name}</td>
                <td className="px-5 py-3 text-slate-500">{r.transport_type?.name}</td>
                <td className="px-5 py-3 font-semibold text-fare">{formatPrice(r.price, r.currency)}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {r.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-400">{new Date(r.updated_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <button onClick={() => openEdit(r)} className="mr-3 font-medium text-brand-600 hover:underline">Edit</button>
                  <button onClick={() => viewHistory(r)} className="mr-3 inline-flex items-center gap-1 font-medium text-slate-500 hover:underline">
                    <History className="h-3.5 w-3.5" /> History
                  </button>
                  <button onClick={() => toggleActive(r)} className="font-medium text-slate-500 hover:underline">
                    {r.is_active ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit route" : "Add route"}>
        <div className="space-y-4">
          {!editing && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">From</label>
                <select
                  value={form.from_location_id}
                  onChange={(e) => setForm({ ...form, from_location_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  <option value="">Select location</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">To</label>
                <select
                  value={form.to_location_id}
                  onChange={(e) => setForm({ ...form, to_location_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  <option value="">Select location</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">Transport type</label>
                <select
                  value={form.transport_type_id}
                  onChange={(e) => setForm({ ...form, transport_type_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  <option value="">Select transport type</option>
                  {transportTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </>
          )}
          {editing && (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {editing.from_location.name} → {editing.to_location.name} · {editing.transport_type.name}
            </p>
          )}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">Price</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                placeholder="50"
              />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">Currency</label>
              <input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">Notes (optional)</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          {editing && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">Reason for price change (optional)</label>
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                placeholder="Fuel price update"
              />
            </div>
          )}
          <button
            onClick={save}
            disabled={saving || !form.price}
            className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save route"}
          </button>
        </div>
      </Modal>

      <ImportJsonModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import routes from JSON"
        endpoint="/api/admin/routes/import"
        sampleJson={ROUTE_SAMPLE}
        onImported={load}
      />

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Price history">
        {history.length === 0 ? (
          <p className="text-sm text-slate-400">No price changes recorded yet.</p>
        ) : (
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {history.map((h) => (
              <li key={h.id} className="py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">
                    {h.old_price != null ? `${h.old_price} → ${h.new_price}` : `Set to ${h.new_price}`}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(h.changed_at).toLocaleDateString()}</span>
                </div>
                {h.reason && <p className="mt-0.5 text-xs text-slate-500">{h.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
