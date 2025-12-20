import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { trackUsageSchema, validateRequest } from '@/lib/validations';
import { standardLimiter } from '@/lib/rateLimit';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        // Rate limiting check
        const rateLimitResult = await standardLimiter.check(req);
        if (!rateLimitResult.allowed) {
            return rateLimitResult.response!;
        }

        // Parse and validate request body
        const body = await req.json();
        const validation = validateRequest(trackUsageSchema, body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const {
            organizationId,
            userId,
            eventType,
            eventCategory,
            metadata,
            sessionId,
            aiModel,
            aiTokensInput,
            aiTokensOutput,
            aiCostUsd
        } = validation.data;

        // Insert usage event
        const { data, error } = await supabase
            .from('usage_events')
            .insert({
                organization_id: organizationId,
                user_id: userId,
                event_type: eventType,
                event_category: eventCategory,
                metadata,
                session_id: sessionId,
                ai_model: aiModel,
                ai_tokens_input: aiTokensInput,
                ai_tokens_output: aiTokensOutput,
                ai_cost_usd: aiCostUsd
            })
            .select()
            .single();

        if (error) {
            console.error('Error tracking usage:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update daily summary (upsert)
        const today = new Date().toISOString().split('T')[0];
        
        // Get current summary or create new one
        const { data: summary } = await supabase
            .from('usage_daily_summary')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('date', today)
            .single();

        const updateData: any = {
            total_events: (summary?.total_events || 0) + 1,
        };

        // Update specific counters based on event type
        switch (eventType) {
            case 'page_view':
                updateData.page_views = (summary?.page_views || 0) + 1;
                break;
            case 'ai_chat':
            case 'ed_chat':
                updateData.ai_chats = (summary?.ai_chats || 0) + 1;
                break;
            case 'report_generated':
                updateData.reports_generated = (summary?.reports_generated || 0) + 1;
                break;
            case 'action_created':
                updateData.actions_created = (summary?.actions_created || 0) + 1;
                break;
            case 'action_completed':
                updateData.actions_completed = (summary?.actions_completed || 0) + 1;
                break;
            case 'assessment_updated':
                updateData.assessments_updated = (summary?.assessments_updated || 0) + 1;
                break;
            case 'document_uploaded':
                updateData.documents_uploaded = (summary?.documents_uploaded || 0) + 1;
                break;
            case 'voice_observation':
                updateData.voice_observations = (summary?.voice_observations || 0) + 1;
                break;
            case 'mock_inspection':
                updateData.mock_inspections = (summary?.mock_inspections || 0) + 1;
                break;
        }

        // Update AI costs if applicable
        if (aiCostUsd) {
            const currentCost = typeof summary?.ai_total_cost_usd === 'string' ? parseFloat(summary.ai_total_cost_usd) : (summary?.ai_total_cost_usd || 0);
            const currentTokens = typeof summary?.ai_total_tokens === 'string' ? parseInt(summary.ai_total_tokens, 10) : (typeof summary?.ai_total_tokens === 'number' ? summary.ai_total_tokens : 0);
            const inputTokens = typeof aiTokensInput === 'string' ? parseInt(aiTokensInput, 10) : (aiTokensInput || 0);
            const outputTokens = typeof aiTokensOutput === 'string' ? parseInt(aiTokensOutput, 10) : (aiTokensOutput || 0);
            const costUsd = typeof aiCostUsd === 'string' ? parseFloat(aiCostUsd) : (aiCostUsd || 0);
            updateData.ai_total_cost_usd = String(currentCost + costUsd);
            updateData.ai_total_tokens = String(Number(currentTokens) + Number(inputTokens) + Number(outputTokens));
        }

        await supabase
            .from('usage_daily_summary')
            .upsert({
                organization_id: organizationId,
                date: today,
                ...updateData
            }, {
                onConflict: 'organization_id,date'
            });

        return NextResponse.json({ success: true, eventId: data.id });
    } catch (error: any) {
        console.error('Error tracking usage:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

