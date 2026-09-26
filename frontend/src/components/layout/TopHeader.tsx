import React from 'react';
import { Search, ChevronDown, Sun, Moon } from 'lucide-react';

interface TopHeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onActivateBottomSearch?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  theme,
  toggleTheme,
  searchQuery,
  onSearchChange,
  onActivateBottomSearch,
}) => {
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (onActivateBottomSearch) {
          onActivateBottomSearch();
        } else {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onActivateBottomSearch]);

  const handleActivate = () => {
    if (onActivateBottomSearch) {
      onActivateBottomSearch();
    }
  };

  return (
    <header className="top-header">
      <div className="top-header-left">
        <div className="global-search-container" onClick={handleActivate}>
          <Search size={18} className="global-search-icon" />
          <input 
            ref={searchInputRef}
            type="text" 
            className="global-search-input" 
            placeholder="Search projects, contractors, states, work description..." 
            value={searchQuery}
            onFocus={handleActivate}
            onClick={handleActivate}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onActivateBottomSearch?.();
            }}
          />
          <div className="global-search-shortcut" onClick={handleActivate}>
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
