/**
 * Ed Voice Trigger System
 *
 * Manages dialogue selection, animation triggering, and voice state
 * based on user input, context, and module.
 */

export interface EdVoiceContext {
  module?: "teaching_learning" | "estates_compliance" | "hr" | "finance" | "intelligence";
  isInspectionMode?: boolean;
  userPraise?: boolean;
  taskComplete?: boolean;
  error?: boolean;
  thinking?: boolean;
  reassurance?: boolean;
}

export interface EdDialogueResponse {
  text: string;
  animation: "ed-idle" | "ed-thinking" | "ed-speaking" | "ed-success" | "ed-blush" | "ed-error" | "ed-concerned" | "ed-happy" | "ed-proud";
  voiceState: "idle" | "connecting" | "listening" | "speaking" | "error";
  probability?: number;
}

export type EdVoiceTrigger =
  | "success"
  | "praise"
  | "modest"
  | "thinking"
  | "error"
  | "error_recovery"
  | "reassurance"
  | "inspection_mode"
  | "intelligence_insight";

/**
 * Trigger detection keywords and patterns
 */
const TRIGGER_PATTERNS: Record<EdVoiceTrigger, RegExp[]> = {
  success: [
    /done|complete|finish|ready|sorted|all set/i,
    /thank|thanks|brilliant|great|awesome/i,
  ],
  praise: [
    /thanks|thank you|brilliant|great|awesome|amazing|perfect|love it/i,
    /good job|well done|excellent|helpful/i,
  ],
  modest: [
    /you're the best|you're amazing|incredible|couldn't do without you/i,
  ],
  thinking: [
    /check|find|search|look|analyze|investigate|explore/i,
    /let me see|i'll check|one moment|just a sec/i,
  ],
  error: [
    /wrong|error|failed|mistake|broken|not working|problem/i,
    /something went wrong|that's not right|issue/i,
  ],
  error_recovery: [
    /fixed|resolved|sorted|better now|working again/i,
  ],
  reassurance: [
    /overwhelmed|stressed|busy|too much|struggling|don't know what to do/i,
    /help|lost|confused|not sure|i'm stuck/i,
  ],
  inspection_mode: [
    /ofsted|inspection|audit|review|monitoring|deep dive/i,
  ],
  intelligence_insight: [
    /data|analytics|trend|pattern|insight|intelligence|compare/i,
    /how do we compare|what does the data show|tell me about/i,
  ],
};

/**
 * Animation configurations
 */
export const ANIMATION_CONFIG: Record<string, {
  file: string;
  speed: number;
  loop: boolean;
  duration?: number;
}> = {
  "ed-idle": {
    file: "/ed/animation/ed-idle.json",
    speed: 1.0,
    loop: true,
  },
  "ed-thinking": {
    file: "/ed/animation/ed-thinking.json",
    speed: 1.2,
    loop: true,
  },
  "ed-speaking": {
    file: "/ed/animation/ed-speaking.json",
    speed: 1.0,
    loop: true,
  },
  "ed-success": {
    file: "/ed/animation/ed-success.json",
    speed: 0.8,
    loop: false,
    duration: 0.4,
  },
  "ed-blush": {
    file: "/ed/animation/ed-blush.json",
    speed: 0.6,
    loop: false,
    duration: 0.6,
  },
  "ed-error": {
    file: "/ed/animation/ed-error.json",
    speed: 0.9,
    loop: false,
    duration: 0.5,
  },
  "ed-concerned": {
    file: "/ed/animation/ed-concerned.json",
    speed: 0.8,
    loop: false,
    duration: 0.5,
  },
  "ed-happy": {
    file: "/ed/animation/ed-happy.json",
    speed: 0.7,
    loop: false,
    duration: 0.5,
  },
  "ed-proud": {
    file: "/ed/animation/ed-proud.json",
    speed: 0.7,
    loop: false,
    duration: 0.5,
  },
};

/**
 * Default dialogue responses by trigger
 */
