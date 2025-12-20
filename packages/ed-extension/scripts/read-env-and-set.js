/**
 * Read .env.local and set chrome.storage automatically
 * This script reads from the Next.js .env.local file and sets chrome.storage
 * 
 * Run this in Node.js (not browser console):
 * node packages/ed-extension/scripts/read-env-and-set.js
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find .env.local in the monorepo root
const envPath = path.resolve(__dirname, '../../../.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found at:', envPath);
  console.log('Please create .env.local in the monorepo root with your API keys.');
  process.exit(1);
}

// Read .env.local
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

// Parse .env.local (simple parser)
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      envVars[key] = value;
    }
  }
});

// Build config
const config = {
  provider: envVars.OPENROUTER_API_KEY ? 'openrouter' : 'gemini',
  openRouterApiKey: envVars.OPENROUTER_API_KEY || undefined,
  geminiApiKey: envVars.GEMINI_API_KEY || envVars.NEXT_PUBLIC_GEMINI_API_KEY || undefined,
  fishAudioApiKey: envVars.FISH_AUDIO_API_KEY || envVars.NEXT_PUBLIC_FISH_AUDIO_API_KEY || undefined,
  enableAI: true,
  enableTTS: true,
  ttsProvider: 'fish',
  persona: 'edwina',
  language: 'en-GB',
};

console.log('📋 Configuration from .env.local:');
console.log({
  provider: config.provider,
  enableAI: config.enableAI,
  enableTTS: config.enableTTS,
  ttsProvider: config.ttsProvider,
  persona: config.persona,
  hasKeys: {
    openrouter: !!config.openRouterApiKey,
    gemini: !!config.geminiApiKey,
    fish: !!config.fishAudioApiKey,
  },
});

// Generate browser console command
console.log('\n📋 Copy and paste this into your browser console (F12) on any website:');
console.log('\n--- START COPY ---\n');
console.log(`chrome.storage.local.set({
  ed_config: ${JSON.stringify(config, null, 2)}
}, () => {
  console.log('✅ Configuration saved! Reload the page.');
});`);
console.log('\n--- END COPY ---\n');

console.log('💡 Or use the Chrome Extension API to set it programmatically.');

