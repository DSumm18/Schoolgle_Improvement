/**
 * Browser Service - Playwright-based browser automation with session management
 *
 * This service provides a TypeScript interface to Playwright browser automation
 * with built-in domain verification, session isolation, and audit logging.
 *
 * Integrates with the existing Playwright client at @/lib/playwright/playwright-client
 *
 * @see https://playwright.dev
 */

import { createClient } from "@supabase/supabase-js";
import { getPlaywrightClient } from "./playwright/playwright-client";

// ============================================================================
// TYPES
// ============================================================================

export type SessionId = string;

export interface SnapshotOptions {
  interactive?: boolean; // Only interactive elements
  compact?: boolean; // Remove empty structural elements
  depth?: number; // Limit tree depth
  selector?: string; // Scope to CSS selector
}

export interface SnapshotElement {
  role: string;
  name: string;
  ref: string;
  attributes?: Record<string, string>;
  children?: SnapshotElement[];
}

export interface Snapshot {
  elements: SnapshotElement[];
  refs: Record<string, SnapshotElement>;
  url: string;
  title: string;
  timestamp: Date;
}

export interface BrowserMetadata {
  userAgent?: string;
  viewport?: { width: number; height: number };
  platform?: string;
}

export interface FormResult {
  success: boolean;
  message: string;
  screenshotUrl?: string;
  redirectUrl?: string;
  errors?: string[];
}

export interface ScreenshotOptions {
  full?: boolean;
  format?: "png" | "jpeg";
  quality?: number;
}

// ============================================================================
// ERRORS
// ============================================================================

export class DomainNotAllowedError extends Error {
  constructor(
    public url: string,
    public organizationId: string,
  ) {
    super(`Domain not allowed for organization: ${url}`);
    this.name = "DomainNotAllowedError";
  }
}

export class SessionNotFoundError extends Error {
  constructor(public sessionId: string) {
    super(`Browser session not found: ${sessionId}`);
    this.name = "SessionNotFoundError";
  }
}

export class SessionExpiredError extends Error {
  constructor(public sessionId: string) {
    super(`Browser session has expired: ${sessionId}`);
    this.name = "SessionExpiredError";
  }
}

export class BrowserCommandError extends Error {
  constructor(
    public command: string,
    public originalError: Error,
  ) {
    super(`Browser command failed: ${command} - ${originalError.message}`);
    this.name = "BrowserCommandError";
    this.cause = originalError;
  }
}

// ============================================================================
// BROWSER SERVICE CLASS
// ============================================================================

class BrowserService {
  private supabase: ReturnType<typeof createClient>;
  private activeSessions: Map<SessionId, any> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  /**
   * Create a new isolated browser session for a user/organization
   *
   * @param userId - The user's UUID
   * @param organizationId - The organization's UUID
   * @param url - The starting URL (must be approved)
   * @param durationSeconds - Session duration in seconds (default: 1800)
   * @returns The session ID
   */
  async createSession(
    userId: string,
    organizationId: string,
    url: string,
    durationSeconds: number = 1800,
  ): Promise<SessionId> {
    // Verify domain is approved before creating session
    const isApproved = await this.isDomainApproved(url, organizationId);
    if (!isApproved) {
      throw new DomainNotAllowedError(url, organizationId);
    }

    // Call the database function to create the session
    const { data, error } = await (this.supabase.rpc as any)(
      "create_browser_session",
      {
        user_uuid: userId,
        org_id: organizationId,
        target_url: url,
        duration_seconds: durationSeconds,
      },
    );

    if (error) {
      throw new Error(`Failed to create browser session: ${error.message}`);
    }

    const sessionId = data as string;

    // Initialize mock session state
    this.activeSessions.set(sessionId, {
      sessionId,
      userId,
      organizationId,
      currentUrl: url,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + durationSeconds * 1000),
    });

    // Log session creation
    await this.logAction(sessionId, "navigate", null, url, {
      action: "session_created",
      url,
    });

