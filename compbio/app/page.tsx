"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, PredictResponse, EndpointDetail, MetricsResponse } from "./lib/api";
import SmilesInput from "./components/SmilesInput";
import MoleculeLibrary from "./components/MoleculeLibrary";
import MoleculeStructure from "./components/MoleculeStructure";
import PredictionTable from "./components/PredictionTable";
import BatchUpload from "./components/BatchUpload";
import HealthBadge from "./components/HealthBadge";
import ModelSelector from "./components/ModelSelector";

type Tab = "single" | "batch";

export default function Home() {
  const [tab, setTab] = useState<Tab>("single");
  const [smiles, setSmiles] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Interpretability state
  const [endpointDetails, setEndpointDetails] = useState<EndpointDetail[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [importanceTask, setImportanceTask] = useState<string>("");

  // Fetch endpoint details + metrics once on mount
  useEffect(() => {
    api.endpoints().then(setEndpointDetails).catch(() => {});
    api.metrics().then(setMetrics).catch(() => {});
  }, []);

  async function handlePredict(smilesStr?: string) {
    const target = (smilesStr ?? smiles).trim();
    if (!target) return;
    if (smilesStr) setSmiles(smilesStr);

    setLoading(true);
    setError(null);
    setImportanceTask("");

    try {
      const res = await api.predict(target, selectedModel || undefined);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediksi gagal");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              Tox21 Toxicity Predictor
            </h1>
            <p className="text-xs text-zinc-500">
              Prediksi 12 endpoint toksisitas dengan model GNN (GCN/GAT)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/compare"
              className="hidden sm:block text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              Compare Molecules →
            </Link>
            <Link
              href="/endpoints"
              className="hidden sm:block text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              Endpoint Guide →
            </Link>
            <HealthBadge />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setTab("single")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "single"
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            Single Molecule
          </button>
          <button
            onClick={() => setTab("batch")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "batch"
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            Batch CSV
          </button>
        </div>

        {tab === "single" && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Input card — col 1 row 1 on desktop, first on mobile */}
            <div className="self-start rounded-lg border border-zinc-200 bg-white p-4">
              <div className="mb-3">
                <ModelSelector value={selectedModel} onChange={setSelectedModel} />
              </div>
              <SmilesInput
                value={smiles}
                onChange={setSmiles}
                onSubmit={() => handlePredict()}
                loading={loading}
              />
              {error && (
                <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}
            </div>

            {/* Results — col 2 row 1-2 on desktop (row-span-2), second on mobile */}
            <div className="flex flex-col gap-6 md:row-span-2">
              {smiles.trim() && (
                <MoleculeStructure
                  smiles={smiles.trim()}
                  highlightTask={importanceTask || undefined}
                  model={selectedModel || undefined}
                />
              )}

              {result && (
                <PredictionTable
                  data={result}
                  endpointDetails={endpointDetails}
                  metrics={metrics}
                  onSelectImportanceTask={(task) => setImportanceTask(task)}
                />
              )}

              {!result && !smiles.trim() && (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white text-sm text-zinc-400">
                  Masukkan SMILES atau pilih molekul untuk mulai
                </div>
              )}
            </div>

            {/* Library — col 1 row 2 on desktop, last on mobile */}
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <MoleculeLibrary
                onSelect={setSmiles}
                onPredict={(s) => handlePredict(s)}
              />
            </div>
          </div>
        )}

        {tab === "batch" && <BatchUpload />}

        <footer className="mt-12 border-t border-zinc-200 pt-6 text-xs text-zinc-500">
          <p>
            Model dilatih pada Tox21 dataset (12 endpoint toksikologi).
            Dibuat dengan{" "}
            <a
              href="https://deepchem.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-700"
            >
              DeepChem
            </a>{" "}
            + Next.js. Hasil prediksi bersifat in-silico — bukan pengganti uji in-vitro.
          </p>
        </footer>
      </main>
    </div>
  );
}
