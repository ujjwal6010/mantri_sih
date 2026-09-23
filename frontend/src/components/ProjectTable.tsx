import React from 'react';
import type { ProjectSummary } from '../types/project';
import { MapPin, MoreVertical, ArrowRight } from 'lucide-react';

interface ProjectTableProps {
  projects: ProjectSummary[];
  onSelectProject: (id: string) => void;
  onOpenDossier: (id: string) => void;
  isLoading: boolean;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onSelectProject,
  onOpenDossier,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="table-container loading-table-skeleton">
        <div className="skeleton-table-row" />
        <div className="skeleton-table-row" />
        <div className="skeleton-table-row" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="table-container empty-state">
        <h3 className="empty-title">No Projects Found</h3>
        <p className="empty-desc">Try adjusting your filters.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  const getRiskColor = (score: number | null | undefined) => {
    if (!score) return 'low';
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  return (
    <div className="table-container">
      <table className="project-data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>PROJECT ID</th>
            <th>PROJECT DETAILS</th>
            <th>LOCATION</th>
            <th>EXPENDITURE</th>
            <th>PROGRESS VS EXPECTED</th>
            <th>RISK SCORE</th>
            <th>PRIMARY SIGNAL</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p, index) => {
            const riskClass = getRiskColor(p.risk_score);
            const expectedProgress = Math.min(100, p.physical_progress + 30 + Math.random() * 20); // Dummy expected for UI

            return (
              <tr key={p.project_id} className="table-row">
                <td className="td-index">{index + 1}</td>
                
                <td className="td-id">
                  <span className="id-pill">{p.project_id}</span>
                </td>

                <td className="td-details">
                  <div className="details-col">
                    <span className="details-title">{p.work_type}</span>
                    <span className="details-desc">{p.description}</span>
                    <span className="details-sector-pill">{p.work_type}</span>
                  </div>
                </td>

                <td className="td-location">
                  <div className="location-col">
                    <MapPin size={14} className="loc-icon" />
                    <div className="loc-text">
                      <span className="loc-state">{p.state}</span>
                      <span className="loc-dist">{p.district} ({p.constituency})</span>
                    </div>
                  </div>
                </td>

                <td className="td-expenditure">
                  <div className="exp-col">
                    <span className="exp-spent">{formatCurrency(p.expenditure)}</span>
                    <span className="exp-total">of {formatCurrency(p.sanctioned_amount)}</span>
                  </div>
                </td>

                <td className="td-progress">
                  <div className="prog-col">
                    <span className="prog-text">{p.physical_progress.toFixed(1)}% <span className="prog-expected">(expected)</span></span>
                    <div className="prog-bars">
                      <div className="prog-bar-expected" style={{ width: `${expectedProgress}%` }}>
                        <div className="prog-bar-actual" style={{ width: `${(p.physical_progress / expectedProgress) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </td>

                <td className="td-risk">
                  <div className="risk-col">
                    <div className={`risk-box ${riskClass}`}>
                      {p.risk_score?.toFixed(1)}
                    </div>
                    <span className={`risk-text ${riskClass}`}>{riskClass}</span>
                  </div>
                </td>

                <td className="td-signal">
                  <span className="signal-text">{p.main_signal || 'No significant anomalies detected in recent scans.'}</span>
                </td>

                <td className="td-action">
                  <div className="action-buttons">
                    <button className="inspect-btn" onClick={() => onSelectProject(p.project_id)}>
                      Inspect <ArrowRight size={14} />
                    </button>
                    <button className="more-btn" onClick={() => onOpenDossier(p.project_id)}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
