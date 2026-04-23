/**
 * Ed Voice System
 *
 * Complete personality system for Ed the Schoolgle owl.
 * Exports system prompts, dialogue bank, and trigger mappings.
 *
 * @see lib/ed/voice-system-prompt.ts - Core personality and system prompts
 * @see lib/ed/dialogue-bank.ts - Ambient dialogue lines for UI states
 * @see lib/ed/trigger-map.ts - Event-to-response mappings
 */

export {
  ED_VOICE_SYSTEM_PROMPT,
  ED_INSPECTION_MODE_PROMPT,
  getEdSystemPrompt,
  getModuleContext,
} from './voice-system-prompt';

export {
  GREETINGS,
  LOADING_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  IDLE_MESSAGES,
  MODULE_MESSAGES,
  INSPECTION_MESSAGES,
  getRandomLine,
  getContextualGreeting,
  type DialogueLine,
} from './dialogue-bank';

export {
  TRIGGER_MAP,
  MODULE_ENTER_TRIGGERS,
  getTrigger,
  getTriggersByType,
  shouldTriggerStateChange,
  getStateForEvent,
  getExpressionForEvent,
  getModuleEnterTrigger,
  type TriggerEvent,
} from './trigger-map';
