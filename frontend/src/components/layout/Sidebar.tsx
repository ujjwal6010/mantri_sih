import React, { useState } from 'react';
import {
  Folder,
  BarChart2,
  Map,
  Shield,
  FileText,
  AlertCircle,
  Info,
  Settings,
  Landmark,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

type TabId = 'projects' | 'analytics' | 'map' | 'audit';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onOpenAbout: () => void;
  onOpenSettings: () => void;
}

interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  tab?: TabId;
  action?: () => void;
  badge?: {
    text: string;
    variant: 'new' | 'count';
  };
}

interface NavSection {
  title: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenAbout,
  onOpenSettings,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navSections: NavSection[] = [
    {
      title: 'MAIN',
      items: [
        { id: 'projects', label: 'Projects', icon: <Folder size={18} strokeWidth={1.9} />, tab: 'projects' },
        { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={18} strokeWidth={1.9} />, tab: 'analytics' },
        { id: 'map', label: 'GIS Risk Map', icon: <Map size={18} strokeWidth={1.9} />, tab: 'map' },
        { id: 'audit', label: 'Audit Trail', icon: <Shield size={18} strokeWidth={1.9} />, tab: 'audit' },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        {
          id: 'reports',
          label: 'Reports',
          icon: <FileText size={18} strokeWidth={1.9} />,
          action: () => onTabChange('analytics'),
          badge: { text: 'New', variant: 'new' },
        },
        {
          id: 'alerts',
          label: 'Alerts',
          icon: <AlertCircle size={18} strokeWidth={1.9} />,
          action: () => onTabChange('audit'),
          badge: { text: '4', variant: 'count' },
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'about', label: 'About', icon: <Info size={18} strokeWidth={1.9} />, action: onOpenAbout },
        { id: 'settings', label: 'Data & Settings', icon: <Settings size={18} strokeWidth={1.9} />, action: onOpenSettings },
      ],
    },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        {isCollapsed ? (
          <button
            className="sidebar-brand-icon-btn"
            onClick={() => setIsCollapsed(false)}
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <Landmark size={18} className="brand-icon-default" />
            <PanelLeftOpen size={18} strokeWidth={2} className="brand-icon-hover" />
          </button>
        ) : (
          <div className="sidebar-brand-content">
            <div className="sidebar-brand-main">
              <div className="sidebar-brand-icon">
                <Landmark size={18} />
              </div>
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-title">MANTRI DRISHTI</span>
                <span className="sidebar-brand-sub">AI Flags. AI Explains. Humans Verify.</span>
              </div>
            </div>
            <button
              className="sidebar-collapse-btn"
              onClick={() => setIsCollapsed(true)}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={16} strokeWidth={1.9} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title} className="sidebar-nav-section">
            {!isCollapsed && <span className="sidebar-nav-label">{section.title}</span>}
            {section.items.map((item) => {
              const isActive = item.tab ? activeTab === item.tab : false;
              return (
                <button
                  key={item.id}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.tab) {
                      onTabChange(item.tab);
                    }
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  {!isCollapsed && <span className="sidebar-nav-text">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span className={`nav-badge ${item.badge.variant}`}>{item.badge.text}</span>
                  )}
                  {!isCollapsed && isActive && (
                    <ChevronRight size={14} className="nav-active-chevron" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Area: Editorial Quote & Profile Control */}
      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="sidebar-quote-card">
            <div className="quote-accent-bar" />
            <div className="quote-text-group">
              <span className="quote-heading">Transparent Development.</span>
              <span className="quote-subheading">Stronger Democracy.</span>
            </div>
          </div>
        )}

        <div
          className="sidebar-user-profile"
          role="button"
          tabIndex={0}
          onClick={onOpenSettings}
          title={isCollapsed ? 'Admin - Investigator' : undefined}
        >
          <div className="user-avatar-circle">
            <span className="user-avatar-text">AD</span>
          </div>
          {!isCollapsed && (
            <>
              <div className="user-info">
                <span className="user-name">Admin</span>
                <span className="user-role">Investigator</span>
              </div>
              <ChevronDown size={14} className="user-profile-chevron" />
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
