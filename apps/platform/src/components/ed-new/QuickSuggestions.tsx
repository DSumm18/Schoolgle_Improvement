/**
 * Quick Suggestions Component
 *
 * Context-aware suggestion pills based on current module.
 */

'use client';

import React from 'react';
import { useEd, getQuickSuggestions, getInspectionSuggestions } from './EdContext';

export interface QuickSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

export function QuickSuggestions({
  onSuggestionClick,
  className = '',
}: QuickSuggestionsProps) {
  const { currentModule, mode } = useEd();

  const suggestions = mode === 'inspection'
    ? getInspectionSuggestions()
    : getQuickSuggestions(currentModule);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`px-4 pb-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className={`
              text-xs px-3 py-1.5 rounded-full
              bg-slate-100 hover:bg-slate-200
              dark:bg-slate-700 dark:hover:bg-slate-600
              text-slate-700 dark:text-slate-200
              transition-colors duration-200
              font-medium
            `}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
