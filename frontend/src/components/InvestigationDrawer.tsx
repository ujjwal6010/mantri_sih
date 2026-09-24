import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  FileCheck,
  ExternalLink,
  MapPin,
  Calendar,
  DollarSign,
  TrendingDown,
  Building2,
  CheckSquare,
  Square,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type { ProjectFingerprint, RiskResponse, ProjectSummary } from '../types/project';
import { fetchProjectFingerprint, fetchProjectRisk } from '../services/api';
import { AlertLifecycle } from './AlertLifecycle';
import { EvidencePanel } from './EvidencePanel';
import { RiskTrajectory } from './RiskTrajectory';
import { ResidualBadge } from './ResidualBadge';

interface InvestigationDrawerProps {
  projectId: string | null;
  projectSummary: ProjectSummary | null;
  onClose: () => void;
  onOpenFullDossier: (projectId: string) => void;
}

export const InvestigationDrawer: React.FC<InvestigationDrawerProps> = ({
  projectId,
  projectSummary,
  onClose,
  onOpenFullDossier,
}) => {
  const [fingerprint, setFingerprint] = useState<ProjectFingerprint | null>(null);
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    setIsLoading(true);
    setCheckedTasks({});

    Promise.all([fetchProjectFingerprint(projectId), fetchProjectRisk(projectId)])
      .then(([fpData, riskData]) => {
        if (isMounted) {
          setFingerprint(fpData);
          setRisk(riskData);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load drawer data:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  if (!projectId) return null;

  const toggleTask = (index: number) => {
    setCheckedTasks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getRiskColorClass = (score: number) => {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const riskScore = risk?.risk_score ?? projectSummary?.risk_score ?? 0;
  const confScore = risk?.confidence_score ?? projectSummary?.confidence_score ?? 0;
  const riskClass = getRiskColorClass(riskScore);

  return (
    <div className="drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <aside className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <div className="project-tag-line">
              <span className="drawer-id-badge telemetry-num">{projectId}</span>
              <span className="drawer-sector-tag">{projectSummary?.work_type}</span>
            </div>
            <h2 className="drawer-heading">{projectSummary?.description}</h2>
            <div className="drawer-location-sub">
              <MapPin size={13} />
              <span>
                {projectSummary?.district}, {projectSummary?.state} ({projectSummary?.constituency})
              </span>
            </div>
          </div>

          <div className="drawer-header-actions">
            <button
              className="open-dossier-header-btn"
              onClick={() => onOpenFullDossier(projectId)}
              title="Open full printable investigation dossier"
            >
              <ExternalLink size={14} />
              <span>Full Dossier</span>
            </button>
            <button className="drawer-close-btn" onClick={onClose} aria-label="Close panel">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Drawer Content Body */}
        <div className="drawer-scroll-body">
          {isLoading ? (
            <div className="drawer-loading-skeleton">
              <div className="skeleton-card large" />
              <div className="skeleton-card medium" />
              <div className="skeleton-card medium" />
            </div>
          ) : (
            <>
              {/* 1. Score Telemetry Card */}
              <div className={`score-telemetry-banner ${riskClass}`}>
                <div className="fused-score-col">
                  <div className="banner-score-header">
                    <ShieldAlert size={18} />
                    <span>FUSED RISK SCORE</span>
                  </div>
                  <div className="banner-score-val telemetry-num">
                    {riskScore.toFixed(1)}
                    <span className="score-denominator">/ 100</span>
                  </div>
                  <span className="score-tier-tag">{riskClass.toUpperCase()} SEVERITY</span>
                </div>

                <div className="score-divider-v" />

                <div className="conf-score-col">
                  <div className="banner-score-header">
                    <ShieldCheck size={18} />
                    <span>SIGNAL CONFIDENCE</span>
                  </div>
                  <div className="banner-score-val telemetry-num">
                    {confScore.toFixed(0)}%
                  </div>
                  <span className="conf-desc-tag">
                    {confScore >= 90 ? 'High Signal Agreement' : 'Sufficient Data Evidence'}
                  </span>
                </div>
              </div>

              {/* V3: Contextual vs Residual Risk */}
              <ResidualBadge projectId={projectId} />

              {/* V3: Temporal Trajectory */}
              <div className="drawer-section">
                <RiskTrajectory projectId={projectId} />
              </div>

              {/* 2. Four-Engine Intelligence Fusion Breakdown */}
              {risk && (
                <div className="drawer-section">
                  <div className="section-title-row">
                    <Cpu size={16} className="section-icon" />
                    <h3 className="section-title">Risk Engine Synthesis (Weighted Fusion)</h3>
                  </div>
                  <div className="engine-weights-grid">
                    {/* Rule Engine */}
                    <div className="engine-card">
                      <div className="engine-card-header">
                        <span className="engine-name">Rule Engine</span>
                        <span className="engine-weight">35% wt</span>
                      </div>
                      <div className="engine-score telemetry-num">
                        {risk.breakdown.rule_score.toFixed(1)}
                      </div>
                      <div className="engine-progress-track">
                        <div
                          className="engine-progress-fill warning"
                          style={{ width: `${Math.min(100, risk.breakdown.rule_score)}%` }}
                        />
                      </div>
                      <span className="engine-desc">Deterministic thresholds</span>
                    </div>

                    {/* Isolation Forest ML */}
                    <div className="engine-card">
                      <div className="engine-card-header">
                        <span className="engine-name">Isolation Forest</span>
                        <span className="engine-weight">30% wt</span>
                      </div>
                      <div className="engine-score telemetry-num">
                        {risk.breakdown.ml_anomaly_score.toFixed(1)}
                      </div>
                      <div className="engine-progress-track">
                        <div
                          className="engine-progress-fill indigo"
                          style={{ width: `${Math.min(100, risk.breakdown.ml_anomaly_score)}%` }}
                        />
                      </div>
                      <span className="engine-desc">Unsupervised ML outlier</span>
                    </div>

                    {/* Similarity Engine */}
                    <div className="engine-card">
                      <div className="engine-card-header">
                        <span className="engine-name">Similarity</span>
                        <span className="engine-weight">15% wt</span>
                      </div>
                      <div className="engine-score telemetry-num">
                        {risk.breakdown.similarity_score.toFixed(1)}
                      </div>
                      <div className="engine-progress-track">
                        <div
                          className="engine-progress-fill cyan"
                          style={{ width: `${Math.min(100, risk.breakdown.similarity_score)}%` }}
                        />
                      </div>
                      <span className="engine-desc">Duplicate / overlap check</span>
                    </div>

                    {/* Peer Benchmarking */}
                    <div className="engine-card">
                      <div className="engine-card-header">
                        <span className="engine-name">Peer Benchmark</span>
                        <span className="engine-weight">20% wt</span>
                      </div>
                      <div className="engine-score telemetry-num">
                        {risk.breakdown.peer_score.toFixed(1)}
                      </div>
                      <div className="engine-progress-track">
                        <div
                          className="engine-progress-fill amber"
                          style={{ width: `${Math.min(100, risk.breakdown.peer_score)}%` }}
                        />
                      </div>
                      <span className="engine-desc">IQR state peer deviation</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Why Flagged (AI Explainability) */}
              {risk && risk.why_flagged && risk.why_flagged.length > 0 && (
                <div className="drawer-section">
                  <div className="section-title-row">
                    <AlertTriangle size={16} className="section-icon warning" />
                    <h3 className="section-title">Anomalies Detected ("Why Flagged")</h3>
                  </div>
                  <ul className="why-flagged-list">
                    {risk.why_flagged.map((reason, idx) => (
                      <li key={idx} className="why-flagged-item">
                        <span className="flag-bullet" />
                        <span className="flag-text">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. 5-Dimensional Behavioral Fingerprint */}
              {fingerprint && (
                <div className="drawer-section">
                  <div className="section-title-row">
                    <FileCheck size={16} className="section-icon" />
                    <h3 className="section-title">5-Dimensional Behavioral Fingerprint</h3>
                  </div>

                  <div className="fingerprint-panels-wrap">
                    {/* Dimension 1: Financial */}
                    <div className="fp-card">
                      <div className="fp-card-head">
                        <DollarSign size={14} />
                        <span>1. Financial Dimension</span>
                      </div>
                      <div className="fp-grid-2">
                        <div className="fp-field">
                          <span className="fp-lbl">Sanctioned</span>
                          <span className="fp-val telemetry-num">
                            ₹{(fingerprint.financial.sanctioned_amount / 100000).toFixed(2)} Lakhs
                          </span>
                        </div>
                        <div className="fp-field">
                          <span className="fp-lbl">Expended</span>
                          <span className="fp-val telemetry-num">
                            ₹{(fingerprint.financial.expenditure / 100000).toFixed(2)} Lakhs
                          </span>
                        </div>
                        <div className="fp-field">
                          <span className="fp-lbl">Expenditure Ratio</span>
                          <span className="fp-val telemetry-num highlight-amber">
                            {fingerprint.financial.expenditure_ratio?.toFixed(1) ?? '—'}%
                          </span>
                        </div>
                        <div className="fp-field">
                          <span className="fp-lbl">Spending Velocity</span>
                          <span className="fp-val telemetry-num">
                            ₹{fingerprint.financial.spending_velocity?.toFixed(0) ?? '—'} / day
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dimension 2: Progress */}
                    <div className="fp-card">
                      <div className="fp-card-head">
                        <TrendingDown size={14} />
                        <span>2. Progress Dimension</span>
                      </div>
                      <div className="fp-grid-2">
                        <div className="fp-field">
                          <span className="fp-lbl">Physical Progress</span>
                          <span className="fp-val telemetry-num">
                            {fingerprint.progress.physical_progress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="fp-field">
                          <span className="fp-lbl">Expected Progress</span>
                          <span className="fp-val telemetry-num">
                            {fingerprint.progress.expected_progress?.toFixed(1) ?? '—'}%
                          </span>
                        </div>
                        <div className="fp-field full-span">
                          <span className="fp-lbl">Progress Gap</span>
                          <span className="fp-val telemetry-num highlight-red">
                            {fingerprint.progress.progress_gap ? `${fingerprint.progress.progress_gap.toFixed(1)} percentage points lag` : 'None'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dimension 3: Temporal */}
                    <div className="fp-card">
                      <div className="fp-card-head">
                        <Calendar size={14} />
                        <span>3. Temporal Dimension</span>
                      </div>
                      <div className="fp-grid-2">
                        <div className="fp-field">
                          <span className="fp-lbl">Sanction Start</span>
                          <span className="fp-val">{fingerprint.temporal.start_date}</span>
                        </div>
                        <div className="fp-field">
                          <span className="fp-lbl">Target Completion</span>
                          <span className="fp-val">{fingerprint.temporal.expected_completion}</span>
                        </div>
                        <div className="fp-field">
                          <span className="fp-lbl">Elapsed Time</span>
                          <span className="fp-val telemetry-num">
                            {fingerprint.temporal.elapsed_days ?? '—'} days
                          </span>
                        </div>
                        <div className="fp-field">
                          <span className="fp-lbl">Delay Overdue</span>
                          <span className="fp-val telemetry-num highlight-red">
                            {fingerprint.temporal.delay_days && fingerprint.temporal.delay_days > 0
                              ? `${fingerprint.temporal.delay_days} days`
                              : 'On Time'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dimension 4 & 5: Geographic & Entity */}
                    <div className="fp-card">
                      <div className="fp-card-head">
                        <Building2 size={14} />
                        <span>4 & 5. Geographic & Entity</span>
                      </div>
                      <div className="fp-grid-2">
                        <div className="fp-field">
                          <span className="fp-lbl">GPS Coordinates</span>
                          <span className="fp-val telemetry-num">
                            {fingerprint.geographic.latitude?.toFixed(4)}, {fingerprint.geographic.longitude?.toFixed(4)}
                          </span>
                        </div>
                        <div className="fp-field">
                          <span className="fp-lbl">Executing Agency</span>
                          <span className="fp-val">{fingerprint.entity.agency}</span>
                        </div>
                        <div className="fp-field full-span">
                          <span className="fp-lbl">Contractor Entity</span>
                          <span className="fp-val highlight-cyan">{fingerprint.entity.contractor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Recommended Human Verification Checklist */}
              <div className="drawer-section">
                <div className="section-title-row">
                  <CheckSquare size={16} className="section-icon" />
                  <h3 className="section-title">Recommended Field Verification Steps</h3>
                </div>
                <div className="verification-tasks-list">
                  {[
                    'Verify on-site physical execution milestones and photograph work progress.',
                    'Examine contractor measurement books (MB) and running account bills.',
                    'Check GPS location markers against neighboring sanctioned MPLADS works.',
                    'Validate expenditure statements and utilization certificate submission.',
                  ].map((task, idx) => (
                    <div
                      key={idx}
                      className={`task-row ${checkedTasks[idx] ? 'completed' : ''}`}
                      onClick={() => toggleTask(idx)}
                    >
                      <button className="task-check-btn" aria-label="Toggle task completion">
                        {checkedTasks[idx] ? (
                          <CheckSquare size={18} className="check-icon-active" />
                        ) : (
                          <Square size={18} className="check-icon-blank" />
                        )}
                      </button>
                      <span className="task-text">{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* V2: Alert Lifecycle & Evidence */}
              <AlertLifecycle projectId={projectId} />
              <EvidencePanel projectId={projectId} compact />

              {/* Statutory Disclaimer */}
              <div className="drawer-disclaimer">
                <Info size={16} className="disclaimer-icon" />
                <p className="disclaimer-text">
                  <strong>STATUTORY NOTICE:</strong> This intelligence report identifies statistical risk signals
                  for authorised human verification. It does not establish fraud or misconduct.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer CTA */}
        <div className="drawer-footer">
          <button className="dossier-full-action-btn" onClick={() => onOpenFullDossier(projectId)}>
            <ExternalLink size={15} />
            <span>Generate & Export Full Investigation Dossier</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
