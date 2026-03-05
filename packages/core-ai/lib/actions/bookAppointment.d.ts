export interface AppointmentDetails {
    parentName: string;
    childName: string;
    childClass: string;
    reason: string;
    preferredDate?: string;
    preferredTime?: string;
}
/**
 * Books an appointment for a parent to meet with school staff.
 * This is a placeholder implementation that would integrate with the school's calendar system.
 */
export declare function bookAppointment(details: AppointmentDetails): Promise<{
    success: boolean;
    message: string;
}>;
