import { firecrawlExtract } from "../extractors/firecrawl";
import * as cheerio from "cheerio";
import { ExtractedProductSchema } from "../extractors/base";
import { findExtractor } from "../extractors/registry";
import { generateFingerprint } from "./fingerprint";
import { parsePackInfo } from "./pack-parser";
import { generateCanonicalKey, generateEquivalenceGroup } from "./equivalence";
import { normaliseSupplierProduct } from "./supplier-product-normalisation";
import {
  upsertProduct,
  upsertPrice,
  upsertProductUnitDetails,
  getSupplierSearchUrls,
  createScrapeJob,
  updateScrapeJob,
} from "./matcher";
import { applyAffiliateParameters } from "../affiliate-links";

let activeDiscoveries = 0;
const MAX_CONCURRENT_DISCOVERIES = 2;
const MAX_DISCOVERY_SUPPLIERS = 30;
const DISCOVERY_TIMEOUT_MS = 12000;

const BLOCKED_OR_INVALID_TITLES = [
  /404/i,
  /page not found/i,
  /just a moment/i,
  /access denied/i,
  /captcha/i,
  /not available/i,
];

export interface SearchPageProductCandidate {
  name: string;
  price: number;
  image_url?: string;
  source_url: string;
  description?: string;
}

const MIN_LAUNCH_CHOICES = 20;

const CATEGORY_DISCOVERY_QUERIES: Record<string, string[]> = {
  pencil: [
    "HB pencils school pack",
    "pencils classpack",
    "school pencils",
    "bulk HB pencils",
    "classroom pencils",
  ],
  pen: ["school pens bulk pack", "ballpoint pens class pack", "blue pens bulk"],
  "ballpoint-pen": ["school pens bulk pack", "ballpoint pens class pack", "blue pens bulk"],
  "copy-paper": ["A4 copy paper 80gsm 5 reams", "A4 printer paper box 5 reams", "copy paper 2500 sheets"],
  "whiteboard-marker": ["whiteboard markers class pack", "dry wipe markers bulk", "whiteboard pens school pack"],
  "marker-pen": ["felt tip pens class pack", "marker pens bulk", "school markers pack"],
};

/**
 * Build a search query from a product name + brand.
 * Strips pack quantities, keeps brand + core name + weight.
 */
