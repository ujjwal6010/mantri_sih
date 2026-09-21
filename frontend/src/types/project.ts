export interface FinancialFingerprint {
  sanctioned_amount: number;
  released_amount: number;
  expenditure: number;
  expenditure_ratio?: number | null;
  release_ratio?: number | null;
  spending_velocity?: number | null;
}

export interface ProgressFingerprint {
  physical_progress: number;
  expected_progress?: number | null;
  progress_gap?: number | null;
}

export interface TemporalFingerprint {
  start_date: string;
  expected_completion: string;
  planned_duration_days?: number | null;
  elapsed_days?: number | null;
  delay_days?: number | null;
}

export interface GeographicFingerprint {
  latitude?: number | null;
  longitude?: number | null;
}

export interface EntityFingerprint {
  agency: string;
  contractor: string;
}

export interface ProjectFingerprint {
  financial: FinancialFingerprint;
  progress: ProgressFingerprint;
  temporal: TemporalFingerprint;
  geographic: GeographicFingerprint;
  entity: EntityFingerprint;
}

export interface RiskBreakdown {
  rule_score: number;
  ml_anomaly_score: number;
  similarity_score: number;
  peer_score: number;
}

export interface RiskResponse {
  risk_score: number;
  confidence_score: number;
  breakdown: RiskBreakdown;
  why_flagged: string[];
}

export interface SimilarProject {
  project_id: string;
  description?: string | null;
  distance_km?: number | null;
  text_similarity?: number | null;
  signals: string[];
  match_strength?: number | null;
}

export interface PeerComparison {
  peer_group_size: number;
  metric: string;
  project_value: number;
  peer_median: number;
  peer_q1: number;
  peer_q3: number;
  deviation: 'above_iqr' | 'below_iqr' | 'within_range' | string;
}

export interface DossierResponse {
  project_id: string;
  risk_score: number;
  confidence_score: number;
  why_flagged: string[];
  supporting_evidence: {
    expenditure_ratio?: number | null;
    release_ratio?: number | null;
    spending_velocity?: number | null;
    physical_progress?: number | null;
    expected_progress?: number | null;
    progress_gap?: number | null;
    delay_days?: number | null;
    sanctioned_amount?: number | null;
  };
  similar_projects: SimilarProject[];
  peer_comparisons: PeerComparison[];
  recommended_verification: string[];
  disclaimer: string;
}

export interface ProjectSummary {
  id: number;
  project_id: string;
  state: string;
  district: string;
  constituency: string;
  work_type: string;
  description: string;
  sanctioned_amount: number;
  released_amount: number;
  expenditure: number;
  physical_progress: number;
  start_date: string;
  expected_completion: string;
  latitude?: number | null;
  longitude?: number | null;
  agency: string;
  contractor: string;
  risk_score?: number | null;
  confidence_score?: number | null;
  main_signal?: string | null;
}

export interface ProjectDetail extends ProjectSummary {
  expenditure_ratio?: number | null;
  release_ratio?: number | null;
  spending_velocity?: number | null;
  expected_progress?: number | null;
  progress_gap?: number | null;
  planned_duration_days?: number | null;
  elapsed_days?: number | null;
  delay_days?: number | null;
}

export interface OverviewStats {
  total_projects: number;
  projects_requiring_attention: number;
  high_risk_signals: number;
  delayed_projects: number;
  potential_overlap_signals: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  top_states: Array<{
    state: string;
    count: number;
    avg_risk: number;
  }>;
  work_type_breakdown: Array<{
    work_type: string;
    count: number;
  }>;
}

export type RiskBand = 'all' | 'critical' | 'high' | 'medium' | 'low';
