export const CONSUMER_DEPENDENCIES: Record<string, string[]> = {
  'ofsted-readiness': [
    'dfe-attendance', 'dfe-ks2-results', 'dfe-census', 'dfe-workforce',
    'dfe-exclusions', 'dfe-ks4-results', 'google-drive', 'contextual-factors',
  ],
  'ofsted-readiness/attendance-behaviour': [
    'dfe-attendance', 'dfe-exclusions', 'live-attendance',
    'contextual-factors', 'google-drive',
  ],
  'ofsted-readiness/achievement': [
    'dfe-ks2-results', 'dfe-ks4-results', 'live-assessments',
    'contextual-factors', 'google-drive',
  ],
  'ofsted-readiness/inclusion': [
    'dfe-census', 'contextual-factors', 'google-drive',
  ],
  'ofsted-readiness/leadership': [
    'dfe-workforce', 'google-drive', 'contextual-factors',
  ],
  'school-intelligence': [
    'dfe-attendance', 'dfe-ks2-results', 'dfe-census', 'dfe-workforce',
    'dfe-exclusions', 'dfe-ks4-results', 'eef-research',
    'contextual-factors', 'live-attendance', 'live-assessments',
  ],
  'living-sef': [
    'dfe-attendance', 'dfe-ks2-results', 'dfe-census', 'dfe-workforce',
    'dfe-exclusions', 'google-drive', 'contextual-factors', 'schoolgle-intelligence',
  ],
  'estates-compliance': [
    'google-drive',
  ],
  'send-hub': [
    'dfe-census', 'live-assessments', 'la-send-portal',
  ],
  'actions-hub': [
    'eef-research',
  ],
};
