/**
 * Safeguarding and Site Security Compliance Checks
 *
 * Contains all safeguarding and site security-related statutory and good practice checks for UK schools.
 * Based on Keeping Children Safe in Education, Independent School Standards, and security best practice.
 */

import type { StatutoryCheck } from './statutory-checks';

export type SafeguardingDomain = 'safeguarding';

/**
 * Safeguarding and site security compliance checks database
 */
export const SAFEGUARDING_CHECKS: StatutoryCheck[] = [
  // ============================================================
  // HIDDEN AREAS INSPECTION
  // ============================================================
  {
    id: 'saf_hidden_areas_inspection',
    domain: 'safeguarding',
    name: 'Weekly Hidden Areas Inspection',
    description: 'Inspect all hidden areas of the site to ensure no evidence of unauthorized access, antisocial behavior, or safeguarding concerns',
    category: 'statutory',
    frequency: 'weekly',
    reference: 'KCSIE 2024, Independent School Standards',
    referenceUrl: 'https://www.gov.uk/government/publications/keeping-children-safe-in-education-2024',
    estimatedDuration: 30,
    evidenceRequired: [
      'Hidden areas inspection checklist',
      'Photos of any concerns found',
      'Action log for any issues',
    ],
    notes: 'Include behind buildings, storage areas, outbuildings, wooded areas, blind spots',
  },
  {
    id: 'saf_hidden_areas_register',
    domain: 'safeguarding',
    name: 'Hidden Areas Register Review',
    description: 'Review and update the register of hidden areas that require regular monitoring',
    category: 'statutory',
    frequency: 'termly',
    reference: 'KCSIE 2024',
    referenceUrl: 'https://www.gov.uk/government/publications/keeping-children-safe-in-education-2024',
    estimatedDuration: 45,
    evidenceRequired: [
      'Updated hidden areas register',
      'Site map with risk areas highlighted',
    ],
  },

  // ============================================================
  // PERIMETER SECURITY
  // ============================================================
  {
    id: 'saf_perimeter_audit',
    domain: 'safeguarding',
    name: 'Monthly Perimeter Security Audit',
    description: 'Audit perimeter fencing, gates, walls, and boundaries for security, damage, and unauthorized access points',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'Independent School Standards 2014',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2014/3283/contents/made',
    estimatedDuration: 45,
    evidenceRequired: [
      'Perimeter audit checklist',
      'Photos of any damage or concerns',
      'Repair schedule if needed',
    ],
    notes: 'Check for gaps, holes, loose fencing, climbable points',
  },
  {
    id: 'saf_gate_security_check',
    domain: 'safeguarding',
    name: 'Weekly Gate and Lock Check',
    description: 'Check all gates and access points are secure, locks function correctly, and keys are accounted for',
    category: 'statutory',
    frequency: 'weekly',
    reference: 'Independent School Standards 2014',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2014/3283/contents/made',
    estimatedDuration: 20,
    evidenceRequired: [
      'Gate and lock inspection log',
      'Key register check',
    ],
  },

  // ============================================================
  // LOCKDOWN EQUIPMENT
  // ============================================================
  {
    id: 'saf_lockdown_equipment_check',
    domain: 'safeguarding',
    name: 'Lockdown Equipment Termly Check',
    description: 'Check all lockdown equipment including locks, blinds, communication systems, and designated safe areas',
    category: 'statutory',
    frequency: 'termly',
    reference: 'KCSIE 2024, Emergency planning guidance',
    referenceUrl: 'https://www.gov.uk/government/publications/keeping-children-safe-in-education-2024',
    estimatedDuration: 60,
    evidenceRequired: [
      'Lockdown equipment checklist',
      'Test of lockdown communication system',
      'Photos of safe areas',
    ],
    notes: 'Include door locks, window blinds, lockdown alarms, PA system',
  },
  {
    id: 'saf_lockdown_drill_log',
    domain: 'safeguarding',
    name: 'Lockdown Drill Review',
    description: 'Review records of lockdown drills and update procedures based on lessons learned',
    category: 'statutory',
    frequency: 'termly',
    reference: 'KCSIE 2024',
    referenceUrl: 'https://www.gov.uk/government/publications/keeping-children-safe-in-education-2024',
    estimatedDuration: 30,
    evidenceRequired: [
      'Lockdown drill records',
      'Procedure updates if applicable',
    ],
    notes: 'At least one lockdown drill per academic year recommended',
  },

  // ============================================================
  // VISITOR MANAGEMENT
  // ============================================================
  {
    id: 'saf_visitor_signin_check',
    domain: 'safeguarding',
    name: 'Visitor Sign-In System Termly Check',
    description: 'Test and review visitor sign-in system, badges, DBS checking process, and visitor protocols',
    category: 'statutory',
    frequency: 'termly',
    reference: 'KCSIE 2024',
    referenceUrl: 'https://www.gov.uk/government/publications/keeping-children-safe-in-education-2024',
    estimatedDuration: 45,
    evidenceRequired: [
      'Visitor system test log',
      'Visitor book samples (anonymised)',
      'Badge stock check',
    ],
    notes: 'Include testing of electronic systems if used',
  },
  {
    id: 'saf_visitor_records_audit',
    domain: 'safeguarding',
    name: 'Visitor Records Weekly Spot Check',
    description: 'Random weekly check of visitor records to ensure procedures are being followed',
    category: 'good_practice',
    frequency: 'weekly',
    reference: 'KCSIE 2024',
    referenceUrl: 'https://www.gov.uk/government/publications/keeping-children-safe-in-education-2024',
    estimatedDuration: 15,
    evidenceRequired: [
      'Spot check log',
    ],
  },

  // ============================================================
  // CCTV AND SURVEILLANCE
  // ============================================================
  {
    id: 'saf_cctv_functionality_test',
    domain: 'safeguarding',
    name: 'CCTV System Monthly Test',
    description: 'Test CCTV cameras are recording, storage is functional, and retention period is adequate',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'Data Protection Act 2018',
    referenceUrl: 'https://www.legislation.gov.uk/ukpga/2018/12/contents',
    estimatedDuration: 30,
    evidenceRequired: [
      'CCTV test log',
      'Camera status report',
    ],
    notes: 'Check for blind spots and camera positioning annually',
  },
  {
    id: 'saf_cctv_retention_check',
    domain: 'safeguarding',
    name: 'CCTV Retention Policy Review',
    description: 'Review CCTV retention policy and verify compliance with data protection requirements',
    category: 'statutory',
    frequency: 'annually',
    reference: 'Data Protection Act 2018, ICO CCTV code',
    referenceUrl: 'https://www.ico.org.uk/for-organisations/cctv',
    estimatedDuration: 30,
    evidenceRequired: [
      'Retirement policy review notes',
      'Data protection compliance check',
    ],
  },

  // ============================================================
  // ALARM SYSTEMS
  // ============================================================
  {
    id: 'saf_intruder_alarm_test',
    domain: 'safeguarding',
    name: 'Intruder Alarm Weekly Test',
    description: 'Weekly test of intruder alarm system to ensure proper functionality',
    category: 'statutory',
    frequency: 'weekly',
    reference: 'Insurance requirements, BS EN 50131',
    referenceUrl: 'https://www.bsi.group.com/en-GB/standards/',
    estimatedDuration: 15,
    evidenceRequired: [
      'Alarm test log',
      'Engineer report if faults found',
    ],
  },
  {
    id: 'saf_alarm_service_check',
    domain: 'safeguarding',
    name: 'Alarm System Service Record Check',
    description: 'Verify intruder alarm has been serviced according to schedule (usually annually)',
    category: 'statutory',
    frequency: 'annually',
    reference: 'BS EN 50131',
    referenceUrl: 'https://www.bsi.group.com/en-GB/standards/',
    estimatedDuration: 20,
    evidenceRequired: [
      'Service certificate',
      'Engineer report',
    ],
  },

  // ============================================================
  // LIGHTING
  // ============================================================
  {
    id: 'saf_security_lighting_check',
    domain: 'safeguarding',
    name: 'Security Lighting Monthly Check',
    description: 'Check all external security lighting is functional and positioned correctly',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'Independent School Standards 2014',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2014/3283/contents/made',
    estimatedDuration: 30,
    evidenceRequired: [
      'Lighting check log',
      'List of any failed units',
    ],
    notes: 'Include motion sensor lights and floodlights',
  },

  // ============================================================
  // KEY CONTROL
  // ============================================================
  {
    id: 'saf_key_register_audit',
    domain: 'safeguarding',
    name: 'Key Register Termly Audit',
    description: 'Audit key register to ensure all keys are accounted for and access levels are appropriate',
    category: 'statutory',
    frequency: 'termly',
    reference: 'Independent School Standards 2014',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2014/3283/contents/made',
    estimatedDuration: 45,
    evidenceRequired: [
      'Key register audit',
      'Evidence of key returns from leavers',
    ],
  },
  {
    id: 'saf_key_holder_list',
    domain: 'safeguarding',
    name: 'Key Holder List Review',
    description: 'Review and update key holder and emergency contact list',
    category: 'statutory',
    frequency: 'termly',
    reference: 'Independent School Standards 2014',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2014/3283/contents/made',
    estimatedDuration: 30,
    evidenceRequired: [
      'Updated key holder list',
      'Confirmation of contact details',
    ],
  },

  // ============================================================
  // SITE ACCESSIBILITY
  // ============================================================
  {
    id: 'saf_site_access_review',
    domain: 'safeguarding',
    name: 'Site Accessibility Review',
    description: 'Review site access points, pedestrian routes, and vehicle access for safety concerns',
    category: 'statutory',
    frequency: 'termly',
    reference: 'Independent School Standards 2014',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2014/3283/contents/made',
    estimatedDuration: 60,
    evidenceRequired: [
      'Access review report',
      'Risk assessment for vehicle/pedestrian separation',
    ],
  },

  // ============================================================
  // LONE WORKING AND SUPERVISION
  // ============================================================
  {
    id: 'saf_lone_working_review',
    domain: 'safeguarding',
    name: 'Lone Working Risk Assessment Review',
    description: 'Review risk assessments for staff who work alone (site staff, cleaners, caretakers)',
    category: 'statutory',
    frequency: 'annually',
    reference: 'Health and Safety at Work Act 1974',
    referenceUrl: 'https://www.legislation.gov.uk/ukpga/1974/37/contents',
    estimatedDuration: 60,
    evidenceRequired: [
      'Lone working risk assessments',
      'Review notes',
    ],
  },

  // ============================================================
  // MISSING PERSON PROCEDURES
  // ============================================================
  {
    id: 'saf_missing_person_review',
    domain: 'safeguarding',
    name: 'Missing Person Procedures Review',
    description: 'Review and update missing person/child procedures and communication systems',
    category: 'statutory',
    frequency: 'annually',
    reference: 'KCSIE 2024',
    referenceUrl: 'https://www.gov.uk/government/publications/keeping-children-safe-in-education-2024',
    estimatedDuration: 60,
    evidenceRequired: [
      'Updated procedures document',
      'Communication test log',
    ],
  },
];

/**
 * Get all safeguarding checks
 */
export function getSafeguardingChecks(): StatutoryCheck[] {
  return SAFEGUARDING_CHECKS;
}

/**
 * Get safeguarding checks by frequency
 */
export function getSafeguardingChecksByFrequency(frequency: string): StatutoryCheck[] {
  return SAFEGUARDING_CHECKS.filter(check => check.frequency === frequency);
}
