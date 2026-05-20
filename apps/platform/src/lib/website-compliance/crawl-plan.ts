import type { CrawledPage } from "../website-crawler";

export type EvidenceLinkKind =
  | "trust_site"
  | "public_document"
  | "official_reference";

export interface EvidenceLinkCandidate {
  url: string;
  hostname: string;
  kind: EvidenceLinkKind;
  score: number;
}

const TRUST_SEED_PATHS = [
  "/",
  "/policies",
  "/policies-and-statements",
  "/key-information",
  "/statutory-information",
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
  "/about/finance",
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

const PAYMAT_KNOWN_404_PATHS = new Set([
  "/policies",
  "/key-information",
  "/statutory-information",
]);

const PUBLIC_DOCUMENT_HOSTS = new Set([
  "drive.google.com",
  "docs.google.com",
  "sites.google.com",
]);

const OFFICIAL_REFERENCE_HOSTS = [
  "gov.uk",
  "ofsted.gov.uk",
  "reports.ofsted.gov.uk",
  "files.ofsted.gov.uk",
  "compare-school-performance.service.gov.uk",
  "financial-benchmarking-and-insights-tool.education.gov.uk",
  "financial-benchmarking-and-insights-tool.service.gov.uk",
  "schools-financial-benchmarking.service.gov.uk",
];

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

const EVIDENCE_PATH_KEYWORDS =
  /(admission|appeal|attendance|behaviour|complaint|curriculum|equality|finance|financial|funding|governance|governor|inspection|ofsted|policy|policies|premium|report|safeguard|send|sen|statutory|trust|trustee|uniform|whistleblowing)/i;

const TRUST_HOST_KEYWORDS =
  /(academy|academies|education|diocese|mat|trust|paymat)/i;

const DOCUMENT_EXTENSION = /\.(pdf|docx?|xlsx?|pptx?|csv|txt)(?:[?#].*)?$/i;

export function normaliseHostname(value: string): string {
  const input = value.trim();
  if (!input) return "";

  try {
    const parsed = new URL(input.includes("://") ? input : `https://${input}`);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return input.toLowerCase().replace(/^www\./, "");
  }
}

function normaliseUrl(value: string, baseUrl?: string): string | null {
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

function isSameHost(url: URL, baseUrl: string): boolean {
  return normaliseHostname(url.hostname) === normaliseHostname(baseUrl);
}

function isIgnoredHost(hostname: string): boolean {
  return IGNORED_HOST_PARTS.some((ignored) => hostname.includes(ignored));
}

function isOfficialReferenceHost(hostname: string): boolean {
  return OFFICIAL_REFERENCE_HOSTS.some(
    (official) => hostname === official || hostname.endsWith(`.${official}`),
  );
}

function scoreEvidenceLink(url: URL, kind: EvidenceLinkKind): number {
  const path = `${url.pathname} ${url.search}`.toLowerCase();
  const hasEvidencePath = EVIDENCE_PATH_KEYWORDS.test(path);

  if (kind === "trust_site" && hasEvidencePath) return 100;
  if (kind === "public_document") return hasEvidencePath ? 95 : 90;
  if (kind === "trust_site") return 60;
  return hasEvidencePath ? 55 : 40;
}

export function classifyEvidenceLink(
  link: string,
  schoolWebsiteUrl: string,
): EvidenceLinkCandidate | null {
  const normalised = normaliseUrl(link, schoolWebsiteUrl);
  if (!normalised) return null;

  const parsed = new URL(normalised);
  const hostname = normaliseHostname(parsed.hostname);
  if (!hostname || isSameHost(parsed, schoolWebsiteUrl) || isIgnoredHost(hostname)) {
    return null;
  }

  let kind: EvidenceLinkKind | null = null;
  if (PUBLIC_DOCUMENT_HOSTS.has(hostname) || DOCUMENT_EXTENSION.test(parsed.pathname)) {
    kind = "public_document";
  } else if (isOfficialReferenceHost(hostname)) {
    kind = "official_reference";
  } else if (
    TRUST_HOST_KEYWORDS.test(hostname) ||
    EVIDENCE_PATH_KEYWORDS.test(parsed.pathname)
  ) {
    kind = "trust_site";
  }

  if (!kind) return null;

  return {
    url: normalised,
    hostname,
    kind,
    score: scoreEvidenceLink(parsed, kind),
  };
}

export function buildPublicEvidenceSeeds(
  pages: Pick<CrawledPage, "links">[],
  schoolWebsiteUrl: string,
  options: { limit?: number } = {},
): string[] {
  const limit = options.limit ?? 30;
  const candidates = new Map<string, EvidenceLinkCandidate & { index: number }>();
  let index = 0;

  for (const page of pages) {
    for (const link of page.links || []) {
      const candidate = classifyEvidenceLink(link, schoolWebsiteUrl);
      if (!candidate) continue;

      const existing = candidates.get(candidate.url);
      if (!existing || candidate.score > existing.score) {
        candidates.set(candidate.url, { ...candidate, index });
      }
      index += 1;
    }
  }

  return [...candidates.values()]
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map((candidate) => candidate.url);
}

export function buildAllowedExternalDomains(
  trustDomains: Iterable<string>,
  evidenceSeedUrls: string[],
  schoolWebsiteUrl: string,
): string[] {
  const schoolHost = normaliseHostname(schoolWebsiteUrl);
  const domains = new Set<string>();

  for (const domain of trustDomains) {
    const host = normaliseHostname(domain);
    if (host && host !== schoolHost) domains.add(host);
  }

  for (const seedUrl of evidenceSeedUrls) {
    const host = normaliseHostname(seedUrl);
    if (host && host !== schoolHost) domains.add(host);
  }

  return [...domains];
}

export function buildTrustSeedUrls(trustUrl: string, limit = 30): string[] {
  const base = normaliseUrl(trustUrl);
  if (!base) return [];

  const parsed = new URL(base);
  const hostname = normaliseHostname(parsed.hostname);
  const root = `${parsed.protocol}//${parsed.hostname}`;

  const paths = TRUST_SEED_PATHS.filter((path) => {
    if (hostname === "paymat.org") return !PAYMAT_KNOWN_404_PATHS.has(path);
    return true;
  });

  return [...new Set(paths.map((path) => `${root}${path}`))].slice(0, limit);
}
