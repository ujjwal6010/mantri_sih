import React from 'react';
import type { OverviewStats } from '../types/project';
import {
  MapPin,
  PieChart,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { RiskDistributionChart, StateRiskChart, WorkTypeChart } from './RiskCharts';
import { EntityGraph } from './EntityGraph';
import { GamingDetectionPanel } from './GamingDetectionPanel';

interface AnalyticsViewProps {
  overview: OverviewStats | null;
  onSelectState: (state: string) => void;
  onSelectSector: (sector: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  overview,
  onSelectState,
  onSelectSector,
}) => {
  if (!overview) return null;

  return (
    <div className="analytics-root">
      
      <div className="analytics-header">
        <h2 className="analytics-page-title">
          <TrendingUp size={20} className="text-primary"/>
          Risk Analytics & Demographics
        </h2>
        <p className="analytics-page-subtitle">Deep dive into portfolio risk distribution across regions and sectors.</p>
      </div>

      <div className="charts-grid-main">
        {/* Risk Distribution Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <PieChart size={18} className="chart-icon" />
            <h3 className="chart-title">Global Risk Distribution</h3>
          </div>
          <div className="chart-body">
            <RiskDistributionChart overview={overview} />
          </div>
        </div>

        {/* State Risk Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <MapPin size={18} className="chart-icon" />
            <h3 className="chart-title">Risk by State Pipeline</h3>
          </div>
          <div className="chart-body">
            <StateRiskChart overview={overview} />
          </div>
          <div className="chart-footer">
            <div className="state-pills">
              {overview.top_states.slice(0, 5).map(({ state }) => (
                  <button
                    key={state}
                    className="state-pill"
                    onClick={() => onSelectState(state)}
                  >
                    {state} <ArrowRight size={12} />
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Sector Risk Chart */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <PieChart size={18} className="chart-icon" />
            <h3 className="chart-title">Sectoral Risk Volatility</h3>
          </div>
          <div className="chart-body">
            <WorkTypeChart overview={overview} />
          </div>
          <div className="chart-footer">
            <div className="sector-pills">
              {overview.work_type_breakdown.slice(0, 7).map(({ work_type: sector }) => (
                  <button
                    key={sector}
                    className="sector-pill"
                    onClick={() => onSelectSector(sector)}
                  >
                    {sector} <ArrowRight size={12} />
                  </button>
                ))}
            </div>
          </div>
        </div>
        
        {/* V3: Entity Graph Intelligence */}
        <div className="chart-card full-width entity-graph-card">
          <EntityGraph />
        </div>

        {/* V3: Gaming Detection */}
        <div className="chart-card full-width">
          <GamingDetectionPanel />
        </div>
      </div>
    </div>
  );
};
