import type { ExtractedProduct } from "./base";

let _client: unknown = null;

async function getClient() {
  if (!_client) {
    const key = process.env.FIRECRAWL_API_KEY;
    if (!key) throw new Error("FIRECRAWL_API_KEY not set");
    const FirecrawlApp = (await import("@mendable/firecrawl-js")).default;
    _client = new FirecrawlApp({ apiKey: key });
  }
  return _client as { scrape: (url: string, opts: unknown) => Promise<{ json: Record<string, unknown> }> };
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

  let result: { json: Record<string, unknown> };
  try {
    result = await client.scrape(url, {
      formats: [{ type: "json" as const, schema: FirecrawlProductSchema }],
    });
  } catch (scrapeErr) {
    const msg = scrapeErr instanceof Error ? scrapeErr.message : String(scrapeErr);
    throw new Error(`Firecrawl scrape request failed: ${msg}`);
  }

  const extracted = result?.json;
  if (!extracted?.product_name) {
    throw new Error(
      `Firecrawl: no product data extracted from page. Got keys: ${extracted ? Object.keys(extracted).join(', ') : 'null'}`,
    );
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
