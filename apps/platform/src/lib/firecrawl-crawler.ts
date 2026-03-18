/**
 * Firecrawl-based Website Crawler
 *
 * Drop-in replacement for the Playwright-based website-crawler.ts
 * Uses the Firecrawl API (https://firecrawl.dev) for:
 * - Sitemap-aware crawling (finds ALL pages, not just linked ones)
 * - Cookie consent bypass
 * - Clean markdown output optimised for LLM consumption
 * - Parallel crawling (much faster than sequential Playwright)
 * - No server-side browser binary needed
 *
 * Falls back to the Playwright crawler if FIRECRAWL_API_KEY is not set.
 */

import type {
  CrawlerConfig,
  CrawlerResult,
  CrawledPage,
  CrawlError,
  CrawlerStats,
  PageHeading,
} from "./website-crawler";

// ─── Types ──────────────────────────────────────────────────────

interface FirecrawlMapResult {
  links: string[];
}

interface FirecrawlScrapeResult {
  markdown?: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
    statusCode?: number;
  };
  links?: string[];
}

interface FirecrawlCrawlResult {
  success: boolean;
  status: string;
  total: number;
  completed: number;
  creditsUsed: number;
  expiresAt: string;
  data: FirecrawlCrawlDocument[];
}

interface FirecrawlCrawlDocument {
  markdown?: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
    url?: string;
    statusCode?: number;
    [key: string]: unknown;
  };
  links?: string[];
}

// ─── Firecrawl Client ──────────────────────────────────────────

/**
 * Lightweight Firecrawl API client
 * Uses the REST API directly to avoid SDK version issues
 */
class FirecrawlClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = "https://api.firecrawl.dev/v1") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request(
    path: string,
    options: RequestInit = {},
  ): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(
        `Firecrawl API error ${res.status}: ${errorBody || res.statusText}`,
      );
    }

    return res.json();
  }

  /**
   * Map a website — discover all URLs via sitemap + link crawling
   */
  async map(url: string): Promise<FirecrawlMapResult> {
    const result = (await this.request("/map", {
      method: "POST",
      body: JSON.stringify({ url }),
    })) as { success: boolean; links?: string[] };

    return { links: result.links || [] };
  }

  /**
   * Scrape a single page
   */
  async scrape(
    url: string,
    options: {
      formats?: string[];
      includeTags?: string[];
      excludeTags?: string[];
      waitFor?: number;
    } = {},
  ): Promise<FirecrawlScrapeResult> {
    const result = (await this.request("/scrape", {
      method: "POST",
      body: JSON.stringify({
        url,
        formats: options.formats || ["markdown"],
        includeTags: options.includeTags,
        excludeTags: options.excludeTags,
        waitFor: options.waitFor,
      }),
    })) as { success: boolean; data?: FirecrawlScrapeResult };

    return result.data || {};
  }

  /**
   * Crawl an entire website (async — starts a job)
   */
  async crawl(
    url: string,
    options: {
      limit?: number;
      includePaths?: string[];
      excludePaths?: string[];
      maxDepth?: number;
      allowExternalLinks?: boolean;
      scrapeOptions?: {
        formats?: string[];
        excludeTags?: string[];
      };
    } = {},
  ): Promise<string> {
    const result = (await this.request("/crawl", {
      method: "POST",
      body: JSON.stringify({
        url,
        limit: options.limit || 100,
        includePaths: options.includePaths,
        excludePaths: options.excludePaths,
        maxDepth: options.maxDepth || 5,
        allowExternalLinks: options.allowExternalLinks || false,
        scrapeOptions: options.scrapeOptions || {
          formats: ["markdown"],
          excludeTags: [
            "nav",
            "footer",
            "header",
            ".cookie-banner",
            ".cookie-consent",
          ],
        },
      }),
    })) as { success: boolean; id?: string };

    if (!result.id) {
      throw new Error("Firecrawl crawl did not return a job ID");
    }

    return result.id;
  }

  /**
   * Check crawl job status and get results
   */
  async getCrawlStatus(jobId: string): Promise<FirecrawlCrawlResult> {
    const result = (await this.request(
      `/crawl/${jobId}`,
    )) as FirecrawlCrawlResult;
    return result;
  }

  /**
   * Wait for a crawl job to complete, polling at intervals
   */
  async waitForCrawl(
    jobId: string,
    options: {
      pollInterval?: number;
      maxWait?: number;
      onProgress?: (completed: number, total: number) => void;
    } = {},
  ): Promise<FirecrawlCrawlResult> {
    const pollInterval = options.pollInterval || 3000;
    const maxWait = options.maxWait || 300000; // 5 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const status = await this.getCrawlStatus(jobId);

      if (options.onProgress) {
        options.onProgress(status.completed || 0, status.total || 0);
      }

      if (status.status === "completed") {
        return status;
      }

      if (status.status === "failed") {
        throw new Error("Firecrawl crawl job failed");
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(
      `Firecrawl crawl timed out after ${maxWait / 1000} seconds`,
    );
  }
}

