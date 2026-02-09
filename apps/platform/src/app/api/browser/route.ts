/**
 * Browser Automation API
 *
 * Provides endpoints for Ed's browser automation capabilities:
 * - POST /api/browser/session - Create a new browser session
 * - POST /api/browser/navigate - Navigate to a URL
 * - POST /api/browser/snapshot - Get page snapshot with refs
 * - POST /api/browser/fill - Fill a form field
 * - POST /api/browser/click - Click an element
 * - POST /api/browser/submit - Submit a form
 * - POST /api/browser/screenshot - Capture screenshot
 * - DELETE /api/browser/session - Close a session
 *
 * All endpoints require authentication and domain approval verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getBrowserService } from '@/lib/browser-service';
import { getGuardrails } from '@/lib/guardrails';
import type {
  BrowserAction,
  SensitiveFieldWarning,
  ApprovalPrompt,
} from '@/lib/guardrails';

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
    format?: 'png' | 'jpeg';
    quality?: number;
  };
}

interface CloseSessionRequest {
  sessionId: string;
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Get authenticated user and organization from request
 */
async function getAuthContext(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Get user's organization ID
  // This assumes organization_id is in user metadata or via a join
  // Adjust based on your actual auth structure
  const { data: userData, error: userDataError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (userDataError || !userData) {
    throw new Error('User not associated with an organization');
  }

  return {
    user,
    organizationId: userData.organization_id,
  };
}

/**
 * Handle API errors consistently
 */
function handleError(error: unknown, context: string) {
  console.error(`[Browser API] ${context}:`, error);

  if (error instanceof Error) {
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    if (error.message.includes('Domain not allowed')) {
      return NextResponse.json(
        { error: 'DomainNotAllowed', message: error.message },
        { status: 403 }
      );
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'NotFound', message: error.message },
        { status: 404 }
      );
    }

    if (error.message.includes('expired')) {
      return NextResponse.json(
        { error: 'SessionExpired', message: error.message },
        { status: 410 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Internal Server Error', message: 'An unexpected error occurred' },
    { status: 500 }
  );
}

// ============================================================================
// MAIN API ROUTE
// ============================================================================

/**
 * POST /api/browser
 *
 * Route handler that dispatches to specific actions based on request body
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user context
    const { user, organizationId } = await getAuthContext(request);

    const body = await request.json();
    const { action } = body;

    // Dispatch to specific action handler
    switch (action) {
      case 'createSession':
        return handleCreateSession(body, user.id, organizationId);

      case 'navigate':
        return handleNavigate(body, user.id, organizationId);

      case 'snapshot':
        return handleSnapshot(body, user.id);

      case 'fill':
        return handleFill(body, user.id);

      case 'click':
        return handleClick(body, user.id);

      case 'submit':
        return handleSubmit(body, user.id, organizationId);

      case 'screenshot':
        return handleScreenshot(body, user.id);

      case 'checkDomain':
        return handleCheckDomain(body, organizationId);

      case 'getApprovalPrompt':
        return handleGetApprovalPrompt(body, user.id, organizationId);

      default:
        return NextResponse.json(
          { error: 'Invalid Action', message: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleError(error, 'POST request failed');
  }
}

/**
 * DELETE /api/browser
 *
 * Close a browser session
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getAuthContext(request);
    const body: CloseSessionRequest = await request.json();

    const browserService = getBrowserService();
    await browserService.close(body.sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'DELETE request failed');
  }
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Create a new browser session
 */
async function handleCreateSession(
  body: CreateSessionRequest,
  userId: string,
  organizationId: string
) {
  const { url, durationSeconds } = body;

  if (!url) {
    return NextResponse.json(
      { error: 'Invalid Input', message: 'URL is required' },
      { status: 400 }
    );
  }

  const browserService = getBrowserService();
  const sessionId = await browserService.createSession(
    userId,
    organizationId,
    url,
    durationSeconds
  );

  return NextResponse.json({
    success: true,
    sessionId,
    url,
    expiresAt: new Date(Date.now() + (durationSeconds || 1800) * 1000).toISOString(),
  });
}

/**
 * Navigate to a URL within a session
 */
async function handleNavigate(
  body: NavigateRequest,
  userId: string,
  organizationId: string
) {
  const { sessionId, url } = body;

  if (!sessionId || !url) {
    return NextResponse.json(
      { error: 'Invalid Input', message: 'Session ID and URL are required' },
      { status: 400 }
    );
  }

  // Verify domain is approved
  const guardrails = getGuardrails();
  const domainApproval = await guardrails.isDomainApproved(url, organizationId);

  if (!domainApproval.isApproved) {
    return NextResponse.json(
      {
        error: 'DomainNotAllowed',
        message: `Domain is not approved for this organization`,
        url,
      },
      { status: 403 }
    );
  }

  const browserService = getBrowserService();
  const snapshot = await browserService.navigate(sessionId, url);

  return NextResponse.json({
    success: true,
    snapshot,
  });
}

/**
 * Get a page snapshot with element refs
 */
async function handleSnapshot(body: SnapshotRequest, userId: string) {
  const { sessionId, options = {} } = body;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Invalid Input', message: 'Session ID is required' },
      { status: 400 }
    );
  }

  const browserService = getBrowserService();
  const snapshot = await browserService.getSnapshot(sessionId, options);

  return NextResponse.json({
    success: true,
    snapshot,
  });
}

