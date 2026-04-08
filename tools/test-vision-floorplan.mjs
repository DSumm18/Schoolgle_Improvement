#!/usr/bin/env node
/**
 * Test: AI Vision Model Floor Plan Room Extraction
 * Sends grove-house-ground-floor.png to Gemini 2.0 Flash via Google AI API
 * Runs 2 times to test consistency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from apps/platform/.env.local
const envPath = path.join(__dirname, '..', 'apps', 'platform', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.+)$/);
  if (match) envVars[match[1]] = match[2].trim();
}

const OPENROUTER_API_KEY = envVars.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY not found');
  process.exit(1);
}

// Load image as base64
const imagePath = path.join(__dirname, '..', 'apps', 'platform', 'public', 'site-plans', 'grove-house-ground-floor.png');
const imageBuffer = fs.readFileSync(imagePath);
const imageBase64 = imageBuffer.toString('base64');
console.log(`Image loaded: ${(imageBuffer.length / 1024).toFixed(0)} KB`);

const PROMPT = `Analyze this school floor plan image. This is Grove House Primary School ground floor.

Extract every distinct room/space visible. For each room, provide:
- "name": the label text visible in the room (if readable), otherwise describe it
- "type": one of: classroom, office, toilet, corridor, hall, kitchen, storage, cloakroom, library, nursery, reception_area, plant_room, other
- "block": which block number (1, 2, 3, or 4) based on the block labels visible on the plan
- "bbox": approximate bounding box as percentage of full image dimensions: {"x": number, "y": number, "w": number, "h": number} where x,y is top-left corner

Return ONLY a JSON object with this structure:
{
  "rooms": [...],
  "total_count": number,
  "blocks_found": [1,2,3,4],
  "notes": "any observations about the plan"
}

Be thorough - extract every labeled space you can identify.`;

async function callVisionModel(runNumber) {
  const model = 'google/gemini-2.0-flash-001';
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const body = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${imageBase64}`
            }
          },
          {
            type: 'text',
            text: PROMPT
          }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 8192,
    response_format: { type: 'json_object' }
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`RUN ${runNumber} — Model: ${model} (via OpenRouter)`);
  console.log(`${'='.repeat(60)}`);

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://schoolgle.co.uk',
        'X-Title': 'Schoolgle Floor Plan Test'
      },
      body: JSON.stringify(body)
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`HTTP ${response.status}: ${errText.substring(0, 500)}`);
      return null;
    }

    const data = await response.json();

    // Extract usage metadata
    const usage = data.usage || {};
    console.log(`Time: ${elapsed}s`);
    console.log(`Tokens — Input: ${usage.prompt_tokens || '?'}, Output: ${usage.completion_tokens || '?'}, Total: ${usage.total_tokens || '?'}`);

    // Cost estimate for Gemini 2.0 Flash via OpenRouter
    // Input: $0.10/1M tokens, Output: $0.40/1M tokens
    const inputCost = ((usage.prompt_tokens || 0) / 1_000_000) * 0.10;
    const outputCost = ((usage.completion_tokens || 0) / 1_000_000) * 0.40;
    console.log(`Est. cost: $${(inputCost + outputCost).toFixed(4)} (input: $${inputCost.toFixed(4)}, output: $${outputCost.toFixed(4)})`);

    // Extract text content
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      console.error('No text in response');
      console.log(JSON.stringify(data, null, 2).substring(0, 1000));
      return null;
    }

    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = text.match(/```json?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        console.error('Failed to parse JSON from response');
        console.log('Raw text (first 2000 chars):', text.substring(0, 2000));
        return null;
      }
    }

    console.log(`\nRooms detected: ${parsed.rooms?.length || 0}`);
    console.log(`Blocks found: ${JSON.stringify(parsed.blocks_found)}`);
    console.log(`Notes: ${parsed.notes || 'none'}`);

    // Show room type breakdown
    if (parsed.rooms) {
      const typeCounts = {};
      const blockCounts = {};
      for (const room of parsed.rooms) {
        typeCounts[room.type] = (typeCounts[room.type] || 0) + 1;
        const b = room.block || 'unknown';
        blockCounts[b] = (blockCounts[b] || 0) + 1;
      }
      console.log(`\nBy type:`, JSON.stringify(typeCounts, null, 2));
      console.log(`By block:`, JSON.stringify(blockCounts, null, 2));

      // Show first 5 rooms as examples
      console.log(`\nExample rooms (first 5):`);
      for (const room of parsed.rooms.slice(0, 5)) {
        console.log(`  - ${room.name} (${room.type}, Block ${room.block}) @ bbox: ${JSON.stringify(room.bbox)}`);
      }
    }

    return { parsed, elapsed, usage };

  } catch (err) {
    console.error(`Error: ${err.message}`);
    return null;
  }
}

// Main
async function main() {
  console.log('Floor Plan Vision Extraction Test');
  console.log(`Image: grove-house-ground-floor.png`);
  console.log(`Model: google/gemini-2.0-flash-001 (via OpenRouter)`);
  console.log(`Runs: 2`);

  const results = [];

  for (let i = 1; i <= 2; i++) {
    const result = await callVisionModel(i);
    results.push(result);
    if (i < 2) {
      // Brief pause between runs
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Consistency analysis
  console.log(`\n${'='.repeat(60)}`);
  console.log('CONSISTENCY ANALYSIS');
  console.log(`${'='.repeat(60)}`);

  const valid = results.filter(r => r?.parsed?.rooms);
  if (valid.length === 2) {
    const r1 = valid[0].parsed;
    const r2 = valid[1].parsed;

    console.log(`Run 1: ${r1.rooms.length} rooms, Run 2: ${r2.rooms.length} rooms`);
    console.log(`Difference: ${Math.abs(r1.rooms.length - r2.rooms.length)} rooms`);

    // Compare room names
    const names1 = new Set(r1.rooms.map(r => r.name?.toLowerCase().trim()));
    const names2 = new Set(r2.rooms.map(r => r.name?.toLowerCase().trim()));
    const common = [...names1].filter(n => names2.has(n));
    const only1 = [...names1].filter(n => !names2.has(n));
    const only2 = [...names2].filter(n => !names1.has(n));

    console.log(`\nCommon rooms (by name): ${common.length}`);
    console.log(`Only in Run 1: ${only1.length} — ${only1.slice(0, 10).join(', ')}`);
    console.log(`Only in Run 2: ${only2.length} — ${only2.slice(0, 10).join(', ')}`);

    const consistency = (common.length / Math.max(names1.size, names2.size) * 100).toFixed(1);
    console.log(`\nName consistency: ${consistency}%`);

    // Compare block assignments for common rooms
    let blockMatch = 0;
    for (const name of common) {
      const room1 = r1.rooms.find(r => r.name?.toLowerCase().trim() === name);
      const room2 = r2.rooms.find(r => r.name?.toLowerCase().trim() === name);
      if (room1?.block === room2?.block) blockMatch++;
    }
    console.log(`Block assignment consistency (common rooms): ${common.length > 0 ? (blockMatch / common.length * 100).toFixed(1) : 'N/A'}%`);

    // Full room list from run 1
    console.log(`\n${'='.repeat(60)}`);
    console.log('FULL ROOM LIST (Run 1)');
    console.log(`${'='.repeat(60)}`);
    for (const room of r1.rooms) {
      console.log(`  Block ${room.block || '?'} | ${(room.type || '?').padEnd(16)} | ${room.name} | bbox: ${JSON.stringify(room.bbox)}`);
    }
  } else {
    console.log(`Only ${valid.length}/2 runs produced valid results.`);
  }

  // Total cost
  const totalInput = valid.reduce((s, r) => s + (r.usage?.prompt_tokens || 0), 0);
  const totalOutput = valid.reduce((s, r) => s + (r.usage?.completion_tokens || 0), 0);
  const totalCost = (totalInput / 1_000_000 * 0.10) + (totalOutput / 1_000_000 * 0.40);
  console.log(`\nTotal cost (2 runs): ~$${totalCost.toFixed(4)}`);
  console.log(`Per-extraction cost: ~$${(totalCost / 2).toFixed(4)}`);
}

main().catch(console.error);
