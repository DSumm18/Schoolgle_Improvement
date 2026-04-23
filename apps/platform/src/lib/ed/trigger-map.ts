/**
 * Ed Trigger Map
 *
 * Maps user actions and system events to Ed's responses and state changes.
 * This defines when Ed should change expression, show dialogue, or trigger actions.
 */

export interface TriggerEvent {
  type: 'user_action' | 'system_event' | 'ai_response' | 'error' | 'milestone';
  event: string;
  edState: 'idle' | 'thinking' | 'speaking' | 'success' | 'error';
  edExpression: 'neutral' | 'blink' | 'happy' | 'concerned' | 'proud' | 'blush';
  dialogue?: string;
}

/**
 * Core trigger mappings for Ed's behaviour
 */
export const TRIGGER_MAP: Record<string, Partial<TriggerEvent>> = {
  // User initiates chat
  'chat:open': {
    type: 'user_action',
    event: 'chat:open',
    edState: 'idle',
    edExpression: 'happy',
    dialogue: 'Hello! How can I help with your school improvement today?',
  },

  // User sends message
  'message:sent': {
    type: 'user_action',
    event: 'message:sent',
    edState: 'thinking',
    edExpression: 'neutral',
  },

  // AI starts responding
  'ai:responding': {
    type: 'ai_response',
    event: 'ai:responding',
    edState: 'thinking',
    edExpression: 'neutral',
  },

  // AI response complete
  'ai:complete': {
    type: 'ai_response',
    event: 'ai:complete',
    edState: 'speaking',
    edExpression: 'happy',
  },

  // User completes a task
  'task:complete': {
    type: 'user_action',
    event: 'task:complete',
    edState: 'success',
    edExpression: 'proud',
    dialogue: 'Brilliant — that\'s all sorted!',
  },

  // Task saved successfully
  'task:saved': {
    type: 'system_event',
    event: 'task:saved',
    edState: 'success',
    edExpression: 'proud',
    dialogue: 'Successfully saved. Onwards and upwards!',
  },

  // API error
  'error:api': {
    type: 'error',
    event: 'error:api',
    edState: 'error',
    edExpression: 'concerned',
    dialogue: 'Oh feathers! Something went wrong. Let\'s try that again.',
  },

  // Network error
  'error:network': {
    type: 'error',
    event: 'error:network',
    edState: 'error',
    edExpression: 'concerned',
    dialogue: 'Sorry — connection issue. Can we try that again?',
  },

  // Validation error
  'error:validation': {
    type: 'error',
    event: 'error:validation',
    edState: 'error',
    edExpression: 'concerned',
    dialogue: 'That doesn\'t look quite right. Can you check and try again?',
  },

  // First visit
  'first_visit': {
    type: 'system_event',
    event: 'first_visit',
    edState: 'idle',
    edExpression: 'happy',
    dialogue: 'Welcome to Schoolgle! I\'m Ed, your school improvement assistant. Let me show you around!',
  },

  // Module changed
  'module:changed': {
    type: 'system_event',
    event: 'module:changed',
    edState: 'idle',
    edExpression: 'blink',
    // Dialogue is generated dynamically based on module
  },

  // Inspection mode activated
  'inspection:on': {
    type: 'user_action',
    event: 'inspection:on',
    edState: 'idle',
    edExpression: 'neutral',
    dialogue: 'Inspection mode activated. I\'m ready to help you prepare.',
  },

  // Inspection mode deactivated
  'inspection:off': {
    type: 'user_action',
    event: 'inspection:off',
    edState: 'idle',
    edExpression: 'happy',
    dialogue: 'Back to normal! How can I help?',
  },

  // User achieves milestone
  'milestone:ofsted_ready': {
    type: 'milestone',
    event: 'milestone:ofsted_ready',
    edState: 'success',
    edExpression: 'proud',
    dialogue: 'Fantastic work! Your school is looking inspection-ready!',
  },

  // Document generated
  'document:generated': {
    type: 'system_event',
    event: 'document:generated',
    edState: 'success',
    edExpression: 'proud',
    dialogue: 'Document created! Anything else you need?',
  },

  // Evidence uploaded
  'evidence:uploaded': {
    type: 'user_action',
    event: 'evidence:uploaded',
    edState: 'success',
    edExpression: 'proud',
    dialogue: 'Evidence saved! Every bit counts.',
  },

  // Risk logged
  'risk:logged': {
    type: 'user_action',
    event: 'risk:logged',
    edState: 'success',
    edExpression: 'neutral',
    dialogue: 'Risk recorded. Wise thinking.',
  },

  // Governor training completed
  'training:complete': {
    type: 'user_action',
    event: 'training:complete',
    edState: 'success',
    edExpression: 'proud',
    dialogue: 'Training logged! Well done.',
  },

  // Long inactivity
  'inactive:long': {
    type: 'system_event',
    event: 'inactive:long',
    edState: 'idle',
    edExpression: 'neutral',
    dialogue: 'Still here if you need me...',
  },

  // User returns after inactivity
  'user:returned': {
    type: 'user_action',
    event: 'user:returned',
    edState: 'idle',
    edExpression: 'happy',
    dialogue: 'Welcome back! What shall we work on?',
  },

  // Proactive suggestion
  'proactive:suggestion': {
    type: 'system_event',
    event: 'proactive:suggestion',
    edState: 'idle',
    edExpression: 'blink',
    // Dialogue generated dynamically
  },

  // Quick action selected
  'quick_action:selected': {
    type: 'user_action',
    event: 'quick_action:selected',
    edState: 'thinking',
    edExpression: 'neutral',
  },
};

