import { useState, useEffect } from 'react';
import type { AuditEvent, InspectorStats } from '../types/project';
import {
  fetchAuditTrail,
  verifyAuditChain,
  fetchInspectorAnalytics,
  triggerReinspection,
} from '../services/api';

const ACTION_LABELS: Record<string, string> = {
  alert_opened: 'Alert Opened',
  alert_status_changed: 'Status Changed',
  evidence_submitted: 'Evidence Submitted',
  dossier_viewed: 'Dossier Viewed',
  chain_verified: 'Chain Verified',
  alert_escalated: 'Alert Escalated',
  alert_resolved: 'Alert Resolved',
  alert_dismissed: 'Alert Dismissed',
};

const ACTION_ICONS: Record<string, string> = {
  alert_opened: '🔔',
  alert_status_changed: '🔄',
  evidence_submitted: '📎',
  dossier_viewed: '👁',
  chain_verified: '🔗',
  alert_escalated: '⬆',
  alert_resolved: '✅',
  alert_dismissed: '🚫',
};

const ACTION_COLORS: Record<string, string> = {
  alert_opened: '#e74c3c',
  alert_status_changed: '#3498db',
  evidence_submitted: '#f39c12',
  chain_verified: '#9b59b6',
  alert_escalated: '#e74c3c',
  alert_resolved: '#2ecc71',
  alert_dismissed: '#95a5a6',
};

