/**
 * POST /api/estates/helpdesk/inbound
 *
 * Inbound email webhook handler. Receives parsed emails from an email
 * provider (Resend, SendGrid, Cloudflare Email Workers, etc.) and
 * creates helpdesk tickets automatically.
 *
 * Security: The sender's email domain is matched against the
 * organization's verified email_domain. Emails from unrecognised
 * domains are rejected with an auto-reply explaining why.
 *
 * Flow:
 * 1. Parse inbound email payload (from, subject, body, attachments)
 * 2. Extract sender domain → look up organization
 * 3. Look up sender as org member (by email)
 * 4. Create helpdesk ticket with email metadata
 * 5. Send auto-reply confirmation with ticket number
 * 6. Send in-app notification
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { sendEmail, helpdeskTicketHtml } from "@/lib/email-service";

// Shared secret to verify the webhook comes from our email provider
const INBOUND_WEBHOOK_SECRET = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;

interface InboundEmail {
  from: string; // "John Smith <j.smith@stmarys.school.uk>"
  to: string; // "helpdesk@schoolgle.co.uk"
  subject: string;
  text?: string; // Plain text body
  html?: string; // HTML body
  attachments?: Array<{
    filename: string;
    content: string; // base64
    contentType: string;
  }>;
  headers?: Record<string, string>;
  messageId?: string;
}

/**
 * Extract email address from "Name <email>" format
 */
function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : from.toLowerCase().trim();
}

/**
 * Extract display name from "Name <email>" format
 */
function extractName(from: string): string {
  const match = from.match(/^([^<]+)</);
  return match ? match[1].trim() : from.split("@")[0];
}

/**
 * Extract domain from email address
 */
function extractDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() || "";
}

/**
 * Auto-detect priority from email subject/body keywords
 */
function detectPriority(
  subject: string,
  body: string,
): "critical" | "high" | "medium" | "low" {
  const text = `${subject} ${body}`.toLowerCase();

  // Check low-priority / de-escalation phrases FIRST so "not urgent" doesn't match "urgent"
  const lowKeywords = [
    "lightbulb",
    "light bulb",
    "squeaky",
    "cosmetic",
    "paint",
    "minor",
    "when you get a chance",
    "not urgent",
    "no rush",
    "no hurry",
    "non-urgent",
    "non urgent",
    "isn't urgent",
    "isnt urgent",
    "not an emergency",
  ];

  if (lowKeywords.some((k) => text.includes(k))) return "low";

  const criticalKeywords = [
    "flood",
    "flooding",
    "fire",
    "gas leak",
    "gas smell",
    "collapse",
    "electri",
    "shock",
    "injury",
    "injured",
    "emergency",
    "dangerous",
    "urgent",
    "asbestos",
  ];
  const highKeywords = [
    "broken window",
    "no heating",
    "no hot water",
    "leak",
    "leaking",
    "sewage",
    "blocked toilet",
    "alarm",
    "security",
    "locked out",
    "roof",
  ];

  if (criticalKeywords.some((k) => text.includes(k))) return "critical";
  if (highKeywords.some((k) => text.includes(k))) return "high";
  return "medium";
}

/**
 * Auto-detect category from email subject/body keywords
 */
function detectCategory(subject: string, body: string): string {
  const text = `${subject} ${body}`.toLowerCase();

  if (/plumb|tap|toilet|sink|drain|pipe|water|leak|sewage/.test(text))
    return "plumbing";
  if (/electri|light|switch|socket|power|fuse/.test(text)) return "electrical";
  if (/heat|boiler|radiator|thermostat|cold|warm/.test(text)) return "heating";
  if (/window|door|lock|key|glass|hinge/.test(text)) return "doors_windows";
  if (/roof|gutter|ceiling|damp|mould/.test(text)) return "building";
  if (/clean|mess|spill|stain|rubbish|bin/.test(text)) return "cleaning";
  if (/alarm|cctv|camera|security|intruder/.test(text)) return "security";
  if (/playground|fence|gate|grounds|garden/.test(text)) return "grounds";
  if (/fire|extinguish|exit|smoke/.test(text)) return "fire_safety";
  if (/furnitur|desk|chair|table|shelf|whiteboard/.test(text))
    return "furniture";
  if (/it|computer|wifi|network|printer|projector/.test(text)) return "it";
  return "general";
}

/**
 * Generate auto-reply HTML for accepted ticket
 */
