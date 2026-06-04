"use client";

import { useEffect, useState } from "react";
import { api, ModelInfo } from "../lib/api";

type Props = {
  value: string;
  onChange: (model: string) => void;
};

export default function ModelSelector({ value, onChange }: Props) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [bestModel, setBestModel] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.models()
      .then((res) => {
        setModels(res.models.filter((m) => m.loaded));
        setBestModel(res.best_model);
        if (!value && res.best_model) onChange(res.best_model);
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || models.length === 0) return null;
  if (models.length === 1) {
    // Hanya satu model, tidak perlu selector
    return (
      <p className="text-[11px] text-zinc-400">
        Model: <span className="font-medium text-zinc-600">{models[0].name}</span>
        {models[0].test_auc != null && (
          <span className="ml-1 text-zinc-400">
            (ROC-AUC {models[0].test_auc.toFixed(3)})
          </span>
        )}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-zinc-500">Model GNN:</span>
      <div className="flex gap-1">
        {models.map((m) => (
          <button
            key={m.name}
            onClick={() => onChange(m.name)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              value === m.name
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {m.name}
            {m.test_auc != null && (
              <span className={`ml-1 text-[10px] ${value === m.name ? "text-zinc-300" : "text-zinc-400"}`}>
                {m.test_auc.toFixed(3)}
              </span>
            )}
            {m.is_best && (
              <span className={`ml-1 text-[9px] ${value === m.name ? "text-zinc-300" : "text-zinc-400"}`}>
                ★
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
