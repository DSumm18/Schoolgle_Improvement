#!/usr/bin/env node

/**
 * Ed Voice System Verification Script
 *
 * Verifies all components of Ed's voice system are in place
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, 'apps', 'platform');

console.log('🐘 Ed Voice System Verification\n');
console.log('=' .repeat(50));

let passCount = 0;
let failCount = 0;

function check(label, condition) {
  if (condition) {
    console.log(`✓ ${label}`);
    passCount++;
  } else {
    console.log(`✗ ${label}`);
    failCount++;
  }
}

// Check voice system assets
console.log('\n📁 Voice System Assets:');

const voiceAssets = [
  'public/ed/voice/system-prompt.md',
  'public/ed/voice/dialogue-bank.json',
  'public/ed/voice/trigger-map.json',
  'public/ed/voice/module-dialogue.json',
  'public/ed/voice/README.md',
];

for (const asset of voiceAssets) {
  const fullPath = path.join(ROOT, asset);
  check(asset, fs.existsSync(fullPath));
}

// Check trigger system
console.log('\n🔧 Trigger System:');

const triggerSystemPath = path.join(ROOT, 'src/lib/ed-voice-trigger-system.ts');
check('ed-voice-trigger-system.ts', fs.existsSync(triggerSystemPath));

// Check voice components
console.log('\n🎤 Voice Components:');

const voiceComponents = [
  'src/components/ed-voice/useGeminiLive.ts',
  'src/components/ed-voice/EdVoiceChat.tsx',
  'src/app/api/voice/config/route.ts',
  'src/app/test/voice-diagnostics/page.tsx',
];

for (const component of voiceComponents) {
  const fullPath = path.join(ROOT, component);
  check(component, fs.existsSync(fullPath));
}

// Check audio worklet
console.log('\n🔊 Audio Worklet:');

const workletPath = path.join(ROOT, 'public/js/audio-processor.worklet.js');
check('audio-processor.worklet.js', fs.existsSync(workletPath));

// Check Ed assets
console.log('\n🎨 Ed Assets:');

const edAssets = [
  'public/ed/core/ed-primary.svg',
  'public/ed/animation/ed-idle.json',
  'public/ed/animation/ed-speaking.json',
  'public/ed/animation/ed-thinking.json',
  'public/ed/expressions/ed-blush.svg',
];

for (const asset of edAssets) {
  const fullPath = path.join(ROOT, asset);
  check(asset, fs.existsSync(fullPath));
}

// Check environment variables
console.log('\n🔑 Environment Variables:');

const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  check('GEMINI_API_KEY set', envContent.includes('GEMINI_API_KEY=') && !envContent.includes('GEMINI_API_KEY=your-'));
  check('VITE_GEMINI_API_KEY set', envContent.includes('VITE_GEMINI_API_KEY=') && !envContent.includes('VITE_GEMINI_API_KEY=your-'));
} else {
  console.log('✗ .env.local not found');
  failCount++;
}

// Verify dialogue bank structure
console.log('\n📊 Dialogue Bank Structure:');

const dialogueBankPath = path.join(ROOT, 'public/ed/voice/dialogue-bank.json');
if (fs.existsSync(dialogueBankPath)) {
  try {
    const dialogueBank = JSON.parse(fs.readFileSync(dialogueBankPath, 'utf-8'));
    check('Has global responses', dialogueBank.global);
    check('Has modules', dialogueBank.modules);
    check('Has trigger_map', dialogueBank.trigger_map);

    if (dialogueBank.global) {
      check('Has success responses', dialogueBank.global.success);
      check('Has praise responses', dialogueBank.global.praise);
      check('Has error responses', dialogueBank.global.error);
    }

    if (dialogueBank.modules) {
      check('Has teaching_learning module', dialogueBank.modules.teaching_learning);
      check('Has estates_compliance module', dialogueBank.modules.estates_compliance);
      check('Has intelligence module', dialogueBank.modules.intelligence);
    }
  } catch (err) {
    console.log(`✗ Failed to parse dialogue-bank.json: ${err.message}`);
    failCount++;
  }
} else {
  console.log('✗ dialogue-bank.json not found');
  failCount++;
}

// Verify trigger map structure
console.log('\n🗺️  Trigger Map Structure:');

const triggerMapPath = path.join(ROOT, 'public/ed/voice/trigger-map.json');
if (fs.existsSync(triggerMapPath)) {
  try {
    const triggerMap = JSON.parse(fs.readFileSync(triggerMapPath, 'utf-8'));
    check('Has trigger_map', triggerMap.trigger_map);
    check('Has context_triggers', triggerMap.context_triggers);
    check('Has personality_rules', triggerMap.personality_rules);
    check('Has animation_defaults', triggerMap.animation_defaults);
  } catch (err) {
    console.log(`✗ Failed to parse trigger-map.json: ${err.message}`);
    failCount++;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n✓ Passed: ${passCount}`);
console.log(`✗ Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount} checks\n`);

if (failCount === 0) {
  console.log('🎉 All checks passed! Ed voice system is ready.\n');
  console.log('Next steps:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Open: http://localhost:3000/test/voice-diagnostics');
  console.log('3. Run all checks and test voice connection\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please review the output above.\n');
  process.exit(1);
}
