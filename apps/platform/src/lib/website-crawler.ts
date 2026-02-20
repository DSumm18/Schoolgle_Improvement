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

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { parsePDF } from './extractors';
import { logger } from './logger';

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
  contentType: 'html' | 'pdf' | 'document' | 'image' | 'other';

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
  skipExtensions: [
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.webp',
    '.mp4', '.mov', '.avi', '.mkv', '.webm',
    '.mp3', '.wav', '.ogg', '.flac',
    '.woff', '.woff2', '.ttf', '.eot',
    '.zip', '.tar', '.gz', '.rar', '.7z',
    '.json', '.xml', '.txt', '.csv'
  ],
  processPDFs: true,
  processDocuments: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Schoolgle-Crawler/1.0',
  headless: true,
  maxPDFSize: 10 * 1024 * 1024, // 10MB
  ignoreSelectors: [
    'nav', 'footer', 'header', '.navigation', '.footer',
    '.cookie-banner', '.cookie-consent', '.modal', '.popup',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    'script', 'style', 'noscript', 'iframe'
  ],
  excludePaths: [
    /^\/api\//i,
    /^\/admin\//i,
    /^\/wp-admin\//i,
    /^\/login/i,
    /^\/logout/i,
    /^\/user\//i,
    /^\.git\//,
    /^\/cdn-cgi\//
  ]
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
    this.baseDomain = '';
  }

  /**
   * Initialize the browser
   */
  private async initBrowser(): Promise<void> {
    if (this.browser) return;

    const context = { function: 'initBrowser', file: 'website-crawler.ts' };

    try {
      logger.debug('Initializing Playwright browser', context);

      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-default-apps',
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
      this.page.on('download', async (download) => {
        // Downloads are handled in crawlUrl
        logger.debug('Download triggered', context, { url: download.url() });
      });

      logger.info('Browser initialized successfully', context);
    } catch (error) {
      logger.error('Failed to initialize browser', context, error);
      throw new Error(`Failed to initialize crawler: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      logger.warn('Error during browser cleanup', { function: 'closeBrowser', file: 'website-crawler.ts' }, error);
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
      return '';
    }
  }

  /**
   * Check if URL is allowed to be crawled
   */
  private isUrlAllowed(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // Check protocol
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return false;
      }

      // Check file extension
      const pathname = urlObj.pathname.toLowerCase();
      const hasSkipExtension = this.config.skipExtensions.some(ext =>
        pathname.endsWith(ext)
      );
      if (hasSkipExtension) {
        return false;
      }

      // Check path exclusions
      const isExcludedPath = this.config.excludePaths.some(pattern =>
        pattern.test(urlObj.pathname)
      );
      if (isExcludedPath) {
        return false;
      }

      // Check domain restrictions
      if (this.config.sameDomainOnly) {
        const domain = urlObj.hostname;
        const isBaseDomain = domain === this.baseDomain ||
          domain.endsWith(`.${this.baseDomain}`);

        const isAllowedDomain = this.config.allowedDomains.some(allowed =>
          domain === allowed || domain.endsWith(`.${allowed}`)
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
      urlObj.hash = '';
      // Remove trailing slash (except for root)
      const pathname = urlObj.pathname;
      if (pathname.length > 1 && pathname.endsWith('/')) {
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
  private isDocumentUrl(url: string): 'pdf' | 'document' | null {
    const pathname = new URL(url).pathname.toLowerCase();

    if (pathname.endsWith('.pdf')) {
      return 'pdf';
    }

    const docExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    if (docExtensions.some(ext => pathname.endsWith(ext))) {
      return 'document';
    }

    return null;
  }

  /**
   * Wait for page to be fully loaded with JavaScript-rendered content
   */
  private async waitForPageLoad(page: Page): Promise<void> {
    const context = { function: 'waitForPageLoad', file: 'website-crawler.ts' };

    try {
      // Wait for network to be mostly idle
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        logger.debug('Network idle timeout, continuing', context);
      });

      // Additional wait for dynamic content
      await page.waitForTimeout(500);

      // Wait for common indicators of loaded content
      await page.waitForFunction(() => {
        // Check if document is ready
        if (document.readyState !== 'complete') return false;

        // Check for common loading indicators
        const loaders = document.querySelectorAll('[class*="loading"], [class*="spinner"], [role="status"][aria-busy="true"]');
        for (let i = 0; i < loaders.length; i++) {
          const loader = loaders[i] as HTMLElement;
          const isVisible = loader.offsetParent !== null &&
            !loader.classList.contains('hidden');
          if (isVisible) return false;
        }

        return true;
      }, { timeout: 5000 }).catch(() => {
        logger.debug('Content check timeout, continuing anyway', context);
      });
    } catch (error) {
      logger.warn('Error waiting for page load, continuing', context, error);
    }
  }

  /**
   * Extract links from a page
   */
  private async extractLinks(page: Page, currentUrl: string): Promise<string[]> {
    const context = { function: 'extractLinks', file: 'website-crawler.ts', url: currentUrl };

    try {
      const links = await page.evaluate(() => {
        const extractedLinks: string[] = [];

        // Get all anchor elements
        const anchors = document.querySelectorAll('a[href]');

        for (let i = 0; i < anchors.length; i++) {
          const anchor = anchors[i] as HTMLAnchorElement;
          const href = anchor.getAttribute('href');
          if (href) {
            // Get text content for context (helpful for filtering)
            const text = anchor.textContent?.trim() || '';
            // Get aria-label if available
            const ariaLabel = anchor.getAttribute('aria-label') || '';

            // Only include links with meaningful text
            if (text || ariaLabel) {
              extractedLinks.push(href);
            }
          }
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

      // Deduplicate
      const uniqueLinks = Array.from(new Set(resolvedLinks));

      logger.debug(`Extracted ${uniqueLinks.length} unique links`, context, {
        totalLinks: links.length
      });

      return uniqueLinks;
    } catch (error) {
      logger.warn('Error extracting links', context, error);
      return [];
    }
  }

  /**
   * Extract content from a page
   */
  private async extractPageContent(page: Page, url: string): Promise<{
    title: string;
    content: string;
    headings: PageHeading[];
    description?: string;
    wordCount: number;
    charCount: number;
  }> {
    const context = { function: 'extractPageContent', file: 'website-crawler.ts', url };

    try {
      const result = await page.evaluate(() => {
        // Extract title
        const title = document.title || '';

        // Extract meta description
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || undefined;

        // Extract headings
        const headings: { level: number; text: string; id?: string }[] = [];
        for (let level = 1; level <= 6; level++) {
          const elements = document.querySelectorAll(`h${level}`);
          elements.forEach(el => {
            const text = el.textContent?.trim() || '';
            const id = el.id || undefined;
            if (text) {
              headings.push({ level, text, id });
            }
          });
        }

        // Extract main content
        // Try to find the main content area
        let mainContent = '';

        // Priority order for content containers
        const contentSelectors = [
          'main',
          'article',
          '[role="main"]',
          '.content',
          '.main-content',
          '#content',
          '#main',
          '.post-content',
          '.entry-content',
          'article',
          'body' // fallback
        ];

        let contentElement: Element | null = null;
        for (const selector of contentSelectors) {
          contentElement = document.querySelector(selector);
          if (contentElement) {
            // Make sure we're not just getting navigation
            const textContent = contentElement.textContent || '';
            if (textContent.length > 200) {
              break;
            }
          }
        }

        if (contentElement) {
          // Clone to avoid modifying the page
          const clone = contentElement.cloneNode(true) as Element;

          // Remove navigation, footer, etc.
          const unwanted = clone.querySelectorAll('nav, footer, header, .navigation, .footer, .sidebar, .menu, [role="navigation"], [role="complementary"], script, style, noscript');
          unwanted.forEach(el => el.remove());

          mainContent = clone.textContent || '';
        }

        // Clean up the content
        const cleanContent = mainContent
          .replace(/\s+/g, ' ')  // Collapse whitespace
          .replace(/\n\s*\n/g, '\n\n')  // Preserve paragraph breaks
          .trim();

        const wordCount = cleanContent.split(/\s+/).filter(w => w.length > 0).length;
        const charCount = cleanContent.length;

        return {
          title,
          metaDescription,
          content: cleanContent,
          headings,
          wordCount,
          charCount
        };
      });

      logger.debug('Content extracted', context, {
        titleLength: result.title.length,
        wordCount: result.wordCount,
        headingCount: result.headings.length
      });

      return result;
    } catch (error) {
      logger.warn('Error extracting page content', context, error);
      return {
        title: '',
        content: '',
        headings: [],
        wordCount: 0,
        charCount: 0
      };
    }
  }

  /**
   * Download and process a PDF
   */
  private async processPDF(download: any, url: string): Promise<CrawledPage | null> {
    const context = { function: 'processPDF', file: 'website-crawler.ts', url };

    try {
      // Check file size before downloading
      const suggestedFilename = download.suggestedFilename();
      logger.debug('Starting PDF download', context, { filename: suggestedFilename });

      // Get the download as a buffer
      const path = await download.path();
      if (!path) {
        throw new Error('Download path not available');
      }

      // Read the file
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(path);

      // Check size
      if (buffer.length > this.config.maxPDFSize) {
        logger.warn('PDF too large, skipping', context, {
          size: buffer.length,
          maxSize: this.config.maxPDFSize
        });
        return null;
      }

      // Extract text
      const text = await parsePDF(buffer);

      // Extract title from filename or content
      let title = suggestedFilename.replace('.pdf', '').replace(/[-_]/g, ' ');

      // Try to get a better title from the first line
      const lines = text.split('\n');
      if (lines.length > 0 && lines[0].length > 10 && lines[0].length < 100) {
        title = lines[0].trim();
      }

      // Count pages (separated by "--- Page X ---")
      const pageCount = (text.match(/--- Page \d+ ---/g) || []).length;

      // Clean content
      const cleanContent = text
        .replace(/--- Page \d+ ---/g, '\n\n')
        .replace(/\s+/g, ' ')
        .trim();

      const result: CrawledPage = {
        url,
        title,
        content: cleanContent,
        headings: [],
        links: [],
        contentType: 'pdf',
        crawledAt: new Date().toISOString(),
        metadata: {
          wordCount: cleanContent.split(/\s+/).filter(w => w.length > 0).length,
          charCount: cleanContent.length,
          pageCount,
          fileSize: buffer.length,
          isDownload: true
        }
      };

      // Clean up temp file
      try {
        await fs.unlink(path);
      } catch {
        // Ignore cleanup errors
      }

      logger.info('PDF processed successfully', context, {
        pageCount,
        wordCount: result.metadata.wordCount,
        fileSize: buffer.length
      });

      return result;
    } catch (error) {
      logger.error('Error processing PDF', context, error);
      return null;
    }
  }

  /**
   * Process a document link (non-PDF)
   */
  private async processDocument(url: string): Promise<CrawledPage | null> {
    const context = { function: 'processDocument', file: 'website-crawler.ts', url };

    try {
      logger.debug('Processing document URL', context);

      // For now, just return a placeholder
      // In a full implementation, you'd download and parse DOCX, XLSX, etc.
      const result: CrawledPage = {
        url,
        title: new URL(url).pathname.split('/').pop() || 'Document',
        content: '[Document content not extracted - format not supported]',
        headings: [],
        links: [],
        contentType: 'document',
        crawledAt: new Date().toISOString(),
        metadata: {
          wordCount: 0,
          charCount: 0,
          isDownload: true
        }
      };

      return result;
    } catch (error) {
      logger.warn('Error processing document', context, error);
      return null;
    }
  }

  /**
   * Crawl a single URL
   */
  private async crawlUrl(url: string, isInitial = false): Promise<CrawledPage | null> {
    const normalizedUrl = this.normalizeUrl(url);
    const context = { function: 'crawlUrl', file: 'website-crawler.ts', url: normalizedUrl };

    // Check if already crawled
    if (this.crawledUrls.has(normalizedUrl)) {
      logger.debug('URL already crawled, skipping', context);
      return null;
    }

    // Check if URL is allowed
    if (!this.isUrlAllowed(normalizedUrl)) {
      logger.debug('URL not allowed, skipping', context);
      return null;
    }

    // Check if it's a document
    const docType = this.isDocumentUrl(normalizedUrl);
    if (docType === 'pdf' && this.config.processPDFs) {
      // Need to navigate first to trigger download
      logger.debug('PDF detected, navigating to trigger download', context);
    } else if (docType === 'document' && this.config.processDocuments) {
      const result = await this.processDocument(normalizedUrl);
      if (result) {
        this.crawledUrls.add(normalizedUrl);
        this.crawledPages.push(result);
      }
      return result;
    }

    // Ensure browser is initialized
    await this.initBrowser();
    if (!this.page) throw new Error('Page not initialized');

    try {
      logger.info('Crawling URL', context, { isInitial });

      // Set up download handler for PDFs
      let pdfDownload: any = null;
      if (docType === 'pdf') {
        const downloadPromise = this.page.waitForEvent('download', { timeout: 30000 });
        this.page.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: this.config.pageTimeout }).catch(() => {});
        pdfDownload = await Promise.race([
          downloadPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Download timeout')), 35000))
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
      const response = await this.page.goto(normalizedUrl, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.pageTimeout
      });

      if (!response) {
        throw new Error('No response received');
      }

      const status = response.status();

      // Check for redirects
      const finalUrl = this.page.url();
      const normalizedFinalUrl = this.normalizeUrl(finalUrl);

      // Handle redirects
      if (normalizedFinalUrl !== normalizedUrl) {
        logger.debug('URL redirected', context, {
          from: normalizedUrl,
          to: normalizedFinalUrl
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

      // Check content type
      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('application/pdf')) {
        // PDF that wasn't detected by extension
        logger.debug('PDF detected by content-type', context);
        // Try to get download
        const downloadPromise = this.page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await this.page.waitForTimeout(1000);
        const download = await downloadPromise;
        if (download) {
          const result = await this.processPDF(download, normalizedFinalUrl);
          if (result) {
            this.crawledPages.push(result);
          }
          return result;
        }
        return null;
      }

      // Wait for page to fully load
      await this.waitForPageLoad(this.page);

      // Extract content
      const { title, content, headings, description, wordCount, charCount } =
        await this.extractPageContent(this.page, normalizedFinalUrl);

      // Extract links
      const links = await this.extractLinks(this.page, normalizedFinalUrl);

      const result: CrawledPage = {
        url: normalizedFinalUrl,
        title,
        content,
        headings,
        links,
        contentType: 'html',
        status,
        crawledAt: new Date().toISOString(),
        metadata: {
          description,
          wordCount,
          charCount,
          originalUrl: normalizedUrl !== normalizedFinalUrl ? normalizedUrl : undefined
        }
      };

      this.crawledPages.push(result);

      logger.info('Page crawled successfully', context, {
        title,
        wordCount,
        linkCount: links.length,
        status
      });

      // Queue discovered links
      for (const link of links) {
        const normalizedLink = this.normalizeUrl(link);
        if (!this.crawledUrls.has(normalizedLink) &&
            !this.queuedUrls.has(normalizedLink) &&
            this.isUrlAllowed(normalizedLink)) {
          this.queuedUrls.add(normalizedLink);
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Failed to crawl URL', context, error);

      this.crawlErrors.push({
        url: normalizedUrl,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });

      return null;
    }
  }

  /**
   * Main crawl method
   */
  async crawl(startUrl: string): Promise<CrawlerResult> {
    const context = { function: 'crawl', file: 'website-crawler.ts', url: startUrl };

    // Reset state for new crawl
    this.crawledUrls.clear();
    this.queuedUrls.clear();
    this.crawlErrors = [];
    this.crawledPages = [];
    this.startTime = Date.now();

    try {
      // Extract base domain from start URL
      this.baseDomain = this.extractDomain(startUrl);
      logger.info('Starting crawl', context, {
        baseDomain: this.baseDomain,
        maxPages: this.config.maxPages,
        sameDomainOnly: this.config.sameDomainOnly
      });

      // Validate start URL
      if (!this.baseDomain) {
        throw new Error('Invalid start URL');
      }

      // Crawl the initial URL
      await this.crawlUrl(startUrl, true);

      // Crawl discovered URLs up to the limit
      while (this.queuedUrls.size > 0 && this.crawledUrls.size < this.config.maxPages) {
        // Get next URL from queue (FIFO-ish)
        const nextUrl = this.queuedUrls.values().next().value;
        this.queuedUrls.delete(nextUrl);

        // Respectful delay between requests
        if (this.crawledUrls.size > 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.requestDelay));
        }

        await this.crawlUrl(nextUrl);
      }

      // Calculate stats
      const duration = Date.now() - this.startTime;
      const uniqueDomains = new Set(
        this.crawledPages.map(p => this.extractDomain(p.url))
      ).size;

      const totalContentSize = this.crawledPages.reduce(
        (sum, p) => sum + (p.metadata.charCount || 0),
        0
      );

      const pdfsProcessed = this.crawledPages.filter(p => p.contentType === 'pdf').length;
      const documentsProcessed = this.crawledPages.filter(p => p.contentType === 'document').length;

      const stats: CrawlerStats = {
        totalPages: this.crawledUrls.size,
        successfulPages: this.crawledPages.length,
        failedPages: this.crawlErrors.length,
        pdfsProcessed,
        documentsProcessed,
        totalContentSize,
        uniqueDomains,
        duration
      };

      logger.info('Crawl completed', context, stats);

      return {
        pages: this.crawledPages,
        errors: this.crawlErrors,
        stats
      };
    } catch (error) {
      logger.error('Crawl failed', context, error);
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
      errors: this.crawlErrors.length
    };
  }
}

/**
 * Convenience function to crawl a website
 */
export async function crawlWebsite(
  url: string,
  config?: CrawlerConfig
): Promise<CrawlerResult> {
  const crawler = new WebsiteCrawler(config);
  return crawler.crawl(url);
}

/**
 * Convenience function to crawl a single page
 */
export async function crawlSinglePage(
  url: string,
  config?: CrawlerConfig
): Promise<CrawledPage | null> {
  const crawler = new WebsiteCrawler(config);
  return crawler.crawlSingle(url);
}
