import { useState, useEffect } from 'react';
import type { EvidenceRecord, SubmitEvidencePayload } from '../types/project';
import { fetchEvidence, submitEvidence } from '../services/api';

interface EvidencePanelProps {
  projectId: string;
  compact?: boolean;
}

const EVIDENCE_LABELS: Record<string, string> = {
  site_photo: 'Site Photo',
  document: 'Document',
  geolocation: 'Geolocation',
  inspector_note: 'Inspector Note',
};

const EVIDENCE_ICONS: Record<string, string> = {
  site_photo: '📷',
  document: '📄',
  geolocation: '📍',
  inspector_note: '📝',
};

const OFFICERS = ['Inspector Sharma', 'Inspector Verma', 'Inspector Patel', 'Inspector Gupta'];

export const EvidencePanel = ({ projectId, compact = false }: EvidencePanelProps) => {
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formType, setFormType] = useState('inspector_note');
  const [formDescription, setFormDescription] = useState('');
  const [formActor, setFormActor] = useState(OFFICERS[0]);

  useEffect(() => {
    loadEvidence();
  }, [projectId]);

  const loadEvidence = async () => {
    setIsLoading(true);
    const data = await fetchEvidence(projectId);
    setEvidence(data);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formDescription.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const payload: SubmitEvidencePayload = {
      submitted_by: formActor,
      evidence_type: formType,
      description: formDescription.trim(),
    };

    try {
      await submitEvidence(projectId, payload);
      setFormDescription('');
      setShowForm(false);
      await loadEvidence();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedEvidence = compact ? evidence.slice(0, 3) : evidence;

  return (
    <div className="evidence-panel">
      <div className="evidence-panel-header">
        <h4>
          <span className="evidence-icon">🔍</span>
          Field Evidence
          {evidence.length > 0 && <span className="evidence-count">{evidence.length}</span>}
        </h4>
        {!showForm && (
          <button className="btn-evidence-add" onClick={() => setShowForm(true)}>
            + Submit Evidence
          </button>
        )}
      </div>

      {showForm && (
        <div className="evidence-form">
          <div className="evidence-form-row">
            <label>Officer</label>
            <select value={formActor} onChange={(e) => setFormActor(e.target.value)}>
              {OFFICERS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="evidence-form-row">
            <label>Type</label>
            <select value={formType} onChange={(e) => setFormType(e.target.value)}>
              {Object.entries(EVIDENCE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="evidence-form-row">
            <label>Description</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe the field observation or attach evidence details..."
              rows={3}
            />
          </div>
          {submitError && <div className="evidence-error">{submitError}</div>}
          <div className="evidence-form-actions">
            <button className="btn-evidence-cancel" onClick={() => { setShowForm(false); setSubmitError(null); }}>
              Cancel
            </button>
            <button
              className="btn-evidence-submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !formDescription.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="evidence-loading">Loading evidence records...</div>
      ) : evidence.length === 0 ? (
        <div className="evidence-empty">No field evidence submitted yet.</div>
      ) : (
        <div className="evidence-timeline">
          {displayedEvidence.map((e) => (
            <div key={e.id} className="evidence-card">
              <div className="evidence-card-icon">{EVIDENCE_ICONS[e.evidence_type] || '📋'}</div>
              <div className="evidence-card-body">
                <div className="evidence-card-meta">
                  <span className="evidence-type-badge">{EVIDENCE_LABELS[e.evidence_type]}</span>
                  <span className="evidence-actor">{e.submitted_by}</span>
                  <span className="evidence-time">
                    {new Date(e.submitted_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="evidence-description">{e.description}</p>
                {e.latitude && e.longitude && (
                  <span className="evidence-geo">📍 {e.latitude.toFixed(4)}, {e.longitude.toFixed(4)}</span>
                )}
              </div>
            </div>
          ))}
          {compact && evidence.length > 3 && (
            <div className="evidence-more">+{evidence.length - 3} more records</div>
          )}
        </div>
      )}
    </div>
  );
};
