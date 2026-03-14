import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/website/serve?subdomain=<subdomain>&path=<path>
// Public endpoint — serves the published static HTML for a school website.
// No auth required — this is what parents see.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get("subdomain");
  const path = searchParams.get("path") || "/";

  if (!subdomain) {
    return NextResponse.json({ error: "subdomain required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Look up the website by subdomain
  const { data: website } = await supabase
    .from("school_websites")
    .select("id, status")
    .eq("subdomain", subdomain)
    .eq("status", "published")
    .maybeSingle();

  if (!website) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>Website not found</h1><p>This school website is not yet published.</p></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Get the latest published snapshot
  const { data: snapshot } = await supabase
    .from("website_published_snapshots")
    .select("pages, css")
    .eq("website_id", website.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!snapshot) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Not Published</title></head><body><h1>Coming Soon</h1><p>This website is being set up.</p></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const pages = snapshot.pages as Record<string, string>;
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\//, "").replace(/\/$/, "")}`;

  const html = pages[normalizedPath];

  if (!html) {
    // Try to find the 404 or fall back to a simple not found page
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Page Not Found</title><style>${snapshot.css}</style></head><body>
        <div class="container" style="text-align:center;padding:4rem 0;">
          <h1>Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <a href="/" class="btn btn-primary" style="margin-top:1rem;">Go Home</a>
        </div>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
