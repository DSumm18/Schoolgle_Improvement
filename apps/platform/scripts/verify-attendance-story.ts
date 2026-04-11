#!/usr/bin/env node
/**
 * Verify the Attendance Story generator end-to-end with REAL data + REAL LLM.
 *
 * Run from repo root:
 *   cd apps/platform && npx tsx --env-file=.env.local scripts/verify-attendance-story.ts
 *
 * Or if .env.local is in the apps/platform dir:
 *   cd apps/platform && OPENROUTER_API_KEY=$(grep OPENROUTER_API_KEY .env.local | cut -d= -f2) npx tsx scripts/verify-attendance-story.ts
 *
 * Saves evidence to /tmp/attendance-story-grove-house-<timestamp>.json
 */
import * as fs from 'fs';
import * as path from 'path';
import { generateAttendanceStory } from '../src/lib/documents/attendance-story';

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not set. Source .env.local or export it first.');
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Supabase env vars not set.');
    process.exit(1);
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const evidencePath = path.join('/tmp', `attendance-story-grove-house-${ts}.json`);

  console.log('🔍 Fetching and generating attendance story for Grove House (URN 148201)...');

  try {
    const result = await generateAttendanceStory({
      urn: 148201,
      organizationId: '00000000-0000-0000-0000-000000000001',
      userId: '00000000-0000-0000-0000-000000000002',
    });

    const evidence = {
      timestamp: ts,
      urn: 148201,
      documentId: result.documentId,
      title: result.title,
      sourceConnectors: result.sourceConnectors,
      missingConnectors: result.missingConnectors,
      llmModel: result.llmModel,
      llmTokensUsed: result.llmTokensUsed,
      guardianCategoriesDetected: result.guardianCategoriesDetected,
      narrative: result.narrative,
    };

    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ ATTENDANCE STORY GENERATED');
    console.log('═══════════════════════════════════════════');
    console.log(`Title: ${result.title}`);
    console.log(`Model: ${result.llmModel}`);
    console.log(`Tokens: ${result.llmTokensUsed}`);
    console.log(`Sources: ${result.sourceConnectors.join(', ')}`);
    console.log(`Guardian detected: ${result.guardianCategoriesDetected.join(', ') || 'nothing'}`);
    console.log('\n═══════════════════════════════════════════');
    console.log('NARRATIVE');
    console.log('═══════════════════════════════════════════\n');
    console.log(result.narrative);
    console.log('\n═══════════════════════════════════════════');
    console.log(`Evidence saved to: ${evidencePath}`);
    console.log('═══════════════════════════════════════════');
  } catch (error) {
    console.error('❌ FAILED:', error);
    process.exit(1);
  }
}

main();
