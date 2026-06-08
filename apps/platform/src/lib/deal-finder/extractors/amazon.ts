import axios from "axios";
import * as cheerio from "cheerio";
import { BaseExtractor, type ExtractedProduct } from "./base";
import { applyAffiliateParameters } from "../affiliate-links";

export class AmazonExtractor extends BaseExtractor {
  readonly key = "amazon";

  canHandle(url: string): boolean {
    return /amazon\.co\.uk/i.test(url);
  }

  async extract(url: string): Promise<ExtractedProduct> {
    const { data: html } = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
    });

    const $ = cheerio.load(html);

    // JSON-LD
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
            barcode: data.gtin13 || data.gtin,
            image_url: typeof data.image === "string" ? data.image : data.image?.[0],
            source_url: url,
            in_stock: offer?.availability?.includes?.("InStock") ?? true,
          };
        }
      } catch {
        /* skip */
      }
    }

    // Amazon-specific DOM selectors
    const name = $("#productTitle").text().trim() || $("h1 span.a-text-normal").text().trim();
    if (!name) throw new Error("Could not extract product from Amazon page");

    const priceWhole = $(".a-price .a-price-whole").first().text().replace(/[^0-9]/g, "");
    const priceFraction = $(".a-price .a-price-fraction").first().text().replace(/[^0-9]/g, "");
    let price: number | undefined;
    if (priceWhole) {
      price = parseFloat(`${priceWhole}.${priceFraction || "00"}`);
    }

    const asinMatch = url.match(/\/(?:dp|product)\/([A-Z0-9]{10})/i);
    const sku = asinMatch?.[1];

    const brand = $("#bylineInfo").text().replace(/^(Visit the |Brand: )/, "").trim() || $("a#bylineInfo").text().trim();

    const image = this.normalizeImageUrl(
      $("#imgTagWrapperId img, #landingImage").attr("src"),
      url,
    );

    return {
      name,
      price,
      currency: "GBP",
      sku: sku || undefined,
      brand: brand || undefined,
      image_url: image,
      source_url: applyAffiliateParameters(url),
      in_stock: !$("#outOfStock").length,
    };
  }
}
