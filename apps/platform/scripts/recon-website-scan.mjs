#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_URL = "https://grovehouseprimary.co.uk/";
const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v1";
const USER_AGENT = "Schoolgle-Compliance/1.0 (+https://schoolgle.co.uk)";

const EVIDENCE_KEYWORDS =
  /(admission|appeal|attendance|behaviour|complaint|curriculum|equality|finance|financial|funding|governance|governor|inspection|ofsted|policy|policies|premium|report|safeguard|send|sen|statutory|trust|trustee|uniform|whistleblowing)/i;
const TRUST_HOST_KEYWORDS = /(academy|academies|education|diocese|mat|trust|paymat)/i;
const DOCUMENT_EXTENSION = /\.(pdf|docx?|xlsx?|pptx?|csv|txt)(?:[?#].*)?$/i;
const PUBLIC_DOCUMENT_HOSTS = new Set([
  "drive.google.com",
  "docs.google.com",
  "sites.google.com",
]);
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
];

const TRUST_SEED_PATHS = [
  "/",
  "/policies-and-statements",
  "/governance",
  "/governance/policies",
  "/governance/policies-and-statements",
  "/governance/governance-structure",
  "/governance/trustees",
  "/governance/members",
  "/trustees",
  "/members",
  "/about/governance",
  "/finance",
  "/accounts",
  "/annual-report",
  "/gender-pay-gap",
  "/complaints",
  "/whistleblowing",
  "/key-documents",
  "/about",
  "/about-us",
  "/our-schools",
  "/our-trust",
  "/our-trust/our-schools",
];

function parseArgs(argv) {
  const args = {
    url: DEFAULT_URL,
    trustUrl: null,
    limit: 200,
    out: null,
    json: false,
    noFallback: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--trust-url") args.trustUrl = argv[++index] || null;
    else if (arg === "--limit") args.limit = Number(argv[++index] || args.limit);
    else if (arg === "--out") args.out = argv[++index] || null;
    else if (arg === "--json") args.json = true;
    else if (arg === "--no-fallback") args.noFallback = true;
    else if (!arg.startsWith("--")) args.url = arg;
  }

  return args;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function normaliseHostname(value) {
  try {
    const input = value.includes("://") ? value : `https://${value}`;
    return new URL(input).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return value.toLowerCase().replace(/^www\./, "");
  }
}

function normaliseUrl(value, baseUrl) {
  try {
    const parsed = new URL(value, baseUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.href;
  } catch {
    return null;
  }
}

function isIgnoredHost(hostname) {
  return IGNORED_HOST_PARTS.some((ignored) => hostname.includes(ignored));
}

function classifyLink(link, schoolUrl) {
  const normalised = normaliseUrl(link, schoolUrl);
  if (!normalised) return null;

  const parsed = new URL(normalised);
  const hostname = normaliseHostname(parsed.hostname);
  const schoolHost = normaliseHostname(schoolUrl);
  if (!hostname || hostname === schoolHost || isIgnoredHost(hostname)) return null;

  let kind = null;
  if (PUBLIC_DOCUMENT_HOSTS.has(hostname) || DOCUMENT_EXTENSION.test(parsed.pathname)) {
    kind = "public_document";
  } else if (
    hostname.endsWith("gov.uk") ||
    hostname.includes("ofsted") ||
    hostname.includes("service.gov.uk")
  ) {
    kind = "official_reference";
  } else if (TRUST_HOST_KEYWORDS.test(hostname) || EVIDENCE_KEYWORDS.test(parsed.pathname)) {
    kind = "trust_site";
  }

  if (!kind) return null;

  const evidencePath = EVIDENCE_KEYWORDS.test(parsed.pathname);
  const score =
    kind === "trust_site" && evidencePath
      ? 100
      : kind === "public_document"
        ? 90
        : kind === "trust_site"
          ? 60
          : 40;

  return { url: normalised, hostname, kind, score };
}

function rankEvidenceLinks(links, schoolUrl, limit = 80) {
  const candidates = new Map();
  let index = 0;
  for (const link of links) {
    const candidate = classifyLink(link, schoolUrl);
    if (!candidate) continue;
    const existing = candidates.get(candidate.url);
    if (!existing || candidate.score > existing.score) {
      candidates.set(candidate.url, { ...candidate, index });
    }
    index += 1;
  }

  return [...candidates.values()]
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map(({ index: _index, ...candidate }) => candidate);
}

function buildTrustSeedUrls(trustUrl) {
  const rootUrl = normaliseUrl(trustUrl);
  if (!rootUrl) return [];
  const parsed = new URL(rootUrl);
  const root = `${parsed.protocol}//${parsed.hostname}`;
  return [...new Set(TRUST_SEED_PATHS.map((seedPath) => `${root}${seedPath}`))];
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT },
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type"),
      text,
      url: response.url,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fallbackDiscoverLinks(url) {
  const result = await fetchText(url);
  const links = [];

  for (const match of result.text.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = normaliseUrl(match[1], result.url || url);
    if (href) links.push(href);
  }

  for (const match of result.text.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
    const href = normaliseUrl(match[1].trim(), result.url || url);
    if (href) links.push(href);
  }

  return {
    method: "fetch-fallback",
    status: result.status,
    contentType: result.contentType,
    bytes: result.text.length,
    links: [...new Set(links)],
  };
}

async function firecrawlMap(url, limit) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not set");

  const response = await fetch(`${FIRECRAWL_BASE_URL}/map`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ url, limit, includeSubdomains: false }),
  });
  const bodyText = await response.text();
  const body = JSON.parse(bodyText || "{}");
  if (!response.ok) {
    throw new Error(`Firecrawl map failed (${response.status}): ${body.error || response.statusText}`);
  }

  return {
    method: "firecrawl-map",
    status: response.status,
    links: Array.isArray(body.links) ? body.links : [],
  };
}

