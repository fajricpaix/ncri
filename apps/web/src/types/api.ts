export type Origin = "PUBLIC" | "PARTNER";
export type Region = { id: string; code: string; name: string; level: string };
export type Indicator = { id: string; code: string; name: string; unit: string | null };
export type DataSource = { id: string; code: string; name: string; source_type: string; description: string | null; is_active: boolean };
export type CulturalObject = {
  id: string; external_code: string | null; name: string; category: string; description: string | null;
  region_id: string | null; latitude: number | null; longitude: number | null; source_id: string | null;
  verification_status: string; data_origin: Origin;
};
export type Observation = {
  id: string; indicator_id: string; period_start: string; period_end: string;
  value_numeric: number | null; source_id: string; verification_status: string; data_origin: Origin;
};
export type ImportReport = {
  committed: boolean; job_id: string | null; records_total: number; records_valid: number;
  records_failed: number; errors: { row: number; field: string; message: string }[];
  preview: Record<string, string>[];
};

export type RiskLevelName = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
export type Overview = {
  latest_period_end: string | null; method_version: string; sources: string[];
  total_objects: number;
  assessed_objects: number;
  distribution: Record<RiskLevelName, number>;
  avg_confidence: number | null;
  trend: ({ period_end: string } & Record<RiskLevelName, number>)[];
  open_warnings: Record<"HIGH" | "MEDIUM" | "LOW", number>;
  quality: { completeness: number | null; freshness: number | null; verification: number | null };
  priority: { id: string; name: string; province: string | null; score: number; level: RiskLevelName; data_confidence: number }[];
};
export type RiskFactor = {
  indicator_code: string; indicator_name: string; normalized_risk: number; weight: number;
  contribution: number; change_pct: number; direction: string; evidence_observation_ids: string[];
};
export type Risk = {
  risk_score: number | null; risk_level: RiskLevelName; data_confidence: number | null;
  method_version: string; period_start: string; period_end: string;
  factors: RiskFactor[]; confidence_components: Record<string, number>;
};
export type Warning = {
  id: string; cultural_object_id: string; object_name: string;
  severity: "HIGH" | "MEDIUM" | "LOW"; title: string; description: string; status: string;
};

export type LlmOutput = {
  summary: string;
  risk_drivers: { factor: string; evidence_refs: string[]; interpretation: string; confidence: string }[];
  root_cause_hypotheses: { hypothesis: string; supporting_evidence: string[]; missing_evidence: string[]; confidence: string; validation_needed: boolean }[];
  recommended_actions: { action: string; target_group: string; suggested_kpis: string[]; time_horizon: string; evidence_refs: string[] }[];
  limitations: string[];
};
export type Analysis = {
  id: string; analysis_type: "RISK_EXPLANATION" | "ROOT_CAUSE" | "RECOMMENDATION"; provider: string; model: string;
  prompt_version: string; review_status: "DRAFT" | "APPROVED" | "REJECTED"; output: LlmOutput;
  evidence_refs: string[]; validation_errors: string[];
};
export type Recommendation = {
  id: string; cultural_object_id: string; object_name: string; title: string; problem_statement: string;
  root_cause_hypotheses: LlmOutput["root_cause_hypotheses"]; recommended_actions: LlmOutput["recommended_actions"];
  target_groups: string[]; suggested_kpis: string[]; status: string; provider: string | null;
};

export type MapLevel = RiskLevelName | "NO_DATA";
export type ProvinceSummary = {
  code: string; name: string; n_objects: number; assessed: number; avg_score: number | null;
  avg_confidence: number | null; level: MapLevel; merged_note: string | null;
  distribution: Record<RiskLevelName, number>;
  objects: { id: string; name: string; category: string; score: number | null; level: RiskLevelName; confidence: number | null }[];
};
export type ReportObject = {
  id: string; name: string; category: string; external_code: string | null; province: string | null;
  data_origin: Origin; verification: string; score: number | null; level: RiskLevelName;
  confidence: number | null; period_end: string | null;
};
export type ExecutiveReport = {
  generated_at: string; scope: string; province: string | null; total_objects: number;
  distribution: Record<RiskLevelName, number>; assessed: number; avg_score: number | null; avg_confidence: number | null;
  level: RiskLevelName; open_warnings: Record<"HIGH" | "MEDIUM" | "LOW", number>; data_origins: Record<string, number>;
  method_version: string; method_params: { decline_for_max_risk_pct: number; thresholds: { HIGH: number; MEDIUM: number } };
  caveats: string[]; objects: ReportObject[];
};

export type PredictionStatus = {
  passed: boolean; reasons: string[]; target: string; baseline: string;
  requirements: { label: string; current: number; needed: number; met: boolean }[];
  thresholds: Record<string, number>;
};

export type Answer = {
  id: string; question: string; scope: string; answer: string; answerable: boolean;
  evidence_refs: string[]; limitations: string[]; provider: string; model: string;
};
export type AiSubmission = {
  id: string; batch_id: string; kind: "OBJECT" | "OBSERVATION"; payload: Record<string, string | number | null>;
  evidence_text: string; sources: { url: string; title: string }[]; query: string; provider: string; model: string;
  status: "PENDING" | "APPROVED" | "REJECTED"; created_at: string; review_note: string | null;
};
