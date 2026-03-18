/**
 * Test website scanner endpoint
 * Tests the scanner against a sample website
 */

import { NextRequest, NextResponse } from "next/server";

interface TestScanRequest {
  websiteUrl?: string;
}

/**
 * POST /api/ed/test-scan
 * Test the website scanner with a provided URL or default test site
 */
export async function POST(request: NextRequest) {
  const body: TestScanRequest = await request.json();
  const websiteUrl = body.websiteUrl || "https://example.com";

  console.log("[Test Scan] Testing scanner for:", websiteUrl);

  try {
    // Test basic fetch
    const testFetch = await fetch(websiteUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Schoolgle-Ed/1.0 (+https://schoolgle.co.uk)",
      },
    });

    const status = testFetch.status;
    const contentType = testFetch.headers.get("content-type");
    const contentLength = testFetch.headers.get("content-length");

    // Try to get sitemap
    const sitemapUrl = new URL(websiteUrl);
    sitemapUrl.pathname = "/sitemap.xml";

    let sitemapStatus = "not checked";
    let sitemapUrls = 0;

    try {
      const sitemapFetch = await fetch(sitemapUrl.toString(), {
        signal: AbortSignal.timeout(5000),
      });
      sitemapStatus = sitemapFetch.ok ? "found" : "not found";

      if (sitemapFetch.ok) {
        const sitemapText = await sitemapFetch.text();
        const matches = [...sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)];
        sitemapUrls = matches.length;
      }
    } catch (e) {
      sitemapStatus = "error: " + (e instanceof Error ? e.message : "unknown");
    }

    return NextResponse.json({
      success: true,
      websiteUrl,
      scanResults: {
        accessible: status === 200,
        statusCode: status,
        contentType,
        contentLength,
        sitemapStatus,
        sitemapUrls,
      },
      recommendation: getRecommendation(status, sitemapStatus, sitemapUrls),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        websiteUrl,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function getRecommendation(
  status: number,
  sitemapStatus: string,
  sitemapUrls: number,
): string {
  if (status === 200 && sitemapStatus === "found" && sitemapUrls > 0) {
    return "✅ Website is accessible and has sitemap - scanning will work well!";
  }
  if (status === 200) {
    return "⚠️ Website accessible but no sitemap - will use common page fallback.";
  }
  if (status === 403 || status === 401) {
    return "❌ Website is blocking automated requests. Consider using server-side scanning with proper headers.";
  }
  if (status >= 500) {
    return "❌ Website server error. Try again later or contact the school.";
  }
  return "⚠️ Website returned unexpected status. Manual configuration may be needed.";
}
