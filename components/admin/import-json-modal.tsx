"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, RefreshCw } from "lucide-react";
import { Modal } from "@/components/admin/modal";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  endpoint: string;
  sampleJson: string;
  onImported: () => void;
  allowUpdateExisting?: boolean;
};

export function ImportJsonModal({
  open,
  onClose,
  title,
  endpoint,
  sampleJson,
  onImported,
  allowUpdateExisting = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [raw, setRaw] = useState("");
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    updated?: number;
    skipped: number;
    details?: any[];
  } | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function runImport() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      toast.error("That file isn't valid JSON.");
      return;
    }

    setImporting(true);
    setResult(null);
    try {
      const url = `${endpoint}${allowUpdateExisting && updateExisting ? "?updateExisting=true" : ""}`;
      const payload =
        allowUpdateExisting && Array.isArray(parsed)
          ? { routes: parsed, updateExisting }
          : parsed;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Import failed.");

      setResult({
        imported: data.imported ?? 0,
        updated: data.updated ?? 0,
        skipped: data.skipped ?? 0,
        details: data.skippedNames ?? data.skippedDetails,
      });

      const msg = `Import complete: ${data.imported ?? 0} added${
        data.updated ? `, ${data.updated} prices updated` : ""
      }${data.skipped ? `, ${data.skipped} skipped` : ""}.`;
      toast.success(msg);
      onImported();
    } catch (e: any) {
      toast.error(e.message ?? "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    setRaw("");
    setFileName(null);
    setResult(null);
    setUpdateExisting(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload a JSON array of records to update or populate the database.
        </p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 px-4 py-6 text-center hover:border-brand-400 dark:hover:border-brand-500 transition"
        >
          <UploadCloud className="h-6 w-6 text-slate-400 dark:text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {fileName ?? "Click to choose a .json file"}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {/* Update Existing Toggle for Routes */}
        {allowUpdateExisting && (
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded-md text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-brand-500" />
                Update existing routes if found
              </span>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                If checked, matching routes will have their prices updated and logged to Price History instead of being skipped.
              </p>
            </div>
          </label>
        )}

        <details className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400">
            Expected format
          </summary>
          <pre className="mt-2 overflow-x-auto text-[11px] font-mono text-slate-600 dark:text-slate-300">
            {sampleJson}
          </pre>
        </details>

        {result && (
          <div className="rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 px-3 py-2 text-xs text-brand-800 dark:text-brand-300">
            <p className="font-semibold">
              Added {result.imported}
              {result.updated !== undefined ? `, Updated ${result.updated}` : ""}, Skipped {result.skipped}.
            </p>
            {result.details && result.details.length > 0 && (
              <ul className="mt-1 max-h-24 list-disc space-y-0.5 overflow-y-auto pl-4">
                {result.details.slice(0, 15).map((d: any, i: number) => (
                  <li key={i}>{typeof d === "string" ? d : `${d.row}: ${d.reason}`}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          onClick={runImport}
          disabled={!raw || importing}
          className="w-full rounded-2xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
        >
          {importing ? "Importing…" : "Import & Apply"}
        </button>
      </div>
    </Modal>
  );
}
