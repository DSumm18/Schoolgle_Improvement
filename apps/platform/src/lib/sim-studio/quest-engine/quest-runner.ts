// ============================================================================
// QUEST ENGINE
// Adaptive micro-assessment system with scaffolds and telemetry
// ============================================================================

import {
  QuestDef,
  QuestItem,
  QuestRun,
  ItemResult,
  ScaffoldPreset,
  ThemePack,
} from "../types";

// ============================================================================
// QUEST STATE
// ============================================================================

export interface QuestState {
  questId: string;
  pupilId: string;
  currentItemIndex: number;
  items: QuestItemState[];
  startedAt: Date;
  scaffoldUsed: ScaffoldPreset;
  theme: ThemePack;
  totalScore: number;
  coinsEarned: number;
  isComplete: boolean;
  telemetry: QuestTelemetry;
}

export interface QuestItemState {
  item: QuestItem;
  state: "pending" | "in_progress" | "completed" | "skipped";
  attempts: number;
  hintsUsed: number;
  timeSpent: number; // seconds
  stuckEvents: number;
  result?: ItemResult;
}

export interface QuestTelemetry {
  interactions: TelemetryEvent[];
  totalTime: number;
  deviceInfo?: Record<string, any>;
  sessionMetadata: Record<string, any>;
}

export interface TelemetryEvent {
  type: "start" | "hint" | "attempt" | "stuck" | "complete" | "skip";
  timestamp: Date;
  itemId: string;
  data?: Record<string, any>;
}

// ============================================================================
// ADAPTIVE SCAFFOLDS
// ============================================================================

export const SCAFFOLD_PRESETS: Record<ScaffoldPreset, ScaffoldConfig> = {
  standard: {
    name: "Standard",
    description: "No additional support",
    hintsAvailable: 2,
    timeExtension: 1.0,
    attemptsAllowed: 3,
    visualSupport: "minimal",
    languageSupport: "standard",
    motorSupport: false,
  },
  step_by_step: {
    name: "Step-by-Step",
    description: "One change at a time",
    hintsAvailable: 4,
    timeExtension: 1.5,
    attemptsAllowed: 5,
    visualSupport: "high",
    languageSupport: "simplified",
    motorSupport: false,
    features: ["sequential_steps", "prevent_mistakes", "highlight_next"],
  },
  language_lite: {
    name: "Language-Lite",
    description: "Reduced text, more visual",
    hintsAvailable: 3,
    timeExtension: 1.3,
    attemptsAllowed: 4,
    visualSupport: "high",
    languageSupport: "minimal",
    motorSupport: false,
    features: ["icon_prompts", "minimal_text", "visual_instructions"],
  },
  visual_first: {
    name: "Visual-First",
    description: "Minimal text, icon-heavy",
    hintsAvailable: 2,
    timeExtension: 1.2,
    attemptsAllowed: 3,
    visualSupport: "maximum",
    languageSupport: "minimal",
    motorSupport: false,
    features: ["icons_only", "picture_prompts", "no_text_instructions"],
  },
  reduced_motion: {
    name: "Reduced Motion",
    description: "Lower FPS, fewer transitions",
    hintsAvailable: 2,
    timeExtension: 1.0,
    attemptsAllowed: 3,
    visualSupport: "standard",
    languageSupport: "standard",
    motorSupport: false,
    features: ["30fps_cap", "fade_transitions_only", "no_particles"],
  },
  motor_friendly: {
    name: "Motor-Friendly",
    description: "Larger targets, simplified UI",
    hintsAvailable: 3,
    timeExtension: 1.5,
    attemptsAllowed: 5,
    visualSupport: "high",
    languageSupport: "standard",
    motorSupport: true,
    features: ["large_targets", "simplified_click", "alternate_input"],
  },
  stretch: {
    name: "Stretch",
    description: "Additional challenge",
    hintsAvailable: 0,
    timeExtension: 0.8,
    attemptsAllowed: 2,
    visualSupport: "minimal",
    languageSupport: "standard",
    motorSupport: false,
    features: ["bonus_challenges", "reduced_guidance", "higher_threshold"],
  },
};

export interface ScaffoldConfig {
  name: string;
  description: string;
  hintsAvailable: number;
  timeExtension: number;
  attemptsAllowed: number;
  visualSupport: "minimal" | "standard" | "high" | "maximum";
  languageSupport: "minimal" | "simplified" | "standard";
  motorSupport: boolean;
  features?: string[];
}

// ============================================================================
// QUEST RUNNER
// ============================================================================

export class QuestRunner {
  private state: QuestState;
  private questDef: QuestDef;

  constructor(
    questDef: QuestDef,
    pupilId: string,
    scaffoldPreset: ScaffoldPreset,
    theme: ThemePack,
  ) {
    this.questDef = questDef;
    this.state = this.initializeQuest(questDef, pupilId, scaffoldPreset, theme);
  }

