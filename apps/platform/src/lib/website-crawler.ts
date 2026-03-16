/**
 * Website Crawler - Playwright-based crawler for JavaScript-rendered websites
 *
 * Designed to properly crawl modern school websites that use JavaScript for navigation
 * (e.g., Rawdon St Peter's with their Policies section containing 20+ policy documents).
 *
 * Features:
 * - Headless browser with JavaScript execution
 * - Waits for page to fully load (including dynamic content)
 * - Extracts all links from navigation and page content
 * - Crawls discovered pages (up to configurable limit)
 * - Extracts text content, headings, and metadata
 * - Handles PDF links (downloads and extracts text)
 * - Same-domain only crawling with configurable filters
 * - Respectful delays between requests
 */

import { chromium, Browser, Page, BrowserContext } from "playwright";
import { parsePDF } from "./extractors";
import { logger } from "./logger";
import OpenAI from "openai";

/**
 * Configuration options for the crawler
 */
export interface CrawlerConfig {
  /** Maximum number of pages to crawl (default: 50) */
  maxPages?: number;

  /** Delay between requests in milliseconds (default: 1000) */
  requestDelay?: number;

  /** Maximum timeout for page load in milliseconds (default: 30000) */
  pageTimeout?: number;

  /** Whether to crawl same-domain only (default: true) */
  sameDomainOnly?: boolean;

  /** Additional domains to allow (when sameDomainOnly is true) */
  allowedDomains?: string[];

  /** File extensions to skip (default: images, videos, fonts, etc.) */
  skipExtensions?: string[];

  /** Whether to download and process PDFs (default: true) */
  processPDFs?: boolean;

  /** Whether to download and process other documents (default: true) */
  processDocuments?: boolean;

  /** Custom user agent */
  userAgent?: string;

  /** Whether to run headless (default: true) */
  headless?: boolean;

  /** Maximum PDF size in bytes (default: 10MB) */
  maxPDFSize?: number;

  /** Selectors to ignore (CSS selector patterns) */
  ignoreSelectors?: string[];

  /** Path patterns to exclude (regex patterns) */
  excludePaths?: RegExp[];

  /** Whether to take screenshots of thin-content pages and OCR them (default: false) */
  screenshotOCR?: boolean;

  /** Minimum word count below which a page is considered "thin" and eligible for screenshot OCR */
  screenshotOCRThreshold?: number;

  /** Additional seed URLs to pre-populate the crawl queue (useful for trust sites with known page paths) */
  seedUrls?: string[];
}

/**
 * Extracted content from a crawled page
 */
export interface CrawledPage {
  /** Full URL of the page */
  url: string;

  /** Page title */
  title: string;

  /** Main text content (cleaned) */
  content: string;

  /** Heading hierarchy (h1-h6) */
  headings: PageHeading[];

  /** All links found on the page */
  links: string[];

  /** Content type (html, pdf, document, image, etc.) */
  contentType: "html" | "pdf" | "document" | "image" | "other";

  /** HTTP status code (if available) */
  status?: number;

  /** When the page was crawled */
  crawledAt: string;

  /** Page metadata */
  metadata: {
    /** Description meta tag */
    description?: string;

    /** Word count */
    wordCount?: number;

    /** Character count */
    charCount?: number;

    /** PDF page count (if applicable) */
    pageCount?: number;

    /** File size (for downloads) */
    fileSize?: number;

    /** Whether this is a PDF download */
    isDownload?: boolean;

    /** Original URL (if redirected) */
    originalUrl?: string;
  };
}

/**
 * Heading information with hierarchy
 */
export interface PageHeading {
  /** Heading level (1-6) */
  level: number;

  /** Heading text */
  text: string;

  /** Heading ID (if present) */
  id?: string;
}

/**
 * Crawler result summary
 */
export interface CrawlerResult {
  /** All successfully crawled pages */
  pages: CrawledPage[];

  /** URLs that failed to crawl */
  errors: CrawlError[];

  /** Summary statistics */
  stats: CrawlerStats;
}

/**
 * Error information for failed crawls
 */
export interface CrawlError {
  /** URL that failed */
  url: string;

  /** Error message */
  error: string;

  /** When the error occurred */
  timestamp: string;
}

/**
 * Statistics about the crawl
 */
export interface CrawlerStats {
  /** Total pages attempted */
  totalPages: number;

  /** Successfully crawled pages */
  successfulPages: number;

  /** Failed pages */
  failedPages: number;

  /** PDFs processed */
  pdfsProcessed: number;

  /** Documents processed */
  documentsProcessed: number;

  /** Total content size (characters) */
  totalContentSize: number;

  /** Unique domains found */
  uniqueDomains: number;

  /** Time taken for crawl */
  duration: number;
}

/**
 * Default crawler configuration
 */
const DEFAULT_CONFIG: Required<CrawlerConfig> = {
  maxPages: 50,
  requestDelay: 1000,
  pageTimeout: 30000,
  sameDomainOnly: true,
  allowedDomains: [],
  seedUrls: [],
  skipExtensions: [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".ico",
    ".webp",
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".webm",
    ".mp3",
    ".wav",
    ".ogg",
    ".flac",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".zip",
    ".tar",
    ".gz",
    ".rar",
    ".7z",
    ".json",
    ".xml",
    ".txt",
    ".csv",
  ],
  processPDFs: true,
  processDocuments: true,
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Schoolgle-Crawler/1.0",
  headless: true,
  maxPDFSize: 10 * 1024 * 1024, // 10MB
  ignoreSelectors: [
    "nav",
    "footer",
    "header",
    ".navigation",
    ".footer",
    ".cookie-banner",
    ".cookie-consent",
    ".modal",
    ".popup",
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    "script",
    "style",
    "noscript",
    // NOTE: iframe deliberately NOT ignored — we extract src URLs from iframes
    // before stripping them in extractPageContent
  ],
  excludePaths: [
    /^\/api\//i,
    /^\/admin\//i,
    /^\/wp-admin\//i,
    /^\/login/i,
    /^\/logout/i,
    /^\/user\//i,
    /^\.git\//,
    /^\/cdn-cgi\//,
  ],
  screenshotOCR: false,
  screenshotOCRThreshold: 100,
};

