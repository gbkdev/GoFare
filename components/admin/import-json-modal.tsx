"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Modal } from "@/components/admin/modal";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  endpoint: string;
  sampleJson: string;
  onImported: () => void;
};

export function ImportJsonModal({ open, onClose, title, endpoint, sampleJson, onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [raw, setRaw] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; details?: any[] } | null>(null);

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
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Import failed.");

      setResult({ imported: data.imported, skipped: data.skipped, details: data.skippedNames ?? data.skippedDetails });
      toast.success(`Imported ${data.imported} record(s).${data.skipped ? ` ${data.skipped} skipped.` : ""}`);
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
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          This adds new records only — your existing data is never edited or removed. Duplicates
          are skipped automatically.
        </p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-6 text-center hover:border-brand-300"
        >
          <UploadCloud className="h-6 w-6 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
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

        <details className="rounded-xl bg-slate-50 px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-slate-500">Expected format</summary>
          <pre className="mt-2 overflow-x-auto text-xs text-slate-600">{sampleJson}</pre>
        </details>

        {result && (
          <div className="rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-800">
            <p>Imported {result.imported}, skipped {result.skipped}.</p>
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
          className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {importing ? "Importing…" : "Import"}
        </button>
      </div>
    </Modal>
  );
}
