"use client";

import { useEffect, useState } from "react";
import { api, ExampleMolecule } from "../lib/api";
import MoleculePreviewModal from "./MoleculePreviewModal";

const CATEGORIES = [
  { slug: "all", label: "Semua" },
  { slug: "drugs", label: "Obat-obatan" },
  { slug: "hormones", label: "Hormon" },
  { slug: "endocrine_disruptors", label: "Endocrine Disruptor" },
  { slug: "solvents", label: "Pelarut" },
  { slug: "pesticides", label: "Pestisida" },
  { slug: "food_additives", label: "Aditif Makanan" },
  { slug: "carcinogens", label: "Karsinogen" },
  { slug: "natural", label: "Senyawa Alami" },
];

const TAG_DOT: Record<string, { dot: string; label: string }> = {
  "safe-dose":          { dot: "bg-emerald-500", label: "Aman (dosis wajar)" },
  "endocrine-disruptor":{ dot: "bg-amber-500",   label: "Endocrine Disruptor" },
  carcinogen:           { dot: "bg-red-500",      label: "Karsinogen" },
  controversial:        { dot: "bg-purple-500",   label: "Kontroversial" },
};

const TAG_CHIP: Record<string, string> = {
  "safe-dose":          "bg-emerald-100 text-emerald-800",
  "endocrine-disruptor":"bg-amber-100 text-amber-800",
  carcinogen:           "bg-red-100 text-red-800",
  controversial:        "bg-purple-100 text-purple-800",
};

type Props = {
  onSelect: (smiles: string) => void;
  onPredict?: (smiles: string) => void;
};

export default function MoleculeLibrary({ onSelect, onPredict }: Props) {
  const [molecules, setMolecules] = useState<ExampleMolecule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [preview, setPreview] = useState<ExampleMolecule | null>(null);

  useEffect(() => {
    api.examples()
      .then(setMolecules)
      .catch(() => setError("Gagal memuat daftar molekul"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = molecules.filter((m) => {
    const matchCat = activeCategory === "all" || m.category === activeCategory;
    const matchQ = !query || m.name.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  function handlePredict(smiles: string) {
    onSelect(smiles);
    if (onPredict) onPredict(smiles);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-700">
          Library Molekul
        </h3>
        {!loading && !error && (
          <span className="text-[11px] text-zinc-400">
            {filtered.length} dari {molecules.length} molekul
          </span>
        )}
      </div>

      {/* Tag legend */}
      <div className="mb-3 flex flex-wrap gap-3">
        {Object.entries(TAG_DOT).map(([key, { dot, label }]) => (
          <span key={key} className="flex items-center gap-1 text-[11px] text-zinc-500">
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            {label}
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama molekul..."
          className="w-full rounded-md border border-zinc-200 bg-zinc-50 pl-8 pr-3 py-1.5 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              activeCategory === cat.slug
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && (
        <p className="py-8 text-center text-xs text-zinc-400">Memuat molekul...</p>
      )}
      {error && (
        <p className="py-8 text-center text-xs text-red-500">{error}</p>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm text-zinc-500">Tidak ada molekul cocok dengan filter.</p>
          <button
            onClick={() => { setQuery(""); setActiveCategory("all"); }}
            className="mt-2 text-xs text-zinc-400 underline hover:text-zinc-600"
          >
            Reset filter
          </button>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {filtered.map((m) => (
            <button
              key={m.name}
              onClick={() => setPreview(m)}
              className="group relative flex flex-col items-start rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left transition-all hover:border-zinc-400 hover:bg-white hover:shadow-sm active:scale-[0.98]"
            >
              <span className="mb-1 text-xs font-semibold text-zinc-800 group-hover:text-zinc-900">
                {m.name}
              </span>
              <span className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">
                {m.description}
              </span>
              {m.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {m.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        TAG_CHIP[tag] ?? "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${TAG_DOT[tag]?.dot ?? "bg-zinc-400"}`} />
                      {tag === "safe-dose" ? "Aman" :
                       tag === "endocrine-disruptor" ? "ED" :
                       tag === "carcinogen" ? "Karsinogen" :
                       "Kontro."}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Preview modal */}
      <MoleculePreviewModal
        molecule={preview}
        onClose={() => setPreview(null)}
        onPredict={handlePredict}
      />
    </div>
  );
}
