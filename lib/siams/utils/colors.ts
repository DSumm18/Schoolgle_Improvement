// Color utilities for SIAMS categories

const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f97316', // orange
];

export const getCategoryColor = (index: number): string => {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
};

export const getRatingColor = (score: number): string => {
  if (score >= 90) return '#10b981'; // green - Advanced
  if (score >= 65) return '#3b82f6'; // blue - Fully Effective
  if (score >= 40) return '#f59e0b'; // amber - Transitioning
  return '#ef4444'; // red - Baseline
};

export const getRatingLabel = (score: number): string => {
  if (score >= 90) return 'Advanced';
  if (score >= 65) return 'Fully Effective';
  if (score >= 40) return 'Transitioning';
  if (score >= 20) return 'Baseline';
  return 'Not Rated';
};

export const getRatingBgClass = (rating: string): string => {
  const r = rating.toUpperCase();
  if (r === 'ADVANCED') return 'bg-green-500/20 text-green-400 dark:bg-green-500/20 dark:text-green-400';
  if (r === 'FULLY EFFECTIVE') return 'bg-blue-500/20 text-blue-400 dark:bg-blue-500/20 dark:text-blue-400';
  if (r === 'TRANSITIONING') return 'bg-amber-500/20 text-amber-400 dark:bg-amber-500/20 dark:text-amber-400';
  if (r === 'BASELINE') return 'bg-red-500/20 text-red-400 dark:bg-red-500/20 dark:text-red-400';
  return 'bg-gray-500/20 text-gray-400 dark:bg-gray-500/20 dark:text-gray-400';
};
