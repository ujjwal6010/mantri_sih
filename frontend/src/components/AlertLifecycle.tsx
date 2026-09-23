import { useState, useEffect } from 'react';
import type { AlertAction, AlertStatus, UpdateAlertPayload } from '../types/project';
import { fetchAlertStatus, updateAlert } from '../services/api';

interface AlertLifecycleProps {
  projectId: string;
  onStatusChange?: () => void;
}

const STATUS_FLOW: AlertStatus[] = [
  'open', 'under_review', 'evidence_submitted', 'resolved',
];

const STATUS_LABELS: Record<AlertStatus, string> = {
  open: 'Open',
  under_review: 'Under Review',
  evidence_submitted: 'Evidence Filed',
  escalated: 'Escalated',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const STATUS_COLORS: Record<AlertStatus, string> = {
  open: 'var(--risk-critical)',
  under_review: 'var(--risk-high)',
  evidence_submitted: 'var(--risk-medium)',
  escalated: '#e74c3c',
  resolved: 'var(--risk-low)',
  dismissed: 'var(--text-tertiary)',
};

const OFFICERS = ['Inspector Sharma', 'Inspector Verma', 'Inspector Patel', 'Inspector Gupta'];

const NEXT_ACTIONS: Record<string, { label: string; status: string }[]> = {
  open: [
    { label: 'Begin Review', status: 'under_review' },
    { label: 'Escalate', status: 'escalated' },
  ],
  under_review: [
    { label: 'Mark Resolved', status: 'resolved' },
    { label: 'Escalate', status: 'escalated' },
    { label: 'Dismiss', status: 'dismissed' },
  ],
  evidence_submitted: [
    { label: 'Continue Review', status: 'under_review' },
    { label: 'Mark Resolved', status: 'resolved' },
    { label: 'Escalate', status: 'escalated' },
    { label: 'Dismiss', status: 'dismissed' },
  ],
  escalated: [
    { label: 'Return to Review', status: 'under_review' },
    { label: 'Mark Resolved', status: 'resolved' },
  ],
};

export const AlertLifecycle = ({ projectId, onStatusChange }: AlertLifecycleProps) => {
  const [alert, setAlert] = useState<AlertAction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [selectedActor, setSelectedActor] = useState(OFFICERS[0]);

  useEffect(() => {
    loadAlert();
  }, [projectId]);

  const loadAlert = async () => {
    setIsLoading(true);
    const data = await fetchAlertStatus(projectId);
    setAlert(data);
    setIsLoading(false);
  };

  const handleTransition = async (newStatus: string) => {
    if (!alert) return;
    setIsActing(true);
    setActionError(null);

    const payload: UpdateAlertPayload = {
      new_status: newStatus,
      actor: selectedActor,
      resolution_notes: newStatus === 'resolved' || newStatus === 'dismissed'
        ? `${newStatus === 'resolved' ? 'Resolved' : 'Dismissed'} by ${selectedActor}`
        : undefined,
    };

    try {
      const updated = await updateAlert(projectId, payload);
      setAlert(updated);
      onStatusChange?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return <div className="alert-lifecycle-loading">Loading alert status...</div>;
  }

  if (!alert) {
    return (
      <div className="alert-lifecycle-none">
        <span className="alert-none-icon">✓</span>
        No active alert for this project.
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(alert.current_status);
  const isEscalated = alert.current_status === 'escalated';
  const isTerminal = alert.current_status === 'resolved' || alert.current_status === 'dismissed';
  const actions = NEXT_ACTIONS[alert.current_status] || [];

  return (
    <div className="alert-lifecycle">
      <div className="alert-lifecycle-header">
        <h4>
          <span className="alert-icon">🚨</span>
          Alert Lifecycle
        </h4>
        <span
          className="alert-status-badge"
          style={{ backgroundColor: STATUS_COLORS[alert.current_status] }}
        >
          {STATUS_LABELS[alert.current_status]}
        </span>
      </div>

      <div className="alert-stepper">
        {STATUS_FLOW.map((status, index) => {
          const isActive = status === alert.current_status;
          const isCompleted = currentIndex > index;
          const stepClass = isActive ? 'step-active' : isCompleted ? 'step-completed' : 'step-pending';

          return (
            <div key={status} className={`alert-step ${stepClass}`}>
              <div className="step-dot" />
              {index < STATUS_FLOW.length - 1 && <div className="step-line" />}
              <span className="step-label">{STATUS_LABELS[status]}</span>
            </div>
          );
        })}
        {isEscalated && (
          <div className="alert-step step-escalated">
            <div className="step-dot" />
            <span className="step-label">Escalated</span>
          </div>
        )}
      </div>

      {alert.assigned_to && (
        <div className="alert-detail-row">
          <span className="alert-detail-label">Assigned to:</span>
          <span className="alert-detail-value">{alert.assigned_to}</span>
        </div>
      )}
      {alert.reviewed_by && (
        <div className="alert-detail-row">
          <span className="alert-detail-label">Reviewed by:</span>
          <span className="alert-detail-value">{alert.reviewed_by}</span>
        </div>
      )}

      {!isTerminal && actions.length > 0 && (
        <div className="alert-actions">
          <div className="alert-actor-select">
            <label>Acting as:</label>
            <select value={selectedActor} onChange={(e) => setSelectedActor(e.target.value)}>
              {OFFICERS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="alert-action-buttons">
            {actions.map((action) => (
              <button
                key={action.status}
                className={`btn-alert-action ${action.status === 'escalated' ? 'btn-escalate' : ''} ${action.status === 'resolved' ? 'btn-resolve' : ''} ${action.status === 'dismissed' ? 'btn-dismiss' : ''}`}
                onClick={() => handleTransition(action.status)}
                disabled={isActing}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {actionError && <div className="alert-error">{actionError}</div>}

      {isTerminal && (
        <div className="alert-terminal">
          <span className="alert-terminal-icon">{alert.current_status === 'resolved' ? '✅' : '🚫'}</span>
          <span>
            {alert.current_status === 'resolved' ? 'Alert resolved' : 'Alert dismissed'}
            {alert.reviewed_by && ` by ${alert.reviewed_by}`}
            {alert.resolved_at && ` on ${new Date(alert.resolved_at).toLocaleDateString('en-IN')}`}
          </span>
        </div>
      )}
    </div>
  );
};
