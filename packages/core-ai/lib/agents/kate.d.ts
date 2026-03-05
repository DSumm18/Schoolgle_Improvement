import { AgentBase } from './agent';
import { type AppointmentDetails } from '../actions/actionRegistry';
/**
 * @class KateAgent
 * The persona for handling scheduling, booking, and other organizational tasks.
 */
export declare class KateAgent extends AgentBase {
    constructor();
    /**
     * Books an appointment using the action registry.
     * @param details The details required for the appointment.
     * @returns The result from the bookAppointment skill.
     */
    bookAppointment(details: AppointmentDetails): Promise<{
        success: boolean;
        message: string;
    }>;
}
export declare const kateAgent: KateAgent;
