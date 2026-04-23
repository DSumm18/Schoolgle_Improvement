"use client";

import { useState } from "react";
import { ExternalLink, Package, Star } from "lucide-react";
import type { ScrapedProduct } from "@/lib/deal-finder/types";

interface ScrapedProductCardProps {
  product: ScrapedProduct;
}

function formatPackInfo(product: ScrapedProduct): string | null {
  const parts: string[] = [];
  if (product.pack_quantity > 1) {
    const unit = product.pack_unit === "each" ? "pack" : product.pack_unit;
    parts.push(`${unit.charAt(0).toUpperCase() + unit.slice(1)} of ${product.pack_quantity}`);
  }
  if (product.unit_weight_g) {
    parts.push(`${product.unit_weight_g}g per item`);
  }
  return parts.length > 0 ? parts.join(" | ") : null;
}

export function ScrapedProductCard({ product }: ScrapedProductCardProps) {
  const packInfo = formatPackInfo(product);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="border-2 border-cyan-300/30 rounded-xl shadow-lg p-6 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-cyan-500 text-cyan-600">
          Your Product
        </span>
        {product.brand && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {product.brand}
          </span>
        )}
      </div>

      <div className="flex gap-6">
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-24 h-24 object-contain rounded-lg bg-gray-50 flex-shrink-0"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {product.name}
          </h3>
          {product.rating_value && (
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-amber-600">
              <div className="flex items-center">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <span className="font-bold">{product.rating_value.toFixed(1)}</span>
              {product.rating_count && <span className="text-amber-700/70">({product.rating_count.toLocaleString()} reviews)</span>}
            </div>
          )}
          {packInfo && <p className="text-sm text-gray-500 mt-1">{packInfo}</p>}
          {product.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
          )}
          {product.sku && (
            <p className="text-xs text-gray-400 mt-1">SKU: {product.sku}</p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          {product.price ? (
            <>
              <p className="text-2xl font-bold text-gray-900">
                £{product.price.toFixed(2)}
              </p>
              {product.unit_price_each && product.pack_quantity > 1 && (
                <p className="text-sm text-gray-500 mt-0.5">
                  £{product.unit_price_each.toFixed(2)} each
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">Price not found</p>
          )}
          <a
            href={product.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cyan-500 hover:underline mt-2"
          >
            View original <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
