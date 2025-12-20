// Tool Knowledge Base
// Pre-loaded help and tips for school tools

export interface ToolKnowledge {
  id: string;
  name: string;
  description: string;
  commonTasks: TaskGuide[];
  tips: string[];
  shortcuts?: KeyboardShortcut[];
  troubleshooting: TroubleshootingItem[];
  relatedDocs?: string[];
}

export interface TaskGuide {
  title: string;
  steps: string[];
  selector?: string; // CSS selector to highlight first step
}

export interface KeyboardShortcut {
  keys: string;
  description: string;
}

export interface TroubleshootingItem {
  issue: string;
  solution: string;
}

/**
 * Knowledge base for school tools
 */
export const TOOL_KNOWLEDGE: Record<string, ToolKnowledge> = {
  // ============ MIS Systems ============
  'sims': {
    id: 'sims',
    name: 'SIMS',
    description: 'School Information Management System by Capita',
    commonTasks: [
      {
        title: 'Add a new pupil',
        steps: [
          'Go to Focus > Pupil > Pupil Details',
          'Click New to create a new record',
          'Fill in the required fields (surname, forename, DOB, gender)',
          'Click Save when complete',
        ],
      },
      {
        title: 'Run attendance report',
        steps: [
          'Go to Reports > Attendance Reports',
          'Select the report type (e.g., Summary, Detailed)',
          'Set the date range',
          'Choose year groups or classes to include',
          'Click Run Report',
        ],
      },
      {
        title: 'Record a behaviour incident',
        steps: [
          'Go to Focus > Behaviour Management',
          'Click New Incident',
          'Select the pupil(s) involved',
          'Choose incident type and severity',
          'Add notes and actions taken',
          'Save the record',
        ],
      },
    ],
    tips: [
      'Use the Quick Search (Ctrl+Q) to find pupils by name quickly',
      'Always save your work before navigating away from a record',
      'Use date picker buttons rather than typing dates to avoid format errors',
      'Export reports to Excel for further analysis',
    ],
    shortcuts: [
      { keys: 'Ctrl+Q', description: 'Quick search' },
      { keys: 'Ctrl+S', description: 'Save current record' },
      { keys: 'F5', description: 'Refresh data' },
    ],
    troubleshooting: [
      {
        issue: 'Cannot save pupil record',
        solution: 'Check all mandatory fields (marked with *) are filled. Ensure date formats are correct (DD/MM/YYYY).',
      },
      {
        issue: 'Report takes too long to generate',
        solution: 'Try narrowing the date range or selecting fewer pupils. Run reports outside peak times if possible.',
      },
    ],
  },

  'arbor': {
    id: 'arbor',
    name: 'Arbor',
    description: 'Cloud-based school management information system',
    commonTasks: [
      {
        title: 'Mark attendance',
        steps: [
          'Go to Students > Attendance > Mark Attendance',
          'Select your class from the dropdown',
          'Click each student to mark present, or use the quick mark buttons',
          'Save when complete',
        ],
      },
      {
        title: 'Send a communication',
        steps: [
          'Go to Communications > Messages',
          'Click New Message',
          'Select recipients (parents, staff, or students)',
          'Choose method (email, SMS, or both)',
          'Write your message and send',
        ],
      },
      {
        title: 'Log a safeguarding concern',
        steps: [
          'Find the student profile',
          'Click the Safeguarding tab',
          'Click New Concern',
          'Complete all required fields',
          'Submit for DSL review',
        ],
      },
    ],
    tips: [
      'Use the global search bar at the top to find students, staff, or pages quickly',
      'Pin frequently used reports to your dashboard',
      'Set up custom groups for common communications',
      'Use filters to narrow down data views',
    ],
    troubleshooting: [
      {
        issue: 'Cannot access certain features',
        solution: 'Your account may need additional permissions. Contact your school administrator.',
      },
      {
        issue: 'Data not syncing',
        solution: 'Refresh the page (Ctrl+R). If issue persists, check your internet connection.',
      },
    ],
  },

  // ============ Finance ============
  'every-budget': {
    id: 'every-budget',
    name: 'Every Budget Builder',
    description: 'Financial planning and budget management for schools',
    commonTasks: [
      {
        title: 'Create a new budget scenario',
        steps: [
          'Go to Scenarios in the main menu',
          'Click Create New Scenario',
          'Choose a base (blank or copy existing)',
          'Name your scenario clearly (e.g., "2024-25 Draft v2")',
          'Set the financial years to include',
        ],
      },
      {
        title: 'Add staffing costs',
        steps: [
          'Open your scenario',
          'Go to the Staffing section',
          'Click Add Staff or Import from MIS',
          'Enter salary details, on-costs, and FTE',
          'Review the total staff cost summary',
        ],
      },
      {
        title: 'Run a CFR report',
        steps: [
          'Go to Reports > Statutory Returns',
          'Select Consistent Financial Reporting (CFR)',
          'Choose the relevant year',
          'Review mappings to CFR codes',
          'Export for submission',
        ],
      },
    ],
    tips: [
      'Always work in a draft scenario before finalising',
      'Use the comparison tool to see differences between scenarios',
      'Set up alerts for budget thresholds',
      'Link to your MIS for automatic staff data import',
    ],
    troubleshooting: [
      {
        issue: 'Budget not balancing',
        solution: 'Check for any unmapped income or expenditure items. Review the reconciliation report.',
      },
      {
        issue: 'Cannot import staff data',
        solution: 'Ensure your MIS integration is configured correctly in Settings > Integrations.',
      },
    ],
  },

  // ============ Safeguarding ============
  'cpoms': {
    id: 'cpoms',
    name: 'CPOMS',
    description: 'Safeguarding and child protection software',
    commonTasks: [
      {
        title: 'Log a new incident',
        steps: [
          'Click Add Incident (+ button)',
          'Search for and select the student',
          'Choose the incident category',
          'Write a detailed, factual account',
          'Add any linked students if relevant',
          'Tag for DSL attention if urgent',
          'Submit the incident',
        ],
      },
      {
        title: 'Review DSL alerts',
        steps: [
          'Go to your Dashboard',
          'Check the Alerts panel',
          'Click each alert to review',
          'Add actions or notes as needed',
          'Mark as reviewed when complete',
        ],
      },
      {
        title: 'Create an action',
        steps: [
          'Open the relevant incident',
          'Click Add Action',
          'Select the action type',
          'Assign to the appropriate staff member',
          'Set a due date',
          'Save the action',
        ],
      },
    ],
    tips: [
      'Use objective, factual language in all records',
      'Record what the child said in their own words using quotation marks',
      'Never delete or edit historical records - add new notes instead',
      'Check your alerts daily',
      'Use the timeline view to see a child\'s full history',
    ],
    troubleshooting: [
      {
        issue: 'Cannot see certain students',
        solution: 'You may not have permission for that student\'s records. Speak to your DSL.',
      },
      {
        issue: 'Alert not appearing for DSL',
        solution: 'Check you tagged the incident correctly. Review the alert settings for that category.',
      },
    ],
  },

  'myconcern': {
    id: 'myconcern',
    name: 'MyConcern',
    description: 'Safeguarding software for schools',
    commonTasks: [
      {
        title: 'Record a concern',
        steps: [
          'Click Record Concern',
          'Find the student',
          'Select the concern type',
          'Describe what happened factually',
          'Note any witnesses',
          'Submit for review',
        ],
      },
    ],
    tips: [
      'Record concerns as soon as possible after they occur',
      'Include dates, times, and locations',
      'Note the child\'s demeanour and exact words',
    ],
    troubleshooting: [
      {
        issue: 'Cannot submit concern',
        solution: 'Ensure all mandatory fields are completed. Check your internet connection.',
      },
    ],
  },

  // ============ HR ============
  'the-key-hr': {
    id: 'the-key-hr',
    name: 'The Key HR',
    description: 'HR guidance and policy templates for schools',
    commonTasks: [
      {
        title: 'Find a policy template',
        steps: [
          'Use the search bar to find your topic',
          'Browse by category if needed',
          'Click on the template to preview',
          'Download and customise for your school',
        ],
      },
      {
        title: 'Get employment law guidance',
        steps: [
          'Go to Employment Law section',
          'Find the relevant topic',
          'Read the guidance article',
          'Download any related templates',
        ],
      },
    ],
    tips: [
      'Set up alerts for policy updates',
      'Use the compare tool when updating policies',
      'Check the "What\'s New" section regularly',
    ],
    troubleshooting: [
      {
        issue: 'Cannot download template',
        solution: 'Check your subscription includes template downloads. Contact your administrator.',
      },
    ],
  },

  // ============ Parents ============
  'parentpay': {
    id: 'parentpay',
    name: 'ParentPay',
    description: 'Online payment system for schools',
    commonTasks: [
      {
        title: 'Set up a new payment item',
        steps: [
          'Go to Finance > Payment Items',
          'Click Add New Item',
          'Set the name, price, and description',
          'Choose which year groups can see it',
          'Set open and close dates',
          'Publish the item',
        ],
      },
      {
        title: 'Check payment status',
        steps: [
          'Go to Reports > Payment Reports',
          'Select the payment item',
          'View who has paid and who hasn\'t',
          'Export for records if needed',
        ],
      },
    ],
    tips: [
      'Send reminders for unpaid items through the messaging feature',
      'Set up recurring payments for regular items like school meals',
      'Use the free school meals filter to exclude eligible pupils from payment items',
    ],
    troubleshooting: [
      {
        issue: 'Parent cannot see payment item',
        solution: 'Check the item is published and the correct year groups are selected.',
      },
    ],
  },

  // ============ Teaching ============
  'google-classroom': {
    id: 'google-classroom',
    name: 'Google Classroom',
    description: 'Learning management system by Google',
    commonTasks: [
      {
        title: 'Create an assignment',
        steps: [
          'Open your class',
          'Click Classwork tab',
          'Click Create > Assignment',
          'Add title, instructions, and resources',
          'Set due date and points',
          'Assign to students',
        ],
      },
      {
        title: 'Grade student work',
        steps: [
          'Open the assignment',
          'Click on a student submission',
          'Review their work',
          'Add comments if needed',
          'Enter the grade',
          'Return the work to the student',
        ],
      },
    ],
    tips: [
      'Use topics to organise classwork by unit or week',
      'Create assignment templates for common activities',
      'Use the rubric feature for consistent grading',
      'Schedule posts to release at specific times',
    ],
    shortcuts: [
      { keys: 'Ctrl+Enter', description: 'Post/Submit' },
    ],
    troubleshooting: [
      {
        issue: 'Student cannot access material',
        solution: 'Check the material is published and the student is enrolled in the class.',
      },
    ],
  },

  'canva': {
    id: 'canva',
    name: 'Canva',
    description: 'Graphic design platform for creating visual content',
    commonTasks: [
      {
        title: 'Create a classroom poster',
        steps: [
          'Click Create a Design',
          'Search for "Poster" or choose a size',
          'Browse templates or start blank',
          'Add text, images, and elements',
          'Customise colours to match your school',
          'Download or share when ready',
        ],
      },
      {
        title: 'Make a presentation',
        steps: [
          'Click Create a Design > Presentation',
          'Choose a template',
          'Edit each slide',
          'Add animations if desired',
          'Present directly or download',
        ],
      },
    ],
    tips: [
      'Set up your school\'s Brand Kit for consistent colours and fonts',
      'Use folders to organise designs by subject or term',
      'Share designs as templates for students to copy',
      'Use Canva for Education for free premium features',
    ],
    troubleshooting: [
      {
        issue: 'Cannot download design',
        solution: 'Some elements may require Canva Pro. Check for watermarked items.',
      },
    ],
  },

  'twinkl': {
    id: 'twinkl',
    name: 'Twinkl',
    description: 'Educational resources and teaching materials',
    commonTasks: [
      {
        title: 'Find a resource',
        steps: [
          'Use the search bar with keywords',
          'Filter by age range and subject',
          'Preview the resource',
          'Download in your preferred format',
        ],
      },
    ],
    tips: [
      'Use Collections to save resources for later',
      'Check the differentiation options (HA, MA, LA)',
      'Look for editable versions to customise',
    ],
    troubleshooting: [
      {
        issue: 'Cannot download resource',
        solution: 'Check your subscription level includes the resource type.',
      },
    ],
  },

  // ============ Data ============
  'asp': {
    id: 'asp',
    name: 'Analyse School Performance',
    description: 'DfE tool for analysing school performance data',
    commonTasks: [
      {
        title: 'View key stage results',
        steps: [
          'Log in with your DfE Sign-in',
          'Select your school',
          'Choose the key stage',
          'Review the headline measures',
          'Drill down into subject breakdowns',
        ],
      },
      {
        title: 'Compare with national',
        steps: [
          'View your school data',
          'Enable national comparators',
          'Review the confidence intervals',
          'Export charts for your SEF',
        ],
      },
    ],
    tips: [
      'Use the cohort context data to understand your results',
      'Download data for your Self-Evaluation Form',
      'Check for any data errors and report them',
    ],
    troubleshooting: [
      {
        issue: 'Cannot see latest data',
        solution: 'Data is released according to the DfE timetable. Check publication dates.',
      },
    ],
  },

  // ============ Admin ============
  'schoolbus': {
    id: 'schoolbus',
    name: 'SchoolBus',
    description: 'Policy and compliance management for schools',
    commonTasks: [
      {
        title: 'Review a policy',
        steps: [
          'Go to Policies',
          'Find the policy due for review',
          'Read the model policy updates',
          'Make necessary changes to your version',
          'Submit for governor approval',
        ],
      },
    ],
    tips: [
      'Set up email alerts for policy review dates',
      'Use the compliance checklist before Ofsted visits',
      'Link related policies together',
    ],
    troubleshooting: [
      {
        issue: 'Policy not syncing',
        solution: 'Refresh the page and check your internet connection.',
      },
    ],
  },

  'smartsurvey': {
    id: 'smartsurvey',
    name: 'SmartSurvey',
    description: 'Online survey tool for collecting feedback',
    commonTasks: [
      {
        title: 'Create a parent survey',
        steps: [
          'Click Create Survey',
          'Choose a template or start blank',
          'Add your questions',
          'Set up the distribution method',
          'Send to parents',
        ],
      },
    ],
    tips: [
      'Keep surveys short for better completion rates',
      'Use a mix of question types',
      'Include an open comment box for additional feedback',
      'Test the survey before sending',
    ],
    troubleshooting: [
      {
        issue: 'Low response rate',
        solution: 'Send reminders, keep surveys short, and consider incentives.',
      },
    ],
  },

  'hse-risk': {
    id: 'hse-risk',
    name: 'HSE Risk Assessment',
    description: 'Health and Safety Executive risk assessment tools',
    commonTasks: [
      {
        title: 'Complete a risk assessment',
        steps: [
          'Identify the activity or hazard',
          'List who might be harmed',
          'Evaluate the risks',
          'Record control measures',
          'Review and update regularly',
        ],
      },
    ],
    tips: [
      'Review risk assessments annually or when circumstances change',
      'Involve staff who do the activity in the assessment',
      'Keep completed assessments accessible to relevant staff',
    ],
    troubleshooting: [],
  },
};

