/**
 * Form Fill Audit Log
 * Minimal audit logging to chrome.storage.local
 * NO raw values stored
 */

export interface AuditLogEntry {
  timestamp: number;
  hostname: string; // No query params
  consentGiven: boolean;
  planCounts: {
    total: number;
    gated: number; // Fields requiring confirmation
    blocked: number; // Fields blocked (<0.60 confidence or sensitive)
  };
  executionResults: Array<{
    fieldLabel: string;
    status: 'succeeded' | 'failed' | 'skipped';
  }>;
  abortReason?: 'rerender' | 'user_stop' | 'mismatch' | 'timeout';
  visionFallbackUsed?: boolean; // Whether vision fallback was used
  stepModeUsed?: boolean; // Whether step mode was used
  pauseCount?: number; // Number of times paused
  resumeCount?: number; // Number of times resumed
  stepAdvanceCount?: number; // Number of step advances (step mode)
}

const AUDIT_LOG_KEY = 'ed_form_fill_audit_log';
const MAX_LOG_ENTRIES = 100; // Keep last 100 entries

/**
 * Get clean hostname (no query params, no path)
 */
export function getCleanHostname(): string {
  const url = new URL(window.location.href);
  return url.hostname;
}

/**
 * Save audit log entry
 */
export async function saveAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // Get existing log
    const result = await chrome.storage.local.get(AUDIT_LOG_KEY);
    const existingLog: AuditLogEntry[] = result[AUDIT_LOG_KEY] || [];
    
    // Add new entry
    const updatedLog = [entry, ...existingLog].slice(0, MAX_LOG_ENTRIES);
    
    // Save
    await chrome.storage.local.set({ [AUDIT_LOG_KEY]: updatedLog });
  } catch (error) {
    console.error('[Form Fill Audit] Failed to save log:', error);
  }
}

/**
 * Get audit log entries
 */
export async function getAuditLog(): Promise<AuditLogEntry[]> {
  try {
    const result = await chrome.storage.local.get(AUDIT_LOG_KEY);
    return result[AUDIT_LOG_KEY] || [];
  } catch (error) {
    console.error('[Form Fill Audit] Failed to load log:', error);
    return [];
  }
}

/**
 * Clear audit log
 */
export async function clearAuditLog(): Promise<void> {
  try {
    await chrome.storage.local.remove(AUDIT_LOG_KEY);
  } catch (error) {
    console.error('[Form Fill Audit] Failed to clear log:', error);
  }
}

