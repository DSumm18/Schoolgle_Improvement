/**
 * Guardrails Middleware - Enforce safety rules and approval requirements
 *
 * This middleware provides security controls for browser automation:
 * - Domain allowlist enforcement
 * - Sensitive field detection (passwords, payment, personal data)
 * - Action approval requirements
 * - Form data validation
 * - Path restrictions (allowed/denied paths)
 */

import { createClient } from "@supabase/supabase-js";
import type { SnapshotElement } from "./browser-service";

// ============================================================================
// TYPES
// ============================================================================

export type BrowserActionType =
  | "navigate"
  | "fill"
  | "click"
  | "submit"
  | "screenshot"
  | "close";

export interface BrowserAction {
  type: BrowserActionType;
  sessionId: string;
  targetRef?: string;
  targetUrl?: string;
  inputValue?: string;
  userId: string;
  organizationId: string;
}

export interface SensitiveFieldWarning {
  field: string;
  label: string;
  type: SensitiveFieldType;
  action: "manual_entry" | "approve_required" | "blocked";
  reason: string;
}

export type SensitiveFieldType =
  | "password"
  | "payment"
  | "personal"
  | "medical"
  | "financial";

export interface SafetyValidationResult {
  isSafe: boolean;
  warnings: SensitiveFieldWarning[];
  blockedFields: string[];
  requiresApproval: boolean;
}

export interface ApprovalPrompt {
  title: string;
  description: string;
  details: Record<string, any>;
  riskLevel: "low" | "medium" | "high";
  actions: {
    approve: { label: string; variant: "primary" | "danger" };
    deny: { label: string; variant: "secondary" };
    edit?: { label: string };
  };
}

export interface DomainApproval {
  isApproved: boolean;
  domainId?: string;
  requiresAuth: boolean;
  authMethod?: string;
  maxSessionDuration: number;
  allowedPaths: string[];
  deniedPaths: string[];
}

export interface FormField {
  ref: string;
  name: string;
  role: string;
  type?: string;
  required?: boolean;
}

export interface FormSchema {
  fields: FormField[];
  action: string;
  method: string;
}

// ============================================================================
// GUARDRAILS MIDDLEWARE CLASS
// ============================================================================

class GuardrailsMiddleware {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ==========================================================================
  // DOMAIN APPROVAL
  // ==========================================================================

  /**
   * Check if a domain is approved for the organization
   *
   * @param url - The URL to check
   * @param organizationId - The organization's UUID
   * @returns Domain approval details
   */
  async isDomainApproved(
    url: string,
    organizationId: string,
  ): Promise<DomainApproval> {
    // Extract domain from URL
    const domain = this.extractDomain(url);
    const path = this.extractPath(url);

    // Query approved domains
    const { data, error } = await this.supabase
      .from("browser_approved_domains")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("domain", domain)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      return {
        isApproved: false,
        requiresAuth: false,
        maxSessionDuration: 0,
        allowedPaths: [],
        deniedPaths: [],
      };
    }

    const row = data as any;

    // Check path restrictions
    const isPathAllowed = this.checkPathAllowed(
      path,
      row.allowed_paths,
      row.denied_paths,
    );

