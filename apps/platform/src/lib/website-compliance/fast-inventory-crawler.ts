import type {
  CrawledPage,
  CrawlError,
  CrawlerResult,
  CrawlerStats,
  PageHeading,
} from "@/lib/website-crawler";
import { parseDocx, parseExcel, parsePDF } from "@/lib/extractors";

type InventorySource = "school" | "trust";

export interface FastInventoryCrawlerConfig {
  maxPages?: number;
  delayMs?: number;
  timeoutMs?: number;
  seedUrls?: string[];
  source?: InventorySource;
  includeDocuments?: boolean;
  extractDocumentText?: boolean;
  maxDocumentsToExtract?: number;
  maxDocumentBytes?: number;
  documentConcurrency?: number;
  userAgent?: string;
}

interface FetchResult {
  ok: boolean;
  status: number;
  finalUrl: string;
  contentType: string;
  text: string;
  error?: string;
}

interface InventoryDocument {
  url: string;
  foundOnPage: string;
  linkText: string;
  source: InventorySource;
}

interface DocumentExtractionResult {
  text: string;
  contentType: CrawledPage["contentType"];
  fileSize?: number;
  pageCount?: number;
  extractionMethod?: string;
  error?: string;
}

const DEFAULT_USER_AGENT = "Schoolgle-Compliance/1.0 (+https://schoolgle.co.uk)";
const DEFAULT_PAGE_LIMIT = 150;
const DEFAULT_DELAY_MS = 75;
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_DOCUMENTS_TO_EXTRACT = 120;
const DEFAULT_MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
const DEFAULT_DOCUMENT_CONCURRENCY = 4;

