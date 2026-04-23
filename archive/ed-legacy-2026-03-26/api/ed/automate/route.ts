/**
 * Automation API - Handles browser automation requests
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AutomationRequest, AutomationResponse } from '@/lib/playwright/types';

export async function POST(req: NextRequest) {
  try {
    const body: AutomationRequest = await req.json();
    const { url, task, screenshot, domSnapshot, sessionId, geminiApiKey } = body;

    if (!url || !task) {
      return NextResponse.json(
        { error: 'URL and task are required' },
        { status: 400 }
      );
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || crypto.randomUUID();

    // Dynamically import Playwright (server-side only)
    const { getPlaywrightClient } = await import('@/lib/playwright/playwright-client');
    const { ActionExecutor } = await import('@/lib/playwright/action-executor');
    const { planActions, validateActions } = await import('@/lib/automation/action-planner');

    // Initialize Playwright client
    const client = getPlaywrightClient();
    await client.init();

    try {
      // Navigate to URL if needed
      const page = await client.getPage(finalSessionId);
      const currentUrl = page.url();
      
      if (currentUrl !== url && !currentUrl.includes(new URL(url).hostname)) {
        await client.navigate(url, finalSessionId);
      }

      // Get screenshot if not provided
      let screenshotBuffer: Buffer;
      if (screenshot) {
        screenshotBuffer = Buffer.from(screenshot, 'base64');
      } else {
        screenshotBuffer = await client.screenshot(finalSessionId);
      }

      // Get DOM snapshot if not provided
      const finalDomSnapshot = domSnapshot || await client.getContent(finalSessionId);

      // Analyze screen first (needs Gemini API key)
      const { analyzeScreen } = await import('@/lib/vision/screen-analyzer');
      const apiKeyForVision = geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKeyForVision) {
        return NextResponse.json(
          {
            success: false,
            error: 'GEMINI_API_KEY required for automation. Set it in extension popup or server .env.local',
            sessionId: finalSessionId,
          },
          { status: 400 }
        );
      }

      // Plan actions - use Gemini API key from request or env
      const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          {
            success: false,
            error: 'GEMINI_API_KEY not provided. Set it in extension popup or server .env.local',
            sessionId: finalSessionId,
          },
          { status: 400 }
        );
      }
      
      const actions = await planActions(
        task,
        screenshotBuffer,
        finalDomSnapshot,
        { apiKey: apiKeyForVision }
      );

      // Validate actions
      const validation = validateActions(actions);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: `Action validation failed: ${validation.errors.join(', ')}`,
            sessionId: finalSessionId,
          },
          { status: 400 }
        );
      }

      // Execute actions (ActionExecutor already imported above)
      const executor = new ActionExecutor();
      const results = await executor.executeActions(actions, {
        sessionId: finalSessionId,
        onProgress: (result) => {
          console.log(`[Automation] Action ${result.action.type}: ${result.success ? 'success' : 'failed'}`);
        },
      });

      // Separate completed and failed actions
      const completed = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      // Take final screenshot
      const finalScreenshot = await executor.takeScreenshot(finalSessionId);

      const response: AutomationResponse = {
        success: failed.length === 0,
        sessionId: finalSessionId,
        actions,
        execution: {
          completed,
          failed,
        },
        screenshot: finalScreenshot,
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('[Automation API] Error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          sessionId: finalSessionId,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Automation API] Request error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid request',
      },
      { status: 400 }
    );
  }
}

