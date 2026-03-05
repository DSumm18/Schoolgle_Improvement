/**
 * Ed Context Builder for Estates Compliance
 *
 * Builds contextual information for Ed chatbot based on the current page,
 * task, domain, and user context. This enables Ed to provide relevant,
 * contextual help for compliance tasks.
 */

import { useAuth } from '@/context/SupabaseAuthContext';
import type { ComplianceDomain } from './statutory-checks';

// ============================================================================
// TYPES
// ============================================================================

export interface EdContext {
  /** Current page identifier */
  page: 'estates-compliance' | 'estates-domain' | 'estates-task' | 'estates-diary' | 'estates-assets';
  /** Compliance domain (if applicable) */
  domain?: ComplianceDomain;
  /** Check/task ID (if applicable) */
  checkId?: string;
  /** Check/task name (if applicable) */
  checkName?: string;
  /** Current task status */
  taskStatus?: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'skipped' | 'not_applicable';
  /** User ID (from auth context) */
  userId?: string;
  /** Organization ID (from auth context) */
  organizationId?: string;
  /** Custom initial message to send to Ed */
  initialMessage?: string;
  /** Additional context metadata */
  metadata?: Record<string, unknown>;
}

export interface EdContextOptions {
  /** The page where the user is */
  page: EdContext['page'];
  /** Compliance domain */
  domain?: ComplianceDomain;
  /** Check ID */
  checkId?: string;
  /** Check name */
  checkName?: string;
  /** Task status */
  taskStatus?: EdContext['taskStatus'];
  /** Custom initial message */
  initialMessage?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// DOMAIN MAPPING
// ============================================================================

const DOMAIN_INFO: Record<ComplianceDomain, {
  name: string;
  description: string;
  icon: string;
  regulatoryReferences: string[];
  expertise: string[];
}> = {
  legionella: {
    name: 'Legionella Control',
    description: 'Water system monitoring and temperature checks (HSE L8)',
    icon: '💧',
    regulatoryReferences: ['HSE L8', 'HSE HSG274'],
    expertise: [
      'Water temperature monitoring',
      'Sentinel outlet checks',
      'Flushing procedures',
      'Risk assessment requirements',
      'Record keeping',
    ],
  },
  fire: {
    name: 'Fire Safety',
    description: 'Fire alarms, extinguishers, escape routes (RRO 2005)',
    icon: '🔥',
    regulatoryReferences: ['RRO 2005', 'BS5839', 'BS5266', 'BS5306'],
    expertise: [
      'Weekly alarm testing',
      'Emergency lighting checks',
      'Extinguisher inspections',
      'Escape route maintenance',
      'Fire door checks',
      'Log book requirements',
    ],
  },
  asbestos: {
    name: 'Asbestos Management',
    description: 'Register maintenance and re-inspection (CAR 2012)',
    icon: '☣️',
    regulatoryReferences: ['CAR 2012', 'Control of Asbestos Regulations'],
    expertise: [
      'Asbestos register management',
      'Annual visual inspections',
      'Re-survey requirements',
      'Management plan reviews',
      'Training requirements',
    ],
  },
  electrical: {
    name: 'Electrical Safety',
    description: 'Fixed wiring, PAT testing, emergency lighting',
    icon: '⚡',
    regulatoryReferences: ['EAWR 1989', 'BS7671', 'BS5266'],
    expertise: [
      'Fixed wire testing (EICR)',
      'Portable appliance testing (PAT)',
      'RCD testing',
      'Emergency lighting duration tests',
      'Visual inspections',
    ],
  },
  gas: {
    name: 'Gas Safety',
    description: 'Annual safety checks and appliance inspection',
    icon: '🔥',
    regulatoryReferences: ['GFPA 1995', 'Gas Safety Regulations'],
    expertise: [
      'Annual gas safety checks',
      'CP12 certificates',
      'Gas Safe register requirements',
      'Emergency controls',
      'Visual inspections',
    ],
  },
  water: {
    name: 'Water Quality',
    description: 'Drinking water testing and tank inspections',
    icon: '🚰',
    regulatoryReferences: ['Water Supply Regulations 1999', 'Water Quality Regulations 2016'],
    expertise: [
      'Drinking water quality testing',
      'Cold water tank inspections',
      'UKAS laboratory requirements',
      'Sample collection procedures',
    ],
  },
  mechanical: {
    name: 'Mechanical & Heating',
    description: 'Boilers, ventilation, and plant room equipment',
    icon: '🔧',
    regulatoryReferences: ['Gas Safety Regulations', 'Workplace Regulations 1992'],
    expertise: [
      'Boiler servicing',
      'Ventilation system maintenance',
      'AHU filter checks',
      'Plant room procedures',
    ],
  },
  lifts: {
    name: 'Lifts & LOLER',
    description: 'Lift examinations and maintenance (LOLER 1998)',
    icon: '🛗',
    regulatoryReferences: ['LOLER 1998', 'PUWER 1998'],
    expertise: [
      '6-monthly LOLER examinations',
      'Daily lift inspections',
      'Maintenance records',
      'Emergency telephone checks',
    ],
  },
  playground: {
    name: 'Playground Safety',
    description: 'Equipment inspection and surfacing checks',
    icon: '🎠',
    regulatoryReferences: ['PUWER 1998', 'EN 1177', 'RoSPA guidance'],
    expertise: [
      'Annual equipment inspections',
      'Weekly visual checks',
      'Surfacing inspections',
      'RPII inspector requirements',
      'Impact absorption testing',
    ],
  },
  accessibility: {
    name: 'Accessibility',
    description: 'Accessible routes and facilities (Equality Act)',
    icon: '♿',
    regulatoryReferences: ['Equality Act 2010'],
    expertise: [
      'Accessibility statement reviews',
      'Accessible route inspections',
      'Facility checks',
      'Reasonable adjustments',
    ],
  },
  security: {
    name: 'Security',
    description: 'Perimeter, access control, and CCTV',
    icon: '🔒',
    regulatoryReferences: ['Independent School Standards Regulations 2014'],
    expertise: [
      'Perimeter security checks',
      'CCTV system maintenance',
      'Access control procedures',
      'Lock and key management',
    ],
  },
  manual_handling: {
    name: 'Manual Handling',
    description: 'Risk assessments and equipment',
    icon: '📦',
    regulatoryReferences: ['Manual Handling Operations Regulations 1992'],
    expertise: [
      'Risk assessment reviews',
      'Training requirements',
      'Equipment provision',
      'Safe handling techniques',
    ],
  },
  working_at_height: {
    name: 'Working at Height',
    description: 'Access equipment and fall protection (WAH 2005)',
    icon: '🪜',
    regulatoryReferences: ['Work at Height Regulations 2005'],
    expertise: [
      'Equipment inspections',
      'Ladder safety',
      'Fall protection',
      'Training requirements',
      'Competence assessments',
    ],
  },
};

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

/**
 * Build Ed context for the Estates Compliance module
 *
 * @param options - Context options
 * @returns Complete Ed context object
 */
export function buildEdContext(options: EdContextOptions): EdContext {
  return {
    page: options.page,
    domain: options.domain,
    checkId: options.checkId,
    checkName: options.checkName,
    taskStatus: options.taskStatus,
    initialMessage: options.initialMessage || buildDefaultMessage(options),
    metadata: options.metadata,
  };
}

/**
 * Build a contextual initial message for Ed based on the current task
 */
function buildDefaultMessage(options: EdContextOptions): string {
  const { page, domain, checkName, taskStatus } = options;

  if (page === 'estates-compliance' && !checkName) {
    return "Hi Ed! I'm on the Estates Compliance dashboard. Can you help me understand my statutory obligations?";
  }

  if (page === 'estates-diary') {
    return "Hi Ed! I'm reviewing my compliance diary. What should I prioritize today?";
  }

  if (page === 'estates-assets') {
    return "Hi Ed! I'm looking at my asset register. What compliance checks are linked to these assets?";
  }

  if (!domain || !checkName) {
    return "Hi Ed! Can you help me with my estates compliance tasks?";
  }

  // Build contextual message for specific task
  const domainInfo = DOMAIN_INFO[domain];
  const domainName = domainInfo?.name || domain;

  let message = `I'm working on "${checkName}" in ${domainName}.`;

  if (taskStatus === 'overdue') {
    message += ` This task is overdue. What are the immediate actions I should take?`;
  } else if (taskStatus === 'completed') {
    message += ` I've just completed this. What evidence should I retain for the records?`;
  } else if (taskStatus === 'in_progress') {
    message += ` I'm currently working through this. Can you guide me on the requirements?`;
  } else {
    message += ` Can you explain the statutory requirements for this check?`;
  }

  return message;
}

/**
 * Get tool context for Ed widget based on domain
 * This maps Estates Compliance domains to Ed's tool context system
 */
export function getToolContextForDomain(domain?: ComplianceDomain): {
  name: string;
  category: string;
  url?: string;
  expertise: string[];
} | null {
  if (!domain) return null;

  const domainInfo = DOMAIN_INFO[domain];
  if (!domainInfo) return null;

  return {
    name: domainInfo.name,
    category: 'Estates',
    url: `/estates-compliance/${domain}`,
    expertise: domainInfo.expertise,
  };
}

/**
 * Open Ed widget with context
 *
 * @param context - Ed context to use
 */
export function openEdWithContext(context: EdContext): void {
  // Dispatch custom event that Ed widget will listen to
  const event = new CustomEvent('ed-open-with-context', {
    detail: context,
  });
  window.dispatchEvent(event);

  // Also try to interact directly with global Ed instance
  const ed = (window as any).__ED_INSTANCE__;
  if (ed) {
    // Open the widget if closed
    if (ed.open && typeof ed.open === 'function') {
      ed.open();
    }

    // Set tool context for domain-specific expertise
    if (ed.setToolContext && typeof ed.setToolContext === 'function') {
      const toolContext = getToolContextForDomain(context.domain);
      if (toolContext) {
        ed.setToolContext(toolContext);
      }
    }

    // Send initial message if provided
    if (context.initialMessage && ed.handleUserInput) {
      // Small delay to ensure widget is open
      setTimeout(() => {
        // Check if there's an input field we can populate
        const input = document.querySelector('#chat-input') as HTMLInputElement;
        if (input) {
          input.value = context.initialMessage || '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          // Trigger send if available
          const sendBtn = document.querySelector('#send-btn') as HTMLButtonElement;
          if (sendBtn) {
            sendBtn.click();
          }
        }
      }, 300);
    }
  }
}

// ============================================================================
// REACT HOOK
// ============================================================================

/**
 * React hook to get Ed context builder with auth
 *
 * @example
 * const { openEdWithTaskContext } = useEdContext();
 *
 * openEdWithTaskContext({
 *   domain: 'fire',
 *   checkId: 'fire_weekly_alarm_test',
 *   checkName: 'Weekly Fire Alarm Test',
 *   taskStatus: 'overdue',
 * });
 */
export function useEdContext() {
  const { userId, organizationId } = useAuth();

  /**
   * Open Ed chat with task context
   */
  const openEdWithTaskContext = (options: Omit<EdContextOptions, 'page'> & { page?: EdContext['page'] }) => {
    const context: EdContext = {
      page: options.page || 'estates-compliance',
      domain: options.domain,
      checkId: options.checkId,
      checkName: options.checkName,
      taskStatus: options.taskStatus,
      userId,
      organizationId,
      initialMessage: options.initialMessage,
      metadata: options.metadata,
    };

    openEdWithContext(context);
  };

  /**
   * Build context without opening Ed
   */
  const buildContext = (options: Omit<EdContextOptions, 'page'> & { page?: EdContext['page'] }): EdContext => {
    return buildEdContext({
      ...options,
      page: options.page || 'estates-compliance',
    });
  };

  return {
    openEdWithTaskContext,
    buildContext,
    userId,
    organizationId,
  };
}

export default buildEdContext;
