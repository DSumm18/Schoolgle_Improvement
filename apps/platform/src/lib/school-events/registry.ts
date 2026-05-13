// ─── School Events Registry ───────────────────────────────────────────────────
// Single source of truth for all event types across the platform.
// Used for validation, display metadata, and AI categorisation.

export type SchoolEventCategory =
  | 'leadership'
  | 'curriculum'
  | 'pupil_support'
  | 'safeguarding'
  | 'finance'
  | 'intervention'
  | 'assessment'
  | 'data_quality'
  | 'staffing'
  | 'governance';

export type SchoolEventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type SchoolEventSource =
  | 'trust-assessor'
  | 'ofsted-readiness'
  | 'assessment-intelligence'
  | 'lesson-studio'
  | 'school-intelligence'
  | 'governance'
  | 'system'
  | 'manual';

export interface EventTypeDef {
  id: string;
  category: SchoolEventCategory;
  defaultSeverity: SchoolEventSeverity;
  label: string;
  description: string;
  icon: string; // Lucide icon name
}

// ─── Full Registry ─────────────────────────────────────────────────────────────

export const EVENT_TYPES: Record<string, EventTypeDef> = {

  // ── Trust Assessor ──────────────────────────────────────────────────────────

  'ta.forensic-finding': {
    id: 'ta.forensic-finding',
    category: 'data_quality',
    defaultSeverity: 'high',
    label: 'Forensic Finding',
    description: 'Demographic-adjusted analysis has identified a statistically significant discrepancy between reported attainment and the expected range given the school\'s cohort profile.',
    icon: 'SearchCode',
  },

  'ta.national-percentile': {
    id: 'ta.national-percentile',
    category: 'assessment',
    defaultSeverity: 'info',
    label: 'National Percentile Logged',
    description: 'The school\'s KS2 combined attainment has been ranked against all England schools using DfE published data. Percentile recorded for trend tracking.',
    icon: 'BarChart3',
  },

  'ta.predictive-accuracy-gap': {
    id: 'ta.predictive-accuracy-gap',
    category: 'data_quality',
    defaultSeverity: 'medium',
    label: 'Predictive Accuracy Gap',
    description: 'The school\'s current mid-year self-reported figure differs materially from its 3-year DfE average, indicating potential over- or under-assessment.',
    icon: 'TrendingUp',
  },

  'ta.research-kpi-failed': {
    id: 'ta.research-kpi-failed',
    category: 'assessment',
    defaultSeverity: 'high',
    label: 'Research KPI Failed',
    description: 'The school has not met a research-backed attainment benchmark from DfE or EEF published statistics, given its demographic profile.',
    icon: 'XCircle',
  },

  'ta.cohort-mismatch': {
    id: 'ta.cohort-mismatch',
    category: 'assessment',
    defaultSeverity: 'high',
    label: 'Cohort Mismatch Detected',
    description: 'Significant unexplained variation detected between year-group cohort sizes, suggesting possible data entry errors or unreported mid-year transfers.',
    icon: 'GitFork',
  },

  'ta.statistical-alert': {
    id: 'ta.statistical-alert',
    category: 'data_quality',
    defaultSeverity: 'medium',
    label: 'Statistical Impossibility',
    description: 'A data value has been flagged as statistically impossible or implausible — e.g. combined attainment exceeding subject components, or GD exceeding ARE.',
    icon: 'AlertTriangle',
  },

  'ta.eal-trajectory-concern': {
    id: 'ta.eal-trajectory-concern',
    category: 'pupil_support',
    defaultSeverity: 'medium',
    label: 'EAL Trajectory Concern',
    description: 'EAL pupils are showing a trajectory significantly below the national EAL cohort average, suggesting additional targeted support may be required.',
    icon: 'Languages',
  },

  'ta.demographic-expectation-breach': {
    id: 'ta.demographic-expectation-breach',
    category: 'assessment',
    defaultSeverity: 'high',
    label: 'Demographic Expectation Breach',
    description: 'Attainment in one or more year groups falls outside the statistically expected range once FSM, SEND, and EAL factors have been applied. This requires governor-level scrutiny.',
    icon: 'UserX',
  },

  // ── Ofsted Readiness ───────────────────────────────────────────────────────

  'ofsted.action-created': {
    id: 'ofsted.action-created',
    category: 'intervention',
    defaultSeverity: 'info',
    label: 'Improvement Action Created',
    description: 'A new school improvement action has been created in the Ofsted Readiness module and assigned an owner and target date.',
    icon: 'PlusCircle',
  },

  'ofsted.action-status-changed': {
    id: 'ofsted.action-status-changed',
    category: 'intervention',
    defaultSeverity: 'info',
    label: 'Action Status Changed',
    description: 'An existing improvement action has moved to a new status — e.g. from draft to in-progress, or from in-progress to complete.',
    icon: 'RefreshCw',
  },

  'ofsted.framework-rating-updated': {
    id: 'ofsted.framework-rating-updated',
    category: 'governance',
    defaultSeverity: 'info',
    label: 'Framework Rating Updated',
    description: 'A judgement area within the Ofsted EIF 2025 framework has been re-rated, reflecting new evidence or self-evaluation outcomes.',
    icon: 'Star',
  },

  'ofsted.evidence-added': {
    id: 'ofsted.evidence-added',
    category: 'intervention',
    defaultSeverity: 'low',
    label: 'Evidence Added',
    description: 'New evidence has been uploaded or linked to an Ofsted framework requirement, strengthening the school\'s readiness case.',
    icon: 'FileCheck',
  },

  'assessment.snapshot-locked': {
    id: 'assessment.snapshot-locked',
    category: 'assessment',
    defaultSeverity: 'info',
    label: 'Assessment Snapshot Locked',
    description: 'A teacher-locked assessment judgement snapshot has been added to the Assessment Intelligence spine.',
    icon: 'ClipboardCheck',
  },

  // ── Lesson Studio ──────────────────────────────────────────────────────────

  'lesson.observation-completed': {
    id: 'lesson.observation-completed',
    category: 'curriculum',
    defaultSeverity: 'info',
    label: 'Lesson Observation Completed',
    description: 'A structured lesson observation has been completed and feedback has been logged in Lesson Studio.',
    icon: 'Eye',
  },

  'lesson.intervention-launched': {
    id: 'lesson.intervention-launched',
    category: 'intervention',
    defaultSeverity: 'info',
    label: 'Classroom Intervention Launched',
    description: 'A targeted classroom intervention has been initiated through Lesson Studio, linked to identified attainment gaps.',
    icon: 'Rocket',
  },

  'lesson.quest-completed': {
    id: 'lesson.quest-completed',
    category: 'assessment',
    defaultSeverity: 'info',
    label: 'Quest Completed',
    description: 'A pupil or class has completed a learning quest in Lesson Studio, generating a new assessment data point.',
    icon: 'Trophy',
  },

  // ── DfE / System ──────────────────────────────────────────────────────────

  'dfe.ofsted-inspection-published': {
    id: 'dfe.ofsted-inspection-published',
    category: 'governance',
    defaultSeverity: 'info',
    label: 'Ofsted Inspection Published',
    description: 'A new Ofsted inspection report has been published for this school on the DfE / Ofsted website.',
    icon: 'BookOpen',
  },

  'dfe.academy-conversion': {
    id: 'dfe.academy-conversion',
    category: 'governance',
    defaultSeverity: 'info',
    label: 'Academy Conversion',
    description: 'The school has converted to academy status or changed MAT membership, as recorded in the DfE GIAS register.',
    icon: 'Building2',
  },

  'staff.absence-recorded': {
    id: 'staff.absence-recorded',
    category: 'staffing',
    defaultSeverity: 'low',
    label: 'Staff Absence Recorded',
    description: 'A staff absence has been recorded in the HR module, potentially affecting teaching cover.',
    icon: 'UserMinus',
  },

  'staff.leadership-change': {
    id: 'staff.leadership-change',
    category: 'leadership',
    defaultSeverity: 'medium',
    label: 'Leadership Change',
    description: 'A change in senior or middle leadership has been recorded, which may have implications for school improvement continuity.',
    icon: 'Users',
  },
};

