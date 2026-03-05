export interface EmailDetails {
    to: string;
    subject: string;
    body: string;
    priority?: 'low' | 'normal' | 'high';
}
/**
 * Sends an email to the specified recipient.
 * This is a placeholder implementation that would integrate with the school's email system.
 */
export declare function sendEmail(details: EmailDetails): Promise<{
    success: boolean;
    message: string;
}>;
