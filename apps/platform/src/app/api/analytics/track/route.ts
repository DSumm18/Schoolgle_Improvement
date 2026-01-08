import { NextRequest } from 'next/server';
import { withErrorHandling, apiSuccess } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
    return withErrorHandling(async () => {
        const body = await req.json();

        // In a real scenario, we would forward this to the actual Mission Control 
        // analytics service. For now, we log it and return success.
        console.log(`[Analytics] Event: ${body.event}`, body.properties);

        // Forwarding to Mission Control (simulated)
        try {
            // await fetch('https://api.schoolgle.co.uk/mission-control/track', {
            //   method: 'POST',
            //   body: JSON.stringify(body)
            // });
        } catch (e) {
            console.error('[Analytics] Failed to forward to Mission Control:', e);
        }

        return apiSuccess({ received: true });
    }, 'Analytics Track API');
}
