const AMAZON_UK_HOST_RE = /(^|\.)amazon\.co\.uk$/i;

export function isAmazonUkUrl(sourceUrl: string | null | undefined): boolean {
  if (!sourceUrl) return false;

  try {
    return AMAZON_UK_HOST_RE.test(new URL(sourceUrl).hostname);
  } catch {
    return sourceUrl.toLowerCase().includes("amazon.co.uk");
  }
}

export function applyAffiliateParameters(sourceUrl: string): string {
  const amazonAssociateTag = process.env.AMAZON_ASSOCIATE_TAG?.trim();
  if (!amazonAssociateTag) return sourceUrl;

  try {
    const url = new URL(sourceUrl);
    if (!AMAZON_UK_HOST_RE.test(url.hostname)) return sourceUrl;

    url.searchParams.set("tag", amazonAssociateTag);
    return url.toString();
  } catch {
    return sourceUrl;
  }
}

export function buildAmazonSearchUrl(query: string): string {
  const url = new URL("https://www.amazon.co.uk/s");
  url.searchParams.set("k", query.trim());
  return applyAffiliateParameters(url.toString());
}