async function discoverWithFirecrawlOrFallback(url, limit, blockers, noFallback) {
  try {
    return await firecrawlMap(url, limit);
  } catch (error) {
    blockers.push({
      url,
      tool: "firecrawl",
      error: error instanceof Error ? error.message : String(error),
    });
    if (noFallback) {
      return { method: "firecrawl-map", status: "failed", links: [] };
    }
    try {
      return await fallbackDiscoverLinks(url);
    } catch (fallbackError) {
      blockers.push({
        url,
        tool: "fetch-fallback",
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError),
      });
      return { method: "fetch-fallback", status: "failed", links: [] };
    }
  }
}

async function main() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, "apps", "platform", ".env.local"));
  loadEnvFile(path.join(cwd, ".env.local"));

  const args = parseArgs(process.argv.slice(2));
  const blockers = [];

  const school = await discoverWithFirecrawlOrFallback(
    args.url,
    args.limit,
    blockers,
    args.noFallback,
  );
  const schoolEvidence = rankEvidenceLinks(school.links, args.url);
  const inferredTrustUrl =
    args.trustUrl ||
    schoolEvidence.find((candidate) => candidate.kind === "trust_site")?.url ||
    null;

  const trustSeeds = inferredTrustUrl ? buildTrustSeedUrls(inferredTrustUrl).slice(0, 25) : [];
  const trustSeedResults = [];
  const trustLinks = [];

  for (const seedUrl of trustSeeds) {
    const result = await discoverWithFirecrawlOrFallback(
      seedUrl,
      Math.min(args.limit, 80),
      blockers,
      args.noFallback,
    );
    trustSeedResults.push({
      url: seedUrl,
      method: result.method,
      status: result.status,
      links: result.links.length,
    });
    trustLinks.push(...result.links);
  }

  const trustEvidence = inferredTrustUrl
    ? rankEvidenceLinks(trustLinks, args.url, 120)
    : [];

  const report = {
    scannedAt: new Date().toISOString(),
    writesToApplication: false,
    school: {
      url: args.url,
      method: school.method,
      status: school.status,
      linksDiscovered: school.links.length,
      evidenceLinks: schoolEvidence,
    },
    trust: {
      inferredUrl: inferredTrustUrl,
      seedsChecked: trustSeedResults,
      evidenceLinks: trustEvidence,
    },
    blockers,
  };

  const output = JSON.stringify(report, null, 2);
  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, `${output}\n`);
  }

  if (args.json) {
    console.log(output);
  } else {
    console.log("Website recon complete (no app/database writes).");
    console.log(`School links discovered: ${report.school.linksDiscovered}`);
    console.log(`School evidence links: ${report.school.evidenceLinks.length}`);
    console.log(`Trust inferred: ${report.trust.inferredUrl || "none"}`);
    console.log(`Trust evidence links: ${report.trust.evidenceLinks.length}`);
    console.log(`Blockers: ${report.blockers.length}`);
    if (args.out) console.log(`Report written to ${args.out}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
