/**
 * Findings Classification Database
 *
 * Regulatory reference database for UK estates compliance.
 * Distinguishes between statutory requirements, good practice, and contractor suggestions.
 *
 * Based on HSE guidance, Building Regulations, and education-specific requirements.
 */

// ============================================================================
// TYPES
// ============================================================================

export type FindingClassification = 'statutory' | 'good_practice' | 'contractor_suggestion';
export type FindingDomain = 'legionella' | 'fire' | 'asbestos' | 'electrical' | 'gas' | 'water' | 'mechanical' | 'lifts' | 'playground' | 'accessibility' | 'security' | 'manual_handling' | 'working_at_height';
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Finding interface - extracted from contractor reports
 */
export interface Finding {
  id: string;
  severity: FindingSeverity;
  description: string;
  action_required: string;
  classification?: FindingClassification;
  source?: string;
  source_url?: string;
  estimated_cost?: number;
  suggested_action?: string;
  confidence?: number;
  explanation?: string;
  rawText?: string;
  status?: 'pending' | 'approved' | 'declined' | 'deferred';
  deferredUntil?: string;
}

export interface RegulatorySource {
  id: string;
  name: string;
  type: 'legislation' | 'acop' | 'guidance' | 'british_standard' | 'industry_guidance';
  url: string;
  description?: string;
}

export interface RegulatoryRequirement {
  id: string;
  domain: FindingDomain;
  description: string;
  classification: FindingClassification;
  source: string; // Reference code (e.g., "HSE L8 para 157")
  sourceId: string;
  sourceUrl: string;
  extracts?: string; // Direct quote from source
  keywords: string[];
  severity?: FindingSeverity;
  notes?: string;
}

export interface FindingMatch {
  description: string;
  classification: FindingClassification;
  source?: string;
  sourceUrl?: string;
  confidence: number; // 0-1
  explanation: string;
  severity: FindingSeverity;
  estimatedCost?: number;
  suggestedAction?: string;
}

// ============================================================================
// REGULATORY SOURCES DATABASE
// ============================================================================

