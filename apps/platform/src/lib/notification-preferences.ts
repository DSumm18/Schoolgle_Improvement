/**
 * Notification Preferences
 *
 * Defines notification categories and per-user channel preferences.
 * For now, preferences always return defaults (all email + in_app on, sms off).
 * A future `notification_preferences` table will allow per-user overrides.
 */

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const NOTIFICATION_CATEGORIES = [
  "risk_alerts",
  "compliance_reminders",
  "training_expiry",
  "approval_requests",
  "energy_alerts",
  "system_updates",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationChannel = "email" | "in_app" | "sms";

export interface ChannelPreferences {
  email: boolean;
  in_app: boolean;
  sms: boolean;
}

export type NotificationPreferences = Record<
  NotificationCategory,
  ChannelPreferences
>;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CHANNEL: ChannelPreferences = {
  email: true,
  in_app: true,
  sms: false,
};

export function getDefaultPreferences(): NotificationPreferences {
  return {
    risk_alerts: { ...DEFAULT_CHANNEL },
    compliance_reminders: { ...DEFAULT_CHANNEL },
    training_expiry: { ...DEFAULT_CHANNEL },
    approval_requests: { ...DEFAULT_CHANNEL },
    energy_alerts: { email: false, in_app: true, sms: false },
    system_updates: { email: false, in_app: true, sms: false },
  };
}

// ---------------------------------------------------------------------------
// Preference check
// ---------------------------------------------------------------------------

/**
 * Check whether a notification should be sent to a user on a given channel.
 *
 * Currently always returns the default preference for the category+channel.
 * When a `notification_preferences` table exists, this will query it first.
 */
export function shouldNotify(
  _userId: string,
  category: NotificationCategory,
  channel: NotificationChannel,
): boolean {
  const defaults = getDefaultPreferences();
  return defaults[category]?.[channel] ?? false;
}
