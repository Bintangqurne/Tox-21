"use client";

import { useState } from "react";
import { PredictResponse, EndpointDetail, MetricsResponse } from "../lib/api";
import EndpointDetailModal from "./EndpointDetailModal";
import ExportButton from "./ExportButton";

type Props = {
  data: PredictResponse;
  endpointDetails?: EndpointDetail[];
  metrics?: MetricsResponse | null;
  onSelectImportanceTask?: (task: string) => void;  // untuk trigger atom importance
};

function probColor(p: number): string {
  if (p > 0.5) return "bg-red-500";
  if (p > 0.3) return "bg-amber-500";
  return "bg-emerald-500";
}

function flagBadgeClass(p: number): string {
  if (p > 0.75) return "bg-red-100 text-red-700";
  if (p > 0.5) return "bg-orange-100 text-orange-700";
  return "";
}

function flagLabel(p: number): string {
  if (p > 0.75) return "RISIKO TINGGI";
  if (p > 0.5) return "PERHATIAN";
  return "";
}

/** AUC ke 1-5 bintang untuk reliabilitas */
function aucToStars(auc: number): number {
  if (auc >= 0.88) return 5;
  if (auc >= 0.82) return 4;
  if (auc >= 0.75) return 3;
  if (auc >= 0.68) return 2;
  return 1;
}

function ReliabilityStars({ auc }: { auc: number }) {
  const stars = aucToStars(auc);
  return (
    <span title={`ROC-AUC: ${auc.toFixed(3)} (${stars}/5 bintang reliabilitas)`} className="text-[10px]">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < stars ? "text-amber-400" : "text-zinc-200"}>★</span>
      ))}
    </span>
  );
}

export default function PredictionTable({
  data,
  endpointDetails = [],
  metrics = null,
  onSelectImportanceTask,
}: Props) {
  const sorted = [...data.predictions].sort((a, b) => b.probability - a.probability);
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointDetail | null>(null);

  const detailMap = new Map(endpointDetails.map((ep) => [ep.name, ep]));
  // per-task AUC untuk model yang sedang aktif
  const perTaskAuc: Record<string, number> = metrics?.models?.[data.model] ?? {};

  return (
    <>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-sm font-medium text-zinc-700">
              Probabilitas Toksisitas — Model {data.model}
            </h3>
            {data.highest_risk_task && (
              <span className="text-xs text-zinc-500">
                Tertinggi:{" "}
                <strong>{data.highest_risk_task}</strong>{" "}
                ({(data.highest_risk_probability! * 100).toFixed(1)}%)
              </span>
            )}
          </div>
          <ExportButton data={data} />
        </div>

        <ul className="flex flex-col gap-2">
          {sorted.map((p) => {
            const hasDetail = detailMap.has(p.task);
            const taskAuc = perTaskAuc[p.task];
            return (
              <li key={p.task} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-mono font-medium text-zinc-800">
                    {hasDetail ? (
                      <button
                        onClick={() => setActiveEndpoint(detailMap.get(p.task)!)}
                        className="underline decoration-dotted underline-offset-2 hover:text-zinc-500 transition-colors cursor-pointer"
                        title="Klik untuk detail dampak biologis"
                      >
                        {p.task}
                      </button>
                    ) : (
                      <span>{p.task}</span>
                    )}
                    {p.flagged && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${flagBadgeClass(p.probability)}`}
                      >
                        {flagLabel(p.probability)}
                      </span>
                    )}
                    {hasDetail && (
                      <button
                        onClick={() => setActiveEndpoint(detailMap.get(p.task)!)}
                        title="Lihat detail endpoint"
                        className="text-zinc-300 hover:text-zinc-500 transition-colors"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    {/* Atom importance trigger */}
                    {onSelectImportanceTask && (
                      <button
                        onClick={() => onSelectImportanceTask(p.task)}
                        title={`Visualisasi atom importance untuk ${p.task}`}
                        className="text-zinc-300 hover:text-zinc-500 transition-colors"
                      >
                        🔍
                      </button>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {taskAuc != null && <ReliabilityStars auc={taskAuc} />}
                    <span className="font-mono tabular-nums text-zinc-700">
                      {(p.probability * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full transition-all ${probColor(p.probability)}`}
                    style={{ width: `${Math.min(100, p.probability * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-zinc-500">{p.description}</p>
                  {taskAuc != null && (
                    <span className="text-[10px] text-zinc-400" title="Test ROC-AUC model untuk task ini">
                      AUC {taskAuc.toFixed(2)}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> &lt; 30% (rendah)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> 30–50% (sedang)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> &gt; 50% (tinggi)
          </span>
          {Object.keys(perTaskAuc).length > 0 && (
            <span className="flex items-center gap-1 text-zinc-400">
              <span className="text-amber-400">★★★</span> = reliabilitas model per task
            </span>
          )}
        </div>

        <p className="mt-2 text-[10px] text-zinc-400">
          {endpointDetails.length > 0 && "💡 Klik nama task (garis bawah) untuk detail biologis. "}
          {onSelectImportanceTask && "🔍 untuk visualisasi atom importance."}
        </p>
      </div>

      <EndpointDetailModal
        endpoint={activeEndpoint}
        onClose={() => setActiveEndpoint(null)}
      />
    </>
  );
}
