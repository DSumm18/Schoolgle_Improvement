/**
 * Food Safety Compliance Checks
 *
 * Contains all food safety-related statutory and good practice checks for UK schools.
 * Based on Food Safety Act 1990, Food Hygiene Regulations 2006, and school-specific requirements.
 */

import type { StatutoryCheck } from './statutory-checks';

export type FoodSafetyDomain = 'food_safety';

/**
 * Food safety compliance checks database
 */
export const FOOD_SAFETY_CHECKS: StatutoryCheck[] = [
  // ============================================================
  // HACCP AND DOCUMENTATION
  // ============================================================
  {
    id: 'food_haccp_review',
    domain: 'food_safety',
    name: 'HACCP Documentation Review',
    description: 'Review and update HACCP (Hazard Analysis Critical Control Point) food safety management system documentation',
    category: 'statutory',
    frequency: 'annually',
    reference: 'Food Hygiene Regulations 2006, Regulation 4',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2006/14/contents/made',
    estimatedDuration: 120,
    evidenceRequired: [
      'Updated HACCP documentation',
      'Food safety management procedures',
      'Review sign-off',
    ],
    notes: 'Must include any menu changes, new equipment, or process changes',
  },
  {
    id: 'food_safety_file_check',
    domain: 'food_safety',
    name: 'Food Safety File Currency Check',
    description: 'Verify the food safety management file (SFBB pack) is complete and current',
    category: 'statutory',
    frequency: 'termly',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.food.gov.uk/business-industry/sfbb',
    estimatedDuration: 45,
    evidenceRequired: [
      'SFBB pack review checklist',
      'Updated diary sheets',
    ],
  },

  // ============================================================
  // TEMPERATURE MONITORING
  // ============================================================
  {
    id: 'food_temperature_records_audit',
    domain: 'food_safety',
    name: 'Temperature Records Audit',
    description: 'Audit fridge, freezer, and hot-hold temperature records for completeness and compliance',
    category: 'statutory',
    frequency: 'weekly',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.food.gov.uk/business-industry/temperature',
    estimatedDuration: 15,
    evidenceRequired: [
      'Temperature record sheets',
      'Audit log identifying any gaps',
    ],
    notes: 'Fridges 0-5C, freezers -18C or below, hot-hold 63C or above',
  },
  {
    id: 'food_fridge_monitoring',
    domain: 'food_safety',
    name: 'Fridge/Freezer Monitoring Equipment Check',
    description: 'Check that all temperature monitoring equipment is calibrated and functioning correctly',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.food.gov.uk/business-industry/temperature',
    estimatedDuration: 20,
    evidenceRequired: [
      'Equipment check log',
      'Calibration certificate for probes',
    ],
  },
  {
    id: 'food_probe_thermometer_check',
    domain: 'food_safety',
    name: 'Probe Thermometer Validation',
    description: 'Weekly verification check of probe thermometers using ice point and boiling water methods',
    category: 'statutory',
    frequency: 'weekly',
    reference: 'Food Standards Agency guidance',
    referenceUrl: 'https://www.food.gov.uk/business-industry/temperature',
    estimatedDuration: 10,
    evidenceRequired: [
      'Probe validation log',
    ],
  },

  // ============================================================
  // FOOD HYGIENE RATING
  // ============================================================
  {
    id: 'food_fh_rating_expiry_check',
    domain: 'food_safety',
    name: 'Food Hygiene Rating Expiry Check',
    description: 'Check when the next Food Hygiene Rating inspection is due and plan for compliance',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'Food Hygiene Rating Act 2013',
    referenceUrl: 'https://www.food.gov.uk/business-industry/ratings',
    estimatedDuration: 15,
    evidenceRequired: [
      'Current rating certificate',
      'Last inspection date reminder',
    ],
    notes: 'Local authorities inspect on varying schedules - typically every 6 months to 2 years based on risk',
  },
  {
    id: 'food_pre_inspection_audit',
    domain: 'food_safety',
    name: 'Pre-Inspection Internal Audit',
    description: 'Conduct internal audit in preparation for Food Hygiene Rating inspection',
    category: 'good_practice',
    frequency: 'termly',
    reference: 'Food Standards Agency guidance',
    referenceUrl: 'https://www.food.gov.uk/business-industry/ratings',
    estimatedDuration: 120,
    evidenceRequired: [
      'Internal audit report',
      'Action plan for any improvements',
    ],
  },

  // ============================================================
  // CLEANING AND SANITISATION
  // ============================================================
  {
    id: 'food_kitchen_deep_clean',
    domain: 'food_safety',
    name: 'Kitchen Deep Clean Inspection',
    description: 'Inspect and verify completion of scheduled kitchen deep clean (behind equipment, ventilation, drains)',
    category: 'statutory',
    frequency: 'termly',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.food.gov.uk/business-industry/cleaning',
    estimatedDuration: 60,
    evidenceRequired: [
      'Deep clean checklist',
      'Before/after photos of key areas',
      'Contractor invoice if outsourced',
    ],
  },
  {
    id: 'food_cleaning_schedule_review',
    domain: 'food_safety',
    name: 'Cleaning Schedule Review',
    description: 'Review and update the kitchen cleaning schedule to ensure all areas are covered',
    category: 'statutory',
    frequency: 'termly',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.food.gov.uk/business-industry/cleaning',
    estimatedDuration: 30,
    evidenceRequired: [
      'Updated cleaning schedule',
      'Daily cleaning record sheets',
    ],
  },

  // ============================================================
  // PEST CONTROL
  // ============================================================
  {
    id: 'food_pest_control_inspection',
    domain: 'food_safety',
    name: 'Pest Control Inspection Report Review',
    description: 'Review pest control inspection reports and verify any required actions are completed',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.food.gov.uk/business-industry/pestcontrol',
    estimatedDuration: 15,
    evidenceRequired: [
      'Pest control inspection report',
      'Evidence of any remedial actions',
    ],
    notes: 'May be more frequent depending on contract',
  },
  {
    id: 'food_pest_control_bait_check',
    domain: 'food_safety',
    name: 'Internal Pest Control Check',
    description: 'Visual check for signs of pests and verification of bait box/monitor status',
    category: 'statutory',
    frequency: 'weekly',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.food.gov.uk/business-industry/pestcontrol',
    estimatedDuration: 15,
    evidenceRequired: [
      'Weekly check log',
    ],
  },

  // ============================================================
  // STOCK MANAGEMENT
  // ============================================================
  {
    id: 'food_stock_rotation_audit',
    domain: 'food_safety',
    name: 'Stock Rotation and Date Coding Audit',
    description: 'Audit food storage areas to ensure FIFO (first in, first out) and date coding procedures are followed',
    category: 'statutory',
    frequency: 'weekly',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.food.gov.uk/business-industry/stock',
    estimatedDuration: 20,
    evidenceRequired: [
      'Stock audit log',
      'Any expired items identified and removed',
    ],
  },
  {
    id: 'food_allergen_review',
    domain: 'food_safety',
    name: 'Allergen Information Review',
    description: 'Review allergen information for menu items and ensure staff are trained on allergen management',
    category: 'statutory',
    frequency: 'termly',
    reference: 'Food Information Regulations 2014',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2014/1855/contents/made',
    estimatedDuration: 60,
    evidenceRequired: [
      'Allergen matrix for menu',
      'Staff training records on allergens',
    ],
  },

  // ============================================================
  // STAFF TRAINING AND HEALTH
  // ============================================================
  {
    id: 'food_staff_training_records',
    domain: 'food_safety',
    name: 'Food Safety Training Records Review',
    description: 'Verify all food handling staff have current, appropriate food safety training',
    category: 'statutory',
    frequency: 'termly',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.food.gov.uk/business-industry/training',
    estimatedDuration: 30,
    evidenceRequired: [
      'Training matrix',
      'Training certificates',
      'Refresher training dates',
    ],
    notes: 'Level 2 for food handlers, Level 3 for supervisors/managers',
  },
  {
    id: 'food_medical_fitness',
    domain: 'food_safety',
    name: 'Staff Medical Fitness Records',
    description: 'Review records to ensure food handlers are medically fit to handle food',
    category: 'statutory',
    frequency: 'annually',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.food.gov.uk/business-industry/health',
    estimatedDuration: 30,
    evidenceRequired: [
      'Staff fitness declaration records',
    ],
  },

  // ============================================================
  // EQUIPMENT
  // ============================================================
  {
    id: 'food_equipment_calibration',
    domain: 'food_safety',
    name: 'Kitchen Equipment Calibration Check',
    description: 'Check calibration of ovens, dishwashers, and other critical kitchen equipment',
    category: 'statutory',
    frequency: 'termly',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.food.gov.uk/business-industry/equipment',
    estimatedDuration: 45,
    evidenceRequired: [
      'Equipment check log',
      'Service certificates where applicable',
    ],
    notes: 'Dishwashers must reach 71C for sanitisation cycle',
  },
  {
    id: 'food_equipment_condition',
    domain: 'food_safety',
    name: 'Kitchen Equipment Condition Inspection',
    description: 'Inspect kitchen equipment for damage, wear, or contamination risks',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'Food Hygiene Regulations 2006',
    referenceUrl: 'https://www.food.gov.uk/business-industry/equipment',
    estimatedDuration: 30,
    evidenceRequired: [
      'Equipment inspection log',
      'Photos of any defects',
    ],
  },
];

/**
 * Get all food safety checks
 */
export function getFoodSafetyChecks(): StatutoryCheck[] {
  return FOOD_SAFETY_CHECKS;
}

/**
 * Get food safety checks by frequency
 */
export function getFoodSafetyChecksByFrequency(frequency: string): StatutoryCheck[] {
  return FOOD_SAFETY_CHECKS.filter(check => check.frequency === frequency);
}
