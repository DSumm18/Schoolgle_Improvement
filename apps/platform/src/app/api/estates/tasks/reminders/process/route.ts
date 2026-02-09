/**
 * Scheduled Reminders API Endpoint
 *
 * POST /api/estates/tasks/reminders/process
 *
 * This endpoint should be called by a cron job or scheduled task
 * (e.g., Vercel Cron, GitHub Actions, AWS EventBridge) to process
 * daily reminders for compliance tasks.
 *
 * Recommended schedule: Run daily at 9:00 AM
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  processDailyReminders,
  getDailySummaryData,
  sendDailySummary,
  getOrganizationsForDailyProcessing,
} from '@/lib/estates-compliance/notifications/reminder-service';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for batch processing

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET || process.env.REMINDERS_CRON_SECRET;

/**
 * POST /api/estates/tasks/reminders/process
 *
 * Processes daily reminders for all organizations.
 * Protected by CRON_SECRET header.
 *
 * Headers:
 * - Authorization: Bearer {CRON_SECRET}
 *
 * Query params:
 * - organization_id: (optional) Process only this organization
 * - send_summary: (optional) Also send daily summary emails
 * - dry_run: (optional) Don't actually send emails, just report what would be sent
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (!CRON_SECRET) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const specificOrganization = searchParams.get('organization_id');
    const sendSummary = searchParams.get('send_summary') === 'true';
    const dryRun = searchParams.get('dry_run') === 'true';

    // Get base URL for action links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://schoolgle.co.uk';

    // Determine which organizations to process
    const organizations = specificOrganization
      ? [specificOrganization]
      : await getOrganizationsForDailyProcessing();

    if (organizations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No organizations to process',
        results: [],
      });
    }

    const results: Array<{
      organizationId: string;
      remindersSent: number;
      remindersFailed: number;
      summarySent?: boolean;
      errors: string[];
    }> = [];

    // Process each organization
    for (const organizationId of organizations) {
      try {
        if (dryRun) {
          // Dry run - just report what would be sent
          results.push({
            organizationId,
            remindersSent: 0,
            remindersFailed: 0,
            errors: ['Dry run - no emails sent'],
          });
          continue;
        }

        // Process reminders
        const reminderResult = await processDailyReminders(
          organizationId,
          baseUrl
        );

        const orgResult: {
          organizationId: string;
          remindersSent: number;
          remindersFailed: number;
          summarySent?: boolean;
          errors: string[];
        } = {
          organizationId,
          remindersSent: reminderResult.sent,
          remindersFailed: reminderResult.failed,
          errors: reminderResult.errors.map((e) => `${e.taskId}: ${e.error}`),
        };

        // Send daily summary if requested
        if (sendSummary) {
          try {
            const summaryData = await getDailySummaryData(organizationId);

            // In production, you would:
            // 1. Get the estates manager's email
            // 2. Send the summary email

            // Placeholder for summary sending
            await sendDailySummary(
              summaryData,
              'estates@school.example.uk',
              'Estates Manager',
              baseUrl
            );

            orgResult.summarySent = true;
          } catch (summaryError: any) {
            orgResult.errors.push(
              `Summary failed: ${summaryError.message || 'Unknown error'}`
            );
          }
        }

        results.push(orgResult);
      } catch (orgError: any) {
        results.push({
          organizationId,
          remindersSent: 0,
          remindersFailed: 0,
          errors: [orgError.message || 'Unknown error'],
        });
      }
    }

    // Calculate totals
    const totals = {
      organizationsProcessed: results.length,
      remindersSent: results.reduce((sum, r) => sum + r.remindersSent, 0),
      remindersFailed: results.reduce((sum, r) => sum + r.remindersFailed, 0),
      summariesSent: results.filter((r) => r.summarySent).length,
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
    };

    return NextResponse.json({
      success: true,
      processedAt: new Date().toISOString(),
      dryRun,
      totals,
      results,
    });

  } catch (error: any) {
    console.error('[Reminder Processor] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process reminders',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/estates/tasks/reminders/process
 *
 * Get status of reminder processing (useful for monitoring)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      status: 'operational',
      cronSecretConfigured: !!CRON_SECRET,
      lastRun: 'Unknown', // Would come from database in production
      nextRun: 'Daily at 9:00 AM',
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get status', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
