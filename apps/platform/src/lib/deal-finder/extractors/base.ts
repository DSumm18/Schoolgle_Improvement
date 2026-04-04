import { z } from "zod";

export const ExtractedProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  currency: z.string().default("GBP"),
  sku: z.string().optional(),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  image_url: z.string().url().optional(),
  source_url: z.string().url(),
  category: z.string().optional(),
  in_stock: z.boolean().default(true),
  specs: z.record(z.string(), z.unknown()).optional(),
  pack_quantity: z.number().int().positive().optional(),
  pack_unit: z.string().optional(),
  unit_weight_g: z.number().positive().optional(),
  unit_volume_ml: z.number().positive().optional(),
  rating_value: z.number().min(0).max(5).optional(),
  rating_count: z.number().int().optional(),
});

export type ExtractedProduct = z.infer<typeof ExtractedProductSchema>;

export abstract class BaseExtractor {
  abstract readonly key: string;

  abstract canHandle(url: string): boolean;

  abstract extract(url: string): Promise<ExtractedProduct>;

  protected normalizePrice(priceStr: string): number | undefined {
    const cleaned = priceStr.replace(/[^0-9.]/g, "");
    const value = parseFloat(cleaned);
    return isNaN(value) || value <= 0 ? undefined : value;
  }

  protected normalizeImageUrl(
    imageUrl: string | undefined | null,
    baseUrl: string,
  ): string | undefined {
    if (!imageUrl) return undefined;
    const trimmed = imageUrl.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    if (trimmed.startsWith("//")) {
      return `https:${trimmed}`;
    }
    try {
      return new URL(trimmed, baseUrl).toString();
    } catch {
      return undefined;
    }
  }
}
