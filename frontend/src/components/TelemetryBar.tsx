import React from 'react';
import type { OverviewStats } from '../types/project';
import {
  RefreshCw,
  FileText,
  AlertTriangle,
  Clock,
  Users,
  BarChart,
  Shield,
  ArrowUpCircle,
  ArrowUpRight,
} from 'lucide-react';

interface TelemetryBarProps {
  overview: OverviewStats | null;
  isLoading: boolean;
  onKpiClick?: (type: 'projects' | 'alerts' | 'analytics') => void;
}

type MicroVisualType =
  | 'bars-blue'
  | 'spark-coral'
  | 'spark-amber'
  | 'spark-purple'
  | 'dots-teal'
  | 'bars-coral'
  | 'dots-slate';

interface MetricCardData {
  id: string;
  label: string;
  value: number | string;
  subText: string;
  trend?: string;
  trendType?: 'positive' | 'warning' | 'neutral';
  icon: React.ReactNode;
  colorTheme: 'blue' | 'coral' | 'amber' | 'purple' | 'teal' | 'slate';
  progressPercent?: number;
  progressLabel?: string;
  microVisual: MicroVisualType;
  onClick?: () => void;
}

const MicroVisual: React.FC<{ type: MicroVisualType }> = ({ type }) => {
  switch (type) {
    case 'bars-blue':
      return (
        <svg width="44" height="24" viewBox="0 0 44 24" fill="none" className="kpi-micro-svg" aria-hidden="true">
          <rect x="2" y="13" width="5" height="11" rx="2" fill="currentColor" fillOpacity="0.3" />
          <rect x="11" y="8" width="5" height="16" rx="2" fill="currentColor" fillOpacity="0.5" />
          <rect x="20" y="4" width="5" height="20" rx="2" fill="currentColor" fillOpacity="0.75" />
          <rect x="29" y="10" width="5" height="14" rx="2" fill="currentColor" fillOpacity="0.55" />
          <rect x="38" y="1" width="5" height="23" rx="2" fill="currentColor" fillOpacity="0.95" />
        </svg>
      );
    case 'spark-coral':
      return (
        <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="kpi-micro-svg" aria-hidden="true">
          <defs>
            <linearGradient id="kpi-grad-coral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d="M 1 18 C 11 16, 17 9, 26 13 C 35 17, 41 7, 47 4 L 47 24 L 1 24 Z" fill="url(#kpi-grad-coral)" />
          <path d="M 1 18 C 11 16, 17 9, 26 13 C 35 17, 41 7, 47 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'spark-amber':
      return (
        <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="kpi-micro-svg" aria-hidden="true">
          <defs>
            <linearGradient id="kpi-grad-amber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d="M 1 14 C 10 20, 19 16, 28 10 C 37 4, 42 7, 47 3 L 47 24 L 1 24 Z" fill="url(#kpi-grad-amber)" />
          <path d="M 1 14 C 10 20, 19 16, 28 10 C 37 4, 42 7, 47 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'spark-purple':
      return (
        <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="kpi-micro-svg" aria-hidden="true">
          <defs>
            <linearGradient id="kpi-grad-purple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d="M 1 20 C 11 22, 20 15, 31 10 C 39 6, 43 12, 47 13 L 47 24 L 1 24 Z" fill="url(#kpi-grad-purple)" />
          <path d="M 1 20 C 11 22, 20 15, 31 10 C 39 6, 43 12, 47 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'dots-teal':
      return (
        <svg width="44" height="20" viewBox="0 0 44 20" fill="none" className="kpi-micro-svg" aria-hidden="true">
          <circle cx="4" cy="10" r="2.8" fill="currentColor" fillOpacity="0.9" />
          <circle cx="12" cy="10" r="2.8" fill="currentColor" fillOpacity="0.9" />
          <circle cx="20" cy="10" r="2.8" fill="currentColor" fillOpacity="0.9" />
          <circle cx="28" cy="10" r="2.8" fill="currentColor" fillOpacity="0.9" />
          <circle cx="36" cy="10" r="2.8" fill="currentColor" fillOpacity="0.9" />
          <circle cx="42" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.8 1.4" />
        </svg>
      );
    case 'bars-coral':
      return (
        <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="kpi-micro-svg" aria-hidden="true">
          <rect x="2" y="7" width="5" height="17" rx="2" fill="currentColor" fillOpacity="0.45" />
          <rect x="12" y="13" width="5" height="11" rx="2" fill="currentColor" fillOpacity="0.3" />
          <rect x="22" y="3" width="5" height="21" rx="2" fill="currentColor" fillOpacity="0.9" />
          <rect x="32" y="9" width="5" height="15" rx="2" fill="currentColor" fillOpacity="0.6" />
        </svg>
      );
    case 'dots-slate':
      return (
        <svg width="44" height="20" viewBox="0 0 44 20" fill="none" className="kpi-micro-svg" aria-hidden="true">
          <circle cx="5" cy="10" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.5" />
          <circle cx="15" cy="10" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.5" />
          <circle cx="25" cy="10" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.5" />
          <circle cx="35" cy="10" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.5" />
        </svg>
      );
    default:
      return null;
  }
};

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  overview,
  isLoading,
  onKpiClick,
}) => {
  if (isLoading || !overview) {
    return (
      <div className="telemetry-bar-skeleton">
        <div className="kpi-row kpi-row-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="kpi-skeleton-card" />
          ))}
        </div>
        <div className="kpi-row kpi-row-2">
          {[4, 5, 6, 7].map((i) => (
            <div key={i} className="kpi-skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  const row1Cards: MetricCardData[] = [
    {
      id: 'monitored-projects',
      label: 'MONITORED PROJECTS',
      value: 80,
      trend: '+12%',
      trendType: 'positive',
      subText: 'vs last month',
      icon: <FileText size={16} strokeWidth={2} />,
      colorTheme: 'blue',
      microVisual: 'bars-blue',
      onClick: () => onKpiClick?.('projects'),
    },
    {
      id: 'require-attention',
      label: 'REQUIRE ATTENTION',
      value: 28,
      subText: '35% of total',
      icon: <AlertTriangle size={16} strokeWidth={2} />,
      colorTheme: 'coral',
      progressPercent: 35,
      progressLabel: '35%',
      microVisual: 'spark-coral',
      onClick: () => onKpiClick?.('projects'),
    },
    {
      id: 'timeline-delays',
      label: 'TIMELINE DELAYS',
      value: 34,
      subText: '42% of total',
      icon: <Clock size={16} strokeWidth={2} />,
      colorTheme: 'amber',
      progressPercent: 42,
      progressLabel: '42%',
      microVisual: 'spark-amber',
      onClick: () => onKpiClick?.('projects'),
    },
  ];

  const row2Cards: MetricCardData[] = [
    {
      id: 'potential-overlaps',
      label: 'POTENTIAL OVERLAPS',
      value: 8,
      subText: '10% of total',
      icon: <Users size={16} strokeWidth={2} />,
      colorTheme: 'purple',
      progressPercent: 10,
      progressLabel: '10%',
      microVisual: 'spark-purple',
      onClick: () => onKpiClick?.('projects'),
    },
    {
      id: 'states-covered',
      label: 'STATES COVERED',
      value: 6,
      subText: '10 Work Types',
      icon: <BarChart size={16} strokeWidth={2} />,
      colorTheme: 'teal',
      microVisual: 'dots-teal',
      onClick: () => onKpiClick?.('analytics'),
    },
    {
      id: 'open-alerts',
      label: 'OPEN ALERTS',
      value: overview.open_alerts ?? 4,
      subText: 'Awaiting review',
      icon: <Shield size={16} strokeWidth={2} />,
      colorTheme: 'coral',
      microVisual: 'bars-coral',
      onClick: () => onKpiClick?.('alerts'),
    },
    {
      id: 'escalated',
      label: 'ESCALATED',
      value: overview.escalated_count ?? 0,
      subText: 'Requires senior review',
      icon: <ArrowUpCircle size={16} strokeWidth={2} />,
      colorTheme: 'slate',
      microVisual: 'dots-slate',
      onClick: () => onKpiClick?.('alerts'),
    },
  ];

  const renderKpiCard = (card: MetricCardData) => (
    <div
      key={card.id}
      className={`kpi-card theme-${card.colorTheme}`}
      onClick={card.onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.onClick?.();
        }
      }}
    >
      {/* 1 & 5: Icon Area & Top-Right Action Control */}
      <div className="kpi-top">
        <div className="kpi-icon-container">
          {card.icon}
        </div>
        <div className="kpi-action-btn" aria-hidden="true">
          <ArrowUpRight size={13} strokeWidth={2.2} />
        </div>
      </div>

      {/* 2: Metric Label */}
      <div className="kpi-label-row">
        <span className="kpi-metric-label">{card.label}</span>
      </div>

      {/* 3 & 6: Large Value + Right-Side Micro Visual */}
      <div className="kpi-body-row">
        <div className="kpi-body-left">
          <span className="kpi-main-value">{card.value}</span>
          {/* 4: Secondary / Trend Information */}
          <div className="kpi-sub-row">
            {card.trend && (
              <span className={`kpi-trend-pill ${card.trendType || ''}`}>
                <span className="kpi-trend-arrow">↑</span> {card.trend}
              </span>
            )}
            <span className="kpi-sub-text">{card.subText}</span>
          </div>
        </div>
        <div className="kpi-body-right">
          <MicroVisual type={card.microVisual} />
        </div>
      </div>

      {/* 7: Bottom Progress/Status Area */}
      {card.progressPercent !== undefined ? (
        <div className="kpi-bottom-row">
          <div className="kpi-progress-track">
            <div
              className="kpi-progress-fill"
              style={{ width: `${Math.min(Math.max(card.progressPercent, 0), 100)}%` }}
            />
          </div>
          {card.progressLabel && (
            <span className="kpi-progress-value">{card.progressLabel}</span>
          )}
        </div>
      ) : (
        <div className="kpi-bottom-row kpi-bottom-spacer" aria-hidden="true" />
      )}
    </div>
  );

  return (
    <section className="telemetry-section" aria-label="Executive Intelligence Overview">
      {/* Hero Header with Subtle Parliament Background */}
      <div className="dashboard-hero">
        <div className="hero-bg-canvas" aria-hidden="true">
          <div className="hero-bg-art" />
          <div className="hero-bg-fade" />
        </div>
        <div className="hero-left">
          <p className="hero-greeting">Welcome back, Admin 👋</p>
          <h1 className="hero-title">
            Monitor MPLADS. <span className="hero-title-accent">Enable Impact.</span>
          </h1>
          <p className="hero-subtitle">
            AI-powered risk intelligence to help build a transparent, accountable and effective development ecosystem.
          </p>
        </div>
        <div className="hero-right">
          <div className="hero-meta">
            <span className="hero-updated">Last updated: 04 Mar 2025, 10:24 AM</span>
            <button className="hero-refresh-btn" aria-label="Refresh data"><RefreshCw size={14}/></button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Row 1 (3 wider cards) + Row 2 (4 cards) */}
      <div className="kpi-section-grid">
        <div className="kpi-row kpi-row-1">
          {row1Cards.map(renderKpiCard)}
        </div>
        <div className="kpi-row kpi-row-2">
          {row2Cards.map(renderKpiCard)}
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
