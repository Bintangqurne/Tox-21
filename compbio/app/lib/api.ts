const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type TaskPrediction = {
  task: string;
  probability: number;
  description: string;
  flagged: boolean;
};

export type PredictResponse = {
  smiles: string;
  model: string;
  predictions: TaskPrediction[];
  highest_risk_task: string | null;
  highest_risk_probability: number | null;
};

export type BatchPredictionItem = {
  smiles: string;
  success: boolean;
  error?: string;
  predictions?: TaskPrediction[];
  highest_risk_task?: string | null;
  highest_risk_probability?: number | null;
};

export type PredictBatchResponse = {
  model: string;
  count: number;
  results: BatchPredictionItem[];
};

export type ExampleMolecule = {
  name: string;
  smiles: string;
  description: string;
  category: string;
  tags: string[];
};

export type HealthStatus = {
  status: string;
  model_loaded: boolean;
  device: string;
  best_model: string;
  loaded_models: string[];
  n_tasks: number;
};

export type EndpointDetail = {
  name: string;
  full_name: string;
  category: string;
  category_slug: string;
  biological_role: string;
  health_impact: string;
  regulatory_context: string;
  example_disruptors: string[];
  assay_description: string;
};

export type CategoryInfo = {
  slug: string;
  name: string;
  count: number;
};

export type ModelInfo = {
  name: string;
  loaded: boolean;
  test_auc: number | null;
  test_prc: number | null;
  per_task: Record<string, number>;
  is_best: boolean;
};

export type ModelsResponse = {
  best_model: string;
  models: ModelInfo[];
};

export type MetricsResponse = {
  tasks: string[];
  models: Record<string, Record<string, number>>;
};

export type AtomImportanceResponse = {
  task: string;
  model: string;
  smiles: string;
  atom_indices: number[];
  importance: number[];
  baseline_probability: number;
};

export type ToxicophoreMatch = {
  name: string;
  atom_indices: number[];
  bond_indices: number[];
  color: number[]; // [R, G, B] float 0-1
};

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // body bukan JSON
    }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  baseUrl: API_BASE,

  health: () => fetch(`${API_BASE}/api/health`).then(handle<HealthStatus>),

  examples: () =>
    fetch(`${API_BASE}/api/examples`)
      .then(handle<{ examples: ExampleMolecule[] }>)
      .then((d) => d.examples),

  endpoints: () =>
    fetch(`${API_BASE}/api/endpoints`).then(handle<EndpointDetail[]>),

  categories: () =>
    fetch(`${API_BASE}/api/categories`).then(handle<CategoryInfo[]>),

  models: () =>
    fetch(`${API_BASE}/api/models`).then(handle<ModelsResponse>),

  metrics: () =>
    fetch(`${API_BASE}/api/metrics`).then(handle<MetricsResponse>),

  predict: (smiles: string, model?: string) =>
    fetch(`${API_BASE}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ smiles, model: model ?? null }),
    }).then(handle<PredictResponse>),

  predictBatch: (smilesList: string[], model?: string) =>
    fetch(`${API_BASE}/api/predict/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ smiles_list: smilesList, model: model ?? null }),
    }).then(handle<PredictBatchResponse>),

  predictCsv: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`${API_BASE}/api/predict/csv`, { method: "POST", body: fd }).then(
      handle<PredictBatchResponse>,
    );
  },

  atomImportance: (smiles: string, task: string, model?: string) =>
    fetch(`${API_BASE}/api/atom-importance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ smiles, task, model: model ?? null }),
    }).then(handle<AtomImportanceResponse>),

  toxicophores: (smiles: string) =>
    fetch(`${API_BASE}/api/toxicophores?smiles=${encodeURIComponent(smiles)}`).then(
      handle<ToxicophoreMatch[]>,
    ),

  moleculeSvgUrl: (
    smiles: string,
    width = 400,
    height = 300,
    highlight: "none" | "toxicophore" | "importance" = "none",
    task = "",
    model = "",
  ) => {
    let url = `${API_BASE}/api/molecule/svg?smiles=${encodeURIComponent(smiles)}&width=${width}&height=${height}&highlight=${highlight}`;
    if (task) url += `&task=${encodeURIComponent(task)}`;
    if (model) url += `&model=${encodeURIComponent(model)}`;
    return url;
  },
};
