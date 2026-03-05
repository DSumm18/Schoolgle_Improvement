import { bookAppointment, type AppointmentDetails } from './bookAppointment';
import { sendEmail, type EmailDetails } from './sendEmail';
import { translateMessage, type TranslationDetails } from './translateMessage';
import { comprehensiveActionRegistry, getActionByName, getActionsByCategory, getAllActionNames, type ActionDefinition } from './comprehensiveActionRegistry';
/**
 * A central registry of all available "skills" or "actions" that an agent can perform.
 * This pattern makes the system modular and extensible. To add a new action,
 * simply create the action file and register it here.
 */
export declare const actionRegistry: {
    bookAppointment: typeof bookAppointment;
    sendEmail: typeof sendEmail;
    translateMessage: typeof translateMessage;
};
export { comprehensiveActionRegistry, getActionByName, getActionsByCategory, getAllActionNames, type ActionDefinition };
export type { AppointmentDetails, EmailDetails, TranslationDetails };
