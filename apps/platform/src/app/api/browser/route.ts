/**
 * Browser Automation API
 *
 * Provides endpoints for Ed's browser automation capabilities:
 * - POST /api/browser - Dispatch to action handlers (createSession, navigate, fill, click, etc.)
 * - GET /api/browser?sessionId=xxx - Get session status
 * - DELETE /api/browser - Close a session
 *
 * All endpoints require authentication and domain approval verification.
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { getBrowserService } from "@/lib/browser-service";
import { getGuardrails } from "@/lib/guardrails";
import type {
  BrowserAction,
  SensitiveFieldWarning,
  ApprovalPrompt,
} from "@/lib/guardrails";

// ============================================================================
// TYPES
// ============================================================================

interface CreateSessionRequest {
  url: string;
  durationSeconds?: number;
}

interface NavigateRequest {
  sessionId: string;
  url: string;
}

interface SnapshotRequest {
  sessionId: string;
  options?: {
    interactive?: boolean;
    compact?: boolean;
    depth?: number;
    selector?: string;
  };
}

interface FillRequest {
  sessionId: string;
  ref: string;
  value: string;
}

interface ClickRequest {
  sessionId: string;
  ref: string;
}

interface SubmitRequest {
  sessionId: string;
  formRef: string;
}

interface ScreenshotRequest {
  sessionId: string;
  options?: {
    full?: boolean;
    format?: "png" | "jpeg";
    quality?: number;
  };
}

interface CloseSessionRequest {
  sessionId: string;
}

// ============================================================================
// MAIN API ROUTE
// ============================================================================

/**
 * POST /api/browser
 *
 * Route handler that dispatches to specific actions based on request body
 */
export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const { action } = body;
  const organizationId = auth.organizationId;

  // Dispatch to specific action handler
  switch (action) {
    case "createSession":
      return handleCreateSession(body, auth.userId, organizationId);

    case "navigate":
      return handleNavigate(body, auth.userId, organizationId);

    case "snapshot":
      return handleSnapshot(body, auth.userId);

    case "fill":
      return handleFill(body, auth.userId);

    case "click":
      return handleClick(body, auth.userId);

    case "submit":
      return handleSubmit(body, auth.userId, organizationId);

    case "screenshot":
      return handleScreenshot(body, auth.userId);

    case "checkDomain":
      return handleCheckDomain(body, organizationId);

    case "getApprovalPrompt":
      return handleGetApprovalPrompt(body, auth.userId, organizationId);

    default:
      return apiError(`Unknown action: ${action}`, 400);
  }
});

/**
 * DELETE /api/browser
 *
 * Close a browser session
 */
export const DELETE = protectedRoute(async (auth, request) => {
  const body: CloseSessionRequest = await request.json();

  const browserService = getBrowserService();
  await browserService.close(body.sessionId);

  return apiSuccess({ success: true });
});

/**
 * GET /api/browser?sessionId=xxx
 *
 * Get session status
 */
export const GET = protectedRoute(async (auth, request) => {
  const searchParams = new URL(request.url).searchParams;
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return apiError("Session ID is required", 400);
  }

  const browserService = getBrowserService();
  const session = await browserService.getSession(sessionId);

  // Verify user owns this session
  if (session.user_id !== auth.userId) {
    return apiError("You do not have access to this session", 403);
  }

  return apiSuccess({
    session: {
      id: session.id,
      status: session.status,
      currentUrl: session.current_url,
      startedAt: session.started_at,
      expiresAt: session.expires_at,
    },
  });
});

// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Create a new browser session
 */
async function handleCreateSession(
  body: CreateSessionRequest,
  userId: string,
  organizationId: string,
) {
  const { url, durationSeconds } = body;

  if (!url) {
    return apiError("URL is required", 400);
  }

  const browserService = getBrowserService();
  const sessionId = await browserService.createSession(
    userId,
    organizationId,
    url,
    durationSeconds,
  );

  return apiSuccess({
    sessionId,
    url,
    expiresAt: new Date(
      Date.now() + (durationSeconds || 1800) * 1000,
    ).toISOString(),
  });
}

/**
 * Navigate to a URL within a session
 */
async function handleNavigate(
  body: NavigateRequest,
  userId: string,
  organizationId: string,
) {
  const { sessionId, url } = body;

  if (!sessionId || !url) {
    return apiError("Session ID and URL are required", 400);
  }

  // Verify domain is approved
  const guardrails = getGuardrails();
  const domainApproval = await guardrails.isDomainApproved(url, organizationId);

  if (!domainApproval.isApproved) {
    return apiError("Domain is not approved for this organization", 403);
  }

  const browserService = getBrowserService();
  const snapshot = await browserService.navigate(sessionId, url);

  return apiSuccess({ snapshot });
}

/**
 * Get a page snapshot with element refs
 */
async function handleSnapshot(body: SnapshotRequest, userId: string) {
  const { sessionId, options = {} } = body;

  if (!sessionId) {
    return apiError("Session ID is required", 400);
  }

  const browserService = getBrowserService();
  const snapshot = await browserService.getSnapshot(sessionId, options);

  return apiSuccess({ snapshot });
}

/**
 * Fill a form field
 */
async function handleFill(body: FillRequest, userId: string) {
  const { sessionId, ref, value } = body;

  if (!sessionId || !ref || value === undefined) {
    return apiError("Session ID, ref, and value are required", 400);
  }

  const browserService = getBrowserService();
  await browserService.fill(sessionId, ref, value);

  return apiSuccess({ message: "Field filled successfully" });
}

/**
 * Click an element
 */
async function handleClick(body: ClickRequest, userId: string) {
  const { sessionId, ref } = body;

  if (!sessionId || !ref) {
    return apiError("Session ID and ref are required", 400);
  }

  const browserService = getBrowserService();
  await browserService.click(sessionId, ref);

  return apiSuccess({ message: "Element clicked successfully" });
}

/**
 * Submit a form (requires approval)
 */
async function handleSubmit(
  body: SubmitRequest,
  userId: string,
  organizationId: string,
) {
  const { sessionId, formRef } = body;

  if (!sessionId || !formRef) {
    return apiError("Session ID and form ref are required", 400);
  }

  const browserService = getBrowserService();
  const result = await browserService.submit(sessionId, formRef);

  return apiSuccess({
    success: result.success,
    message: result.message,
    screenshotUrl: result.screenshotUrl,
    errors: result.errors,
  });
}

/**
 * Capture a screenshot
 */
async function handleScreenshot(body: ScreenshotRequest, userId: string) {
  const { sessionId, options = {} } = body;

  if (!sessionId) {
    return apiError("Session ID is required", 400);
  }

  const browserService = getBrowserService();
  const screenshotPath = await browserService.screenshot(sessionId, options);

  return apiSuccess({ screenshotPath });
}

/**
 * Check if a domain is approved
 */
async function handleCheckDomain(
  body: { url: string },
  organizationId: string,
) {
  const { url } = body;

  if (!url) {
    return apiError("URL is required", 400);
  }

  const guardrails = getGuardrails();
  const approval = await guardrails.isDomainApproved(url, organizationId);

  return apiSuccess({ ...approval, url });
}

/**
 * Generate an approval prompt for an action
 */
async function handleGetApprovalPrompt(
  body: { action: BrowserAction },
  userId: string,
  organizationId: string,
) {
  const { action } = body;

  if (!action) {
    return apiError("Action is required", 400);
  }

  const guardrails = getGuardrails();
  const prompt = await guardrails.generateApprovalPrompt(action);

  return apiSuccess({ prompt });
}
