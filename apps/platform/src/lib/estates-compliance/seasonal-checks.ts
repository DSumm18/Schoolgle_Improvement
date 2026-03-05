/**
 * Seasonal Compliance Checks
 *
 * Contains all seasonal maintenance and compliance checks for UK schools.
 * Organised by season with specific tasks for autumn, winter, spring, and summer periods.
 */

import type { StatutoryCheck } from './statutory-checks';

export type SeasonalDomain = 'seasonal';

/**
 * Seasonal compliance checks database
 */
export const SEASONAL_CHECKS: StatutoryCheck[] = [
  // ============================================================
  // AUTUMN (September - November)
  // ============================================================
  {
    id: 'seas_autumn_heating_check',
    domain: 'seasonal',
    name: 'Autumn: Pre-Winter Heating System Check',
    description: 'Full test of heating system before winter to ensure all boilers, pumps, and controls are functioning',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Workplace (Health, Safety and Welfare) Regulations 1992',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/1992/3004/contents/made',
    estimatedDuration: 120,
    evidenceRequired: [
      'Heating system test report',
      'Contractor service report if applicable',
      'Temperature readings from all zones',
    ],
    notes: 'Schedule for September/Otober, allow time for repairs before cold weather',
  },
  {
    id: 'seas_autumn_gutter_cleaning',
    domain: 'seasonal',
    name: 'Autumn: Gutter Cleaning and Inspection',
    description: 'Clean all gutters, downpipes, and gullies to prevent blockages and water damage during winter',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Building Regulations Part H',
    referenceUrl: 'https://www.gov.uk/government/collections/approved-documents',
    estimatedDuration: 180,
    evidenceRequired: [
      'Gutter cleaning log',
      'Before/after photos if significant debris found',
      'Contractor invoice if outsourced',
    ],
    notes: 'Complete after leaves have fallen but before winter rains',
  },
  {
    id: 'seas_autumn_roof_inspection',
    domain: 'seasonal',
    name: 'Autumn: Roof Inspection',
    description: 'Inspect roof for loose tiles, slates, flashings, and damage before winter weather',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Construction (Design and Management) Regulations 2015',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2015/51/contents/made',
    estimatedDuration: 60,
    requiresQualification: 'Competent person at height',
    evidenceRequired: [
      'Roof inspection report',
      'Photos of any defects',
      'Repair schedule if needed',
    ],
    notes: 'Use drone or binocular inspection if safe access not possible',
  },
  {
    id: 'seas_autumn_external_lights',
    domain: 'seasonal',
    name: 'Autumn: External Lighting Check',
    description: 'Test all external lighting as daylight hours decrease',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Workplace Regulations 1992',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/1992/3004/contents/made',
    estimatedDuration: 60,
    evidenceRequired: [
      'External lighting test log',
      'List of failed units for replacement',
    ],
    notes: 'Check security lights, path lights, playground lighting',
  },
  {
    id: 'seas_autumn_leaf_risks',
    domain: 'seasonal',
    name: 'Autumn: Slip Hazard Assessment',
    description: 'Assess and manage slip risks from fallen leaves on paths, entrances, and playgrounds',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Workplace Regulations 1992',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/1992/3004/contents/made',
    estimatedDuration: 30,
    evidenceRequired: [
      'Risk assessment review',
      'Cleaning schedule for paths',
    ],
  },

  // ============================================================
  // WINTER (December - February)
  // ============================================================
  {
    id: 'seas_winter_grit_stock',
    domain: 'seasonal',
    name: 'Winter: Grit and Snow Equipment Stock Check',
    description: 'Check stock of grit/salt, snow shovels, and snow clearance equipment is adequate',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Workplace Regulations 1992',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/1992/3004/contents/made',
    estimatedDuration: 30,
    evidenceRequired: [
      'Grit stock level log',
      'Equipment inventory',
      'Reorder trigger levels',
    ],
    notes: 'Check monthly during winter season',
  },
  {
    id: 'seas_winter_pipe_lagging',
    domain: 'seasonal',
    name: 'Winter: Pipe Lagging Inspection',
    description: 'Inspect lagging on exposed pipes, tanks, and loft spaces to prevent freezing',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Water Supply (Water Fittings) Regulations 1999',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/1999/1148/contents/made',
    estimatedDuration: 60,
    evidenceRequired: [
      'Pipe lagging inspection report',
      'Photos of any deficiencies',
      'Record of repairs/improvements',
    ],
    notes: 'Pay special attention to external pipes and unheated areas',
  },
  {
    id: 'seas_winter_stopcock_check',
    domain: 'seasonal',
    name: 'Winter: Stopcock and Main Valve Check',
    description: 'Locate test main stopcocks and isolation valves to ensure they function in case of burst pipe',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Water Supply Regulations 1999',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/1999/1148/contents/made',
    estimatedDuration: 45,
    evidenceRequired: [
      'Stopcock location map',
      'Test operation log',
    ],
    notes: 'Ensure staff know locations and operation',
  },
  {
    id: 'seas_winter_drainage',
    domain: 'seasonal',
    name: 'Winter: Drainage Channel Check',
    description: 'Check drainage channels, gullies, and French drains for blockages',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Building Regulations Part H',
    referenceUrl: 'https://www.gov.uk/government/collections/approved-documents',
    estimatedDuration: 60,
    evidenceRequired: [
      'Drainage inspection log',
      'Photos of any issues',
    ],
    notes: 'Important to prevent flooding during heavy rain',
  },
  {
    id: 'seas_winter_insulation',
    domain: 'seasonal',
    name: 'Winter: Building Insulation Check',
    description: 'Check door seals, window seals, and draught exclusion to maintain warmth',
    category: 'good_practice',
    frequency: 'ad_hoc',
    reference: 'Building Regulations Part L',
    referenceUrl: 'https://www.gov.uk/government/collections/approved-documents',
    estimatedDuration: 60,
    evidenceRequired: [
      'Inspection report',
      'List of areas needing attention',
    ],
  },

  // ============================================================
  // SPRING (March - May)
  // ============================================================
  {
    id: 'seas_spring_winter_damage',
    domain: 'seasonal',
    name: 'Spring: Post-Winter Damage Inspection',
    description: 'Inspect buildings and grounds for winter damage (cracked pipes, roof damage, path damage)',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Construction (Design and Management) Regulations 2015',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2015/51/contents/made',
    estimatedDuration: 120,
    evidenceRequired: [
      'Damage inspection report',
      'Photos of damage',
      'Repair schedule and costings',
    ],
    notes: 'Complete before growing season obscures access',
  },
  {
    id: 'seas_spring_tree_safety',
    domain: 'seasonal',
    name: 'Spring: Tree Safety Inspection',
    description: 'Inspect trees for damage, disease, and stability before leaf canopy fully develops',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Occupiers\' Liability Act 1957',
    referenceUrl: 'https://www.legislation.gov.uk/ukpga/Eliz2/5-6/29/contents',
    estimatedDuration: 120,
    requiresQualification: 'Arboriculturist for detailed assessment',
    evidenceRequired: [
      'Tree inspection report',
      'Arborist report if concerns',
      'Work schedule for any remedial action',
    ],
    notes: 'Focus on trees near buildings, playgrounds, and paths',
  },
  {
    id: 'seas_spring_playground_prep',
    domain: 'seasonal',
    name: 'Spring: Playground Preparation',
    description: 'Deep inspection and preparation of playground equipment for increased use in better weather',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'PUWER 1998',
    referenceUrl: 'https://www.legislation.gov.uk/ukpga/1998/37/contents',
    estimatedDuration: 120,
    evidenceRequired: [
      'Playground inspection report',
      'Risk assessment update',
      'Equipment service record',
    ],
    notes: 'Check surfacing, equipment fixings, and wear',
  },
  {
    id: 'seas_spring_external_decor',
    domain: 'seasonal',
    name: 'Spring: External Decoration Survey',
    description: 'Survey external decoration needs and plan painting/maintenance for summer',
    category: 'good_practice',
    frequency: 'ad_hoc',
    reference: 'Building maintenance best practice',
    referenceUrl: '',
    estimatedDuration: 60,
    evidenceRequired: [
      'Decoration survey report',
      'Prioritised schedule',
    ],
  },
  {
    id: 'seas_spring_pest_control_start',
    domain: 'seasonal',
    name: 'Spring: Pest Control Season Start',
    description: 'Increase pest control monitoring and treatment as pest activity increases with warmer weather',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2006/14/contents/made',
    estimatedDuration: 30,
    evidenceRequired: [
      'Pest control schedule review',
      'Increased monitoring frequency',
    ],
    notes: 'Important for food areas and waste storage',
  },

  // ============================================================
  // SUMMER (June - August)
  // ============================================================
  {
    id: 'seas_summer_holiday_security',
    domain: 'seasonal',
    name: 'Summer: Holiday Security Preparation',
    description: 'Review and enhance security arrangements for school holiday periods',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Independent School Standards 2014',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2014/3283/contents/made',
    estimatedDuration: 60,
    evidenceRequired: [
      'Security review report',
      'Holiday security checklist',
      'Key holder arrangements',
    ],
    notes: 'Consider increased CCTV patrols, alarm upgrades, access restrictions',
  },
  {
    id: 'seas_summer_contractor_works',
    domain: 'seasonal',
    name: 'Summer: Major Works Planning',
    description: 'Plan and schedule major maintenance and improvement works for summer break',
    category: 'good_practice',
    frequency: 'ad_hoc',
    reference: 'Construction (Design and Management) Regulations 2015',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2015/51/contents/made',
    estimatedDuration: 180,
    evidenceRequired: [
      'Summer works schedule',
      'Risk assessments for works',
      'Contractor arrangements',
    ],
    notes: 'Best time for disruptive works',
  },
  {
    id: 'seas_summer_pest_control_full',
    domain: 'seasonal',
    name: 'Summer: Full Pest Control Treatment',
    description: 'Schedule comprehensive pest control treatment during summer break',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2006/14/contents/made',
    estimatedDuration: 30,
    evidenceRequired: [
      'Pest control treatment schedule',
      'Treatment reports',
    ],
  },
  {
    id: 'seas_summer_external_maintenance',
    domain: 'seasonal',
    name: 'Summer: External Maintenance Works',
    description: 'Schedule external painting, pointing, and fabric repairs during good weather',
    category: 'statutory',
    frequency: 'ad_hoc',
    reference: 'Building maintenance best practice',
    referenceUrl: '',
    estimatedDuration: 0, // Variable duration
    evidenceRequired: [
      'Works schedule',
      'Completion records',
      'Before/after photos',
    ],
    notes: 'Best weather conditions for external works',
  },
  {
    id: 'seas_summer_cooling_systems',
    domain: 'seasonal',
    name: 'Summer: Cooling Systems Check',
    description: 'Service and test air conditioning and cooling systems before hot weather',
    category: 'good_practice',
    frequency: 'ad_hoc',
    reference: 'Workplace Regulations 1992',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/1992/3004/contents/made',
    estimatedDuration: 60,
    evidenceRequired: [
      'Cooling system service records',
      'Temperature check logs',
    ],
  },

  // ============================================================
  // YEAR-ROUND CHECKS
  // ============================================================
  {
    id: 'seas_seasonal_plan_review',
    domain: 'seasonal',
    name: 'Seasonal Maintenance Plan Review',
    description: 'Annual review and update of the seasonal maintenance calendar',
    category: 'statutory',
    frequency: 'annually',
    reference: 'Building maintenance best practice',
    referenceUrl: '',
    estimatedDuration: 120,
    evidenceRequired: [
      'Updated seasonal maintenance calendar',
      'Review notes and lessons learned',
    ],
    notes: 'Review at start of academic year or during summer',
  },
  {
    id: 'seas_weather_monitoring',
    domain: 'seasonal',
    name: 'Weather Warning Monitoring',
    description: 'Verify procedures for monitoring and responding to severe weather warnings',
    category: 'statutory',
    frequency: 'termly',
    reference: 'Education (School Day and School Year) (England) Regulations 1999',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/1999/3083/contents/made',
    estimatedDuration: 30,
    evidenceRequired: [
      'Weather monitoring procedures',
      'Communication plan test',
    ],
    notes: 'Essential for snow, heatwave, and wind events',
  },
];

/**
 * Get all seasonal checks
 */
export function getSeasonalChecks(): StatutoryCheck[] {
  return SEASONAL_CHECKS;
}

/**
 * Get seasonal checks by season
 */
export function getSeasonalChecksBySeason(season: 'autumn' | 'winter' | 'spring' | 'summer'): StatutoryCheck[] {
  return SEASONAL_CHECKS.filter(check => check.id.startsWith(`seas_${season}`));
}

/**
 * Get seasonal checks by frequency
 */
export function getSeasonalChecksByFrequency(frequency: string): StatutoryCheck[] {
  return SEASONAL_CHECKS.filter(check => check.frequency === frequency);
}