export const AuditTrailView = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [verifyProjectId, setVerifyProjectId] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; checked: number; broken_at: number | null } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Inspector analytics state
  const [inspectors, setInspectors] = useState<InspectorStats[]>([]);
  const [isLoadingInspectors, setIsLoadingInspectors] = useState(true);
  const [reinspectionMsg, setReinspectionMsg] = useState<string | null>(null);
  const [isReinspecting, setIsReinspecting] = useState(false);

  useEffect(() => {
    loadTrail();
    loadInspectors();
  }, []);

  const loadTrail = async () => {
    setIsLoading(true);
    const data = await fetchAuditTrail(undefined, 200);
    setEvents(data.events);
    setTotal(data.total);
    setIsLoading(false);
  };

  const loadInspectors = async () => {
    setIsLoadingInspectors(true);
    const data = await fetchInspectorAnalytics();
    setInspectors(data);
    setIsLoadingInspectors(false);
  };

  const handleVerify = async () => {
    if (!verifyProjectId.trim()) return;
    setIsVerifying(true);
    const result = await verifyAuditChain(verifyProjectId.trim());
    setVerifyResult(result);
    setIsVerifying(false);
    await loadTrail();
  };

  const handleReinspection = async () => {
    setIsReinspecting(true);
    setReinspectionMsg(null);
    const result = await triggerReinspection(0.2);
    setReinspectionMsg(result.message);
    setIsReinspecting(false);
    await Promise.all([loadTrail(), loadInspectors()]);
  };

  const filteredEvents = filterAction === 'all'
    ? events
    : events.filter((e) => e.action === filterAction);

  const parseDetails = (details: string | null | undefined): Record<string, unknown> | null => {
    if (!details) return null;
    try { return JSON.parse(details); } catch { return null; }
  };

  return (
    <div className="audit-trail-view">
      {/* Inspector Behaviour Analytics */}
      <div className="inspector-analytics-section">
        <div className="inspector-analytics-header">
          <div className="inspector-analytics-title">
            <h3>👁‍🗨 Inspector Behaviour Analytics</h3>
            <span className="inspector-subtitle">
              Monitors clearance patterns to flag potential rubber-stamping
            </span>
          </div>
          <div className="inspector-analytics-actions">
            <button
              className="btn-reinspection"
              onClick={handleReinspection}
              disabled={isReinspecting}
            >
              {isReinspecting ? '⏳ Triggering...' : '🔄 Trigger Re-inspection'}
            </button>
          </div>
        </div>

        {reinspectionMsg && (
          <div className="reinspection-result">
            <span className="reinspection-icon">🔁</span>
            <span>{reinspectionMsg}</span>
          </div>
        )}

        {isLoadingInspectors ? (
          <div className="inspector-loading">Loading inspector profiles...</div>
        ) : inspectors.length === 0 ? (
          <div className="inspector-empty">No inspector activity recorded yet.</div>
        ) : (
          <div className="inspector-cards-grid">
            {inspectors.map((ins) => (
              <div
                key={ins.inspector}
                className={`inspector-card ${ins.is_flagged ? 'flagged' : ''}`}
              >
                <div className="inspector-card-top">
                  <div className="inspector-avatar">
                    {ins.inspector.split(' ').pop()?.charAt(0) || '?'}
                  </div>
                  <div className="inspector-identity">
                    <span className="inspector-name">{ins.inspector}</span>
                    <span className="inspector-cases">{ins.total_handled} cases handled</span>
                  </div>
                  {ins.is_flagged && (
                    <span className="inspector-flag-badge">⚠ FLAGGED</span>
                  )}
                </div>

                <div className="inspector-metrics">
                  <div className="inspector-metric">
                    <span className="metric-label">Resolve Rate</span>
                    <span className={`metric-value ${ins.resolve_rate > 0.9 ? 'metric-warning' : ''}`}>
                      {(ins.resolve_rate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="inspector-metric">
                    <span className="metric-label">Escalated</span>
                    <span className="metric-value">{ins.escalated}</span>
                  </div>
                  <div className="inspector-metric">
                    <span className="metric-label">Active</span>
                    <span className="metric-value">{ins.active_reviews}</span>
                  </div>
                  <div className="inspector-metric">
                    <span className="metric-label">Avg Response</span>
                    <span className="metric-value">
                      {ins.avg_response_hours != null ? `${ins.avg_response_hours}h` : '—'}
                    </span>
                  </div>
                </div>

                {ins.is_flagged && ins.flag_reason && (
                  <div className="inspector-flag-reason">
                    {ins.flag_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Trail Header */}
      <div className="audit-trail-header">
        <div className="audit-trail-title">
          <h2>🔗 Audit Trail</h2>
          <span className="audit-trail-count">{total} events recorded</span>
        </div>

        <div className="audit-trail-controls">
          <select
            className="audit-filter-select"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">All Actions</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="audit-verify-section">
        <h4>🛡 Chain Integrity Verification</h4>
        <p className="audit-verify-description">
          Every audit event is cryptographically chained using SHA-256 hashes.
          Verify that no record has been tampered with.
        </p>
        <div className="audit-verify-form">
          <input
            type="text"
            value={verifyProjectId}
            onChange={(e) => setVerifyProjectId(e.target.value)}
            placeholder="Enter Project ID (e.g. MD001)"
            className="audit-verify-input"
          />
          <button
            className="btn-verify-chain"
            onClick={handleVerify}
            disabled={isVerifying || !verifyProjectId.trim()}
          >
            {isVerifying ? 'Verifying...' : 'Verify Chain'}
          </button>
        </div>
        {verifyResult && (
          <div className={`audit-verify-result ${verifyResult.valid ? 'verify-pass' : 'verify-fail'}`}>
            <span className="verify-result-icon">{verifyResult.valid ? '✅' : '⚠️'}</span>
            <span>
              {verifyResult.valid
                ? `Chain intact. ${verifyResult.checked} events verified.`
                : `Chain broken at event #${verifyResult.broken_at}. Possible tampering detected.`}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="audit-loading">Loading audit trail...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="audit-empty">No audit events found.</div>
      ) : (
        <div className="audit-event-list">
          {filteredEvents.map((event) => {
            const details = parseDetails(event.details);
            return (
              <div key={event.id} className="audit-event-row">
                <div className="audit-event-icon" style={{ color: ACTION_COLORS[event.action] || '#7f8c8d' }}>
                  {ACTION_ICONS[event.action] || '📋'}
                </div>
                <div className="audit-event-content">
                  <div className="audit-event-top">
                    <span className="audit-action-badge" style={{ borderColor: ACTION_COLORS[event.action] || '#7f8c8d' }}>
                      {ACTION_LABELS[event.action] || event.action}
                    </span>
                    <span className="audit-actor">{event.actor}</span>
                    <span className="audit-timestamp">
                      {new Date(event.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {details && (
                    <div className="audit-event-details">
                      {details.risk_score !== undefined && <span>Risk: {String(details.risk_score)}</span>}
                      {details.from_status && <span>{String(details.from_status)} → {String(details.to_status)}</span>}
                      {details.evidence_type && <span>Type: {String(details.evidence_type)}</span>}
                      {details.reason && <span>{String(details.reason)}</span>}
                      {details.notes && <span>{String(details.notes)}</span>}
                      {details.reassigned_to && <span>Re-assigned to: {String(details.reassigned_to)}</span>}
                    </div>
                  )}
                  <div className="audit-hash">
                    <span className="hash-label">SHA-256:</span>
                    <code className="hash-value">{event.integrity_hash.substring(0, 16)}…</code>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
