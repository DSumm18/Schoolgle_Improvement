import {
  buildAmazonSearchUrl,
  isAmazonUkUrl,
} from "../affiliate-links";
import type { RetailerSearchLink } from "../types";

interface SearchLinkMatch {
  supplier_name: string;
  price_gbp: number | null;
  source_url: string | null;
}

function hasVerifiedAmazonResult(matches: SearchLinkMatch[]): boolean {
  return matches.some(
    (match) =>
      match.price_gbp !== null &&
      (match.supplier_name.toLowerCase().includes("amazon") ||
        isAmazonUkUrl(match.source_url)),
  );
}

export function buildRetailerSearchLinks(
  productName: string,
  sourceUrl: string,
  matches: SearchLinkMatch[],
): RetailerSearchLink[] {
  if (isAmazonUkUrl(sourceUrl) || hasVerifiedAmazonResult(matches)) {
    return [];
  }

  return [
    {
      supplier_name: "Amazon Business UK",
      url: buildAmazonSearchUrl(productName),
      price_verified: false,
      reason:
        "Amazon prices can change quickly and search pages often block automated scraping, so this live check is shown separately until we can verify a product price.",
    },
  ];
}