// ─── Heading Extraction ────────────────────────────────────────

/**
 * Extract headings from markdown content
 */
function extractHeadingsFromMarkdown(markdown: string): PageHeading[] {
  const headings: PageHeading[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
      });
    }
  }

  return headings;
}

/**
 * Extract links from markdown content
 */
function extractLinksFromMarkdown(markdown: string): string[] {
  const links: string[] = [];
  const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkPattern.exec(markdown)) !== null) {
    const url = match[2];
    if (url.startsWith("http") || url.startsWith("/")) {
      links.push(url);
    }
  }

  return Array.from(new Set(links));
}

/**
 * Detect if a URL is a PDF
 */
function isPdfUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith(".pdf");
  } catch {
    return false;
  }
}

// ─── Convert Firecrawl document to CrawledPage ────────────────

function firecrawlDocToCrawledPage(doc: FirecrawlCrawlDocument): CrawledPage {
  const url = doc.metadata?.sourceURL || doc.metadata?.url || "";
  const content = doc.markdown || "";
  const headings = extractHeadingsFromMarkdown(content);
  const links = [
    ...(doc.links || []),
    ...extractLinksFromMarkdown(content),
  ];

  return {
    url,
    title: doc.metadata?.title || headings[0]?.text || "",
    content,
    headings,
    links: Array.from(new Set(links)),
    contentType: isPdfUrl(url) ? "pdf" : "html",
    crawledAt: new Date().toISOString(),
    status: doc.metadata?.statusCode,
    metadata: {
      description: doc.metadata?.description,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      charCount: content.length,
      isDownload: isPdfUrl(url),
    },
  };
}

// ─── Main Exports ──────────────────────────────────────────────

/**
 * Check if Firecrawl is available (API key is set)
 */
export function isFirecrawlAvailable(): boolean {
  return !!process.env.FIRECRAWL_API_KEY;
}

/**
 * Crawl a website using Firecrawl API
 *
 * Returns the same CrawlerResult interface as the Playwright crawler,
 * so it can be used as a drop-in replacement.
 */
