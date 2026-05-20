#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const USER_AGENT = "Schoolgle-Compliance/1.0 (+https://schoolgle.co.uk)";
const DEFAULT_PAGE_LIMIT = 300;
const DEFAULT_TRUST_LIMIT = 120;
const DEFAULT_DELAY_MS = 100;

const DOCUMENT_EXTENSION = /\.(pdf|docx?|xlsx?|pptx?|csv|txt)(?:[?#].*)?$/i;
const DOCUMENT_HOST_OR_PATH =
  /(?:drive\.google\.com\/(?:file|embeddedfolderview|drive\/folders)|docs\.google\.com|sites\.google\.com|download\.asp\?|type=pdf)/i;
const EVIDENCE_KEYWORDS =
  /(admission|appeal|attendance|behaviour|complaint|curriculum|equality|finance|financial|funding|governance|governor|inspection|ofsted|policy|policies|premium|report|safeguard|send|sen|statutory|trust|trustee|uniform|whistleblowing|pupil|sport|pe|publication|privacy|cookie|gias|benchmarking|rse|pshe|online-safety|accessibility)/i;
const TRUST_HOST_KEYWORDS =
  /(academy|academies|education|diocese|mat|trust|paymat|partnership)/i;
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
const NON_TRUST_VENDOR_HOST_PARTS = [
  "junipereducation.org",
  "nationaltrust.org.uk",
  "schooljotter",
  "primarysite",
  "e4education",
  "schoolspider",
  "schoolwebsite",
];

function parseArgs(argv) {
  const args = {
    url: "",
    trustUrl: "",
    out: "",
    pageLimit: DEFAULT_PAGE_LIMIT,
    trustLimit: DEFAULT_TRUST_LIMIT,
    delayMs: DEFAULT_DELAY_MS,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--trust-url") args.trustUrl = argv[++index] || "";
    else if (arg === "--out") args.out = argv[++index] || "";
    else if (arg === "--page-limit") {
      args.pageLimit = Number(argv[++index] || args.pageLimit);
    } else if (arg === "--trust-limit") {
      args.trustLimit = Number(argv[++index] || args.trustLimit);
    } else if (arg === "--delay-ms") {
      args.delayMs = Number(argv[++index] || args.delayMs);
    } else if (arg === "--json") args.json = true;
    else if (!arg.startsWith("--") && !args.url) args.url = arg;
  }

  if (!args.url) {
    throw new Error(
      "Usage: node apps/platform/scripts/website-inventory-scan.mjs <url> [--trust-url <url>] [--out <file>]",
    );
  }

  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normaliseUrl(value, baseUrl) {
  try {
    const parsed = new URL(repairSchoolJotterPageUrl(decodeHtmlEntities(value)), baseUrl);
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

function decodeHtmlEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function repairSchoolJotterPageUrl(value) {
  const match = value.match(/^(.*\/page)\/?\?title=([\s\S]*)&pid=(\d+)$/);
  if (!match) return value;

  const [, pagePath, rawTitle, pid] = match;
  const title = rawTitle.replaceAll("+", " ");
  return `${pagePath}/?title=${encodeURIComponent(title)}&pid=${pid}`;
}

function hostname(value) {
  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function rootUrl(value) {
  const parsed = new URL(value.includes("://") ? value : `https://${value}`);
  return `${parsed.protocol}//${parsed.hostname}/`;
}

function isIgnored(url) {
  const lower = url.toLowerCase();
  return IGNORED_HOST_PARTS.some((ignored) => lower.includes(ignored));
}

function isNonTrustVendorHost(host) {
  return NON_TRUST_VENDOR_HOST_PARTS.some((vendor) => host.includes(vendor));
}

function isDocumentLike(url) {
  try {
    const parsed = new URL(url);
    return DOCUMENT_EXTENSION.test(parsed.pathname) || DOCUMENT_HOST_OR_PATH.test(url);
  } catch {
    return DOCUMENT_HOST_OR_PATH.test(url);
  }
}

function classifyUrl(url, schoolRoot, trustRoot) {
  const urlHost = hostname(url);
  const schoolHost = hostname(schoolRoot);
  const trustHost = trustRoot ? hostname(trustRoot) : "";

  if (isDocumentLike(url)) return "document";
  if (urlHost === schoolHost) return "school_page";
  if (trustHost && urlHost === trustHost) return "trust_page";
  if (/gov\.uk|ofsted|service\.gov\.uk/.test(urlHost)) return "official_reference";
  if (!isNonTrustVendorHost(urlHost) && TRUST_HOST_KEYWORDS.test(urlHost)) {
    return "trust_candidate";
  }
  return "external";
}

function hasEvidenceSignal(url, title = "") {
  try {
    const parsed = new URL(url);
    return EVIDENCE_KEYWORDS.test(`${parsed.pathname} ${parsed.search} ${title}`);
  } catch {
    return EVIDENCE_KEYWORDS.test(`${url} ${title}`);
  }
}

async function fetchText(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xml,text/xml,*/*",
        "user-agent": USER_AGENT,
      },
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get("content-type") || "",
      text,
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

function extractLocs(xml, baseUrl) {
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
    .map((match) => normaliseUrl(match[1].trim(), baseUrl))
    .filter(Boolean);
}

function extractLinks(html, baseUrl) {
  const links = new Set();
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

function extractTitle(html) {
  return (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(html) {
  return (
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .match(/\b[\w'-]+\b/g) || []
  ).length;
}

async function discoverSitemapUrls(siteRoot) {
  const attempts = [];
  const pageUrls = new Set();
  const sitemapUrls = new Set([
    new URL("/sitemap.xml", siteRoot).href,
    new URL("/wp-sitemap.xml", siteRoot).href,
    new URL("/sitemap_index.xml", siteRoot).href,
  ]);

  const robotsUrl = new URL("/robots.txt", siteRoot).href;
  const robots = await fetchText(robotsUrl);
  attempts.push({
    url: robotsUrl,
    status: robots.status,
    contentType: robots.contentType,
    error: robots.error || null,
  });

  for (const match of robots.text.matchAll(/^\s*Sitemap:\s*(\S+)\s*$/gim)) {
    const sitemap = normaliseUrl(match[1], siteRoot);
    if (sitemap) sitemapUrls.add(sitemap);
  }

  const visitedSitemaps = new Set();

  async function visitSitemap(sitemapUrl, depth = 0) {
    if (depth > 4 || visitedSitemaps.has(sitemapUrl)) return;
    visitedSitemaps.add(sitemapUrl);

    const response = await fetchText(sitemapUrl);
    attempts.push({
      url: sitemapUrl,
      status: response.status,
      finalUrl: response.finalUrl,
      contentType: response.contentType,
      bytes: response.text.length,
      error: response.error || null,
    });

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

  return { attempts, urls: [...pageUrls] };
}

async function fallbackHomepageLinks(siteRoot, limit) {
  const queued = [siteRoot];
  const seen = new Set();
  const found = new Set([siteRoot]);
  const siteHost = hostname(siteRoot);

  while (queued.length > 0 && found.size < limit) {
    const url = queued.shift();
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const response = await fetchText(url);
    if (!/html/i.test(response.contentType)) continue;

    for (const link of extractLinks(response.text, response.finalUrl || url)) {
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

async function discoverSitePages(siteRoot, limit) {
  const sitemap = await discoverSitemapUrls(siteRoot);
  let urls = sitemap.urls;

  if (urls.length === 0) {
    urls = await fallbackHomepageLinks(siteRoot, limit);
  }

  return {
    sitemap,
    urls: [...new Set([siteRoot, ...urls])].slice(0, limit),
  };
}

async function inventoryPages({ label, urls, schoolRoot, trustRoot, delayMs }) {
  const pages = [];
  const documents = new Map();
  const externalLinks = new Map();

  for (const url of urls) {
    if (delayMs > 0) await sleep(delayMs);

    const response = await fetchText(url);
    const title = extractTitle(response.text);
    const page = {
      label,
      url,
      status: response.status,
      finalUrl: response.finalUrl,
      contentType: response.contentType,
      bytes: response.text.length,
      title,
      wordCount: countWords(response.text),
      evidencePath: hasEvidenceSignal(url, title),
      links: 0,
      documentLinks: 0,
      evidenceLinks: 0,
      error: response.error || null,
    };

    if (/html/i.test(response.contentType)) {
      const links = extractLinks(response.text, response.finalUrl || url);
      page.links = links.length;

      for (const link of links) {
        const kind = classifyUrl(link, schoolRoot, trustRoot);
        const evidence = hasEvidenceSignal(link);

        if (kind === "document") {
          documents.set(link, {
            url: link,
            foundOn: url,
            source: label,
            kind,
            evidence,
          });
          page.documentLinks += 1;
        } else {
          externalLinks.set(link, {
            url: link,
            foundOn: url,
            kind,
            evidence,
            host: hostname(link),
          });
        }

        if (evidence) page.evidenceLinks += 1;
      }
    }

    pages.push(page);
  }

  return {
    pages,
    documents: [...documents.values()],
    externalLinks: [...externalLinks.values()],
  };
}

function inferTrustUrl(schoolInventory, schoolRoot) {
  const candidates = new Map();
  for (const link of schoolInventory.externalLinks) {
    if (link.kind !== "trust_candidate") continue;
    const host = link.host;
    const current = candidates.get(host) || { host, count: 0, evidenceCount: 0, firstUrl: link.url };
    current.count += 1;
    if (link.evidence) current.evidenceCount += 1;
    if (hasEvidenceSignal(link.url)) current.firstUrl = link.url;
    candidates.set(host, current);
  }

  const sorted = [...candidates.values()].sort(
    (left, right) =>
      right.evidenceCount - left.evidenceCount ||
      right.count - left.count ||
      left.host.localeCompare(right.host),
  );

  const winner = sorted.find((item) => item.host !== hostname(schoolRoot));
  if (winner && winner.count < 2 && winner.evidenceCount === 0) return "";
  return winner ? `https://${winner.host}/` : "";
}

function topEvidencePages(pages, limit = 40) {
  return [...pages]
    .filter(
      (page) => page.evidencePath || page.documentLinks > 0 || page.evidenceLinks > 0,
    )
    .sort(
      (left, right) =>
        right.documentLinks +
        right.evidenceLinks +
        Number(right.evidencePath) -
        (left.documentLinks + left.evidenceLinks + Number(left.evidencePath)),
    )
    .slice(0, limit);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const schoolRoot = rootUrl(args.url);

  const schoolDiscovery = await discoverSitePages(schoolRoot, args.pageLimit);
  const schoolInventory = await inventoryPages({
    label: "school",
    urls: schoolDiscovery.urls,
    schoolRoot,
    trustRoot: "",
    delayMs: args.delayMs,
  });

  const inferredTrustUrl = args.trustUrl || inferTrustUrl(schoolInventory, schoolRoot);
  let trustDiscovery = { sitemap: { attempts: [], urls: [] }, urls: [] };
  let trustInventory = { pages: [], documents: [], externalLinks: [] };

  if (inferredTrustUrl) {
    const trustRoot = rootUrl(inferredTrustUrl);
    trustDiscovery = await discoverSitePages(trustRoot, args.trustLimit);
    trustInventory = await inventoryPages({
      label: "trust",
      urls: trustDiscovery.urls,
      schoolRoot,
      trustRoot,
      delayMs: args.delayMs,
    });
  }

  const documentMap = new Map();
  for (const document of [...schoolInventory.documents, ...trustInventory.documents]) {
    documentMap.set(document.url, document);
  }

  const pages = [...schoolInventory.pages, ...trustInventory.pages];
  const documents = [...documentMap.values()].sort((left, right) =>
    left.url.localeCompare(right.url),
  );

  const report = {
    scannedAt: new Date().toISOString(),
    writesToApplication: false,
    roots: {
      school: schoolRoot,
      trust: inferredTrustUrl ? rootUrl(inferredTrustUrl) : null,
      trustInferred: !args.trustUrl && Boolean(inferredTrustUrl),
    },
    sitemap: {
      school: {
        attempts: schoolDiscovery.sitemap.attempts,
        urls: schoolDiscovery.sitemap.urls.length,
      },
      trust: {
        attempts: trustDiscovery.sitemap.attempts,
        urls: trustDiscovery.sitemap.urls.length,
      },
    },
    totals: {
      pagesInventoried: pages.length,
      schoolPages: schoolInventory.pages.length,
      trustPages: trustInventory.pages.length,
      uniqueDocumentsOrPublicDocs: documents.length,
      schoolDocuments: schoolInventory.documents.length,
      trustDocuments: trustInventory.documents.length,
      evidenceLikePages: topEvidencePages(pages, pages.length).length,
      fetchErrors: pages.filter((page) => page.error || page.status >= 400).length,
    },
    topEvidencePages: topEvidencePages(pages),
    documents,
    trustCandidates: schoolInventory.externalLinks
      .filter((link) => link.kind === "trust_candidate")
      .slice(0, 50),
    fetchErrors: pages
      .filter((page) => page.error || page.status >= 400)
      .map(({ url, status, error, title }) => ({ url, status, error, title })),
  };

  const output = JSON.stringify(report, null, 2);
  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, `${output}\n`);
  }

  if (args.json) {
    console.log(output);
  } else {
    console.log("Website inventory scan complete (no app/database writes).");
    console.log(`School pages: ${report.totals.schoolPages}`);
    console.log(`Trust pages: ${report.totals.trustPages}`);
    console.log(`Documents/public docs: ${report.totals.uniqueDocumentsOrPublicDocs}`);
    console.log(`Evidence-like pages: ${report.totals.evidenceLikePages}`);
    console.log(`Fetch errors: ${report.totals.fetchErrors}`);
    console.log(`Trust: ${report.roots.trust || "none detected"}`);
    if (args.out) console.log(`Report written to ${args.out}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
