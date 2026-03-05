// /packages/core-ai/actions/actionRegistry.ts

import { bookAppointment, type AppointmentDetails } from './bookAppointment';
import { sendEmail, type EmailDetails } from './sendEmail';
import { translateMessage, type TranslationDetails } from './translateMessage';
import { 
  comprehensiveActionRegistry, 
  getActionByName, 
  getActionsByCategory, 
  getAllActionNames,
  type ActionDefinition 
} from './comprehensiveActionRegistry';

/**
 * A central registry of all available "skills" or "actions" that an agent can perform.
 * This pattern makes the system modular and extensible. To add a new action,
 * simply create the action file and register it here.
 */

// Simple registry for basic actions
export const actionRegistry = {
  bookAppointment,
  sendEmail,
  translateMessage,
};

// Comprehensive registry for all platform actions
export {
  comprehensiveActionRegistry,
  getActionByName,
  getActionsByCategory,
  getAllActionNames,
  type ActionDefinition
};

// Re-exporting types for convenience so they can be imported from the registry
export type { AppointmentDetails, EmailDetails, TranslationDetails };
