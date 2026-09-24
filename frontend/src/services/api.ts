import type {
  DossierResponse,
  OverviewStats,
  ProjectDetail,
  ProjectFingerprint,
  ProjectSummary,
  RiskResponse,
  EvidenceRecord,
  AlertAction,
  AuditTrailResponse,
  AlertStats,
  SubmitEvidencePayload,
  UpdateAlertPayload,
  EvidenceRequirement,
  SufficiencyScore,
  InspectorStats,
  ReinspectionResult,
  RiskSnapshot,
  RiskVelocity,
  ResidualAnomaly,
  EntityGraph,
  EntityCluster,
  GamingSuspect,
} from '../types/project';
import {
  MOCK_DOSSIERS,
  MOCK_FINGERPRINTS,
  MOCK_OVERVIEW,
  MOCK_PROJECTS,
  MOCK_RISK,
  MOCK_EVIDENCE,
  MOCK_ALERTS,
  MOCK_AUDIT_EVENTS,
  MOCK_ALERT_STATS,
} from './mockData';

const BASE_URL = 'http://127.0.0.1:8000';

let isBackendLive = false;

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${BASE_URL}/`, { signal: controller.signal });
    clearTimeout(timeoutId);
    isBackendLive = res.ok;
    return res.ok;
  } catch {
    isBackendLive = false;
    return false;
  }
};

export const getBackendStatus = () => isBackendLive;

export async function fetchOverview(): Promise<OverviewStats> {
  try {
    const res = await fetch(`${BASE_URL}/overview`);
    if (!res.ok) throw new Error(`Overview fetch failed: ${res.statusText}`);
    const data = await res.json();
    isBackendLive = true;
    return data;
  } catch {
    console.info('[Mantri Drishti] Using offline demonstration overview');
    return MOCK_OVERVIEW;
  }
}

export async function fetchProjects(params?: {
  state?: string;
  district?: string;
  work_type?: string;
  risk_min?: number;
  risk_max?: number;
  sort_by?: string;
  limit?: number;
}): Promise<ProjectSummary[]> {
  try {
    const query = new URLSearchParams();
    if (params?.state && params.state !== 'all') query.append('state', params.state);
    if (params?.district) query.append('district', params.district);
    if (params?.work_type && params.work_type !== 'all') query.append('work_type', params.work_type);
    if (params?.risk_min !== undefined) query.append('risk_min', params.risk_min.toString());
    if (params?.risk_max !== undefined) query.append('risk_max', params.risk_max.toString());
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.limit) query.append('limit', params.limit.toString());

    const url = `${BASE_URL}/projects${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Projects fetch failed: ${res.statusText}`);
    const data = await res.json();
    isBackendLive = true;
    return data;
  } catch {
    console.info('[Mantri Drishti] Using offline demonstration projects');
    let filtered = [...MOCK_PROJECTS];

    if (params?.state && params.state !== 'all') {
      filtered = filtered.filter((p) => p.state.toLowerCase() === params.state?.toLowerCase());
    }
    if (params?.work_type && params.work_type !== 'all') {
      filtered = filtered.filter((p) => p.work_type === params.work_type);
    }
    if (params?.risk_min !== undefined) {
      filtered = filtered.filter((p) => (p.risk_score ?? 0) >= (params.risk_min ?? 0));
    }
    if (params?.risk_max !== undefined) {
      filtered = filtered.filter((p) => (p.risk_score ?? 0) <= (params.risk_max ?? 100));
    }
    if (params?.sort_by === 'risk') {
      filtered.sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0));
    } else if (params?.sort_by === 'district') {
      filtered.sort((a, b) => a.district.localeCompare(b.district));
    }

    return filtered;
  }
}

export async function fetchProjectDetail(projectId: string): Promise<ProjectDetail> {
  try {
    const res = await fetch(`${BASE_URL}/projects/${projectId}`);
    if (!res.ok) throw new Error(`Project detail failed`);
    return await res.json();
  } catch {
    const found = MOCK_PROJECTS.find((p) => p.project_id === projectId) || MOCK_PROJECTS[0];
    return {
      ...found,
      expenditure_ratio: (found.expenditure / found.sanctioned_amount) * 100,
      release_ratio: (found.released_amount / found.sanctioned_amount) * 100,
      spending_velocity: 2850,
      expected_progress: 100,
      progress_gap: Math.max(0, 100 - found.physical_progress),
      planned_duration_days: 365,
      elapsed_days: 520,
      delay_days: 155,
    };
  }
}

export async function fetchProjectFingerprint(projectId: string): Promise<ProjectFingerprint> {
  try {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/fingerprint`);
    if (!res.ok) throw new Error(`Fingerprint fetch failed`);
    return await res.json();
  } catch {
    return (
      MOCK_FINGERPRINTS[projectId] || {
        financial: {
          sanctioned_amount: 3500000,
          released_amount: 3200000,
          expenditure: 2900000,
          expenditure_ratio: 82.8,
          release_ratio: 91.4,
          spending_velocity: 2450.0,
        },
        progress: {
          physical_progress: 42.0,
          expected_progress: 85.0,
          progress_gap: 43.0,
        },
        temporal: {
          start_date: '2023-01-10',
          expected_completion: '2023-11-30',
          planned_duration_days: 324,
          elapsed_days: 480,
          delay_days: 156,
        },
        geographic: {
          latitude: 25.3176,
          longitude: 82.9739,
        },
        entity: {
          agency: 'District Rural Development Authority',
          contractor: 'Apex Infra Solutions',
        },
      }
    );
  }
}