export async function crawlWithFirecrawl(
  url: string,
  config?: CrawlerConfig & {
    /** Additional seed URLs to include in the crawl */
    seedUrls?: string[];
    /** Callback for progress updates */
    onProgress?: (message: string, completed: number, total: number) => void;
  },
): Promise<CrawlerResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "FIRECRAWL_API_KEY not set. Add it to .env.local to use Firecrawl.",
    );
  }

  const startTime = Date.now();
  const client = new FirecrawlClient(apiKey);
  const maxPages = config?.maxPages || 100;
  const pages: CrawledPage[] = [];
  const errors: CrawlError[] = [];

  try {
    config?.onProgress?.(
      `Starting Firecrawl crawl of ${url} (max ${maxPages} pages)...`,
      0,
      maxPages,
    );

    // Start the crawl job
    const excludePaths = [
      "/wp-admin/*",
      "/admin/*",
      "/login*",
      "/logout*",
      "/api/*",
      "/cdn-cgi/*",
    ];

    const jobId = await client.crawl(url, {
      limit: maxPages,
      excludePaths,
      maxDepth: 5,
      allowExternalLinks: false,
      scrapeOptions: {
        formats: ["markdown"],
        excludeTags: [
          "nav",
          "footer",
          "header",
          ".cookie-banner",
          ".cookie-consent",
          ".modal",
          ".popup",
          '[role="navigation"]',
          '[role="banner"]',
          '[role="contentinfo"]',
        ],
      },
    });

    console.log(`[Firecrawl] Crawl job started: ${jobId}`);

    // Wait for completion with progress updates
    const result = await client.waitForCrawl(jobId, {
      pollInterval: 3000,
      maxWait: 300000, // 5 minutes
      onProgress: (completed, total) => {
        config?.onProgress?.(
          `Crawling: ${completed}/${total} pages...`,
          completed,
          total,
        );
        console.log(`[Firecrawl] Progress: ${completed}/${total}`);
      },
    });

    console.log(
      `[Firecrawl] Crawl complete: ${result.data?.length || 0} pages, ${result.creditsUsed} credits used`,
    );

    // Convert Firecrawl documents to CrawledPage format
    for (const doc of result.data || []) {
      try {
        const page = firecrawlDocToCrawledPage(doc);
        if (page.url && page.content) {
          pages.push(page);
        }
      } catch (err) {
        const docUrl = doc.metadata?.sourceURL || doc.metadata?.url || "unknown";
        errors.push({
          url: docUrl,
          error:
            err instanceof Error ? err.message : "Failed to process document",
          timestamp: new Date().toISOString(),
        });
      }
    }

    // If seed URLs were provided, scrape any that weren't captured by the crawl
    if (config?.seedUrls && config.seedUrls.length > 0) {
      const crawledUrls = new Set(pages.map((p) => p.url));
      const missingSeedUrls = config.seedUrls.filter(
        (seedUrl) => !crawledUrls.has(seedUrl),
      );

      if (missingSeedUrls.length > 0) {
        console.log(
          `[Firecrawl] Scraping ${missingSeedUrls.length} additional seed URLs`,
        );
        config?.onProgress?.(
          `Scraping ${missingSeedUrls.length} additional seed URLs...`,
          pages.length,
          pages.length + missingSeedUrls.length,
        );

        for (const seedUrl of missingSeedUrls.slice(0, 20)) {
          // Limit to 20 extra
          try {
            const scrapeResult = await client.scrape(seedUrl, {
              formats: ["markdown"],
              excludeTags: [
                "nav",
                "footer",
                "header",
                ".cookie-banner",
                ".cookie-consent",
              ],
            });

            if (scrapeResult.markdown) {
              pages.push(
                firecrawlDocToCrawledPage({
                  markdown: scrapeResult.markdown,
                  metadata: {
                    ...scrapeResult.metadata,
                    sourceURL: seedUrl,
                  },
                  links: scrapeResult.links,
                }),
              );
            }
          } catch (err) {
            errors.push({
              url: seedUrl,
              error:
                err instanceof Error
                  ? err.message
                  : "Failed to scrape seed URL",
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("[Firecrawl] Crawl failed:", err);
    errors.push({
      url,
      error: err instanceof Error ? err.message : "Crawl failed",
      timestamp: new Date().toISOString(),
    });
  }

  const duration = Date.now() - startTime;
  const pdfCount = pages.filter((p) => p.contentType === "pdf").length;
  const domains = new Set(
    pages.map((p) => {
      try {
        return new URL(p.url).hostname;
      } catch {
        return "";
      }
    }),
  );

  const stats: CrawlerStats = {
    totalPages: pages.length + errors.length,
    successfulPages: pages.length,
    failedPages: errors.length,
    pdfsProcessed: pdfCount,
    documentsProcessed: pdfCount, // Firecrawl handles documents inline
    totalContentSize: pages.reduce((sum, p) => sum + (p.content?.length || 0), 0),
    uniqueDomains: domains.size,
    duration,
  };

  return { pages, errors, stats };
}

/**
 * Smart crawl function — uses Firecrawl if available, falls back to Playwright
 *
 * This is the recommended function to use. It:
 * 1. Checks for FIRECRAWL_API_KEY
 * 2. If available, uses Firecrawl (faster, more reliable, sitemap-aware)
 * 3. If not, falls back to the Playwright crawler (works without API key)
 */
export async function smartCrawlWebsite(
  url: string,
  config?: CrawlerConfig & {
    seedUrls?: string[];
    onProgress?: (message: string, completed: number, total: number) => void;
    /** Force a specific crawler backend */
    forceBackend?: "firecrawl" | "playwright";
  },
): Promise<CrawlerResult & { backend: "firecrawl" | "playwright" }> {
  const useFirecrawl =
    config?.forceBackend === "firecrawl" ||
    (config?.forceBackend !== "playwright" && isFirecrawlAvailable());

  if (useFirecrawl) {
    console.log(`[SmartCrawl] Using Firecrawl for ${url}`);
    try {
      const result = await crawlWithFirecrawl(url, config);
      return { ...result, backend: "firecrawl" };
    } catch (err) {
      console.error(
        "[SmartCrawl] Firecrawl failed, falling back to Playwright:",
        err,
      );
      // Fall through to Playwright
    }
  }

  console.log(`[SmartCrawl] Using Playwright for ${url}`);
  const { crawlWebsite } = await import("./website-crawler");
  const result = await crawlWebsite(url, config);
  return { ...result, backend: "playwright" };
}
