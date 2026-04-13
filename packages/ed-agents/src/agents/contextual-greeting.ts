/**
 * Ed Greeting System — Conversation-Aware
 *
 * First chat of the day:  "Hi David, what can I help you with?"
 * Returning same day:     "Hi David, what else can I help you with today?"
 * With alerts:            "Hi David — 3 fire checks are overdue. Want me to pull up the details?"
 *
 * Rules:
 * - Never list capabilities
 * - Never say "I can help with..."
 * - If there are alerts, lead with the most urgent one
 * - If no alerts and returning user, keep it to one line
 */

export interface GreetingInput {
  firstName: string;
  conversationsToday: number;
  lastTopic?: string; // PII-free topic from ed_conversation_log
  alerts: string[]; // From generateProactiveContext
  domain?: string; // Current page domain (estates, hr, etc.)
}

export interface GreetingOutput {
  greeting: string;
  suggestions: string[]; // Actionable alerts, not capability lists
}

/**
 * Build a conversation-aware greeting
 */
export function buildGreeting(input: GreetingInput): GreetingOutput {
  const { firstName, conversationsToday, lastTopic, alerts, domain } = input;

  // Pick the right opener based on conversation history TODAY
  let opener: string;

  if (conversationsToday === 0) {
    // First conversation of the day
    opener = `Hi ${firstName}, what can I help you with?`;
  } else if (conversationsToday <= 3) {
    // Returning user — acknowledge they've been chatting
    opener = `Hi ${firstName}, what else can I help you with today?`;
  } else {
    // Heavy user — keep it minimal
    opener = `What do you need, ${firstName}?`;
  }

  // If there are urgent alerts, lead with the top one instead
  const urgentAlerts = alerts.filter(
    (a) => a.startsWith("ACTION REQUIRED") || a.startsWith("CRITICAL") || a.startsWith("ABOVE APPETITE")
  );
  const upcomingAlerts = alerts.filter(
    (a) => a.startsWith("UPCOMING") || a.startsWith("WARNING") || a.startsWith("OVERDUE")
  );

  let greeting = opener;

  if (urgentAlerts.length > 0) {
    // Replace generic opener with alert-driven opener
    const topAlert = urgentAlerts[0]
      .replace("ACTION REQUIRED: ", "")
      .replace("CRITICAL: ", "");

    if (conversationsToday === 0) {
      greeting = `Hi ${firstName} — heads up: ${topAlert} Want me to pull up the details?`;
    } else {
      greeting = `${firstName}, quick flag: ${topAlert} Want me to look into it?`;
    }

    if (urgentAlerts.length > 1) {
      greeting += `\n\n${urgentAlerts.length - 1} more thing${urgentAlerts.length - 1 > 1 ? "s" : ""} need${urgentAlerts.length - 1 === 1 ? "s" : ""} attention — ask me when you're ready.`;
    }
  } else if (upcomingAlerts.length > 0 && conversationsToday === 0) {
    // First visit + non-urgent alerts: mention count briefly
    greeting += `\n\nI've got ${upcomingAlerts.length} thing${upcomingAlerts.length > 1 ? "s" : ""} flagged for this week if you want to review them.`;
  }

  // Continuity: if returning user had a recent topic, mention it naturally
  if (conversationsToday > 0 && lastTopic && !urgentAlerts.length) {
    greeting += `\n\nWe were looking at ${lastTopic} earlier — happy to pick that up if you need.`;
  }

  return {
    greeting,
    suggestions: urgentAlerts.concat(upcomingAlerts).slice(0, 3),
  };
}

/**
 * Check if a message is a greeting (used to trigger greeting flow)
 */
export function isGreeting(query: string): boolean {
  const cleaned = query.toLowerCase().replace(/[.,!?'"]/g, "").trim();
  const greetings = [
    "hi", "hello", "hey", "good morning", "good afternoon",
    "good evening", "greetings", "yo", "hiya", "morning",
  ];

  if (greetings.includes(cleaned)) return true;
  if (cleaned.length < 12 && greetings.some((g) => cleaned.includes(g))) return true;
  return false;
}
