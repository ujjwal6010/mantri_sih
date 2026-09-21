import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { PeerComparison } from '../types/project';

interface PeerChartProps {
  peers: PeerComparison[];
}

const CHART_BG = 'rgba(0,0,0,0)';
const FONT_COLOR = '#5F6F89';
const GRID_COLOR = 'rgba(228,233,241,0.6)';

const METRIC_LABELS: Record<string, string> = {
  expenditure_ratio: 'Expenditure Ratio (%)',
  progress_gap: 'Progress Gap (pts)',
  delay_days: 'Delay (days)',
};

export const PeerComparisonChart: React.FC<PeerChartProps> = ({ peers }) => {
  if (!peers || peers.length === 0) return null;

  const metrics = useMemo(() => peers.map((p) => METRIC_LABELS[p.metric] || p.metric), [peers]);

  const data = useMemo(() => {
    const traces: any[] = [];

    // IQR range box (Q1 to Q3) — draw as a filled area
    traces.push({
      x: metrics,
      y: peers.map((p) => p.peer_q3 - p.peer_q1),
      base: peers.map((p) => p.peer_q1),
      type: 'bar',
      name: 'Peer IQR Range (Q1–Q3)',
      marker: {
        color: 'rgba(99, 102, 241, 0.18)',
        line: { color: 'rgba(99, 102, 241, 0.4)', width: 1 },
      },
      hovertemplate: 'IQR: %{base:.1f} – %{customdata:.1f}<extra>Peer Normal Range</extra>',
      customdata: peers.map((p) => p.peer_q3),
    });

    // Peer median line
    traces.push({
      x: metrics,
      y: peers.map((p) => p.peer_median),
      type: 'scatter',
      mode: 'markers+text',
      name: 'Peer Median',
      marker: {
        color: '#6366f1',
        size: 12,
        symbol: 'diamond',
        line: { color: '#818cf8', width: 2 },
      },
      text: peers.map((p) => `${p.peer_median.toFixed(1)}`),
      textposition: 'top center',
      textfont: { size: 10, color: '#818cf8', family: 'JetBrains Mono, monospace' },
      hovertemplate: 'Peer Median: %{y:.1f}<extra></extra>',
    });

    // Subject project value
    traces.push({
      x: metrics,
      y: peers.map((p) => p.project_value),
      type: 'scatter',
      mode: 'markers+text',
      name: 'This Project',
      marker: {
        color: peers.map((p) =>
          p.deviation === 'above_iqr'
            ? '#ef4444'
            : p.deviation === 'below_iqr'
            ? '#f97316'
            : '#22c55e'
        ),
        size: 14,
        symbol: 'circle',
        line: { color: '#fff', width: 2 },
      },
      text: peers.map((p) => `${p.project_value.toFixed(1)}`),
      textposition: 'bottom center',
      textfont: {
        size: 11,
        color: peers.map((p) =>
          p.deviation === 'within_range' ? '#22c55e' : '#ef4444'
        ),
        family: 'JetBrains Mono, monospace',
      },
      hovertemplate: 'Subject Value: %{y:.1f}<br>Deviation: %{customdata}<extra></extra>',
      customdata: peers.map((p) => p.deviation.replace('_', ' ').toUpperCase()),
    });

    return traces;
  }, [peers, metrics]);

  const layout = useMemo(
    () => ({
      title: {
        text: 'Subject vs Peer Cohort (IQR Statistical Benchmark)',
        font: { size: 13, color: '#e2e8f0', family: 'Inter, system-ui, sans-serif' },
        x: 0.5,
      },
      paper_bgcolor: CHART_BG,
      plot_bgcolor: CHART_BG,
      font: { color: FONT_COLOR, family: 'Inter, system-ui, sans-serif', size: 11 },
      xaxis: {
        tickfont: { size: 11 },
        automargin: true,
      },
      yaxis: {
        gridcolor: GRID_COLOR,
        title: { text: 'Value', font: { size: 11 } },
        tickfont: { family: 'JetBrains Mono, monospace', size: 10 },
      },
      margin: { t: 50, b: 60, l: 60, r: 20 },
      height: 340,
      barmode: 'overlay' as const,
      showlegend: true,
      legend: {
        orientation: 'h' as const,
        y: -0.2,
        x: 0.5,
        xanchor: 'center' as const,
        font: { size: 10, color: FONT_COLOR },
        bgcolor: 'rgba(0,0,0,0)',
      },
    }),
    []
  );

  return (
    <div className="peer-chart-container">
      <Plot
        data={data}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