const DEFAULT_RESPONSES: Record<EdVoiceTrigger, string[]> = {
  success: [
    "All done. Efficient, as ever.",
    "There we are. Exactly as intended.",
    "Yes... I thought that might be helpful.",
    "Handled. Quietly impressive, really.",
    "Done. I'll allow myself a small nod of approval.",
  ],
  praise: [
    "Yes... I do try.",
    "You're very kind. I shall take that on board.",
    "I'll accept that, thank you.",
    "Well... I am rather good at this.",
    "Let's not make too much of it.",
  ],
  modest: [
    "Let's not get carried away.",
    "I'd prefer we kept expectations... reasonable.",
    "I'm blushing. Internally, of course.",
    "Just doing my job, thank you.",
    "Always room for improvement, of course.",
  ],
  thinking: [
    "Just a moment...",
    "I'm working through that now.",
    "Give me a second... I'd like to get this right.",
    "Let me check that for you.",
    "One moment while I look into that.",
  ],
  error: [
    "Oh... that wasn't quite right. Let me fix that.",
    "My apologies. That didn't go as planned.",
    "Hmm. I appear to have slipped slightly there.",
    "That's on me. Give me a moment to correct it.",
    "Right... not ideal. Let me resolve this.",
  ],
  error_recovery: [
    "There we are. That's better.",
    "Back on track now.",
    "That should resolve it.",
    "Let me try a different approach.",
    "Right... let me sort that properly.",
  ],
  reassurance: [
    "We'll take this one step at a time.",
    "You don't need to do everything at once.",
    "I've got this part covered.",
    "Let's work through this together.",
    "No need to rush. We'll sort it.",
  ],
  inspection_mode: [
    "All evidence is structured and ready.",
    "This aligns with expectations.",
    "You are well prepared.",
    "Everything is in order.",
    "That meets the requirements.",
  ],
  intelligence_insight: [
    "This is where things become interesting.",
    "There's a story in this data.",
    "This may explain more than it first appears.",
    "I thought you'd want to see this.",
    "This is... rather telling.",
  ],
};

/**
 * Module-specific greeting phrases
 */
const MODULE_GREETINGS: Record<string, string[]> = {
  teaching_learning: [
    "Good morning. What can I help you with today?",
    "Hello. What would you like to work on?",
  ],
  estates_compliance: [
    "Good morning. What needs attention?",
    "Hello. What can I help with?",
  ],
  hr: [
    "Good morning. How can I help?",
    "Hello. What do you need?",
  ],
  finance: [
    "Good morning. What can I help with?",
    "Hello. What do you need to know?",
  ],
  intelligence: [
    "Good morning. What would you like to explore?",
    "Hello. Let's see what the data says.",
  ],
};

/**
 * Ed Voice Trigger System Class
 */
export class EdVoiceTriggerSystem {
  private currentModule?: string;
  private isInspectionMode: boolean = false;
  private personalityFrequency: number = 0.3; // 30% of responses have personality

  /**
   * Detect the trigger type from user input and context
   */
  detectTrigger(input: string, context: EdVoiceContext): EdVoiceTrigger | null {
    // Check explicit context first
    if (context.isInspectionMode) return "inspection_mode";
    if (context.error) return "error";
    if (context.thinking) return "thinking";
    if (context.reassurance) return "reassurance";
    if (context.taskComplete) return "success";
    if (context.userPraise) return "praise";

    // Check for inspection mode keywords
    if (TRIGGER_PATTERNS.inspection_mode.some(pattern => pattern.test(input))) {
      this.isInspectionMode = true;
      return "inspection_mode";
    }

    // Check for intelligence insights
    if (context.module === "intelligence" &&
        TRIGGER_PATTERNS.intelligence_insight.some(pattern => pattern.test(input))) {
      return "intelligence_insight";
    }

    // Check other trigger patterns
    for (const [trigger, patterns] of Object.entries(TRIGGER_PATTERNS)) {
      if (["inspection_mode", "intelligence_insight"].includes(trigger)) continue;
      if (patterns.some(pattern => pattern.test(input))) {
        return trigger as EdVoiceTrigger;
      }
    }

    return null;
  }

