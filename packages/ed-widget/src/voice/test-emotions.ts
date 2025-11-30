/**
 * Test Script for Fish Audio Emotions
 * 
 * Run this to test different emotions and pauses
 * Usage: Import and call testEmotions() in your code
 */

import { FishAudioVoice } from './fish-audio';
import { EMOTIONS, pause, SHORT_PAUSE, MEDIUM_PAUSE, LONG_PAUSE } from './intro-scripts';

/**
 * Test all available emotions
 */
export async function testEmotions(apiKey: string): Promise<void> {
  const fish = new FishAudioVoice(apiKey);

  console.log('🎭 Testing Fish Audio Emotions...\n');

  const tests = [
    {
      name: 'Happy Greeting',
      text: `${EMOTIONS.happy} Hello! ${SHORT_PAUSE} I'm Ed, your school assistant. ${MEDIUM_PAUSE} How can I help you today?`,
    },
    {
      name: 'Excited Announcement',
      text: `${EMOTIONS.excited} Great news! ${MEDIUM_PAUSE} Your application was accepted! ${EMOTIONS.cheerful} Congratulations!`,
    },
    {
      name: 'Calm Explanation',
      text: `${EMOTIONS.calm} Let me explain how this works. ${MEDIUM_PAUSE} ${EMOTIONS.professional} First, you'll need to complete the form. ${MEDIUM_PAUSE} ${EMOTIONS.supportive} I can help you with each step.`,
    },
    {
      name: 'Empathetic Response',
      text: `${EMOTIONS.empathetic} I understand this can be confusing. ${MEDIUM_PAUSE} ${EMOTIONS.supportive} Let me help you through it step by step. ${MEDIUM_PAUSE} ${EMOTIONS.encouraging} You're doing great!`,
    },
    {
      name: 'Warm Thank You',
      text: `${EMOTIONS.cheerful} You're very welcome! ${MEDIUM_PAUSE} ${EMOTIONS.warm} I'm so glad I could help. ${MEDIUM_PAUSE} ${EMOTIONS.friendly} If you have any other questions, just ask!`,
    },
    {
      name: 'Professional Information',
      text: `${EMOTIONS.professional} According to our policy, ${MEDIUM_PAUSE} applications must be submitted by January 15th. ${MEDIUM_PAUSE} ${EMOTIONS.calm} Would you like me to help you get started?`,
    },
    {
      name: 'With Laughter',
      text: `${EMOTIONS.laughing} That's a great question! ${MEDIUM_PAUSE} ${EMOTIONS.friendly} Let me find the answer for you.`,
    },
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${i + 1}. ${test.name}`);
    console.log(`   Text: ${test.text.replace(/\([^)]+\)/g, '[emotion]')}`);
    
    try {
      await fish.speakAndPlay(test.text, 'ed', 'en-GB');
      // Wait 2 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }
  }

  console.log('\n✅ Emotion testing complete!');
}

/**
 * Test pause durations
 */
export async function testPauses(apiKey: string): Promise<void> {
  const fish = new FishAudioVoice(apiKey);

  console.log('⏸️ Testing Pause Durations...\n');

  const tests = [
    {
      name: 'No Pauses',
      text: 'Hello I am Ed your school assistant how can I help you today?',
    },
    {
      name: 'Short Pauses (300ms)',
      text: `Hello!${SHORT_PAUSE} I am Ed,${SHORT_PAUSE} your school assistant.${SHORT_PAUSE} How can I help?`,
    },
    {
      name: 'Medium Pauses (500ms)',
      text: `Hello!${MEDIUM_PAUSE} I am Ed.${MEDIUM_PAUSE} Your school assistant.${MEDIUM_PAUSE} How can I help you today?`,
    },
    {
      name: 'Long Pauses (800ms)',
      text: `Hello!${LONG_PAUSE} I am Ed, your school assistant.${LONG_PAUSE} How can I help you today?`,
    },
    {
      name: 'Mixed Pauses',
      text: `Hello!${SHORT_PAUSE} I'm Ed.${MEDIUM_PAUSE} Your school assistant.${LONG_PAUSE} How can I help you today?`,
    },
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${i + 1}. ${test.name}`);
    
    try {
      await fish.speakAndPlay(test.text, 'ed', 'en-GB');
      // Wait 2 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }
  }

  console.log('\n✅ Pause testing complete!');
}

/**
 * Test intro scripts
 */
export async function testIntros(apiKey: string): Promise<void> {
  const fish = new FishAudioVoice(apiKey);
  const { getIntroForPersona } = await import('./intro-scripts');

  console.log('🎬 Testing Intro Scripts...\n');

  const scenarios = [
    {
      name: 'Ed - First Visit',
      persona: 'ed' as const,
      context: { isFirstVisit: true },
    },
    {
      name: 'Ed - With Form',
      persona: 'ed' as const,
      context: { hasForm: true },
    },
    {
      name: 'Ed - Admissions Page',
      persona: 'ed' as const,
      context: { isAdmissionsPage: true, hasForm: true },
    },
    {
      name: 'Santa - First Visit',
      persona: 'santa' as const,
      context: { isFirstVisit: true },
    },
    {
      name: 'Elf - First Visit',
      persona: 'elf' as const,
      context: { isFirstVisit: true },
    },
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const intro = getIntroForPersona(scenario.persona, scenario.context);
    
    console.log(`\n${i + 1}. ${scenario.name}`);
    console.log(`   Text: ${intro.replace(/\([^)]+\)/g, '[emotion]')}`);
    
    try {
      await fish.speakAndPlay(intro, scenario.persona, 'en-GB');
      // Wait 2 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }
  }

  console.log('\n✅ Intro testing complete!');
}

/**
 * Run all tests
 */
export async function runAllTests(apiKey: string): Promise<void> {
  console.log('🚀 Starting Fish Audio Tests...\n');
  console.log('='.repeat(50));
  
  await testEmotions(apiKey);
  console.log('\n' + '='.repeat(50));
  
  await testPauses(apiKey);
  console.log('\n' + '='.repeat(50));
  
  await testIntros(apiKey);
  console.log('\n' + '='.repeat(50));
  
  console.log('\n🎉 All tests complete!');
}

