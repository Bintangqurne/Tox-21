"use client";

import { useRef, useState } from "react";
import { api, PredictBatchResponse } from "../lib/api";

export default function BatchUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictBatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.predictCsv(file);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-medium text-zinc-700">
        Batch Upload (CSV)
      </h3>
      <p className="mb-3 text-xs text-zinc-500">
        Upload file CSV dengan kolom <code className="rounded bg-zinc-100 px-1">smiles</code>.
        Maksimum 200 baris.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleFile}
        disabled={loading}
        className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
      />

      {loading && <p className="mt-3 text-sm text-zinc-500">Memproses batch...</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-zinc-600">
            {result.count} molekul diproses, {result.results.filter((r) => r.success).length} berhasil
          </p>
          <div className="max-h-96 overflow-auto rounded border border-zinc-200">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-zinc-100">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">SMILES</th>
                  <th className="px-2 py-1.5 text-left font-medium">Status</th>
                  <th className="px-2 py-1.5 text-left font-medium">Endpoint Tertinggi</th>
                  <th className="px-2 py-1.5 text-right font-medium">Prob.</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r, i) => (
                  <tr
                    key={i}
                    className="border-t border-zinc-100"
                  >
                    <td className="max-w-[200px] truncate px-2 py-1.5 font-mono" title={r.smiles}>
                      {r.smiles}
                    </td>
                    <td className="px-2 py-1.5">
                      {r.success ? (
                        <span className="text-emerald-600">OK</span>
                      ) : (
                        <span className="text-red-600" title={r.error}>
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 font-mono">{r.highest_risk_task ?? "-"}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {r.highest_risk_probability != null
                        ? `${(r.highest_risk_probability * 100).toFixed(1)}%`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
