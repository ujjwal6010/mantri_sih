import React from 'react';
import { Search, MapPin, ChevronDown, Sun, Moon } from 'lucide-react';

interface TopHeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  selectedState: string;
  onStateChange: (state: string) => void;
}

const STATES = [
  'All States',
  'Rajasthan',
  'Maharashtra',
  'Uttar Pradesh',
  'Tamil Nadu',
  'Karnataka',
  'Madhya Pradesh',
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  theme,
  toggleTheme,
  selectedState,
  onStateChange,
}) => {
  return (
    <header className="top-header">
      <div className="top-header-left">
        <div className="global-search-container">
          <Search size={18} className="global-search-icon" />
          <input 
            type="text" 
            className="global-search-input" 
            placeholder="Search projects, contractors, states, work description..." 
          />
          <div className="global-search-shortcut">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </div>
      </div>

      <div className="top-header-right">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>


        {/* User Profile */}
        <div className="header-user-profile">
          <div className="user-avatar-circle">
            <span className="user-avatar-text">AD</span>
          </div>
          <div className="user-info">
            <span className="user-name">Admin</span>
            <span className="user-role">Investigator</span>
          </div>
          <ChevronDown size={14} className="user-chevron" />
        </div>
      </div>
    </header>
  );
};
