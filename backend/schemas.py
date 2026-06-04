"""Pydantic schemas untuk request/response API."""
from typing import Optional, Any
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    smiles: str = Field(..., min_length=1, max_length=1000, description="SMILES notation molekul")
    model: Optional[str] = Field(None, description="Nama model: 'GCN' atau 'GAT'. Default = best model.")


class PredictBatchRequest(BaseModel):
    smiles_list: list[str] = Field(..., min_length=1, max_length=200)
    model: Optional[str] = Field(None, description="Model untuk batch predict")


class TaskPrediction(BaseModel):
    task: str
    probability: float
    description: str
    flagged: bool  # True jika probability > 0.5


class PredictResponse(BaseModel):
    smiles: str
    model: str
    predictions: list[TaskPrediction]
    highest_risk_task: Optional[str] = None
    highest_risk_probability: Optional[float] = None


class BatchPredictionItem(BaseModel):
    smiles: str
    success: bool
    error: Optional[str] = None
    predictions: Optional[list[TaskPrediction]] = None
    highest_risk_task: Optional[str] = None
    highest_risk_probability: Optional[float] = None


class PredictBatchResponse(BaseModel):
    model: str
    count: int
    results: list[BatchPredictionItem]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    best_model: str
    loaded_models: list[str]
    n_tasks: int


class TaskInfo(BaseModel):
    name: str
    description: str


class TasksResponse(BaseModel):
    tasks: list[TaskInfo]


class ExampleMolecule(BaseModel):
    name: str
    smiles: str
    description: str
    category: str = ""
    tags: list[str] = Field(default_factory=list)


class ExamplesResponse(BaseModel):
    examples: list[ExampleMolecule]


class EndpointDetail(BaseModel):
    name: str
    full_name: str
    category: str
    category_slug: str
    biological_role: str
    health_impact: str
    regulatory_context: str
    example_disruptors: list[str]
    assay_description: str


class CategoryInfo(BaseModel):
    slug: str
    name: str
    count: int


# ─── New schemas for interpretability & trust signals ─────────────────────────

class AtomImportanceRequest(BaseModel):
    smiles: str = Field(..., min_length=1, max_length=1000)
    task: str = Field(..., description="Nama endpoint, mis. 'NR-AR'")
    model: Optional[str] = Field(None, description="'GCN' atau 'GAT'. Default = best model.")


class AtomImportanceResponse(BaseModel):
    task: str
    model: str
    smiles: str
    atom_indices: list[int]
    importance: list[float]
    baseline_probability: float


class ToxicophoreMatch(BaseModel):
    name: str
    atom_indices: list[int]
    bond_indices: list[int]
    color: list[float]  # [R, G, B] float 0-1


class ModelInfo(BaseModel):
    name: str
    loaded: bool
    test_auc: Optional[float] = None
    test_prc: Optional[float] = None
    per_task: dict[str, float] = Field(default_factory=dict)
    is_best: bool = False


class ModelsResponse(BaseModel):
    best_model: str
    models: list[ModelInfo]


class MetricsResponse(BaseModel):
    tasks: list[str]
    models: dict[str, dict[str, Any]]  # {"GCN": {"NR-AR": 0.81, ...}, "GAT": {...}}
