/**
 * Intent Classifier
 * Determines which specialist should handle a user's question
 */

import type {
  Domain,
  SpecialistId,
  IntentClassification,
} from '../types';
import { DOMAIN_KEYWORDS, getAgentByDomain } from '../agents';

/**
 * Work-focused keywords - indicates user is asking about work tasks
 */
const WORK_KEYWORDS = [
  'help with', 'how do i', 'what is the', 'how to', 'can you help',
  'need to', 'want to', 'report', 'fill in', 'complete', 'submit',
  'guidance', 'advice', 'requirements', 'policy', 'procedure',
];

/**
 * Chat/non-work keywords - indicates user is just chatting
 */
const CHAT_KEYWORDS = [
  'tell me a joke', 'how are you', 'what do you think', 'lets chat',
  'conversation', 'just saying', 'bored', 'nothing', 'hi', 'hello',
];

/**
 * Complex decision keywords - indicates multi-perspective may be useful
 */
const COMPLEX_DECISION_KEYWORDS = [
  'should we', 'should i', 'recommend', 'decision', 'choose',
  'best', 'better', 'versus', 'vs', 'compare', 'option',
  'switch', 'change', 'implement', 'introduce', 'start using',
];

/**
 * Score a domain based on keyword matches in the query
 */
function scoreDomain(query: string, domain: Domain): number {
  const keywords = DOMAIN_KEYWORDS[domain] || [];
  const queryLower = query.toLowerCase();

  let score = 0;
  for (const keyword of keywords) {
    if (queryLower.includes(keyword.toLowerCase())) {
      score += 1;
      // Bonus for multi-word matches
      if (keyword.split(' ').length > 1) {
        score += 0.5;
      }
    }
  }

  return score;
}

/**
 * Check if the query is work-related or general chat
 */
export function isWorkRelated(query: string): { isWorkRelated: boolean; confidence: number } {
  const queryLower = query.toLowerCase().trim();

  // Check for explicit chat keywords
  const hasChatKeywords = CHAT_KEYWORDS.some(kw => queryLower.includes(kw));

  // Check for work keywords
  const hasWorkKeywords = WORK_KEYWORDS.some(kw => queryLower.includes(kw));

  // Also check domain keywords (if any, it's work-related)
  const hasDomainKeywords = Object.values(DOMAIN_KEYWORDS).some(keywords =>
    keywords.some(kw => queryLower.includes(kw.toLowerCase()))
  );

  if (hasChatKeywords && !hasWorkKeywords && !hasDomainKeywords) {
    return { isWorkRelated: false, confidence: 0.9 };
  }

  if (hasWorkKeywords || hasDomainKeywords) {
    return { isWorkRelated: true, confidence: 0.8 };
  }

  // If unclear, lean toward work-related (better to route to specialist than block)
  return { isWorkRelated: true, confidence: 0.5 };
}

/**
 * Check if the query requires multi-perspective response
 */
export function requiresMultiPerspective(query: string): boolean {
  const queryLower = query.toLowerCase();

  // Check for complex decision keywords
  const hasComplexKeyword = COMPLEX_DECISION_KEYWORDS.some(kw =>
    queryLower.includes(kw)
  );

  return hasComplexKeyword;
}

/**
 * Classify the intent and route to appropriate specialist
 */
export function classifyIntent(
  query: string,
  activeApp?: string,
  userRole?: string
): IntentClassification {
  const queryLower = query.toLowerCase();

  // Check if work-related
  const { isWorkRelated: workRelated } = isWorkRelated(query);

  if (!workRelated) {
    return {
      domain: 'general',
      specialist: 'ed-general',
      confidence: 0.9,
      reasoning: 'Query appears to be general chat, not work-related',
      requiresMultiPerspective: false,
      isWorkRelated: false,
    };
  }

  // Check for complex decision (multi-perspective)
  const needsMultiPerspective = requiresMultiPerspective(query);

  // Score each domain
  const domainScores: { domain: Domain; score: number }[] = [];

  for (const domain of Object.keys(DOMAIN_KEYWORDS) as Domain[]) {
    if (domain === 'general') continue;
    const score = scoreDomain(query, domain);
    if (score > 0) {
      domainScores.push({ domain, score });
    }
  }

  // Sort by score descending
  domainScores.sort((a, b) => b.score - a.score);

  // Determine best domain
  let bestDomain: Domain;
  let confidence: number;

  if (domainScores.length > 0) {
    bestDomain = domainScores[0].domain;
    // Confidence based on how clear the winner is
    const topScore = domainScores[0].score;
    const secondScore = domainScores[1]?.score || 0;
    confidence = Math.min(0.95, 0.6 + (topScore - secondScore) * 0.1);
  } else {
    // No clear domain - use active app if available
    bestDomain = 'general';
    confidence = 0.3;
  }

  // Override based on active app if no clear keywords
  if (confidence < 0.5 && activeApp) {
    switch (activeApp) {
      case 'estates-compliance':
        bestDomain = 'estates';
        confidence = 0.7;
        break;
      case 'hr':
        bestDomain = 'hr';
        confidence = 0.7;
        break;
    }
  }

  // Get specialist for domain
  const agent = getAgentByDomain(bestDomain);
  const specialist = agent.id;

  return {
    domain: bestDomain,
    specialist,
    confidence,
    reasoning: domainScores.length > 0
      ? `Matched keywords for ${bestDomain} domain (score: ${domainScores[0].score})`
      : `Using ${bestDomain} based on app context`,
    requiresMultiPerspective: needsMultiPerspective,
    isWorkRelated: true,
  };
}

/**
 * Get explanation of routing decision (for logging/debug)
 */
export function explainRouting(classification: IntentClassification): string {
  const parts = [
    `Domain: ${classification.domain}`,
    `Specialist: ${classification.specialist}`,
    `Confidence: ${Math.round(classification.confidence * 100)}%`,
  ];

  if (classification.reasoning) {
    parts.push(`Reasoning: ${classification.reasoning}`);
  }

  if (classification.requiresMultiPerspective) {
    parts.push('Multi-perspective: Yes (complex decision)');
  }

  return parts.join(' | ');
}
