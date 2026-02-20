import { NextRequest, NextResponse } from 'next/server';
import { createOrchestrator } from '@schoolgle/ed-agents';
import type { EdOrchestrator } from '@schoolgle/ed-agents/types';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { organizationId, to, subject, body: messageBody, channel, priority } = body;

        if (!organizationId || !to || !messageBody) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Initialize Orchestrator for this school
        const orchestrator = new EdOrchestrator(organizationId);

        const result = await orchestrator.sendMessage({
            to,
            subject,
            body: messageBody,
            channel: channel || 'email',
            priority: priority || 'normal'
        });

        // If the result indicates the message was queued for approval
        if (result.success && result.status === 'queued') {
            return NextResponse.json({
                success: true,
                message: 'Message sent for human review.',
                status: 'queued'
            });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[Communication API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
