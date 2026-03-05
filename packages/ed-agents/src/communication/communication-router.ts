import { CommunicationChannel, CommunicationPayload, CommunicationResult, CommunicationProvider } from './types';
import { CreditManager } from '../credit/manager';

/**
 * Communication Router
 * Manages delivery across multiple channels
 */
export class CommunicationRouter {
    private providers: Map<string, CommunicationProvider> = new Map();
    private creditManager: CreditManager;

    constructor(creditManager: CreditManager) {
        this.creditManager = creditManager;
    }

    /**
     * Register a provider
     */
    registerProvider(provider: CommunicationProvider) {
        this.providers.set(provider.id, provider);
    }

    /**
     * Send a message through the best channel
     */
    async send(payload: CommunicationPayload): Promise<CommunicationResult> {
        const channel = payload.channel || this.determineChannel(payload);
        const provider = this.getProviderForChannel(channel);

        if (!provider) {
            return {
                success: false,
                channel,
                cost: 0,
                error: `No provider registered for channel: ${channel}`
            };
        }

        // Calculate estimated cost
        const estimatedCost = this.estimateCost(channel, payload.body);

        // Check credits
        if (!this.creditManager.hasSufficientCredits(estimatedCost)) {
            return {
                success: false,
                channel,
                cost: 0,
                error: `Insufficient credits. Estimated cost: ${estimatedCost}, Remaining: ${this.creditManager.getRemainingCredits()}`
            };
        }

        try {
            const result = await provider.send({ ...payload, channel });

            // Track usage if successful
            if (result.success) {
                // We'll update CreditManager to track communication costs later
                // this.creditManager.trackCommunication(channel, result.cost);
            }

            return result;
        } catch (error) {
            return {
                success: false,
                channel,
                cost: 0,
                error: error instanceof Error ? error.message : 'Unknown error during transmission'
            };
        }
    }

    /**
     * Determine the best channel based on priority and payload
     */
    private determineChannel(payload: CommunicationPayload): CommunicationChannel {
        if (payload.priority === 'urgent' || payload.priority === 'high') {
            return 'sms';
        }
        return 'email';
    }

    /**
     * Get a provider that supports a specific channel
     */
    private getProviderForChannel(channel: CommunicationChannel): CommunicationProvider | undefined {
        return Array.from(this.providers.values()).find(p => p.supportedChannels.includes(channel));
    }

    /**
     * Estimate cost for a message
     */
    private estimateCost(channel: CommunicationChannel, body: string): number {
        switch (channel) {
            case 'email': return 0; // Free fallback
            case 'sms': return 2;
            case 'voice': return 10; // 10 credits per minute (baseline for notification)
            case 'tts': return 1;    // 1 credit per generation
            default: return 0;
        }
    }
}
