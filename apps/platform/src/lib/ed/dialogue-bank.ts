/**
 * Ed Dialogue Bank
 *
 * Ambient personality lines for Ed to use in UI interactions.
 * These are NOT for AI responses — they're for UI states like loading,
 * success confirmations, error messages, and ambient greetings.
 */

export interface DialogueLine {
  text: string;
  category: 'greeting' | 'loading' | 'success' | 'error' | 'idle' | 'module';
  module?: string;
}

/**
 * Greeting messages — shown when Ed first opens or after periods of inactivity
 */
export const GREETINGS: DialogueLine[] = [
  { text: "Hello! How can I help with your school improvement today?", category: 'greeting' },
  { text: "Hoo's there? I'm here to help!", category: 'greeting' },
  { text: "Good to see you! What can I assist with?", category: 'greeting' },
  { text: "Ready when you are. What would you like to work on?", category: 'greeting' },
  { text: "Back again? Brilliant! Let's get started.", category: 'greeting' },
];

/**
 * Loading/thinking messages — shown while Ed is processing
 */
export const LOADING_MESSAGES: DialogueLine[] = [
  { text: "Just a moment...", category: 'loading' },
  { text: "Looking into that...", category: 'loading' },
  { text: "Checking my sources...", category: 'loading' },
  { text: "Almost there...", category: 'loading' },
  { text: "Wise owls take their time — nearly ready...", category: 'loading' },
  { text: "Searching through the evidence...", category: 'loading' },
  { text: "Analysing the data...", category: 'loading' },
  { text: "One moment, please...", category: 'loading' },
];

/**
 * Success messages — shown when tasks complete successfully
 */
export const SUCCESS_MESSAGES: DialogueLine[] = [
  { text: "All done! Anything else?", category: 'success' },
  { text: "Sorted! Let me know if you need anything else.", category: 'success' },
  { text: "That worked! Happy to help with the next step.", category: 'success' },
  { text: "Completed! What's next?", category: 'success' },
  { text: "Brilliant — that's all sorted.", category: 'success' },
  { text: "Done and dusted!", category: 'success' },
  { text: "Successfully saved. Onwards and upwards!", category: 'success' },
];

/**
 * Error messages — shown when something goes wrong
 */
export const ERROR_MESSAGES: DialogueLine[] = [
  { text: "Oh feathers! Something went wrong. Let's try that again.", category: 'error' },
  { text: "Apologies — I hit a snag. Can we give that another go?", category: 'error' },
  { text: "Something's not right here. Mind trying again?", category: 'error' },
  { text: "That didn't work as expected. Shall we retry?", category: 'error' },
  { text: "Sorry about that — technical hiccups happen. Let's try once more.", category: 'error' },
  { text: "I've had a little mishap. Can we attempt that again?", category: 'error' },
];

/**
 * Idle/ambient messages — shown during pauses or inactivity
 */
export const IDLE_MESSAGES: DialogueLine[] = [
  { text: "Just here if you need me...", category: 'idle' },
  { text: "Perched and ready to help!", category: 'idle' },
  { text: "Taking a brief moment to observe...", category: 'idle' },
  { text: "I'll be right here when you need me.", category: 'idle' },
];

/**
 * Module-specific messages — contextual to the user's current area
 */
