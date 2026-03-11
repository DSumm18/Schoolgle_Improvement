import { NextResponse } from "next/server";
import { protectedRoute, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/documents/[id]/download
 * Download a generated document as a printable HTML file.
 */
export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const segments = request.nextUrl.pathname.split("/");
  const downloadIdx = segments.indexOf("download");
  const id = segments[downloadIdx - 1];

  if (!id) {
    return apiError("Document ID is required", 400, "MISSING_ID");
  }

  const { data: doc, error } = await supabase
    .from("generated_documents")
    .select("*, document_templates(name, module)")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !doc) {
    return apiError("Document not found", 404, "NOT_FOUND");
  }

  // Get org branding for header
  const { data: org } = await supabase
    .from("organizations")
    .select("name, settings")
    .eq("id", auth.organizationId)
    .single();

  const orgName = org?.name || "";
  const settings = (org?.settings as Record<string, string>) || {};
  const primaryColor = settings.primary_color || "#0ea5e9";
  const logoUrl = settings.logo_url || "";
  const address = settings.address || "";
  const phone = settings.phone || "";
  const email = settings.email || "";

  const subject = doc.subject || "Document";
  const bodyHtml = doc.body_html || "<p>No content</p>";
  const recipientName = doc.recipient_name || "";
  const createdDate = new Date(doc.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Build a complete, print-ready HTML document
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
      .page { box-shadow: none !important; margin: 0 !important; padding: 40px !important; }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f1f5f9;
      color: #334155;
      font-size: 14px;
      line-height: 1.7;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 48px 56px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border-radius: 4px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid ${escapeHtml(primaryColor)};
      padding-bottom: 20px;
      margin-bottom: 32px;
    }
    .header-left h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .header-left .address {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }
    .header-right {
      text-align: right;
      font-size: 12px;
      color: #64748b;
    }
    .subject {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    .meta {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .body-content {
      font-size: 14px;
      line-height: 1.8;
      color: #334155;
    }
    .body-content p { margin: 0 0 12px 0; }
    .body-content ul, .body-content ol { padding-left: 24px; margin: 0 0 12px 0; }
    .body-content li { margin-bottom: 4px; }
    .body-content table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    .body-content th, .body-content td { padding: 8px 12px; border: 1px solid #e2e8f0; text-align: left; font-size: 13px; }
    .body-content th { background: #f8fafc; font-weight: 600; }
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
    }
    .print-btn {
      display: block;
      margin: 20px auto;
      padding: 10px 24px;
      background: ${escapeHtml(primaryColor)};
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .print-btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;padding:12px;">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="page">
    <div class="header">
      <div class="header-left">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(orgName)}" style="max-height:50px;max-width:180px;margin-bottom:8px;display:block;" />` : ""}
        <h1>${escapeHtml(orgName)}</h1>
        ${address ? `<p class="address">${escapeHtml(address)}</p>` : ""}
      </div>
      <div class="header-right">
        ${phone ? `<div>${escapeHtml(phone)}</div>` : ""}
        ${email ? `<div>${escapeHtml(email)}</div>` : ""}
        <div style="margin-top:8px;">${escapeHtml(createdDate)}</div>
      </div>
    </div>
    ${recipientName ? `<p style="margin-bottom:24px;"><strong>To:</strong> ${escapeHtml(recipientName)}</p>` : ""}
    <h2 class="subject">${escapeHtml(subject)}</h2>
    <div class="meta">
      Template: ${escapeHtml(doc.document_templates?.name || "Custom")}
      ${doc.status ? ` | Status: ${escapeHtml(doc.status)}` : ""}
    </div>
    <div class="body-content">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>${escapeHtml(orgName)}${address ? ` | ${escapeHtml(address)}` : ""}</p>
      <p>Generated by Schoolgle Document Production on ${escapeHtml(createdDate)}</p>
    </div>
  </div>
</body>
</html>`;

  const safeFilename = subject
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "_");

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}.html"`,
    },
  });
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