  private initializeQuest(
    questDef: QuestDef,
    pupilId: string,
    scaffoldPreset: ScaffoldPreset,
    theme: ThemePack,
  ): QuestState {
    const scaffold = SCAFFOLD_PRESETS[scaffoldPreset];

    return {
      questId: questDef.id,
      pupilId,
      currentItemIndex: 0,
      items: questDef.items.map((item) => ({
        item,
        state: "pending" as const,
        attempts: 0,
        hintsUsed: 0,
        timeSpent: 0,
        stuckEvents: 0,
      })),
      startedAt: new Date(),
      scaffoldUsed: scaffoldPreset,
      theme,
      totalScore: 0,
      coinsEarned: 0,
      isComplete: false,
      telemetry: {
        interactions: [],
        totalTime: 0,
        sessionMetadata: {
          scaffold: scaffoldPreset,
          theme: theme.id,
          difficulty: questDef.difficulty_level,
          languageLoad: questDef.language_load,
        },
      },
    };
  }

  // ============================================================================
  // QUEST CONTROL
  // ============================================================================

  startItem(): QuestItem {
    const currentItem = this.state.items[this.state.currentItemIndex];
    currentItem.state = "in_progress";

    this.recordTelemetry({
      type: "start",
      timestamp: new Date(),
      itemId: currentItem.item.id,
    });

    return currentItem.item;
  }

  submitAttempt(answer: any, timeSpent: number): ItemResult {
    const currentItemState = this.state.items[this.state.currentItemIndex];
    const item = currentItemState.item;
    const scaffold = SCAFFOLD_PRESETS[this.state.scaffoldUsed];

    // Record attempt
    currentItemState.attempts++;
    currentItemState.timeSpent += timeSpent;

    // Validate answer
    const isCorrect = this.validateAnswer(item, answer);

    // Calculate score (0-100)
    const baseScore = isCorrect ? 100 : 0;
    const attemptPenalty = (currentItemState.attempts - 1) * 10;
    const hintPenalty = currentItemState.hintsUsed * 5;
    const timeBonus = timeSpent < 30 ? 10 : 0;

    let score = Math.max(
      0,
      baseScore - attemptPenalty - hintPenalty + timeBonus,
    );

    // Check for stuck behavior (multiple failed attempts)
    if (!isCorrect && currentItemState.attempts >= 3) {
      currentItemState.stuckEvents++;
      this.recordTelemetry({
        type: "stuck",
        timestamp: new Date(),
        itemId: item.id,
        data: { attempt: currentItemState.attempts },
      });
    }

    // Determine confidence
    const confidence = this.calculateConfidence(currentItemState, isCorrect);

    // Detect misconceptions
    const misconceptions = this.detectMisconceptions(item, answer, isCorrect);

    // Check for transfer gap (if applicable)
    const transferGap = this.checkTransferGap(item, isCorrect);

    const result: ItemResult = {
      score,
      confidence,
      attempts: currentItemState.attempts,
      hints_used: currentItemState.hintsUsed,
      time_seconds: currentItemState.timeSpent,
      stuck_events: currentItemState.stuckEvents,
      misconceptions,
      transfer_gap: transferGap,
    };

    // Record telemetry
    this.recordTelemetry({
      type: "attempt",
      timestamp: new Date(),
      itemId: item.id,
      data: {
        score,
        isCorrect,
        attempts: currentItemState.attempts,
        timeSpent,
      },
    });

    // If correct or max attempts reached, complete item
    if (isCorrect || currentItemState.attempts >= scaffold.attemptsAllowed) {
      this.completeItem(result);
    } else {
      currentItemState.result = result; // Store partial result
    }

    return result;
  }

  requestHint(): string {
    const currentItemState = this.state.items[this.state.currentItemIndex];
    const scaffold = SCAFFOLD_PRESETS[this.state.scaffoldUsed];

    if (currentItemState.hintsUsed >= scaffold.hintsAvailable) {
      return (
        this.state.theme.copy_pack.ui_strings.hint || "No more hints available"
      );
    }

    currentItemState.hintsUsed++;

    const hintIndex = currentItemState.hintsUsed - 1;
    const hint =
      currentItemState.item.hints[hintIndex] || "Read the question carefully";

    this.recordTelemetry({
      type: "hint",
      timestamp: new Date(),
      itemId: currentItemState.item.id,
      data: { hintIndex, hint },
    });

    return hint;
  }

  skipItem(): void {
    const currentItemState = this.state.items[this.state.currentItemIndex];
    currentItemState.state = "skipped";

    this.recordTelemetry({
      type: "skip",
      timestamp: new Date(),
      itemId: currentItemState.item.id,
    });

    this.moveToNextItem();
  }

