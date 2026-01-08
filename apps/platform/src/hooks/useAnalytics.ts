"use client";

import { useAuth } from "@/context/SupabaseAuthContext";

export function useAnalytics() {
    const { user, organization } = useAuth();

    const track = (event: string, properties?: Record<string, any>) => {
        // Send to Mission Control analytics endpoint
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event,
                properties: {
                    ...properties,
                    userId: user?.id,
                    email: user?.email,
                    orgId: organization?.id,
                    orgName: organization?.name,
                },
                timestamp: new Date().toISOString(),
                url: typeof window !== 'undefined' ? window.location.href : '',
            })
        }).catch(err => {
            console.error('[Analytics] Failed to track event:', err);
        });
    };

    return { track };
}
