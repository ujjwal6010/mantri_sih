import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { ProjectSummary, RiskBand } from '../types/project';
import { ShieldAlert, MapPin, ExternalLink, Filter } from 'lucide-react';

interface GISMapViewProps {
  projects: ProjectSummary[];
  onOpenDrawer: (projectId: string) => void;
  onOpenDossier: (projectId: string) => void;
}

const RISK_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  critical: { fill: '#ef4444', stroke: '#991b1b', label: 'Critical (≥80)' },
  high: { fill: '#f97316', stroke: '#9a3412', label: 'High (60–79)' },
  medium: { fill: '#eab308', stroke: '#854d0e', label: 'Medium (40–59)' },
  low: { fill: '#22c55e', stroke: '#166534', label: 'Low (<40)' },
};

function getRiskTier(score: number): string {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function getMarkerRadius(score: number): number {
  if (score >= 80) return 12;
  if (score >= 60) return 10;
  if (score >= 40) return 8;
  return 6;
}

// Auto-fit map bounds to visible markers
const FitBounds: React.FC<{ projects: ProjectSummary[] }> = ({ projects }) => {
  const map = useMap();

  React.useEffect(() => {
    const validProjects = projects.filter(
      (p) => p.latitude != null && p.longitude != null
    );
    if (validProjects.length === 0) return;

    const bounds = validProjects.map(
      (p) => [p.latitude!, p.longitude!] as [number, number]
    );

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [projects, map]);

  return null;
};

export const GISMapView: React.FC<GISMapViewProps> = ({
  projects,
  onOpenDrawer,
  onOpenDossier,
}) => {
  const [mapRiskFilter, setMapRiskFilter] = useState<RiskBand>('all');
  const [mapStateFilter, setMapStateFilter] = useState<string>('All States');
  const [mapWorkTypeFilter, setMapWorkTypeFilter] = useState<string>('All Sectors');

  // Unique states and work types
  const states = useMemo(() => {
    const unique = [...new Set(projects.map((p) => p.state))].sort();
    return ['All States', ...unique];
  }, [projects]);

  const workTypes = useMemo(() => {
    const unique = [...new Set(projects.map((p) => p.work_type))].sort();
    return ['All Sectors', ...unique];
  }, [projects]);

  // Filter projects for map
  const mapProjects = useMemo(() => {
    return projects.filter((p) => {
      if (p.latitude == null || p.longitude == null) return false;

      if (mapStateFilter !== 'All States' && p.state !== mapStateFilter) return false;
      if (mapWorkTypeFilter !== 'All Sectors' && p.work_type !== mapWorkTypeFilter) return false;

      const score = p.risk_score ?? 0;
      if (mapRiskFilter === 'critical' && score < 80) return false;
      if (mapRiskFilter === 'high' && (score < 60 || score >= 80)) return false;
      if (mapRiskFilter === 'medium' && (score < 40 || score >= 60)) return false;
      if (mapRiskFilter === 'low' && score >= 40) return false;

      return true;
    });
  }, [projects, mapRiskFilter, mapStateFilter, mapWorkTypeFilter]);

  // Stats for current filter
  const mapStats = useMemo(() => {
    const total = mapProjects.length;
    const critical = mapProjects.filter((p) => (p.risk_score ?? 0) >= 80).length;
    const high = mapProjects.filter((p) => {
      const s = p.risk_score ?? 0;
      return s >= 60 && s < 80;
    }).length;
    const medium = mapProjects.filter((p) => {
      const s = p.risk_score ?? 0;
      return s >= 40 && s < 60;
    }).length;
    const low = mapProjects.filter((p) => (p.risk_score ?? 0) < 40).length;
    return { total, critical, high, medium, low };
  }, [mapProjects]);

  // Center of India
  const defaultCenter: [number, number] = [22.5, 80.0];

  return (
    <div className="gis-root">
      {/* Map Filter Toolbar */}
      <div className="gis-toolbar">
        <div className="gis-toolbar-left">
          <Filter size={15} className="toolbar-icon" />
          <span className="gis-toolbar-title">Map Filters</span>

          <select
            className="gis-select"
            value={mapStateFilter}
            onChange={(e) => setMapStateFilter(e.target.value)}
          >
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="gis-select"
            value={mapWorkTypeFilter}
            onChange={(e) => setMapWorkTypeFilter(e.target.value)}
          >
            {workTypes.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>

          <div className="gis-risk-pills">
            {(['all', 'critical', 'high', 'medium', 'low'] as RiskBand[]).map((band) => (
              <button
                key={band}
                className={`gis-risk-pill ${band} ${mapRiskFilter === band ? 'active' : ''}`}
                onClick={() => setMapRiskFilter(band)}
              >
                <span className={`pill-dot ${band}`} />
                {band === 'all' ? 'All' : band.charAt(0).toUpperCase() + band.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="gis-toolbar-right">
          <span className="gis-marker-count telemetry-num">
            {mapStats.total} markers
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="gis-map-wrapper">
        <MapContainer
          center={defaultCenter}
          zoom={5}
          scrollWheelZoom={true}
          className="gis-leaflet-map"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <FitBounds projects={mapProjects} />

          {mapProjects.map((project) => {
            const score = project.risk_score ?? 0;
            const tier = getRiskTier(score);
            const colors = RISK_COLORS[tier];
            const radius = getMarkerRadius(score);

            return (
              <CircleMarker
                key={project.project_id}
                center={[project.latitude!, project.longitude!]}
                radius={radius}
                pathOptions={{
                  fillColor: colors.fill,
                  color: colors.stroke,
                  weight: 2,
                  opacity: 0.9,
                  fillOpacity: 0.7,
                }}
              >
                <Popup className="gis-popup" maxWidth={340} minWidth={280}>
                  <div className="popup-content">
                    <div className="popup-header">
                      <div className="popup-id-row">
                        <ShieldAlert size={14} className={`popup-risk-icon ${tier}`} />
                        <span className="popup-project-id telemetry-num">{project.project_id}</span>
                        <span className={`popup-risk-badge ${tier}`}>
                          {score.toFixed(1)} Risk
                        </span>
                      </div>
                      <h4 className="popup-title">{project.description}</h4>
                    </div>

                    <div className="popup-details">
                      <div className="popup-detail-row">
                        <MapPin size={12} />
                        <span>{project.district}, {project.state}</span>
                      </div>
                      <div className="popup-detail-row">
                        <span className="popup-label">Sector:</span>
                        <span>{project.work_type}</span>
                      </div>
                      <div className="popup-detail-row">
                        <span className="popup-label">Progress:</span>
                        <span className="telemetry-num">{project.physical_progress.toFixed(0)}%</span>
                      </div>
                      <div className="popup-detail-row">
                        <span className="popup-label">Sanctioned:</span>
                        <span className="telemetry-num">
                          ₹{(project.sanctioned_amount / 100000).toFixed(2)} Lakhs
                        </span>
                      </div>
                      <div className="popup-detail-row">
                        <span className="popup-label">Contractor:</span>
                        <span>{project.contractor}</span>
                      </div>
                    </div>

                    <div className="popup-actions">
                      <button
                        className="popup-action-btn inspect"
                        onClick={() => onOpenDrawer(project.project_id)}
                      >
                        Inspect Project
                      </button>
                      <button
                        className="popup-action-btn dossier"
                        onClick={() => onOpenDossier(project.project_id)}
                      >
                        <ExternalLink size={12} />
                        Full Dossier
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Floating Legend */}
        <div className="gis-legend">
          <span className="legend-title">Risk Legend</span>
          {Object.entries(RISK_COLORS).map(([tier, colors]) => (
            <div key={tier} className="legend-item">
              <span
                className="legend-dot"
                style={{ backgroundColor: colors.fill, borderColor: colors.stroke }}
              />
              <span className="legend-label">{colors.label}</span>
              <span className="legend-count telemetry-num">
                {mapStats[tier as keyof typeof mapStats]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
