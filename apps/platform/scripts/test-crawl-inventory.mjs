/**
 * Test script: Check what the crawler actually finds on a school website.
 * Outputs an inventory of all pages and documents discovered.
 *
 * Usage: node scripts/test-crawl-inventory.mjs [url] [maxPages]
 */

import { chromium } from "playwright";

const url = process.argv[2] || "https://grovehouseprimary.co.uk";
const maxPages = parseInt(process.argv[3] || "150");

console.log(`\n🔍 Crawling ${url} (max ${maxPages} pages)\n`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: "Schoolgle-CrawlTest/1.0",
});

const crawledUrls = new Set();
const queuedUrls = new Set();
const discoveredDocuments = []; // PDFs, docs, etc.
const discoveredPages = []; // HTML pages
const failedUrls = [];

const baseDomain = new URL(url).hostname;

function isAllowed(testUrl) {
  try {
    const u = new URL(testUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const skipExts = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".svg",
      ".ico",
      ".webp",
      ".mp4",
      ".mp3",
      ".wav",
      ".woff",
      ".woff2",
      ".ttf",
      ".eot",
      ".css",
      ".js",
    ];
    if (skipExts.some((ext) => u.pathname.toLowerCase().endsWith(ext)))
      return false;
    // Same domain only
    return u.hostname === baseDomain || u.hostname.endsWith(`.${baseDomain}`);
  } catch {
    return false;
  }
}

function isDocument(testUrl) {
  const path = new URL(testUrl).pathname.toLowerCase();
  const docExts = [
    ".pdf",
    ".docx",
    ".doc",
    ".xlsx",
    ".xls",
    ".pptx",
    ".csv",
    ".txt",
  ];
  return docExts.find((ext) => path.endsWith(ext)) || null;
}

// Start crawl
queuedUrls.add(url);

const startTime = Date.now();

