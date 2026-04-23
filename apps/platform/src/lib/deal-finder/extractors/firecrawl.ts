import type { ExtractedProduct } from "./base";
import * as cheerio from "cheerio";

let _client: unknown = null;

async function getClient() {
  if (!_client) {
    const key = process.env.FIRECRAWL_API_KEY;
    if (key) {
      const FirecrawlApp = (await import("@mendable/firecrawl-js")).default;
      _client = new FirecrawlApp({ apiKey: key });
    }
  }
  return _client as any;
}

// Fallback logic for when Firecrawl fails / LLM blocks on Cookies
async function fallbackScrape(url: string, rawTitleFallback?: string): Promise<ExtractedProduct> {
    console.log(`[Universal Scraper] Initiating explicit fallback extraction for ${url}...`);
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept-Language": "en-GB,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
            }
        });
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // 1. JSON-LD Extraction (Highly reliable for SPAs like Viking)
        let jsonLdPrice: number | undefined;
        let jsonLdImage: string | undefined;
        let jsonLdTitle: string | undefined;
        let jsonLdDesc: string | undefined;

        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const data = JSON.parse($(el).html() || "{}");
                const products = Array.isArray(data) ? data : (data["@graph"] || [data]);
                for (const item of products) {
                   if (item["@type"] === "Product") {
                       if (item.name) jsonLdTitle = item.name;
                       if (item.description) jsonLdDesc = item.description;
                       if (item.image) {
                           jsonLdImage = Array.isArray(item.image) ? item.image[0] : (item.image.url || item.image);
                       }
                       const offers = item.offers;
                       if (offers) {
                           const offer = Array.isArray(offers) ? offers[0] : offers;
                           if (offer.price) jsonLdPrice = parseFloat(offer.price);
                       }
                   }
                }
            } catch (e) {
                // Ignore parse errors on bad schema blocks
            }
        });

        let title = jsonLdTitle || $('meta[property="og:title"]').attr('content') || $('title').text() || rawTitleFallback;
        if (!title) title = "Unknown Product - Seed Match";
        
        // clean generic titles
        title = title.replace(/\|.*/g, '').replace(/-.*/g, '').trim();

        let image_url = jsonLdImage || $('meta[property="og:image"]').attr('content') || $('img[itemprop="image"]').attr('src') || $('img.product-image').attr('src') || undefined;
        let description = jsonLdDesc || $('meta[property="og:description"]').attr('content') || undefined;

        // Try specifically to locate price if JSON-LD missed it
        let price: number | undefined = jsonLdPrice;
        if (!price) {
            const priceRegex = /£\s?(\d+(?:\.\d{2})?)/;
            // Search common price elements first
            const priceText = $('.price, [data-price],meta[itemprop="price"], .product-price, .viking-price, [data-test-id="product-price"]').first().text() || html.substring(0, 15000);
            const match = priceText.match(priceRegex);
            if (match && match[1]) {
               price = parseFloat(match[1]);
            }
        }
        
        // Pack Quantity Heuristic
        let packQty = title.toLowerCase().match(/pack of (\d+)/)?.[1] || title.toLowerCase().match(/(\d+)\s?pk/)?.[1];
        const parsedPackQty = packQty ? parseInt(packQty) : 1;

        return {
            name: title,
            description: description,
            price: price,
            currency: "GBP",
            sku: undefined,
            brand: undefined,
            barcode: undefined,
            image_url: image_url,
            source_url: url,
            in_stock: true,
            pack_quantity: parsedPackQty,
            pack_unit: "pack",
            unit_weight_g: undefined,
            unit_volume_ml: undefined,
            rating_value: undefined,
            rating_count: undefined,
        };
    } catch (e) {
        throw new Error(`Complete extraction failure (Firecrawl + Native Fallback) for ${url}: ` + e);
    }
}

export async function firecrawlExtract(url: string): Promise<ExtractedProduct> {
  const { z } = await import("zod");

  const FirecrawlProductSchema = z.object({
    product_name: z.string().describe("The product name or title"),
    description: z.string().optional().describe("Product description"),
    price: z.number().optional().describe("Current selling price as a number"),
    currency: z.string().optional().describe("Currency code, e.g. GBP, USD, EUR"),
    sku: z.string().optional().describe("Product SKU, item code, or ASIN"),
    brand: z.string().optional().describe("Brand or manufacturer name"),
    barcode: z.string().optional().describe("EAN, UPC, GTIN barcode if available"),
    image_url: z.string().optional().describe("Main product image URL"),
    in_stock: z.boolean().optional().describe("Whether the product is currently in stock"),
    pack_quantity: z.number().optional().describe("Number of items in the pack"),
    pack_unit: z.string().optional().describe("Pack unit type"),
    unit_weight_g: z.number().optional().describe("Weight per single item in grams"),
    unit_volume_ml: z.number().optional().describe("Volume per single item in millilitres"),
    rating_value: z.number().optional().describe("Average star rating out of 5"),
    rating_count: z.number().optional().describe("Total number of reviews/ratings"),
  });

  const client = await getClient();
  
  if (!client) {
     return fallbackScrape(url);
  }

  let result;
  try {
    result = await client.scrape(url, {
      formats: [{
         type: "json",
         prompt: "Extract the core product title, price, pack size, stock, and SKU. You MUST look past any cookie consent popups or generic region selector warnings.",
         schema: FirecrawlProductSchema
      }],
      timeout: 10000,
    });
  } catch (scrapeErr) {
    console.warn(`[Extraction] Firecrawl threw an error (${scrapeErr}). Initiating fallback...`);
    return fallbackScrape(url);
  }

  // Look under result.json for v1 API or result for v0
  const extracted = result?.json || result?.data;
  
  // If Firecrawl returned an empty name or nulls because of Cookie Banners
  if (!extracted?.product_name || extracted?.product_name === "" || extracted?.product_name.includes("Cookie")) {
     console.warn(`[Extraction] Firecrawl hit a Cookie Wall or failed LLM mapping. Initiating fallback...`);
     return fallbackScrape(url, extracted?.product_name);
  }

  const nonEmpty = (v: string | undefined) =>
    v && v.trim() ? v.trim() : undefined;

  return {
    name: extracted.product_name as string,
    description: nonEmpty(extracted.description as string | undefined),
    price: extracted.price as number | undefined,
    currency: (extracted.currency as string) || "GBP",
    sku: nonEmpty(extracted.sku as string | undefined),
    brand: nonEmpty(extracted.brand as string | undefined),
    barcode: nonEmpty(extracted.barcode as string | undefined),
    image_url: nonEmpty(extracted.image_url as string | undefined),
    source_url: url,
    in_stock: (extracted.in_stock as boolean) ?? true,
    pack_quantity: (extracted.pack_quantity as number) ?? undefined,
    pack_unit: nonEmpty(extracted.pack_unit as string | undefined),
    unit_weight_g: (extracted.unit_weight_g as number) ?? undefined,
    unit_volume_ml: (extracted.unit_volume_ml as number) ?? undefined,
    rating_value: (extracted.rating_value as number) ?? undefined,
    rating_count: (extracted.rating_count as number) ?? undefined,
  };
}
