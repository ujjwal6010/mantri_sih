import React from 'react';
import { X, Settings, Database, HardDrive, ShieldAlert } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="about-modal-window" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="about-header">
          <div className="about-title-group">
            <div className="about-icon-wrapper">
              <Settings size={22} className="text-primary" />
            </div>
            <div>
              <h2 className="about-title">Data & Settings</h2>
              <p className="about-subtitle">System Configuration and Data Management</p>
            </div>
          </div>
          <button className="about-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="about-body">
          <div className="about-hero-card">
            <p className="about-hero-text">
              Configure system parameters, manage database connections, and review data ingestion logs. (This is a placeholder for the upcoming Settings module).
            </p>
          </div>

          <div className="about-section">
            <div className="about-section-header">
              <Database size={18} className="text-primary" />
              <h3 className="about-section-title">Data Sources</h3>
            </div>
            <p className="about-section-desc">
              Currently connected to the primary relational database and the geospatial data warehouse.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
