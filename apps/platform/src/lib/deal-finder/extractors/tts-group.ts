import axios from "axios";
import * as cheerio from "cheerio";
import { BaseExtractor, type ExtractedProduct } from "./base";

export class TTSGroupExtractor extends BaseExtractor {
  readonly key = "tts-group";

  canHandle(url: string): boolean {
    return /tts-group\.co\.uk/i.test(url);
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

    const scripts = $('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      try {
        const data = JSON.parse($(scripts[i]).html() || "");
        if (data["@type"] === "Product") {
          const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
          return {
            name: data.name,
            description: data.description,
            price: offer?.price ? parseFloat(offer.price) : undefined,
            currency: offer?.priceCurrency || "GBP",
            sku: data.sku,
            brand: typeof data.brand === "string" ? data.brand : data.brand?.name,
            image_url: typeof data.image === "string" ? data.image : data.image?.[0],
            source_url: url,
            in_stock: offer?.availability?.includes?.("InStock") ?? true,
          };
        }
      } catch {
        /* skip */
      }
    }

    const name = $("h1").first().text().trim();
    if (!name) throw new Error("Could not extract product from TTS Group page");

    const priceStr = $(".product-price, .price").first().text();
    return {
      name,
      price: this.normalizePrice(priceStr),
      currency: "GBP",
      image_url: this.normalizeImageUrl(
        $("img.product-image, .product-gallery img").first().attr("src"),
        url,
      ),
      source_url: url,
      in_stock: true,
    };
  }
}
