import React, { useEffect, useState } from 'react';
import { ShieldOff, AlertTriangle, FileWarning } from 'lucide-react';
import { fetchGamingDetection } from '../services/api';
import type { GamingSuspect } from '../types/project';

export const GamingDetectionPanel: React.FC = () => {
  const [suspects, setSuspects] = useState<GamingSuspect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGamingDetection()
      .then((data) => setSuspects(data.suspects))
      .catch(() => setSuspects([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="gaming-panel">
        <div className="gaming-panel-header">
          <ShieldOff size={18} />
          <h3>Monitoring-Conditioned Behaviour Detection</h3>
        </div>
        <div className="gaming-loading">Scanning for anomalous patterns...</div>
      </div>
    );
  }

  return (
    <div className="gaming-panel">
      <div className="gaming-panel-header">
        <ShieldOff size={18} />
        <h3>Monitoring-Conditioned Behaviour Detection</h3>
        {suspects.length > 0 && (
          <span className="gaming-count-badge">{suspects.length} suspect{suspects.length !== 1 ? 's' : ''}</span>
        )}
      </div>
      <p className="gaming-subtitle">
        Projects exhibiting timing patterns indicative of gaming the monitoring system.
      </p>

      {suspects.length === 0 ? (
        <div className="gaming-clean">
          <span className="gaming-clean-icon">✓</span>
          No gaming patterns detected across the portfolio.
        </div>
      ) : (
        <div className="gaming-suspects-list">
          {suspects.map((s) => (
            <div key={s.project_id} className="gaming-suspect-card">
              <div className="gaming-suspect-top">
                <div className="gaming-suspect-info">
                  <span className="gaming-project-id">{s.project_id}</span>
                  <span className="gaming-project-name">{s.project_name}</span>
                </div>
                <div className={`gaming-score-pill ${s.gaming_score >= 80 ? 'critical' : 'high'}`}>
                  <AlertTriangle size={12} />
                  {s.gaming_score}%
                </div>
              </div>

              <div className="gaming-entity-row">
                <span className="gaming-entity">{s.agency}</span>
                <span className="gaming-entity-sep">→</span>
                <span className="gaming-entity contractor">{s.contractor}</span>
                <span className="gaming-evidence-count">
                  <FileWarning size={12} /> {s.evidence_count} docs
                </span>
              </div>

              <ul className="gaming-reasons">
                {s.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