export function buildSearchQuery(name: string, brand?: string): string {
  let query = name
    .replace(/\b(?:pack|box|case|carton|bag|set|ream)\s+of\s+\d+/gi, "")
    .replace(/\b\d+\s*-?\s*(?:pk|pack)\b/gi, "")
    .replace(/\bx\s*\d+\b/gi, "")
    .replace(/\b\d+\s*x\b/gi, "")
    .replace(/\bqty\s*:?\s*\d+/gi, "")
    .replace(/\(\s*\d+\s*(?:pk|pack|per\s+pack)?\s*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (brand && !query.toLowerCase().includes(brand.toLowerCase())) {
    query = `${brand} ${query}`;
  }

  return query;
}

function uniqueQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  return queries
    .map((query) => query.replace(/\s+/g, " ").trim())
    .filter((query) => {
      const key = query.toLowerCase();
      if (!query || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function buildDiscoveryQueries(
  name: string,
  brand?: string,
  equivalenceGroup?: string | null,
): string[] {
  const exactQuery = buildSearchQuery(name, brand);
  const categoryQueries =
    equivalenceGroup && CATEGORY_DISCOVERY_QUERIES[equivalenceGroup]
      ? CATEGORY_DISCOVERY_QUERIES[equivalenceGroup]
      : [];

  return uniqueQueries([...categoryQueries, exactQuery]);
}

export function needsMoreChoiceDiscovery(
  matchCount: number,
  targetChoices = MIN_LAUNCH_CHOICES,
): boolean {
  return matchCount < targetChoices;
}

function tokeniseQuery(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(
      (token) =>
        token.length > 2 ||
        ["a3", "a4", "hb"].includes(token),
    )
    .slice(0, 8);
}

function distinctiveQueryTokens(value: string): string[] {
  return value
    .toLowerCase()
    .match(/[a-z]*\d+[a-z0-9-]*|[a-z]+-\d+[a-z0-9-]*/g) || [];
}

function isLikelyProductHref(href: string): boolean {
  const lower = href.toLowerCase();
  if (
    !href ||
    lower.includes("javascript:") ||
    lower.includes("mailto:") ||
    lower.includes("/basket") ||
    lower.includes("/cart") ||
    lower.includes("/checkout") ||
    lower.includes("/login") ||
    lower.includes("/account") ||
    lower.includes("/contact") ||
    lower.includes("/privacy") ||
    lower.includes("/terms") ||
    lower.includes("/search?")
  ) {
    return false;
  }

  return [
    "/p/",
    "/product",
    "/products/",
    "/shop/",
    "/catalogue/",
    "/catalog/",
    ".html",
    ".htm",
  ].some((marker) => lower.includes(marker));
}

async function discoverCandidateProductUrls(
  searchUrl: string,
  query: string,
): Promise<string[]> {
  const response = await fetch(searchUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; SchoolgleDealFinder/1.0; +https://schoolgle.co.uk)",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) return [];

  const html = await response.text();
  const $ = cheerio.load(html);
  const queryTokens = tokeniseQuery(query);
  const candidates: Array<{ url: string; score: number }> = [];
  const seen = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || !isLikelyProductHref(href)) return;

    let url: string;
    try {
      url = new URL(href, searchUrl).toString();
    } catch {
      return;
    }

    if (seen.has(url)) return;
    seen.add(url);

    const linkText = [
      $(element).text(),
      $(element).attr("title"),
      $(element).attr("aria-label"),
      href,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const tokenScore = queryTokens.reduce(
      (score, token) => score + (linkText.includes(token) ? 5 : 0),
      0,
    );
    const productMarkerScore = /\/(?:p|product|products)\//i.test(url) ? 8 : 0;
    const htmlScore = /\.html?($|[?#])/i.test(url) ? 3 : 0;

    candidates.push({
      url,
      score: tokenScore + productMarkerScore + htmlScore,
    });
  });

  return candidates
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((candidate) => candidate.url);
}

function parsePrice(text: string): number | null {
  const match = text.match(/£\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function cleanCandidateName(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\b(?:view|details|add to basket|quick view|compare)\b/gi, "")
    .trim();
}

function normaliseCandidateImage(
  image: string | undefined,
  baseUrl: string,
): string | undefined {
  if (!image || image.startsWith("data:")) return undefined;
  try {
    return new URL(image, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function decodeEmbeddedCommerceText(html: string): string {
  return html
    .replace(/&quot;/g, '"')
    .replace(/\\u0026/g, "&")
    .replace(/\\"/g, '"')
    .replace(/\\\//g, "/");
}

function normaliseCandidateUrl(url: string, baseUrl: string): string | null {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractEmbeddedCommerceCandidates(
  html: string,
  searchUrl: string,
  query: string,
): SearchPageProductCandidate[] {
  const decoded = decodeEmbeddedCommerceText(html);
  const candidates: SearchPageProductCandidate[] = [];
  const seen = new Set<string>();
  const productPattern =
    /"price":\{"amount":(\d+(?:\.\d+)?),"currencyCode":"GBP"\},"product":\{"title":"([^"]+)".*?"url":"([^"]+)".*?\}.*?"image":\{"src":"([^"]+)".*?\},"sku":"[^"]*","title":"([^"]+)"/gs;

  for (const match of decoded.matchAll(productPattern)) {
    const price = Number(match[1]);
    const productTitle = cleanCandidateName(match[2]);
    const productUrl = normaliseCandidateUrl(match[3], searchUrl);
    const imageUrl = normaliseCandidateImage(match[4], searchUrl);
    const variantTitle = cleanCandidateName(match[5]);
    const name =
      variantTitle && !/^default title$/i.test(variantTitle)
        ? `${productTitle} ${variantTitle}`
        : productTitle;

    if (!productUrl || !price || !isRelevantProductName(name, query)) continue;

    const key = `${productUrl.toLowerCase()}:${price}`;
    if (seen.has(key)) continue;
    seen.add(key);

    candidates.push({
      name,
      price,
      source_url: productUrl,
      image_url: imageUrl,
      description: name,
    });
  }

  return candidates;
}

function extractAmazonSearchCandidates(
  $: cheerio.CheerioAPI,
  searchUrl: string,
  query: string,
): SearchPageProductCandidate[] {
  const candidates: SearchPageProductCandidate[] = [];
  const seen = new Set<string>();

  $('.s-result-item[data-asin]').each((_, element) => {
    const asin = $(element).attr("data-asin");
    if (!asin) return;

    const name = cleanCandidateName(
      $(element).find("h2 a span").first().text() ||
        $(element).find('[data-cy="title-recipe"]').first().text() ||
        $(element).find("h2").first().text(),
    );
    if (!name || !isRelevantProductName(name, query)) return;

    const href =
      $(element).find("h2 a").attr("href") ||
      $(element).find('a[href*="/dp/"]').attr("href");
    if (!href) return;
    const sourceUrl = normaliseCandidateUrl(href, searchUrl);
    if (!sourceUrl) return;

    const price = parsePrice($(element).find(".a-price .a-offscreen").first().text());
    if (price === null) return;

    const image = $(element).find("img.s-image").attr("src");
    const key = `${sourceUrl.toLowerCase()}:${price}`;
    if (seen.has(key)) return;
    seen.add(key);

    candidates.push({
      name,
      price,
      source_url: sourceUrl,
      image_url: normaliseCandidateImage(image, searchUrl),
      description: name,
    });
  });

  return candidates;
}

export function extractProductCandidatesFromSearchHtml(
  html: string,
  searchUrl: string,
  query: string,
): SearchPageProductCandidate[] {
  const $ = cheerio.load(html);
  const candidates: SearchPageProductCandidate[] = [
    ...extractEmbeddedCommerceCandidates(html, searchUrl, query),
    ...extractAmazonSearchCandidates($, searchUrl, query),
  ];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    seen.add(`${candidate.source_url.toLowerCase()}:${candidate.price}`);
  }

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || !isLikelyProductHref(href)) return;

    const sourceUrl = normaliseCandidateUrl(href, searchUrl);
    if (!sourceUrl) return;

    const container = $(element).closest(
      'article, li, [class*="product"], [class*="item"], [data-product-id], div',
    );
    const rawName =
      $(element).attr("title") ||
      $(element).attr("aria-label") ||
      $(element).text();
    const name = cleanCandidateName(rawName || "");
    if (!name || !isRelevantProductName(name, query)) return;

    const containerText = container.text() || $(element).parent().text();
    const price = parsePrice(containerText);
    if (price === null) return;

    const image =
      container.find("img").attr("src") ||
      container.find("img").attr("data-src") ||
      container.find("img").attr("data-original");

    const key = `${sourceUrl.toLowerCase()}:${price}`;
    if (seen.has(key)) return;
    seen.add(key);

    candidates.push({
      name,
      price,
      source_url: sourceUrl,
      image_url: normaliseCandidateImage(image, searchUrl),
      description: name,
    });
  });

  return candidates.slice(0, 12);
}

async function harvestSearchPageProducts(
  searchUrl: string,
  query: string,
): Promise<SearchPageProductCandidate[]> {
  const response = await fetch(searchUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; SchoolgleDealFinder/1.0; +https://schoolgle.co.uk)",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) return [];
  const html = await response.text();
  return extractProductCandidatesFromSearchHtml(html, searchUrl, query);
}

function tokenMatchesProduct(token: string, productName: string): boolean {
  if (productName.includes(token)) return true;
  if (token.endsWith("s") && productName.includes(token.slice(0, -1))) {
    return true;
  }
  return false;
}

export function isRelevantProductName(name: string, query: string): boolean {
  const productName = name.toLowerCase();
  const queryTokens = tokeniseQuery(query);
  const distinctiveTokens = distinctiveQueryTokens(query);

  if (distinctiveTokens.length > 0) {
    return distinctiveTokens.some((token) =>
      productName.replace(/[^a-z0-9]+/g, "").includes(token.replace(/[^a-z0-9]+/g, "")),
    );
  }

  const matchedTokens = queryTokens.filter((token) =>
    tokenMatchesProduct(token, productName),
  );
  return matchedTokens.length >= Math.min(2, queryTokens.length);
}

function isValidDiscoveredProduct(
  name: string,
  price: number | undefined,
  query: string,
): boolean {
  if (!name || BLOCKED_OR_INVALID_TITLES.some((pattern) => pattern.test(name))) {
    return false;
  }

  return typeof price === "number" && price > 0 && isRelevantProductName(name, query);
}

function scoreSupplierForQuery(
  supplier: { supplier_name: string; search_url_template: string | null },
  query: string,
): number {
  const text = `${supplier.supplier_name} ${supplier.search_url_template || ""}`.toLowerCase();
  const q = query.toLowerCase();
  let score = 0;

  const hasAny = (terms: string[]) => terms.some((term) => q.includes(term));
  const supplierHasAny = (terms: string[]) => terms.some((term) => text.includes(term));

  if (hasAny(["paper", "ream", "copier", "copy", "a4", "exercise book"])) {
    if (
      supplierHasAny([
        "ypo",
        "espo",
        "kcs",
        "tts",
        "hope",
        "gls",
        "gompels",
        "viking",
        "office",
        "paper",
        "rhino",
        "direct-ed",
        "springboard",
        "eprint",
      ])
    ) {
      score += 40;
    }
  }

  if (hasAny(["ink", "toner", "cartridge", "printer", "hp ", "canon", "epson", "brother"])) {
    if (
      supplierHasAny([
        "printer",
        "cartridge",
        "stinky",
        "internet-ink",
        "viking",
        "office",
        "cpc",
        "rapid",
        "rs-online",
        "amazon",
        "staples",
        "lyreco",
        "euroffice",
      ])
    ) {
      score += 45;
    }
  }

  if (hasAny(["pencil", "pencils", "hb", "classpack", "classroom", "school pack"])) {
    if (
      supplierHasAny([
        "ypo",
        "espo",
        "kcs",
        "tts",
        "hope",
        "gls",
        "consortium",
        "findel",
        "gompels",
        "viking",
        "stationery",
        "office",
        "springboard",
        "cult",
        "amazon",
      ])
    ) {
      score += 50;
    }
  }

  if (hasAny(["wipe", "toilet", "hand towel", "soap", "glove", "clean", "sanitiser", "bleach"])) {
    if (
      supplierHasAny([
        "gompels",
        "ypo",
        "espo",
        "phs",
        "janpal",
        "mustang",
        "vertella",
        "duckworth",
        "loorolls",
        "clean",
        "hygiene",
        "nisbets",
        "bunzl",
        "arco",
      ])
    ) {
      score += 45;
    }
  }

  if (hasAny(["chromebook", "laptop", "ipad", "keyboard", "headphone", "monitor", "cable", "usb"])) {
    if (
      supplierHasAny([
        "rm",
        "xma",
        "stone",
        "academia",
        "insight",
        "cdw",
        "jigsaw",
        "ebuyer",
        "scan",
        "ccl",
        "box",
        "cpc",
        "rapid",
        "rs-online",
        "amazon",
      ])
    ) {
      score += 45;
    }
  }

  if (supplierHasAny(["ypo", "espo", "kcs", "gompels", "viking", "amazon"])) {
    score += 10;
  }

  return score;
}

async function resolveProductUrlsFromSearch(
  searchUrl: string,
  query: string,
): Promise<string[]> {
  const key = process.env.FIRECRAWL_API_KEY;
  const candidateUrls: string[] = [];

  if (key) {
    const FirecrawlApp = (await import("@mendable/firecrawl-js")).default;
    const { z } = await import("zod");

    const SearchResultSchema = z.object({
      first_product_url: z.string().optional(),
      first_product_name: z.string().optional(),
    });

    const client = new FirecrawlApp({ apiKey: key });
    const searchResult = await client.scrape(searchUrl, {
      formats: [{ type: "json" as const, schema: SearchResultSchema }],
    });

    const productUrl = (searchResult as { json?: { first_product_url?: string } })
      .json?.first_product_url;
    if (productUrl) {
      candidateUrls.push(
        productUrl.startsWith("http")
          ? productUrl
          : new URL(productUrl, searchUrl).toString(),
      );
    }
  }

  candidateUrls.push(...(await discoverCandidateProductUrls(searchUrl, query)));

  return Array.from(new Set(candidateUrls)).slice(0, 5);
}

function chooseDiscoveryPackDetails(
  extractedQuantity: number | null | undefined,
  extractedUnit: string | null | undefined,
  regexPack: ReturnType<typeof parsePackInfo>,
): { packQuantity: number; packUnit: string } {
  if (regexPack.pack_unit === "ream" || regexPack.pack_quantity > 1) {
    return {
      packQuantity: regexPack.pack_quantity,
      packUnit: regexPack.pack_unit,
    };
  }

  return {
    packQuantity:
      extractedQuantity && extractedQuantity > 0
        ? extractedQuantity
        : regexPack.pack_quantity,
    packUnit: extractedUnit || regexPack.pack_unit,
  };
}

async function scrapeAndStoreCandidate(
  resolvedUrl: string,
  supplierId: string,
  query: string,
): Promise<boolean> {
  const jobId = await createScrapeJob(resolvedUrl, "discovery");
  await updateScrapeJob(jobId, { status: "scraping" });

  let validated;
  try {
    const raw = await firecrawlExtract(resolvedUrl);
    validated = ExtractedProductSchema.parse(raw);
  } catch {
    const extractor = findExtractor(resolvedUrl);
    const rawProduct = await extractor.extract(resolvedUrl);
    validated = ExtractedProductSchema.parse(rawProduct);
  }

  if (!isValidDiscoveredProduct(validated.name, validated.price, query)) {
    await updateScrapeJob(jobId, {
      status: "failed",
      error_message: `Rejected non-product discovery result: ${validated.name}`,
    });
    return false;
  }
  validated = normaliseSupplierProduct(validated, resolvedUrl);
  const priceGbp = validated.price!;

  const regexPack = parsePackInfo(validated.name, validated.description);
  const packDetails = chooseDiscoveryPackDetails(
    validated.pack_quantity,
    validated.pack_unit,
    regexPack,
  );
  const packQuantity = packDetails.packQuantity;
  const packUnit = packDetails.packUnit;
  const unitWeightG = validated.unit_weight_g || regexPack.unit_weight_g;
  const unitVolumeMl = validated.unit_volume_ml || regexPack.unit_volume_ml;

  const unitPriceEach =
    validated.price && packQuantity > 0
      ? +(validated.price / packQuantity).toFixed(4)
      : null;
  const unitPricePerG =
    unitPriceEach && unitWeightG && unitWeightG > 0
      ? +(unitPriceEach / unitWeightG).toFixed(6)
      : null;

  const canonicalKey = generateCanonicalKey(
    validated.name,
    validated.brand,
    unitWeightG,
    unitVolumeMl,
  );
  const equivalenceGroup = generateEquivalenceGroup(
    validated.name,
    validated.description,
  );

  const fingerprint = generateFingerprint(validated);
  const productId = await upsertProduct({
    name: validated.name,
    description: validated.description,
    sku: validated.sku,
    brand: validated.brand,
    barcode: validated.barcode,
    image_url: validated.image_url,
    source_url: validated.source_url,
    fingerprint,
    supplier_id: supplierId,
    typical_price: priceGbp,
    specs: validated.specs,
  });

  const confidence =
    validated.pack_quantity && validated.pack_quantity > 1
      ? 0.95
      : regexPack.confidence;

  await upsertProductUnitDetails({
    product_id: productId,
    pack_quantity: packQuantity,
    pack_unit: packUnit,
    unit_weight_g: unitWeightG,
    unit_volume_ml: unitVolumeMl,
    unit_price_each: unitPriceEach,
    unit_price_per_g: unitPricePerG,
    canonical_product_key: canonicalKey,
    equivalence_group: equivalenceGroup,
    raw_pack_text: regexPack.raw_pack_text,
    raw_weight_text: regexPack.raw_weight_text,
    extraction_confidence: confidence,
  });

  await upsertPrice(productId, supplierId, priceGbp, resolvedUrl);

  await updateScrapeJob(jobId, {
    status: "complete",
    scraped_product_id: productId,
  });

  console.log(
    `[discovery] Found: ${validated.name} @ £${priceGbp} from ${resolvedUrl}`,
  );
  return true;
}

async function storeSearchPageCandidate(
  candidate: SearchPageProductCandidate,
  supplierId: string,
): Promise<boolean> {
  const validated = normaliseSupplierProduct(
    {
      name: candidate.name,
      description: candidate.description,
      price: candidate.price,
      currency: "GBP",
      image_url: candidate.image_url,
      source_url: candidate.source_url,
      in_stock: true,
    },
    candidate.source_url,
  );
  validated.source_url = applyAffiliateParameters(
    validated.source_url || candidate.source_url,
  );

  const regexPack = parsePackInfo(validated.name, validated.description);
  const packDetails = chooseDiscoveryPackDetails(
    validated.pack_quantity,
    validated.pack_unit,
    regexPack,
  );
  const packQuantity = packDetails.packQuantity;
  const packUnit = packDetails.packUnit;
  const unitWeightG = validated.unit_weight_g || regexPack.unit_weight_g;
  const unitVolumeMl = validated.unit_volume_ml || regexPack.unit_volume_ml;
  const unitPriceEach =
    validated.price && packQuantity > 0
      ? +(validated.price / packQuantity).toFixed(4)
      : null;
  const unitPricePerG =
    unitPriceEach && unitWeightG && unitWeightG > 0
      ? +(unitPriceEach / unitWeightG).toFixed(6)
      : null;
  const canonicalKey = generateCanonicalKey(
    validated.name,
    validated.brand,
    unitWeightG,
    unitVolumeMl,
  );
  const equivalenceGroup = generateEquivalenceGroup(
    validated.name,
    validated.description,
  );
  const fingerprint = generateFingerprint(validated);
  const productId = await upsertProduct({
    name: validated.name,
    description: validated.description,
    sku: validated.sku,
    brand: validated.brand,
    barcode: validated.barcode,
    image_url: validated.image_url,
    source_url: validated.source_url,
    fingerprint,
    supplier_id: supplierId,
    typical_price: candidate.price,
    specs: validated.specs,
  });

  await upsertProductUnitDetails({
    product_id: productId,
    pack_quantity: packQuantity,
    pack_unit: packUnit,
    unit_weight_g: unitWeightG,
    unit_volume_ml: unitVolumeMl,
    unit_price_each: unitPriceEach,
    unit_price_per_g: unitPricePerG,
    canonical_product_key: canonicalKey,
    equivalence_group: equivalenceGroup,
    raw_pack_text: regexPack.raw_pack_text,
    raw_weight_text: regexPack.raw_weight_text,
    extraction_confidence: regexPack.confidence,
  });

  await upsertPrice(productId, supplierId, candidate.price, candidate.source_url);
  return true;
}

async function discoverFromSupplier(
  searchUrl: string,
  supplierId: string,
  query: string,
  maxProductsPerSupplier: number,
  useProductPageFallback: boolean,
): Promise<number> {
  let foundCount = 0;

  try {
    const searchPageCandidates = await harvestSearchPageProducts(searchUrl, query);
    for (const candidate of searchPageCandidates) {
      const found = await storeSearchPageCandidate(candidate, supplierId);
      if (found) foundCount++;
      if (foundCount >= maxProductsPerSupplier) return foundCount;
    }
  } catch (error) {
    console.warn(
      "[discovery] Search page harvest failed:",
      error instanceof Error ? error.message : String(error),
    );
  }

  if (!useProductPageFallback) {
    return foundCount;
  }

  const productUrls = await resolveProductUrlsFromSearch(searchUrl, query);
  if (!productUrls.length) return foundCount;

  for (const productUrl of productUrls) {
    const found = await scrapeAndStoreCandidate(productUrl, supplierId, query);
    if (found) foundCount++;
    if (foundCount >= maxProductsPerSupplier) break;
  }

  return foundCount;
}

/**
 * Auto-discover a product across known suppliers.
 * Errors are logged, never thrown.
 */
export async function discoverProduct(
  name: string,
  brand: string | undefined,
  skipSupplierIds: string[],
  onComplete?: () => void,
  options?: {
    equivalenceGroup?: string | null;
    maxSuppliers?: number;
    maxProductsPerSupplier?: number;
    targetResults?: number;
    timeoutMs?: number;
    useProductPageFallback?: boolean;
  },
): Promise<void> {
  if (activeDiscoveries >= MAX_CONCURRENT_DISCOVERIES) {
    console.log("[discovery] Max concurrent discoveries reached, skipping");
    return;
  }

  activeDiscoveries++;

  try {
    const suppliers = await getSupplierSearchUrls();
    const queries = buildDiscoveryQueries(name, brand, options?.equivalenceGroup);
    if (!queries.length) return;

    const maxProductsPerSupplier = options?.maxProductsPerSupplier ?? 1;
    const targetResults = options?.targetResults ?? 1;
    const useProductPageFallback = options?.useProductPageFallback ?? true;
    let totalSucceeded = 0;
    let totalFailed = 0;

    for (const query of queries) {
      if (!query || query.length < 3) continue;

      const targets = suppliers
      .filter(
        (supplier) =>
          !skipSupplierIds.includes(supplier.supplier_id) &&
          supplier.search_url_template,
      )
      .sort(
        (a, b) => scoreSupplierForQuery(b, query) - scoreSupplierForQuery(a, query),
      )
      .slice(0, options?.maxSuppliers ?? MAX_DISCOVERY_SUPPLIERS);

      if (!targets.length) continue;

      console.log(
        `[discovery] Searching ${targets.length} suppliers for: "${query}"`,
      );

      const results = await Promise.allSettled(
        targets.map((supplier) => {
          const searchUrl = supplier.search_url_template!.replace(
            "{query}",
            encodeURIComponent(query),
          );
          return Promise.race([
            discoverFromSupplier(
              searchUrl,
              supplier.supplier_id,
              query,
              maxProductsPerSupplier,
              useProductPageFallback,
            ),
            new Promise<number>((_, reject) =>
              setTimeout(
                () => reject(new Error("Discovery timeout")),
                options?.timeoutMs ?? DISCOVERY_TIMEOUT_MS,
              ),
            ),
          ]);
        }),
      );

      const succeeded = results.reduce((count, result) => {
        if (result.status === "fulfilled") return count + result.value;
        return count;
      }, 0);
      const failed = results.filter((result) => result.status === "rejected").length;
      totalSucceeded += succeeded;
      totalFailed += failed;

      console.log(
        `[discovery] Query complete: ${succeeded} found, ${failed} failed`,
      );

      if (totalSucceeded >= targetResults) break;
    }

    console.log(
      `[discovery] Complete: ${totalSucceeded} found, ${totalFailed} failed`,
    );

    if (onComplete) onComplete();
  } catch (err) {
    console.error("[discovery] Unexpected error:", err);
  } finally {
    activeDiscoveries--;
  }
}