export async function fetchProjectRisk(projectId: string): Promise<RiskResponse> {
  try {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/risk`);
    if (!res.ok) throw new Error(`Risk fetch failed`);
    return await res.json();
  } catch {
    return (
      MOCK_RISK[projectId] || {
        risk_score: 74.5,
        confidence_score: 88.0,
        breakdown: {
          rule_score: 75.0,
          ml_anomaly_score: 70.0,
          similarity_score: 80.0,
          peer_score: 72.0,
        },
        why_flagged: [
          'High expenditure ratio relative to physical progress milestone',
          'Timeline delay exceeding peer district median by 2.1x',
          'Multiple works allocated to single contractor entity within 5km radius',
        ],
      }
    );
  }
}

export async function fetchProjectDossier(projectId: string): Promise<DossierResponse> {
  try {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/dossier`);
    if (!res.ok) throw new Error(`Dossier fetch failed`);
    return await res.json();
  } catch {
    return (
      MOCK_DOSSIERS[projectId] || {
        project_id: projectId,
        risk_score: 78.5,
        confidence_score: 92.0,
        why_flagged: [
          'High expenditure ratio relative to physical progress milestone',
          'Progress gap: physical completion lags timeline expectations significantly',
          'Cluster of active works held by the same contractor',
        ],
        supporting_evidence: {
          expenditure_ratio: 82.8,
          release_ratio: 91.4,
          spending_velocity: 2450.0,
          physical_progress: 42.0,
          expected_progress: 85.0,
          progress_gap: 43.0,
          delay_days: 156,
          sanctioned_amount: 3500000,
        },
        similar_projects: [
          {
            project_id: 'MD047',
            description: 'Similar sanctioned work in neighboring ward by same contractor',
            distance_km: 1.2,
            text_similarity: 0.68,
            signals: ['Entity overlap', 'Geo proximity < 2km'],
            match_strength: 0.75,
          },
        ],
        peer_comparisons: [
          {
            peer_group_size: 15,
            metric: 'Expenditure / Progress Ratio',
            project_value: 1.97,
            peer_median: 1.05,
            peer_q1: 0.85,
            peer_q3: 1.25,
            deviation: 'above_iqr',
          },
        ],
        recommended_verification: [
          'Conduct physical inspection of on-ground work status.',
          'Review financial expenditure vouchers and sanction releases.',
          'Verify project boundary and GPS coordinates against neighboring works.',
        ],
        disclaimer:
          'This dossier identifies risk signals for authorised human verification. It does not establish fraud or misconduct.',
      }
    );
  }
}

// V2: Evidence, Alerts, Audit Trail

export async function submitEvidence(
  projectId: string,
  payload: SubmitEvidencePayload,
): Promise<EvidenceRecord> {
  try {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error('[Mantri Drishti] Evidence submission failed:', err);
    throw err;
  }
}

export async function fetchEvidence(projectId: string): Promise<EvidenceRecord[]> {
  try {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/evidence`);
    if (!res.ok) throw new Error(`Evidence fetch failed`);
    return await res.json();
  } catch {
    return MOCK_EVIDENCE[projectId] || [];
  }
}

export async function fetchAlertStatus(projectId: string): Promise<AlertAction | null> {
  try {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/alert`);
    if (!res.ok) throw new Error(`Alert fetch failed`);
    const data = await res.json();
    return data;
  } catch {
    return MOCK_ALERTS[projectId] || null;
  }
}

