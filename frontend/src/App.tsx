import { useState, useEffect, useCallback, useMemo } from 'react';
import './styles/theme.css';
import './styles/dashboard.css';
import './styles/v2-advanced.css';
import './styles/v3-intelligence.css';
import type { ProjectSummary, OverviewStats, RiskBand } from './types/project';
import {
  checkBackendHealth,
  fetchOverview,
  fetchProjects,
} from './services/api';

import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { TelemetryBar } from './components/TelemetryBar';
import { FilterToolbar } from './components/FilterToolbar';
import { ProjectTable } from './components/ProjectTable';
import { AnalyticsView } from './components/AnalyticsView';
import { GISMapView } from './components/GISMapView';
import { InvestigationDrawer } from './components/InvestigationDrawer';
import { DossierModal } from './components/DossierModal';
import { AboutModal } from './components/AboutModal';
import { SettingsModal } from './components/SettingsModal';
import { AuditTrailView } from './components/AuditTrailView';

const App = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [isLoading, setIsLoading] = useState(true);
    const [isBackendLive, setIsBackendLive] = useState(false);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'analytics' | 'map' | 'audit'>('projects');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedDrawerId, setSelectedDrawerId] = useState<string | null>(null);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedWorkType, setSelectedWorkType] = useState('All Sectors');
  const [selectedRiskBand, setSelectedRiskBand] = useState<RiskBand>('all');
  const [sortBy, setSortBy] = useState<string>('risk');

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('mantri-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('mantri-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Load Initial Data
  const loadData = useCallback(async () => {
    try {
      const [backendUp, overviewData, projectsData] = await Promise.all([
        checkBackendHealth(),
        fetchOverview(),
        fetchProjects({ sort_by: 'risk', limit: 100 }),
      ]);
      setIsBackendLive(backendUp);
      setOverview(overviewData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Initial data loading error:', err);
    } finally {
      setIsLoading(false);
          }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      const up = await checkBackendHealth();
      setIsBackendLive(up);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  
  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedDossierId) {
          setSelectedDossierId(null);
        } else if (selectedDrawerId) {
          setSelectedDrawerId(null);
        } else if (showAboutModal) {
          setShowAboutModal(false);
        } else if (showSettingsModal) {
          setShowSettingsModal(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDossierId, selectedDrawerId, showAboutModal, showSettingsModal]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedState('All States');
    setSelectedWorkType('All Sectors');
    setSelectedRiskBand('all');
    setSortBy('risk');
  };

  // Filter & Sort Projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = p.project_id.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchDist = p.district.toLowerCase().includes(q);
          const matchState = p.state.toLowerCase().includes(q);
          const matchConst = p.constituency.toLowerCase().includes(q);
          const matchContractor = p.contractor.toLowerCase().includes(q);
          if (!matchId && !matchDesc && !matchDist && !matchState && !matchConst && !matchContractor) {
            return false;
          }
        }
        if (selectedState !== 'All States' && p.state.toLowerCase() !== selectedState.toLowerCase()) {
          return false;
        }
        if (selectedWorkType !== 'All Sectors' && p.work_type !== selectedWorkType) {
          return false;
        }
        if (selectedRiskBand !== 'all') {
          const score = p.risk_score ?? 0;
          if (selectedRiskBand === 'critical' && score < 80) return false;
          if (selectedRiskBand === 'high' && (score < 60 || score >= 80)) return false;
          if (selectedRiskBand === 'medium' && (score < 40 || score >= 60)) return false;
          if (selectedRiskBand === 'low' && score >= 40) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'risk') return (b.risk_score ?? 0) - (a.risk_score ?? 0);
        if (sortBy === 'risk_asc') return (a.risk_score ?? 0) - (b.risk_score ?? 0);
        if (sortBy === 'amount') return b.sanctioned_amount - a.sanctioned_amount;
        if (sortBy === 'gap') return (100 - b.physical_progress) - (100 - a.physical_progress);
        if (sortBy === 'delay') return (b.risk_score ?? 0) - (a.risk_score ?? 0);
        if (sortBy === 'district') return a.district.localeCompare(b.district);
        return 0;
      });
  }, [projects, searchQuery, selectedState, selectedWorkType, selectedRiskBand, sortBy]);

  const drawerProjectSummary = useMemo(() => {
    return projects.find((p) => p.project_id === selectedDrawerId) || null;
  }, [projects, selectedDrawerId]);

  const dossierProjectSummary = useMemo(() => {
    return projects.find((p) => p.project_id === selectedDossierId) || null;
  }, [projects, selectedDossierId]);

  const handleSelectStateFromAnalytics = (state: string) => {
    setSelectedState(state);
    setActiveTab('projects');
  };

  const handleSelectSectorFromAnalytics = (sector: string) => {
    setSelectedWorkType(sector);
    setActiveTab('projects');
  };

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAbout={() => setShowAboutModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      <div className="app-main">
        <TopHeader
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <main className="main-content">
          <TelemetryBar
            overview={overview}
            isLoading={isLoading}
            onKpiClick={(type) => {
              if (type === 'projects') setActiveTab('projects');
              else if (type === 'alerts') setActiveTab('audit');
              else if (type === 'analytics') setActiveTab('analytics');
            }}
          />

          {activeTab === 'projects' ? (
            <div className="table-card">
              <FilterToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedState={selectedState}
                onStateChange={setSelectedState}
                selectedWorkType={selectedWorkType}
                onWorkTypeChange={setSelectedWorkType}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                onReset={handleResetFilters}
                totalFiltered={filteredProjects.length}
                totalProjects={projects.length}
                selectedRiskBand={selectedRiskBand}
              />
              <ProjectTable
                projects={filteredProjects}
                onSelectProject={(id) => setSelectedDrawerId(id)}
                onOpenDossier={(id) => setSelectedDossierId(id)}
                isLoading={isLoading}
              />
            </div>
          ) : activeTab === 'analytics' ? (
            <AnalyticsView
              overview={overview}
              onSelectState={handleSelectStateFromAnalytics}
              onSelectSector={handleSelectSectorFromAnalytics}
            />
          ) : activeTab === 'audit' ? (
            <AuditTrailView />
          ) : (
            <GISMapView
              projects={projects}
              onOpenDrawer={(id) => setSelectedDrawerId(id)}
              onOpenDossier={(id) => setSelectedDossierId(id)}
            />
          )}
        </main>
      </div>

      {selectedDrawerId && (
        <InvestigationDrawer
          projectId={selectedDrawerId}
          projectSummary={drawerProjectSummary}
          onClose={() => setSelectedDrawerId(null)}
          onOpenFullDossier={(id) => {
            setSelectedDrawerId(null);
            setSelectedDossierId(id);
          }}
        />
      )}

      {selectedDossierId && (
        <DossierModal
          projectId={selectedDossierId}
          projectSummary={dossierProjectSummary}
          onClose={() => setSelectedDossierId(null)}
        />
      )}

      {showAboutModal && (
        <AboutModal
          onClose={() => setShowAboutModal(false)}
          isBackendLive={isBackendLive}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
};

export default App;
