"use client";

import { useEffect, useState } from "react";
import { api, HealthStatus } from "../lib/api";

export default function HealthBadge() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [unreachable, setUnreachable] = useState(false);

  useEffect(() => {
    api.health()
      .then(setStatus)
      .catch(() => setUnreachable(true));
  }, []);

  if (unreachable) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        API offline
      </span>
    );
  }

  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
        Cek API...
      </span>
    );
  }

  if (!status.model_loaded) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Model belum loaded
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {status.best_model} · {status.device} · {status.n_tasks} tasks
    </span>
  );
}
