"use client";

import { useEffect, useRef } from "react";
import { ExampleMolecule } from "../lib/api";
import MoleculeStructure from "./MoleculeStructure";

const TAG_CONFIG: Record<string, { label: string; color: string }> = {
  "safe-dose": {
    label: "Aman (dosis wajar)",
    color: "bg-emerald-100 text-emerald-800",
  },
  "endocrine-disruptor": {
    label: "Endocrine Disruptor",
    color: "bg-amber-100 text-amber-800",
  },
  carcinogen: {
    label: "Karsinogen",
    color: "bg-red-100 text-red-800",
  },
  controversial: {
    label: "Kontroversial",
    color: "bg-purple-100 text-purple-800",
  },
};

const CATEGORY_LABEL: Record<string, string> = {
  drugs: "Obat-obatan Umum",
  hormones: "Hormon & Steroid",
  endocrine_disruptors: "Pengganggu Endokrin",
  solvents: "Pelarut Industri",
  pesticides: "Pestisida",
  food_additives: "Aditif Makanan",
  carcinogens: "Karsinogen Klasik",
  natural: "Senyawa Alami",
};

type Props = {
  molecule: ExampleMolecule | null;
  onClose: () => void;
  onPredict: (smiles: string) => void;
};

export default function MoleculePreviewModal({ molecule, onClose, onPredict }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent scroll when modal open
  useEffect(() => {
    if (molecule) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [molecule]);

  if (!molecule) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-200 bg-white px-5 py-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h2 className="text-base font-semibold text-zinc-900">
              {molecule.name}
            </h2>
            {molecule.category && CATEGORY_LABEL[molecule.category] && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                {CATEGORY_LABEL[molecule.category]}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            aria-label="Tutup"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Description — simple, full version */}
          <p className="text-sm leading-relaxed text-zinc-700">
            {molecule.description}
          </p>

          {/* 2D Structure */}
          <MoleculeStructure smiles={molecule.smiles} />

          {/* SMILES */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              SMILES
            </p>
            <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <code className="flex-1 text-xs font-mono text-zinc-700 break-all">
                {molecule.smiles}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(molecule.smiles)}
                title="Salin SMILES"
                className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tags — simple chips */}
          {molecule.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {molecule.tags.map((tag) => {
                const cfg = TAG_CONFIG[tag] ?? {
                  label: tag,
                  color: "bg-zinc-100 text-zinc-700",
                };
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => {
              onPredict(molecule.smiles);
              onClose();
            }}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 active:bg-zinc-800 transition-colors"
          >
            Prediksi Toksisitas →
          </button>
        </div>
      </div>
    </div>
  );
}
