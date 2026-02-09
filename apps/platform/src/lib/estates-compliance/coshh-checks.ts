/**
 * COSHH (Control of Substances Hazardous to Health) Compliance Checks
 *
 * Contains all COSHH-related statutory and good practice checks for UK schools.
 * Based on HSE COSHH Regulations 2002 and education-specific requirements.
 */

import type { StatutoryCheck } from './statutory-checks';

export type COSHHDomain = 'coshh';

/**
 * COSHH compliance checks database
 */
export const COSHH_CHECKS: StatutoryCheck[] = [
  // ============================================================
  // RISK ASSESSMENT
  // ============================================================
  {
    id: 'coshh_risk_assessment_review',
    domain: 'coshh',
    name: 'Annual COSHH Risk Assessment Review',
    description: 'Review and update all COSHH risk assessments for hazardous substances used on site, including cleaning chemicals, science materials, and D&T supplies',
    category: 'statutory',
    frequency: 'annually',
    reference: 'COSHH Regulations 2002, Regulation 6',
    referenceUrl: 'https://www.legislation.gov.uk/ukdsi/2002/1177/contents/made',
    estimatedDuration: 120,
    evidenceRequired: [
      'Updated COSHH risk assessments',
      'Inventory of hazardous substances',
      'Review sign-off sheet',
    ],
    notes: 'Must consider any new substances introduced and changes to usage patterns',
  },
  {
    id: 'coshh_inventory_update',
    domain: 'coshh',
    name: 'COSHH Inventory Update',
    description: 'Update the comprehensive inventory of all hazardous substances stored and used on site',
    category: 'statutory',
    frequency: 'termly',
    reference: 'COSHH Regulations 2002',
    referenceUrl: 'https://www.hse.gov.uk/coshh/',
    estimatedDuration: 60,
    evidenceRequired: [
      'Updated substance inventory',
      'Location register for storage areas',
    ],
  },

  // ============================================================
  // SAFETY DATA SHEETS
  // ============================================================
  {
    id: 'coshh_sds_accessibility_check',
    domain: 'coshh',
    name: 'Safety Data Sheets Accessibility Check',
    description: 'Verify that current Safety Data Sheets (SDS) are accessible for all hazardous substances and located near points of use',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'REACH Regulation 2006',
    referenceUrl: 'https://www.hse.gov.uk/reach/',
    estimatedDuration: 30,
    evidenceRequired: [
      'SDS accessibility checklist',
      'SDS register',
      'Evidence of SDS location (photos)',
    ],
    notes: 'SDS must be available in languages understood by staff using the substances',
  },
  {
    id: 'coshh_sds_currency',
    domain: 'coshh',
    name: 'Safety Data Sheets Currency Check',
    description: 'Check that all SDS are current (within last 5 years) and obtained from suppliers',
    category: 'statutory',
    frequency: 'termly',
    reference: 'REACH Regulation 2006',
    referenceUrl: 'https://www.hse.gov.uk/reach/',
    estimatedDuration: 45,
    evidenceRequired: [
      'SDS review log',
      'Updated SDS where required',
    ],
  },

  // ============================================================
  // TRAINING
  // ============================================================
  {
    id: 'coshh_staff_training_records',
    domain: 'coshh',
    name: 'COSHH Training Records Review',
    description: 'Review and verify that all staff using hazardous substances have received appropriate COSHH training',
    category: 'statutory',
    frequency: 'termly',
    reference: 'COSHH Regulations 2002, Regulation 12',
    referenceUrl: 'https://www.legislation.gov.uk/ukdsi/2002/1177/contents/made',
    estimatedDuration: 30,
    evidenceRequired: [
      'Training matrix',
      'Training certificates',
      'Sign-off sheets',
    ],
    notes: 'Include site staff, science technicians, D&T staff, and cleaning staff',
  },
  {
    id: 'coshh_training_refresher',
    domain: 'coshh',
    name: 'COSHH Refresher Training',
    description: 'Deliver annual COSHH awareness refresher training to relevant staff',
    category: 'statutory',
    frequency: 'annually',
    reference: 'COSHH Regulations 2002',
    referenceUrl: 'https://www.hse.gov.uk/coshh/',
    estimatedDuration: 60,
    evidenceRequired: [
      'Training attendance records',
      'Training materials used',
    ],
  },

  // ============================================================
  // STORAGE AND SECURITY
  // ============================================================
  {
    id: 'coshh_storage_security_check',
    domain: 'coshh',
    name: 'COSHH Storage Security Inspection',
    description: 'Inspect all hazardous substance storage areas for security, ventilation, spill containment, and compatibility',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'COSHH Regulations 2002, Regulation 7',
    referenceUrl: 'https://www.legislation.gov.uk/ukdsi/2002/1177/contents/made',
    estimatedDuration: 30,
    evidenceRequired: [
      'Storage inspection checklist',
      'Photos of any issues found',
    ],
    notes: 'Check chemical stores, science prep rooms, D&T stores, and cleaning cupboards',
  },
  {
    id: 'coshh_chemical_compatibility',
    domain: 'coshh',
    name: 'Chemical Compatibility Audit',
    description: 'Audit chemical storage to ensure incompatible substances are segregated correctly',
    category: 'statutory',
    frequency: 'termly',
    reference: 'HSE HSG71',
    referenceUrl: 'https://www.hse.gov.uk/pubns/priced/hsg71.htm',
    estimatedDuration: 60,
    requiresQualification: 'Science technician/Chemical safety trained',
    evidenceRequired: [
      'Storage audit report',
      'Corrective actions if needed',
    ],
  },

  // ============================================================
  // EMERGENCY EQUIPMENT
  // ============================================================
  {
    id: 'coshh_spill_kits_check',
    domain: 'coshh',
    name: 'Spill Kit Inspection',
    description: 'Check all spill kits are complete, in date, and located appropriately',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'COSHH Regulations 2002',
    referenceUrl: 'https://www.hse.gov.uk/coshh/',
    estimatedDuration: 20,
    evidenceRequired: [
      'Spill kit inspection record',
      'Inventory of contents',
    ],
  },
  {
    id: 'coshh_eye_wash_check',
    domain: 'coshh',
    name: 'Emergency Eye Wash Station Check',
    description: 'Weekly test and inspection of emergency eye wash stations in science areas and D&T workshops',
    category: 'statutory',
    frequency: 'weekly',
    reference: 'HSE HSG258',
    referenceUrl: 'https://www.hse.gov.uk/pubns/priced/hsg258.htm',
    estimatedDuration: 10,
    evidenceRequired: [
      'Weekly test log',
    ],
    notes: 'Test for at least 3 minutes to flush stagnant water',
  },

  // ============================================================
  // DISPOSAL
  // ============================================================
  {
    id: 'coshh_disposal_records',
    domain: 'coshh',
    name: 'Hazardous Waste Disposal Records Review',
    description: 'Review records of hazardous waste disposal to ensure compliance with waste regulations',
    category: 'statutory',
    frequency: 'termly',
    reference: 'Hazardous Waste Regulations 2005',
    referenceUrl: 'https://www.legislation.gov.uk/ukdsi/2005/894/contents/made',
    estimatedDuration: 30,
    evidenceRequired: [
      'Waste transfer notes',
      'Consignment notes where applicable',
      'Disposal certificates',
    ],
  },
];

/**
 * Get all COSHH checks
 */
export function getCOSHHChecks(): StatutoryCheck[] {
  return COSHH_CHECKS;
}

/**
 * Get COSHH checks by frequency
 */
export function getCOSHHChecksByFrequency(frequency: string): StatutoryCheck[] {
  return COSHH_CHECKS.filter(check => check.frequency === frequency);
}