export const MODULE_MESSAGES: Record<string, DialogueLine[]> = {
  improvement: [
    { text: "Working on school improvement? Wise choice.", category: 'module', module: 'improvement' },
    { text: "How's your Ofsted readiness looking?", category: 'module', module: 'improvement' },
    { text: "Shall we review some evidence together?", category: 'module', module: 'improvement' },
    { text: "What improvement priority shall we tackle?", category: 'module', module: 'improvement' },
  ],
  governance: [
    { text: "Governance matters! How can I support the board?", category: 'module', module: 'governance' },
    { text: "Need help with board business?", category: 'module', module: 'governance' },
    { text: "Governor question? I'm your owl.", category: 'module', module: 'governance' },
    { text: "Let's get governance sorted.", category: 'module', module: 'governance' },
  ],
  estates: [
    { text: "Estates and premises — at your service!", category: 'module', module: 'estates' },
    { text: "Building-related query? Lay it on me.", category: 'module', module: 'estates' },
    { text: "Health & safety first! How can I help?", category: 'module', module: 'estates' },
    { text: "Contractor compliance? I've got you covered.", category: 'module', module: 'estates' },
  ],
  compliance: [
    { text: "Compliance is key. What do you need?", category: 'module', module: 'compliance' },
    { text: "GDPR, policies, or statutory training? I'm here.", category: 'module', module: 'compliance' },
    { text: "Let's keep everything compliant.", category: 'module', module: 'compliance' },
    { text: "SCR checks, policy updates — what's the task?", category: 'module', module: 'compliance' },
  ],
  communications: [
    { text: "Time to communicate? I can help draft that!", category: 'module', module: 'communications' },
    { text: "Need to reach stakeholders? I'm your owl.", category: 'module', module: 'communications' },
    { text: "Parent letter, newsletter, or briefing?", category: 'module', module: 'communications' },
    { text: "Let's get your message just right.", category: 'module', module: 'communications' },
  ],
  intelligence: [
    { text: "Let's look at what the data says.", category: 'module', module: 'intelligence' },
    { text: "Curious about your school's patterns? Ask away.", category: 'module', module: 'intelligence' },
    { text: "Data-driven decisions — I'm ready!", category: 'module', module: 'intelligence' },
    { text: "What insights shall we explore?", category: 'module', module: 'intelligence' },
  ],
  teaching: [
    { text: "Teaching and learning — my favourite!", category: 'module', module: 'teaching' },
    { text: "Classroom-related question? Fire away.", category: 'module', module: 'teaching' },
    { text: "CPD, curriculum, or workload? Let's talk.", category: 'module', module: 'teaching' },
    { text: "How can I support teaching today?", category: 'module', module: 'teaching' },
  ],
  hr: [
    { text: "Staff matters? I'm here to help.", category: 'module', module: 'hr' },
    { text: "HR query — lay it on me.", category: 'module', module: 'hr' },
    { text: "Absence, recruitment, or performance?", category: 'module', module: 'hr' },
    { text: "Let's support your team.", category: 'module', module: 'hr' },
  ],
  safeguarding: [
    { text: "Safeguarding is everyone's responsibility. How can I help?", category: 'module', module: 'safeguarding' },
    { text: "DSL task? I'm at your service.", category: 'module', module: 'safeguarding' },
    { text: "Concern logging or guidance? I'm ready.", category: 'module', module: 'safeguarding' },
    { text: "Let's keep everyone safe. What do you need?", category: 'module', module: 'safeguarding' },
  ],
  risk: [
    { text: "Risk management — wise thinking!", category: 'module', module: 'risk' },
    { text: "Risk register or health & safety? Ask away.", category: 'module', module: 'risk' },
    { text: "Let's assess and mitigate together.", category: 'module', module: 'risk' },
    { text: "Risk-related query? I'm on it.", category: 'module', module: 'risk' },
  ],
  finance: [
    { text: "Financial query? Let's talk numbers.", category: 'module', module: 'finance' },
    { text: "Budget, ICFP, or procurement? I'm here.", category: 'module', module: 'finance' },
    { text: "School finances — wise owls pay attention!", category: 'module', module: 'finance' },
    { text: "How can I help with the budget?", category: 'module', module: 'finance' },
  ],
};

/**
 * Inspection mode messages — serious, professional
 */
export const INSPECTION_MESSAGES: DialogueLine[] = [
  { text: "Inspection mode active. How can I help you prepare?", category: 'greeting' },
  { text: "Preparing for inspection. What do you need?", category: 'loading' },
  { text: "Evidence located and ready.", category: 'success' },
  { text: "Unable to retrieve. Please retry.", category: 'error' },
  { text: "Awaiting your inspection-related query.", category: 'idle' },
];

/**
 * Get a random dialogue line from a category
 */
export function getRandomLine(category: 'greeting' | 'loading' | 'success' | 'error' | 'idle', module?: string, isInspectionMode = false): string {
  if (isInspectionMode) {
    const inspectionLine = INSPECTION_MESSAGES.find(m => m.category === category);
    return inspectionLine?.text || INSPECTION_MESSAGES[0].text;
  }

  if (module && category === 'module' && MODULE_MESSAGES[module]) {
    const lines = MODULE_MESSAGES[module];
    return lines[Math.floor(Math.random() * lines.length)].text;
  }

  const collections: Record<string, DialogueLine[]> = {
    greeting: GREETINGS,
    loading: LOADING_MESSAGES,
    success: SUCCESS_MESSAGES,
    error: ERROR_MESSAGES,
    idle: IDLE_MESSAGES,
  };

  const lines = collections[category] || GREETINGS;
  return lines[Math.floor(Math.random() * lines.length)].text;
}

/**
 * Get a contextual greeting based on module
 */
export function getContextualGreeting(module: string | null, isInspectionMode = false): string {
  if (isInspectionMode) {
    return INSPECTION_MESSAGES[0].text;
  }

  if (module && MODULE_MESSAGES[module]) {
    const lines = MODULE_MESSAGES[module];
    return lines[Math.floor(Math.random() * lines.length)].text;
  }

  return getRandomLine('greeting');
}