export const REGULATORY_SOURCES: Record<string, RegulatorySource> = {
  // Legionella sources
  'hse_l8': {
    id: 'hse_l8',
    name: "HSE L8 - Legionnaires' Disease: The control of legionella bacteria in water systems",
    type: 'acop',
    url: 'https://www.hse.gov.uk/pubns/books/l8.htm',
    description: 'Approved Code of Practice - Legal standing'
  },
  'hse_hsg274': {
    id: 'hse_hsg274',
    name: "HSE HSG274 - Legionnaires' disease Part 2: The control of legionella bacteria in hot and cold water systems",
    type: 'guidance',
    url: 'https://www.hse.gov.uk/pubns/priced/hsg274part2.pdf',
    description: 'Technical guidance - Good practice examples'
  },

  // Fire safety sources
  'rro_2005': {
    id: 'rro_2005',
    name: 'Regulatory Reform (Fire Safety) Order 2005',
    type: 'legislation',
    url: 'https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made',
    description: 'Primary fire safety legislation'
  },
  'bs5839': {
    id: 'bs5839',
    name: 'BS5839-1: Fire detection and alarm systems',
    type: 'british_standard',
    url: 'https://www.bsi.group.com/en/standards/british-standards',
    description: 'British Standard for fire alarm systems'
  },
  'bs5306': {
    id: 'bs5306',
    name: 'BS5306: Fire extinguishing installations',
    type: 'british_standard',
    url: 'https://www.bsi.group.com/en/standards/british-standards',
    description: 'British Standard for fire extinguishers'
  },
  'bs5266': {
    id: 'bs5266',
    name: 'BS5266: Emergency lighting',
    type: 'british_standard',
    url: 'https://www.bsi.group.com/en/standards/british-standards',
    description: 'British Standard for emergency lighting'
  },

  // Asbestos sources
  'car_2012': {
    id: 'car_2012',
    name: 'Control of Asbestos Regulations 2012',
    type: 'legislation',
    url: 'https://www.legislation.gov.uk/ukdsi/2012/2307/contents/made',
    description: 'Primary asbestos legislation'
  },

  // Electrical sources
  'eawr_1989': {
    id: 'eawr_1989',
    name: 'Electricity at Work Regulations 1989',
    type: 'legislation',
    url: 'https://www.legislation.gov.uk/ukdsi/1989/635/contents/made',
    description: 'Primary electrical safety legislation'
  },
  'bs7671': {
    id: 'bs7671',
    name: 'BS7671: Requirements for Electrical Installations (IET Wiring Regulations)',
    type: 'british_standard',
    url: 'https://www.bsi.group.com/en/standards/british-standards',
    description: 'British Standard for electrical installations'
  },

  // Gas sources
  'gfsp_1995': {
    id: 'gfsp_1995',
    name: 'Gas Safety (Installation and Use) Regulations 1998',
    type: 'legislation',
    url: 'https://www.legislation.gov.uk/uksi/1998/2451/contents/made',
    description: 'Primary gas safety legislation'
  },

  // Water sources
  'water_quality_2016': {
    id: 'water_quality_2016',
    name: 'Water Supply (Water Quality) Regulations 2016',
    type: 'legislation',
    url: 'https://www.legislation.gov.uk/uksi/2016/614/contents/made',
    description: 'Drinking water quality standards'
  },

  // Lifts sources
  'loler_1998': {
    id: 'loler_1998',
    name: 'Lifting Operations and Lifting Equipment Regulations 1998',
    type: 'legislation',
    url: 'https://www.legislation.gov.uk/ukpga/1998/23/contents/made',
    description: 'Primary lifting equipment legislation'
  },
  'puwer_1998': {
    id: 'puwer_1998',
    name: 'Provision and Use of Work Equipment Regulations 1998',
    type: 'legislation',
    url: 'https://www.legislation.gov.uk/ukpga/1998/37/contents/made',
    description: 'Work equipment safety legislation'
  },

  // Playground sources
  'en1176': {
    id: 'en1176',
    name: 'EN 1176: Playground equipment',
    type: 'british_standard',
    url: 'https://www.bsi.group.com/en/standards/british-standards',
    description: 'European Standard for playground equipment'
  },
  'en1177': {
    id: 'en1177',
    name: 'EN 1177: Impact absorbing playground surfacing',
    type: 'british_standard',
    url: 'https://www.bsi.group.com/en/standards/british-standards',
    description: 'European Standard for playground surfacing'
  },

  // Accessibility sources
  'equality_act_2010': {
    id: 'equality_act_2010',
    name: 'Equality Act 2010',
    type: 'legislation',
    url: 'https://www.legislation.gov.uk/ukpga/2010/15/contents',
    description: 'Primary equality and accessibility legislation'
  },

  // Working at height sources
  'wah_2005': {
    id: 'wah_2005',
    name: 'Work at Height Regulations 2005',
    type: 'legislation',
    url: 'https://www.legislation.gov.uk/ukksi/2005/735/contents/made',
    description: 'Primary working at height legislation'
  },
};

// ============================================================================
// REGULATORY REQUIREMENTS DATABASE
// ============================================================================