/**
 * Fill a form field
 */
async function handleFill(body: FillRequest, userId: string) {
  const { sessionId, ref, value } = body;

  if (!sessionId || !ref || value === undefined) {
    return NextResponse.json(
      {
        error: 'Invalid Input',
        message: 'Session ID, ref, and value are required',
      },
      { status: 400 }
    );
  }

  const browserService = getBrowserService();
  await browserService.fill(sessionId, ref, value);

  return NextResponse.json({
    success: true,
    message: 'Field filled successfully',
  });
}

/**
 * Click an element
 */
async function handleClick(body: ClickRequest, userId: string) {
  const { sessionId, ref } = body;

  if (!sessionId || !ref) {
    return NextResponse.json(
      { error: 'Invalid Input', message: 'Session ID and ref are required' },
      { status: 400 }
    );
  }

  const browserService = getBrowserService();
  await browserService.click(sessionId, ref);

  return NextResponse.json({
    success: true,
    message: 'Element clicked successfully',
  });
}

/**
 * Submit a form (requires approval)
 */
async function handleSubmit(
  body: SubmitRequest,
  userId: string,
  organizationId: string
) {
  const { sessionId, formRef } = body;

  if (!sessionId || !formRef) {
    return NextResponse.json(
      { error: 'Invalid Input', message: 'Session ID and form ref are required' },
      { status: 400 }
    );
  }

  const browserService = getBrowserService();
  const result = await browserService.submit(sessionId, formRef);

  return NextResponse.json({
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
    return NextResponse.json(
      { error: 'Invalid Input', message: 'Session ID is required' },
      { status: 400 }
    );
  }

  const browserService = getBrowserService();
  const screenshotPath = await browserService.screenshot(sessionId, options);

  return NextResponse.json({
    success: true,
    screenshotPath,
  });
}

/**
 * Check if a domain is approved
 */
async function handleCheckDomain(body: { url: string }, organizationId: string) {
  const { url } = body;

  if (!url) {
    return NextResponse.json(
      { error: 'Invalid Input', message: 'URL is required' },
      { status: 400 }
    );
  }

  const guardrails = getGuardrails();
  const approval = await guardrails.isDomainApproved(url, organizationId);

  return NextResponse.json({
    ...approval,
    url,
  });
}

/**
 * Generate an approval prompt for an action
 */
async function handleGetApprovalPrompt(
  body: { action: BrowserAction },
  userId: string,
  organizationId: string
) {
  const { action } = body;

  if (!action) {
    return NextResponse.json(
      { error: 'Invalid Input', message: 'Action is required' },
      { status: 400 }
    );
  }

  const guardrails = getGuardrails();
  const prompt = await guardrails.generateApprovalPrompt(action);

  return NextResponse.json({
    success: true,
    prompt,
  });
}

// ============================================================================
// SESSION STATUS ENDPOINT
// ============================================================================

/**
 * GET /api/browser?sessionId=xxx
 *
 * Get session status
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthContext(request);
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Invalid Input', message: 'Session ID is required' },
        { status: 400 }
      );
    }

    const browserService = getBrowserService();
    const session = await browserService.getSession(sessionId);

    // Verify user owns this session
    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have access to this session' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        currentUrl: session.current_url,
        startedAt: session.started_at,
        expiresAt: session.expires_at,
      },
    });
  } catch (error) {
    return handleError(error, 'GET request failed');
  }
}
