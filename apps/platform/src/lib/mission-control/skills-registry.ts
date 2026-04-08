// Mission Control — Static Skills Registry
// Derived from the Schoolgle Skills Framework and existing codebase
// Phase 1: Static list for display. Phase 2: Database-driven with execution.

export type SkillType = 'advisor' | 'worker' | 'monitor' | 'analyst' | 'generator';
export type SkillApprovalMode = 'auto' | 'human_review' | 'human_approval';
export type SkillStatus = 'active' | 'inactive' | 'not_yet_built' | 'deprecated';

export interface SkillDefinition {
  id: string;
  name: string;
  department: string;
  type: SkillType;
  approvalMode: SkillApprovalMode;
  status: SkillStatus;
  description: string;
  lastExecution?: string;
}

// Departments matching the 7-planet model + internal ops
export const DEPARTMENTS = [
  { id: 'school-improvement', name: 'School Improvement', color: '#6B7280', planet: 'Mercury' },
  { id: 'governance', name: 'Governance', color: '#F59E0B', planet: 'Venus' },
  { id: 'business-ops', name: 'Business Operations', color: '#3B82F6', planet: 'Earth' },
  { id: 'compliance', name: 'Compliance & Safeguarding', color: '#9F1239', planet: 'Mars' },
  { id: 'communications', name: 'Communications', color: '#F97316', planet: 'Jupiter' },
  { id: 'intelligence', name: 'Intelligence', color: '#A78BFA', planet: 'Saturn' },
  { id: 'teaching', name: 'Teaching & Learning', color: '#06B6D4', planet: 'Uranus' },
  { id: 'internal', name: 'Internal Ops (Mission Control)', color: '#64748B', planet: 'N/A' },
] as const;

/**
 * Complete skills registry — 110 skills across all departments.
 * Status reflects what is actually built vs planned.
 */
