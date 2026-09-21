import React, { useEffect, useState } from 'react';
import {
  X,
  Printer,
  ShieldAlert,
  Copy,
  CheckCircle2,
  Layers,
  Info,
} from 'lucide-react';
import type { DossierResponse, ProjectSummary } from '../types/project';
import { fetchProjectDossier } from '../services/api';
import { PeerComparisonChart } from './PeerChart';

interface DossierModalProps {
  projectId: string | null;
  projectSummary: ProjectSummary | null;
  onClose: () => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({
  projectId,
  projectSummary,
  onClose,
}) => {
  const [dossier, setDossier] = useState<DossierResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    setIsLoading(true);

    fetchProjectDossier(projectId)
      .then((data) => {
        if (isMounted) {
          setDossier(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching dossier:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  if (!projectId) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(projectId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="dossier-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Action Bar */}
        <div className="modal-top-bar">
          <div className="bar-left">
            <span className="official-stamp">CONFIDENTIAL • AUDIT DOSSIER</span>
            <span className="project-id-chip telemetry-num">{projectId}</span>
            <button className="copy-btn" onClick={handleCopyId} title="Copy Project ID">
              {copiedId ? <CheckCircle2 size={13} className="text-emerald" /> : <Copy size={13} />}
            </button>
          </div>
          <div className="bar-right">
            <button className="print-btn" onClick={handlePrint} title="Print or Save as PDF">
              <Printer size={15} />
              <span>Print / Export PDF</span>
            </button>
            <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Document */}
        <div className="dossier-document printable-area">
          {isLoading ? (
            <div className="dossier-skeleton">
              <div className="skeleton-doc-header" />
              <div className="skeleton-doc-body" />
            </div>
          ) : (
            <>
              {/* Document Letterhead */}
              <div className="doc-letterhead">
                <div className="letterhead-title-block">
                  <div className="gov-emblem-badge">
                    <ShieldAlert size={26} />
                  </div>
                  <div>
                    <h1 className="doc-main-title">MANTRI DRISHTI INVESTIGATION DOSSIER</h1>
                    <p className="doc-sub-title">
                      AI-POWERED MPLADS MULTI-SIGNAL AUDIT & VIGILANCE REPORT
                    </p>
                  </div>
                </div>
                <div className="doc-meta-block">
                  <div className="doc-meta-row">
                    <span className="meta-lbl">Report Generated:</span>
                    <span className="meta-val telemetry-num">
                      {new Date().toISOString().split('T')[0]}
                    </span>
                  </div>
                  <div className="doc-meta-row">
                    <span className="meta-lbl">Jurisdiction:</span>
                    <span className="meta-val">
                      {projectSummary?.district}, {projectSummary?.state}
                    </span>
                  </div>
                </div>
              </div>

              {/* High-Level Assessment Summary Banner */}
              <div className="doc-summary-banner">
                <div className="banner-col risk">
                  <span className="b-label">OVERALL FUSED RISK</span>
                  <div className="b-val-row">
                    <span className="b-num telemetry-num">
                      {dossier?.risk_score.toFixed(1) ?? projectSummary?.risk_score?.toFixed(1) ?? '—'}
                    </span>
                    <span className="b-scale">/ 100</span>
                  </div>
                </div>

                <div className="banner-col conf">
                  <span className="b-label">CONFIDENCE INDEX</span>
                  <div className="b-val-row">
                    <span className="b-num telemetry-num">
                      {dossier?.confidence_score.toFixed(0) ?? projectSummary?.confidence_score?.toFixed(0) ?? '—'}%
                    </span>
                  </div>
                </div>

                <div className="banner-col status">
                  <span className="b-label">RECOMMENDED DISPOSITION</span>
                  <div className="b-val-row">
                    <span className="b-badge-disposition">PRIORITY FIELD VERIFICATION</span>
                  </div>
                </div>
              </div>

              {/* Subject Work Parameters */}
              <div className="doc-section">
                <h2 className="doc-section-heading">1. Project Identification & Sanction Profile</h2>
                <div className="profile-grid">
                  <div className="profile-field">
                    <span className="field-lbl">Project Identifier</span>
                    <span className="field-val telemetry-num">{projectId}</span>
                  </div>
                  <div className="profile-field">
                    <span className="field-lbl">Work Category</span>
                    <span className="field-val">{projectSummary?.work_type}</span>
                  </div>
                  <div className="profile-field">
                    <span className="field-lbl">Parliamentary Constituency</span>
                    <span className="field-val">{projectSummary?.constituency}</span>
                  </div>
                  <div className="profile-field">
                    <span className="field-lbl">Executing Agency</span>
                    <span className="field-val">{projectSummary?.agency}</span>
                  </div>
                  <div className="profile-field full-width">
                    <span className="field-lbl">Sanctioned Work Description</span>
                    <span className="field-val highlight">{projectSummary?.description}</span>
                  </div>
                  <div className="profile-field full-width">
                    <span className="field-lbl">Contractor Name</span>
                    <span className="field-val">{projectSummary?.contractor}</span>
                  </div>
                </div>
              </div>

              {/* Contributing Anomaly Signals */}
              <div className="doc-section">
                <h2 className="doc-section-heading">
                  2. Synthetic Anomaly Signals ("Why Flagged")
                </h2>
                <div className="anomalies-list-box">
                  {dossier?.why_flagged.map((flag, idx) => (
                    <div key={idx} className="anomaly-record">
                      <span className="record-index telemetry-num">0{idx + 1}</span>
                      <span className="record-desc">{flag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peer Benchmark Comparisons */}
              {dossier && dossier.peer_comparisons && dossier.peer_comparisons.length > 0 && (
                <div className="doc-section">
                  <h2 className="doc-section-heading">
                    3. Peer Group Statistical Benchmarking (IQR Analysis)
                  </h2>
                  <p className="doc-section-note">
                    Compared against peer projects in the same state and sector cohort to isolate systemic outliers.
                  </p>
                  <PeerComparisonChart peers={dossier.peer_comparisons} />
                  <table className="peer-table">
                    <thead>
                      <tr>
                        <th>METRIC EVALUATED</th>
                        <th>SUBJECT VALUE</th>
                        <th>PEER MEDIAN</th>
                        <th>IQR NORMAL RANGE (Q1–Q3)</th>
                        <th>STATISTICAL VARIANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dossier.peer_comparisons.map((comp, idx) => (
                        <tr key={idx}>
                          <td className="font-semibold">{comp.metric}</td>
                          <td className="telemetry-num highlight">{comp.project_value}</td>
                          <td className="telemetry-num">{comp.peer_median}</td>
                          <td className="telemetry-num text-muted">
                            {comp.peer_q1} – {comp.peer_q3}
                          </td>
                          <td>
                            <span className={`variance-pill ${comp.deviation}`}>
                              {comp.deviation.toUpperCase().replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Overlapping Candidate Projects */}
              {dossier && dossier.similar_projects && dossier.similar_projects.length > 0 && (
                <div className="doc-section">
                  <h2 className="doc-section-heading">
                    4. Potential Duplicate / Overlapping Works Detected
                  </h2>
                  <div className="similar-projects-cards">
                    {dossier.similar_projects.map((sim, idx) => (
                      <div key={idx} className="similar-card">
                        <div className="similar-header">
                          <div className="sim-id-group">
                            <Layers size={14} />
                            <span className="telemetry-num font-bold">Project #{sim.project_id}</span>
                          </div>
                          {sim.distance_km !== null && sim.distance_km !== undefined && (
                            <span className="dist-chip telemetry-num">
                              {sim.distance_km < 1
                                ? `${(sim.distance_km * 1000).toFixed(0)}m proximity`
                                : `${sim.distance_km.toFixed(1)}km proximity`}
                            </span>
                          )}
                        </div>
                        {sim.description && <p className="sim-desc">{sim.description}</p>}
                        <div className="sim-signals-row">
                          <span className="signal-lbl">Converging Signals:</span>
                          {sim.signals.map((sig, sidx) => (
                            <span key={sidx} className="sig-chip">
                              {sig}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Field Verification Protocol */}
              <div className="doc-section">
                <h2 className="doc-section-heading">5. Actionable Field Inspection Protocol</h2>
                <div className="protocol-box">
                  {dossier?.recommended_verification.map((step, idx) => (
                    <div key={idx} className="protocol-step">
                      <span className="step-badge telemetry-num">STEP {idx + 1}</span>
                      <p className="step-text">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal / Statutory Disclaimer */}
              <div className="doc-disclaimer-box">
                <Info size={18} className="disclaimer-alert-icon" />
                <div className="disclaimer-text-wrap">
                  <h4>STATUTORY DISCLAIMER</h4>
                  <p>
                    {dossier?.disclaimer ||
                      'This dossier identifies risk signals for authorised human verification. It does not establish fraud or misconduct.'}
                  </p>
                </div>
              </div>

              {/* Document Signature Sign-Off Block (for physical printouts) */}
              <div className="doc-signoff-block">
                <div className="signoff-col">
                  <div className="signoff-line" />
                  <span className="signoff-label">Inspecting Vigilance Officer</span>
                  <span className="signoff-sub">Name & Designation</span>
                </div>
                <div className="signoff-col">
                  <div className="signoff-line" />
                  <span className="signoff-label">District Magistrate / Collector</span>
                  <span className="signoff-sub">Countersignature & Stamp</span>
                </div>
                <div className="signoff-col">
                  <div className="signoff-line" />
                  <span className="signoff-label">Field Verification Date</span>
                  <span className="signoff-sub">DD / MM / YYYY</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
