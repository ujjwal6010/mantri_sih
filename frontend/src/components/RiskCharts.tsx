import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { OverviewStats } from '../types/project';

interface RiskChartsProps {
  overview: OverviewStats;
}

const CHART_BG = 'rgba(0,0,0,0)';
const FONT_COLOR = 'var(--text-secondary)';
const GRID_COLOR = 'rgba(228,233,241,0.6)';

const RISK_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export const RiskDistributionChart: React.FC<RiskChartsProps> = ({ overview }) => {
  const dist = overview.risk_distribution;

  const data = useMemo(
    () => [
      {
        values: [dist.critical, dist.high, dist.medium, dist.low],
        labels: ['Critical (≥80)', 'High (60–79)', 'Medium (40–59)', 'Low (<40)'],
        type: 'pie' as const,
        hole: 0.55,
        marker: {
          colors: [RISK_COLORS.critical, RISK_COLORS.high, RISK_COLORS.medium, RISK_COLORS.low],
          line: { color: 'var(--bg-secondary)', width: 2 },
        },
        textinfo: 'label+value' as const,
        textposition: 'outside' as const,
        textfont: { size: 11, color: FONT_COLOR, family: 'JetBrains Mono, monospace' },
        hovertemplate: '<b>%{label}</b><br>%{value} projects (%{percent})<extra></extra>',
        pull: [0.04, 0.02, 0, 0],
      },
    ],
    [dist]
  );

  const layout = useMemo(
    () => ({
      title: {
        text: 'Portfolio Risk Distribution',
        font: { size: 14, color: 'var(--bg-secondary)', family: 'Inter, system-ui, sans-serif' },
        x: 0.5,
      },
      paper_bgcolor: CHART_BG,
      plot_bgcolor: CHART_BG,
      font: { color: FONT_COLOR, family: 'Inter, system-ui, sans-serif' },
      showlegend: false,
      margin: { t: 40, b: 20, l: 20, r: 20 },
      height: 320,
      annotations: [
        {
          text: `<b>${overview.total_projects}</b><br><span style="font-size:10px">TOTAL</span>`,
          showarrow: false,
          font: { size: 22, color: 'var(--bg-secondary)', family: 'JetBrains Mono, monospace' },
          x: 0.5,
          y: 0.5,
        },
      ],
    }),
    [overview.total_projects]
  );

  return (
    <Plot
      data={data}
      layout={layout}
      config={{ displayModeBar: false, responsive: true }}
      useResizeHandler
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export const StateRiskChart: React.FC<RiskChartsProps> = ({ overview }) => {
  const states = useMemo(() => [...overview.top_states].reverse(), [overview.top_states]);

  const data = useMemo(
    () => [
      {
        y: states.map((s) => s.state),
        x: states.map((s) => s.avg_risk),
        type: 'bar' as const,
        orientation: 'h' as const,
        marker: {
          color: states.map((s) =>
            s.avg_risk >= 60 ? RISK_COLORS.critical : s.avg_risk >= 45 ? RISK_COLORS.high : s.avg_risk >= 30 ? RISK_COLORS.medium : RISK_COLORS.low
          ),
          line: { color: 'rgba(0,0,0,0.2)', width: 1 },
        },
        text: states.map((s) => `${s.avg_risk.toFixed(1)} (${s.count} works)`),
        textposition: 'auto' as const,
        textfont: { size: 10, color: 'var(--bg-secondary)', family: 'JetBrains Mono, monospace' },
        hovertemplate: '<b>%{y}</b><br>Avg Risk: %{x:.1f}<extra></extra>',
      },
    ],
    [states]
  );

  const layout = useMemo(
    () => ({
      title: {
        text: 'Average Risk Score by State',
        font: { size: 14, color: 'var(--bg-secondary)', family: 'Inter, system-ui, sans-serif' },
        x: 0.5,
      },
      paper_bgcolor: CHART_BG,
      plot_bgcolor: CHART_BG,
      font: { color: FONT_COLOR, family: 'Inter, system-ui, sans-serif', size: 11 },
      xaxis: {
        gridcolor: GRID_COLOR,
        range: [0, 100],
        title: { text: 'Risk Score', font: { size: 11 } },
        tickfont: { family: 'JetBrains Mono, monospace', size: 10 },
      },
      yaxis: {
        tickfont: { size: 11 },
        automargin: true,
      },
      margin: { t: 40, b: 50, l: 110, r: 20 },
      height: 320,
      bargap: 0.25,
    }),
    []
  );

  return (
    <Plot
      data={data}
      layout={layout}
      config={{ displayModeBar: false, responsive: true }}
      useResizeHandler
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export const WorkTypeChart: React.FC<RiskChartsProps> = ({ overview }) => {
  const workTypes = useMemo(
    () => [...overview.work_type_breakdown].sort((a, b) => b.count - a.count),
    [overview.work_type_breakdown]
  );

  const data = useMemo(
    () => [
      {
        x: workTypes.map((w) => w.work_type),
        y: workTypes.map((w) => w.count),
        type: 'bar' as const,
        marker: {
          color: workTypes.map(
            (_, i) =>
              `hsl(${210 + i * 15}, 70%, ${55 - i * 3}%)`
          ),
          line: { color: 'rgba(0,0,0,0.15)', width: 1 },
        },
        text: workTypes.map((w) => `${w.count}`),
        textposition: 'outside' as const,
        textfont: { size: 10, color: FONT_COLOR, family: 'JetBrains Mono, monospace' },
        hovertemplate: '<b>%{x}</b><br>%{y} projects<extra></extra>',
      },
    ],
    [workTypes]
  );

  const layout = useMemo(
    () => ({
      title: {
        text: 'Projects by Work Type / Sector',
        font: { size: 14, color: 'var(--bg-secondary)', family: 'Inter, system-ui, sans-serif' },
        x: 0.5,
      },
      paper_bgcolor: CHART_BG,
      plot_bgcolor: CHART_BG,
      font: { color: FONT_COLOR, family: 'Inter, system-ui, sans-serif', size: 11 },
      xaxis: {
        tickangle: -35,
        tickfont: { size: 9 },
        automargin: true,
      },
      yaxis: {
        gridcolor: GRID_COLOR,
        title: { text: 'Number of Projects', font: { size: 11 } },
        tickfont: { family: 'JetBrains Mono, monospace', size: 10 },
      },
      margin: { t: 40, b: 100, l: 50, r: 20 },
      height: 320,
      bargap: 0.2,
    }),
    []
  );

  return (
    <Plot
      data={data}
      layout={layout}
      config={{ displayModeBar: false, responsive: true }}
      useResizeHandler
      style={{ width: '100%', height: '100%' }}
    />
  );
};
