import { createServiceRoleClient } from '@/lib/supabase-server';

export interface MatchResult {
  product_id: string;
  product_name: string;
  supplier_id: string;
  supplier_name: string;
  price_gbp: number | null;
  image_url: string | null;
  source_url: string | null;
  match_type: string;
  match_score: number;
  pack_quantity: number;
  pack_unit: string;
  unit_price_each: number | null;
  unit_weight_g: number | null;
  canonical_product_key: string | null;
  equivalence_group: string | null;
  price_date: string | null;
  rating_value: number | null;
  rating_count: number | null;
}

function db() {
  return createServiceRoleClient();
}

export async function findSimilarProducts(
  productId: string,
  limit = 20,
): Promise<MatchResult[]> {
  const { data, error } = await db().rpc("find_similar_products", {
    p_product_id: productId,
    p_limit: limit,
  });

  if (error) {
    console.error("find_similar_products RPC error:", error);
    return [];
  }

  return (data || []) as MatchResult[];
}

export async function upsertProduct(product: {
  name: string;
  description?: string;
  sku?: string;
  brand?: string;
  barcode?: string;
  image_url?: string;
  source_url: string;
  fingerprint: string;
  supplier_id?: string;
  category_id?: string;
  typical_price?: number;
  specs?: Record<string, unknown>;
  rating_value?: number;
  rating_count?: number;
}): Promise<string> {
  let existingId: string | null = null;

  const { data: byFingerprint } = await db()
    .from("products")
    .select("id")
    .eq("fingerprint", product.fingerprint)
    .limit(1)
    .maybeSingle();

  if (byFingerprint) {
    existingId = byFingerprint.id;
  } else {
    const { data: byUrl } = await db()
      .from("products")
      .select("id")
      .eq("source_url", product.source_url)
      .limit(1)
      .maybeSingle();
    if (byUrl) existingId = byUrl.id;
  }

  const payload: Record<string, unknown> = {
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: product.brand,
    barcode: product.barcode,
    image_url: product.image_url,
    source_url: product.source_url,
    fingerprint: product.fingerprint,
    specs: product.specs || {},
    typical_price: product.typical_price,
  };
  if (product.supplier_id) payload.supplier_id = product.supplier_id;
  if (product.rating_value != null) payload.rating_value = product.rating_value;
  if (product.rating_count != null) payload.rating_count = product.rating_count;

  if (existingId) {
    const { data: updated, error: updateError } = await db()
      .from("products")
      .update(payload)
      .eq("id", existingId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("upsertProduct UPDATE error:", updateError);
    }

    if (updated) {
      return updated.id;
    }

    console.warn(
      `[upsertProduct] phantom row ${existingId}, inserting new product`,
    );
  }

  const insertPayload = {
    ...payload,
    supplier_id: product.supplier_id,
    category_id: product.category_id,
  };

  const { data, error } = await db()
    .from("products")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) throw new Error(`Failed to insert product: ${error.message}`);
  return data.id;
}

export async function upsertPrice(
  productId: string,
  supplierId: string,
  priceGbp: number,
  sourceUrl: string,
): Promise<void> {
  const { error } = await db()
    .from("prices")
    .upsert(
      {
        product_id: productId,
        supplier_id: supplierId,
        price_gbp: priceGbp,
        product_url: sourceUrl,
        data_source: "scrape",
        price_date: new Date().toISOString().split("T")[0],
        in_stock: true,
      },
      { onConflict: "product_id,supplier_id" },
    );

  if (error) {
    console.error("upsertPrice error:", error);
  }
}

export async function findSupplierByUrl(
  url: string,
): Promise<{ id: string; extractor_key: string } | null> {
  const { data } = await db()
    .from("supplier_url_patterns")
    .select("supplier_id, url_pattern, extractor_key")
    .eq("is_active", true);

  if (!data) return null;

  for (const row of data) {
    try {
      const regex = new RegExp(row.url_pattern, "i");
      if (regex.test(url)) {
        return {
          id: row.supplier_id,
          extractor_key: row.extractor_key,
        };
      }
    } catch {
      /* skip invalid regex */
    }
  }

  return null;
}

export async function createScrapeJob(
  url: string,
  source: "user" | "discovery" | "refresh" = "user",
): Promise<string> {
  const row: Record<string, unknown> = { url, status: "pending" };
  if (source !== "user") row.source = source;
  const { data, error } = await db()
    .from("url_scrape_jobs")
    .insert(row)
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create scrape job: ${error.message}`);
  return data.id;
}

export async function updateScrapeJob(
  jobId: string,
  updates: {
    status?: string;
    scraped_product_id?: string;
    match_count?: number;
    best_saving_pct?: number;
    best_saving_gbp?: number;
    duration_ms?: number;
    error_message?: string;
  },
): Promise<void> {
  await db().from("url_scrape_jobs").update(updates).eq("id", jobId);
}

export async function cacheProductMatches(
  sourceProductId: string,
  matches: MatchResult[],
  sourcePrice?: number,
): Promise<void> {
  if (!matches.length) return;

  const rows = matches.map((m) => ({
    source_product_id: sourceProductId,
    matched_product_id: m.product_id,
    match_type: m.match_type,
    match_score: m.match_score,
    saving_gbp: sourcePrice && m.price_gbp ? sourcePrice - m.price_gbp : null,
    saving_pct:
      sourcePrice && m.price_gbp && sourcePrice > 0
        ? Math.round(((sourcePrice - m.price_gbp) / sourcePrice) * 10000) / 100
        : null,
  }));

  await db().from("product_matches").upsert(rows, {
    onConflict: "source_product_id,matched_product_id",
  });
}

export interface ProductUnitDetails {
  product_id: string;
  pack_quantity: number;
  pack_unit: string;
  unit_weight_g: number | null;
  unit_volume_ml: number | null;
  unit_price_each: number | null;
  unit_price_per_g: number | null;
  canonical_product_key: string | null;
  equivalence_group: string | null;
  raw_pack_text: string | null;
  raw_weight_text: string | null;
  extraction_confidence: number | null;
}

export async function upsertProductUnitDetails(
  details: ProductUnitDetails,
): Promise<void> {
  const { error } = await db()
    .from("product_unit_details")
    .upsert(details, { onConflict: "product_id" });

  if (error) {
    console.error("upsertProductUnitDetails error:", error);
  }
}

export async function getSupplierSearchUrls(): Promise<
  Array<{
    supplier_id: string;
    supplier_name: string;
    search_url_template: string | null;
  }>
> {
  const { data, error } = await db()
    .from("supplier_url_patterns")
    .select("supplier_id, search_url_template, suppliers(name)")
    .eq("is_active", true)
    .not("search_url_template", "is", null);

  if (error) {
    console.error("getSupplierSearchUrls error:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    supplier_id: row.supplier_id as string,
    supplier_name:
      (row.suppliers as { name: string } | null)?.name || "Unknown",
    search_url_template: row.search_url_template as string | null,
  }));
}
