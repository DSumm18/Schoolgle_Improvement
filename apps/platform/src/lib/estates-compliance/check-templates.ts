/**
 * Custom Check Templates
 *
 * Pre-built templates for common custom checks that schools can create.
 * These can be cloned and customized to suit each school's needs.
 */

import type { ComplianceDomain } from './statutory-checks';

export type CheckVisibility = 'private' | 'organization' | 'public';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'termly' | 'ad_hoc';

export interface CheckTemplate {
  id: string;
  name: string;
  description: string;
  category: 'custom';
  compliance_domain: ComplianceDomain;
  frequency: string;
  estimated_duration?: number; // minutes
  requires_qualification?: string;
  evidence_required: string[];
  checklist_items?: string[];
  notes?: string;
  visibility: CheckVisibility;
  tags: string[];
  is_template: boolean;
  created_by?: string;
  organization_id?: string; // For organization-specific templates
  usage_count?: number;
}

/**
 * Common custom check templates available to all schools
 */
export const COMMON_TEMPLATES: CheckTemplate[] = [
  // Daily Checks
  {
    id: 'template_daily_gate_lock',
    name: 'Daily Gate Lock Check',
    description: 'Check all school gates are locked securely during school hours and unlocked at appropriate times',
    category: 'custom',
    compliance_domain: 'security',
    frequency: 'daily',
    estimated_duration: 10,
    evidence_required: ['Gate check log', 'Photo of locked gates'],
    checklist_items: [
      'Main entrance gate locked',
      'Playground gates secured',
      'Side gates locked',
      'Any gates showing signs of damage',
      'Keys returned to secure storage'
    ],
    visibility: 'public',
    tags: ['security', 'daily', 'gates', 'perimeter'],
    is_template: true,
    usage_count: 0,
  },
  {
    id: 'template_daily_premises_visual',
    name: 'Daily Premises Visual Check',
    description: 'Walk around the school to check for any obvious hazards, damage, or security issues',
    category: 'custom',
    compliance_domain: 'security',
    frequency: 'daily',
    estimated_duration: 15,
    evidence_required: ['Daily log sheet'],
    checklist_items: [
      'No broken windows',
      'No graffiti or vandalism',
      'No signs of trespassing',
      'Bins secure',
      'No trip hazards on paths',
      'External lighting working'
    ],
    visibility: 'public',
    tags: ['security', 'daily', 'inspection', 'premises'],
    is_template: true,
    usage_count: 0,
  },

  // Weekly Checks
  {
    id: 'template_weekly_field_check',
    name: 'Weekly School Field Check',
    description: 'Check school field for litter, dog mess, holes, and other hazards',
    category: 'custom',
    compliance_domain: 'playground',
    frequency: 'weekly',
    estimated_duration: 20,
    evidence_required: ['Field check log', 'Photos of any issues'],
    checklist_items: [
      'Check for dog fouling',
      'Remove litter',
      'Check for rabbit holes or uneven ground',
      'Check goal posts are secure',
      'Check fencing around field',
      'Check for broken glass',
      'Document any issues found'
    ],
    visibility: 'public',
    tags: ['playground', 'weekly', 'field', 'safety'],
    is_template: true,
    usage_count: 0,
  },
  {
    id: 'template_weekly_kitchen_safety',
    name: 'Weekly Kitchen Safety Check',
    description: 'Basic safety checks for school kitchen and food preparation areas',
    category: 'custom',
    compliance_domain: 'fire',
    frequency: 'weekly',
    estimated_duration: 15,
    evidence_required: ['Kitchen safety log'],
    checklist_items: [
      'Fire blankets accessible and in date',
      'Extinguishers unobstructed',
      'Appliances turned off when not in use',
      'No blocked ventilation',
      'Cleaning schedule up to date',
      'Temperature records current'
    ],
    visibility: 'public',
    tags: ['fire', 'kitchen', 'weekly', 'safety'],
    is_template: true,
    usage_count: 0,
  },

  // Monthly Checks
  {
    id: 'template_monthly_first_aid',
    name: 'Monthly First Aid Kit Check',
    description: 'Check all first aid kits are fully stocked and within expiry dates',
    category: 'custom',
    compliance_domain: 'manual_handling',
    frequency: 'monthly',
    estimated_duration: 30,
    evidence_required: ['First aid kit inventory sheet'],
    checklist_items: [
      'Check all kits have stock',
      'Replace out-of-date items',
      'Record restocking',
      'Check kits are accessible',
      'Check signage is visible'
    ],
    visibility: 'public',
    tags: ['first-aid', 'monthly', 'safety'],
    is_template: true,
    usage_count: 0,
  },
  {
    id: 'template_monthly_minibus',
    name: 'Monthly Minibus Safety Check',
    description: 'Basic safety inspection of school minibus',
    category: 'custom',
    compliance_domain: 'security',
    frequency: 'monthly',
    estimated_duration: 30,
    evidence_required: ['Minibus check log', ' MOT certificate'],
    checklist_items: [
      'Check tyre condition and pressure',
      'Check lights and indicators',
      'Check oil and water levels',
      'Check seatbelts function correctly',
      'Check first aid kit stocked',
      'Check fire extinguisher present',
      'Check cleanliness'
    ],
    visibility: 'public',
    tags: ['vehicle', 'monthly', 'transport', 'minibus'],
    is_template: true,
    usage_count: 0,
  },
  {
    id: 'template_monthly_playground_inspection',
    name: 'Monthly Playground Equipment Check',
    description: 'Visual inspection of playground equipment for damage, wear, and safety issues',
    category: 'custom',
    compliance_domain: 'playground',
    frequency: 'monthly',
    estimated_duration: 45,
    evidence_required: ['Inspection log', 'Photos of any concerns'],
    checklist_items: [
      'Check all equipment for loose bolts',
      'Check for sharp edges',
      'Check surfacing condition',
      'Check gates and fences',
      'Check for trip hazards',
      'Check swing seats and chains',
      'Check slide condition',
      'Report any damage immediately'
    ],
    visibility: 'public',
    tags: ['playground', 'monthly', 'equipment', 'safety'],
    is_template: true,
    usage_count: 0,
  },

  // Termly Checks
  {
    id: 'template_termly_classroom',
    name: 'Termly Classroom Safety Audit',
    description: 'Comprehensive safety check of all classrooms',
    category: 'custom',
    compliance_domain: 'electrical',
    frequency: 'termly',
    estimated_duration: 120,
    evidence_required: ['Classroom audit forms'],
    checklist_items: [
      'Check electrical sockets for damage',
      'Check trailing cables',
      'Check window safety catches',
      'Check blind cords are safe',
      'Check furniture stability',
      'Check storage is secure',
      'Check emergency exits clear',
      'Check display boards secure'
    ],
    visibility: 'public',
    tags: ['classroom', 'termly', 'safety', 'audit'],
    is_template: true,
    usage_count: 0,
  },
  {
    id: 'template_termly_forest_school',
    name: 'Termly Forest School Area Check',
    description: 'Safety inspection of forest school or outdoor learning area',
    category: 'custom',
    compliance_domain: 'playground',
    frequency: 'termly',
    estimated_duration: 60,
    evidence_required: ['Forest school risk assessment', 'Site check log'],
    checklist_items: [
      'Check tree stability',
      'Check for dead branches overhead',
      'Check tool storage security',
      'Check fire pit condition',
      'Check seating stability',
      'Check fencing boundaries',
      'Check for animal holes',
      'Update risk assessment'
    ],
    visibility: 'public',
    tags: ['forest-school', 'termly', 'outdoor', 'learning'],
    is_template: true,
    usage_count: 0,
  },

  // Ad-hoc/Seasonal Checks
  {
    id: 'template_seasonal_winter',
    name: 'Winter Readiness Check',
    description: 'Prepare the school for winter weather conditions',
    category: 'custom',
    compliance_domain: 'security',
    frequency: 'ad_hoc',
    estimated_duration: 60,
    evidence_required: ['Winter readiness checklist', 'Gritting log'],
    checklist_items: [
      'Check grit salt supplies',
      'Test grit spreader',
      'Check pathways for ice risks',
      'Check heating systems working',
      'Check pipe lagging',
      'Check drainage clear',
      'Check insulation in exposed areas',
      'Prepare closure procedures'
    ],
    visibility: 'public',
    tags: ['winter', 'seasonal', 'weather', 'preparedness'],
    is_template: true,
    usage_count: 0,
  },
  {
    id: 'template_seasonal_summer',
    name: 'Summer Holiday Security Check',
    description: 'Additional security checks before school holidays',
    category: 'custom',
    compliance_domain: 'security',
    frequency: 'ad_hoc',
    estimated_duration: 45,
    evidence_required: ['Holiday security checklist'],
    checklist_items: [
      'Test all alarms',
      'Check perimeter fencing',
      'Secure all windows',
      'Check CCTV coverage',
      'Check lighting timers',
      'Arrange key holder cover',
      'Inform neighbours of holiday dates',
      'Cancel regular deliveries'
    ],
    visibility: 'public',
    tags: ['holiday', 'security', 'summer', 'closure'],
    is_template: true,
    usage_count: 0,
  },

  // Specialized Checks
  {
    id: 'template_science_lab',
    name: 'Science Lab Safety Check',
    description: 'Weekly safety checks for science laboratories',
    category: 'custom',
    compliance_domain: 'electrical',
    frequency: 'weekly',
    estimated_duration: 20,
    requires_qualification: 'Science technician or teacher',
    evidence_required: ['Lab safety log'],
    checklist_items: [
      'Check chemical storage security',
      'Check eye wash stations working',
      'Check safety shower functional',
      'Check fume cupboards operational',
      'Check fire extinguishers present',
      'Check PPE available',
      'Check waste disposal procedures',
      'Check gas and electricity supplies'
    ],
    visibility: 'public',
    tags: ['science', 'lab', 'weekly', 'safety'],
    is_template: true,
    usage_count: 0,
  },
  {
    id: 'template_design_tech',
    name: 'Design Technology Workshop Check',
    description: 'Weekly safety checks for D&T workshops',
    category: 'custom',
    compliance_domain: 'mechanical',
    frequency: 'weekly',
    estimated_duration: 30,
    requires_qualification: 'D&T technician or teacher',
    evidence_required: ['Workshop safety log'],
    checklist_items: [
      'Check all machine guards in place',
      'Check emergency stops accessible',
      'Check dust extraction working',
      'Check PPE available and in good condition',
      'Check fire extinguishers',
      'Check tool storage',
      'Check electrical leads condition',
      'Check ventilation'
    ],
    visibility: 'public',
    tags: ['design-tech', 'workshop', 'weekly', 'safety'],
    is_template: true,
    usage_count: 0,
  },
  {
    id: 'template_swimming_pool',
    name: 'Swimming Pool Daily Check',
    description: 'Daily safety and water quality checks for school pool',
    category: 'custom',
    compliance_domain: 'water',
    frequency: 'daily',
    estimated_duration: 15,
    requires_qualification: 'Pool operator or trained staff',
    evidence_required: ['Pool log book', 'Water test results'],
    checklist_items: [
      'Check water clarity',
      'Test pH levels',
      'Test chlorine levels',
      'Check pool cover condition',
      'Check rescue equipment accessible',
      'Check emergency phone working',
      'Check changing rooms clean and dry',
      'Check signage visible'
    ],
    visibility: 'public',
    tags: ['pool', 'water', 'daily', 'safety'],
    is_template: true,
    usage_count: 0,
  },
];

