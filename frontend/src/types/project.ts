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
  open_alerts?: number;
  escalated_count?: number;
}

export type RiskBand = 'all' | 'critical' | 'high' | 'medium' | 'low';

// V2: Evidence, Alerts, and Audit Trail

export interface EvidenceRecord {
  id: number;
  project_id: number;
  submitted_by: string;
  evidence_type: 'site_photo' | 'document' | 'geolocation' | 'inspector_note';
  description: string;
  file_path?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  submitted_at: string;
}

export type AlertStatus =
  | 'open'
  | 'under_review'
  | 'evidence_submitted'
  | 'escalated'
  | 'resolved'
  | 'dismissed';

export interface AlertAction {
  id: number;
  project_id: number;
  current_status: AlertStatus;
  assigned_to?: string | null;
  reviewed_by?: string | null;
  resolution_notes?: string | null;
  opened_at: string;
  resolved_at?: string | null;
}

export interface AuditEvent {
  id: number;
  project_id: number;
  actor: string;
  action: string;
  details?: string | null;
  timestamp: string;
  integrity_hash: string;
}

export interface AuditTrailResponse {
  events: AuditEvent[];
  total: number;
  chain_intact?: boolean | null;
}

export interface AlertStats {
  open_alerts: number;
  under_review: number;
  evidence_submitted: number;
  escalated: number;
  resolved: number;
  dismissed: number;
}

export interface SubmitEvidencePayload {
  submitted_by: string;
  evidence_type: string;
  description: string;
  file_path?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdateAlertPayload {
  new_status: string;
  actor: string;
  resolution_notes?: string | null;
}

export interface EvidenceRequirement {
  type: string;
  reasons: string[];
  weight: number;
  source_anomalies: string[];
  submitted: boolean;
}

export interface SufficiencyScore {
  score: number;
  total_required: number;
  submitted_count: number;
  missing_types: string[];
  requirements: EvidenceRequirement[];
}

export interface InspectorStats {
  inspector: string;
  total_handled: number;
  resolved: number;
  dismissed: number;
  escalated: number;
  active_reviews: number;
  resolve_rate: number;
  escalation_rate: number;
  avg_response_hours: number | null;
  is_flagged: boolean;
  flag_reason: string | null;
}

export interface ReinspectionResult {
  reopened: number;
  message: string;
}