/**
 * Get the trigger configuration for an event
 */
export function getTrigger(eventKey: string): TriggerEvent | null {
  const trigger = TRIGGER_MAP[eventKey];
  if (!trigger) return null;

  return {
    type: trigger.type || 'system_event',
    event: eventKey,
    edState: trigger.edState || 'idle',
    edExpression: trigger.edExpression || 'neutral',
    dialogue: trigger.dialogue,
  };
}

/**
 * Get all triggers for a specific type
 */
export function getTriggersByType(type: TriggerEvent['type']): TriggerEvent[] {
  return Object.entries(TRIGGER_MAP)
    .filter(([, config]) => config.type === type)
    .map(([event, config]) => ({
      type: config.type || 'system_event',
      event,
      edState: config.edState || 'idle',
      edExpression: config.edExpression || 'neutral',
      dialogue: config.dialogue,
    }));
}

/**
 * Check if an event should trigger a state change
 */
export function shouldTriggerStateChange(eventKey: string): boolean {
  const trigger = TRIGGER_MAP[eventKey];
  return trigger?.edState !== undefined;
}

/**
 * Get the new state for an event
 */
export function getStateForEvent(eventKey: string): 'idle' | 'thinking' | 'speaking' | 'success' | 'error' {
  const trigger = TRIGGER_MAP[eventKey];
  return trigger?.edState || 'idle';
}

/**
 * Get the new expression for an event
 */
export function getExpressionForEvent(eventKey: string): 'neutral' | 'blink' | 'happy' | 'concerned' | 'proud' | 'blush' {
  const trigger = TRIGGER_MAP[eventKey];
  return trigger?.edExpression || 'neutral';
}

/**
 * Module-specific triggers when entering different areas
 */
export const MODULE_ENTER_TRIGGERS: Record<string, Partial<TriggerEvent>> = {
  improvement: {
    edState: 'idle',
    edExpression: 'neutral',
    dialogue: 'Working on school improvement? Wise choice.',
  },
  governance: {
    edState: 'idle',
    edExpression: 'neutral',
    dialogue: 'Governance matters! How can I support the board?',
  },
  estates: {
    edState: 'idle',
    edExpression: 'neutral',
    dialogue: 'Estates and premises — at your service!',
  },
  compliance: {
    edState: 'idle',
    edExpression: 'neutral',
    dialogue: 'Compliance is key. What do you need?',
  },
  communications: {
    edState: 'idle',
    edExpression: 'happy',
    dialogue: 'Time to communicate? I can help draft that!',
  },
  intelligence: {
    edState: 'idle',
    edExpression: 'blink',
    dialogue: 'Let\'s look at what the data says.',
  },
  teaching: {
    edState: 'idle',
    edExpression: 'happy',
    dialogue: 'Teaching and learning — my favourite!',
  },
  hr: {
    edState: 'idle',
    edExpression: 'neutral',
    dialogue: 'Staff matters? I\'m here to help.',
  },
  safeguarding: {
    edState: 'idle',
    edExpression: 'neutral',
    dialogue: 'Safeguarding is everyone\'s responsibility. How can I help?',
  },
  risk: {
    edState: 'idle',
    edExpression: 'neutral',
    dialogue: 'Risk management — wise thinking!',
  },
  finance: {
    edState: 'idle',
    edExpression: 'neutral',
    dialogue: 'Financial query? Let\'s talk numbers.',
  },
};

/**
 * Get trigger when user enters a module
 */
export function getModuleEnterTrigger(module: string): TriggerEvent | null {
  const trigger = MODULE_ENTER_TRIGGERS[module];
  if (!trigger) return null;

  return {
    type: 'system_event',
    event: `module:enter:${module}`,
    edState: trigger.edState || 'idle',
    edExpression: trigger.edExpression || 'neutral',
    dialogue: trigger.dialogue,
  };
}