/**
 * Get templates by domain
 */
export function getTemplatesByDomain(domain: ComplianceDomain): CheckTemplate[] {
  return COMMON_TEMPLATES.filter(t => t.compliance_domain === domain);
}

/**
 * Get templates by frequency
 */
export function getTemplatesByFrequency(frequency: string): CheckTemplate[] {
  return COMMON_TEMPLATES.filter(t => t.frequency === frequency);
}

/**
 * Get templates by tags
 */
export function getTemplatesByTags(tags: string[]): CheckTemplate[] {
  return COMMON_TEMPLATES.filter(t =>
    tags.some(tag => t.tags.includes(tag))
  );
}

/**
 * Search templates by keyword
 */
export function searchTemplates(query: string): CheckTemplate[] {
  const lowerQuery = query.toLowerCase();
  return COMMON_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): CheckTemplate | undefined {
  return COMMON_TEMPLATES.find(t => t.id === id);
}

/**
 * Get popular templates (sorted by usage count)
 */
export function getPopularTemplates(limit: number = 10): CheckTemplate[] {
  return [...COMMON_TEMPLATES]
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    .slice(0, limit);
}

/**
 * Get all unique tags from templates
 */
export function getAllTemplateTags(): string[] {
  const tags = new Set<string>();
  COMMON_TEMPLATES.forEach(t => t.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}

/**
 * Get all frequencies used in templates
 */
export function getAllTemplateFrequencies(): string[] {
  const frequencies = new Set<string>();
  COMMON_TEMPLATES.forEach(t => frequencies.add(t.frequency));
  return Array.from(frequencies).sort();
}
