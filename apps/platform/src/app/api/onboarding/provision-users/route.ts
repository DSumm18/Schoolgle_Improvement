/**
 * User Provisioning API
 *
 * Bulk creates users from CSV uploads.
 * Creates Supabase auth users and sends password reset emails.
 * Adds users to organization_members with appropriate roles.
 *
 * POST /api/onboarding/provision-users
 *
 * Body:
 * {
 *   organizationId: string,
 *   trustUsers: [{ firstName, lastName, email, role, accessAllSchools }],
 *   schoolUsers: [
 *     {
 *       urn: string,
 *       users: [{ firstName, lastName, email, role }]
 *     }
 *   ]
 * }
 *
 * Roles: "admin", "teacher", "sbm", "governor", "staff"
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute } from "@/lib/api-utils";
import { createClient, createServiceRoleClient } from "@/lib/supabase-server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const serviceSupabase = createServiceRoleClient();
  const body = await req.json();

  const { organizationId, trustUsers = [], schoolUsers = [] } = body;

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 }
    );
  }

  try {
    const results = {
      trustUsers: [] as any[],
      schoolUsers: [] as any[],
      errors: [] as any[]
    };

    // 1. Process trust central team users
    for (const user of trustUsers) {
      try {
        const result = await createAndInviteUser(serviceSupabase, organizationId, user, null);
        results.trustUsers.push(result);
      } catch (error: any) {
        results.errors.push({
          user,
          error: error.message
        });
      }
    }

    // 2. Process per-school users
    for (const schoolGroup of schoolUsers) {
      const { urn, users } = schoolGroup;

      // Find organization for this school
      const { data: schoolOrg } = await serviceSupabase
        .from("organizations")
        .select("id")
        .eq("urn", urn)
        .single();

      if (!schoolOrg) {
        results.errors.push({
          school: urn,
          error: "School not found"
        });
        continue;
      }

      // Create users for this school
      for (const user of users) {
        try {
          const result = await createAndInviteUser(serviceSupabase, schoolOrg.id, user, urn);
          results.schoolUsers.push(result);
        } catch (error: any) {
          results.errors.push({
            user,
            school: urn,
            error: error.message
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        trustUsersCreated: results.trustUsers.filter((r: any) => r.success).length,
        schoolUsersCreated: results.schoolUsers.filter((r: any) => r.success).length,
        errors: results.errors.length
      },
      results
    });

  } catch (error) {
    console.error("User provisioning error:", error);
    return NextResponse.json(
      { error: "Failed to provision users" },
      { status: 500 }
    );
  }
});

/**
 * Create a user in Supabase Auth and add to organization
 */
async function createAndInviteUser(
  supabase: any,
  organizationId: string,
  userData: any,
  schoolUrn: string | null
) {
  const { firstName, lastName, email, role, accessAllSchools } = userData;

  // 1. Check if user already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, auth_id")
    .eq("email", email)
    .maybeSingle();

  let userId: string;

  if (existingUser) {
    // User exists, just add to organization
    userId = existingUser.auth_id || existingUser.id;

    // Check if already in organization
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMember) {
      return {
        success: true,
        message: "User already exists in organization",
        user: { email, role }
      };
    }
  } else {
    // 2. Create new user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: Math.random().toString(36).substring(2), // Random password (user resets)
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        role
      }
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    userId = authData.user.id;

    // 3. Add to users table
    await supabase.from("users").insert({
      id: userId,
      auth_id: userId,
      email,
      display_name: `${firstName} ${lastName}`.trim(),
      role
    });
  }

  // 4. Add to organization_members
  await supabase.from("organization_members").insert({
    organization_id: organizationId,
    user_id: userId,
    auth_id: userId,
    role: role || "staff",
    job_title: role || null
  });

  // 5. Send password reset email (for new users or login reminder)
  try {
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: "magiclink", // One-time login link
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      }
    });

    if (!emailError) {
      // Send via Resend for better branding
      await sendWelcomeEmail(email, `${firstName} ${lastName}`.trim(), schoolUrn);
    }
  } catch (emailError) {
    console.error("Failed to send welcome email:", emailError);
    // Don't fail the user creation if email fails
  }

  return {
    success: true,
    user: {
      id: userId,
      email,
      role,
      organizationId
    }
  };
}

/**
 * Send welcome email via Resend
 */
async function sendWelcomeEmail(email: string, name: string, schoolUrn: string | null) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Schoolgle <hello@schoolgle.co.uk>",
      to: email,
      subject: "Welcome to Schoolgle",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #0ea5e9; }
            .content { padding: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #0ea5e9; margin: 0;">Welcome to Schoolgle</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Your Schoolgle account has been set up${schoolUrn ? ` for ${schoolUrn}` : ""}.</p>
              <p>To get started, click the button below to set your password and log in:</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Access Schoolgle</a></p>
              <p>If you have any questions, please contact our support team.</p>
              <p>Welcome aboard!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Schoolgle Limited. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error("Resend email error:", error);
  }
}
