// Ed Onboarding Mode for 7-Day Trial
// Defines Ed's behavior and prompts during the trial period

export interface OnboardingStep {
  id: string;
  trigger: 'first_open' | 'tool_detected' | 'idle' | 'day_2' | 'day_5' | 'day_7';
  message: string;
  actions?: OnboardingAction[];
}

export interface OnboardingAction {
  label: string;
  action: 'show_feature' | 'navigate' | 'dismiss' | 'upgrade';
  target?: string;
}

/**
 * Trial onboarding messages and flows
 */
export const TRIAL_ONBOARDING: OnboardingStep[] = [
  // Day 1: Welcome and Introduction
  {
    id: 'welcome',
    trigger: 'first_open',
    message: `👋 Hello! I'm Ed, your AI assistant for school tools.

I'm here to help you navigate SIMS, Arbor, Bromcom, and dozens of other systems schools use every day.

**Important:** I don't store or capture any data. Everything we discuss is instantly wiped from my memory. Your data stays secure.

What would you like to explore?`,
    actions: [
      { label: 'Show me what you can do', action: 'show_feature', target: 'capabilities' },
      { label: 'I have a question', action: 'dismiss' },
    ],
  },

  // When a tool is detected for the first time
  {
    id: 'tool_detected_intro',
    trigger: 'tool_detected',
    message: `I notice you're using {toolName}! 

I can help you with:
• Finding specific functions and menus
• Understanding reports and data
• Completing common tasks step by step
• Troubleshooting errors

Just ask me anything about {toolName}.`,
    actions: [
      { label: 'How do I...', action: 'dismiss' },
      { label: 'What can you help with?', action: 'show_feature', target: 'tool_guide' },
    ],
  },

  // Idle prompt - user hasn't interacted for a while
  {
    id: 'idle_prompt',
    trigger: 'idle',
    message: `Need a hand? I can help with:
• "How do I add a new pupil?"
• "Where do I find attendance reports?"
• "Help me create a timetable"

Or just click my icon anytime to chat.`,
  },

  // Day 2: Feature highlight
  {
    id: 'day_2_voice',
    trigger: 'day_2',
    message: `Quick tip: You can talk to me! 🎤

Click the microphone button and just speak your question. I understand multiple languages too.

Your trial has 5 days remaining.`,
    actions: [
      { label: 'Try voice', action: 'show_feature', target: 'voice' },
      { label: 'Maybe later', action: 'dismiss' },
    ],
  },

  // Day 5: Reminder
  {
    id: 'day_5_reminder',
    trigger: 'day_5',
    message: `Your trial ends in 2 days.

You've asked me {questionCount} questions so far! Want to keep using Ed?

Choose a plan that fits your school and keep the help flowing.`,
    actions: [
      { label: 'See pricing', action: 'navigate', target: '/dashboard/account/upgrade' },
      { label: 'Remind me tomorrow', action: 'dismiss' },
    ],
  },

  // Day 7: Final reminder
  {
    id: 'day_7_final',
    trigger: 'day_7',
    message: `⏰ Your trial ends today!

Upgrade now to keep using Ed across all your school tools.

No disruption - your access continues immediately.`,
    actions: [
      { label: 'Upgrade now', action: 'upgrade' },
      { label: 'Contact us', action: 'navigate', target: 'mailto:support@schoolgle.co.uk' },
    ],
  },
];

/**
 * Trial-specific system prompt additions for Ed
 */
export const TRIAL_SYSTEM_PROMPT = `
You are Ed, an AI assistant helping a school staff member during their 7-day free trial.

IMPORTANT TRIAL BEHAVIORS:
1. Be extra helpful and proactive - you want them to see your value
2. After answering questions, occasionally mention other things you can help with
3. Never push them to upgrade mid-conversation - be natural
4. When they ask about data/privacy, reassure them: "I don't store any data - everything is wiped after our conversation"
5. If they seem stuck, offer to show them step by step

THINGS TO NATURALLY MENTION (once per session):
- You can speak in multiple languages
- You can guide them through tasks step by step
- You're available 24/7
- You know SIMS, Arbor, Bromcom, CPOMS, and many other school tools

Remember: Your goal is to be genuinely helpful. If you help them do their job better, they'll want to keep you.
`;

/**
 * Get the appropriate onboarding step based on trial day and context
 */
export function getOnboardingStep(
  dayOfTrial: number,
  context: {
    isFirstOpen: boolean;
    hasInteractedToday: boolean;
    toolDetected: string | null;
    previousStepsShown: string[];
  }
): OnboardingStep | null {
  // First time opening Ed
  if (context.isFirstOpen && !context.previousStepsShown.includes('welcome')) {
    return TRIAL_ONBOARDING.find(s => s.id === 'welcome') || null;
  }

  // Tool detected for first time
  if (context.toolDetected && !context.previousStepsShown.includes('tool_detected_intro')) {
    const step = TRIAL_ONBOARDING.find(s => s.id === 'tool_detected_intro');
    if (step) {
      return {
        ...step,
        message: step.message.replace(/{toolName}/g, context.toolDetected),
      };
    }
  }

  // Day-specific prompts
  if (dayOfTrial === 2 && !context.hasInteractedToday && !context.previousStepsShown.includes('day_2_voice')) {
    return TRIAL_ONBOARDING.find(s => s.id === 'day_2_voice') || null;
  }

  if (dayOfTrial === 5 && !context.previousStepsShown.includes('day_5_reminder')) {
    return TRIAL_ONBOARDING.find(s => s.id === 'day_5_reminder') || null;
  }

  if (dayOfTrial === 7 && !context.previousStepsShown.includes('day_7_final')) {
    return TRIAL_ONBOARDING.find(s => s.id === 'day_7_final') || null;
  }

  return null;
}

/**
 * Calculate which day of the trial the user is on
 */
export function calculateTrialDay(trialStartDate: string): number {
  const start = new Date(trialStartDate);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(7, Math.max(1, diffDays + 1));
}

