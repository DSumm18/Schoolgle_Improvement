/**
 * Transport/Minibus Compliance Checks
 *
 * Contains all transport-related statutory and good practice checks for UK schools.
 * Based on Section 19 Permit requirements, PSVAR, MOT regulations, and DVSA guidance.
 */

import type { StatutoryCheck } from './statutory-checks';

export type TransportDomain = 'transport';

/**
 * Transport compliance checks database
 */
export const TRANSPORT_CHECKS: StatutoryCheck[] = [
  // ============================================================
  // PERMITS AND LICENSING
  // ============================================================
  {
    id: 'trans_section19_permit',
    domain: 'transport',
    name: 'Section 19 Permit Validity Check',
    description: 'Verify Section 19 permit (minibus licence) is current and displayed correctly',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'Transport Act 1985',
    referenceUrl: 'https://www.gov.uk/apply-minibus-permit',
    estimatedDuration: 15,
    evidenceRequired: [
      'Section 19 permit certificate',
      'Permit expiry date logged',
    ],
    notes: 'Permits are typically valid for 5 years',
  },
  {
    id: 'trans_section19_expiry_reminder',
    domain: 'transport',
    name: 'Section 19 Permit Renewal Planning',
    description: 'Plan for Section 19 permit renewal at least 3 months before expiry',
    category: 'statutory',
    frequency: 'quarterly',
    reference: 'Transport Act 1985',
    referenceUrl: 'https://www.gov.uk/apply-minibus-permit',
    estimatedDuration: 30,
    evidenceRequired: [
      'Renewal planning notes',
      'Application status if in progress',
    ],
    notes: 'Check for permits expiring in next 6 months',
  },

  // ============================================================
  // PSVAR COMPLIANCE
  // ============================================================
  {
    id: 'trans_psvar_compliance',
    domain: 'transport',
    name: 'PSVAR Compliance Check',
    description: 'Verify compliance with Public Service Vehicles Accessibility Regulations (wheelchair access, wheelchair spaces, handrails)',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'Public Service Vehicles Accessibility Regulations 2000',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2000/1970/contents/made',
    estimatedDuration: 20,
    evidenceRequired: [
      'PSVAR compliance checklist',
      'Photos of accessibility features',
    ],
    notes: 'Required for vehicles carrying more than 22 passengers used for public services',
  },
  {
    id: 'trans_wheelchair_lift_test',
    domain: 'transport',
    name: 'Wheelchair Lift Monthly Test',
    description: 'Monthly operational test of wheelchair lift or ramp',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'PSVAR 2000',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/2000/1970/contents/made',
    estimatedDuration: 15,
    evidenceRequired: [
      'Lift test log',
    ],
  },

  // ============================================================
  // MOT AND TESTING
  // ============================================================
  {
    id: 'trans_class6_mot',
    domain: 'transport',
    name: 'Class VI MOT Certificate Check',
    description: 'Verify Class VI MOT certificate (public service vehicle) is current and displayed',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'Road Traffic Act 1988',
    referenceUrl: 'https://www.gov.uk/mot',
    estimatedDuration: 10,
    evidenceRequired: [
      'MOT certificate',
      'MOT expiry date logged',
    ],
    notes: 'Class VI MOT required annually for minibuses over 12 seats',
  },
  {
    id: 'trans_mot_renewal_planning',
    domain: 'transport',
    name: 'MOT Renewal Planning',
    description: 'Plan annual MOT renewal and pre-MOT inspection for each vehicle',
    category: 'statutory',
    frequency: 'quarterly',
    reference: 'Road Traffic Act 1988',
    referenceUrl: 'https://www.gov.uk/mot',
    estimatedDuration: 30,
    evidenceRequired: [
      'MOT schedule for all vehicles',
    ],
    notes: 'MOT due annually, book in advance',
  },

  // ============================================================
  // DAILY DRIVER INSPECTIONS
  // ============================================================
  {
    id: 'trans_daily_pre_trip_check',
    domain: 'transport',
    name: 'Daily Pre-Trip Driver Inspection',
    description: 'Driver must complete daily walk-round inspection before first journey (lights, tyres, fluids, bodywork, windows)',
    category: 'statutory',
    frequency: 'daily',
    reference: 'DVSA Guide to Maintaining Roadworthiness',
    referenceUrl: 'https://www.gov.uk/government/publications/guide-to-maintaining-roadworthiness',
    estimatedDuration: 10,
    evidenceRequired: [
      'Daily inspection record (defect report)',
    ],
    notes: 'Must be completed by driver before vehicle use',
  },
  {
    id: 'trans_defect_report_review',
    domain: 'transport',
    name: 'Defect Report Weekly Review',
    description: 'Weekly review of all defect reports to ensure remedial actions are completed',
    category: 'statutory',
    frequency: 'weekly',
    reference: 'DVSA Guide to Maintaining Roadworthiness',
    referenceUrl: 'https://www.gov.uk/government/publications/guide-to-maintaining-roadworthiness',
    estimatedDuration: 20,
    evidenceRequired: [
      'Review log of defect reports',
      'Evidence of completed repairs',
    ],
  },

  // ============================================================
  // WEEKLY INSPECTIONS
  // ============================================================
  {
    id: 'trans_weekly_visual_inspection',
    domain: 'transport',
    name: 'Weekly Visual Inspection',
    description: 'Comprehensive weekly inspection of vehicle condition including bodywork, lights, tyres, glass, and safety equipment',
    category: 'statutory',
    frequency: 'weekly',
    reference: 'DVSA Guide to Maintaining Roadworthiness',
    referenceUrl: 'https://www.gov.uk/government/publications/guide-to-maintaining-roadworthiness',
    estimatedDuration: 30,
    evidenceRequired: [
      'Weekly inspection checklist',
      'Photos of any defects found',
    ],
    notes: 'Can be completed by nominated person or driver',
  },
  {
    id: 'trans_safety_equipment_check',
    domain: 'transport',
    name: 'Weekly Safety Equipment Check',
    description: 'Check fire extinguisher, first aid kit, warning triangles, high-visibility jackets are present and in date',
    category: 'statutory',
    frequency: 'weekly',
    reference: 'Road Vehicles (Construction and Use) Regulations 1986',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/1986/1078/contents/made',
    estimatedDuration: 10,
    evidenceRequired: [
      'Safety equipment checklist',
    ],
    notes: 'First aid kit and fire extinguisher have expiry dates',
  },

  // ============================================================
  // MAINTENANCE AND SERVICING
  // ============================================================
  {
    id: 'trans_annual_service',
    domain: 'transport',
    name: 'Annual Service Record Check',
    description: 'Verify annual or scheduled servicing has been completed and recorded',
    category: 'statutory',
    frequency: 'annually',
    reference: 'DVSA Guide to Maintaining Roadworthiness',
    referenceUrl: 'https://www.gov.uk/government/publications/guide-to-maintaining-roadworthiness',
    estimatedDuration: 30,
    evidenceRequired: [
      'Service records',
      'Service invoices',
    ],
    notes: 'Follow manufacturer service schedule or every 10,000 miles',
  },
  {
    id: 'trans_maintenance_records',
    domain: 'transport',
    name: 'Maintenance Records Review',
    description: 'Quarterly review of all maintenance records to ensure completeness',
    category: 'statutory',
    frequency: 'quarterly',
    reference: 'DVSA Guide to Maintaining Roadworthiness',
    referenceUrl: 'https://www.gov.uk/government/publications/guide-to-maintaining-roadworthiness',
    estimatedDuration: 30,
    evidenceRequired: [
      'Maintenance records audit',
    ],
  },

  // ============================================================
  // TACHOGRAPHS (IF APPLICABLE)
  // ============================================================
  {
    id: 'trans_tachograph_calibration',
    domain: 'transport',
    name: 'Tachograph Calibration Check',
    description: 'Verify tachograph calibration is current (every 2 years for analogue, every 2 years for digital)',
    category: 'statutory',
    frequency: 'annually',
    reference: 'GB Domestic Drivers\' Hours Rules',
    referenceUrl: 'https://www.gov.uk/tachograph-rules',
    estimatedDuration: 15,
    evidenceRequired: [
      'Tachograph calibration certificate',
    ],
    notes: 'Only applicable if tachographs are fitted',
  },
  {
    id: 'trans_speed_limiter_check',
    domain: 'transport',
    name: 'Speed Limiter Check',
    description: 'Verify speed limiter is functioning correctly (limited to 62mph/100kmh for minibuses)',
    category: 'statutory',
    frequency: 'annually',
    reference: 'Road Vehicles (Construction and Use) Regulations 1986',
    referenceUrl: 'https://www.legislation.gov.uk/uksi/1986/1078/contents/made',
    estimatedDuration: 30,
    requiresQualification: 'Qualified vehicle technician',
    evidenceRequired: [
      'Speed limiter test certificate',
    ],
    notes: 'Minibuses over 2.5 tonnes require speed limiters',
  },

  // ============================================================
  // DRIVER LICENCE AND TRAINING
  // ============================================================
  {
    id: 'trans_driver_licence_check',
    domain: 'transport',
    name: 'Driver Licence Check',
    description: 'Verify all minibus drivers have appropriate licence category (D1 or D) and licence is current',
    category: 'statutory',
    frequency: 'termly',
    reference: 'Road Traffic Act 1988',
    referenceUrl: 'https://www.gov.uk/driving-licence-categories',
    estimatedDuration: 30,
    evidenceRequired: [
      'Driver licence checks',
      'MiDAS training certificates where applicable',
    ],
    notes: 'D1 category required for minibuses 9-16 seats, check for endorsements',
  },
  {
    id: 'trans_midas_training',
    domain: 'transport',
    name: 'MiDAS Training Records',
    description: 'Verify minibus drivers have current MiDAS (Minibus Driver Awareness Scheme) certification',
    category: 'good_practice',
    frequency: 'termly',
    reference: 'MiDAS scheme',
    referenceUrl: 'https://www.communitytransport.org/midas/',
    estimatedDuration: 30,
    evidenceRequired: [
      'MiDAS certificates',
      'Training matrix',
    ],
    notes: 'MiDAS certification valid for 4 years',
  },

  // ============================================================
  // INSURANCE
  // ============================================================
  {
    id: 'trans_insurance_check',
    domain: 'transport',
    name: 'Minibus Insurance Validity Check',
    description: 'Verify insurance certificates are current and cover intended use (school business, hire, reward)',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'Road Traffic Act 1988',
    referenceUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/contents',
    estimatedDuration: 10,
    evidenceRequired: [
      'Insurance certificates',
      'Certificate of motor insurance',
    ],
    notes: 'Check Section 19 permit compliance with insurance',
  },

  // ============================================================
  // VEHICLE TAX
  // ============================================================
  {
    id: 'trans_vehicle_tax_check',
    domain: 'transport',
    name: 'Vehicle Tax Validity Check',
    description: 'Verify vehicle tax (VED) is current for all school vehicles',
    category: 'statutory',
    frequency: 'monthly',
    reference: 'Vehicle Excise and Registration Act 1994',
    referenceUrl: 'https://www.gov.uk/vehicle-tax',
    estimatedDuration: 10,
    evidenceRequired: [
      'Tax status check record',
    ],
  },
];

/**
 * Get all transport checks
 */
export function getTransportChecks(): StatutoryCheck[] {
  return TRANSPORT_CHECKS;
}

/**
 * Get transport checks by frequency
 */
export function getTransportChecksByFrequency(frequency: string): StatutoryCheck[] {
  return TRANSPORT_CHECKS.filter(check => check.frequency === frequency);
}
