import React from 'react';
import {
  Folder,
  Map,
  BadgeIcon,
  FileText,
  Settings,
  Landmark,
  Shield,
} from 'lucide-react';

type TabId = 'projects' | 'analytics' | 'map' | 'audit';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onOpenAbout: () => void;
  onOpenSettings: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  tab?: TabId;
  action?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenAbout,
  onOpenSettings,
}) => {
  const mainNavItems: NavItem[] = [
    { id: 'projects', label: 'Projects', icon: <Folder size={18} />, tab: 'projects' },
    { id: 'analytics', label: 'Analytics', icon: <Landmark size={18} />, tab: 'analytics' },
    { id: 'map', label: 'GIS Risk Map', icon: <Map size={18} />, tab: 'map' },
    { id: 'audit', label: 'Audit Trail', icon: <Shield size={18} />, tab: 'audit' },
  ];

  const bottomNavItems: NavItem[] = [
    { id: 'reports', label: 'About', icon: <FileText size={18} />, action: onOpenAbout },
    { id: 'settings', label: 'Data & Settings', icon: <Settings size={18} />, action: onOpenSettings },
  ];

  const renderNavList = (items: NavItem[]) => (
    <div className="sidebar-nav-section">
      {items.map((item) => {
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
            style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-text">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Landmark size={20} />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-title">MANTRI DRISHTI</span>
          <span className="sidebar-brand-sub">AI Flags. AI Explains. Humans Verify.</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {renderNavList(mainNavItems)}
        
        <div className="sidebar-divider" />
        
        {renderNavList(bottomNavItems)}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-quote-block">
          <span className="quote-mark">“</span>
          <p className="quote-main">Transparent Development.<br/>Stronger Democracy.</p>
        </div>
      </div>
    </aside>
  );
};