  /**
   * Get a response based on trigger and context
   */
  getResponse(trigger: EdVoiceTrigger | null, context: EdVoiceContext): EdDialogueResponse {
    // Default response if no trigger
    if (!trigger) {
      return {
        text: this.getRandomResponse(["That's sorted.", "Here you go.", "All set.", "Done."]),
        animation: "ed-idle",
        voiceState: "speaking",
      };
    }

    // Check if we should add personality
    const shouldAddPersonality = Math.random() < this.personalityFrequency;
    if (!shouldAddPersonality && ["praise", "modest"].includes(trigger)) {
      // Use neutral response for praise without personality
      return {
        text: this.getRandomResponse(["Thank you.", "Happy to help.", "Always here to help."]),
        animation: "ed-idle",
        voiceState: "speaking",
      };
    }

    // Get trigger-specific response
    const responses = DEFAULT_RESPONSES[trigger];
    const text = this.getRandomResponse(responses);

    // Map trigger to animation
    const animationMap: Record<EdVoiceTrigger, string> = {
      success: "ed-success",
      praise: "ed-blush",
      modest: "ed-blush",
      thinking: "ed-thinking",
      error: "ed-error",
      error_recovery: "ed-success",
      reassurance: "ed-idle",
      inspection_mode: "ed-idle",
      intelligence_insight: "ed-success",
    };

    return {
      text,
      animation: animationMap[trigger] as any,
      voiceState: trigger === "thinking" ? "listening" : "speaking",
      probability: this.personalityFrequency,
    };
  }

  /**
   * Get module-specific greeting
   */
  getModuleGreeting(module?: string): string {
    if (!module) return "Hello. I'm Ed. What would you like to sort today?";
    const greetings = MODULE_GREETINGS[module];
    return this.getRandomResponse(greetings || ["Hello. How can I help?"]);
  }

  /**
   * Set current module context
   */
  setModule(module: string): void {
    this.currentModule = module;
  }

  /**
   * Set inspection mode
   */
  setInspectionMode(enabled: boolean): void {
    this.isInspectionMode = enabled;
  }

  /**
   * Get random response from array
   */
  private getRandomResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Reset state (e.g., after session ends)
   */
  reset(): void {
    this.currentModule = undefined;
    this.isInspectionMode = false;
  }

  /**
   * Get animation config for a given animation
   */
  getAnimationConfig(animation: string) {
    return ANIMATION_CONFIG[animation] || ANIMATION_CONFIG["ed-idle"];
  }

  /**
   * Check if a response should trigger personality
   */
  shouldTriggerPersonality(): boolean {
    return Math.random() < this.personalityFrequency;
  }

  /**
   * Get personality frequency (useful for testing)
   */
  getPersonalityFrequency(): number {
    return this.personalityFrequency;
  }

  /**
   * Set personality frequency (useful for testing or tuning)
   */
  setPersonalityFrequency(frequency: number): void {
    this.personalityFrequency = Math.max(0, Math.min(1, frequency));
  }
}

/**
 * Singleton instance
 */
export const edVoiceTriggerSystem = new EdVoiceTriggerSystem();

/**
 * Convenience function to get Ed's response
 */
export function getEdResponse(
  input: string,
  context: EdVoiceContext = {}
): EdDialogueResponse {
  const trigger = edVoiceTriggerSystem.detectTrigger(input, context);
  return edVoiceTriggerSystem.getResponse(trigger, context);
}

/**
 * Convenience function to set module context
 */
export function setEdModule(module: string): void {
  edVoiceTriggerSystem.setModule(module);
}

/**
 * Convenience function to toggle inspection mode
 */
export function setEdInspectionMode(enabled: boolean): void {
  edVoiceTriggerSystem.setInspectionMode(enabled);
}
