import { type AppointmentDetails } from './bookAppointment';
import { type EmailDetails } from './sendEmail';
import { type TranslationDetails } from './translateMessage';
export interface ActionHandler {
    (params: any): Promise<any>;
}
export interface ActionDefinition {
    name: string;
    description: string;
    parameters: any;
    handler: ActionHandler;
    category: 'communication' | 'scheduling' | 'finance' | 'compliance' | 'general';
}
export declare const comprehensiveActionRegistry: {
    [x: string]: ActionDefinition;
};
export declare function getActionByName(name: string): ActionDefinition | undefined;
export declare function getActionsByCategory(category: string): ActionDefinition[];
export declare function getAllActionNames(): string[];
export type { AppointmentDetails, EmailDetails, TranslationDetails };
