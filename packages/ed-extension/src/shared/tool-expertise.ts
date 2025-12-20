// Tool expertise mapping for Ed's context
// Maps tool IDs to their expertise areas

export const TOOL_EXPERTISE: Record<string, string[]> = {
  'canva-edu': ['design templates', 'brand kit setup', 'student collaboration', 'classroom folders'],
  'google-workspace-edu': ['Google Classroom', 'Drive organization', 'admin console', 'student permissions'],
  'every-budget': ['budget forecasting', 'staffing costs', 'scenario planning', 'CFR codes'],
  'schoolbus': ['safeguarding', 'KCSIE', 'model policies', 'statutory compliance'],
  'widgit-online': ['symbol communication', 'visual timetables', 'social stories', 'SEND resources'],
  'immersive-reader': ['text-to-speech', 'line focus', 'syllable highlighting', 'translation'],
  'teachers-pet': ['curriculum resources', 'differentiated materials', 'display materials', 'planning'],
  'smartsurvey': ['survey design', 'GDPR compliance', 'data export', 'parent voice'],
  'tlp-templates': ['HR policies', 'employment contracts', 'absence management', 'grievance procedures'],
  'condition-survey': ['building conditions', 'DfE programmes', 'estates planning', 'maintenance'],
  'risk-assessment-tool': ['risk assessment', 'health and safety', 'school trips', 'event planning'],
  'analyse-school-performance': ['attainment data', 'progress measures', 'absence analysis', 'SEF writing'],
  
  // MIS systems
  'sims': ['pupil data', 'attendance', 'behaviour', 'assessment', 'reports'],
  'arbor': ['pupil management', 'attendance tracking', 'assessment', 'parent communication'],
  'bromcom': ['MIS', 'attendance', 'assessment', 'parent portal'],
  
  // Finance
  'ps-financials': ['budget management', 'purchase orders', 'invoicing', 'financial reporting'],
  'fms': ['financial management', 'budgeting', 'accounting'],
  
  // Safeguarding
  'cpoms': ['safeguarding', 'incident logging', 'welfare concerns', 'case management'],
  'myconcern': ['safeguarding', 'welfare tracking', 'early help'],
  
  // HR
  'every-hr': ['HR management', 'payroll', 'absence tracking', 'recruitment'],
  'key-hr': ['HR policies', 'employment contracts', 'procedures'],
  
  // Parents
  'parentpay': ['payment processing', 'parent accounts', 'meal bookings'],
  'parentmail': ['parent communication', 'messaging', 'notifications'],
  
  // Teaching
  'google-classroom': ['assignments', 'grading', 'student collaboration', 'classroom management'],
  'microsoft-teams': ['video calls', 'assignments', 'collaboration', 'meetings'],
};

/**
 * Get expertise for a tool by ID
 */
export function getToolExpertise(toolId: string): string[] {
  return TOOL_EXPERTISE[toolId.toLowerCase()] || ['general guidance', 'best practices'];
}


