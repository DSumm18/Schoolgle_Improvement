import { useCallback, useEffect, useRef } from 'react';

interface TrackingOptions {
    organizationId: string | null;
    userId: string | null;
}

interface AIUsage {
    model: string;
    tokensInput: number;
    tokensOutput: number;
    costUsd: number;
}

// Generate a session ID that persists across page loads
const getSessionId = () => {
    if (typeof window === 'undefined') return '';
    
    let sessionId = sessionStorage.getItem('schoolgle_session_id');
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('schoolgle_session_id', sessionId);
    }
    return sessionId;
};

export function useUsageTracking({ organizationId, userId }: TrackingOptions) {
    const sessionId = useRef(getSessionId());

    // Track an event
    const trackEvent = useCallback(async (
        eventType: string,
        eventCategory?: string,
        metadata?: Record<string, any>,
        aiUsage?: AIUsage
    ) => {
        if (!organizationId) return;

        try {
            await fetch('/api/usage/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    userId,
                    eventType,
                    eventCategory,
                    metadata,
                    sessionId: sessionId.current,
                    ...(aiUsage && {
                        aiModel: aiUsage.model,
                        aiTokensInput: aiUsage.tokensInput,
                        aiTokensOutput: aiUsage.tokensOutput,
                        aiCostUsd: aiUsage.costUsd
                    })
                })
            });
        } catch (error) {
            // Silently fail - usage tracking shouldn't break the app
            console.warn('Failed to track usage:', error);
        }
    }, [organizationId, userId]);

    // Convenience methods
    const trackPageView = useCallback((pageName: string) => {
        trackEvent('page_view', 'navigation', { page: pageName });
    }, [trackEvent]);

    const trackAIChat = useCallback((prompt: string, aiUsage: AIUsage) => {
        trackEvent('ai_chat', 'ai', { promptLength: prompt.length }, aiUsage);
    }, [trackEvent]);

    const trackReportGenerated = useCallback((reportType: string) => {
        trackEvent('report_generated', 'documents', { reportType });
    }, [trackEvent]);

    const trackActionCreated = useCallback((framework: string, categoryId: string) => {
        trackEvent('action_created', 'actions', { framework, categoryId });
    }, [trackEvent]);

    const trackActionCompleted = useCallback((actionId: string) => {
        trackEvent('action_completed', 'actions', { actionId });
    }, [trackEvent]);

    const trackAssessmentUpdated = useCallback((framework: string, categoryId: string, rating: number) => {
        trackEvent('assessment_updated', 'assessments', { framework, categoryId, rating });
    }, [trackEvent]);

    const trackDocumentUploaded = useCallback((fileType: string, fileSize: number) => {
        trackEvent('document_uploaded', 'documents', { fileType, fileSize });
    }, [trackEvent]);

    const trackVoiceObservation = useCallback((duration: number, aiUsage: AIUsage) => {
        trackEvent('voice_observation', 'ai', { duration }, aiUsage);
    }, [trackEvent]);

    const trackMockInspection = useCallback((persona: string, aiUsage: AIUsage) => {
        trackEvent('mock_inspection', 'ai', { persona }, aiUsage);
    }, [trackEvent]);

    const trackLogin = useCallback(() => {
        trackEvent('login', 'auth');
    }, [trackEvent]);

    const trackFeatureUsed = useCallback((featureName: string) => {
        trackEvent('feature_used', 'engagement', { feature: featureName });
    }, [trackEvent]);

    return {
        trackEvent,
        trackPageView,
        trackAIChat,
        trackReportGenerated,
        trackActionCreated,
        trackActionCompleted,
        trackAssessmentUpdated,
        trackDocumentUploaded,
        trackVoiceObservation,
        trackMockInspection,
        trackLogin,
        trackFeatureUsed
    };
}

// AI cost calculator based on model
export const calculateAICost = (
    model: string,
    tokensInput: number,
    tokensOutput: number
): number => {
    // Prices per 1M tokens (as of Nov 2025 - update as needed)
    const pricing: Record<string, { input: number; output: number }> = {
        'gpt-4o': { input: 2.50, output: 10.00 },
        'gpt-4o-mini': { input: 0.15, output: 0.60 },
        'gpt-4-turbo': { input: 10.00, output: 30.00 },
        'claude-3-opus': { input: 15.00, output: 75.00 },
        'claude-3-sonnet': { input: 3.00, output: 15.00 },
        'claude-3-haiku': { input: 0.25, output: 1.25 },
        'whisper': { input: 0.006, output: 0 }, // per second, not token
    };

    const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
    
    const inputCost = (tokensInput / 1_000_000) * modelPricing.input;
    const outputCost = (tokensOutput / 1_000_000) * modelPricing.output;
    
    return inputCost + outputCost;
};

