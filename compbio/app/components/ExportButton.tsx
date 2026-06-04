"use client";

import { useState } from "react";
import { PredictResponse } from "../lib/api";

type Props = {
  data: PredictResponse;
};

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButton({ data }: Props) {
  const [open, setOpen] = useState(false);

  function exportCSV() {
    const rows = [
      ["task", "probability", "probability_pct", "description", "flagged"],
      ...data.predictions.map((p) => [
        p.task,
        p.probability.toFixed(4),
        (p.probability * 100).toFixed(2) + "%",
        `"${p.description.replace(/"/g, '""')}"`,
        p.flagged ? "true" : "false",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const filename = `tox21_${data.smiles.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}_${data.model}.csv`;
    downloadBlob(csv, filename, "text/csv");
    setOpen(false);
  }

  function exportJSON() {
    const json = JSON.stringify(data, null, 2);
    const filename = `tox21_${data.smiles.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}_${data.model}.json`;
    downloadBlob(json, filename, "application/json");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        title="Export hasil prediksi"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
            <button
              onClick={exportCSV}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <span className="text-zinc-400">📊</span> Download CSV
            </button>
            <button
              onClick={exportJSON}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <span className="text-zinc-400">{"{ }"}</span> Download JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
