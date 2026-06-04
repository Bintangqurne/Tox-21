"use client";

import { useEffect, useState } from "react";
import { api, ToxicophoreMatch } from "../lib/api";

type HighlightMode = "none" | "toxicophore" | "importance";

type Props = {
  smiles: string;
  highlightTask?: string;  // task untuk mode importance
  model?: string;
};

export default function MoleculeStructure({ smiles, highlightTask, model }: Props) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlightMode, setHighlightMode] = useState<HighlightMode>("none");
  const [toxicophores, setToxicophores] = useState<ToxicophoreMatch[]>([]);
  const [toxLoading, setToxLoading] = useState(false);

  // Fetch SVG whenever smiles or highlight mode / task changes
  useEffect(() => {
    if (!smiles) return;
    setSvg(null);
    setError(null);

    const ctrl = new AbortController();
    const mode = highlightMode;
    const task = (mode === "importance" && highlightTask) ? highlightTask : "";

    fetch(api.moleculeSvgUrl(smiles, 400, 280, mode, task, model ?? ""), {
      signal: ctrl.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
        return r.text();
      })
      .then(setSvg)
      .catch((e) => {
        if (e.name !== "AbortError") setError("Gagal render struktur");
      });

    return () => ctrl.abort();
  }, [smiles, highlightMode, highlightTask, model]);

  // Fetch toxicophores for sidebar list when mode is toxicophore
  useEffect(() => {
    if (highlightMode !== "toxicophore" || !smiles) {
      setToxicophores([]);
      return;
    }
    setToxLoading(true);
    api.toxicophores(smiles)
      .then(setToxicophores)
      .catch(() => setToxicophores([]))
      .finally(() => setToxLoading(false));
  }, [smiles, highlightMode]);

  // Auto-switch to importance mode when external task selected
  useEffect(() => {
    if (highlightTask) {
      setHighlightMode("importance");
    }
  }, [highlightTask]);

  function handleModeChange(mode: HighlightMode) {
    if (mode === "importance" && !highlightTask) return; // disabled
    setHighlightMode(mode);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-medium text-zinc-700">Struktur Molekul</h3>

        {/* Mode toggle */}
        <div className="flex gap-1">
          {(["none", "toxicophore", "importance"] as HighlightMode[]).map((mode) => {
            const labels: Record<HighlightMode, string> = {
              none: "Struktur",
              toxicophore: "Gugus Reaktif",
              importance: "Atom Importance",
            };
            const disabled = mode === "importance" && !highlightTask;
            return (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                disabled={disabled}
                title={
                  disabled
                    ? "Klik ikon 🔍 di tabel prediksi untuk memilih task"
                    : labels[mode]
                }
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  highlightMode === mode
                    ? "bg-zinc-900 text-white"
                    : disabled
                    ? "cursor-not-allowed bg-zinc-50 text-zinc-300"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected task label for importance mode */}
      {highlightMode === "importance" && highlightTask && (
        <div className="mb-2 flex items-center justify-between rounded-md bg-zinc-50 px-2 py-1">
          <p className="text-[11px] text-zinc-500">
            Importance untuk: <strong className="font-mono">{highlightTask}</strong>
          </p>
          <button
            onClick={() => setHighlightMode("none")}
            className="text-[10px] text-zinc-400 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* SVG render area */}
      <div className="flex min-h-[280px] items-center justify-center">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!error && !svg && <p className="text-sm text-zinc-400">Loading struktur...</p>}
        {svg && (
          <div
            className="[&>svg]:max-h-72 [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>

      {/* Legend for importance mode */}
      {highlightMode === "importance" && (
        <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-4 rounded bg-red-300" />
            Mendorong toksisitas
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-4 rounded bg-blue-300" />
            Menurunkan toksisitas
          </span>
        </div>
      )}

      {/* Toxicophore list */}
      {highlightMode === "toxicophore" && (
        <div className="mt-3 border-t border-zinc-100 pt-3">
          {toxLoading && (
            <p className="text-[11px] text-zinc-400">Mendeteksi gugus reaktif...</p>
          )}
          {!toxLoading && toxicophores.length === 0 && (
            <p className="text-[11px] text-zinc-400">Tidak ada gugus toksikofora terdeteksi.</p>
          )}
          {!toxLoading && toxicophores.length > 0 && (
            <>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Gugus Reaktif Terdeteksi
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {toxicophores.map((t) => {
                  const [r, g, b] = t.color;
                  const cssColor = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
                  return (
                    <li
                      key={t.name}
                      className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
                      style={{ borderColor: cssColor + "80", backgroundColor: cssColor + "15" }}
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: cssColor }}
                      />
                      {t.name}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      <p className="mt-3 break-all font-mono text-xs text-zinc-500">
        {smiles}
      </p>
    </div>
  );
}
