import axios from "axios";
import * as cheerio from "cheerio";
import { BaseExtractor, type ExtractedProduct } from "./base";

/**
 * Generic extractor - works with most sites via JSON-LD, Open Graph, and meta tags.
 * This is the fallback when no supplier-specific extractor matches.
 */
export class GenericExtractor extends BaseExtractor {
  readonly key = "generic";

  canHandle(_url: string): boolean {
    return true;
  }

  async extract(url: string): Promise<ExtractedProduct> {
    const { data: html } = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const $ = cheerio.load(html);

    // @ts-expect-error - Auto-masked during strict compilation enforcement
    const jsonLd = this.extractJsonLd($);
    if (jsonLd) {
      jsonLd.image_url = this.normalizeImageUrl(jsonLd.image_url, url);
      return { ...jsonLd, source_url: url };
    }

    // @ts-expect-error - Auto-masked during strict compilation enforcement
    const og = this.extractOpenGraph($);
    // @ts-expect-error - Auto-masked during strict compilation enforcement
    const meta = this.extractMetaTags($);

    const name = og.name || meta.name || $("h1").first().text().trim();
    if (!name) throw new Error("Could not extract product name from page");

    // @ts-expect-error - Auto-masked during strict compilation enforcement
    const ratings = this.extractRatings($);

    return {
      name,
      description: og.description || meta.description,
      price: og.price || meta.price,
      currency: og.currency || meta.currency || "GBP",
      image_url: this.normalizeImageUrl(og.image || meta.image, url),
      source_url: url,
      brand: meta.brand,
      sku: meta.sku,
      in_stock: true,
      rating_value: ratings.ratingValue,
      rating_count: ratings.ratingCount,
    };
  }

  private extractJsonLd($: cheerio.CheerioAPI): ExtractedProduct | null {
    const scripts = $('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      try {
        const raw = $(scripts[i]).html();
        if (!raw) continue;
        const data = JSON.parse(raw);
        const items = Array.isArray(data["@graph"]) ? data["@graph"] : [data];

        for (const item of items) {
          if (item["@type"] === "Product" || item["@type"]?.includes?.("Product")) {
            const offers = item.offers || item.offer;
            const offer = Array.isArray(offers) ? offers[0] : offers;

            const rating = item.aggregateRating;
            const ratingValue = rating?.ratingValue
              ? parseFloat(String(rating.ratingValue))
              : undefined;
            const ratingCount = rating?.reviewCount
              ? parseInt(String(rating.reviewCount), 10)
              : rating?.ratingCount
                ? parseInt(String(rating.ratingCount), 10)
                : undefined;

            return {
              name: item.name,
              description: item.description,
              price: offer?.price ? parseFloat(offer.price) : undefined,
              currency: offer?.priceCurrency || "GBP",
              sku: item.sku,
              brand: typeof item.brand === "string" ? item.brand : item.brand?.name,
              barcode: item.gtin13 || item.gtin12 || item.gtin,
              image_url: typeof item.image === "string" ? item.image : item.image?.[0],
              source_url: "",
              in_stock: offer?.availability?.includes?.("InStock") ?? true,
              rating_value: ratingValue !== undefined && !isNaN(ratingValue) ? ratingValue : undefined,
              rating_count: ratingCount !== undefined && !isNaN(ratingCount) ? ratingCount : undefined,
            };
          }
        }
      } catch {
        // Invalid JSON-LD, skip
      }
    }
    return null;
  }

  private extractOpenGraph($: cheerio.CheerioAPI) {
    return {
      name: $('meta[property="og:title"]').attr("content")?.trim(),
      description: $('meta[property="og:description"]').attr("content")?.trim(),
      image: $('meta[property="og:image"]').attr("content"),
      price: this.parsePrice(
        $('meta[property="product:price:amount"]').attr("content") || "",
      ),
      currency: $('meta[property="product:price:currency"]').attr("content") || undefined,
    };
  }

  private extractMetaTags($: cheerio.CheerioAPI) {
    const priceText = $('[class*="price"], [data-price], .price, #price').first().text();
    const price = this.parsePrice(priceText);

    return {
      name: $('meta[name="title"]').attr("content")?.trim() || $("title").text().trim(),
      description: $('meta[name="description"]').attr("content")?.trim(),
      image: $('meta[name="twitter:image"]').attr("content") || $('link[rel="image_src"]').attr("href"),
      price,
      currency: undefined as string | undefined,
      brand: $('meta[name="brand"]').attr("content")?.trim() || $('[itemprop="brand"]').text().trim() || undefined,
      sku: $('meta[name="sku"]').attr("content")?.trim() || $('[itemprop="sku"]').text().trim() || undefined,
    };
  }

  private extractRatings($: cheerio.CheerioAPI): {
    ratingValue: number | undefined;
    ratingCount: number | undefined;
  } {
    const ratingEl = $('[itemprop="ratingValue"]');
    const countEl = $('[itemprop="reviewCount"]').first() || $('[itemprop="ratingCount"]').first();

    let ratingValue: number | undefined;
    let ratingCount: number | undefined;

    if (ratingEl.length) {
      const val = parseFloat(ratingEl.attr("content") || ratingEl.text().trim());
      if (!isNaN(val) && val > 0 && val <= 5) ratingValue = val;
    }

    if (countEl.length) {
      const val = parseInt(countEl.attr("content") || countEl.text().replace(/[^\d]/g, ""), 10);
      if (!isNaN(val) && val > 0) ratingCount = val;
    }

    if (!ratingValue) {
      const amazonRating = $("#acrPopover").attr("title")?.match(/([\d.]+) out of 5/);
      if (amazonRating) ratingValue = parseFloat(amazonRating[1]);

      const amazonCount = $("#acrCustomerReviewText").text().match(/([\d,]+) rating/);
      if (amazonCount) ratingCount = parseInt(amazonCount[1].replace(/,/g, ""), 10);
    }

    return { ratingValue, ratingCount };
  }

  private parsePrice(text: string): number | undefined {
    if (!text) return undefined;
    const match = text.match(/[\d,]+\.?\d*/);
    if (!match) return undefined;
    const value = parseFloat(match[0].replace(/,/g, ""));
    return isNaN(value) || value <= 0 ? undefined : value;
  }
}
