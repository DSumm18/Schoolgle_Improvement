"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import EdWidgetWrapper from "@/components/EdWidgetWrapper";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function GlobalAssistant() {
    const { user, organizationId, isEdEnabled } = useAuth();
    const pathname = usePathname();

    const [edChatbotOpen, setEdChatbotOpen] = useState(false);
    const [edChatbotMinimized, setEdChatbotMinimized] = useState(false);
    const [edContext, setEdContext] = useState<any>({
        school_status: 'analyzing',
        assessment_summary: {}
    });

    // Determine mode: 'user' if logged in, 'demo' if on marketing pages
    const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/evidence') || pathname?.startsWith('/timeline') || pathname?.startsWith('/packs');
    const mode = user ? 'user' : 'demo';

    // Fetch context if in dashboard
    useEffect(() => {
        if (user && organizationId && isDashboard) {
            fetchAssessmentStats();
        }
    }, [user, organizationId, isDashboard]);

    async function fetchAssessmentStats() {
        try {
            const { data } = await supabase
                .from('ofsted_assessments')
                .select('school_rating')
                .eq('organization_id', organizationId);

            if (data) {
                const counts: Record<string, number> = {};
                data.forEach(a => {
                    counts[a.school_rating] = (counts[a.school_rating] || 0) + 1;
                });
                setEdContext({
                    school_status: counts.urgent_improvement > 0 ? 'critical' : counts.needs_attention > 0 ? 'attention' : 'healthy',
                    assessment_summary: counts,
                    total_assessments: data.length
                });
            }
        } catch (error) {
            console.error('[GlobalAssistant] Error fetching stats:', error);
        }
    }

    // Ed will be shown if:
    // 1. We are in demo mode (not logged in) -> Shows up on landing pages to "sell"
    // 2. We are logged in AND Ed is enabled for the organization
    const shouldShowEd = mode === 'demo' || isEdEnabled;

    return (
        <>
            {shouldShowEd && (
                <EdWidgetWrapper
                    isOpen={edChatbotOpen}
                    onToggle={() => setEdChatbotOpen(!edChatbotOpen)}
                    isMinimized={edChatbotMinimized}
                    onToggleMinimize={() => setEdChatbotMinimized(!edChatbotMinimized)}
                    mode={mode}
                    context={edContext}
                />
            )}
        </>
    );
}