function ticketConfirmationHtml(params: {
  senderName: string;
  ticketNumber: string;
  subject: string;
  priority: string;
  category: string;
}): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#00D4D4,#0ea5e9);padding:24px 32px;">
      <h1 style="margin:0;color:white;font-size:20px;">Schoolgle Helpdesk</h1>
    </div>
    <div style="padding:32px;">
      <div style="display:inline-block;background:#16a34a;color:white;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;margin-bottom:16px;">Ticket Created</div>
      <p style="color:#334155;font-size:15px;line-height:1.6;">Hi ${params.senderName},</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">Your helpdesk ticket has been received and logged.</p>
      <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#0f172a;">Ticket #${params.ticketNumber}</p>
        <p style="margin:0 0 4px;color:#64748b;font-size:14px;">Subject: ${params.subject}</p>
        <p style="margin:0 0 4px;color:#64748b;font-size:14px;">Category: ${params.category}</p>
        <p style="margin:0;color:#64748b;font-size:14px;">Priority: ${params.priority}</p>
      </div>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">Your site team will review this and get back to you. You can reply to this email to add more information to the ticket.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Sent by Schoolgle - AI-powered school improvement</p>
    </div>
  </div>
</div>
</body></html>`;
}

/**
 * Generate rejection HTML for unrecognised domain
 */
function rejectionHtml(senderEmail: string, domain: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#00D4D4,#0ea5e9);padding:24px 32px;">
      <h1 style="margin:0;color:white;font-size:20px;">Schoolgle Helpdesk</h1>
    </div>
    <div style="padding:32px;">
      <div style="display:inline-block;background:#dc2626;color:white;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;margin-bottom:16px;">Email Not Accepted</div>
      <p style="color:#334155;font-size:15px;line-height:1.6;">Hello,</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">For security, Schoolgle Helpdesk only accepts emails from verified school domains.</p>
      <div style="background:#fef2f2;border-radius:8px;padding:20px;margin:16px 0;border-left:4px solid #dc2626;">
        <p style="margin:0 0 4px;color:#991b1b;font-size:14px;font-weight:600;">Your email domain <code style="background:#fee2e2;padding:2px 6px;border-radius:4px;">@${domain}</code> is not registered.</p>
        <p style="margin:8px 0 0;color:#7f1d1d;font-size:14px;">Please resend from your school email address, or ask your school administrator to register your domain in Schoolgle Settings.</p>
      </div>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">This security check ensures only authorised staff can raise helpdesk tickets for your school.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Sent by Schoolgle - AI-powered school improvement</p>
    </div>
  </div>
</div>
</body></html>`;
}