// ─── Category display metadata ────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<SchoolEventCategory, {
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  leadership:   { bg: 'bg-violet-500/10', text: 'text-violet-500',  border: 'border-violet-500/30',  dot: 'bg-violet-500' },
  curriculum:   { bg: 'bg-pink-500/10',   text: 'text-pink-500',    border: 'border-pink-500/30',    dot: 'bg-pink-500' },
  pupil_support:{ bg: 'bg-cyan-500/10',   text: 'text-cyan-500',    border: 'border-cyan-500/30',    dot: 'bg-cyan-500' },
  safeguarding: { bg: 'bg-red-500/10',    text: 'text-red-500',     border: 'border-red-500/30',     dot: 'bg-red-500' },
  finance:      { bg: 'bg-amber-500/10',  text: 'text-amber-500',   border: 'border-amber-500/30',   dot: 'bg-amber-500' },
  intervention: { bg: 'bg-emerald-500/10',text: 'text-emerald-500', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  assessment:   { bg: 'bg-sky-500/10',    text: 'text-sky-500',     border: 'border-sky-500/30',     dot: 'bg-sky-500' },
  data_quality: { bg: 'bg-orange-500/10', text: 'text-orange-500',  border: 'border-orange-500/30',  dot: 'bg-orange-500' },
  staffing:     { bg: 'bg-indigo-500/10', text: 'text-indigo-500',  border: 'border-indigo-500/30',  dot: 'bg-indigo-500' },
  governance:   { bg: 'bg-purple-500/10', text: 'text-purple-500',  border: 'border-purple-500/30',  dot: 'bg-purple-500' },
};

export const SEVERITY_COLORS: Record<SchoolEventSeverity, {
  text: string;
  bg: string;
  border: string;
  label: string;
}> = {
  info:     { text: 'text-muted-foreground', bg: 'bg-muted',           border: 'border-border',          label: 'Info' },
  low:      { text: 'text-blue-500',         bg: 'bg-blue-500/10',     border: 'border-blue-500/30',     label: 'Low' },
  medium:   { text: 'text-amber-500',        bg: 'bg-amber-500/10',    border: 'border-amber-500/30',    label: 'Medium' },
  high:     { text: 'text-orange-500',       bg: 'bg-orange-500/10',   border: 'border-orange-500/30',   label: 'High' },
  critical: { text: 'text-red-500',          bg: 'bg-red-500/10',      border: 'border-red-500/30',      label: 'Critical' },
};

export const SOURCE_LABELS: Record<SchoolEventSource, string> = {
  'trust-assessor':     'Trust Assessor',
  'ofsted-readiness':   'Ofsted Readiness',
  'assessment-intelligence': 'Assessment Intelligence',
  'lesson-studio':      'Lesson Studio',
  'school-intelligence':'Intelligence',
  'governance':         'Governance',
  'system':             'System',
  'manual':             'Manual',
};

// ─── Runtime type guard ───────────────────────────────────────────────────────

export function isValidEventType(id: string): boolean {
  return id in EVENT_TYPES;
}

export function getEventType(id: string): EventTypeDef | null {
  return EVENT_TYPES[id] ?? null;
}
