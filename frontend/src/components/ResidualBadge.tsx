import React, { useEffect, useState } from 'react';
import { fetchResidualAnomaly } from '../services/api';
import type { ResidualAnomaly } from '../types/project';

interface ResidualBadgeProps {
  projectId: string;
}

export const ResidualBadge: React.FC<ResidualBadgeProps> = ({ projectId }) => {
  const [data, setData] = useState<ResidualAnomaly | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResidualAnomaly(projectId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading || !data) return null;

  // Don't show if there's no contextual explanation
  if (data.explained_deduction === 0 && data.raw_risk_score > 0) {
    return (
      <div className="residual-badge residual-badge-pure">
        <span className="residual-icon">⚠️</span>
        100% Unexplained Risk
      </div>
    );
  }

  const getStatusClass = () => {
    switch (data.status) {
      case 'contextually_explained': return 'residual-badge-explained';
      case 'moderate_unexplained_risk': return 'residual-badge-moderate';
      case 'high_unexplained_risk': return 'residual-badge-high';
      default: return 'residual-badge-normal';
    }
  };

  return (
    <div className={`residual-badge ${getStatusClass()}`}>
      <div className="residual-bars">
        <div 
          className="residual-bar-explained" 
          style={{ width: `${(data.explained_deduction / Math.max(1, data.raw_risk_score)) * 100}%` }}
        />
        <div 
          className="residual-bar-unexplained" 
          style={{ width: `${data.unexplained_percentage}%` }}
        />
      </div>
      <div className="residual-text">
        <span>Contextual: -{data.explained_deduction.toFixed(0)}</span>
        <span className="residual-divider">|</span>
        <span className="residual-bold">Residual: {data.residual_risk_score.toFixed(0)}</span>
      </div>
    </div>
  );
};
