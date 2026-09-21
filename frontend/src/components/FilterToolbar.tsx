import React from 'react';
import { Search, ChevronDown, Filter } from 'lucide-react';
import type { RiskBand } from '../types/project';

interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedState: string;
  onStateChange: (st: string) => void;
  selectedWorkType: string;
  onWorkTypeChange: (wt: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  onReset: () => void;
  totalFiltered: number;
  totalProjects: number;
  selectedRiskBand: RiskBand;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedState,
  onStateChange,
  selectedWorkType,
  onWorkTypeChange,
  sortBy,
  onSortByChange,
  selectedRiskBand,
}) => {
  return (
    <div className="table-filter-toolbar">
      <div className="filter-search-box">
        <Search size={16} className="filter-search-icon" />
        <input
          type="text"
          placeholder="Search by ID, contractor, work description, constituency..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filter-dropdowns">
        <div className="filter-field">
          <label>State</label>
          <div className="select-wrapper">
            <select value={selectedState} onChange={(e) => onStateChange(e.target.value)}>
              <option value="All States">All States</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>
        </div>

        <div className="filter-field">
          <label>Sector</label>
          <div className="select-wrapper">
            <select value={selectedWorkType} onChange={(e) => onWorkTypeChange(e.target.value)}>
              <option value="All Sectors">All Sectors</option>
              <option value="Road Construction">Road Construction</option>
              <option value="Drinking Water Supply">Drinking Water Supply</option>
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>
        </div>

        <div className="filter-field">
          <label>Risk Range</label>
          <div className="select-wrapper">
            <select value={selectedRiskBand} onChange={(e) => onSortByChange(e.target.value)}>
              <option value="all">All Levels</option>
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>
        </div>

        <div className="filter-field">
          <label>Sort By</label>
          <div className="select-wrapper">
            <select value={sortBy} onChange={(e) => onSortByChange(e.target.value)}>
              <option value="risk">Highest Risk First</option>
              <option value="risk_asc">Lowest Risk First</option>
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>
        </div>

        <button className="filter-action-btn">
          <Filter size={14} />
          <span>Filters</span>
          <span className="filter-badge">0</span>
        </button>
      </div>
    </div>
  );
};