export const SKILLS_REGISTRY: SkillDefinition[] = [
  // ═══════════════════════════════════════════════════════════════
  // SCHOOL IMPROVEMENT (Mercury) — 15 skills
  // ═══════════════════════════════════════════════════════════════
  { id: 'si-ofsted-readiness', name: 'Ofsted Readiness Analyser', department: 'school-improvement', type: 'analyst', approvalMode: 'auto', status: 'active', description: 'Analyse evidence against Ofsted framework and generate readiness scores' },
  { id: 'si-sef-generator', name: 'Living SEF Generator', department: 'school-improvement', type: 'generator', approvalMode: 'human_review', status: 'active', description: 'Auto-generate self-evaluation form from collected evidence' },
  { id: 'si-evidence-matcher', name: 'AI Evidence Matcher', department: 'school-improvement', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Match uploaded documents to framework requirements using AI' },
  { id: 'si-sdp-tracker', name: 'SDP Progress Tracker', department: 'school-improvement', type: 'monitor', approvalMode: 'auto', status: 'active', description: 'Track school development plan priorities and milestones' },
  { id: 'si-siams-assessor', name: 'SIAMS Framework Assessor', department: 'school-improvement', type: 'analyst', approvalMode: 'auto', status: 'active', description: 'Assess evidence against SIAMS inspection framework for church schools' },
  { id: 'si-deep-dive-prep', name: 'Deep Dive Preparation', department: 'school-improvement', type: 'generator', approvalMode: 'human_review', status: 'not_yet_built', description: 'Generate subject-specific deep dive preparation packs' },
  { id: 'si-evidence-gap', name: 'Evidence Gap Identifier', department: 'school-improvement', type: 'analyst', approvalMode: 'auto', status: 'active', description: 'Identify missing evidence across framework requirements' },
  { id: 'si-mock-inspector', name: 'AI Mock Inspector', department: 'school-improvement', type: 'advisor', approvalMode: 'auto', status: 'active', description: 'Simulate Ofsted inspection conversations and questioning' },
  { id: 'si-doc-scanner', name: 'Cloud Document Scanner', department: 'school-improvement', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Scan Google Drive/OneDrive for evidence documents' },
  { id: 'si-quality-assurer', name: 'Evidence Quality Assurer', department: 'school-improvement', type: 'analyst', approvalMode: 'auto', status: 'not_yet_built', description: 'Rate evidence quality and suggest improvements' },
  { id: 'si-action-tracker', name: 'Action Plan Tracker', department: 'school-improvement', type: 'monitor', approvalMode: 'auto', status: 'active', description: 'Track improvement actions with EEF research backing' },
  { id: 'si-lesson-observer', name: 'Lesson Observation Summariser', department: 'school-improvement', type: 'generator', approvalMode: 'human_review', status: 'not_yet_built', description: 'Summarise and analyse lesson observation notes' },
  { id: 'si-governor-report', name: 'Governor Report Generator', department: 'school-improvement', type: 'generator', approvalMode: 'human_approval', status: 'not_yet_built', description: 'Generate headteacher reports for governor meetings' },
  { id: 'si-benchmark', name: 'School Benchmarker', department: 'school-improvement', type: 'analyst', approvalMode: 'auto', status: 'not_yet_built', description: 'Benchmark school performance against similar schools' },
  { id: 'si-inspection-logger', name: 'Inspection Day Logger', department: 'school-improvement', type: 'worker', approvalMode: 'auto', status: 'not_yet_built', description: 'Real-time logging during Ofsted inspection visits' },

  // ═══════════════════════════════════════════════════════════════
  // GOVERNANCE (Venus) — 12 skills
  // ═══════════════════════════════════════════════════════════════
  { id: 'gov-board-manager', name: 'Board Meeting Manager', department: 'governance', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Schedule meetings, generate agendas, track attendance' },
  { id: 'gov-training-tracker', name: 'Governor Training Tracker', department: 'governance', type: 'monitor', approvalMode: 'auto', status: 'active', description: 'Track governor training requirements and expiry dates' },
  { id: 'gov-policy-manager', name: 'Policy Review Manager', department: 'governance', type: 'monitor', approvalMode: 'auto', status: 'active', description: 'Track policy review cycles and flag overdue policies' },
  { id: 'gov-visit-reporter', name: 'Governor Visit Reporter', department: 'governance', type: 'generator', approvalMode: 'human_review', status: 'active', description: 'Generate structured reports from governor monitoring visits' },
  { id: 'gov-skills-auditor', name: 'Skills Audit Analyser', department: 'governance', type: 'analyst', approvalMode: 'auto', status: 'not_yet_built', description: 'Analyse governor skills matrix and identify recruitment gaps' },
  { id: 'gov-compliance-checker', name: 'Governance Compliance Checker', department: 'governance', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Check compliance with governance code and regulations' },
  { id: 'gov-succession-planner', name: 'Succession Planner', department: 'governance', type: 'advisor', approvalMode: 'human_review', status: 'not_yet_built', description: 'Identify governance succession risks and plan transitions' },
  { id: 'gov-minute-taker', name: 'AI Minute Taker', department: 'governance', type: 'generator', approvalMode: 'human_approval', status: 'not_yet_built', description: 'Generate meeting minutes from audio or notes' },
  { id: 'gov-question-bank', name: 'Governor Question Bank', department: 'governance', type: 'advisor', approvalMode: 'auto', status: 'not_yet_built', description: 'Suggest challenging questions for governors based on school data' },
  { id: 'gov-pecuniary', name: 'Pecuniary Interest Tracker', department: 'governance', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Track and flag pecuniary interest declarations' },
  { id: 'gov-recruitment', name: 'Governor Recruitment Assistant', department: 'governance', type: 'advisor', approvalMode: 'human_review', status: 'not_yet_built', description: 'Identify skills gaps and assist with governor recruitment' },
  { id: 'gov-annual-report', name: 'Annual Governance Report', department: 'governance', type: 'generator', approvalMode: 'human_approval', status: 'not_yet_built', description: 'Generate annual governance statement and report' },

  // ═══════════════════════════════════════════════════════════════
  // BUSINESS OPERATIONS (Earth) — 18 skills
  // ═══════════════════════════════════════════════════════════════
  { id: 'ops-staff-directory', name: 'Staff Directory Manager', department: 'business-ops', type: 'worker', approvalMode: 'auto', status: 'active', description: 'CRUD operations for staff records with CSV import/export' },
  { id: 'ops-estates-supervisor', name: 'Estates Supervisor', department: 'business-ops', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Manage helpdesk tickets, contractors, and compliance tasks' },
  { id: 'ops-legionella', name: 'Legionella Compliance Monitor', department: 'business-ops', type: 'monitor', approvalMode: 'auto', status: 'active', description: 'Track legionella testing schedules and compliance' },
  { id: 'ops-helpdesk', name: 'Helpdesk Ticket Manager', department: 'business-ops', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Create and manage maintenance helpdesk tickets' },
  { id: 'ops-contractor', name: 'Contractor Manager', department: 'business-ops', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Manage contractor records, certifications, and access' },
  { id: 'ops-asset-register', name: 'Asset Register Manager', department: 'business-ops', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Track school assets with location and maintenance schedules' },
  { id: 'ops-budget-tracker', name: 'Budget Tracker', department: 'business-ops', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Track spending against budget with alerts for overspend' },
  { id: 'ops-procurement', name: 'Procurement Assistant', department: 'business-ops', type: 'advisor', approvalMode: 'human_approval', status: 'not_yet_built', description: 'Guide procurement processes and framework compliance' },
  { id: 'ops-hr-sickness', name: 'Sickness Absence Tracker', department: 'business-ops', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Track sickness absence patterns and trigger Bradford Factor alerts' },
  { id: 'ops-hr-performance', name: 'Performance Management Tracker', department: 'business-ops', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Track appraisal cycles, objectives, and professional development' },
  { id: 'ops-payroll-checker', name: 'Payroll Reconciliation', department: 'business-ops', type: 'analyst', approvalMode: 'human_review', status: 'not_yet_built', description: 'Reconcile payroll against staffing records and budgets' },
  { id: 'ops-energy-monitor', name: 'Energy Usage Monitor', department: 'business-ops', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Track energy consumption and identify cost-saving opportunities' },
  { id: 'ops-space-planner', name: 'Space & Room Planner', department: 'business-ops', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Manage room bookings and spatial floor plan data' },
  { id: 'ops-invoice-processor', name: 'Invoice Processor', department: 'business-ops', type: 'worker', approvalMode: 'human_approval', status: 'not_yet_built', description: 'Extract and process invoice data with PO matching' },
  { id: 'ops-contract-manager', name: 'Contract Lifecycle Manager', department: 'business-ops', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Track contract renewals, terms, and expiry dates' },
  { id: 'ops-staff-connector', name: 'Staff Connector Engine', department: 'business-ops', type: 'worker', approvalMode: 'auto', status: 'not_yet_built', description: 'Track staff responsibilities, statutory roles, and handover' },
  { id: 'ops-fire-safety', name: 'Fire Safety Manager', department: 'business-ops', type: 'monitor', approvalMode: 'auto', status: 'active', description: 'Track fire safety compliance, drills, and equipment checks' },
  { id: 'ops-lettings', name: 'Lettings Manager', department: 'business-ops', type: 'worker', approvalMode: 'auto', status: 'not_yet_built', description: 'Manage school premises lettings and income tracking' },

  // ═══════════════════════════════════════════════════════════════
  // COMPLIANCE & SAFEGUARDING (Mars) — 16 skills
  // ═══════════════════════════════════════════════════════════════
  { id: 'comp-scr-manager', name: 'Single Central Record Manager', department: 'compliance', type: 'monitor', approvalMode: 'auto', status: 'active', description: 'Track SCR compliance for all staff vetting checks' },
  { id: 'comp-gdpr-tracker', name: 'GDPR Compliance Tracker', department: 'compliance', type: 'monitor', approvalMode: 'auto', status: 'active', description: 'Track GDPR compliance, data audits, and breach reporting' },
  { id: 'comp-policy-reviewer', name: 'Policy Review Scheduler', department: 'compliance', type: 'monitor', approvalMode: 'auto', status: 'active', description: 'Schedule and track statutory policy reviews' },
  { id: 'comp-training-matrix', name: 'Training Compliance Matrix', department: 'compliance', type: 'monitor', approvalMode: 'auto', status: 'active', description: 'Track mandatory training completion across all staff' },
  { id: 'comp-complaints', name: 'Complaints Handler', department: 'compliance', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Log and track complaints through resolution stages' },
  { id: 'comp-risk-register', name: 'Risk Register Manager', department: 'compliance', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Manage risk register with 5x5 scoring and mitigations' },
  { id: 'comp-safeguarding', name: 'Safeguarding Monitor', department: 'compliance', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Track safeguarding training, CPOMS referrals, and Section 175 audits' },
  { id: 'comp-health-safety', name: 'Health & Safety Auditor', department: 'compliance', type: 'analyst', approvalMode: 'auto', status: 'not_yet_built', description: 'Run H&S compliance checks and generate action plans' },
  { id: 'comp-accessibility', name: 'Accessibility Compliance', department: 'compliance', type: 'analyst', approvalMode: 'auto', status: 'not_yet_built', description: 'Track accessibility plan compliance and DDA requirements' },
  { id: 'comp-dfe-returns', name: 'DfE Returns Assistant', department: 'compliance', type: 'worker', approvalMode: 'human_review', status: 'not_yet_built', description: 'Assist with census, workforce, and other statutory returns' },
  { id: 'comp-ico-checker', name: 'ICO Registration Checker', department: 'compliance', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Verify ICO registration status and renewal dates' },
  { id: 'comp-prevent', name: 'Prevent Duty Monitor', department: 'compliance', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Track Prevent duty training and risk assessments' },
  { id: 'comp-asbestos', name: 'Asbestos Management Monitor', department: 'compliance', type: 'monitor', approvalMode: 'auto', status: 'active', description: 'Track asbestos survey compliance and management plan' },
  { id: 'comp-coshh', name: 'COSHH Register Manager', department: 'compliance', type: 'worker', approvalMode: 'auto', status: 'not_yet_built', description: 'Manage COSHH assessments and chemical inventory' },
  { id: 'comp-website-checker', name: 'Website Compliance Checker', department: 'compliance', type: 'analyst', approvalMode: 'auto', status: 'active', description: 'Scan school website for DfE statutory content compliance' },
  { id: 'comp-audit-trail', name: 'Compliance Audit Trail', department: 'compliance', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Maintain complete audit trail for all compliance activities' },

  // ═══════════════════════════════════════════════════════════════
  // COMMUNICATIONS (Jupiter) — 15 skills
  // ═══════════════════════════════════════════════════════════════
  { id: 'comms-newsletter', name: 'Newsletter Generator', department: 'communications', type: 'generator', approvalMode: 'human_approval', status: 'active', description: 'Generate school newsletters from events, news, and data' },
  { id: 'comms-social-drafter', name: 'Social Media Drafter', department: 'communications', type: 'generator', approvalMode: 'human_approval', status: 'not_yet_built', description: 'Draft social media posts for school channels' },
  { id: 'comms-facebook-monitor', name: 'Facebook Page Monitor', department: 'communications', type: 'monitor', approvalMode: 'human_review', status: 'not_yet_built', description: 'Monitor school Facebook page for comments and messages' },
  { id: 'comms-parent-letter', name: 'Parent Letter Generator', department: 'communications', type: 'generator', approvalMode: 'human_approval', status: 'active', description: 'Generate formatted parent letters and communications' },
  { id: 'comms-website-publisher', name: 'Website Content Publisher', department: 'communications', type: 'worker', approvalMode: 'human_review', status: 'active', description: 'Publish and manage school website content' },
  { id: 'comms-crisis', name: 'Crisis Communication Helper', department: 'communications', type: 'advisor', approvalMode: 'human_approval', status: 'not_yet_built', description: 'Generate crisis communication templates and response plans' },
  { id: 'comms-survey-builder', name: 'Survey Builder', department: 'communications', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Create and distribute surveys to parents and staff' },
  { id: 'comms-survey-analyser', name: 'Survey Response Analyser', department: 'communications', type: 'analyst', approvalMode: 'auto', status: 'active', description: 'Analyse survey responses with sentiment and themes' },
  { id: 'comms-email-drafter', name: 'Email Draft Generator', department: 'communications', type: 'generator', approvalMode: 'human_review', status: 'not_yet_built', description: 'Draft professional emails for staff and parent communication' },
  { id: 'comms-translation', name: 'Multi-Language Translator', department: 'communications', type: 'worker', approvalMode: 'auto', status: 'not_yet_built', description: 'Translate communications for multilingual school communities' },
  { id: 'comms-event-manager', name: 'Event Communication Manager', department: 'communications', type: 'worker', approvalMode: 'auto', status: 'not_yet_built', description: 'Manage event invitations, reminders, and follow-ups' },
  { id: 'comms-brand-checker', name: 'Brand Consistency Checker', department: 'communications', type: 'analyst', approvalMode: 'auto', status: 'not_yet_built', description: 'Check communications for brand voice and visual consistency' },
  { id: 'comms-media-handler', name: 'Media Enquiry Handler', department: 'communications', type: 'advisor', approvalMode: 'human_approval', status: 'not_yet_built', description: 'Assist with media enquiry responses and press statements' },
  { id: 'comms-meeting-companion', name: 'Meeting Companion', department: 'communications', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Manage meeting agendas, minutes, actions, and follow-ups' },
  { id: 'comms-document-producer', name: 'Document Producer', department: 'communications', type: 'generator', approvalMode: 'human_review', status: 'active', description: 'Generate documents from templates with school data merge' },

  // ═══════════════════════════════════════════════════════════════
  // INTELLIGENCE (Saturn) — 16 skills
  // ═══════════════════════════════════════════════════════════════
  { id: 'intel-cohort-tracker', name: 'Cohort Journey Tracker', department: 'intelligence', type: 'analyst', approvalMode: 'auto', status: 'active', description: 'Track year groups backwards through their school journey' },
  { id: 'intel-assessment', name: 'Pupil Assessment Analyser', department: 'intelligence', type: 'analyst', approvalMode: 'auto', status: 'active', description: 'Zero-PII gap analysis of pupil assessment data' },
  { id: 'intel-dfe-trends', name: 'DfE Data Trends Analyser', department: 'intelligence', type: 'analyst', approvalMode: 'auto', status: 'active', description: 'Analyse multi-year DfE warehouse data for trends' },
  { id: 'intel-cross-module', name: 'Cross-Module Signal Detector', department: 'intelligence', type: 'analyst', approvalMode: 'auto', status: 'active', description: 'Detect correlations across all school data modules' },
  { id: 'intel-eef-matcher', name: 'EEF Strategy Matcher', department: 'intelligence', type: 'advisor', approvalMode: 'auto', status: 'active', description: 'Match school needs to EEF Toolkit research strategies' },
  { id: 'intel-contextual', name: 'Contextual Factors Engine', department: 'intelligence', type: 'analyst', approvalMode: 'auto', status: 'active', description: 'Track and analyse school contextual factors over time' },
  { id: 'intel-attendance', name: 'Attendance Pattern Analyser', department: 'intelligence', type: 'analyst', approvalMode: 'auto', status: 'not_yet_built', description: 'Detect attendance patterns, persistent absence, and trends' },
  { id: 'intel-behaviour', name: 'Behaviour Incident Analyser', department: 'intelligence', type: 'analyst', approvalMode: 'auto', status: 'not_yet_built', description: 'Analyse behaviour incidents for patterns and triggers' },
  { id: 'intel-send-tracker', name: 'SEND Needs Tracker', department: 'intelligence', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Track SEND register, provisions, and funding allocations' },
  { id: 'intel-canvas', name: 'Canvas Data Ingestor', department: 'intelligence', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Smart MIS data ingestion with field matching and reconciliation' },
  { id: 'intel-predictor', name: 'Outcome Predictor', department: 'intelligence', type: 'analyst', approvalMode: 'human_review', status: 'not_yet_built', description: 'Predict pupil outcomes based on historical data patterns' },
  { id: 'intel-pseudonymiser', name: 'PII Pseudonymiser', department: 'intelligence', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Client-side HMAC-SHA256 pseudonymisation of pupil data' },
  { id: 'intel-census-validator', name: 'Census Data Validator', department: 'intelligence', type: 'analyst', approvalMode: 'auto', status: 'not_yet_built', description: 'Validate school census data before DfE submission' },
  { id: 'intel-exclusion-tracker', name: 'Exclusion Tracker', department: 'intelligence', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Track exclusions with legal compliance and trend analysis' },
  { id: 'intel-pp-tracker', name: 'Pupil Premium Impact Tracker', department: 'intelligence', type: 'analyst', approvalMode: 'auto', status: 'not_yet_built', description: 'Track Pupil Premium spending and impact on outcomes' },
  { id: 'intel-full-analysis', name: 'Full Intelligence Analysis', department: 'intelligence', type: 'analyst', approvalMode: 'auto', status: 'active', description: 'Run comprehensive cross-reference analysis with AI' },

  // ═══════════════════════════════════════════════════════════════
  // TEACHING & LEARNING (Uranus) — 10 skills
  // ═══════════════════════════════════════════════════════════════
  { id: 'teach-curriculum-mapper', name: 'Curriculum Mapper', department: 'teaching', type: 'analyst', approvalMode: 'auto', status: 'not_yet_built', description: 'Map curriculum coverage across subjects and year groups' },
  { id: 'teach-cpd-planner', name: 'CPD Planner', department: 'teaching', type: 'advisor', approvalMode: 'auto', status: 'not_yet_built', description: 'Plan continuing professional development based on school needs' },
  { id: 'teach-resource-finder', name: 'Teaching Resource Finder', department: 'teaching', type: 'advisor', approvalMode: 'auto', status: 'not_yet_built', description: 'Find relevant teaching resources and materials' },
  { id: 'teach-assessment-builder', name: 'Assessment Builder', department: 'teaching', type: 'generator', approvalMode: 'human_review', status: 'not_yet_built', description: 'Generate assessments aligned to curriculum objectives' },
  { id: 'teach-marking-assistant', name: 'Marking Assistant', department: 'teaching', type: 'worker', approvalMode: 'human_review', status: 'not_yet_built', description: 'Assist with marking and feedback generation' },
  { id: 'teach-nqt-support', name: 'ECT/NQT Support Guide', department: 'teaching', type: 'advisor', approvalMode: 'auto', status: 'not_yet_built', description: 'Guide early career teachers through induction standards' },
  { id: 'teach-homework-setter', name: 'Homework Setter', department: 'teaching', type: 'generator', approvalMode: 'auto', status: 'not_yet_built', description: 'Generate differentiated homework tasks' },
  { id: 'teach-timetable', name: 'Timetable Optimizer', department: 'teaching', type: 'analyst', approvalMode: 'auto', status: 'not_yet_built', description: 'Analyse and optimise school timetable allocation' },
  { id: 'teach-form-helper', name: 'Form Filling Assistant', department: 'teaching', type: 'worker', approvalMode: 'auto', status: 'active', description: 'AI-powered form filling with voice intelligence' },
  { id: 'teach-deep-research', name: 'Deep Research Tool', department: 'teaching', type: 'analyst', approvalMode: 'auto', status: 'active', description: 'Deep research into educational topics and best practice' },

  // ═══════════════════════════════════════════════════════════════
  // INTERNAL OPS — Mission Control (8 skills)
  // ═══════════════════════════════════════════════════════════════
  { id: 'mc-jarvis-status', name: 'Jarvis Status Monitor', department: 'internal', type: 'monitor', approvalMode: 'auto', status: 'active', description: 'Monitor Jarvis agent status, active tasks, and health' },
  { id: 'mc-build-monitor', name: 'Build Health Monitor', department: 'internal', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Track build status, test results, and deployment health' },
  { id: 'mc-approval-processor', name: 'Approval Queue Processor', department: 'internal', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Process pending approval items and route decisions' },
  { id: 'mc-audit-logger', name: 'Audit Log Manager', department: 'internal', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Record and query audit trail for all MC operations' },
  { id: 'mc-scheduler', name: 'Task Scheduler', department: 'internal', type: 'worker', approvalMode: 'auto', status: 'not_yet_built', description: 'Manage cron-style scheduled task execution' },
  { id: 'mc-guardian', name: 'Ed Guardian', department: 'internal', type: 'monitor', approvalMode: 'auto', status: 'not_yet_built', description: 'Proactive compliance nudging and automated checks' },
  { id: 'mc-notion-bridge', name: 'Notion Bridge', department: 'internal', type: 'worker', approvalMode: 'auto', status: 'active', description: 'Sync tasks and status between Mission Control and Notion' },
  { id: 'mc-advisor-chat', name: 'Advisor Chat Engine', department: 'internal', type: 'advisor', approvalMode: 'auto', status: 'not_yet_built', description: 'Chat with advisory board personas (Elena, Marcus, Priya, Oliver)' },
];

/**
 * Get skills grouped by department.
 */
export function getSkillsByDepartment(): Record<string, SkillDefinition[]> {
  const grouped: Record<string, SkillDefinition[]> = {};
  for (const skill of SKILLS_REGISTRY) {
    if (!grouped[skill.department]) grouped[skill.department] = [];
    grouped[skill.department].push(skill);
  }
  return grouped;
}

/**
 * Get department metadata by ID.
 */
export function getDepartment(id: string) {
  return DEPARTMENTS.find((d) => d.id === id);
}

/**
 * Get counts by status.
 */
export function getSkillStats() {
  const total = SKILLS_REGISTRY.length;
  const active = SKILLS_REGISTRY.filter((s) => s.status === 'active').length;
  const notBuilt = SKILLS_REGISTRY.filter((s) => s.status === 'not_yet_built').length;
  const inactive = SKILLS_REGISTRY.filter((s) => s.status === 'inactive').length;
  const deprecated = SKILLS_REGISTRY.filter((s) => s.status === 'deprecated').length;
  return { total, active, notBuilt, inactive, deprecated };
}
