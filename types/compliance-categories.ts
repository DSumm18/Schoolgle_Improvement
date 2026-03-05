/**
 * Hierarchical Compliance Category System
 * Based on GEMS and DfE School Estate Management Standards
 */

export interface ComplianceCategoryGroup {
  id: string;
  name: string;
  description: string;
  color: string;           // For color-coding cards
  icon: string;            // Lucide icon name
  subcategories: ComplianceSubcategory[];
}

export interface ComplianceSubcategory {
  id: string;
  name: string;
  description: string;
  template_ids: string[];  // Links to specific compliance templates
  typical_frequency: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Main Compliance Category Groups
 * Aligned with GEMS and DfE standards
 */
export const COMPLIANCE_CATEGORY_GROUPS: ComplianceCategoryGroup[] = [
  {
    id: 'fire_safety',
    name: 'Fire Safety',
    description: 'Fire risk assessments, alarms, emergency lighting, extinguishers',
    color: 'red',
    icon: 'Flame',
    subcategories: [
      {
        id: 'fire_risk_assessment',
        name: 'Fire Risk Assessment',
        description: 'Comprehensive fire risk assessment (FRA)',
        template_ids: ['fire-risk-assessment'],
        typical_frequency: 'Annual (or as advised by assessor)',
        risk_level: 'critical'
      },
      {
        id: 'fire_alarm_system',
        name: 'Fire Alarm System',
        description: 'Weekly tests and annual servicing',
        template_ids: ['fire-alarm-weekly-test', 'fire-alarm-annual-service'],
        typical_frequency: 'Weekly tests, Annual service',
        risk_level: 'critical'
      },
      {
        id: 'emergency_lighting',
        name: 'Emergency Lighting',
        description: 'Monthly flash tests and annual full duration test',
        template_ids: ['emergency-lighting-monthly', 'emergency-lighting-annual'],
        typical_frequency: 'Monthly flash, Annual 3-hour test',
        risk_level: 'high'
      },
      {
        id: 'fire_extinguishers',
        name: 'Fire Extinguishers & Equipment',
        description: 'Annual service and inspection',
        template_ids: ['fire-extinguisher-annual'],
        typical_frequency: 'Annual',
        risk_level: 'high'
      },
      {
        id: 'fire_doors',
        name: 'Fire Doors',
        description: 'Regular inspection of fire door integrity',
        template_ids: ['fire-door-inspection'],
        typical_frequency: 'Quarterly',
        risk_level: 'high'
      }
    ]
  },
  {
    id: 'water_hygiene',
    name: 'Water Hygiene & Legionella',
    description: 'Legionella risk assessments, temperature monitoring, testing',
    color: 'blue',
    icon: 'Droplet',
    subcategories: [
      {
        id: 'legionella_risk_assessment',
        name: 'Legionella Risk Assessment',
        description: 'Comprehensive water system risk assessment (L8)',
        template_ids: ['legionella-risk-assessment'],
        typical_frequency: 'Biennial (or when systems change)',
        risk_level: 'critical'
      },
      {
        id: 'temperature_monitoring',
        name: 'Temperature Monitoring',
        description: 'Monthly sentinel outlet temperature checks',
        template_ids: ['legionella-monthly-temperature'],
        typical_frequency: 'Monthly',
        risk_level: 'high'
      },
      {
        id: 'water_testing',
        name: 'Water Sample Testing',
        description: 'Laboratory testing for Legionella bacteria',
        template_ids: ['legionella-quarterly-testing'],
        typical_frequency: 'Quarterly (high-risk systems)',
        risk_level: 'critical'
      },
      {
        id: 'water_flushing',
        name: 'Water System Flushing',
        description: 'Regular flushing during low-use periods',
        template_ids: ['legionella-weekly-flushing'],
        typical_frequency: 'Weekly during holidays',
        risk_level: 'high'
      },
      {
        id: 'tmv_servicing',
        name: 'TMV (Thermostatic Mixing Valve) Servicing',
        description: 'Annual service of TMVs',
        template_ids: ['tmv-annual-service'],
        typical_frequency: 'Annual',
        risk_level: 'medium'
      }
    ]
  },
  {
    id: 'electrical_safety',
    name: 'Electrical Safety',
    description: 'Fixed wire testing, PAT testing, electrical inspections',
    color: 'yellow',
    icon: 'Zap',
    subcategories: [
      {
        id: 'fixed_wire_testing',
        name: 'Fixed Wire Testing (EICR)',
        description: 'Electrical Installation Condition Report',
        template_ids: ['electrical-fixed-wire-5yr'],
        typical_frequency: '5-yearly',
        risk_level: 'critical'
      },
      {
        id: 'pat_testing',
        name: 'Portable Appliance Testing (PAT)',
        description: 'Testing of portable electrical equipment',
        template_ids: ['pat-testing'],
        typical_frequency: 'Annual',
        risk_level: 'medium'
      },
      {
        id: 'lightning_protection',
        name: 'Lightning Protection System',
        description: 'Inspection of lightning conductors',
        template_ids: ['lightning-protection-annual'],
        typical_frequency: 'Annual',
        risk_level: 'medium'
      }
    ]
  },
  {
    id: 'gas_safety',
    name: 'Gas Safety',
    description: 'Gas Safe inspections and appliance servicing',
    color: 'orange',
    icon: 'Flame',
    subcategories: [
      {
        id: 'gas_safety_inspection',
        name: 'Gas Safety Inspection',
        description: 'Annual inspection by Gas Safe registered engineer',
        template_ids: ['gas-safety-annual'],
        typical_frequency: 'Annual',
        risk_level: 'critical'
      },
      {
        id: 'boiler_servicing',
        name: 'Boiler Servicing',
        description: 'Annual boiler service and maintenance',
        template_ids: ['boiler-annual-service'],
        typical_frequency: 'Annual',
        risk_level: 'high'
      }
    ]
  },
  {
    id: 'asbestos_management',
    name: 'Asbestos Management',
    description: 'Asbestos surveys, re-inspections, and register maintenance',
    color: 'purple',
    icon: 'AlertTriangle',
    subcategories: [
      {
        id: 'asbestos_survey',
        name: 'Asbestos Management Survey',
        description: 'Comprehensive asbestos survey (CAR 2012)',
        template_ids: ['asbestos-management-survey'],
        typical_frequency: '3-yearly (or as advised)',
        risk_level: 'critical'
      },
      {
        id: 'asbestos_reinspection',
        name: 'Asbestos Re-inspection',
        description: 'Annual inspection of known ACMs',
        template_ids: ['asbestos-reinspection'],
        typical_frequency: 'Annual',
        risk_level: 'critical'
      }
    ]
  },
  {
    id: 'lifting_equipment',
    name: 'Lifting Equipment (LOLER)',
    description: 'Lifts, hoists, and lifting equipment inspections',
    color: 'indigo',
    icon: 'ArrowUpDown',
    subcategories: [
      {
        id: 'lift_inspection',
        name: 'Passenger/Goods Lift Inspection',
        description: 'Six-monthly thorough examination',
        template_ids: ['loler-lift-inspection'],
        typical_frequency: '6-monthly',
        risk_level: 'critical'
      },
      {
        id: 'hoist_inspection',
        name: 'Hoist & Lifting Equipment',
        description: 'Regular inspection of hoists and lifting gear',
        template_ids: ['loler-hoist-inspection'],
        typical_frequency: '6-monthly',
        risk_level: 'high'
      }
    ]
  },
  {
    id: 'health_safety',
    name: 'Health & Safety',
    description: 'COSHH, risk assessments, first aid, playground safety',
    color: 'green',
    icon: 'Shield',
    subcategories: [
      {
        id: 'coshh_assessment',
        name: 'COSHH Risk Assessments',
        description: 'Control of Substances Hazardous to Health',
        template_ids: ['coshh-assessment-review'],
        typical_frequency: 'Annual review',
        risk_level: 'medium'
      },
      {
        id: 'playground_inspection',
        name: 'Playground Equipment Inspection',
        description: 'Annual inspection by competent person',
        template_ids: ['playground-annual-inspection'],
        typical_frequency: 'Annual',
        risk_level: 'high'
      },
      {
        id: 'first_aid_checks',
        name: 'First Aid Equipment Checks',
        description: 'Monthly checks of first aid kits',
        template_ids: ['first-aid-equipment-check'],
        typical_frequency: 'Monthly',
        risk_level: 'medium'
      },
      {
        id: 'pressure_systems',
        name: 'Pressure Systems',
        description: 'Inspection of pressure vessels and systems',
        template_ids: ['pressure-system-inspection'],
        typical_frequency: 'As per written scheme',
        risk_level: 'high'
      }
    ]
  },
  {
    id: 'building_fabric',
    name: 'Building Fabric & Structure',
    description: 'Roof inspections, gutters, windows, drainage',
    color: 'gray',
    icon: 'Building2',
    subcategories: [
      {
        id: 'roof_inspection',
        name: 'Roof Inspection',
        description: 'Annual roof condition survey',
        template_ids: ['roof-annual-inspection'],
        typical_frequency: 'Annual',
        risk_level: 'medium'
      },
      {
        id: 'gutter_cleaning',
        name: 'Gutter & Drainage Cleaning',
        description: 'Bi-annual cleaning and inspection',
        template_ids: ['gutter-biannual-cleaning'],
        typical_frequency: 'Bi-annual',
        risk_level: 'low'
      },
      {
        id: 'window_inspection',
        name: 'Window Safety Inspection',
        description: 'Annual inspection of window restrictors',
        template_ids: ['window-safety-inspection'],
        typical_frequency: 'Annual',
        risk_level: 'medium'
      }
    ]
  },
  {
    id: 'security_access',
    name: 'Security & Access Control',
    description: 'Intruder alarms, CCTV, access control systems',
    color: 'slate',
    icon: 'Lock',
    subcategories: [
      {
        id: 'security_systems',
        name: 'Security System Servicing',
        description: 'Annual service of intruder alarms and CCTV',
        template_ids: ['security-system-annual'],
        typical_frequency: 'Annual',
        risk_level: 'medium'
      },
      {
        id: 'access_control',
        name: 'Access Control System',
        description: 'Regular maintenance and testing',
        template_ids: ['access-control-maintenance'],
        typical_frequency: 'Annual',
        risk_level: 'low'
      }
    ]
  },
  {
    id: 'environmental',
    name: 'Environmental & Energy',
    description: 'Energy audits, sustainability checks, radon testing',
    color: 'emerald',
    icon: 'Leaf',
    subcategories: [
      {
        id: 'energy_audit',
        name: 'Energy Performance Audit',
        description: 'Annual energy efficiency review',
        template_ids: ['energy-audit-annual'],
        typical_frequency: 'Annual',
        risk_level: 'low'
      },
      {
        id: 'radon_testing',
        name: 'Radon Testing',
        description: 'Radon gas monitoring (if applicable)',
        template_ids: ['radon-testing'],
        typical_frequency: '10-yearly',
        risk_level: 'medium'
      }
    ]
  }
];

/**
 * Get category group by ID
 */
export function getCategoryGroup(id: string): ComplianceCategoryGroup | undefined {
  return COMPLIANCE_CATEGORY_GROUPS.find(g => g.id === id);
}

/**
 * Get all template IDs for a category group
 */
export function getTemplateIdsForGroup(groupId: string): string[] {
  const group = getCategoryGroup(groupId);
  if (!group) return [];

  return group.subcategories.flatMap(sub => sub.template_ids);
}

/**
 * Find which category group a template belongs to
 */
export function findCategoryForTemplate(templateId: string): {
  group: ComplianceCategoryGroup;
  subcategory: ComplianceSubcategory;
} | null {
  for (const group of COMPLIANCE_CATEGORY_GROUPS) {
    for (const subcategory of group.subcategories) {
      if (subcategory.template_ids.includes(templateId)) {
        return { group, subcategory };
      }
    }
  }
  return null;
}

/**
 * Tailwind color mappings for category colors
 */
export const CATEGORY_COLORS = {
  red: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-600 hover:bg-red-700'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-600 hover:bg-blue-700'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300',
    badge: 'bg-yellow-600 hover:bg-yellow-700'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-orange-600 hover:bg-orange-700'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-600 hover:bg-purple-700'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300',
    badge: 'bg-indigo-600 hover:bg-indigo-700'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-600 hover:bg-green-700'
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-950/20',
    border: 'border-gray-200 dark:border-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    badge: 'bg-gray-600 hover:bg-gray-700'
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-950/20',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    badge: 'bg-slate-600 hover:bg-slate-700'
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-600 hover:bg-emerald-700'
  }
};
