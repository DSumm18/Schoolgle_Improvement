import axios from "axios";
import * as cheerio from "cheerio";
import { BaseExtractor, type ExtractedProduct } from "./base";

export class CultPensExtractor extends BaseExtractor {
  readonly key = "cult-pens";

  canHandle(url: string): boolean {
    return /cultpens\.com/i.test(url);
  }

  async extract(url: string): Promise<ExtractedProduct> {
    const { data: html } = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    const $ = cheerio.load(html);

    // @ts-expect-error - Auto-masked during strict compilation enforcement
    const jsonLd = this.extractJsonLd($);
    if (jsonLd) return { ...jsonLd, source_url: url };

    const name =
      $("[data-product-name]").attr("data-product-name")?.trim() ||
      $("h1.product-name, h1").first().text().trim();

    if (!name) throw new Error("Could not extract product name from Cult Pens page");

    const priceStr =
      $("[data-price]").attr("data-price") || $(".product-price .price").text();
    const price = this.normalizePrice(priceStr || "");

    const sku =
      $("[data-product-id]").attr("data-product-id")?.trim() ||
      $('[itemprop="sku"]').text().trim();

    const brand =
      $("[data-brand]").text().trim() || $('[itemprop="brand"]').text().trim();

    const image =
      $("img.product-image").attr("src") || $('[itemprop="image"]').attr("src");

    return {
      name,
      price,
      currency: "GBP",
      sku: sku || undefined,
      brand: brand || undefined,
      image_url: this.normalizeImageUrl(image, url),
      source_url: url,
      category: "stationery",
      in_stock: true,
    };
  }

  private extractJsonLd($: cheerio.CheerioAPI): ExtractedProduct | null {
    try {
      const script = $('script[type="application/ld+json"]').first().html();
      if (!script) return null;
      const data = JSON.parse(script);
      if (data["@type"] !== "Product") return null;
      const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
      return {
        name: data.name,
        description: data.description,
        price: offer?.price ? parseFloat(offer.price) : undefined,
        currency: offer?.priceCurrency || "GBP",
        sku: data.sku,
        brand: typeof data.brand === "string" ? data.brand : data.brand?.name,
        image_url: typeof data.image === "string" ? data.image : data.image?.[0],
        source_url: "",
        in_stock: offer?.availability?.includes?.("InStock") ?? true,
      };
    } catch {
      return null;
    }
  }
}
