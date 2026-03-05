/**
 * API Route: Request Documentation from Contractor
 *
 * Triggers an email to a contractor requesting documentation for a compliance check.
 * POST /api/estates/contractors/request-docs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RequestBody {
  checkId: string;
  domain: string;
  contractorId: string;
  contractorEmail: string;
  contractorName: string;
  checkName: string;
  dueDate: string;
  uploadLink: string;
  requestedBy: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    // Validate required fields
    const requiredFields = ['checkId', 'domain', 'contractorId', 'contractorEmail', 'checkName'];
    const missingFields = requiredFields.filter((field) => !body[field as keyof RequestBody]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user from session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, this would:
    // 1. Store the request in the database
    // 2. Send an email to the contractor using a service like Resend, SendGrid, or AWS SES
    // 3. Create a notification for the user
    // 4. Track the request status

    // Mock email sending (replace with actual email service)
    const emailData = {
      to: body.contractorEmail,
      subject: `Documentation Required: ${body.checkName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Documentation Request</h2>
          <p>Dear ${body.contractorName},</p>
          <p>We require documentation for the following compliance check:</p>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Check:</strong> ${body.checkName}</p>
            <p><strong>Domain:</strong> ${body.domain}</p>
            <p><strong>Due Date:</strong> ${new Date(body.dueDate).toLocaleDateString('en-GB', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                    })}</p>
          </div>
          <p>Please upload the required documentation using the link below:</p>
          <p>
            <a href="${body.uploadLink}"
               style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Upload Documentation
            </a>
          </p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            If you have any questions, please contact us.
          </p>
        </div>
      `,
    };

    // Log the email (in production, use actual email service)
    console.log('[Contractor Email Request]', {
      contractor: body.contractorEmail,
      check: body.checkName,
      uploadLink: body.uploadLink,
      requestedBy: user.email,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Documentation request sent to contractor',
      data: {
        requestId: `req_${Date.now()}`,
        contractorEmail: body.contractorEmail,
        checkId: body.checkId,
        uploadLink: body.uploadLink,
        requestedAt: new Date().toISOString(),
        requestedBy: user.email,
      },
    });

  } catch (error) {
    console.error('[Contractor Request Error]', error);
    return NextResponse.json(
      { error: 'Failed to process documentation request' },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve contractor documentation requests
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkId = searchParams.get('checkId');

    if (!checkId) {
      return NextResponse.json(
        { error: 'checkId parameter is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, fetch actual requests from database
    // For now, return mock data
    return NextResponse.json({
      requests: [],
      checkId,
    });

  } catch (error) {
    console.error('[Get Contractor Requests Error]', error);
    return NextResponse.json(
      { error: 'Failed to retrieve contractor requests' },
      { status: 500 }
    );
  }
}
