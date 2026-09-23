import type { OverviewStats } from '../types/project';
import { RefreshCw, FileText, AlertTriangle, Clock, Users, BarChart, Shield, ArrowUpCircle } from 'lucide-react';

interface TelemetryBarProps {
  overview: OverviewStats | null;
  isLoading: boolean;
  onKpiClick?: (type: 'projects' | 'alerts' | 'analytics') => void;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  overview,
  isLoading,
  onKpiClick,
}) => {
  if (isLoading || !overview) {
    return (
      <div className="telemetry-bar-skeleton">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="kpi-skeleton-card" />
        ))}
      </div>
    );
  }

  return (
    <section className="telemetry-section" aria-label="Executive Intelligence Overview">
      {/* Hero Header */}
      <div className="dashboard-hero">
        <div className="hero-left">
          <p className="hero-greeting">Welcome back,</p>
          <h1 className="hero-title">Monitor MPLADS. Enable Impact.</h1>
          <p className="hero-subtitle">
            AI-powered risk intelligence to help build a transparent, accountable and effective development ecosystem.
          </p>
        </div>
        <div className="hero-right">
          <div className="hero-meta">
            <span className="hero-updated">Last updated: 04 Mar 2025, 10:24 AM</span>
            <button className="hero-refresh-btn"><RefreshCw size={14}/></button>
          </div>
          <div className="hero-quote-box">
            <span className="hero-quote-icon">“</span>
            <div className="hero-quote-content">
              <p className="hero-quote-main">Public funds create public trust.</p>
              <p className="hero-quote-sub">— Stronger oversight. Brighter communities.</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-cards-grid">
        <div className="kpi-card" onClick={() => onKpiClick?.('projects')}>
          <div className="kpi-card-left">
            <div className="kpi-icon-wrap blue"><FileText size={20} /></div>
          </div>
          <div className="kpi-card-right">
            <div className="kpi-val-row">
              <span className="kpi-value">80</span>
              <span className="kpi-arrow-icon">›</span>
            </div>
            <span className="kpi-label">Monitored Projects</span>
            <span className="kpi-sub-trend pos"><span className="trend-arrow">▲</span> +12% vs last month</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onKpiClick?.('projects')}>
          <div className="kpi-card-left">
            <div className="kpi-icon-wrap red"><AlertTriangle size={20} /></div>
          </div>
          <div className="kpi-card-right">
            <div className="kpi-val-row">
              <span className="kpi-value">28</span>
              <span className="kpi-arrow-icon">›</span>
            </div>
            <span className="kpi-label">Require Attention</span>
            <span className="kpi-sub-text">35% of total</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onKpiClick?.('projects')}>
          <div className="kpi-card-left">
            <div className="kpi-icon-wrap orange"><Clock size={20} /></div>
          </div>
          <div className="kpi-card-right">
            <div className="kpi-val-row">
              <span className="kpi-value">34</span>
              <span className="kpi-arrow-icon">›</span>
            </div>
            <span className="kpi-label">Timeline Delays</span>
            <span className="kpi-sub-text">42% of total</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onKpiClick?.('projects')}>
          <div className="kpi-card-left">
            <div className="kpi-icon-wrap purple"><Users size={20} /></div>
          </div>
          <div className="kpi-card-right">
            <div className="kpi-val-row">
              <span className="kpi-value">8</span>
              <span className="kpi-arrow-icon">›</span>
            </div>
            <span className="kpi-label">Potential Overlaps</span>
            <span className="kpi-sub-text">10% of total</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onKpiClick?.('analytics')}>
          <div className="kpi-card-left">
            <div className="kpi-icon-wrap green"><BarChart size={20} /></div>
          </div>
          <div className="kpi-card-right">
            <div className="kpi-val-row">
              <span className="kpi-value">6</span>
            </div>
            <span className="kpi-label">States Covered</span>
            <span className="kpi-sub-text">10 Work Types</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onKpiClick?.('alerts')}>
          <div className="kpi-card-left">
            <div className="kpi-icon-wrap red"><Shield size={20} /></div>
          </div>
          <div className="kpi-card-right">
            <div className="kpi-val-row">
              <span className="kpi-value">{overview.open_alerts ?? 0}</span>
            </div>
            <span className="kpi-label">Open Alerts</span>
            <span className="kpi-sub-text">Awaiting review</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => onKpiClick?.('alerts')}>
          <div className="kpi-card-left">
            <div className="kpi-icon-wrap orange"><ArrowUpCircle size={20} /></div>
          </div>
          <div className="kpi-card-right">
            <div className="kpi-val-row">
              <span className="kpi-value">{overview.escalated_count ?? 0}</span>
            </div>
            <span className="kpi-label">Escalated</span>
            <span className="kpi-sub-text">Requires senior review</span>
          </div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="risk-distribution-section">
        <h3 className="risk-dist-title">Portfolio Risk Distribution</h3>
        
        <div className="risk-segmented-bar">
          <div className="risk-segment critical" style={{ flex: 14 }} />
          <div className="risk-segment-gap" />
          <div className="risk-segment high" style={{ flex: 16 }} />
          <div className="risk-segment-gap" />
          <div className="risk-segment medium" style={{ flex: 28 }} />
          <div className="risk-segment-gap" />
          <div className="risk-segment low" style={{ flex: 22 }} />
        </div>

        <div className="risk-dist-legend">
          <div className="legend-items">
            <div className="legend-item"><span className="legend-dot critical"/> Critical (80–100) <span className="legend-val">14</span></div>
            <div className="legend-item"><span className="legend-dot high"/> High (60–79) <span className="legend-val">16</span></div>
            <div className="legend-item"><span className="legend-dot medium"/> Medium (40–59) <span className="legend-val">28</span></div>
            <div className="legend-item"><span className="legend-dot low"/> Low (0–39) <span className="legend-val">22</span></div>
          </div>
          <div className="legend-total">80 projects total</div>
        </div>
      </div>
    </section>
  );
};
