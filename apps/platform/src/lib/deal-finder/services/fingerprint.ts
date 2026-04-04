import type { ExtractedProduct } from '../extractors/base';

/**
 * Generate a normalized fingerprint for product deduplication.
 * Combines name + brand + SKU into a deterministic string.
 */
export function generateFingerprint(product: ExtractedProduct): string {
  const parts = [
    product.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    (product.brand || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
    (product.sku || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
  ].filter((p) => p.length > 0);

  return parts.join('|');
}
