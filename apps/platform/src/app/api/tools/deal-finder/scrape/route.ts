import { NextRequest } from "next/server";
import { runScrapePipeline } from "@/lib/deal-finder/services/scrape-pipeline";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";

/**
 * POST /api/tools/deal-finder/scrape
 * Full scrape-compare-match pipeline (from the merged DealFind app).
 */
export const POST = protectedRoute(async (auth, request: NextRequest) => {
  try {
    const body = await request.json();
    const url = body.url;

    if (!url || typeof url !== "string") {
      return apiError("Missing url in request body", 400);
    }

    try {
      new URL(url);
    } catch {
      return apiError("Invalid URL", 400);
    }

    const result = await runScrapePipeline(url);

    if (result.status === "failed") {
      return apiError(result.error || "Scrape pipeline failed", 500);
    }
    return apiSuccess(result);
  } catch (error) {
    console.error("Scrape pipeline error:", error);
    return apiError("Scrape pipeline failed", 500);
  }
});

/**
 * GET /api/tools/deal-finder/scrape?url=https://...
 * Legacy: fetches product metadata via Open Graph / JSON-LD / meta tags.
 */
export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return apiError("Missing url parameter", 400);
  }

  try {
    new URL(url);
  } catch {
    return apiError("Invalid URL", 400);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return apiError(`Failed to fetch URL (${res.status})`, 502);
    }

    const html = await res.text();
    const meta = extractMeta(html, url);

    // Using basic NextResponse since headers are custom
    return new Response(JSON.stringify({ data: meta }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Request timed out"
        : "Failed to fetch product page";
    return apiError(message, 502);
  }
});

interface ProductMeta {
  title: string | null;
  image: string | null;
  price: string | null;
  priceCurrency: string | null;
  description: string | null;
  brand: string | null;
  source: string;
}

function extractMeta(html: string, url: string): ProductMeta {
  const meta: ProductMeta = {
    title: null,
    image: null,
    price: null,
    priceCurrency: "GBP",
    description: null,
    brand: null,
    source: new URL(url).hostname.replace("www.", ""),
  };

  // 1. Try JSON-LD structured data first (most reliable)
  const jsonLdMatches = html.match(
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  if (jsonLdMatches) {
    for (const block of jsonLdMatches) {
      try {
        const jsonStr = block.replace(/<script[^>]*>|<\/script>/gi, "");
        const data = JSON.parse(jsonStr);
        const product = findProduct(data);
        if (product) {
          meta.title = meta.title || product.name || null;
          meta.image =
            meta.image ||
            (typeof product.image === "string"
              ? product.image
              : Array.isArray(product.image)
                ? product.image[0]
                : product.image?.url || null);
          meta.brand =
            meta.brand ||
            (typeof product.brand === "string"
              ? product.brand
              : product.brand?.name || null);
          meta.description = meta.description || product.description || null;

          // Price from offers
          const offers = product.offers;
          if (offers) {
            const offer = Array.isArray(offers) ? offers[0] : offers;
            meta.price =
              meta.price ||
              offer.price?.toString() ||
              offer.lowPrice?.toString() ||
              null;
            meta.priceCurrency = offer.priceCurrency || meta.priceCurrency;
          }
        }
      } catch {
        // Invalid JSON-LD, skip
      }
    }
  }

  // 2. Open Graph tags
  meta.title = meta.title || getMetaContent(html, "og:title");
  meta.image = meta.image || getMetaContent(html, "og:image");
  meta.description = meta.description || getMetaContent(html, "og:description");
  meta.price =
    meta.price ||
    getMetaContent(html, "og:price:amount") ||
    getMetaContent(html, "product:price:amount");
  const ogCurrency =
    getMetaContent(html, "og:price:currency") ||
    getMetaContent(html, "product:price:currency");
  if (ogCurrency) meta.priceCurrency = ogCurrency;

  // 3. Amazon-specific extraction
  if (url.includes("amazon")) {
    // Amazon title from #productTitle or title tag
    if (!meta.title) {
      const titleMatch = html.match(
        /<span[^>]*id\s*=\s*["']productTitle["'][^>]*>\s*([\s\S]*?)\s*<\/span>/i,
      );
      if (titleMatch) meta.title = titleMatch[1].trim();
    }

    // Amazon price patterns
    if (!meta.price) {
      // Try various Amazon price selectors
      const pricePatterns = [
        /class\s*=\s*["']a-price-whole["'][^>]*>(\d[\d,]*)/i,
        /id\s*=\s*["']priceblock_ourprice["'][^>]*>\s*[£$]?([\d,.]+)/i,
        /class\s*=\s*["']a-offscreen["'][^>]*>\s*[£$]?([\d,.]+)/i,
        /data-a-color\s*=\s*["']price["'][^>]*>[\s\S]*?[£$]([\d,.]+)/i,
      ];
      for (const pat of pricePatterns) {
        const m = html.match(pat);
        if (m) {
          meta.price = m[1].replace(",", "");
          break;
        }
      }
    }

    // Amazon main image
    if (!meta.image) {
      const imgMatch = html.match(
        /"large"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/i,
      );
      if (imgMatch) meta.image = imgMatch[1];
    }
    if (!meta.image) {
      const imgMatch = html.match(
        /id\s*=\s*["']landingImage["'][^>]*src\s*=\s*["'](https:\/\/[^"']+)["']/i,
      );
      if (imgMatch) meta.image = imgMatch[1];
    }
  }

  // 4. Fallback: standard meta tags and <title>
  meta.title =
    meta.title || getMetaContent(html, "title") || getHtmlTitle(html);
  meta.description = meta.description || getMetaContent(html, "description");

  // Clean up title
  if (meta.title) {
    meta.title = decodeHtmlEntities(meta.title).trim();
    // Remove common suffixes like " - Amazon.co.uk" or " | eBay"
    meta.title = meta.title
      .replace(/\s*[-|]\s*(Amazon\.co\.uk|Amazon|eBay|Argos).*$/i, "")
      .trim();
  }

  return meta;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findProduct(data: any): any {
  if (!data) return null;
  if (data["@type"] === "Product") return data;
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findProduct(item);
      if (found) return found;
    }
  }
  if (data["@graph"] && Array.isArray(data["@graph"])) {
    return findProduct(data["@graph"]);
  }
  return null;
}

function getMetaContent(html: string, property: string): string | null {
  // Match both property="" and name="" variants
  const patterns = [
    new RegExp(
      `<meta[^>]*(?:property|name)\\s*=\\s*["']${escapeRegex(property)}["'][^>]*content\\s*=\\s*["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*(?:property|name)\\s*=\\s*["']${escapeRegex(property)}["']`,
      "i",
    ),
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) return m[1];
  }
  return null;
}

function getHtmlTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&pound;/g, "\u00A3")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