const DOCUMENT_EXTENSION = /\.(pdf|docx?|xlsx?|pptx?|csv|txt)(?:[?#].*)?$/i;
const DOCUMENT_HOST_OR_PATH =
  /(?:drive\.google\.com\/(?:file|embeddedfolderview|drive\/folders)|docs\.google\.com|sites\.google\.com|download\.asp\?|type=pdf)/i;

const IGNORED_HOST_PARTS = [
  "google-analytics.com",
  "googletagmanager.com",
  "cdnjs.cloudflare.com",
  "use.typekit.net",
  "facebook.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "linkedin.com",
  "parentpay",
  "microsoft.com",
  "apple.com",
  "mailto:",
  "tel:",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 10)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    );
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function repairSchoolJotterPageUrl(value: string): string {
  const match = value.match(/^(.*\/page)\/?\?title=([\s\S]*)&pid=(\d+)$/);
  if (!match) return value;

  const [, pagePath, rawTitle, pageId] = match;
  const title = rawTitle.replaceAll("+", " ");
  return `${pagePath}/?title=${encodeURIComponent(title)}&pid=${pageId}`;
}

function normaliseUrl(value: string, baseUrl: string): string | null {
  try {
    const parsed = new URL(
      repairSchoolJotterPageUrl(decodeHtmlEntities(value)),
      baseUrl,
    );
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function hostname(value: string): string {
  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function rootUrl(value: string): string {
  const parsed = new URL(value.includes("://") ? value : `https://${value}`);
  return `${parsed.protocol}//${parsed.hostname}/`;
}

function isIgnored(url: string): boolean {
  const lower = url.toLowerCase();
  return IGNORED_HOST_PARTS.some((ignored) => lower.includes(ignored));
}

function isDocumentLike(url: string): boolean {
  try {
    const parsed = new URL(url);
    return DOCUMENT_EXTENSION.test(parsed.pathname) || DOCUMENT_HOST_OR_PATH.test(url);
  } catch {
    return DOCUMENT_HOST_OR_PATH.test(url);
  }
}

function googleDriveFolderId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "drive.google.com") return null;

    if (parsed.pathname.includes("/embeddedfolderview")) {
      return parsed.searchParams.get("id");
    }

    const folderMatch = parsed.pathname.match(/\/drive\/folders\/([^/]+)/);
    return folderMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

function isGoogleDriveFolderUrl(url: string): boolean {
  return Boolean(googleDriveFolderId(url));
}

function toEmbeddedGoogleDriveFolderUrl(url: string): string | null {
  const folderId = googleDriveFolderId(url);
  return folderId
    ? `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`
    : null;
}

async function fetchText(
  url: string,
  timeoutMs: number,
  userAgent: string,
): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xml,text/xml,*/*",
        "user-agent": userAgent,
      },
    });

    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get("content-type") || "",
      text: await response.text(),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      contentType: "",
      text: "",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function extractLocs(xml: string, baseUrl: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
    .map((match) => normaliseUrl(match[1].trim(), baseUrl))
    .filter((url): url is string => Boolean(url));
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const patterns = [
    /href=["']([^"']+)["']/gi,
    /src=["']([^"']+)["']/gi,
    /data-href=["']([^"']+)["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const link = normaliseUrl(match[1], baseUrl);
      if (link && !isIgnored(link)) links.add(link);
    }
  }

  return [...links];
}

function extractGoogleDriveFolderDocuments(
  html: string,
  folderUrl: string,
  foundOnPage: string,
  source: InventorySource,
): InventoryDocument[] {
  const documents = new Map<string, InventoryDocument>();
  const anchorPattern =
    /<a\b[^>]*href=["']([^"']*drive\.google\.com\/file\/d\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const url = normaliseUrl(match[1], folderUrl);
    if (!url || isIgnored(url)) continue;

    const linkText = stripHtml(match[2]).slice(0, 500);
    documents.set(url, {
      url,
      foundOnPage,
      linkText,
      source,
    });
  }

  return [...documents.values()];
}

function extractDocumentLinks(
  html: string,
  baseUrl: string,
  source: InventorySource,
): InventoryDocument[] {
  const documents = new Map<string, InventoryDocument>();
  const anchorPattern =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const url = normaliseUrl(match[1], baseUrl);
    if (!url || !isDocumentLike(url) || isIgnored(url)) continue;

    documents.set(url, {
      url,
      foundOnPage: baseUrl,
      linkText: stripHtml(match[2]).slice(0, 500),
      source,
    });
  }

  for (const link of extractLinks(html, baseUrl)) {
    if (!isDocumentLike(link) || documents.has(link)) continue;
    documents.set(link, {
      url: link,
      foundOnPage: baseUrl,
      linkText: "",
      source,
    });
  }

  return [...documents.values()];
}

function extractTitle(html: string): string {
  return decodeHtmlEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDescription(html: string): string {
  return decodeHtmlEntities(
    html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)/i)
      ?.[1] || "",
  )
    .replace(/\s+/g, " ")
    .trim();
}

function extractHeadings(html: string): PageHeading[] {
  return [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map((match) => ({
      level: Number(match[1]),
      text: stripHtml(match[2]),
    }))
    .filter((heading) => heading.text.length > 0)
    .slice(0, 50);
}

function detectDocumentContentType(url: string): CrawledPage["contentType"] {
  const lower = url.toLowerCase();
  if (lower.includes(".pdf") || lower.includes("type=pdf")) return "pdf";
  if (DOCUMENT_EXTENSION.test(lower) || DOCUMENT_HOST_OR_PATH.test(lower)) {
    return "document";
  }
  return "other";
}

function filenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const filename = decodeURIComponent(parsed.pathname.split("/").pop() || "");
    return filename || parsed.hostname;
  } catch {
    return url;
  }
}

function resolveDownloadUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "drive.google.com") {
      const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
      if (fileMatch) {
        return `https://drive.google.com/uc?id=${fileMatch[1]}&export=download`;
      }
    }
    if (parsed.hostname === "docs.google.com") {
      const docMatch = parsed.pathname.match(/\/document\/d\/([^/]+)/);
      if (docMatch) {
        return `https://docs.google.com/document/d/${docMatch[1]}/export?format=pdf`;
      }
    }
  } catch {
    return url;
  }
  return url;
}

function documentFileType(url: string, contentType = ""):
  | "pdf"
  | "docx"
  | "xlsx"
  | "csv"
  | "txt"
  | "unsupported" {
  const lowerType = contentType.toLowerCase();
  let lowerPath = url.toLowerCase();
  try {
    lowerPath = new URL(url).pathname.toLowerCase();
  } catch {
    // Keep original lower-cased value.
  }

  if (lowerType.includes("pdf") || lowerPath.endsWith(".pdf")) return "pdf";
  if (
    lowerType.includes("wordprocessingml") ||
    lowerPath.endsWith(".docx")
  ) {
    return "docx";
  }
  if (
    lowerType.includes("spreadsheetml") ||
    lowerPath.endsWith(".xlsx") ||
    lowerPath.endsWith(".xls")
  ) {
    return "xlsx";
  }
  if (lowerType.includes("csv") || lowerPath.endsWith(".csv")) return "csv";
  if (lowerType.includes("text/plain") || lowerPath.endsWith(".txt")) {
    return "txt";
  }
  return "unsupported";
}

function detectDownloadedDocumentFileType(
  url: string,
  contentType: string,
  buffer: Buffer,
  filename?: string | null,
): ReturnType<typeof documentFileType> {
  const typeFromFilename = filename
    ? documentFileType(filename, contentType)
    : "unsupported";
  if (typeFromFilename !== "unsupported") return typeFromFilename;

  const typeFromUrl = documentFileType(url, contentType);
  if (typeFromUrl !== "unsupported") return typeFromUrl;

  if (buffer.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";

  return "unsupported";
}

function contentDispositionFilename(value: string | null): string | null {
  if (!value) return null;
  const utfMatch = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch) return decodeURIComponent(utfMatch[1].trim());

  const quotedMatch = value.match(/filename="([^"]+)"/i);
  if (quotedMatch) return quotedMatch[1].trim();

  const plainMatch = value.match(/filename=([^;]+)/i);
  return plainMatch?.[1]?.trim() ?? null;
}

function cleanDocumentText(text: string): string {
  const cleaned = decodeHtmlEntities(text)
    .replace(/--- Page \d+ ---/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

  if (
    !cleaned ||
    cleaned.startsWith("[PDF extraction error") ||
    cleaned.startsWith("[Invalid or corrupted PDF") ||
    cleaned.startsWith("[PDF is password-protected") ||
    cleaned.startsWith("[No text content found")
  ) {
    return "";
  }

  return cleaned;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function fetchDocumentBuffer(
  url: string,
  timeoutMs: number,
  userAgent: string,
  maxBytes: number,
): Promise<{
  buffer: Buffer;
  contentType: string;
  finalUrl: string;
  filename: string | null;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept:
          "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,*/*;q=0.7",
        "User-Agent": userAgent,
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentLength = Number(response.headers.get("content-length") || "0");
    if (contentLength > maxBytes) {
      throw new Error(
        `Document is ${contentLength} bytes, over ${maxBytes} byte limit`,
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxBytes) {
      throw new Error(
        `Document is ${buffer.length} bytes, over ${maxBytes} byte limit`,
      );
    }

    return {
      buffer,
      contentType: response.headers.get("content-type") || "",
      finalUrl: response.url || url,
      filename: contentDispositionFilename(
        response.headers.get("content-disposition"),
      ),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function extractDocumentText(
  document: InventoryDocument,
  timeoutMs: number,
  userAgent: string,
  maxBytes: number,
): Promise<DocumentExtractionResult> {
  try {
    const downloadUrl = resolveDownloadUrl(document.url);
    const { buffer, contentType, finalUrl, filename } = await fetchDocumentBuffer(
      downloadUrl,
      timeoutMs,
      userAgent,
      maxBytes,
    );
    const fileType = detectDownloadedDocumentFileType(
      finalUrl || document.url,
      contentType,
      buffer,
      filename || document.linkText,
    );

    if (fileType === "unsupported") {
      return {
        text: "",
        contentType: detectDocumentContentType(document.url),
        fileSize: buffer.length,
        error: `Unsupported document content type: ${contentType || "unknown"}`,
      };
    }

    let rawText = "";
    let extractionMethod = "native";
    if (fileType === "pdf") {
      rawText = await withTimeout(
        parsePDF(buffer),
        timeoutMs,
        "PDF text extraction timed out",
      );
      extractionMethod = "pdf";
    } else if (fileType === "docx") {
      rawText = await withTimeout(
        parseDocx(buffer),
        timeoutMs,
        "DOCX text extraction timed out",
      );
      extractionMethod = "mammoth";
    } else if (fileType === "xlsx") {
      rawText = await withTimeout(
        parseExcel(buffer),
        timeoutMs,
        "Spreadsheet text extraction timed out",
      );
      extractionMethod = "xlsx";
    } else if (fileType === "csv" || fileType === "txt") {
      rawText = buffer.toString("utf8");
      extractionMethod = fileType;
    }

    const text = cleanDocumentText(rawText);
    return {
      text,
      contentType: fileType === "pdf" ? "pdf" : "document",
      fileSize: buffer.length,
      pageCount: fileType === "pdf" ? (rawText.match(/--- Page \d+ ---/g) || []).length : undefined,
      extractionMethod,
      error: text ? undefined : "No readable text extracted",
    };
  } catch (error) {
    return {
      text: "",
      contentType: detectDocumentContentType(document.url),
      error: error instanceof Error ? error.message : "Document extraction failed",
    };
  }
}

const DOCUMENT_EXTRACTION_PRIORITY_TERMS = [
  "policy",
  "safeguarding",
  "child protection",
  "kcsie",
  "send",
  "sen",
  "pupil premium",
  "sport premium",
  "attendance",
  "behaviour",
  "curriculum",
  "accessibility",
  "equality",
  "admission",
  "governance",
  "complaints",
  "charging",
  "privacy",
  "data protection",
  "remote education",
  "careers",
  "exam",
  "performance",
  "results",
  "whistleblowing",
  "health and safety",
  "risk assessment",
  "financial",
  "accounts",
  "trustees",
  "pshe",
  "rshe",
  "rse",
  "wellbeing",
  "ofsted",
];

const PAGE_CRAWL_PRIORITY_TERMS = [
  "policies-and-documents",
  "policy",
  "policies",
  "safeguarding",
  "send",
  "sen",
  "curriculum",
  "reading",
  "phonics",
  "writing",
  "maths",
  "mathematics",
  "science",
  "history",
  "geography",
  "art",
  "design-technology",
  "design technology",
  "music",
  "computing",
  "modern-foreign-language",
  "modern foreign language",
  "religious-education",
  "religious education",
  "physical-education",
  "physical education",
  "pshe",
  "rhe",
  "governance",
  "key-information",
  "ofsted",
  "pupil-premium",
  "sports-premium",
  "attendance",
  "behaviour",
  "equality",
  "accessibility",
];

function scorePageCrawlPriority(url: string): number {
  const haystack = decodeURIComponent(url)
    .toLowerCase()
    .replace(/[-_]+/g, " ");
  let score = 0;

  for (const term of PAGE_CRAWL_PRIORITY_TERMS) {
    if (haystack.includes(term.replace(/[-_]+/g, " "))) score += 10;
  }

  if (haystack.includes("policies and documents")) score += 30;
  if (haystack.includes("phonics")) score += 5;
  if (/\/(?:reading|phonics|writing|maths|science|history|geography|art|music|computing)(?:\/|$)/.test(haystack)) {
    score += 30;
  }

  return score;
}

function sortPageQueueByPriority(urls: string[]): string[] {
  return urls
    .map((url, index) => ({ url, index, score: scorePageCrawlPriority(url) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((item) => item.url);
}

function isSoftNotFoundPage(page: {
  url: string;
  title?: string | null;
  content?: string | null;
  status?: number | null;
}): boolean {
  if (page.status && page.status >= 400) return true;

  const title = (page.title || "").toLowerCase();
  const content = (page.content || "").toLowerCase();
  const combined = `${title} ${content}`;

  if (
    title.includes("page not found") ||
    title.includes("404") ||
    combined.includes("oops! that page") ||
    combined.includes("the page you are looking for could not be found")
  ) {
    return true;
  }

  return false;
}

function scoreDocumentExtractionPriority(document: InventoryDocument): number {
  const haystack = `${document.url} ${document.linkText} ${document.foundOnPage}`
    .toLowerCase()
    .replace(/[-_]+/g, " ");

  let score = detectDocumentContentType(document.url) === "pdf" ? 2 : 1;
  if (document.source === "trust") score += 1;

  for (const term of DOCUMENT_EXTRACTION_PRIORITY_TERMS) {
    if (haystack.includes(term)) score += 4;
  }

  if (/20\d{2}\s*(?:[-–—/]|%e2%80%93|%E2%80%93)\s*(?:20)?\d{2}/.test(haystack)) {
    score += 3;
  }

  return score;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, items.length)) },
    async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(items[currentIndex]);
      }
    },
  );

  await Promise.all(workers);
  return results;
}

async function discoverSitemapUrls(
  siteRoot: string,
  timeoutMs: number,
  userAgent: string,
): Promise<string[]> {
  const pageUrls = new Set<string>();
  const sitemapUrls = new Set<string>([
    new URL("/sitemap.xml", siteRoot).href,
    new URL("/wp-sitemap.xml", siteRoot).href,
    new URL("/sitemap_index.xml", siteRoot).href,
  ]);

  const robotsUrl = new URL("/robots.txt", siteRoot).href;
  const robots = await fetchText(robotsUrl, timeoutMs, userAgent);
  for (const match of robots.text.matchAll(/^\s*Sitemap:\s*(\S+)\s*$/gim)) {
    const sitemap = normaliseUrl(match[1], siteRoot);
    if (sitemap) sitemapUrls.add(sitemap);
  }

  const visitedSitemaps = new Set<string>();

  async function visitSitemap(sitemapUrl: string, depth = 0): Promise<void> {
    if (depth > 4 || visitedSitemaps.has(sitemapUrl)) return;
    visitedSitemaps.add(sitemapUrl);

    const response = await fetchText(sitemapUrl, timeoutMs, userAgent);
    if (!response.text) return;

    const locs = extractLocs(response.text, response.finalUrl || sitemapUrl);
    const isIndex = /<sitemapindex/i.test(response.text);

    for (const loc of locs) {
      if (isIndex || /sitemap.*\.xml/i.test(loc)) {
        await visitSitemap(loc, depth + 1);
      } else {
        pageUrls.add(loc);
      }
    }
  }

  for (const sitemapUrl of sitemapUrls) {
    await visitSitemap(sitemapUrl);
  }

  return [...pageUrls];
}

async function fallbackHomepageLinks(
  siteRoot: string,
  limit: number,
  timeoutMs: number,
  userAgent: string,
): Promise<string[]> {
  const queued = [siteRoot];
  const seen = new Set<string>();
  const found = new Set<string>([siteRoot]);
  const siteHost = hostname(siteRoot);

  while (queued.length > 0 && found.size < limit) {
    const nextUrl = queued.shift();
    if (!nextUrl || seen.has(nextUrl)) continue;
    seen.add(nextUrl);

    const response = await fetchText(nextUrl, timeoutMs, userAgent);
    if (!/html/i.test(response.contentType)) continue;

    for (const link of extractLinks(response.text, response.finalUrl || nextUrl)) {
      if (hostname(link) !== siteHost || seen.has(link) || found.has(link)) {
        continue;
      }
      found.add(link);
      queued.push(link);
      if (found.size >= limit) break;
    }
  }

  return [...found];
}

async function discoverSitePages(
  siteRoot: string,
  limit: number,
  timeoutMs: number,
  userAgent: string,
  seedUrls: string[],
): Promise<string[]> {
  const sitemapUrls = await discoverSitemapUrls(siteRoot, timeoutMs, userAgent);
  const discovered =
    sitemapUrls.length > 0
      ? sitemapUrls
      : await fallbackHomepageLinks(siteRoot, limit, timeoutMs, userAgent);
  const siteHost = hostname(siteRoot);
  const sameSiteSeeds = seedUrls.filter((seedUrl) => hostname(seedUrl) === siteHost);

  return [...new Set([siteRoot, ...sameSiteSeeds, ...discovered])]
    .filter((url) => !isDocumentLike(url))
    .slice(0, limit);
}

function buildDocumentPage(
  document: InventoryDocument,
  extraction?: DocumentExtractionResult,
): CrawledPage {
  const contentType = extraction?.contentType || detectDocumentContentType(document.url);
  const title = decodeHtmlEntities(
    document.linkText || filenameFromUrl(document.url),
  );
  const extractedText = extraction?.text || "";
  const content = extractedText ? `${title}\n${extractedText}` : title;
  const words = content.split(/\s+/).filter(Boolean);

  return {
    url: document.url,
    title,
    content,
    headings: [],
    links: [],
    contentType,
    crawledAt: new Date().toISOString(),
    metadata: {
      wordCount: words.length,
      charCount: content.length,
      pageCount: extraction?.pageCount,
      fileSize: extraction?.fileSize,
      isDownload: true,
      source: document.source,
      linkText: document.linkText,
      foundOnPage: document.foundOnPage,
      textExtractionMethod: extraction?.extractionMethod,
      extractionError: extraction?.error,
    } as CrawledPage["metadata"] & {
      source: InventorySource;
      linkText?: string;
      foundOnPage?: string;
      textExtractionMethod?: string;
      extractionError?: string;
    },
  };
}

export async function fastInventoryCrawlWebsite(
  startUrl: string,
  config: FastInventoryCrawlerConfig = {},
): Promise<CrawlerResult & { backend: "inventory" }> {
  const startedAt = Date.now();
  const siteRoot = rootUrl(startUrl);
  const source = config.source || "school";
  const maxPages = config.maxPages || DEFAULT_PAGE_LIMIT;
  const delayMs = config.delayMs ?? DEFAULT_DELAY_MS;
  const timeoutMs = config.timeoutMs || DEFAULT_TIMEOUT_MS;
  const userAgent = config.userAgent || DEFAULT_USER_AGENT;
  const includeDocuments = config.includeDocuments ?? true;
  const extractDocumentTextEnabled = config.extractDocumentText ?? true;
  const maxDocumentsToExtract =
    config.maxDocumentsToExtract ?? DEFAULT_MAX_DOCUMENTS_TO_EXTRACT;
  const maxDocumentBytes =
    config.maxDocumentBytes ?? DEFAULT_MAX_DOCUMENT_BYTES;
  const documentConcurrency =
    config.documentConcurrency ?? DEFAULT_DOCUMENT_CONCURRENCY;
  const errors: CrawlError[] = [];
  const pages: CrawledPage[] = [];
  const documents = new Map<string, InventoryDocument>();
  const driveFolders = new Map<string, InventoryDocument>();

  const initialPageUrls = await discoverSitePages(
    siteRoot,
    maxPages,
    timeoutMs,
    userAgent,
    config.seedUrls || [],
  );
  const pageQueue = [...initialPageUrls];
  const queuedPageUrls = new Set(pageQueue);
  const visitedPageUrls = new Set<string>();

  while (pageQueue.length > 0 && visitedPageUrls.size < maxPages) {
    const pageUrl = pageQueue.shift();
    if (!pageUrl || visitedPageUrls.has(pageUrl)) continue;
    visitedPageUrls.add(pageUrl);

    if (delayMs > 0) await sleep(delayMs);

    const response = await fetchText(pageUrl, timeoutMs, userAgent);
    if (!response.ok && response.error) {
      errors.push({
        url: pageUrl,
        error: response.error,
        timestamp: new Date().toISOString(),
      });
    }

    if (!/html/i.test(response.contentType) || !response.text) continue;

    const finalUrl = response.finalUrl || pageUrl;
    const content = stripHtml(response.text);
    const links = extractLinks(response.text, finalUrl);
    const page: CrawledPage = {
      url: finalUrl,
      title: extractTitle(response.text),
      content,
      headings: extractHeadings(response.text),
      links,
      contentType: "html",
      status: response.status,
      crawledAt: new Date().toISOString(),
      metadata: {
        description: extractDescription(response.text),
        wordCount: content.split(/\s+/).filter(Boolean).length,
        charCount: content.length,
        originalUrl: pageUrl !== finalUrl ? pageUrl : undefined,
        source,
      } as CrawledPage["metadata"] & { source: InventorySource },
    };

    const isSoftNotFound = isSoftNotFoundPage(page);
    if (!isSoftNotFound) {
      pages.push(page);
    }

    const discoveredPageLinks: string[] = [];
    for (const link of links) {
      if (
        hostname(link) !== hostname(siteRoot) ||
        isDocumentLike(link) ||
        visitedPageUrls.has(link) ||
        queuedPageUrls.has(link)
      ) {
        continue;
      }
      discoveredPageLinks.push(link);
    }

    if (discoveredPageLinks.length > 0) {
      for (const link of sortPageQueueByPriority(discoveredPageLinks)) {
        queuedPageUrls.add(link);
        pageQueue.push(link);
      }
      pageQueue.sort(
        (left, right) =>
          scorePageCrawlPriority(right) - scorePageCrawlPriority(left),
      );
    }

    if (includeDocuments && !isSoftNotFound) {
      for (const document of extractDocumentLinks(response.text, finalUrl, source)) {
        if (isGoogleDriveFolderUrl(document.url)) {
          if (!driveFolders.has(document.url)) driveFolders.set(document.url, document);
          continue;
        }
        if (!documents.has(document.url)) documents.set(document.url, document);
      }
    }
  }

  if (includeDocuments) {
    if (driveFolders.size > 0) {
      const folderResults = await mapWithConcurrency(
        [...driveFolders.values()],
        Math.min(2, documentConcurrency),
        async (folder) => {
          const embeddedUrl = toEmbeddedGoogleDriveFolderUrl(folder.url);
          if (!embeddedUrl) return [];

          const response = await fetchText(embeddedUrl, timeoutMs, userAgent);
          if (!response.ok || !response.text) {
            errors.push({
              url: folder.url,
              error: response.error || `HTTP ${response.status}`,
              timestamp: new Date().toISOString(),
            });
            return [];
          }

          return extractGoogleDriveFolderDocuments(
            response.text,
            response.finalUrl || embeddedUrl,
            folder.foundOnPage,
            folder.source,
          );
        },
      );

      for (const folderDocuments of folderResults) {
        for (const document of folderDocuments) {
          if (!documents.has(document.url)) documents.set(document.url, document);
        }
      }
    }

    const documentList = [...documents.values()];
    const extractionTargets = extractDocumentTextEnabled
      ? documentList
          .map((document) => ({
            document,
            score: scoreDocumentExtractionPriority(document),
          }))
          .filter((target) => target.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, maxDocumentsToExtract)
      : [];

    const extractedDocuments = new Map<string, DocumentExtractionResult>();
    const extractionResults = await mapWithConcurrency(
      extractionTargets,
      documentConcurrency,
      async ({ document }) => ({
        url: document.url,
        result: await extractDocumentText(
          document,
          timeoutMs,
          userAgent,
          maxDocumentBytes,
        ),
      }),
    );

    for (const extraction of extractionResults) {
      extractedDocuments.set(extraction.url, extraction.result);
    }

    for (const document of documentList) {
      pages.push(buildDocumentPage(document, extractedDocuments.get(document.url)));
    }
  }

  const uniqueDomains = new Set(pages.map((page) => hostname(page.url))).size;
  const totalContentSize = pages.reduce(
    (sum, page) => sum + (page.metadata.charCount || 0),
    0,
  );
  const pdfsProcessed = pages.filter((page) => page.contentType === "pdf").length;
  const documentsProcessed = pages.filter(
    (page) => page.contentType === "document",
  ).length;
  const stats: CrawlerStats = {
    totalPages: visitedPageUrls.size + documents.size,
    successfulPages: pages.length,
    failedPages: errors.length,
    pdfsProcessed,
    documentsProcessed,
    totalContentSize,
    uniqueDomains,
    duration: Date.now() - startedAt,
  };

  return {
    pages,
    errors,
    stats,
    backend: "inventory",
  };
}

export const __fastInventoryCrawlerTestables = {
  detectDownloadedDocumentFileType,
  extractGoogleDriveFolderDocuments,
  isGoogleDriveFolderUrl,
  isSoftNotFoundPage,
  scorePageCrawlPriority,
  sortPageQueueByPriority,
  toEmbeddedGoogleDriveFolderUrl,
};
