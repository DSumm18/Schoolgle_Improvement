/**
 * SchoolDataGuardian — Zero-Trust Privacy Shield for School Data
 *
 * Intercepts text before it reaches LLMs and scrubs PII using a unified regex-based
 * detector. Returns a reversible token map so outputs can be rehydrated with the
 * original values client-side. Non-blocking by default — always sanitises and
 * proceeds, never fails the request. Writes audit entries to guardian_audit_log.
 *
 * This is the unified replacement for the previous two competing modules
 * (the old SchoolDataGuardian and pii-masker.ts). See
 * docs/architecture/school-data-guardian-audit.md for history and gaps.
 */

export type GuardianCategory =
  | 'email'
  | 'phone'
  | 'dob'
  | 'upn'
  | 'nhs_number'
  | 'name_with_role'
  | 'postcode'
  | 'ni_number';

export interface GuardianOptions {
  skipCategories?: GuardianCategory[];
  allowlist?: string[]; // public strings that must pass through
  callerName?: string;
  orgId?: string;
}

export interface GuardianResult {
  sanitised: string;
  tokenMap: Map<string, string>;
  isClean: boolean;
  categoriesDetected: GuardianCategory[];
  counts: Record<string, number>;
}

// Order matters — more specific patterns first so they win over generic ones.
const PATTERNS: Array<{ category: GuardianCategory; regex: RegExp; prefix: string }> = [
  // NHS: 9 digits in 3-3-3 or 3-3-4 groupings
  { category: 'nhs_number', regex: /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g, prefix: 'NHS' },
  // UPN: single letter followed by 12 digits
  { category: 'upn', regex: /\b[A-Z]\d{12}\b/g, prefix: 'UPN' },
  // NI: 2 letters + 6 digits + 1 letter (A-D)
  { category: 'ni_number', regex: /\b[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b/g, prefix: 'NI' },
  // Email
  { category: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, prefix: 'EMAIL' },
  // DOB: d/m/y or d-m-y or d.m.y with a 19xx or 20xx year
  { category: 'dob', regex: /\b(0?[1-9]|[12]\d|3[01])[-./](0?[1-9]|1[0-2])[-./](19|20)\d{2}\b/g, prefix: 'DOB' },
  // UK phone: +44 or 0 prefix, 10-11 digits total
  { category: 'phone', regex: /(?:\+?44|0)(?:\s?\d){9,10}\b/g, prefix: 'PHONE' },
  // UK postcode
  { category: 'postcode', regex: /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/g, prefix: 'POSTCODE' },
  // Role-context names: "Mr/Mrs/Ms/Miss/Dr/Headteacher/etc. FirstName LastName[ LastName2]"
  {
    category: 'name_with_role',
    regex: /(?:Mr|Mrs|Ms|Miss|Dr|Headteacher|Principal|Deputy|SENCO|DSL)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g,
    prefix: 'PERSON',
  },
];

export class SchoolDataGuardian {
  /**
   * Scrub PII from text. Always sanitises and returns — never blocks or fails.
   * The returned tokenMap can be used with rehydrate() to restore originals.
   */
  static scrub(text: string, options: GuardianOptions = {}): GuardianResult {
    if (!text) {
      return {
        sanitised: '',
        tokenMap: new Map(),
        isClean: true,
        categoriesDetected: [],
        counts: {},
      };
    }

    const skip = new Set(options.skipCategories ?? []);
    const allowlist = new Set(options.allowlist ?? []);
    const tokenMap = new Map<string, string>();
    const counts: Record<string, number> = {};
    const categoriesDetected = new Set<GuardianCategory>();
    let counter = 0;

    // Pre-protect allowlist strings by temporarily replacing them with placeholder tokens
    // so regex patterns don't catch them. We'll restore them at the end.
    const protectionMap = new Map<string, string>();
    let working = text;
    let protectionCounter = 0;
    for (const item of allowlist) {
      if (!item) continue;
      const placeholder = `__GUARDIAN_PROTECT_${protectionCounter++}__`;
      if (working.includes(item)) {
        protectionMap.set(placeholder, item);
        working = working.split(item).join(placeholder);
      }
    }

    // Apply each pattern
    for (const { category, regex, prefix } of PATTERNS) {
      if (skip.has(category)) continue;
      working = working.replace(regex, (match) => {
        counter += 1;
        const token = `[${prefix}_${counter}]`;
        tokenMap.set(token, match);
        counts[category] = (counts[category] ?? 0) + 1;
        categoriesDetected.add(category);
        return token;
      });
    }

    // Restore protected allowlist strings
    for (const [placeholder, original] of protectionMap.entries()) {
      working = working.split(placeholder).join(original);
    }

    return {
      sanitised: working,
      tokenMap,
      isClean: tokenMap.size === 0,
      categoriesDetected: Array.from(categoriesDetected),
      counts,
    };
  }

  /**
   * Restore original values from a token map. Used after an LLM call when we
   * want to show users their real names/emails in the output.
   */
  static rehydrate(text: string, tokenMap: Map<string, string>): string {
    let result = text;
    for (const [token, original] of tokenMap.entries()) {
      result = result.split(token).join(original);
    }
    return result;
  }

  /**
   * Write an audit log entry. Best-effort — swallows errors so Guardian
   * never breaks the caller.
   */
  static async logAudit(
    result: GuardianResult,
    inputLength: number,
    outputLength: number,
    options: GuardianOptions,
  ): Promise<void> {
    try {
      const { createServiceRoleClient } = await import('./supabase-server');
      const supabase = createServiceRoleClient();
      await supabase.from('guardian_audit_log').insert({
        organization_id: options.orgId ?? null,
        called_by: options.callerName ?? 'unknown',
        categories_detected: result.categoriesDetected,
        category_counts: result.counts,
        input_length: inputLength,
        output_length: outputLength,
      });
    } catch {
      // swallowed — audit is best-effort
    }
  }

  /**
   * Stats for the Privacy Shield badge / admin dashboard.
   */
  static async getStats(orgId: string): Promise<{
    totalCalls: number;
    totalTokensMasked: number;
    byCategory: Record<string, number>;
  }> {
    const { createServiceRoleClient } = await import('./supabase-server');
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from('guardian_audit_log')
      .select('category_counts')
      .eq('organization_id', orgId);

    const byCategory: Record<string, number> = {};
    let totalTokensMasked = 0;
    for (const row of data ?? []) {
      const counts = (row.category_counts ?? {}) as Record<string, number>;
      for (const [cat, n] of Object.entries(counts)) {
        byCategory[cat] = (byCategory[cat] ?? 0) + n;
        totalTokensMasked += n;
      }
    }
    return { totalCalls: data?.length ?? 0, totalTokensMasked, byCategory };
  }

  // ─── Backwards-compat for existing callers ────────────────────────────

  /**
   * @deprecated Use scrub() instead. Kept for backwards compatibility with
   * any code that imported the old Guardian API.
   */
  static scanAndScrub(text: string): {
    isClean: boolean;
    sanitizedText: string;
    blockedCategories: string[];
  } {
    const result = this.scrub(text);
    return {
      isClean: result.isClean,
      sanitizedText: result.sanitised,
      blockedCategories: result.categoriesDetected,
    };
  }

  /**
   * @deprecated Use scrub() on the serialised payload, or restructure to
   * call scrub() on individual string fields. Kept for backwards compat.
   */
  static maskIdentityPayload(payload: unknown, _salt: string = 'system_default'): unknown {
    if (!payload) return payload;

    if (Array.isArray(payload)) {
      return payload.map((item) => this.maskIdentityPayload(item, _salt));
    }

    if (typeof payload === 'object') {
      const masked = { ...(payload as Record<string, unknown>) };

      for (const key of ['email', 'contact_number', 'address', 'avatar', 'dob', 'home_address', 'upn']) {
        if (masked[key] !== undefined) {
          masked[key] = `[GUARDIAN_MASKED_${key.toUpperCase()}]`;
        }
      }

      if (masked.first_name || masked.last_name || masked.name) {
        const identifier = `${masked.first_name || ''}${masked.last_name || ''}${masked.name || ''}`;
        let hash = 0;
        for (let i = 0; i < identifier.length; i++) {
          hash = (Math.imul(31, hash) + identifier.charCodeAt(i)) | 0;
        }
        const token = `ID_${Math.abs(hash).toString(16).padEnd(6, '0')}`;
        masked.identity_token = token;
        delete masked.first_name;
        delete masked.last_name;
        delete masked.name;
        delete masked.full_name;
      }

      for (const key of Object.keys(masked)) {
        if (typeof masked[key] === 'object' && masked[key] !== null) {
          masked[key] = this.maskIdentityPayload(masked[key], _salt);
        }
      }

      return masked;
    }

    return payload;
  }
}