export async function updateAlert(
  projectId: string,
  payload: UpdateAlertPayload,
): Promise<AlertAction> {
  try {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/alert`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || 'Alert update failed');
    }
    return await res.json();
  } catch (err) {
    console.error('[Mantri Drishti] Alert update failed:', err);
    throw err;
  }
}

export async function fetchAuditTrail(
  projectId?: string,
  limit = 100,
): Promise<AuditTrailResponse> {
  try {
    const url = projectId
      ? `${BASE_URL}/projects/${projectId}/audit-trail?limit=${limit}`
      : `${BASE_URL}/audit-trail?limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Audit trail fetch failed`);
    return await res.json();
  } catch {
    const events = projectId ? (MOCK_AUDIT_EVENTS[projectId] || []) : Object.values(MOCK_AUDIT_EVENTS).flat();
    return { events, total: events.length, chain_intact: true };
  }
}

export async function verifyAuditChain(
  projectId: string,
): Promise<{ valid: boolean; checked: number; broken_at: number | null }> {
  try {
    const res = await fetch(`${BASE_URL}/audit-trail/verify/${projectId}`);
    if (!res.ok) throw new Error(`Chain verification failed`);
    return await res.json();
  } catch {
    return { valid: true, checked: 3, broken_at: null };
  }
}

export async function fetchAlertOverview(): Promise<AlertStats> {
  try {
    const res = await fetch(`${BASE_URL}/alerts/overview`);
    if (!res.ok) throw new Error(`Alert overview failed`);
    return await res.json();
  } catch {
    return MOCK_ALERT_STATS;
  }
}

// V2 Advanced: Evidence Requirements, Sufficiency, Inspector Analytics

export async function fetchEvidenceRequirements(
  projectId: string,
): Promise<EvidenceRequirement[]> {
  try {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/evidence-requirements`);
    if (!res.ok) throw new Error(`Evidence requirements fetch failed`);
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchSufficiencyScore(
  projectId: string,
): Promise<SufficiencyScore> {
  try {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/evidence-sufficiency`);
    if (!res.ok) throw new Error(`Sufficiency score fetch failed`);
    return await res.json();
  } catch {
    return {
      score: 0,
      total_required: 0,
      submitted_count: 0,
      missing_types: [],
      requirements: [],
    };
  }
}

export async function fetchInspectorAnalytics(): Promise<InspectorStats[]> {
  try {
    const res = await fetch(`${BASE_URL}/inspectors/analytics`);
    if (!res.ok) throw new Error(`Inspector analytics fetch failed`);
    return await res.json();
  } catch {
    return [];
  }
}

export async function triggerReinspection(
  sampleRate = 0.2,
): Promise<ReinspectionResult> {
  try {
    const res = await fetch(
      `${BASE_URL}/reinspection/trigger?sample_rate=${sampleRate}`,
      { method: 'POST' },
    );
    if (!res.ok) throw new Error(`Reinspection trigger failed`);
    return await res.json();
  } catch {
    return { reopened: 0, message: 'Re-inspection service unavailable.' };
  }
}

// ==========================================
// V3 Intelligence API (Understand & Adapt)
// ==========================================

export const fetchRiskTrajectory = async (projectId: string): Promise<{ project_code: string; trajectory: RiskSnapshot[] }> => {
  try {
    const response = await fetch(`${BASE_URL}/v3/projects/${projectId}/risk-trajectory`);
    if (!response.ok) throw new Error('Failed to fetch risk trajectory');
    return await response.json();
  } catch {
    return { project_code: projectId, trajectory: [] };
  }
};

export const fetchRiskVelocity = async (projectId: string): Promise<{ project_code: string; velocity_data: RiskVelocity }> => {
  try {
    const response = await fetch(`${BASE_URL}/v3/projects/${projectId}/risk-velocity`);
    if (!response.ok) throw new Error('Failed to fetch risk velocity');
    return await response.json();
  } catch {
    return {
      project_code: projectId,
      velocity_data: { velocity: 0, total_change: 0, trend: 'stable', recent_changes: [] }
    };
  }
};

export const fetchResidualAnomaly = async (projectId: string): Promise<ResidualAnomaly> => {
  try {
    const response = await fetch(`${BASE_URL}/v3/projects/${projectId}/residual-anomaly`);
    if (!response.ok) throw new Error('Failed to fetch residual anomaly');
    return await response.json();
  } catch {
    return {
      project_code: projectId,
      raw_risk_score: 0,
      explained_deduction: 0,
      contextual_reasons: [],
      residual_risk_score: 0,
      unexplained_percentage: 0,
      status: 'normal'
    };
  }
};

export const fetchEntityGraph = async (): Promise<EntityGraph> => {
  try {
    const response = await fetch(`${BASE_URL}/v3/entities/graph`);
    if (!response.ok) throw new Error('Failed to fetch entity graph');
    return await response.json();
  } catch {
    return { nodes: [], links: [] };
  }
};

export const fetchEntityClusters = async (): Promise<{ clusters: EntityCluster[] }> => {
  try {
    const response = await fetch(`${BASE_URL}/v3/entities/clusters`);
    if (!response.ok) throw new Error('Failed to fetch entity clusters');
    return await response.json();
  } catch {
    return { clusters: [] };
  }
};

export const fetchGamingDetection = async (): Promise<{ suspects: GamingSuspect[] }> => {
  try {
    const response = await fetch(`${BASE_URL}/v3/monitoring/gaming-detection`);
    if (!response.ok) throw new Error('Failed to fetch gaming detection suspects');
    return await response.json();
  } catch {
    return { suspects: [] };
  }
};

