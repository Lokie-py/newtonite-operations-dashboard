import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { WORK_ITEM_STATUS, WORK_ITEM_PRIORITY } from '../../utils/constants';
import { INITIAL_USERS, INITIAL_TEAMS } from '../../mock/initialData';
import { Button } from '../common/Button';

export function WorkItemFilters({
  filters,
  onFilterChange,
  onResetFilters,
  totalResults,
}) {
  const activeCount = Object.entries(filters).filter(
    ([k, v]) => v && k !== 'sortBy' && k !== 'sortOrder' && k !== 'page' && k !== 'pageSize'
  ).length;

  return (
    <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-subtle mb-4 space-y-3">
      {/* Top row: Search input + active filter summary */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search work items by title, ID, or keywords..."
            className="w-full text-xs pl-9 pr-8 py-2 rounded-md bg-slate-50/70 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="xs"
            icon={RotateCcw}
            onClick={onResetFilters}
            className="text-slate-600 hover:text-red-600 self-end sm:self-auto h-8 px-2.5"
          >
            Clear {activeCount} {activeCount === 1 ? 'filter' : 'filters'}
          </Button>
        )}
      </div>

      {/* Bottom row: Filter dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2.5 border-t border-slate-100">
        {/* Status Filter */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          >
            <option value="">All Statuses</option>
            {Object.values(WORK_ITEM_STATUS).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Priority
          </label>
          <select
            value={filters.priority || ''}
            onChange={(e) => onFilterChange('priority', e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          >
            <option value="">All Priorities</option>
            {Object.values(WORK_ITEM_PRIORITY).map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>
        </div>

        {/* Team Filter */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Team
          </label>
          <select
            value={filters.teamId || ''}
            onChange={(e) => onFilterChange('teamId', e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          >
            <option value="">All Teams</option>
            {INITIAL_TEAMS.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee Filter */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Assignee
          </label>
          <select
            value={filters.assigneeId || ''}
            onChange={(e) => onFilterChange('assigneeId', e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          >
            <option value="">All Assignees</option>
            {INITIAL_USERS.map((usr) => (
              <option key={usr.id} value={usr.id}>
                {usr.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