// ─── Webhook Handler ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity
    if (INBOUND_WEBHOOK_SECRET) {
      const authHeader =
        request.headers.get("authorization") ||
        request.headers.get("x-webhook-secret");
      if (
        authHeader !== `Bearer ${INBOUND_WEBHOOK_SECRET}` &&
        authHeader !== INBOUND_WEBHOOK_SECRET
      ) {
        return NextResponse.json(
          { error: "Unauthorized webhook" },
          { status: 401 },
        );
      }
    }

    const payload: InboundEmail = await request.json();
    const { from, subject, text, html, attachments, messageId } = payload;

    if (!from || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: from, subject" },
        { status: 400 },
      );
    }

    const senderEmail = extractEmail(from);
    const senderName = extractName(from);
    const senderDomain = extractDomain(senderEmail);
    const bodyText = text || html?.replace(/<[^>]*>/g, "") || "";

    const supabase = createServiceRoleClient();

    // ── Step 1: Look up organization by email domain ──────────────────

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, email_domain, email_domain_verified")
      .eq("email_domain", senderDomain)
      .single();

    if (orgError || !org) {
      console.log(
        `[Inbound Email] Rejected: domain ${senderDomain} not registered`,
      );

      // Send rejection auto-reply
      await sendEmail({
        to: senderEmail,
        subject: `Re: ${subject} - Email Not Accepted`,
        html: rejectionHtml(senderEmail, senderDomain),
        text: `For security, Schoolgle Helpdesk only accepts emails from verified school domains. Your domain @${senderDomain} is not registered. Please resend from your school email address, or ask your administrator to register your domain in Schoolgle Settings.`,
      });

      return NextResponse.json({
        status: "rejected",
        reason: "domain_not_registered",
        domain: senderDomain,
      });
    }

    if (!org.email_domain_verified) {
      console.log(
        `[Inbound Email] Rejected: domain ${senderDomain} not verified for org ${org.name}`,
      );

      await sendEmail({
        to: senderEmail,
        subject: `Re: ${subject} - Email Not Accepted`,
        html: rejectionHtml(senderEmail, senderDomain),
        text: `Your school domain @${senderDomain} is registered but not yet verified. Please ask your administrator to verify the domain in Schoolgle Settings.`,
      });

      return NextResponse.json({
        status: "rejected",
        reason: "domain_not_verified",
        domain: senderDomain,
      });
    }

    // ── Step 2: Look up sender as org member ──────────────────────────

    const { data: member } = await supabase
      .from("organization_members")
      .select("user_id, role")
      .eq("organization_id", org.id)
      .ilike("email", senderEmail)
      .single();

    // Also try matching via auth.users table
    let userId = member?.user_id;
    if (!userId) {
      const { data: authUser } = await supabase
        .from("users")
        .select("id")
        .ilike("email", senderEmail)
        .single();
      userId = authUser?.id;
    }

    // If we still can't find the user, try to find any admin in the org
    // raised_by is a NOT NULL UUID FK to auth.users, so we need a real user
    if (!userId) {
      const { data: anyAdmin } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", org.id)
        .in("role", ["admin", "headteacher", "slt"])
        .limit(1)
        .single();
      userId = anyAdmin?.user_id;
    }

    if (!userId) {
      console.log(
        `[Inbound Email] No matching user for ${senderEmail} in org ${org.name}`,
      );
      return NextResponse.json({
        status: "rejected",
        reason: "sender_not_found",
        message:
          "Your email address is not linked to a user account in this school. Please ask your administrator to add you.",
      });
    }
    const reportedBy = userId;

    // ── Step 3: Auto-detect priority and category ─────────────────────

    const priority = detectPriority(subject, bodyText);
    const category = detectCategory(subject, bodyText);

    // ── Step 4: Create the helpdesk ticket ────────────────────────────

    // Generate ticket number
    const { data: lastTicket } = await supabase
      .from("estates_helpdesk_tickets")
      .select("ticket_sequence")
      .eq("organization_id", org.id)
      .order("ticket_sequence", { ascending: false })
      .limit(1)
      .single();

    const nextSequence = (lastTicket?.ticket_sequence || 0) + 1;
    const ticketNumber = `EST-${String(nextSequence).padStart(5, "0")}`;

    const { data: ticket, error: ticketError } = await supabase
      .from("estates_helpdesk_tickets")
      .insert({
        organization_id: org.id,
        ticket_number: ticketNumber,
        ticket_sequence: nextSequence,
        module: "estates",
        category,
        priority,
        title: subject,
        description: bodyText.slice(0, 5000),
        raised_by: reportedBy,
        status: "open",
        email_from: senderEmail,
        email_subject: subject,
        email_body: bodyText.slice(0, 10000),
        email_message_id: messageId || null,
        attachment_urls: attachments?.map((a) => a.filename) || null,
      })
      .select("id, ticket_number")
      .single();

    if (ticketError) {
      console.error("[Inbound Email] Failed to create ticket:", ticketError);
      return NextResponse.json(
        { error: "Failed to create ticket" },
        { status: 500 },
      );
    }

    // ── Step 5: Send confirmation auto-reply ──────────────────────────

    await sendEmail({
      to: senderEmail,
      subject: `Re: ${subject} [Ticket #${ticketNumber}]`,
      html: ticketConfirmationHtml({
        senderName,
        ticketNumber,
        subject,
        priority,
        category: category.replace(/_/g, " "),
      }),
      text: `Your helpdesk ticket #${ticketNumber} has been created. Subject: ${subject}. Priority: ${priority}. Category: ${category}. Your site team will review and respond.`,
      replyTo: `helpdesk@schoolgle.co.uk`,
    });

    // ── Step 6: Send in-app notification ──────────────────────────────

    // Notify the estates team
    try {
      // Find users with caretaker/slt/admin roles in this org
      const { data: estatesTeam } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", org.id)
        .in("role", ["caretaker", "slt", "headteacher", "admin"]);

      if (estatesTeam && estatesTeam.length > 0) {
        const notifications = estatesTeam.map((m) => ({
          organization_id: org.id,
          user_id: m.user_id,
          type: "helpdesk_created",
          title: `Email ticket: ${subject}`,
          message: `${senderName} (${senderEmail}) raised ticket #${ticketNumber} via email. Priority: ${priority}.`,
          link: "/estates-compliance/helpdesk",
          metadata: {
            ticketId: ticket.id,
            ticketNumber,
            source: "inbound_email",
            senderEmail,
            priority,
            category,
          },
        }));

        await supabase.from("notifications").insert(notifications);
      }
    } catch (notifError) {
      console.error("[Inbound Email] Notification error:", notifError);
    }

    console.log(
      `[Inbound Email] Ticket ${ticketNumber} created from ${senderEmail} for ${org.name}`,
    );

    return NextResponse.json({
      status: "accepted",
      ticketId: ticket.id,
      ticketNumber,
      organization: org.name,
      priority,
      category,
      sender: senderEmail,
    });
  } catch (error) {
    console.error("[Inbound Email] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
