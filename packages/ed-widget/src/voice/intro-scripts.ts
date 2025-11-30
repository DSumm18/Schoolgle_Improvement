/**
 * Engaging Intro Scripts for Ed Widget
 * 
 * Uses Fish Audio emotion tags and pauses for natural, engaging speech
 * 
 * Emotion tags: (happy), (excited), (calm), (friendly), (empathetic), (professional)
 * Pauses: (pause:500ms) - duration in milliseconds
 * Special effects: (laughing), (sighing)
 * 
 * See: https://docs.fish.audio/api-reference/emotion-reference
 */

import type { PersonaType } from '../types';

/**
 * Available emotion tags in Fish Audio
 */
export const EMOTIONS = {
  // Positive emotions
  happy: '(happy)',
  excited: '(excited)',
  friendly: '(friendly)',
  warm: '(warm)',
  cheerful: '(cheerful)',
  enthusiastic: '(enthusiastic)',

  // Calm/Professional
  calm: '(calm)',
  professional: '(professional)',
  neutral: '(neutral)',
  confident: '(confident)',

  // Supportive
  empathetic: '(empathetic)',
  understanding: '(understanding)',
  supportive: '(supportive)',
  encouraging: '(encouraging)',

  // Special
  laughing: '(laughing)',
  sighing: '(sighing)',
} as const;

/**
 * Create pause tag
 */
export function pause(ms: number): string {
  return `(pause:${ms}ms)`;
}

/**
 * Short pause (300ms) - natural breathing
 */
export const SHORT_PAUSE = pause(300);

/**
 * Medium pause (500ms) - sentence break
 */
export const MEDIUM_PAUSE = pause(500);

/**
 * Long pause (800ms) - paragraph break
 */
export const LONG_PAUSE = pause(800);

/**
 * Generate engaging intro for Ed persona
 */
export function getEdIntro(context?: {
  hasForm?: boolean;
  isAdmissionsPage?: boolean;
  isFirstVisit?: boolean;
}): string {
  const { hasForm = false, isAdmissionsPage = false, isFirstVisit = true } = context || {};

  if (isFirstVisit) {
    // First-time visitor - warm welcome
    return `${EMOTIONS.happy} Hello! ${SHORT_PAUSE} I'm Ed, your school assistant. ${MEDIUM_PAUSE} ${EMOTIONS.friendly} I'm here to help you with any questions about our school. ${MEDIUM_PAUSE} ${EMOTIONS.calm} How can I assist you today?`;
  }

  if (isAdmissionsPage && hasForm) {
    // Admissions page with form - proactive help
    return `${EMOTIONS.excited} Welcome to our admissions page! ${SHORT_PAUSE} ${EMOTIONS.friendly} I can see you're looking at our application form. ${MEDIUM_PAUSE} ${EMOTIONS.supportive} I'd be happy to help you fill it out step by step. ${MEDIUM_PAUSE} ${EMOTIONS.calm} Would you like me to guide you through it?`;
  }

  if (hasForm) {
    // Form detected - offer help
    return `${EMOTIONS.friendly} Hello again! ${SHORT_PAUSE} ${EMOTIONS.supportive} I notice there's a form on this page. ${MEDIUM_PAUSE} ${EMOTIONS.encouraging} I can help you fill it out if you'd like. ${MEDIUM_PAUSE} ${EMOTIONS.calm} Just let me know when you're ready!`;
  }

  // Standard greeting
  return `${EMOTIONS.happy} Hello! ${SHORT_PAUSE} I'm Ed, your school assistant. ${MEDIUM_PAUSE} ${EMOTIONS.friendly} How can I help you today?`;
}

/**
 * Generate engaging intro for Edwina persona (female voice)
 */
export function getEdwinaIntro(context?: {
  hasForm?: boolean;
  isAdmissionsPage?: boolean;
  isFirstVisit?: boolean;
}): string {
  const { hasForm = false, isAdmissionsPage = false, isFirstVisit = true } = context || {};

  if (isFirstVisit) {
    // First-time visitor - warm welcome
    return `${EMOTIONS.happy} Hello! ${SHORT_PAUSE} I'm Edwina, your school assistant. ${MEDIUM_PAUSE} ${EMOTIONS.friendly} I'm here to help you with any questions about our school. ${MEDIUM_PAUSE} ${EMOTIONS.calm} How can I assist you today?`;
  }

  if (isAdmissionsPage && hasForm) {
    // Admissions page with form - proactive help
    return `${EMOTIONS.excited} Welcome to our admissions page! ${SHORT_PAUSE} ${EMOTIONS.friendly} I can see you're looking at our application form. ${MEDIUM_PAUSE} ${EMOTIONS.supportive} I'd be happy to help you fill it out step by step. ${MEDIUM_PAUSE} ${EMOTIONS.calm} Would you like me to guide you through it?`;
  }

  if (hasForm) {
    // Form detected - offer help
    return `${EMOTIONS.friendly} Hello again! ${SHORT_PAUSE} ${EMOTIONS.supportive} I notice there's a form on this page. ${MEDIUM_PAUSE} ${EMOTIONS.encouraging} I can help you fill it out if you'd like. ${MEDIUM_PAUSE} ${EMOTIONS.calm} Just let me know when you're ready!`;
  }

  // Standard greeting
  return `${EMOTIONS.happy} Hello! ${SHORT_PAUSE} I'm Edwina, your school assistant. ${MEDIUM_PAUSE} ${EMOTIONS.friendly} How can I help you today?`;
}