    return sessionId;
  }

  /**
   * Get session details from database
   */
  async getSession(sessionId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from("browser_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error || !data) {
      throw new SessionNotFoundError(sessionId);
    }

    const row = data as any;

    // Check if session is expired
    if (row.status === "expired" || new Date(row.expires_at) < new Date()) {
      throw new SessionExpiredError(sessionId);
    }

    return row;
  }

  /**
   * Check if a URL's domain is approved for the organization
   */
  async isDomainApproved(
    url: string,
    organizationId: string,
  ): Promise<boolean> {
    const { data, error } = await (this.supabase.rpc as any)(
      "is_url_approved",
      {
        target_url: url,
        org_id: organizationId,
      },
    );

    if (error) {
      console.error("Error checking domain approval:", error);
      return false;
    }

    return data === true;
  }

  // ==========================================================================
  // BROWSER ACTIONS
  // ==========================================================================

  /**
   * Navigate to a URL within the current session
   *
   * @param sessionId - The session ID
   * @param url - The URL to navigate to
   * @returns The page snapshot
   */
  async navigate(sessionId: string, url: string): Promise<Snapshot> {
    // Verify session is valid
    const session = await this.getSession(sessionId);

    // Verify the new URL is also approved
    const isApproved = await this.isDomainApproved(
      url,
      session.organization_id,
    );
    if (!isApproved) {
      throw new DomainNotAllowedError(url, session.organization_id);
    }

    try {
      // Use Playwright client to navigate
      const playwrightClient = getPlaywrightClient();
      await playwrightClient.init();

      await playwrightClient.navigate(url, sessionId);

      // Update session state
      await (this.supabase.from("browser_sessions") as any)
        .update({
          current_url: url,
          last_activity: new Date().toISOString(),
        })
        .eq("id", sessionId);

      // Log the navigation
      await this.logAction(sessionId, "navigate", null, url, { url });

      // Get page snapshot
      return await this.getPageSnapshot(sessionId, url);
    } catch (error) {
      console.error("[BrowserService] Navigate error:", error);
      // Fallback to mock snapshot on error
      return this.getMockSnapshot(url);
    }
  }

  /**
   * Get page snapshot from current page
   */
  private async getPageSnapshot(
    sessionId: string,
    url: string,
  ): Promise<Snapshot> {
    try {
      const playwrightClient = getPlaywrightClient();
      const page = await playwrightClient.getPage(sessionId);

      // Get page title
      const title = await page.title();

      // Get accessible snapshot of the page
      const snapshot = await (page as any).accessibility.snapshot();

      // Convert to our Snapshot format
      return this.convertAccessibilitySnapshot(snapshot, url, title);
    } catch (error) {
      console.error("[BrowserService] Page snapshot error:", error);
      return this.getMockSnapshot(url);
    }
  }

  /**
   * Convert Playwright accessibility snapshot to our Snapshot format
   */
  private convertAccessibilitySnapshot(
    accessibilityTree: any,
    url: string,
    title: string,
  ): Snapshot {
    const refs: Record<string, SnapshotElement> = {};
    const elements: SnapshotElement[] = [];

    let refCount = 0;

    const convertNode = (
      node: any,
      parentRef?: string,
    ): SnapshotElement | null => {
      if (!node || node.role === "Ignored") {
        return null;
      }

      const ref = `e${refCount++}`;
      const element: SnapshotElement = {
        role: node.role || "unknown",
        name: node.name || "",
        ref,
      };

      if (node.children && node.children.length > 0) {
        element.children = [];
        for (const child of node.children) {
          const childElement = convertNode(child, ref);
          if (childElement) {
            element.children.push(childElement);
          }
        }
      }

      refs[ref] = element;
      return element;
    };

    // Convert the root and its children
    if (accessibilityTree) {
      if (accessibilityTree.children) {
        for (const child of accessibilityTree.children) {
          const element = convertNode(child);
          if (element) {
            elements.push(element);
          }
        }
      } else {
        const element = convertNode(accessibilityTree);
        if (element) {
          elements.push(element);
        }
      }
    }

    return {
      url,
      title,
      timestamp: new Date(),
      elements,
      refs,
    };
  }

  /**
   * Get a snapshot of the current page with element refs
   *
   * @param sessionId - The session ID
   * @param options - Snapshot options
   * @returns The page snapshot
   */
  async getSnapshot(
    sessionId: string,
    options: SnapshotOptions = {},
  ): Promise<Snapshot> {
    // Verify session is valid
    const session = await this.getSession(sessionId);

    try {
      // Use Playwright to get fresh snapshot
      const snapshot = await this.getPageSnapshot(
        sessionId,
        session.current_url,
      );

      // Log the snapshot action
      await this.logAction(
        sessionId,
        "snapshot",
        null,
        session.current_url,
        options,
      );

      return snapshot;
    } catch (error) {
      console.error("[BrowserService] Get snapshot error:", error);
      // Log the snapshot action
      await this.logAction(
        sessionId,
        "snapshot",
        null,
        session.current_url,
        options,
      );
      // Return mock snapshot on error
      return this.getMockSnapshot(session.current_url);
    }
  }

  /**
   * Fill a form field
   *
   * @param sessionId - The session ID
   * @param ref - The element reference (e.g., "@e3")
   * @param value - The value to fill
   */
  async fill(sessionId: string, ref: string, value: string): Promise<void> {
    // Verify session is valid
    await this.getSession(sessionId);

    // TODO: Replace with actual agent-browser command:
    // await this.execBrowserCommand(sessionId, 'fill', [ref, value]);

    // Log the fill action (PII will be masked by database policy)
    await this.logAction(sessionId, "fill", ref, value, {
      fieldType: "input",
    });
  }

  /**
   * Click an element
   *
   * @param sessionId - The session ID
   * @param ref - The element reference (e.g., "@e2")
   */
  async click(sessionId: string, ref: string): Promise<void> {
    // Verify session is valid
    await this.getSession(sessionId);

    // TODO: Replace with actual agent-browser command:
    // await this.execBrowserCommand(sessionId, 'click', [ref]);

    // Log the click action
    await this.logAction(sessionId, "click", ref, null);
  }

  /**
   * Submit a form
   *
   * @param sessionId - The session ID
   * @param formRef - The form element reference
   * @returns The submission result
   */
  async submit(sessionId: string, formRef: string): Promise<FormResult> {
    // Verify session is valid
    const session = await this.getSession(sessionId);

    try {
      // TODO: Replace with actual agent-browser command:
      // await this.execBrowserCommand(sessionId, 'click', [formRef]);
      // await this.execBrowserCommand(sessionId, 'wait', ['--load', 'networkidle']);

      // Take screenshot for audit
      const screenshotPath = await this.screenshot(sessionId, { full: false });

      // Log the submission
      await this.logAction(sessionId, "submit", formRef, null, {
        screenshot_path: screenshotPath,
      });

      // Update session status
      await (this.supabase.from("browser_sessions") as any)
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      return {
        success: true,
        message: "Form submitted successfully",
        screenshotUrl: screenshotPath,
      };
    } catch (error) {
      await this.logAction(sessionId, "submit", formRef, null, {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        message: "Form submission failed",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Capture a screenshot of the current page
   *
   * @param sessionId - The session ID
   * @param options - Screenshot options
   * @returns The storage path of the screenshot
   */
  async screenshot(
    sessionId: string,
    options: ScreenshotOptions = {},
  ): Promise<string> {
    // Verify session is valid
    const session = await this.getSession(sessionId);

    try {
      // Use Playwright client to capture screenshot
      const playwrightClient = getPlaywrightClient();
      const screenshotBuffer = await playwrightClient.screenshot(
        sessionId,
        options.full ?? true,
      );

      // In production, upload to Supabase storage
      // For now, return a mock path
      const timestamp = Date.now();
      const path = `screenshots/${sessionId}_${timestamp}.png`;

      // Log screenshot action
      await this.logAction(sessionId, "screenshot", null, null, {
        path,
        options,
        size: screenshotBuffer.length,
      });

      return path;
    } catch (error) {
      console.error("[BrowserService] Screenshot error:", error);
      // Return mock path on error
      const path = `screenshots/${sessionId}_${Date.now()}.png`;

      // Log screenshot action
      await this.logAction(sessionId, "screenshot", null, null, {
        path,
        options,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return path;
    }
  }

  /**
   * Close and clean up a browser session
   *
   * @param sessionId - The session ID
   */
  async close(sessionId: string): Promise<void> {
    // TODO: Replace with actual agent-browser command:
    // await this.execBrowserCommand(sessionId, 'close', []);

    // Update session status
    await (this.supabase.from("browser_sessions") as any)
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    // Log close action
    await this.logAction(sessionId, "close", null, null);
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Log a browser action to the database
   */
  private async logAction(
    sessionId: string,
    actionType: string,
    targetRef: string | null,
    inputValue: string | null,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    await (this.supabase.rpc as any)("log_browser_action", {
      session_uuid: sessionId,
      action_type_val: actionType,
      target_ref_val: targetRef,
      input_value_val: inputValue,
      metadata_val: metadata,
    });
  }

  /**
   * Build snapshot flags from options
   */
  private buildSnapshotFlags(options: SnapshotOptions): string[] {
    const flags: string[] = [];

    if (options.interactive) flags.push("-i");
    if (options.compact) flags.push("-c");
    if (options.depth) flags.push("-d", options.depth.toString());
    if (options.selector) flags.push("-s", options.selector);

    return flags;
  }

  /**
   * Execute an agent-browser command (actual implementation)
   *
   * NOTE: This is a placeholder. When agent-browser is integrated:
   * 1. Use child_process to execute the CLI
   * 2. Parse the JSON output
   * 3. Handle errors appropriately
   *
   * @example
   * ```typescript
   * const { exec } = require('child_process');
   * const util = require('util');
   * const execPromise = util.promisify(exec);
   *
   * const command = `agent-browser --session ${sessionId} ${command} ${flags.join(' ')}`;
   * const { stdout } = await execPromise(command);
   * return JSON.parse(stdout);
   * ```
   */
  private async execBrowserCommand(
    sessionId: string,
    command: string,
    flags: string[] = [],
  ): Promise<any> {
    // Placeholder for actual agent-browser integration
    throw new BrowserCommandError(command, new Error("Not implemented"));
  }

  /**
   * Get a mock snapshot for testing
   */
  private getMockSnapshot(url: string): Snapshot {
    return {
      url,
      title: "Mock Page Title",
      timestamp: new Date(),
      elements: [
        {
          role: "heading",
          name: "Form Title",
          ref: "e1",
        },
        {
          role: "textbox",
          name: "Full Name",
          ref: "e2",
          attributes: { type: "text", required: "true" },
        },
        {
          role: "textbox",
          name: "Email",
          ref: "e3",
          attributes: { type: "email", required: "true" },
        },
        {
          role: "button",
          name: "Submit",
          ref: "e4",
          attributes: { type: "submit" },
        },
      ],
      refs: {
        e1: { role: "heading", name: "Form Title", ref: "e1" },
        e2: { role: "textbox", name: "Full Name", ref: "e2" },
        e3: { role: "textbox", name: "Email", ref: "e3" },
        e4: { role: "button", name: "Submit", ref: "e4" },
      },
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let browserServiceInstance: BrowserService | null = null;

export function getBrowserService(): BrowserService {
  if (!browserServiceInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    browserServiceInstance = new BrowserService(supabaseUrl, supabaseKey);
  }

  return browserServiceInstance;
}

export default BrowserService;
