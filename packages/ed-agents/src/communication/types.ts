/**
 * Communication Types
 */

export type CommunicationChannel = 'email' | 'sms' | 'voice' | 'tts' | 'push';

export interface CommunicationPayload {
    to: string;
    subject?: string;
    body: string;
    channel?: CommunicationChannel;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    metadata?: Record<string, any>;
}

export interface CommunicationResult {
    success: boolean;
    status?: 'sent' | 'queued' | 'failed';
    messageId?: string;
    channel: CommunicationChannel;
    cost: number;
    error?: string;
}

export interface CommunicationProvider {
    id: string;
    supportedChannels: CommunicationChannel[];
    send(payload: CommunicationPayload): Promise<CommunicationResult>;
}
