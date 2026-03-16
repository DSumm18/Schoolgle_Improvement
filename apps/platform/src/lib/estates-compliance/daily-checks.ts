/**
 * Daily Opening & Closing Checklists
 *
 * Quick daily routines for school site staff to complete.
 * Designed for mobile tap-through interface with simple pass/fail/N/A options.
 */

export type DailyCheckType = "opening" | "closing";
export type DailyCheckStatus =
  | "pending"
  | "passed"
  | "failed"
  | "not_applicable";

export interface DailyCheckItem {
  id: string;
  type?: DailyCheckType; // Optional for dynamic routines
  routine_id?: string;
  name: string;
  description: string;
  category: "security" | "safety" | "facilities" | "environmental";
  icon: string;
  requiresPhoto?: boolean;
  requiresNotes?: boolean;
  estimatedTime?: number; // seconds
}

export interface Routine {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  type: DailyCheckType | "custom";
  recurrence: "daily" | "weekly" | "monthly" | "once";
  recurrence_days?: string[];
  start_time?: string;
  deadline_time?: string;
  is_active: boolean;
  items?: DailyCheckItem[];
  created_at?: string;
  updated_at?: string;
}

export interface DailyChecklist {
  type: DailyCheckType;
  name: string;
  description: string;
  icon: string;
  estimatedTotalTime: number; // seconds
  items: DailyCheckItem[];
}

/**
 * Daily Opening Checklist
 * Complete before staff and students arrive
 */
export const OPENING_CHECKLIST: DailyChecklist = {
  type: "opening",
  name: "Morning Opening Checks",
  description: "Complete these checks before the school day begins",
  icon: "🌅",
  estimatedTotalTime: 180, // 3 minutes
  items: [
    // Security checks
    {
      id: "open_perimeter_fence",
      type: "opening",
      name: "Perimeter Fence & Gates",
      description:
        "Check perimeter fencing for damage, gates are secure, locks are functioning",
      category: "security",
      icon: "🔒",
      requiresPhoto: true,
      requiresNotes: true,
      estimatedTime: 30,
    },
    {
      id: "open_car_park",
      type: "opening",
      name: "Car Park & Paths",
      description:
        "Check car park and pathways for obstructions, ice, damage, or hazards",
      category: "facilities",
      icon: "🚗",
      requiresPhoto: true,
      requiresNotes: true,
      estimatedTime: 20,
    },
    {
      id: "open_external_lighting",
      type: "opening",
      name: "External Lighting",
      description:
        "Check external lights are working (especially in winter months)",
      category: "safety",
      icon: "💡",
      requiresNotes: true,
      estimatedTime: 10,
    },

    // Access checks
    {
      id: "open_main_entrance",
      type: "opening",
      name: "Main Entrance",
      description:
        "Unlock main entrance, test door entry system, check visitor sign-in area",
      category: "security",
      icon: "🚪",
      estimatedTime: 15,
    },
    {
      id: "open_all_doors",
      type: "opening",
      name: "External Doors",
      description:
        "Unlock all required external doors, check they open and close properly",
      category: "security",
      icon: "🚪",
      requiresNotes: true,
      estimatedTime: 20,
    },

    // Safety systems
    {
      id: "open_fire_panel",
      type: "opening",
      name: "Fire Alarm Panel",
      description: "Check fire alarm panel for any fault indicators",
      category: "safety",
      icon: "🔥",
      requiresNotes: true,
      estimatedTime: 10,
    },
    {
      id: "open_alarm_system",
      type: "opening",
      name: "Intruder Alarm",
      description:
        "Check intruder alarm has unset correctly, no fault warnings",
      category: "security",
      icon: "🚨",
      requiresNotes: true,
      estimatedTime: 10,
    },

    // Facilities
    {
      id: "open_heating",
      type: "opening",
      name: "Heating System",
      description:
        "Check heating is on and building is reaching required temperature",
      category: "facilities",
      icon: "🌡️",
      requiresNotes: true,
      estimatedTime: 15,
    },
    {
      id: "open_water",
      type: "opening",
      name: "Water Supply",
      description:
        "Check water is flowing, no visible leaks, hot water is working",
      category: "facilities",
      icon: "💧",
      requiresNotes: true,
      estimatedTime: 10,
    },
    {
      id: "open_bins",
      type: "opening",
      name: "Bin Areas",
      description:
        "Check bin areas are clean, no overflow, no signs of pest activity",
      category: "environmental",
      icon: "🗑️",
      requiresPhoto: true,
      requiresNotes: true,
      estimatedTime: 15,
    },

    // Learning spaces
    {
      id: "open_classrooms",
      type: "opening",
      name: "Classroom Check",
      description:
        "Quick check of main classrooms - windows closed, no damage, no hazards",
      category: "safety",
      icon: "🏫",
      requiresNotes: true,
      estimatedTime: 30,
    },
    {
      id: "open_toilets",
      type: "opening",
      name: "Toilet Facilities",
      description:
        "Check toilets are clean, stocked, and no leaks or vandalism",
      category: "facilities",
      icon: "🚻",
      requiresNotes: true,
      estimatedTime: 15,
    },
  ],
};

