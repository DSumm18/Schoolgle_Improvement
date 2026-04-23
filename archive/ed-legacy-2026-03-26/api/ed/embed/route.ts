import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/ed/embed?key=<embed_key>
 * Returns the Ed widget loader script for a specific school
 * This is what the <script> tag on the school website loads
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return new NextResponse("// Ed: Missing embed key", {
      status: 400,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  // Look up the embed configuration
  const { data: config, error } = await supabaseAdmin
    .from("ed_embed_configs")
    .select("*")
    .eq("embed_key", key)
    .eq("is_active", true)
    .single();

  if (error || !config) {
    return new NextResponse("// Ed: Invalid or inactive embed key", {
      status: 404,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  // Track load (fire and forget)
  supabaseAdmin
    .from("ed_embed_configs")
    .update({
      last_loaded_at: new Date().toISOString(),
      load_count: (config.load_count || 0) + 1,
    })
    .eq("id", config.id)
    .then();

  const platformUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://schoolgle.co.uk";

  // Generate the loader script
  const loaderScript = `
(function() {
  'use strict';

  // Prevent double-loading
  if (window.__ED_EMBED_LOADED__) return;
  window.__ED_EMBED_LOADED__ = true;

  // Configuration from school setup
  var config = {
    schoolId: ${JSON.stringify(config.organization_id)},
    schoolName: ${JSON.stringify(config.school_name)},
    theme: ${JSON.stringify(config.theme || "standard")},
    position: ${JSON.stringify(config.position || "bottom-right")},
    welcomeMessage: ${JSON.stringify(config.welcome_message || "Hi! I'm Ed, your school assistant. How can I help?")},
    features: ${JSON.stringify(config.features || ["chat", "voice"])},
    apiEndpoint: ${JSON.stringify(platformUrl + "/api/ed/website-chat")},
    allowedDomains: ${JSON.stringify(config.allowed_domains || [])},
    accentColor: ${JSON.stringify(config.accent_color || "#0ea5e9")},
  };

  // Check domain is allowed (if restrictions set)
  if (config.allowedDomains.length > 0) {
    var currentDomain = window.location.hostname;
    var allowed = config.allowedDomains.some(function(d) {
      return currentDomain === d || currentDomain.endsWith('.' + d);
    });
    if (!allowed) {
      console.warn('[Ed] Domain not authorized:', currentDomain);
      return;
    }
  }

  // Create Ed container
  var container = document.createElement('div');
  container.id = 'ed-widget-root';
  document.body.appendChild(container);

  // Load Ed widget CSS
  var style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = ${JSON.stringify(platformUrl)} + '/api/ed/embed/styles';
  document.head.appendChild(style);

  // Load Ed widget JS
  var script = document.createElement('script');
  script.src = ${JSON.stringify(platformUrl)} + '/ed-widget.js';
  script.onload = function() {
    if (window.EdWidget) {
      window.EdWidget.init({
        schoolId: config.schoolId,
        theme: config.theme,
        position: config.position,
        mode: 'website',
        apiEndpoint: config.apiEndpoint,
        welcomeMessage: config.welcomeMessage,
        features: config.features,
        accentColor: config.accentColor,
      });
    }
  };
  document.body.appendChild(script);
})();
`;

  return new NextResponse(loaderScript, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=300", // 5 min cache
      "Access-Control-Allow-Origin": "*", // Allow any school website to load this
    },
  });
}
