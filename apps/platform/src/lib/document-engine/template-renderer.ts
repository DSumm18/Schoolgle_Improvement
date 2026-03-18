import { DocumentTemplate } from "./types";

export interface OrgBranding {
  school_name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
  footer_text?: string;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function extractPlaceholders(template: string): string[] {
  const matches = template.match(/\{\{(?!#|\/)\{?([a-zA-Z0-9_.]+)\}?\}\}/g);
  if (!matches) return [];
  const keys = matches.map((m) => m.replace(/\{+|\}+/g, "").trim());
  return Array.from(new Set(keys));
}

export function renderTemplate(
  template: string,
  values: Record<string, string>,
): string {
  let result = template.replace(
    /\{\{\{([a-zA-Z0-9_.]+)\}\}\}/g,
    (_match, key: string) => {
      return values[key] ?? "";
    },
  );

  result = result.replace(
    /\{\{([a-zA-Z0-9_.]+)\}\}/g,
    (_match, key: string) => {
      const val = values[key];
      return val !== undefined ? escapeHtml(val) : "";
    },
  );

  return result;
}

export function renderConditional(
  template: string,
  values: Record<string, string>,
): string {
  let result = template.replace(
    /\{\{#if\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, key: string, content: string) => {
      const val = values[key];
      return val && val.trim() !== "" ? content : "";
    },
  );

  result = result.replace(
    /\{\{#unless\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_match, key: string, content: string) => {
      const val = values[key];
      return !val || val.trim() === "" ? content : "";
    },
  );

  return result;
}

export function renderLoop(
  template: string,
  values: Record<string, any>,
): string {
  return template.replace(
    /\{\{#each\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_match, key: string, itemTemplate: string) => {
      const items = values[key];
      if (!Array.isArray(items)) return "";
      return items
        .map((item: any) => {
          let rendered = itemTemplate;
          if (typeof item === "object" && item !== null) {
            for (const [k, v] of Object.entries(item)) {
              rendered = rendered.replace(
                new RegExp(`\\{\\{${k}\\}\\}`, "g"),
                escapeHtml(String(v ?? "")),
              );
              rendered = rendered.replace(
                new RegExp(`\\{\\{\\{${k}\\}\\}\\}`, "g"),
                String(v ?? ""),
              );
            }
          } else {
            rendered = rendered.replace(
              /\{\{this\}\}/g,
              escapeHtml(String(item)),
            );
            rendered = rendered.replace(/\{\{\{this\}\}\}/g, String(item));
          }
          return rendered;
        })
        .join("");
    },
  );
}

function wrapWithBranding(html: string, branding: OrgBranding): string {
  const color = branding.primary_color || "#0ea5e9";

  const logoBlock = branding.logo_url
    ? `<img src="${escapeHtml(branding.logo_url)}" alt="${escapeHtml(branding.school_name)}" style="max-height:60px;max-width:200px;margin-bottom:8px;" /><br/>`
    : "";

  const addressBlock = branding.address
    ? `<span style="color:#64748b;font-size:12px;">${escapeHtml(branding.address)}</span><br/>`
    : "";

  const contactParts: string[] = [];
  if (branding.phone) contactParts.push(escapeHtml(branding.phone));
  if (branding.email) contactParts.push(escapeHtml(branding.email));
  const contactBlock =
    contactParts.length > 0
      ? `<span style="color:#64748b;font-size:12px;">${contactParts.join(" | ")}</span>`
      : "";

  const footerText = branding.footer_text || branding.school_name;

  // Font: use school's chosen Google Font or fall back to system stack
  const fontStack = branding.font_family
    ? `'${escapeHtml(branding.font_family)}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
    : `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  const fontImport = branding.font_family
    ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(branding.font_family)}:wght@400;500;600;700&display=swap" />`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${fontImport}</head>
<body style="margin:0;padding:0;font-family:${fontStack};background:#f8fafc;">
<div style="max-width:680px;margin:0 auto;padding:24px;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="padding:24px 32px;border-bottom:3px solid ${escapeHtml(color)};text-align:left;">
      ${logoBlock}
      <span style="font-size:18px;font-weight:700;color:#0f172a;">${escapeHtml(branding.school_name)}</span><br/>
      ${addressBlock}
      ${contactBlock}
    </div>
    <div style="padding:32px;color:#334155;font-size:15px;line-height:1.7;">
      ${html}
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">${escapeHtml(footerText)}</p>
    </div>
  </div>
</div>
</body></html>`;
}

export function renderDocument(
  template: DocumentTemplate,
  values: Record<string, any>,
  branding?: OrgBranding,
): { subject: string; body: string } {
  const stringValues: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      stringValues[k] = String(v);
    }
  }

  let subject = renderConditional(template.subject_template, stringValues);
  subject = renderTemplate(subject, stringValues);

  let body = renderConditional(template.body_template, stringValues);
  body = renderLoop(body, values);
  body = renderTemplate(body, stringValues);

  if (branding) {
    body = wrapWithBranding(body, branding);
  }

  return { subject, body };
}