/**
 * Get knowledge for a specific tool
 */
export function getToolKnowledge(toolId: string): ToolKnowledge | undefined {
  return TOOL_KNOWLEDGE[toolId];
}

/**
 * Search knowledge base for relevant help
 */
export function searchKnowledge(query: string, toolId?: string): {
  tasks: TaskGuide[];
  tips: string[];
  troubleshooting: TroubleshootingItem[];
} {
  const results = {
    tasks: [] as TaskGuide[],
    tips: [] as string[],
    troubleshooting: [] as TroubleshootingItem[],
  };
  
  const lowerQuery = query.toLowerCase();
  const tools = toolId ? [TOOL_KNOWLEDGE[toolId]].filter(Boolean) : Object.values(TOOL_KNOWLEDGE);
  
  for (const tool of tools) {
    if (!tool) continue;
    
    // Search tasks
    for (const task of tool.commonTasks) {
      if (task.title.toLowerCase().includes(lowerQuery) ||
          task.steps.some(s => s.toLowerCase().includes(lowerQuery))) {
        results.tasks.push(task);
      }
    }
    
    // Search tips
    for (const tip of tool.tips) {
      if (tip.toLowerCase().includes(lowerQuery)) {
        results.tips.push(tip);
      }
    }
    
    // Search troubleshooting
    for (const item of tool.troubleshooting) {
      if (item.issue.toLowerCase().includes(lowerQuery) ||
          item.solution.toLowerCase().includes(lowerQuery)) {
        results.troubleshooting.push(item);
      }
    }
  }
  
  return results;
}