while (queuedUrls.size > 0 && crawledUrls.size < maxPages) {
  const nextUrl = queuedUrls.values().next().value;
  queuedUrls.delete(nextUrl);

  if (crawledUrls.has(nextUrl)) continue;
  crawledUrls.add(nextUrl);

  const docType = isDocument(nextUrl);

  if (docType) {
    // It's a document — record it but don't navigate (just note it exists)
    const filename = decodeURIComponent(
      new URL(nextUrl).pathname.split("/").pop() || "",
    );
    discoveredDocuments.push({
      url: nextUrl,
      filename,
      type: docType.replace(".", ""),
      foundVia: "crawl queue",
    });
    continue;
  }

  // It's an HTML page — navigate and extract links
  // Some CMS URLs serve file downloads without extensions
  try {
    const page = await context.newPage();

    // Race navigation against a download event
    let response = null;
    const downloadCatcher = page
      .waitForEvent("download", { timeout: 15000 })
      .catch(() => null);

    try {
      response = await page.goto(nextUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
    } catch (navErr) {
      const msg = navErr?.message || "";
      if (msg.includes("Download is starting") || msg.includes("download")) {
        const dl = await downloadCatcher;
        if (dl) {
          const dlFilename = dl.suggestedFilename() || "unknown";
          const dlType =
            dlFilename.split(".").pop()?.toLowerCase() || "unknown";
          discoveredDocuments.push({
            url: nextUrl,
            filename: dlFilename,
            type: dlType,
            foundVia: "download redirect",
          });
          await page.close();
          continue;
        }
      }
      throw navErr;
    }

    const status = response?.status() || 0;
    const title = await page.title().catch(() => "");

    // Extract all links
    const links = await page
      .evaluate(() => {
        const anchors = document.querySelectorAll("a[href]");
        return Array.from(anchors)
          .map((a) => ({
            href: a.getAttribute("href"),
            text: a.textContent?.trim().substring(0, 100) || "",
          }))
          .filter((l) => l.href);
      })
      .catch(() => []);

    discoveredPages.push({
      url: nextUrl,
      title: title.substring(0, 100),
      status,
      linkCount: links.length,
    });

    // Queue discovered links
    for (const link of links) {
      try {
        const resolved = new URL(link.href, nextUrl).href;
        const normalized = resolved.split("#")[0].split("?")[0]; // Strip fragments and query

        if (!crawledUrls.has(normalized) && !queuedUrls.has(normalized)) {
          const docExt = isDocument(normalized);
          if (docExt) {
            // Document found — record it immediately
            const filename = decodeURIComponent(
              new URL(normalized).pathname.split("/").pop() || "",
            );
            discoveredDocuments.push({
              url: normalized,
              filename,
              type: docExt.replace(".", ""),
              foundOnPage: nextUrl,
              linkText: link.text.substring(0, 80),
            });
          } else if (isAllowed(normalized)) {
            queuedUrls.add(normalized);
          }
        }
      } catch {
        /* invalid URL */
      }
    }

    await page.close();

    // Respectful delay
    if (crawledUrls.size > 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  } catch (err) {
    failedUrls.push({ url: nextUrl, error: err.message?.substring(0, 100) });
  }

  // Progress
  if (crawledUrls.size % 20 === 0) {
    console.log(
      `  ... ${crawledUrls.size} pages crawled, ${discoveredDocuments.length} documents found, ${queuedUrls.size} in queue`,
    );
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

await browser.close();

// ─── Report ────────────────────────────────────────────────────────

console.log(`\n${"═".repeat(70)}`);
console.log(`CRAWL INVENTORY: ${url}`);
console.log(`${"═".repeat(70)}`);
console.log(
  `Time: ${elapsed}s | Pages: ${discoveredPages.length} | Documents: ${discoveredDocuments.length} | Failed: ${failedUrls.length} | Remaining in queue: ${queuedUrls.size}`,
);

// Pages
console.log(`\n${"─".repeat(70)}`);
console.log(`HTML PAGES (${discoveredPages.length})`);
console.log(`${"─".repeat(70)}`);
for (const p of discoveredPages) {
  const path = new URL(p.url).pathname;
  console.log(`  ${p.status} ${path.padEnd(50)} ${p.title.substring(0, 40)}`);
}

// Documents by type
const docsByType = {};
for (const d of discoveredDocuments) {
  if (!docsByType[d.type]) docsByType[d.type] = [];
  docsByType[d.type].push(d);
}

console.log(`\n${"─".repeat(70)}`);
console.log(`DOCUMENTS (${discoveredDocuments.length})`);
console.log(`${"─".repeat(70)}`);
for (const [type, docs] of Object.entries(docsByType)) {
  console.log(`\n  ${type.toUpperCase()} (${docs.length}):`);
  // Deduplicate
  const seen = new Set();
  for (const d of docs) {
    if (seen.has(d.url)) continue;
    seen.add(d.url);
    const linkInfo = d.linkText ? ` ← "${d.linkText}"` : "";
    const pageInfo = d.foundOnPage
      ? ` (from ${new URL(d.foundOnPage).pathname})`
      : "";
    console.log(`    ${d.filename}${linkInfo}${pageInfo}`);
  }
}

// Check specifically for PE Sport Premium
console.log(`\n${"─".repeat(70)}`);
console.log(`KEY CHECKS`);
console.log(`${"─".repeat(70)}`);

const keyInfoPage = discoveredPages.find((p) =>
  p.url.includes("key-information"),
);
console.log(
  `  /key-information page found: ${keyInfoPage ? "✅ YES" : "❌ NO"}`,
);

const sportGrantPdf = discoveredDocuments.find(
  (d) =>
    d.filename?.toLowerCase().includes("sport") &&
    d.filename?.toLowerCase().includes("grant"),
);
console.log(
  `  PE Sports Grant Report PDF:  ${sportGrantPdf ? "✅ " + sportGrantPdf.filename : "❌ NOT FOUND"}`,
);
if (sportGrantPdf?.foundOnPage) {
  console.log(`    Found on: ${new URL(sportGrantPdf.foundOnPage).pathname}`);
}

const safeguardingPage = discoveredPages.find((p) =>
  p.url.includes("safeguarding"),
);
console.log(
  `  /safeguarding page found:    ${safeguardingPage ? "✅ YES" : "❌ NO"}`,
);

// Check for Google Drive documents
const driveLinks = discoveredDocuments.filter((d) =>
  d.url.includes("drive.google.com"),
);
console.log(`  Google Drive documents:      ${driveLinks.length}`);

// Unvisited pages still in queue
if (queuedUrls.size > 0) {
  console.log(`\n${"─".repeat(70)}`);
  console.log(`UNVISITED (still in queue: ${queuedUrls.size})`);
  console.log(`${"─".repeat(70)}`);
  let count = 0;
  for (const u of queuedUrls) {
    if (count++ > 20) {
      console.log(`  ... and ${queuedUrls.size - 20} more`);
      break;
    }
    console.log(`  ${new URL(u).pathname}`);
  }
}

if (failedUrls.length > 0) {
  console.log(`\n${"─".repeat(70)}`);
  console.log(`FAILED (${failedUrls.length})`);
  console.log(`${"─".repeat(70)}`);
  for (const f of failedUrls) {
    console.log(`  ${f.url} — ${f.error}`);
  }
}

console.log();