export const REGULATORY_REQUIREMENTS: RegulatoryRequirement[] = [
  // ========================================================================
  // LEGIONELLA - STATUTORY (ACoP L8 = legal requirement)
  // ========================================================================
  {
    id: 'leg_temp_cold_outlet',
    domain: 'legionella',
    description: 'Cold water outlet temperature exceeds 20°C',
    classification: 'statutory',
    source: 'HSE L8 para 157',
    sourceId: 'hse_l8',
    sourceUrl: REGULATORY_SOURCES['hse_l8'].url,
    extracts: 'Cold water should be at a temperature below 20°C after running for up to 2 minutes',
    keywords: ['cold water', 'temperature', '20°C', 'outlet', 'high', 'exceeds'],
    severity: 'high',
    notes: 'Statutory requirement from ACoP L8'
  },
  {
    id: 'leg_temp_hot_storage',
    domain: 'legionella',
    description: 'Hot water storage temperature below 60°C',
    classification: 'statutory',
    source: 'HSE L8 para 158',
    sourceId: 'hse_l8',
    sourceUrl: REGULATORY_SOURCES['hse_l8'].url,
    extracts: 'Hot water should be stored at a temperature of at least 60°C',
    keywords: ['hot water', 'storage', 'temperature', '60°C', 'calorifier', 'below'],
    severity: 'critical',
    notes: 'Statutory requirement from ACoP L8'
  },
  {
    id: 'leg_temp_hot_distribution',
    domain: 'legionella',
    description: 'Hot water distribution temperature below 50°C',
    classification: 'statutory',
    source: 'HSE L8 para 158',
    sourceId: 'hse_l8',
    sourceUrl: REGULATORY_SOURCES['hse_l8'].url,
    extracts: 'Hot water should be distributed at a temperature of not less than 50°C within 1 minute of running',
    keywords: ['hot water', 'distribution', 'temperature', '50°C', 'below', 'outlet'],
    severity: 'high',
    notes: 'Statutory requirement from ACoP L8'
  },
  {
    id: 'leg_flush_weekly',
    domain: 'legionella',
    description: 'Outlet not flushed weekly when unused for 7+ days',
    classification: 'statutory',
    source: 'HSE L8 para 155',
    sourceId: 'hse_l8',
    sourceUrl: REGULATORY_SOURCES['hse_l8'].url,
    extracts: 'Outlets that are not used on a regular basis should be flushed weekly',
    keywords: ['flush', 'weekly', 'unused', 'outlet', '7 days', 'infrequently'],
    severity: 'high',
    notes: 'Statutory requirement from ACoP L8'
  },
  {
    id: 'leg_risk_assessment_annual',
    domain: 'legionella',
    description: 'Legionella risk assessment not reviewed annually',
    classification: 'statutory',
    source: 'HSE L8',
    sourceId: 'hse_l8',
    sourceUrl: REGULATORY_SOURCES['hse_l8'].url,
    extracts: 'The risk assessment should be regularly reviewed, especially when there is reason to suspect it is no longer valid',
    keywords: ['risk assessment', 'annual', 'review', 'legionella'],
    severity: 'critical',
    notes: 'Statutory requirement from ACoP L8'
  },
  {
    id: 'leg_shower_descale',
    domain: 'legionella',
    description: 'Shower heads not cleaned and descaled every 3-6 months',
    classification: 'statutory',
    source: 'HSE HSG274 Part 2',
    sourceId: 'hse_hsg274',
    sourceUrl: REGULATORY_SOURCES['hse_hsg274'].url,
    extracts: 'Shower heads and hoses should be cleaned and descaled at least every 3-6 months',
    keywords: ['shower', 'clean', 'descale', '3 months', '6 months', 'scale'],
    severity: 'medium',
    notes: 'Statutory requirement from HSG274'
  },

  // LEGIONELLA - GOOD PRACTICE
  {
    id: 'leg_sentinel_outlets',
    domain: 'legionella',
    description: 'Install sentinel outlets for monitoring',
    classification: 'good_practice',
    source: 'HSE HSG274',
    sourceId: 'hse_hsg274',
    sourceUrl: REGULATORY_SOURCES['hse_hsg274'].url,
    extracts: 'Sentinel outlets can be useful for monitoring purposes',
    keywords: ['sentinel', 'outlets', 'monitoring', 'install', 'fitting'],
    severity: 'low',
    notes: 'Good practice example in HSG274, not statutory'
  },
  {
    id: 'leg_daily_flush',
    domain: 'legionella',
    description: 'Daily flushing of outlets',
    classification: 'good_practice',
    source: '',
    sourceId: '',
    sourceUrl: '',
    extracts: '',
    keywords: ['daily', 'flush', 'outlet', 'every day'],
    severity: 'low',
    notes: 'Good practice - weekly is sufficient for statutory compliance'
  },
  {
    id: 'leg_calorifier_annual_flush',
    domain: 'legionella',
    description: 'Annual calorifier flush and clean',
    classification: 'good_practice',
    source: 'HSE HSG274',
    sourceId: 'hse_hsg274',
    sourceUrl: REGULATORY_SOURCES['hse_hsg274'].url,
    extracts: 'Calorifiers should be inspected annually and, if necessary, cleaned',
    keywords: ['calorifier', 'annual', 'flush', 'clean', 'inspection'],
    severity: 'medium',
    notes: 'Good practice - recommended but not explicitly statutory'
  },

  // ========================================================================
  // FIRE SAFETY - STATUTORY
  // ========================================================================
  {
    id: 'fire_weekly_alarm_test',
    domain: 'fire',
    description: 'Weekly fire alarm test not completed',
    classification: 'statutory',
    source: 'RRO 2005, BS5839',
    sourceId: 'rro_2005',
    sourceUrl: REGULATORY_SOURCES['rro_2005'].url,
    extracts: 'The fire alarm system should be tested weekly',
    keywords: ['fire alarm', 'weekly', 'test', 'call point'],
    severity: 'high',
    notes: 'Statutory requirement under RRO 2005'
  },
  {
    id: 'fire_daily_log_check',
    domain: 'fire',
    description: 'Daily fire safety log check not completed',
    classification: 'statutory',
    source: 'RRO 2005',
    sourceId: 'rro_2005',
    sourceUrl: REGULATORY_SOURCES['rro_2005'].url,
    extracts: 'Fire alarm panels should be checked daily',
    keywords: ['daily', 'fire', 'log', 'panel', 'check'],
    severity: 'high',
    notes: 'Statutory requirement under RRO 2005'
  },
  {
    id: 'fire_monthly_extinguisher_check',
    domain: 'fire',
    description: 'Monthly fire extinguisher check not completed',
    classification: 'statutory',
    source: 'RRO 2005, BS5306',
    sourceId: 'rro_2005',
    sourceUrl: REGULATORY_SOURCES['rro_2005'].url,
    extracts: 'Fire extinguishers should be checked monthly',
    keywords: ['extinguisher', 'monthly', 'check', 'inspection'],
    severity: 'high',
    notes: 'Statutory requirement under RRO 2005'
  },
  {
    id: 'fire_annual_extinguisher_service',
    domain: 'fire',
    description: 'Annual fire extinguisher servicing not completed',
    classification: 'statutory',
    source: 'BS5306',
    sourceId: 'bs5306',
    sourceUrl: REGULATORY_SOURCES['bs5306'].url,
    extracts: 'Fire extinguishers should be serviced annually',
    keywords: ['extinguisher', 'annual', 'service', 'servicing'],
    severity: 'critical',
    notes: 'Industry standard expected by RRO'
  },
  {
    id: 'fire_monthly_emergency_lighting',
    domain: 'fire',
    description: 'Monthly emergency lighting test not completed',
    classification: 'statutory',
    source: 'RRO 2005, BS5266',
    sourceId: 'rro_2005',
    sourceUrl: REGULATORY_SOURCES['rro_2005'].url,
    extracts: 'Emergency lighting should be tested monthly',
    keywords: ['emergency lighting', 'monthly', 'test', 'flicker'],
    severity: 'high',
    notes: 'Statutory requirement under RRO 2005'
  },
  {
    id: 'fire_annual_risk_assessment',
    domain: 'fire',
    description: 'Fire risk assessment not reviewed annually',
    classification: 'statutory',
    source: 'RRO 2005 Article 9',
    sourceId: 'rro_2005',
    sourceUrl: REGULATORY_SOURCES['rro_2005'].url,
    extracts: 'A suitable and sufficient fire risk assessment must be carried out',
    keywords: ['fire risk assessment', 'annual', 'review'],
    severity: 'critical',
    notes: 'Statutory requirement under RRO 2005'
  },
  {
    id: 'fire_weekly_escape_routes',
    domain: 'fire',
    description: 'Weekly escape route inspection not completed',
    classification: 'statutory',
    source: 'RRO 2005',
    sourceId: 'rro_2005',
    sourceUrl: REGULATORY_SOURCES['rro_2005'].url,
    extracts: 'Escape routes must be kept clear',
    keywords: ['escape route', 'weekly', 'clear', 'exit', 'inspection'],
    severity: 'high',
    notes: 'Statutory requirement under RRO 2005'
  },

  // FIRE SAFETY - GOOD PRACTICE
  {
    id: 'fire_detector_cleaning',
    domain: 'fire',
    description: 'Annual smoke detector cleaning',
    classification: 'good_practice',
    source: 'BS5839',
    sourceId: 'bs5839',
    sourceUrl: REGULATORY_SOURCES['bs5839'].url,
    extracts: 'Smoke detectors should be cleaned annually',
    keywords: ['detector', 'cleaning', 'annual', 'smoke', 'heat'],
    severity: 'low',
    notes: 'Good practice from BS5839, not explicit in RRO'
  },
  {
    id: 'fire_additional_extinguishers',
    domain: 'fire',
    description: 'Install additional fire extinguishers',
    classification: 'good_practice',
    source: '',
    sourceId: '',
    sourceUrl: '',
    extracts: '',
    keywords: ['additional', 'extra', 'extinguisher', 'install', 'more'],
    severity: 'low',
    notes: 'Good practice - not statutory requirement'
  },

  // ========================================================================
  // ASBESTOS - STATUTORY
  // ========================================================================
  {
    id: 'asb_register_annual',
    domain: 'asbestos',
    description: 'Asbestos register not reviewed annually',
    classification: 'statutory',
    source: 'CAR 2012',
    sourceId: 'car_2012',
    sourceUrl: REGULATORY_SOURCES['car_2012'].url,
    extracts: 'The asbestos register should be reviewed and updated regularly',
    keywords: ['asbestos register', 'annual', 'review', 'update'],
    severity: 'critical',
    notes: 'Statutory requirement under CAR 2012'
  },
  {
    id: 'asb_three_year_survey',
    domain: 'asbestos',
    description: 'Re-inspection survey overdue (3 yearly)',
    classification: 'statutory',
    source: 'CAR 2012',
    sourceId: 'car_2012',
    sourceUrl: REGULATORY_SOURCES['car_2012'].url,
    extracts: 'A full re-survey should be carried out every 3 years',
    keywords: ['survey', 're-inspection', '3 years', 'UKAS', 'asbestos'],
    severity: 'critical',
    notes: 'Statutory requirement under CAR 2012'
  },
  {
    id: 'asb_annual_visual',
    domain: 'asbestos',
    description: 'Annual visual inspection of ACMs not completed',
    classification: 'statutory',
    source: 'CAR 2012',
    sourceId: 'car_2012',
    sourceUrl: REGULATORY_SOURCES['car_2012'].url,
    extracts: 'Asbestos-containing materials should be inspected annually',
    keywords: ['asbestos', 'visual inspection', 'annual', 'ACM'],
    severity: 'high',
    notes: 'Statutory requirement under CAR 2012'
  },
  {
    id: 'asb_management_plan',
    domain: 'asbestos',
    description: 'Asbestos management plan not reviewed',
    classification: 'statutory',
    source: 'CAR 2012 Regulation 4',
    sourceId: 'car_2012',
    sourceUrl: REGULATORY_SOURCES['car_2012'].url,
    extracts: 'A written plan of how asbestos will be managed is required',
    keywords: ['management plan', 'asbestos', 'review', 'annual'],
    severity: 'critical',
    notes: 'Statutory duty under CAR 2012'
  },
  {
    id: 'asb_training',
    domain: 'asbestos',
    description: 'Asbestos awareness training not current',
    classification: 'statutory',
    source: 'CAR 2012',
    sourceId: 'car_2012',
    sourceUrl: REGULATORY_SOURCES['car_2012'].url,
    extracts: 'Those who may disturb asbestos must receive training',
    keywords: ['training', 'asbestos awareness', 'staff', 'annual'],
    severity: 'high',
    notes: 'Statutory requirement under CAR 2012'
  },

  // ASBESTOS - GOOD PRACTICE
  {
    id: 'asb_remove_low_risk',
    domain: 'asbestos',
    description: 'Remove low-risk intact asbestos',
    classification: 'good_practice',
    source: '',
    sourceId: '',
    sourceUrl: '',
    extracts: '',
    keywords: ['remove', 'asbestos', 'low risk', 'intact'],
    severity: 'low',
    notes: 'Good practice - removal not required if ACM is managed'
  },

  // ========================================================================
  // ELECTRICAL - STATUTORY
  // ========================================================================
  {
    id: 'elec_fixed_wire',
    domain: 'electrical',
    description: 'Fixed wire testing (EICR) overdue (5 yearly)',
    classification: 'statutory',
    source: 'EAWR 1989, BS7671',
    sourceId: 'eawr_1989',
    sourceUrl: REGULATORY_SOURCES['eawr_1989'].url,
    extracts: 'Electrical installations should be inspected and tested periodically',
    keywords: ['fixed wire', 'EICR', '5 years', 'testing', 'inspection'],
    severity: 'critical',
    notes: 'Statutory requirement under EAWR 1989'
  },
  {
    id: 'elec_pat_testing',
    domain: 'electrical',
    description: 'Portable appliance testing not completed',
    classification: 'statutory',
    source: 'EAWR 1989',
    sourceId: 'eawr_1989',
    sourceUrl: REGULATORY_SOURCES['eawr_1989'].url,
    extracts: 'Portable electrical equipment should be maintained',
    keywords: ['PAT', 'portable appliance', 'testing', 'annual'],
    severity: 'high',
    notes: 'Statutory requirement under EAWR 1989'
  },
  {
    id: 'elec_rcd_quarterly',
    domain: 'electrical',
    description: 'RCD quarterly test not completed',
    classification: 'statutory',
    source: 'BS7671',
    sourceId: 'bs7671',
    sourceUrl: REGULATORY_SOURCES['bs7671'].url,
    extracts: 'RCDs should be tested quarterly',
    keywords: ['RCD', 'quarterly', 'test', 'residual current'],
    severity: 'high',
    notes: 'Statutory requirement under BS7671'
  },

  // ========================================================================
  // GAS - STATUTORY
  // ========================================================================
  {
    id: 'gas_annual_check',
    domain: 'gas',
    description: 'Annual gas safety check not completed',
    classification: 'statutory',
    source: 'GFSP 1995',
    sourceId: 'gfsp_1995',
    sourceUrl: REGULATORY_SOURCES['gfsp_1995'].url,
    extracts: 'Gas appliances should be safety checked annually',
    keywords: ['gas safety', 'annual', 'check', 'CP12', 'certificate'],
    severity: 'critical',
    notes: 'Statutory requirement under GFSP 1995'
  },
  {
    id: 'gas_visual_monthly',
    domain: 'gas',
    description: 'Monthly visual gas appliance check not completed',
    classification: 'statutory',
    source: 'GFSP 1995',
    sourceId: 'gfsp_1995',
    sourceUrl: REGULATORY_SOURCES['gfsp_1995'].url,
    extracts: 'Gas appliances should be visually checked monthly',
    keywords: ['gas', 'monthly', 'visual', 'check', 'appliance'],
    severity: 'high',
    notes: 'Statutory requirement under GFSP 1995'
  },

  // ========================================================================
  // LIFTS - STATUTORY
  // ========================================================================
  {
    id: 'lift_loler_six_monthly',
    domain: 'lifts',
    description: 'LOLER examination overdue (6 monthly)',
    classification: 'statutory',
    source: 'LOLER 1998',
    sourceId: 'loler_1998',
    sourceUrl: REGULATORY_SOURCES['loler_1998'].url,
    extracts: 'Passenger lifts should be thoroughly examined every 6 months',
    keywords: ['LOLER', '6 months', 'examination', 'lift', 'thorough'],
    severity: 'critical',
    notes: 'Statutory requirement under LOLER 1998'
  },
  {
    id: 'lift_daily_inspection',
    domain: 'lifts',
    description: 'Daily lift inspection not completed',
    classification: 'statutory',
    source: 'LOLER 1998',
    sourceId: 'loler_1998',
    sourceUrl: REGULATORY_SOURCES['loler_1998'].url,
    extracts: 'Lifts should be inspected daily',
    keywords: ['lift', 'daily', 'inspection', 'check'],
    severity: 'high',
    notes: 'Statutory requirement under LOLER 1998'
  },

  // ========================================================================
  // PLAYGROUND - STATUTORY
  // ========================================================================
  {
    id: 'play_annual_inspection',
    domain: 'playground',
    description: 'Annual playground equipment inspection not completed',
    classification: 'statutory',
    source: 'PUWER 1998',
    sourceId: 'puwer_1998',
    sourceUrl: REGULATORY_SOURCES['puwer_1998'].url,
    extracts: 'Playground equipment should be inspected annually by a competent person',
    keywords: ['playground', 'annual', 'inspection', 'RPII'],
    severity: 'high',
    notes: 'Statutory requirement under PUWER 1998'
  },
  {
    id: 'play_weekly_check',
    domain: 'playground',
    description: 'Weekly playground visual check not completed',
    classification: 'statutory',
    source: 'PUWER 1998',
    sourceId: 'puwer_1998',
    sourceUrl: REGULATORY_SOURCES['puwer_1998'].url,
    extracts: 'Playground equipment should be checked weekly',
    keywords: ['playground', 'weekly', 'visual', 'check'],
    severity: 'medium',
    notes: 'Statutory requirement under PUWER 1998'
  },
  {
    id: 'play_surfacing',
    domain: 'playground',
    description: 'Playground surfacing inspection not completed',
    classification: 'statutory',
    source: 'EN 1177',
    sourceId: 'en1177',
    sourceUrl: REGULATORY_SOURCES['en1177'].url,
    extracts: 'Safety surfacing should be inspected quarterly',
    keywords: ['surfacing', 'playground', 'impact absorbing', 'inspection'],
    severity: 'high',
    notes: 'Statutory requirement under EN 1177'
  },

  // ========================================================================
  // ACCESSIBILITY - STATUTORY
  // ========================================================================
  {
    id: 'access_statement',
    domain: 'accessibility',
    description: 'Accessibility statement not reviewed',
    classification: 'statutory',
    source: 'Equality Act 2010',
    sourceId: 'equality_act_2010',
    sourceUrl: REGULATORY_SOURCES['equality_act_2010'].url,
    extracts: 'Schools should have an accessibility statement',
    keywords: ['accessibility', 'statement', 'review', 'annual'],
    severity: 'medium',
    notes: 'Statutory requirement under Equality Act 2010'
  },

  // ========================================================================
  // WORKING AT HEIGHT - STATUTORY
  // ========================================================================
  {
    id: 'wah_equipment_inspection',
    domain: 'working_at_height',
    description: 'Working at height equipment inspection not completed',
    classification: 'statutory',
    source: 'WAH 2005',
    sourceId: 'wah_2005',
    sourceUrl: REGULATORY_SOURCES['wah_2005'].url,
    extracts: 'Work equipment should be inspected',
    keywords: ['ladder', 'inspection', 'annual', 'tower', 'access equipment'],
    severity: 'high',
    notes: 'Statutory requirement under WAH 2005'
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get regulatory requirements by domain
 */
export function getRequirementsByDomain(domain: FindingDomain): RegulatoryRequirement[] {
  return REGULATORY_REQUIREMENTS.filter(req => req.domain === domain);
}

/**
 * Get regulatory requirements by classification
 */
export function getRequirementsByClassification(classification: FindingClassification): RegulatoryRequirement[] {
  return REGULATORY_REQUIREMENTS.filter(req => req.classification === classification);
}

/**
 * Get regulatory source by ID
 */
export function getSourceById(sourceId: string): RegulatorySource | undefined {
  return REGULATORY_SOURCES[sourceId];
}

/**
 * Search requirements by keywords
 */
export function searchRequirements(query: string): RegulatoryRequirement[] {
  const lowerQuery = query.toLowerCase();
  return REGULATORY_REQUIREMENTS.filter(req => {
    return (
      req.description.toLowerCase().includes(lowerQuery) ||
      req.keywords.some(kw => kw.toLowerCase().includes(lowerQuery)) ||
      req.source.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Classify a finding description using keyword matching
 * Returns classification with confidence score
 */
export function classifyFinding(
  description: string,
  domain?: FindingDomain
): FindingMatch {
  const lowerDesc = description.toLowerCase();

  // Search for matching requirements
  let candidates = REGULATORY_REQUIREMENTS;

  if (domain) {
    candidates = candidates.filter(req => req.domain === domain);
  }

  // Score each requirement based on keyword matches
  const scored = candidates.map(req => {
    let score = 0;
    const keywords = req.keywords.map(k => k.toLowerCase());

    // Exact phrase matches get highest score
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        score += 1;
      }
    }

    // Check for source reference
    if (lowerDesc.includes(req.source.toLowerCase())) {
      score += 2;
    }

    return { req, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];

  if (best && best.score >= 2) {
    // High confidence match
    return {
      description,
      classification: best.req.classification,
      source: best.req.source,
      sourceUrl: best.req.sourceUrl,
      confidence: Math.min(best.score / 5, 1),
      explanation: `Matched to regulatory requirement: ${best.req.source}. ${best.req.notes || ''}`,
      severity: best.req.severity || 'medium',
    };
  }

  if (best && best.score >= 1) {
    // Medium confidence - might be related
    return {
      description,
      classification: 'good_practice', // Default to good practice if uncertain
      source: best.req.source,
      sourceUrl: best.req.sourceUrl,
      confidence: 0.5,
      explanation: `Partially matches regulatory requirement: ${best.req.source}. Manual review recommended.`,
      severity: 'medium',
    };
  }

  // No clear match - default to contractor suggestion
  return {
    description,
    classification: 'contractor_suggestion',
    confidence: 0.2,
    explanation: 'This finding does not clearly match known statutory requirements. It appears to be a contractor recommendation.',
    severity: 'low',
  };
}

/**
 * Get classification statistics
 */
export function getClassificationStats(requirements: RegulatoryRequirement[]): Record<FindingClassification, number> {
  return {
    statutory: requirements.filter(r => r.classification === 'statutory').length,
    good_practice: requirements.filter(r => r.classification === 'good_practice').length,
    contractor_suggestion: requirements.filter(r => r.classification === 'contractor_suggestion').length,
  };
}

/**
 * Format classification for display
 */
export function formatClassification(classification: FindingClassification): string {
  switch (classification) {
    case 'statutory':
      return 'Statutory Required';
    case 'good_practice':
      return 'Good Practice';
    case 'contractor_suggestion':
      return 'Contractor Suggestion';
  }
}

/**
 * Get color for classification
 */
export function getClassificationColor(classification: FindingClassification): string {
  switch (classification) {
    case 'statutory':
      return 'red';
    case 'good_practice':
      return 'amber';
    case 'contractor_suggestion':
      return 'blue';
  }
}

/**
 * Get Tailwind classes for classification badge
 */
export function getClassificationBadgeClasses(classification: FindingClassification): string {
  const colors: Record<FindingClassification, string> = {
    statutory: 'bg-red-100 text-red-800 border-red-200',
    good_practice: 'bg-amber-100 text-amber-800 border-amber-200',
    contractor_suggestion: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return `inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${colors[classification]}`;
}
