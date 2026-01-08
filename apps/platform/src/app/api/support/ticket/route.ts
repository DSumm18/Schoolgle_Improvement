import { NextRequest } from 'next/server';
import { withErrorHandling, apiSuccess, apiError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
    return withErrorHandling(async () => {
        const body = await req.json();
        const { subject, description, email, flightData } = body;

        if (!subject || !description) {
            return apiError('Subject and description are required', 400);
        }

        // Log the ticket locally for audit
        console.log(`[Support] New Ticket from ${email || 'Anonymous'}: ${subject}`);
        console.log(`[Support] Flight Recorder Data:`, flightData);

        // Forward to Mission Control (simulated)
        try {
            // const response = await fetch('https://api.schoolgle.co.uk/mission-control/tickets', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(body)
            // });
            // if (!response.ok) throw new Error('Mission Control rejected ticket');
        } catch (e) {
            console.error('[Support] Failed to forward ticket to Mission Control:', e);
            // We still return success if we logged it, or we could fail if mission critical.
            // For now, assume it's queued or logged.
        }

        return apiSuccess({ ticketId: `TKT-${Math.floor(Math.random() * 1000000)}` });
    }, 'Support Ticket API');
}