/**
 * Daily Closing Checklist
 * Complete at the end of the school day
 */
export const CLOSING_CHECKLIST: DailyChecklist = {
  type: "closing",
  name: "End of Day Closing Checks",
  description: "Complete these checks before leaving the premises",
  icon: "🌙",
  estimatedTotalTime: 240, // 4 minutes
  items: [
    // Security checks
    {
      id: "close_windows",
      type: "closing",
      name: "Windows Closed & Locked",
      description:
        "Check all windows on ground floor and accessible areas are closed and locked",
      category: "security",
      icon: "🪟",
      requiresNotes: true,
      estimatedTime: 30,
    },
    {
      id: "close_doors",
      type: "closing",
      name: "External Doors Locked",
      description: "Check all external doors are locked and secure",
      category: "security",
      icon: "🔒",
      requiresNotes: true,
      estimatedTime: 30,
    },
    {
      id: "close_gates",
      type: "closing",
      name: "Gates Locked",
      description:
        "Lock all perimeter gates, vehicle access points, and side entrances",
      category: "security",
      icon: "🚧",
      requiresNotes: true,
      estimatedTime: 20,
    },

    // Safety systems
    {
      id: "close_alarm_set",
      type: "closing",
      name: "Intruder Alarm Set",
      description: "Set intruder alarm, confirm system is armed",
      category: "security",
      icon: "🚨",
      estimatedTime: 15,
    },
    {
      id: "close_fire_panel",
      type: "closing",
      name: "Fire Panel Check",
      description: "Final check of fire alarm panel for any new faults",
      category: "safety",
      icon: "🔥",
      requiresNotes: true,
      estimatedTime: 10,
    },

    // Facilities
    {
      id: "close_appliances",
      type: "closing",
      name: "Appliances Off",
      description:
        "Check all non-essential appliances and equipment are turned off",
      category: "safety",
      icon: "🔌",
      requiresNotes: true,
      estimatedTime: 30,
    },
    {
      id: "close_heating",
      type: "closing",
      name: "Heating Setback",
      description: "Set heating to night/setback mode (if applicable)",
      category: "facilities",
      icon: "🌡️",
      estimatedTime: 10,
    },
    {
      id: "close_lights",
      type: "closing",
      name: "Lights Off",
      description:
        "Turn off all non-essential lighting, leave security lights on",
      category: "facilities",
      icon: "💡",
      requiresNotes: true,
      estimatedTime: 20,
    },

    // Final checks
    {
      id: "close_vandalism",
      type: "closing",
      name: "Vandalism/Damage Check",
      description:
        "Quick walk-through to check for any new damage or vandalism",
      category: "security",
      icon: "👀",
      requiresPhoto: true,
      requiresNotes: true,
      estimatedTime: 40,
    },
    {
      id: "close_cleanliness",
      type: "closing",
      name: "General Tidy",
      description:
        "Check main areas are tidy, no trip hazards, bins not overflowing",
      category: "environmental",
      icon: "🧹",
      requiresNotes: true,
      estimatedTime: 20,
    },
    {
      id: "close_safety_equipment",
      type: "closing",
      name: "Safety Equipment Check",
      description:
        "Quick check that fire extinguishers are in place, first aid kits accessible",
      category: "safety",
      icon: "🧯",
      requiresNotes: true,
      estimatedTime: 15,
    },
  ],
};

/**
 * All daily checklists
 */
export const DAILY_CHECKLISTS: Record<DailyCheckType, DailyChecklist> = {
  opening: OPENING_CHECKLIST,
  closing: CLOSING_CHECKLIST,
};

/**
 * Get a specific daily checklist
 */