/**
 * Website Crawler Class
 */
export class WebsiteCrawler {
  private config: Required<CrawlerConfig>;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  // Tracking state
  private crawledUrls: Set<string> = new Set();
  private queuedUrls: Set<string> = new Set();
  /** URLs fetched inline (Drive PDFs) — don't count against maxPages */
  private inlineFetchedUrls: Set<string> = new Set();
  private crawlErrors: CrawlError[] = [];
  private crawledPages: CrawledPage[] = [];
  private baseDomain: string;
  private startTime: number = 0;

  constructor(config: CrawlerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Preserve allowedDomains from config
    if (config.allowedDomains) {
      this.config.allowedDomains = config.allowedDomains;
    }

    // Preserve excludePaths from config
    if (config.excludePaths) {
      this.config.excludePaths = config.excludePaths;
    }

    // Will be set when crawling starts
    this.baseDomain = "";
  }

  /**
   * Initialize the browser
   */
  private async initBrowser(): Promise<void> {
    if (this.browser) return;

    const context = { function: "initBrowser", file: "website-crawler.ts" };

    try {
      logger.debug("Initializing Playwright browser", context);

      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-extensions",
          "--disable-default-apps",
        ],
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: this.config.userAgent,
        // Accept downloads for PDFs
        acceptDownloads: true,
      });

      this.page = await this.context.newPage();

      // Set default timeout
      this.page.setDefaultTimeout(this.config.pageTimeout);

      // Handle downloads
      this.page.on("download", async (download) => {
        // Downloads are handled in crawlUrl
        logger.debug("Download triggered", context, { url: download.url() });
      });

      logger.info("Browser initialized successfully", context);
    } catch (error) {
      logger.error("Failed to initialize browser", context, error);
      throw new Error(
        `Failed to initialize crawler: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Close the browser and cleanup resources
   */
  private async closeBrowser(): Promise<void> {
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
      }
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error) {
      logger.warn(
        "Error during browser cleanup",
        { function: "closeBrowser", file: "website-crawler.ts" },
        error,
      );
    } finally {
      this.page = null;
      this.context = null;
      this.browser = null;
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return "";
    }
  }

  /**
   * Check if URL is allowed to be crawled
   */
  private isUrlAllowed(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // Check protocol
      if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
        return false;
      }

      // Check file extension
      const pathname = urlObj.pathname.toLowerCase();
      const hasSkipExtension = this.config.skipExtensions.some((ext) =>
        pathname.endsWith(ext),
      );
      if (hasSkipExtension) {
        return false;
      }

      // Check path exclusions
      const isExcludedPath = this.config.excludePaths.some((pattern) =>
        pattern.test(urlObj.pathname),
      );
      if (isExcludedPath) {
        return false;
      }

      // Check domain restrictions
      if (this.config.sameDomainOnly) {
        const domain = urlObj.hostname;
        const isBaseDomain =
          domain === this.baseDomain || domain.endsWith(`.${this.baseDomain}`);

        const isAllowedDomain = this.config.allowedDomains.some(
          (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
        );

        if (!isBaseDomain && !isAllowedDomain) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalize URL for comparison
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove hash
      urlObj.hash = "";
      // Remove trailing slash (except for root)
      const pathname = urlObj.pathname;
      if (pathname.length > 1 && pathname.endsWith("/")) {
        urlObj.pathname = pathname.slice(0, -1);
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Check if a URL is a PDF or document
   */
  private isDocumentUrl(url: string): "pdf" | "document" | null {
    const pathname = new URL(url).pathname.toLowerCase();

    if (pathname.endsWith(".pdf")) {
      return "pdf";
    }

    const docExtensions = [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"];
    if (docExtensions.some((ext) => pathname.endsWith(ext))) {
      return "document";
    }

    return null;
  }

  /**
   * Wait for page to be fully loaded with JavaScript-rendered content
   */
  private async waitForPageLoad(page: Page): Promise<void> {
    const context = { function: "waitForPageLoad", file: "website-crawler.ts" };

    try {
      // Wait for network to be mostly idle
      await page
        .waitForLoadState("networkidle", { timeout: 10000 })
        .catch(() => {
          logger.debug("Network idle timeout, continuing", context);
        });

      // Additional wait for dynamic content (school CMS widgets need time to load)
      await page.waitForTimeout(1500);

      // Wait for common indicators of loaded content
      await page
        .waitForFunction(
          () => {
            // Check if document is ready
            if (document.readyState !== "complete") return false;

            // Check for common loading indicators
            const loaders = document.querySelectorAll(
              '[class*="loading"], [class*="spinner"], [role="status"][aria-busy="true"]',
            );
            for (let i = 0; i < loaders.length; i++) {
              const loader = loaders[i] as HTMLElement;
              const isVisible =
                loader.offsetParent !== null &&
                !loader.classList.contains("hidden");
              if (isVisible) return false;
            }

            return true;
          },
          { timeout: 5000 },
        )
        .catch(() => {
          logger.debug("Content check timeout, continuing anyway", context);
        });
    } catch (error) {
      logger.warn("Error waiting for page load, continuing", context, error);
    }
  }

  /**
   * Extract links from a page
   */
  private async extractLinks(
    page: Page,
    currentUrl: string,
  ): Promise<string[]> {
    const context = {
      function: "extractLinks",
      file: "website-crawler.ts",
      url: currentUrl,
    };

    try {
      const links = await page.evaluate(() => {
        const extractedLinks: string[] = [];

        // Get all anchor elements
        const anchors = document.querySelectorAll("a[href]");

        for (let i = 0; i < anchors.length; i++) {
          const anchor = anchors[i] as HTMLAnchorElement;
          const href = anchor.getAttribute("href");
          if (href) {
            // Get text content for context (helpful for filtering)
            const text = anchor.textContent?.trim() || "";
            // Get aria-label if available
            const ariaLabel = anchor.getAttribute("aria-label") || "";

            // Only include links with meaningful text
            if (text || ariaLabel) {
              extractedLinks.push(href);
            }
          }
        }

        // Extract iframe sources (schools embed Google Drive docs in iframes)
        // Including hidden ones inside expander/accordion sections (common CMS pattern)
        const iframes = document.querySelectorAll("iframe[src]");
        for (let i = 0; i < iframes.length; i++) {
          const src = iframes[i].getAttribute("src");
          if (src) extractedLinks.push(src);
        }

        // Also check hidden content sections (expanders, accordions, tabs)
        // School CMS sites hide Drive folder iframes in expandable sections
        const hiddenSections = document.querySelectorAll(
          ".expandercontent, .accordion-content, [hidden], [style*='display: none'], [style*='display:none']",
        );
        for (let i = 0; i < hiddenSections.length; i++) {
          const section = hiddenSections[i];
          const sectionIframes = section.querySelectorAll("iframe[src]");
          for (let j = 0; j < sectionIframes.length; j++) {
            const src = sectionIframes[j].getAttribute("src");
            if (src) extractedLinks.push(src);
          }
          const sectionLinks = section.querySelectorAll("a[href]");
          for (let j = 0; j < sectionLinks.length; j++) {
            const href = sectionLinks[j].getAttribute("href");
            if (href) extractedLinks.push(href);
          }
        }

        // Extract embed/object sources (another common pattern for PDFs)
        const embeds = document.querySelectorAll("embed[src], object[data]");
        for (let i = 0; i < embeds.length; i++) {
          const src =
            embeds[i].getAttribute("src") || embeds[i].getAttribute("data");
          if (src) extractedLinks.push(src);
        }

        // Look for links in onclick/window.open handlers (school CMS pattern)
        const clickElements = document.querySelectorAll("[onclick]");
        for (let i = 0; i < clickElements.length; i++) {
          const onclick = clickElements[i].getAttribute("onclick") || "";
          const urlMatch = onclick.match(
            /(?:window\.open|location\.href)\s*[=(]\s*['"]([^'"]+)['"]/,
          );
          if (urlMatch) extractedLinks.push(urlMatch[1]);
        }

        return extractedLinks;
      });

      // Resolve relative URLs
      const resolvedLinks: string[] = [];
      for (const link of links) {
        try {
          // Try to resolve relative URLs against the current page
          const resolved = new URL(link, currentUrl).toString();
          resolvedLinks.push(resolved);
        } catch {
          // Skip invalid URLs
          continue;
        }
      }

      // Resolve Google Drive embedded folder views into individual file links
      // School CMS sites embed Drive folders in iframes: embeddedfolderview?id=XXX
      // We fetch the folder HTML and extract individual file links
      const folderLinks = resolvedLinks.filter((l) =>
        l.includes("drive.google.com/embeddedfolderview"),
      );
      for (const folderUrl of folderLinks) {
        try {
          const fileLinks = await this.resolveGoogleDriveFolder(folderUrl);
          // Process Drive PDFs immediately instead of queueing them
          // (queued URLs may exceed maxPages and never get processed)
          for (const fileUrl of fileLinks) {
            const driveConversion = this.convertGoogleDriveUrl(fileUrl);
            if (driveConversion && this.config.processPDFs) {
              try {
                const result = await this.fetchPdfDirectly(
                  driveConversion.url,
                  fileUrl,
                );
                if (result) {
                  this.crawledPages.push(result);
                  // Track as inline-fetched so we don't re-process, but DON'T
                  // count against maxPages (these are documents, not navigated pages)
                  this.inlineFetchedUrls.add(fileUrl);
                  this.inlineFetchedUrls.add(driveConversion.url);
                }
              } catch (pdfErr) {
                logger.warn("Failed to fetch Drive PDF", context, pdfErr);
              }
            } else {
              // Not a PDF — add to links for normal queueing
              resolvedLinks.push(fileUrl);
            }
          }
          logger.info("Resolved Drive folder files", context, {
            folderUrl: folderUrl.substring(0, 80),
            fileCount: fileLinks.length,
          });
        } catch (err) {
          logger.warn("Failed to resolve Drive folder", context, err);
        }
      }

      // Deduplicate
      const uniqueLinks = Array.from(new Set(resolvedLinks));

      logger.debug(`Extracted ${uniqueLinks.length} unique links`, context, {
        totalLinks: links.length,
      });

      return uniqueLinks;
    } catch (error) {
      logger.warn("Error extracting links", context, error);
      return [];
    }
  }

  /**
   * Extract content from a page
   */
  private async extractPageContent(
    page: Page,
    url: string,
  ): Promise<{
    title: string;
    content: string;
    headings: PageHeading[];
    description?: string;
    wordCount: number;
    charCount: number;
  }> {
    const context = {
      function: "extractPageContent",
      file: "website-crawler.ts",
      url,
    };

    try {
      const result = await page.evaluate(() => {
        // Extract title
        const title = document.title || "";

        // Extract meta description
        const metaDescription =
          document
            .querySelector('meta[name="description"]')
            ?.getAttribute("content") || undefined;

        // Extract headings
        const headings: { level: number; text: string; id?: string }[] = [];
        for (let level = 1; level <= 6; level++) {
          const elements = document.querySelectorAll(`h${level}`);
          elements.forEach((el) => {
            const text = el.textContent?.trim() || "";
            const id = el.id || undefined;
            if (text) {
              headings.push({ level, text, id });
            }
          });
        }

        // Extract main content
        // Try to find the main content area
        let mainContent = "";

        // Priority order for content containers
        const contentSelectors = [
          "main",
          "article",
          '[role="main"]',
          ".content",
          ".main-content",
          "#content",
          "#main",
          ".post-content",
          ".entry-content",
          "article",
          "body", // fallback
        ];

        let contentElement: Element | null = null;
        for (const selector of contentSelectors) {
          contentElement = document.querySelector(selector);
          if (contentElement) {
            // Make sure we're not just getting navigation
            const textContent = contentElement.textContent || "";
            if (textContent.length > 200) {
              break;
            }
          }
        }

        if (contentElement) {
          // Clone to avoid modifying the page
          const clone = contentElement.cloneNode(true) as Element;

          // Before removing elements, capture expander/accordion labels and their content descriptions
          // School CMS sites hide policy content in expandable sections
          const expanders = clone.querySelectorAll(
            ".expandertitle, .accordion-title, .accordion-item__title, summary",
          );
          const expanderLabels: string[] = [];
          for (let i = 0; i < expanders.length; i++) {
            const text =
              (expanders[i] as HTMLElement).textContent?.trim() || "";
            if (text) expanderLabels.push(text);
          }

          // Remove navigation, footer, iframes, etc. (iframe srcs already captured by extractLinks)
          const unwanted = clone.querySelectorAll(
            'nav, footer, header, .navigation, .footer, .sidebar, .menu, [role="navigation"], [role="complementary"], script, style, noscript, iframe',
          );
          unwanted.forEach((el) => el.remove());

          // Append expander labels to content (they may have been in hidden sections)
          if (expanderLabels.length > 0) {
            mainContent =
              (clone.textContent || "") +
              "\n\nExpander sections: " +
              expanderLabels.join(", ");
          } else {
            mainContent = clone.textContent || "";
          }
        }

        // Clean up the content
        const cleanContent = mainContent
          .replace(/\s+/g, " ") // Collapse whitespace
          .replace(/\n\s*\n/g, "\n\n") // Preserve paragraph breaks
          .trim();

        const wordCount = cleanContent
          .split(/\s+/)
          .filter((w) => w.length > 0).length;
        const charCount = cleanContent.length;

        return {
          title,
          metaDescription,
          content: cleanContent,
          headings,
          wordCount,
          charCount,
        };
      });

      logger.debug("Content extracted", context, {
        titleLength: result.title.length,
        wordCount: result.wordCount,
        headingCount: result.headings.length,
      });

      return result;
    } catch (error) {
      logger.warn("Error extracting page content", context, error);
      return {
        title: "",
        content: "",
        headings: [],
        wordCount: 0,
        charCount: 0,
      };
    }
  }

  /**
   * Download and process a PDF
   */
  private async processPDF(
    download: any,
    url: string,
  ): Promise<CrawledPage | null> {
    const context = { function: "processPDF", file: "website-crawler.ts", url };

    try {
      // Check file size before downloading
      const suggestedFilename = download.suggestedFilename();
      logger.debug("Starting PDF download", context, {
        filename: suggestedFilename,
      });

      // Get the download as a buffer
      const path = await download.path();
      if (!path) {
        throw new Error("Download path not available");
      }

      // Read the file
      const fs = await import("fs/promises");
      const buffer = await fs.readFile(path);

      // Check size
      if (buffer.length > this.config.maxPDFSize) {
        logger.warn("PDF too large, skipping", context, {
          size: buffer.length,
          maxSize: this.config.maxPDFSize,
        });
        return null;
      }

      // Extract text
      const text = await parsePDF(buffer);

      // Extract title from filename or content
      let title = suggestedFilename.replace(".pdf", "").replace(/[-_]/g, " ");

      // Try to get a better title from the first line
      const lines = text.split("\n");
      if (lines.length > 0 && lines[0].length > 10 && lines[0].length < 100) {
        title = lines[0].trim();
      }

      // Count pages (separated by "--- Page X ---")
      const pageCount = (text.match(/--- Page \d+ ---/g) || []).length;

      // Clean content
      const cleanContent = text
        .replace(/--- Page \d+ ---/g, "\n\n")
        .replace(/\s+/g, " ")
        .trim();

      const result: CrawledPage = {
        url,
        title,
        content: cleanContent,
        headings: [],
        links: [],
        contentType: "pdf",
        crawledAt: new Date().toISOString(),
        metadata: {
          wordCount: cleanContent.split(/\s+/).filter((w) => w.length > 0)
            .length,
          charCount: cleanContent.length,
          pageCount,
          fileSize: buffer.length,
          isDownload: true,
        },
      };

      // Clean up temp file
      try {
        await fs.unlink(path);
      } catch {
        // Ignore cleanup errors
      }

      logger.info("PDF processed successfully", context, {
        pageCount,
        wordCount: result.metadata.wordCount,
        fileSize: buffer.length,
      });

      return result;
    } catch (error) {
      logger.error("Error processing PDF", context, error);
      return null;
    }
  }

  /**
   * Process a document link (non-PDF)
   */
  private async processDocument(url: string): Promise<CrawledPage | null> {
    const context = {
      function: "processDocument",
      file: "website-crawler.ts",
      url,
    };

    try {
      logger.debug("Processing document URL", context);

      // For now, just return a placeholder
      // In a full implementation, you'd download and parse DOCX, XLSX, etc.
      const result: CrawledPage = {
        url,
        title: new URL(url).pathname.split("/").pop() || "Document",
        content: "[Document content not extracted - format not supported]",
        headings: [],
        links: [],
        contentType: "document",
        crawledAt: new Date().toISOString(),
        metadata: {
          wordCount: 0,
          charCount: 0,
          isDownload: true,
        },
      };

      return result;
    } catch (error) {
      logger.warn("Error processing document", context, error);
      return null;
    }
  }

  /**
   * Fetch a PDF directly via HTTP (for Google Drive and other external hosts)
   */
  private async fetchPdfDirectly(
    downloadUrl: string,
    originalUrl: string,
  ): Promise<CrawledPage | null> {
    const context = {
      function: "fetchPdfDirectly",
      file: "website-crawler.ts",
      url: downloadUrl,
    };

    try {
      logger.info("Fetching PDF directly via HTTP", context);

      const response = await fetch(downloadUrl, {
        headers: {
          "User-Agent": this.config.userAgent,
        },
        redirect: "follow",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      if (buffer.length > this.config.maxPDFSize) {
        logger.warn("PDF too large, skipping", context, {
          size: buffer.length,
          maxSize: this.config.maxPDFSize,
        });
        return null;
      }

      // Check if it's actually a PDF (Google may return HTML for auth pages)
      const contentType = response.headers.get("content-type") || "";
      if (
        contentType.includes("text/html") &&
        !contentType.includes("application/pdf")
      ) {
        logger.warn("Got HTML instead of PDF — file may require auth", context);
        return null;
      }

      // Extract text
      const text = await parsePDF(buffer);

      // Extract title from content disposition or URL
      const disposition = response.headers.get("content-disposition") || "";
      const filenameMatch = disposition.match(/filename[*]?="?([^";\n]+)"?/);
      let title = filenameMatch
        ? decodeURIComponent(filenameMatch[1]).replace(".pdf", "")
        : new URL(originalUrl).pathname.split("/").pop() || "Document";
      title = title.replace(/[-_]/g, " ");

      const pageCount = (text.match(/--- Page \d+ ---/g) || []).length;
      const cleanContent = text
        .replace(/--- Page \d+ ---/g, "\n\n")
        .replace(/\s+/g, " ")
        .trim();

      const result: CrawledPage = {
        url: originalUrl, // Use original URL for display
        title,
        content: cleanContent,
        headings: [],
        links: [],
        contentType: "pdf",
        crawledAt: new Date().toISOString(),
        metadata: {
          wordCount: cleanContent.split(/\s+/).filter((w) => w.length > 0)
            .length,
          charCount: cleanContent.length,
          pageCount,
          fileSize: buffer.length,
          isDownload: true,
        },
      };

      logger.info("PDF fetched and processed successfully", context, {
        pageCount,
        wordCount: result.metadata.wordCount,
        fileSize: buffer.length,
      });

      return result;
    } catch (error) {
      logger.warn("Failed to fetch PDF directly", context, error);
      return null;
    }
  }

  /**
   * Convert Google Drive viewer URLs to direct download URLs
   */
  private convertGoogleDriveUrl(
    url: string,
  ): { url: string; isPdf: boolean } | null {
    try {
      const urlObj = new URL(url);
      // Match drive.google.com/file/d/{fileId}/view or /preview or /edit
      if (urlObj.hostname === "drive.google.com") {
        const fileMatch = urlObj.pathname.match(/\/file\/d\/([^/]+)/);
        if (fileMatch) {
          const fileId = fileMatch[1];
          // Convert to direct download URL
          return {
            url: `https://drive.google.com/uc?id=${fileId}&export=download`,
            isPdf: true, // Assume PDF for Google Drive school documents
          };
        }
      }
      // Match docs.google.com/document/d/{docId}
      if (urlObj.hostname === "docs.google.com") {
        const docMatch = urlObj.pathname.match(/\/document\/d\/([^/]+)/);
        if (docMatch) {
          const docId = docMatch[1];
          return {
            url: `https://docs.google.com/document/d/${docId}/export?format=pdf`,
            isPdf: true,
          };
        }
      }
    } catch {
      // Invalid URL
    }
    return null;
  }

  /**
   * Resolve a Google Drive embedded folder view into individual file links.
   * School CMS sites embed Drive folders in iframes: embeddedfolderview?id=XXX
   * Google's embeddedfolderview returns 404 for server-side fetch, so we use
   * Playwright to render the folder and extract file entries from the DOM.
   */
  private async resolveGoogleDriveFolder(folderUrl: string): Promise<string[]> {
    const context = {
      function: "resolveGoogleDriveFolder",
      file: "website-crawler.ts",
      url: folderUrl,
    };

    try {
      // Extract folder ID from embeddedfolderview URL
      const folderIdMatch = folderUrl.match(
        /embeddedfolderview\?id=([a-zA-Z0-9_-]+)/,
      );
      if (!folderIdMatch) {
        logger.warn("Could not extract folder ID from URL", context);
        return [];
      }

      const folderId = folderIdMatch[1];
      const driveUrl = `https://drive.google.com/drive/folders/${folderId}`;

      if (!this.context) {
        logger.warn(
          "No browser context available for Drive folder resolution",
          context,
        );
        return [];
      }

      // Open Drive folder in a new tab using the existing browser context
      const folderPage = await this.context.newPage();
      try {
        await folderPage.goto(driveUrl, {
          waitUntil: "networkidle",
          timeout: 20000,
        });
        // Extra wait for Drive's JS to render file entries
        await folderPage.waitForTimeout(2000);

        // Extract file IDs from data-id attributes (Drive renders file entries with these)
        const fileIds = await folderPage.evaluate(() => {
          const entries = document.querySelectorAll("[data-id]");
          const ids: string[] = [];
          entries.forEach((el) => {
            const id = el.getAttribute("data-id");
            // File IDs are long alphanumeric strings; skip short ones (UI element IDs)
            if (id && id.length > 10) {
              ids.push(id);
            }
          });
          return ids;
        });
        // Deduplicate and filter out the folder ID itself
        const uniqueFileIds = [...new Set(fileIds)].filter(
          (id) => id !== folderId,
        );

        const fileUrls = uniqueFileIds.map(
          (id) => `https://drive.google.com/file/d/${id}/view`,
        );

        logger.info("Resolved Drive folder via Playwright", context, {
          folderId,
          fileCount: fileUrls.length,
        });
        return fileUrls;
      } finally {
        await folderPage.close();
      }
    } catch (error) {
      logger.warn("Error resolving Drive folder", context, error);
      return [];
    }
  }

  /**
   * Take a full-page screenshot and OCR it via vision model
   * Used for pages where HTML content extraction fails (dynamic widgets, image-heavy layouts)
   */
  private async screenshotAndOCR(page: Page, url: string): Promise<string> {
    const context = {
      function: "screenshotAndOCR",
      file: "website-crawler.ts",
      url,
    };

    try {
      const apiKey =
        process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        logger.warn("Screenshot OCR skipped — no API key", context);
        return "";
      }

      // Scroll to bottom to trigger lazy-loaded content, then back to top
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(1000);
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(500);

      // Take full-page screenshot
      const screenshotBuffer = await page.screenshot({
        fullPage: true,
        type: "jpeg",
        quality: 80,
      });

      // Cap at 4MB to stay within API limits
      if (screenshotBuffer.length > 4 * 1024 * 1024) {
        logger.warn("Screenshot too large for OCR, skipping", context, {
          size: screenshotBuffer.length,
        });
        return "";
      }

      logger.info("Running screenshot OCR", context, {
        size: screenshotBuffer.length,
      });

      const openai = new OpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://schoolgle.co.uk",
          "X-Title": "Schoolgle - Website Scanner OCR",
        },
      });

      const base64 = screenshotBuffer.toString("base64");
      const response = await openai.chat.completions.create({
        model: "google/gemini-2.0-flash-lite-001",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract ALL visible text from this school website screenshot. Include: headings, body text, sidebar text, footer text, badge text, contact details, Ofsted ratings, policy names in menus/lists, any dates. Return the text exactly as shown, preserving the structure. Do NOT add commentary.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
      });

      const ocrText = response.choices[0]?.message?.content || "";
      logger.info("Screenshot OCR complete", context, {
        charCount: ocrText.length,
      });
      return ocrText;
    } catch (error) {
      logger.warn("Screenshot OCR failed", context, error);
      return "";
    }
  }

  /**
   * Scroll page to trigger lazy-loaded content (school CMS widgets)
   */
  private async scrollForContent(page: Page): Promise<void> {
    try {
      await page.evaluate(async () => {
        const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const height = document.body.scrollHeight;
        const step = Math.floor(height / 5);
        for (let y = 0; y <= height; y += step) {
          window.scrollTo(0, y);
          await delay(300);
        }
        // Scroll back to top
        window.scrollTo(0, 0);
      });
      // Wait for any lazy content to render
      await page.waitForTimeout(1000);
    } catch {
      // Scroll errors are non-fatal
    }
  }

  /**
   * Crawl a single URL
   */
  private async crawlUrl(
    url: string,
    isInitial = false,
  ): Promise<CrawledPage | null> {
    let normalizedUrl = this.normalizeUrl(url);
    const context = {
      function: "crawlUrl",
      file: "website-crawler.ts",
      url: normalizedUrl,
    };

    // Convert Google Drive URLs to direct download links
    const driveConversion = this.convertGoogleDriveUrl(normalizedUrl);
    if (driveConversion) {
      logger.info("Converting Google Drive URL to direct download", context, {
        original: normalizedUrl,
        converted: driveConversion.url,
      });
      // Mark original URL as crawled so we don't try again
      this.crawledUrls.add(normalizedUrl);
      this.crawledUrls.add(driveConversion.url);

      // Use direct HTTP fetch for Google Drive (Playwright can't handle Drive's auth redirects)
      try {
        const result = await this.fetchPdfDirectly(
          driveConversion.url,
          normalizedUrl,
        );
        if (result) {
          this.crawledPages.push(result);
          return result;
        }
      } catch (fetchErr) {
        logger.warn("Google Drive direct fetch failed", context, fetchErr);
      }
      return null;
    }

    // Check if already crawled or fetched inline
    if (
      this.crawledUrls.has(normalizedUrl) ||
      this.inlineFetchedUrls.has(normalizedUrl)
    ) {
      logger.debug("URL already crawled, skipping", context);
      return null;
    }

    // Check if URL is allowed (skip check for converted Google Drive URLs — already validated)
    if (!driveConversion && !this.isUrlAllowed(normalizedUrl)) {
      logger.debug("URL not allowed, skipping", context);
      return null;
    }

    // Check if it's a document
    let docType = this.isDocumentUrl(normalizedUrl);
    // Force PDF type for Google Drive conversions
    if ((driveConversion as any)?.isPdf) docType = "pdf";
    if (docType === "pdf" && this.config.processPDFs) {
      // Need to navigate first to trigger download
      logger.debug("PDF detected, navigating to trigger download", context);
    } else if (docType === "document" && this.config.processDocuments) {
      const result = await this.processDocument(normalizedUrl);
      if (result) {
        this.crawledUrls.add(normalizedUrl);
        this.crawledPages.push(result);
      }
      return result;
    }

    // Ensure browser is initialized
    await this.initBrowser();
    if (!this.page) throw new Error("Page not initialized");

    try {
      logger.info("Crawling URL", context, { isInitial });

      // Set up download handler for PDFs
      let pdfDownload: any = null;
      if (docType === "pdf") {
        const downloadPromise = this.page.waitForEvent("download", {
          timeout: 30000,
        });
        this.page
          .goto(normalizedUrl, {
            waitUntil: "domcontentloaded",
            timeout: this.config.pageTimeout,
          })
          .catch(() => {});
        pdfDownload = await Promise.race([
          downloadPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Download timeout")), 35000),
          ),
        ]).catch(() => null);

        if (pdfDownload) {
          const result = await this.processPDF(pdfDownload, normalizedUrl);
          if (result) {
            this.crawledUrls.add(normalizedUrl);
            this.crawledPages.push(result);
          }
          return result;
        }
      }

      // Regular page navigation
      // Some CMS URLs serve file downloads without a file extension (e.g. /Snapchat-Advice
      // triggers a PDF download). We race navigation against a download event so we can
      // intercept these instead of failing with "Download is starting".
      let response: any;
      let unexpectedDownload: any = null;

      const downloadCatcher = this.page
        .waitForEvent("download", { timeout: this.config.pageTimeout })
        .catch(() => null);

      try {
        response = await this.page.goto(normalizedUrl, {
          waitUntil: "domcontentloaded",
          timeout: this.config.pageTimeout,
        });
      } catch (navError: any) {
        // Check if navigation failed because a download was triggered
        const errMsg = navError?.message || "";
        if (
          errMsg.includes("Download is starting") ||
          errMsg.includes("download")
        ) {
          unexpectedDownload = await downloadCatcher;
          if (unexpectedDownload) {
            logger.info("URL triggered download instead of page", context, {
              filename: unexpectedDownload.suggestedFilename(),
            });
            const suggestedFilename =
              unexpectedDownload.suggestedFilename() || "";
            if (suggestedFilename.toLowerCase().endsWith(".pdf")) {
              const result = await this.processPDF(
                unexpectedDownload,
                normalizedUrl,
              );
              if (result) {
                this.crawledUrls.add(normalizedUrl);
                this.crawledPages.push(result);
              }
              return result;
            } else {
              // Non-PDF download (DOCX, XLSX, etc.) — process as document
              const result = await this.processDocument(normalizedUrl);
              if (result) {
                this.crawledUrls.add(normalizedUrl);
                this.crawledPages.push(result);
              }
              return result;
            }
          }
        }
        // Not a download error — rethrow
        throw navError;
      }

      if (!response) {
        throw new Error("No response received");
      }

      const status = response.status();

      // Check for redirects
      const finalUrl = this.page.url();
      const normalizedFinalUrl = this.normalizeUrl(finalUrl);

      // Handle redirects
      if (normalizedFinalUrl !== normalizedUrl) {
        logger.debug("URL redirected", context, {
          from: normalizedUrl,
          to: normalizedFinalUrl,
        });

        // Check if the final URL was already crawled
        if (this.crawledUrls.has(normalizedFinalUrl)) {
          this.crawledUrls.add(normalizedUrl); // Mark the redirect URL as crawled
          return null;
        }

        // Update tracking
        this.crawledUrls.add(normalizedFinalUrl);
        this.crawledUrls.add(normalizedUrl);
      } else {
        this.crawledUrls.add(normalizedUrl);
      }

      // Check status
      if (status >= 400) {
        throw new Error(`HTTP ${status}`);
      }

      // Check content type — server may serve documents without file extensions
      const contentType = response.headers()["content-type"] || "";
      const isDocumentContentType =
        contentType.includes("application/pdf") ||
        contentType.includes("application/msword") ||
        contentType.includes("application/vnd.openxmlformats") ||
        contentType.includes("application/vnd.ms-excel") ||
        contentType.includes("application/vnd.ms-powerpoint") ||
        contentType.includes("application/octet-stream") ||
        contentType.includes("application/zip");

      if (isDocumentContentType) {
        logger.debug("Document detected by content-type", context, {
          contentType,
        });

        if (contentType.includes("application/pdf")) {
          // Try to get download
          const downloadPromise = this.page
            .waitForEvent("download", { timeout: 5000 })
            .catch(() => null);
          await this.page.waitForTimeout(1000);
          const download = await downloadPromise;
          if (download) {
            const result = await this.processPDF(download, normalizedFinalUrl);
            if (result) {
              this.crawledPages.push(result);
            }
            return result;
          }
        } else {
          // DOCX, XLSX, PPTX etc. — process as document
          const result = await this.processDocument(normalizedFinalUrl);
          if (result) {
            this.crawledUrls.add(normalizedFinalUrl);
            this.crawledPages.push(result);
          }
          return result;
        }
        return null;
      }

      // Wait for page to fully load
      await this.waitForPageLoad(this.page);

      // Scroll to trigger lazy-loaded content (school CMS widgets)
      await this.scrollForContent(this.page);

      // Extract content
      let { title, content, headings, description, wordCount, charCount } =
        await this.extractPageContent(this.page, normalizedFinalUrl);

      // Extract links
      const links = await this.extractLinks(this.page, normalizedFinalUrl);

      // Screenshot OCR for thin-content pages (dynamic widgets, image-heavy layouts)
      // Pages like "policies-and-documents" may have all their content in JS widgets
      // that don't render to extractable text
      if (
        this.config.screenshotOCR &&
        wordCount < this.config.screenshotOCRThreshold &&
        this.page
      ) {
        const ocrText = await this.screenshotAndOCR(
          this.page,
          normalizedFinalUrl,
        );
        if (ocrText.length > content.length) {
          logger.info(
            "Screenshot OCR yielded more content than HTML extraction",
            {
              function: "crawlUrl",
              file: "website-crawler.ts",
              url: normalizedFinalUrl,
            },
            { htmlWords: wordCount, ocrChars: ocrText.length },
          );
          // Append OCR text to content (don't replace — HTML may have different info)
          content = content + "\n\n[Screenshot OCR]\n" + ocrText;
          wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
          charCount = content.length;
        }
      }

      const result: CrawledPage = {
        url: normalizedFinalUrl,
        title,
        content,
        headings,
        links,
        contentType: "html",
        status,
        crawledAt: new Date().toISOString(),
        metadata: {
          description,
          wordCount,
          charCount,
          originalUrl:
            normalizedUrl !== normalizedFinalUrl ? normalizedUrl : undefined,
        },
      };

      this.crawledPages.push(result);

      logger.info("Page crawled successfully", context, {
        title,
        wordCount,
        linkCount: links.length,
        status,
      });

      // Queue discovered links
      for (const link of links) {
        const normalizedLink = this.normalizeUrl(link);
        if (
          !this.crawledUrls.has(normalizedLink) &&
          !this.queuedUrls.has(normalizedLink) &&
          !this.inlineFetchedUrls.has(normalizedLink)
        ) {
          // Always queue Google Drive/Docs links (they'll be converted in crawlUrl)
          const isGoogleDriveLink =
            this.convertGoogleDriveUrl(normalizedLink) !== null;
          if (isGoogleDriveLink || this.isUrlAllowed(normalizedLink)) {
            this.queuedUrls.add(normalizedLink);
          }
        }
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.warn("Failed to crawl URL", context, error);

      this.crawlErrors.push({
        url: normalizedUrl,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      return null;
    }
  }

  /**
   * Main crawl method
   */
  async crawl(startUrl: string): Promise<CrawlerResult> {
    const context = {
      function: "crawl",
      file: "website-crawler.ts",
      url: startUrl,
    };

    // Reset state for new crawl
    this.crawledUrls.clear();
    this.queuedUrls.clear();
    this.inlineFetchedUrls.clear();
    this.crawlErrors = [];
    this.crawledPages = [];
    this.startTime = Date.now();

    try {
      // Extract base domain from start URL
      this.baseDomain = this.extractDomain(startUrl);
      logger.info("Starting crawl", context, {
        baseDomain: this.baseDomain,
        maxPages: this.config.maxPages,
        sameDomainOnly: this.config.sameDomainOnly,
      });

      // Validate start URL
      if (!this.baseDomain) {
        throw new Error("Invalid start URL");
      }

      // Pre-populate queue with seed URLs if provided
      if (this.config.seedUrls && this.config.seedUrls.length > 0) {
        for (const seedUrl of this.config.seedUrls) {
          const normalized = this.normalizeUrl(seedUrl);
          if (normalized && this.isUrlAllowed(normalized)) {
            this.queuedUrls.add(normalized);
          }
        }
        logger.info("Added seed URLs to queue", context, {
          seedCount: this.config.seedUrls.length,
          queueSize: this.queuedUrls.size,
        });
      }

      // Crawl the initial URL
      await this.crawlUrl(startUrl, true);

      // Crawl discovered URLs up to the limit
      while (
        this.queuedUrls.size > 0 &&
        this.crawledUrls.size < this.config.maxPages
      ) {
        // Get next URL from queue (FIFO-ish)
        const nextUrl = this.queuedUrls.values().next().value as string;
        this.queuedUrls.delete(nextUrl);

        // Respectful delay between requests
        if (this.crawledUrls.size > 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.requestDelay),
          );
        }

        await this.crawlUrl(nextUrl);
      }

      // Calculate stats
      const duration = Date.now() - this.startTime;
      const uniqueDomains = new Set(
        this.crawledPages.map((p) => this.extractDomain(p.url)),
      ).size;

      const totalContentSize = this.crawledPages.reduce(
        (sum, p) => sum + (p.metadata.charCount || 0),
        0,
      );

      const pdfsProcessed = this.crawledPages.filter(
        (p) => p.contentType === "pdf",
      ).length;
      const documentsProcessed = this.crawledPages.filter(
        (p) => p.contentType === "document",
      ).length;

      const stats: CrawlerStats = {
        totalPages: this.crawledUrls.size + this.inlineFetchedUrls.size,
        successfulPages: this.crawledPages.length,
        failedPages: this.crawlErrors.length,
        pdfsProcessed,
        documentsProcessed,
        totalContentSize,
        uniqueDomains,
        duration,
      };

      logger.info("Crawl completed", context, stats);

      return {
        pages: this.crawledPages,
        errors: this.crawlErrors,
        stats,
      };
    } catch (error) {
      logger.error("Crawl failed", context, error);
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * Crawl a single page without following links (useful for one-off extraction)
   */
  async crawlSingle(url: string): Promise<CrawledPage | null> {
    this.startTime = Date.now();

    try {
      this.baseDomain = this.extractDomain(url);
      return await this.crawlUrl(url, true);
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * Get current crawl progress
   */
  getProgress(): { crawled: number; queued: number; errors: number } {
    return {
      crawled: this.crawledUrls.size,
      queued: this.queuedUrls.size,
      errors: this.crawlErrors.length,
    };
  }
}

/**
 * Convenience function to crawl a website
 */
export async function crawlWebsite(
  url: string,
  config?: CrawlerConfig,
): Promise<CrawlerResult> {
  const crawler = new WebsiteCrawler(config);
  return crawler.crawl(url);
}

/**
 * Convenience function to crawl a single page
 */
export async function crawlSinglePage(
  url: string,
  config?: CrawlerConfig,
): Promise<CrawledPage | null> {
  const crawler = new WebsiteCrawler(config);
  return crawler.crawlSingle(url);
}
