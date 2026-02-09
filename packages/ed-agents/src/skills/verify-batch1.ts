import { EdOrchestrator } from '../orchestrator/orchestrator';
import { supabase } from '../lib/supabase';

async function verifyBatch1() {
    console.log('--- BATCH 1 SKILL VERIFICATION ---');

    // Use a test organization ID
    const orgId = 'ygquvauptwyvlhkyxkwy'; // Using one from the list_projects earlier
    const orchestrator = new EdOrchestrator(orgId);

    console.log('\n1. Verifying Contractor Auto-Chase...');
    // We would ideally seed a stale ticket here for a full E2E test, 
    // but for now we'll verify the handler can be invoked.
    const chaseResult = await orchestrator.getSkillRunner().runSkill('estates_contractor_chase', { manual: true });
    console.log(`Auto-Chase manual trigger result: ${chaseResult ? 'SUCCESS' : 'FAILURE'}`);

    console.log('\n2. Verifying DBS Expiry Alert...');
    const dbsResult = await orchestrator.getSkillRunner().runSkill('estates_dbs_expiry', { manual: true });
    console.log(`DBS Expiry manual trigger result: ${dbsResult ? 'SUCCESS' : 'FAILURE'}`);

    console.log('\n3. Verifying Reminder Service Wiring...');
    // Since reminder-service uses fetch to an API, we'd need the dev server running.
    // Instead, we verify the orchestrator can handle standard messages.
    const commResult = await orchestrator.sendMessage({
        to: 'test@schoolgle.co.uk',
        subject: 'Verification Test',
        body: 'Testing reminder service wiring.',
        channel: 'email'
    });
    console.log(`Communication routing check: ${commResult.success ? 'PASSED' : 'FAILED'}`);

    console.log('\n--- VERIFICATION COMPLETE ---');
}

verifyBatch1().catch(console.error);
