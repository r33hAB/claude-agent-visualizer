import { useState } from 'react';
import { AgentCategory, ALL_CATEGORIES } from '../types/agent';

interface ControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFilterChange: (categories: Set<AgentCategory>) => void;
}

const CATEGORY_COLORS: Record<AgentCategory, string> = {
  [AgentCategory.Coder]: 'bg-blue-400',
  [AgentCategory.Reviewer]: 'bg-amber-400',
  [AgentCategory.Planner]: 'bg-purple-400',
  [AgentCategory.Security]: 'bg-red-400',
  [AgentCategory.Researcher]: 'bg-emerald-400',
  [AgentCategory.Coordinator]: 'bg-pink-400',
  [AgentCategory.Tester]: 'bg-teal-400',
  [AgentCategory.DevOps]: 'bg-orange-400',
  [AgentCategory.Debugger]: 'bg-indigo-400',
  [AgentCategory.Designer]: 'bg-fuchsia-400',
};

const CATEGORY_LABELS: Record<AgentCategory, string> = {
  [AgentCategory.Coder]: 'Coder',
  [AgentCategory.Reviewer]: 'Reviewer',
  [AgentCategory.Planner]: 'Planner',
  [AgentCategory.Security]: 'Security',
  [AgentCategory.Researcher]: 'Researcher',
  [AgentCategory.Coordinator]: 'Coordinator',
  [AgentCategory.Tester]: 'Tester',
  [AgentCategory.DevOps]: 'DevOps',
  [AgentCategory.Debugger]: 'Debugger',
  [AgentCategory.Designer]: 'Designer',
};

export default function Controls({ onZoomIn, onZoomOut, onResetView, onFilterChange }: ControlsProps) {
  const [activeFilters, setActiveFilters] = useState<Set<AgentCategory>>(
    () => new Set(ALL_CATEGORIES),
  );
  const [showFilters, setShowFilters] = useState(false);

  const handleToggle = (category: AgentCategory) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      onFilterChange(next);
      return next;
    });
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col gap-2">
      {/* Filter panel */}
      {showFilters && (
        <div className="bg-lab-panel/90 backdrop-blur-md border border-lab-border rounded-lg p-3 mb-1">
          <div className="space-y-1.5">
            {ALL_CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-white transition-colors"
              >
                <input
                  type="checkbox"
                  checked={activeFilters.has(cat)}
                  onChange={() => handleToggle(cat)}
                  className="sr-only"
                />
                <span
                  className={`w-3 h-3 rounded-sm border border-lab-border flex items-center justify-center ${
                    activeFilters.has(cat) ? 'bg-lab-accent' : 'bg-transparent'
                  }`}
                >
                  {activeFilters.has(cat) && (
                    <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat]}`} />
                <span>{CATEGORY_LABELS[cat]}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Filter toggle button */}
      <button
        onClick={() => setShowFilters((v) => !v)}
        className="bg-lab-panel/90 backdrop-blur-md border border-lab-border rounded-lg px-3 py-1.5 text-[10px] text-gray-300 hover:text-white transition-colors font-medium tracking-wide"
      >
        Filter ({activeFilters.size}/{ALL_CATEGORIES.length})
      </button>

      {/* Zoom controls */}
      <div className="flex gap-1">
        <button
          onClick={onZoomIn}
          className="bg-lab-panel/90 backdrop-blur-md border border-lab-border rounded-lg w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm font-bold"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={onZoomOut}
          className="bg-lab-panel/90 backdrop-blur-md border border-lab-border rounded-lg w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm font-bold"
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          onClick={onResetView}
          className="bg-lab-panel/90 backdrop-blur-md border border-lab-border rounded-lg px-2 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-[10px] font-medium tracking-wide"
          aria-label="Reset view"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