/**
 * Generate engaging intro for Santa persona
 */
export function getSantaIntro(context?: {
  isFirstVisit?: boolean;
}): string {
  const { isFirstVisit = true } = context || {};

  if (isFirstVisit) {
    return `${EMOTIONS.excited} Ho ho ho! ${SHORT_PAUSE} ${EMOTIONS.warm} I'm Santa's helper at your school. ${MEDIUM_PAUSE} ${EMOTIONS.cheerful} What would you like to know? ${MEDIUM_PAUSE} ${EMOTIONS.friendly} I'm here to spread some holiday cheer and help with any questions!`;
  }

  return `${EMOTIONS.warm} Ho ho ho! ${SHORT_PAUSE} ${EMOTIONS.friendly} Back again? ${MEDIUM_PAUSE} ${EMOTIONS.cheerful} How can I help you today?`;
}

/**
 * Generate engaging intro for Elf persona
 */
export function getElfIntro(context?: {
  isFirstVisit?: boolean;
}): string {
  const { isFirstVisit = true } = context || {};

  if (isFirstVisit) {
    return `${EMOTIONS.excited} Hi there! ${SHORT_PAUSE} ${EMOTIONS.enthusiastic} I'm Jingle the Elf, here to help with all your school questions! ${MEDIUM_PAUSE} ${EMOTIONS.cheerful} What can I do for you today?`;
  }

  return `${EMOTIONS.cheerful} Hey! ${SHORT_PAUSE} ${EMOTIONS.friendly} Good to see you again! ${MEDIUM_PAUSE} ${EMOTIONS.excited} What would you like to know?`;
}

/**
 * Generate engaging intro for Headteacher persona
 */
export function getHeadteacherIntro(context?: {
  isFirstVisit?: boolean;
}): string {
  const { isFirstVisit = true } = context || {};

  if (isFirstVisit) {
    return `${EMOTIONS.professional} Welcome to our school. ${SHORT_PAUSE} ${EMOTIONS.warm} I am the Headteacher. ${MEDIUM_PAUSE} ${EMOTIONS.calm} We are proud of our community and I am here to help you explore what makes us special. ${MEDIUM_PAUSE} How may I assist you?`;
  }

  return `${EMOTIONS.warm} Welcome back. ${SHORT_PAUSE} ${EMOTIONS.calm} I trust you are finding everything you need? ${MEDIUM_PAUSE} Please let me know if I can be of further assistance.`;
}

/**
 * Generate intro based on persona
 */
export function getIntroForPersona(
  persona: PersonaType,
  context?: {
    hasForm?: boolean;
    isAdmissionsPage?: boolean;
    isFirstVisit?: boolean;
  }
): string {
  switch (persona) {
    case 'ed':
      return getEdIntro(context);
    case 'edwina':
      return getEdwinaIntro(context);
    case 'santa':
      return getSantaIntro(context);
    case 'elf':
      return getElfIntro(context);
    case 'headteacher':
      return getHeadteacherIntro(context);
    default:
      return getEdIntro(context);
  }
}

/**
 * Add emotion to any text based on context
 */
export function addEmotionToText(
  text: string,
  emotion: keyof typeof EMOTIONS = 'friendly'
): string {
  // Don't add if already has emotion tag
  if (text.includes('(') && text.includes(')')) {
    return text;
  }

  return `${EMOTIONS[emotion]} ${text}`;
}

/**
 * Add natural pauses to text based on punctuation
 */
export function addNaturalPauses(text: string): string {
  return text
    // Add pause after periods (sentence breaks)
    .replace(/\.\s+/g, `.${MEDIUM_PAUSE} `)
    // Add short pause after commas
    .replace(/,\s+/g, `,${SHORT_PAUSE} `)
    // Add pause after question marks
    .replace(/\?\s+/g, `?${MEDIUM_PAUSE} `)
    // Add pause after exclamation marks
    .replace(/!\s+/g, `!${MEDIUM_PAUSE} `)
    // Add longer pause after colons
    .replace(/:\s+/g, `:${MEDIUM_PAUSE} `);
}

/**
 * Process AI response to add appropriate emotions
 */
export function processAIResponse(text: string): string {
  const lower = text.toLowerCase();

  // Detect emotion from content
  let emotion: keyof typeof EMOTIONS = 'friendly';

  if (lower.includes('great!') || lower.includes('perfect!') || lower.includes('excellent!')) {
    emotion = 'excited';
  } else if (lower.includes('sorry') || lower.includes('unfortunately')) {
    emotion = 'empathetic';
  } else if (lower.includes('help') || lower.includes('assist')) {
    emotion = 'supportive';
  } else if (lower.includes('congratulations') || lower.includes('wonderful')) {
    emotion = 'cheerful';
  } else if (lower.includes('important') || lower.includes('please note')) {
    emotion = 'professional';
  }

  // Add emotion and natural pauses
  let processed = addEmotionToText(text, emotion);
  processed = addNaturalPauses(processed);

  return processed;
}

/**
 * Example intro scripts for testing
 */
export const EXAMPLE_INTROS = {
  ed: {
    standard: getEdIntro(),
    withForm: getEdIntro({ hasForm: true }),
    admissions: getEdIntro({ isAdmissionsPage: true, hasForm: true }),
  },
  santa: {
    standard: getSantaIntro(),
  },
  elf: {
    standard: getElfIntro(),
  },
} as const;

