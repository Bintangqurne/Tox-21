"use client";

import { FormEvent } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
};

export default function SmilesInput({ value, onChange, onSubmit, loading }: Props) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!loading && value.trim()) onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="smiles" className="text-sm font-medium text-zinc-700">
        SMILES Notation
      </label>
      <textarea
        id="smiles"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="contoh: CC(=O)Oc1ccccc1C(=O)O"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        rows={3}
        spellCheck={false}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {loading ? "Memprediksi..." : "Prediksi Toksisitas"}
      </button>
    </form>
  );
}
