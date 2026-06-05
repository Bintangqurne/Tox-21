"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, PredictResponse, ExampleMolecule } from "../lib/api";
import SmilesInput from "../components/SmilesInput";
import MoleculeStructure from "../components/MoleculeStructure";

function probColor(p: number): string {
  if (p > 0.5) return "bg-red-500";
  if (p > 0.3) return "bg-amber-500";
  return "bg-emerald-500";
}

type MoleculeState = {
  smiles: string;
  loading: boolean;
  result: PredictResponse | null;
  error: string | null;
};

function MiniPredictionTable({ predictions }: { predictions: PredictResponse["predictions"] }) {
  const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
  return (
    <ul className="flex flex-col gap-1">
      {sorted.map((p) => (
        <li key={p.task}>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-zinc-700">{p.task}</span>
            <span className="tabular-nums text-zinc-600">{(p.probability * 100).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full ${probColor(p.probability)}`}
              style={{ width: `${Math.min(100, p.probability * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

type MoleculeColumnProps = {
  which: "A" | "B";
  state: MoleculeState;
  examples: ExampleMolecule[];
  onSmilesChange: (s: string) => void;
  onSubmit: () => void;
};

function MoleculeColumn({ which, state, examples, onSmilesChange, onSubmit }: MoleculeColumnProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = examples
    .filter((m) => !query || m.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10);

  function selectMolecule(m: ExampleMolecule) {
    onSmilesChange(m.smiles);
    setQuery(m.name);
    setOpen(false);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Molekul {which}
        </p>

        {/* Molecule picker */}
        <div ref={containerRef} className="relative mb-3">
          <label className="mb-1 block text-[11px] text-zinc-400">
            Pilih dari library
          </label>
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder={examples.length ? `Cari dari ${examples.length} molekul...` : "Memuat..."}
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 pl-8 pr-8 py-1.5 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setOpen(true); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {open && filtered.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-md border border-zinc-200 bg-white shadow-lg max-h-52 overflow-y-auto">
              {filtered.map((m) => (
                <button
                  key={m.name}
                  onMouseDown={(e) => { e.preventDefault(); selectMolecule(m); }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-zinc-50 transition-colors"
                >
                  <span className="font-medium text-zinc-800">{m.name}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] capitalize text-zinc-500">
                    {m.category.replace("_", " ")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-1.5 text-[11px] text-zinc-400">atau masukkan SMILES manual</div>
        <SmilesInput
          value={state.smiles}
          onChange={onSmilesChange}
          onSubmit={onSubmit}
          loading={state.loading}
        />
        {state.error && (
          <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">{state.error}</p>
        )}
      </div>

      {state.smiles.trim() && (
        <MoleculeStructure smiles={state.smiles.trim()} />
      )}

      {state.result && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h4 className="mb-3 text-xs font-medium text-zinc-600">
            Prediksi ({state.result.model})
          </h4>
          <MiniPredictionTable predictions={state.result.predictions} />
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const [molA, setMolA] = useState<MoleculeState>({
    smiles: "", loading: false, result: null, error: null,
  });
  const [molB, setMolB] = useState<MoleculeState>({
    smiles: "", loading: false, result: null, error: null,
  });
  const [examples, setExamples] = useState<ExampleMolecule[]>([]);

  useEffect(() => {
    api.examples().then(setExamples).catch(() => {});
  }, []);

  async function predict(which: "A" | "B", smiles: string) {
    const setter = which === "A" ? setMolA : setMolB;
    setter((prev) => ({ ...prev, smiles, loading: true, error: null }));
    try {
      const res = await api.predict(smiles.trim());
      setter((prev) => ({ ...prev, result: res, loading: false }));
    } catch (err) {
      setter((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Prediksi gagal",
        result: null,
        loading: false,
      }));
    }
  }

  // Build diff table
  type DiffRow = {
    task: string;
    probA: number | null;
    probB: number | null;
    delta: number | null;
  };

  const diffRows: DiffRow[] = (() => {
    if (!molA.result && !molB.result) return [];
    const allTasks = new Set([
      ...(molA.result?.predictions.map((p) => p.task) ?? []),
      ...(molB.result?.predictions.map((p) => p.task) ?? []),
    ]);
    const mapA = new Map(molA.result?.predictions.map((p) => [p.task, p.probability]) ?? []);
    const mapB = new Map(molB.result?.predictions.map((p) => [p.task, p.probability]) ?? []);
    const rows: DiffRow[] = Array.from(allTasks).map((task) => {
      const pA = mapA.get(task) ?? null;
      const pB = mapB.get(task) ?? null;
      const delta = pA != null && pB != null ? pA - pB : null;
      return { task, probA: pA, probB: pB, delta };
    });
    return rows.sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));
  })();

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors">
              ← Dashboard
            </Link>
            <span className="text-zinc-300">/</span>
            <h1 className="text-base font-semibold text-zinc-900">Compare Molecules</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="mb-6 text-sm text-zinc-500">
          Bandingkan profil toksisitas dua molekul secara bersamaan.
          Berguna untuk analisis <em>structure-activity relationship</em> (SAR).
        </p>

        {/* Side-by-side columns */}
        <div className="grid gap-6 md:grid-cols-2">
          <MoleculeColumn
            which="A"
            state={molA}
            examples={examples}
            onSmilesChange={(s) => setMolA((p) => ({ ...p, smiles: s }))}
            onSubmit={() => predict("A", molA.smiles)}
          />
          <MoleculeColumn
            which="B"
            state={molB}
            examples={examples}
            onSmilesChange={(s) => setMolB((p) => ({ ...p, smiles: s }))}
            onSubmit={() => predict("B", molB.smiles)}
          />
        </div>

        {/* Diff table */}
        {diffRows.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-zinc-800">
              Perbandingan Per Endpoint
            </h2>
            <p className="mb-4 text-xs text-zinc-500">
              Diurutkan berdasarkan selisih terbesar (|Δ|). Positif = Molekul A lebih toksik.
            </p>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Task</th>
                    <th className="px-3 py-2 text-right font-medium text-zinc-600">A</th>
                    <th className="px-3 py-2 text-right font-medium text-zinc-600">B</th>
                    <th className="px-3 py-2 text-right font-medium text-zinc-600">Δ (A−B)</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Perbandingan</th>
                  </tr>
                </thead>
                <tbody>
                  {diffRows.map((row) => (
                    <tr
                      key={row.task}
                      className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-3 py-2 font-mono font-medium text-zinc-700">{row.task}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                        {row.probA != null ? `${(row.probA * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                        {row.probB != null ? `${(row.probB * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className={`px-3 py-2 text-right tabular-nums font-medium ${
                        row.delta == null ? "text-zinc-400"
                        : row.delta > 0.05 ? "text-red-600"
                        : row.delta < -0.05 ? "text-blue-600"
                        : "text-zinc-500"
                      }`}>
                        {row.delta != null
                          ? `${row.delta > 0 ? "+" : ""}${(row.delta * 100).toFixed(1)}%`
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {row.probA != null && row.probB != null && (
                          <div className="flex items-center gap-1">
                            <div className="relative h-2 w-16 overflow-hidden rounded-full bg-zinc-100">
                              <div
                                className="absolute left-0 h-full rounded-full bg-red-400"
                                style={{ width: `${row.probA * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-zinc-400">vs</span>
                            <div className="relative h-2 w-16 overflow-hidden rounded-full bg-zinc-100">
                              <div
                                className="absolute left-0 h-full rounded-full bg-blue-400"
                                style={{ width: `${row.probB * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-zinc-400">
              <span className="text-red-400">■</span> Molekul A &nbsp;
              <span className="text-blue-400">■</span> Molekul B
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
