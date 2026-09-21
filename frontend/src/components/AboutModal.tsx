import React from 'react';
import { X, Eye, Shield, Terminal, Activity, FileDigit, Cpu, Users } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
  isBackendLive: boolean;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose, isBackendLive }) => {
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="about-modal-window" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="about-header">
          <div className="about-title-group">
            <div className="about-icon-wrapper">
              <Eye size={22} className="text-primary" />
            </div>
            <div>
              <h2 className="about-title">Mantri Drishti Intelligence Platform</h2>
              <p className="about-subtitle">AI Flags. AI Explains. Humans Verify.</p>
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
              Mantri Drishti is an AI-powered Risk Intelligence platform designed for the Member of Parliament Local Area Development Scheme (MPLADS). It transforms raw financial disbursements, timeline milestones, and geospatial coordinates into calibrated, explainable audit dossiers.
            </p>
          </div>

          {/* Engine Section */}
          <div className="about-section">
            <div className="about-section-header">
              <Shield size={18} className="text-primary" />
              <h3 className="about-section-title">Multi-Signal Intelligence Protocol</h3>
            </div>
            <p className="about-section-desc">
              Traditional audit software uses rigid binary thresholds that produce excessive false positives or miss subtle corruption schemes. Mantri Drishti fuses four independent analytical engines:
            </p>
            
            <div className="engine-grid">
              <div className="engine-card">
                <div className="engine-icon"><FileDigit size={18} /></div>
                <div className="engine-content">
                  <h4>Rule Engine <span>(35% Weight)</span></h4>
                  <p>Flags mathematical anomalies such as &gt;80% funds disbursed with &lt;40% physical progress on the ground.</p>
                </div>
              </div>

              <div className="engine-card">
                <div className="engine-icon"><Activity size={18} /></div>
                <div className="engine-content">
                  <h4>Isolation Forest ML <span>(30% Weight)</span></h4>
                  <p>An unsupervised scikit-learn model analyzing 8 multi-dimensional behavioral features to isolate non-linear statistical outliers.</p>
                </div>
              </div>

              <div className="engine-card">
                <div className="engine-icon"><Cpu size={18} /></div>
                <div className="engine-content">
                  <h4>Similarity Engine <span>(15% Weight)</span></h4>
                  <p>TF-IDF text similarity + Haversine geospatial proximity (&lt;2km) + contractor entity clustering to catch duplicate billing.</p>
                </div>
              </div>

              <div className="engine-card">
                <div className="engine-icon"><Users size={18} /></div>
                <div className="engine-content">
                  <h4>Peer Benchmarking <span>(20% Weight)</span></h4>
                  <p>Interquartile Range (IQR) calculations grouping projects by sector and state to measure realistic spending velocities.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Backend Status Terminal */}
          <div className="about-section">
            <div className="about-section-header">
              <Terminal size={18} className="text-primary" />
              <h3 className="about-section-title">Backend API Server Status</h3>
            </div>
            
            <div className="terminal-window">
              <div className="terminal-header">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="terminal-title">server_status.sh</span>
              </div>
              <div className="terminal-body">
                <p className="term-line">
                  <span className="term-prompt">$</span> checking connection to backend...
                </p>
                <p className="term-line">
                  <span className="term-prompt">$</span> status: 
                  <span className={`term-status ${isBackendLive ? 'live' : 'offline'}`}>
                    {isBackendLive ? ' ACTIVE (http://127.0.0.1:8000)' : ' OFFLINE (Using Demo Dataset)'}
                  </span>
                </p>
                {!isBackendLive && (
                  <>
                    <p className="term-line comment"># To launch the live FastAPI intelligence backend:</p>
                    <p className="term-line"><span className="term-prompt">$</span> cd backend</p>
                    <p className="term-line"><span className="term-prompt">$</span> python -m uvicorn app.main:app --reload --port 8000</p>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