  private completeItem(result: ItemResult): void {
    const currentItemState = this.state.items[this.state.currentItemIndex];
    currentItemState.state = "completed";
    currentItemState.result = result;

    // Update total score
    this.state.totalScore += result.score;

    this.recordTelemetry({
      type: "complete",
      timestamp: new Date(),
      itemId: currentItemState.item.id,
      data: { score: result.score },
    });

    this.moveToNextItem();
  }

  private moveToNextItem(): void {
    // Find next pending item
    const nextIndex = this.state.items.findIndex(
      (item, index) =>
        index > this.state.currentItemIndex && item.state === "pending",
    );

    if (nextIndex === -1) {
      // All items complete
      this.completeQuest();
    } else {
      this.state.currentItemIndex = nextIndex;
    }
  }

  private completeQuest(): void {
    this.state.isComplete = true;

    // Calculate coins earned (with theme multiplier)
    const avgScore = this.state.totalScore / this.state.items.length;
    const baseCoins = this.questDef.reward_coins;
    const scoreMultiplier = avgScore / 100;
    const themeMultiplier = this.state.theme.reward_catalog.coins_multiplier;

    this.state.coinsEarned = Math.round(
      baseCoins * scoreMultiplier * themeMultiplier,
    );

    this.state.telemetry.totalTime = this.state.items.reduce(
      (sum, item) => sum + item.timeSpent,
      0,
    );
  }

  // ============================================================================
  // SCORING & VALIDATION
  // ============================================================================

  private validateAnswer(item: QuestItem, answer: any): boolean {
    // For MVP, simple validation
    // In production, this would be more sophisticated based on item type
    if (typeof answer === "boolean") return answer;
    if (typeof answer === "number") return answer > 0;
    if (typeof answer === "string") return answer.length > 0;
    if (Array.isArray(answer)) return answer.length > 0;

    return false;
  }

  private calculateConfidence(
    itemState: QuestItemState,
    isCorrect: boolean,
  ): "low" | "medium" | "high" {
    if (isCorrect && itemState.attempts === 1 && itemState.hintsUsed === 0)
      return "high";
    if (isCorrect && itemState.attempts <= 2) return "medium";
    if (!isCorrect && itemState.attempts >= 3) return "low";
    return "medium";
  }

  private detectMisconceptions(
    item: QuestItem,
    answer: any,
    isCorrect: boolean,
  ): string[] {
    const misconceptions: string[] = [];

    // Example misconception detection (would be more sophisticated in production)
    if (!isCorrect) {
      if (item.task_prompt.toLowerCase().includes("fraction")) {
        misconceptions.push("fraction_misconception");
      }
      if (item.task_prompt.toLowerCase().includes("place value")) {
        misconceptions.push("place_value_misconception");
      }
    }

    return misconceptions;
  }

  private checkTransferGap(item: QuestItem, isCorrect: boolean): boolean {
    // Transfer gap: concept strong but transfer weak
    // For MVP, simple check: if it's a transfer item and they struggled
    if (item.evidence_type === "transfer" && !isCorrect) {
      return true;
    }
    return false;
  }

  // ============================================================================
  // TELEMETRY
  // ============================================================================

  private recordTelemetry(event: TelemetryEvent): void {
    this.state.telemetry.interactions.push(event);
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getState(): QuestState {
    return this.state;
  }

  getCurrentItem(): QuestItem | null {
    if (this.state.currentItemIndex >= this.state.items.length) return null;
    return this.state.items[this.state.currentItemIndex].item;
  }

  getProgress(): { completed: number; total: number; percentage: number } {
    const completed = this.state.items.filter(
      (item) => item.state === "completed",
    ).length;
    const total = this.state.items.length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  }

  isComplete(): boolean {
    return this.state.isComplete;
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  exportRun(): QuestRun {
    return {
      id: crypto.randomUUID(),
      quest_id: this.questDef.id,
      pupil_id: this.state.pupilId,
      started_at: this.state.startedAt,
      completed_at: this.state.isComplete ? new Date() : undefined,
      item_results: this.state.items
        .filter((item) => item.result)
        .map((item) => item.result!),
      total_score: Math.round(this.state.totalScore / this.state.items.length),
      coins_earned: this.state.coinsEarned,
      scaffold_used: this.state.scaffoldUsed,
      device_info: this.state.telemetry.deviceInfo,
      completion_rate: this.getProgress().percentage,
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createQuestRunner(
  questDef: QuestDef,
  pupilId: string,
  scaffoldPreset: ScaffoldPreset,
  theme: ThemePack,
): QuestRunner {
  return new QuestRunner(questDef, pupilId, scaffoldPreset, theme);
}