export function getDailyChecklist(type: DailyCheckType): DailyChecklist {
  return DAILY_CHECKLISTS[type];
}

/**
 * Get all daily check items
 */
export function getAllDailyCheckItems(): DailyCheckItem[] {
  return [...OPENING_CHECKLIST.items, ...CLOSING_CHECKLIST.items];
}

/**
 * Get daily check items by type
 */
export function getDailyCheckItems(type: DailyCheckType): DailyCheckItem[] {
  return DAILY_CHECKLISTS[type].items;
}

/**
 * Get daily check items by category
 */
export function getDailyCheckItemsByCategory(
  category: DailyCheckItem["category"],
): DailyCheckItem[] {
  return getAllDailyCheckItems().filter((item) => item.category === category);
}

/**
 * Get a specific daily check item by ID
 */
export function getDailyCheckItem(id: string): DailyCheckItem | undefined {
  return getAllDailyCheckItems().find((item) => item.id === id);
}

/**
 * Daily check completion record interface
 */
export interface DailyCheckCompletion {
  id: string;
  organization_id: string;
  user_id: string;
  check_type: DailyCheckType;
  check_date: string; // ISO date string
  started_at: string; // ISO timestamp
  completed_at?: string; // ISO timestamp
  status: "in_progress" | "completed" | "failed";
  results: DailyCheckResult[];
  total_items: number;
  passed_items: number;
  failed_items: number;
  not_applicable_items: number;
  notes?: string;
  photos: string[]; // Photo URLs for any issues
  routine_id?: string; // Link to dynamic routine
  created_at: string;
  updated_at: string;
}

/**
 * Result for a single daily check item
 */
export interface DailyCheckResult {
  item_id: string;
  status: DailyCheckStatus;
  notes?: string;
  photo_url?: string;
  completed_at?: string; // ISO timestamp
}

/**
 * Input for creating/updating daily check completion
 */
export interface DailyCheckCompletionInput {
  check_type: DailyCheckType;
  check_date?: string; // Defaults to today
  results: DailyCheckResult[];
  notes?: string;
  photos?: string[];
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Check if a checklist is already completed for today
 */
export interface ChecklistStatus {
  type: DailyCheckType;
  completed: boolean;
  completedAt?: string;
  inProgress: boolean;
  name?: string;
  description?: string;
  deadline_time?: string;
  items_count?: number;
  result?: {
    passed: number;
    failed: number;
    notApplicable: number;
    total: number;
  };
}

export function getChecklistStatusForToday(
  completedChecks: DailyCheckCompletion[],
  type: DailyCheckType,
): ChecklistStatus {
  const today = getTodayDate();

  const todayCheck = completedChecks.find(
    (check) => check.check_type === type && check.check_date === today,
  );

  if (!todayCheck) {
    return { type, completed: false, inProgress: false };
  }

  if (todayCheck.status === "completed") {
    return {
      type,
      completed: true,
      completedAt: todayCheck.completed_at,
      inProgress: false,
      result: {
        passed: todayCheck.passed_items,
        failed: todayCheck.failed_items,
        notApplicable: todayCheck.not_applicable_items,
        total: todayCheck.total_items,
      },
    };
  }

  return {
    type,
    completed: false,
    inProgress: todayCheck.status === "in_progress",
  };
}

/**
 * Calculate checklist progress percentage
 */
export function calculateProgress(results: DailyCheckResult[]): number {
  if (results.length === 0) return 0;
  const completed = results.filter((r) => r.status !== "pending").length;
  return Math.round((completed / results.length) * 100);
}

/**
 * Get checklist icon based on status
 */
export function getChecklistIcon(status: ChecklistStatus): string {
  if (status.completed) {
    if (status.result && status.result.failed > 0) {
      return "⚠️"; // Completed but with failures
    }
    return "✅"; // Fully passed
  }
  if (status.inProgress) {
    return "🔄"; // In progress
  }
  return "⏳"; // Pending
}

/**
 * Get checklist color class based on status
 */
export function getChecklistColor(status: ChecklistStatus): string {
  if (status.completed) {
    if (status.result && status.result.failed > 0) {
      return "text-amber-600 bg-amber-50 border-amber-200";
    }
    return "text-green-600 bg-green-50 border-green-200";
  }
  if (status.inProgress) {
    return "text-blue-600 bg-blue-50 border-blue-200";
  }
  return "text-gray-600 bg-gray-50 border-gray-200";
}