    return {
      isApproved: isPathAllowed,
      domainId: row.id,
      requiresAuth: row.requires_auth,
      authMethod: row.auth_method || undefined,
      maxSessionDuration: row.max_session_duration,
      allowedPaths: row.allowed_paths,
      deniedPaths: row.denied_paths,
    };
  }

  /**
   * Check if a path is allowed based on allowed/denied patterns
   */
  private checkPathAllowed(
    path: string,
    allowedPaths: string[],
    deniedPaths: string[],
  ): boolean {
    // Check denied paths first (these take precedence)
    for (const pattern of deniedPaths) {
      if (this.matchPattern(path, pattern)) {
        return false;
      }
    }

    // If no allowed paths specified, allow all (except denied)
    if (allowedPaths.length === 0 || allowedPaths[0] === "/**") {
      return true;
    }

    // Check if path matches any allowed pattern
    for (const pattern of allowedPaths) {
      if (this.matchPattern(path, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Match a path against a glob pattern
   */
  private matchPattern(path: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  // ==========================================================================
  // ACTION APPROVAL
  // ==========================================================================

  /**
   * Check if an action requires user approval
   *
   * @param action - The browser action to check
   * @returns Whether approval is required
   */
  async requiresApproval(action: BrowserAction): Promise<boolean> {
    // Navigate actions don't require approval (domain check is done separately)
    if (action.type === "navigate") {
      return false;
    }

    // Screenshot actions don't require approval
    if (action.type === "screenshot") {
      return false;
    }

    // Close actions don't require approval
    if (action.type === "close") {
      return false;
    }

    // Fill, click, and submit actions may require approval based on context
    // For now, be conservative and require approval for submit
    if (action.type === "submit") {
      return true;
    }

    // Check if organization has strict approval enabled
    const { data: orgSettings } = await this.supabase
      .from("organizations")
      .select("require_browser_approval")
      .eq("id", action.organizationId)
      .single();

    return (orgSettings as any)?.require_browser_approval || false;
  }

  /**
   * Generate an approval prompt for the user
   *
   * @param action - The browser action requiring approval
   * @returns Approval prompt details
   */
  async generateApprovalPrompt(action: BrowserAction): Promise<ApprovalPrompt> {
    const domainApproval = action.targetUrl
      ? await this.isDomainApproved(action.targetUrl, action.organizationId)
      : null;

    let title = "Confirm Action";
    let description = "Ed is about to perform an action.";
    let riskLevel: "low" | "medium" | "high" = "low";
    let details: Record<string, any> = {
      action: action.type,
    };

    switch (action.type) {
      case "submit":
        title = "Confirm Form Submission";
        description =
          "Ed has completed filling the form. Please review the details before submitting.";
        riskLevel = "medium";
        details.domain = domainApproval
          ? this.extractDomain(action.targetUrl!)
          : "Unknown";
        break;

      case "fill":
        title = "Confirm Form Entry";
        description = `Ed wants to enter information into a form field.`;
        riskLevel = "low";
        details.field = action.targetRef;
        break;

      case "click":
        title = "Confirm Click";
        description = `Ed wants to click on an element.`;
        riskLevel = "low";
        details.element = action.targetRef;
        break;

      case "navigate":
        title = "Confirm Navigation";
        description = `Ed wants to navigate to a new page.`;
        riskLevel = "low";
        details.url = action.targetUrl;
        break;
    }

    return {
      title,
      description,
      details,
      riskLevel,
      actions: {
        approve: {
          label:
            (riskLevel as string) === "high"
              ? "I understand, proceed"
              : "Approve",
          variant: (riskLevel as string) === "high" ? "danger" : "primary",
        },
        deny: {
          label: "Cancel",
          variant: "secondary",
        },
      },
    };
  }

  // ==========================================================================
  // SENSITIVE FIELD DETECTION
  // ==========================================================================

  /**
   * Check form schema for sensitive fields that require special handling
   *
   * @param formSchema - The form schema to check
   * @returns List of sensitive field warnings
   */
  checkSensitiveFields(formSchema: FormSchema): SensitiveFieldWarning[] {
    const warnings: SensitiveFieldWarning[] = [];

    for (const field of formSchema.fields) {
      const warning = this.detectSensitiveField(field);
      if (warning) {
        warnings.push(warning);
      }
    }

    return warnings;
  }

  /**
   * Detect if a single field is sensitive
   */
  private detectSensitiveField(field: FormField): SensitiveFieldWarning | null {
    const fieldType = this.getFieldType(field);
    const fieldName = field.name.toLowerCase();
    const fieldId = (field.ref || "").toLowerCase();

    // Password fields
    if (
      fieldType === "password" ||
      fieldName.includes("password") ||
      fieldId.includes("password") ||
      fieldName.includes("pass") ||
      fieldId.includes("pass")
    ) {
      return {
        field: field.ref,
        label: field.name,
        type: "password",
        action: "blocked",
        reason: "Password fields cannot be auto-filled for security reasons",
      };
    }

    // Payment fields (credit card, cvv, etc.)
    if (
      fieldName.includes("credit") ||
      fieldName.includes("card") ||
      fieldName.includes("cvv") ||
      fieldName.includes("cvc") ||
      fieldName.includes("expiry") ||
      fieldId.includes("card") ||
      fieldId.includes("cvv")
    ) {
      return {
        field: field.ref,
        label: field.name,
        type: "payment",
        action: "blocked",
        reason: "Payment information cannot be auto-filled",
      };
    }

    // Bank account fields
    if (
      fieldName.includes("bank") ||
      fieldName.includes("account") ||
      fieldName.includes("sort") ||
      fieldName.includes("iban") ||
      fieldName.includes("bic") ||
      fieldId.includes("bank") ||
      fieldId.includes("account")
    ) {
      return {
        field: field.ref,
        label: field.name,
        type: "financial",
        action: "blocked",
        reason: "Bank account information cannot be auto-filled",
      };
    }

    // National Insurance / SSN
    if (
      fieldName.includes("national insurance") ||
      fieldName.includes("nino") ||
      fieldName.includes("ssn") ||
      fieldName.includes("social security") ||
      fieldId.includes("nino") ||
      fieldId.includes("ssn")
    ) {
      return {
        field: field.ref,
        label: field.name,
        type: "personal",
        action: "approve_required",
        reason: "Sensitive personal identifier - requires manual confirmation",
      };
    }

    // Medical information
    if (
      fieldName.includes("medical") ||
      fieldName.includes("health") ||
      fieldName.includes("doctor") ||
      fieldName.includes("medication") ||
      fieldName.includes("condition")
    ) {
      return {
        field: field.ref,
        label: field.name,
        type: "medical",
        action: "approve_required",
        reason: "Medical information - requires confirmation",
      };
    }

    return null;
  }

  /**
   * Get the input type from a field element
   */
  private getFieldType(field: FormField): string {
    return field.type || field.role || "text";
  }

  // ==========================================================================
  // FORM DATA VALIDATION
  // ==========================================================================

  /**
   * Validate form data against safety rules
   *
   * @param formSchema - The form schema
   * @param data - The form data to validate
   * @returns Safety validation result
   */
  async validateFormData(
    formSchema: FormSchema,
    data: Record<string, string>,
  ): Promise<SafetyValidationResult> {
    const warnings: SensitiveFieldWarning[] = [];
    const blockedFields: string[] = [];
    let requiresApproval = false;

    // Check for sensitive fields
    const sensitiveWarnings = this.checkSensitiveFields(formSchema);
    warnings.push(...sensitiveWarnings);

    // Check each data value for potential issues
    for (const [key, value] of Object.entries(data)) {
      // Check for credit card numbers
      if (this.looksLikeCreditCard(value)) {
        blockedFields.push(key);
      }

      // Check for passwords in value (shouldn't happen, but check anyway)
      if (key.toLowerCase().includes("password") && value) {
        blockedFields.push(key);
      }
    }

    // Determine if approval is required
    if (warnings.some((w) => w.action === "approve_required")) {
      requiresApproval = true;
    }

    return {
      isSafe: blockedFields.length === 0,
      warnings,
      blockedFields,
      requiresApproval,
    };
  }

  /**
   * Check if a string looks like a credit card number
   */
  private looksLikeCreditCard(value: string): boolean {
    const digitsOnly = value.replace(/\s/g, "").replace(/-/g, "");
    return /^\d{13,19}$/.test(digitsOnly);
  }

  // ==========================================================================
  // URL UTILITIES
  // ==========================================================================

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return "";
    }
  }

  /**
   * Extract path from URL
   */
  private extractPath(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return "/";
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let guardrailsInstance: GuardrailsMiddleware | null = null;

export function getGuardrails(): GuardrailsMiddleware {
  if (!guardrailsInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    guardrailsInstance = new GuardrailsMiddleware(supabaseUrl, supabaseKey);
  }

  return guardrailsInstance;
}

export default GuardrailsMiddleware;
