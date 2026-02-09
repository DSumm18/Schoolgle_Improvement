import { createOrchestrator } from './orchestrator';
import { OrchestratorConfig } from '../types';

/**
 * Verification Script for Communication Infrastructure
 */
async function verifyCommunication() {
    console.log('--- Verification Started: Priority 3 ---');

    const config: OrchestratorConfig = {
        userId: 'test-user',
        orgId: 'test-org',
        userRole: 'admin',
        subscription: {
            plan: 'pro',
            features: ['email', 'sms', 'tts'],
            creditsRemaining: 1000,
            creditsUsed: 0,
        },
        activeApp: 'estates',
        openRouterApiKey: 'test-key',
    };

    // Set environment variables for providers
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.TWILIO_ACCOUNT_SID = 'AC_test_sid';
    process.env.TWILIO_AUTH_TOKEN = 'test_token';
    process.env.NEXT_PUBLIC_FISH_AUDIO_API_KEY = 'fish_test_key';

    const orchestrator = await createOrchestrator(config);

    console.log('1. Testing Email Delivery (Resend)...');
    const emailResult = await orchestrator.sendMessage({
        to: 'admin@school.com',
        subject: 'Compliance Summary',
        body: 'Your weekly legionella report is ready.',
        channel: 'email'
    });
    console.log('Result:', emailResult);
    console.log('Credits After Email:', orchestrator.getCreditSummary().estimatedRemaining);

    console.log('\n2. Testing SMS Delivery (Twilio - High Priority)...');
    const smsResult = await orchestrator.sendMessage({
        to: '+447700900000',
        body: 'URGENT: Legionella flushing is 2 days overdue!',
        priority: 'urgent'
    });
    console.log('Result:', smsResult);
    console.log('Credits After SMS:', orchestrator.getCreditSummary().estimatedRemaining);

    console.log('\n3. Testing TTS Generation (Fish Audio)...');
    const ttsResult = await orchestrator.sendMessage({
        to: 'client-audio',
        body: 'Hello, this is Edwina from Schoolgle. I have found an overdue task in the infant block.',
        channel: 'tts'
    });
    console.log('Result:', ttsResult);
    console.log('Credits After TTS:', orchestrator.getCreditSummary().estimatedRemaining);

    console.log('\n--- Verification Summary ---');
    const summary = orchestrator.getCreditSummary();
    console.log(`Final Credits: ${summary.estimatedRemaining}`);
    console.log(`Session Usage: ${summary.sessionUsage}`);

    if (summary.sessionUsage === 3) {
        console.log('✅ CREDIT VERIFICATION PASSED: Email(0) + SMS(2) + TTS(1) = 3');
    } else {
        console.log('❌ CREDIT VERIFICATION FAILED: Expected 3 (0+2+1), got', summary.sessionUsage);
    }
}

verifyCommunication().catch(console.error);
