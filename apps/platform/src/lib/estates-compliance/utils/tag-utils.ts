/**
 * Tag utilities for custom checks
 */

/**
 * Common tags for custom checks
 */
export const COMMON_TAGS = [
  'safety',
  'security',
  'daily',
  'weekly',
  'monthly',
  'inspection',
  'maintenance',
  'testing',
  'monitoring',
  'audit',
  'premises',
  'playground',
  'kitchen',
  'science',
  'design-tech',
  'pool',
  'vehicle',
  'minibus',
  'first-aid',
  'fire',
  'electrical',
  'gas',
  'water',
  'winter',
  'summer',
  'holiday',
  'termly',
  'field',
  'forest-school',
  'outdoor',
  'learning',
  'high-risk',
  'low-risk',
  'contractor',
  'internal',
  'staff',
  'volunteer',
];

/**
 * Tag categories with their associated tags
 */
export const TAG_CATEGORIES = {
  frequency: ['daily', 'weekly', 'monthly', 'quarterly', 'termly', 'annually', 'ad-hoc'],
  location: ['premises', 'kitchen', 'science', 'design-tech', 'playground', 'field', 'forest-school', 'pool', 'outdoor'],
  domain: ['safety', 'security', 'fire', 'electrical', 'gas', 'water', 'first-aid'],
  type: ['inspection', 'maintenance', 'testing', 'monitoring', 'audit', 'check'],
  risk: ['high-risk', 'low-risk', 'critical'],
  assignment: ['contractor', 'internal', 'staff', 'volunteer'],
  seasonal: ['winter', 'summer', 'holiday'],
};

/**
 * Get suggested tags based on check properties
 */
export function getSuggestedTags(properties: {
  domain?: string;
  frequency?: string;
  name?: string;
  description?: string;
}): string[] {
  const suggestions: string[] = [];

  // Add frequency tag
  if (properties.frequency && TAG_CATEGORIES.frequency.includes(properties.frequency)) {
    suggestions.push(properties.frequency);
  }

  // Add domain tag if applicable
  if (properties.domain) {
    const domainTag = TAG_CATEGORIES.domain.find(t => t.includes(properties.domain!));
    if (domainTag) {
      suggestions.push(domainTag);
    }
  }

  // Analyze name and description for keywords
  const text = `${properties.name || ''} ${properties.description || ''}`.toLowerCase();

  // Location-based suggestions
  for (const tag of TAG_CATEGORIES.location) {
    if (text.includes(tag.replace('-', ' ')) || text.includes(tag)) {
      suggestions.push(tag);
    }
  }

  // Type-based suggestions
  for (const tag of TAG_CATEGORIES.type) {
    if (text.includes(tag)) {
      suggestions.push(tag);
    }
  }

  return [...new Set(suggestions)]; // Remove duplicates
}

/**
 * Validate a tag string
 */
export function isValidTag(tag: string): boolean {
  const trimmed = tag.trim().toLowerCase();
  return trimmed.length > 0 && trimmed.length <= 30 && /^[a-z0-9-]+$/.test(trimmed);
}

/**
 * Normalize a tag (lowercase, trim, validate)
 */
export function normalizeTag(tag: string): string | null {
  const normalized = tag.trim().toLowerCase();
  if (!isValidTag(normalized)) {
    return null;
  }
  return normalized;
}

/**
 * Get tag color for display
 */
export function getTagColor(tag: string): string {
  const colors: Record<string, string> = {
    safety: 'bg-rose-100 text-rose-700',
    security: 'bg-blue-100 text-blue-700',
    fire: 'bg-orange-100 text-orange-700',
    electrical: 'bg-yellow-100 text-yellow-700',
    gas: 'bg-purple-100 text-purple-700',
    water: 'bg-cyan-100 text-cyan-700',
    'first-aid': 'bg-green-100 text-green-700',
    daily: 'bg-slate-100 text-slate-700',
    weekly: 'bg-slate-200 text-slate-700',
    monthly: 'bg-slate-300 text-slate-700',
    'high-risk': 'bg-red-100 text-red-700',
    'low-risk': 'bg-emerald-100 text-emerald-700',
    critical: 'bg-red-100 text-red-700',
  };

  return colors[tag] || 'bg-gray-100 text-gray-700';
}
