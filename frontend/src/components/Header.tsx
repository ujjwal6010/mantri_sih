import { Eye, RefreshCw, BarChart3, ListFilter, Info, Map } from 'lucide-react';

interface HeaderProps {
  activeTab: 'projects' | 'analytics' | 'map';
  onTabChange: (tab: 'projects' | 'analytics' | 'map') => void;
  isBackendLive: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenAbout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isBackendLive,
  onRefresh,
  isRefreshing,
  onOpenAbout,
}) => {
  return (
    <header className="header-root">
      <div className="header-container">
        {/* Left: Brand & Tagline */}
        <div className="header-brand-group">
          <div className="brand-emblem">
            <Eye className="brand-icon" size={22} />
            <div className="emblem-halo" />
          </div>
          <div className="brand-text-block">
            <div className="brand-title-row">
              <h1 className="brand-title">MANTRI DRISHTI</h1>
              <span className="brand-badge">MPLADS V1.0</span>
            </div>
            <p className="brand-tagline">
              <span className="tagline-highlight">AI Flags.</span>{' '}
              <span className="tagline-highlight">AI Explains.</span>{' '}
              <span className="tagline-accent">Humans Verify.</span>
            </p>
          </div>
        </div>

        {/* Center: View Mode Switcher */}
        <nav className="header-nav-tabs" aria-label="Dashboard views">
          <button
            className={`nav-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => onTabChange('projects')}
          >
            <ListFilter size={16} />
            <span>Triage & Ranked Explorer</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => onTabChange('analytics')}
          >
            <BarChart3 size={16} />
            <span>Macro Geo & Sector Analytics</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => onTabChange('map')}
          >
            <Map size={16} />
            <span>GIS Risk Map</span>
          </button>
        </nav>

        {/* Right: Telemetry & Actions */}
        <div className="header-status-group">
          <div
            className={`connection-pill ${isBackendLive ? 'live' : 'fallback'}`}
            title={
              isBackendLive
                ? 'Connected to FastAPI backend on http://127.0.0.1:8000'
                : 'FastAPI backend offline. Operating with authentic demonstration dataset.'
            }
          >
            <span className={`status-dot ${isBackendLive ? 'live-pulse' : ''}`} />
            <span className="status-label">
              {isBackendLive ? 'Backend: 127.0.0.1:8000' : 'Demo Dataset Mode'}
            </span>
          </div>

          <button
            className="header-action-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh overview and project risk data"
            aria-label="Refresh Data"
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
          </button>

          <button
            className="header-action-btn"
            onClick={onOpenAbout}
            title="About Mantri Drishti Multi-Engine Intelligence"
            aria-label="System Intelligence Info"
          >
            <Info size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
