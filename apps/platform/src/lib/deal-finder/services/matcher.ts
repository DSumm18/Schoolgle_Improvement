import { createServiceRoleClient } from '@/lib/supabase-server';
import { createHash } from 'crypto';
import {
  getSearchableSupplierDefinitions,
  normaliseSupplierDomain,
  SEARCHABLE_SUPPLIER_TARGET,
} from '@/lib/deal-finder/suppliers';

export interface MatchResult {
  product_id: string;
  product_name: string;
  product_description?: string | null;
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

let supplierRegistrySync: Promise<void> | null = null;

function deterministicSupplierId(domain: string): string {
  const hash = createHash("sha1")
    .update(`schoolgle-deal-finder:${normaliseSupplierDomain(domain)}`)
    .digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0") + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join("-");
}

function supplierWebsiteAliases(website: string | null | undefined): string[] {
  if (!website) return [];
  try {
    const parsed = new URL(website.startsWith("http") ? website : `https://${website}`);
    const host = normaliseSupplierDomain(parsed.hostname);
    return [host, host.replace(/^uk\./, "")];
  } catch {
    const host = normaliseSupplierDomain(website);
    return [host, host.replace(/^uk\./, "")];
  }
}

async function ensureStaticSupplierRegistry(): Promise<void> {
  const registry = getSearchableSupplierDefinitions();
  if (registry.length < SEARCHABLE_SUPPLIER_TARGET) {
    console.warn(
      `[deal-finder] Supplier registry below target: ${registry.length}/${SEARCHABLE_SUPPLIER_TARGET}`,
    );
  }

  const client = db();
  const { data: existingSuppliers, error: supplierError } = await client
    .from("suppliers")
    .select("id,name,website");

  if (supplierError) {
    console.error("ensureStaticSupplierRegistry suppliers error:", supplierError);
    return;
  }

  const byDomain = new Map<string, { id: string; name: string; website: string | null }>();
  for (const supplier of existingSuppliers || []) {
    for (const alias of supplierWebsiteAliases(supplier.website)) {
      byDomain.set(alias, supplier);
    }
  }

  const supplierIds = new Map<string, string>();
  const suppliersToInsert: Array<{
    id: string;
    name: string;
    website: string;
    verified: boolean;
  }> = [];

  for (const supplier of registry) {
    const domain = normaliseSupplierDomain(supplier.domain);
    const existing = byDomain.get(domain) || byDomain.get(domain.replace(/^uk\./, ""));
    const id = existing?.id || deterministicSupplierId(domain);
    supplierIds.set(domain, id);

    if (!existing) {
      suppliersToInsert.push({
        id,
        name: supplier.name,
        website: `https://${supplier.domain}`,
        verified: true,
      });
    }
  }

  if (suppliersToInsert.length) {
    const { error } = await client.from("suppliers").upsert(suppliersToInsert, {
      onConflict: "id",
    });
    if (error) {
      console.error("ensureStaticSupplierRegistry insert suppliers error:", error);
    }
  }

  const { data: existingPatterns, error: patternError } = await client
    .from("supplier_url_patterns")
    .select("supplier_id,url_pattern,search_url_template");

  if (patternError) {
    console.error("ensureStaticSupplierRegistry patterns error:", patternError);
    return;
  }

  const existingPatternKeys = new Set(
    (existingPatterns || []).map((pattern) =>
      `${pattern.supplier_id}:${pattern.search_url_template || pattern.url_pattern}`,
    ),
  );

  const patternsToInsert = registry
    .map((supplier) => {
      const domain = normaliseSupplierDomain(supplier.domain);
      const supplierId = supplierIds.get(domain);
      if (!supplierId || !supplier.search_url_template) return null;

      const key = `${supplierId}:${supplier.search_url_template}`;
      if (existingPatternKeys.has(key)) return null;

      return {
        supplier_id: supplierId,
        url_pattern: normaliseSupplierDomain(supplier.domain).replace(/\./g, "\\."),
        extractor_key: supplier.extractor_key || "generic",
        is_active: true,
        search_url_template: supplier.search_url_template,
      };
    })
    .filter((pattern): pattern is NonNullable<typeof pattern> => Boolean(pattern));

  if (patternsToInsert.length) {
    const { error } = await client.from("supplier_url_patterns").insert(patternsToInsert);
    if (error) {
      console.error("ensureStaticSupplierRegistry insert patterns error:", error);
    }
  }
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
  }

  let results = (data || []) as MatchResult[];

  // Fallback: Use Equivalence Group if tsvector was too strict
  if (results.length < limit) {
     const { data: sourceUnit } = await db().from('product_unit_details').select('equivalence_group, product_id').eq('product_id', productId).maybeSingle();
     if (sourceUnit && sourceUnit.equivalence_group && sourceUnit.equivalence_group !== 'unknown') {
         const { data: siblingUnits } = await db().from('product_unit_details')
             .select('product_id, equivalence_group, pack_quantity, pack_unit, unit_price_each, unit_weight_g')
             .eq('equivalence_group', sourceUnit.equivalence_group)
             .neq('product_id', productId);
             
         if (siblingUnits && siblingUnits.length > 0) {
             const existingIds = new Set(results.map(r => r.product_id));
             const newIds = siblingUnits.map(u => u.product_id).filter(id => !existingIds.has(id));
             
             if (newIds.length > 0) {
                 const { data: prods } = await db().from('products')
                     .select('id, name, description, image_url, source_url, typical_price, rating_value, rating_count, suppliers(id, name), prices(price_gbp, price_date)')
                     .in('id', newIds);
                     
                 if (prods) {
                     for (const p of prods) {
                         const u = siblingUnits.find(su => su.product_id === p.id);
                         // Handle Supabase joining array vs object for one-to-many vs many-to-one
                         const supplierId = Array.isArray(p.suppliers) ? p.suppliers[0]?.id : (p.suppliers as any)?.id;
                         const supplierName = Array.isArray(p.suppliers) ? p.suppliers[0]?.name : (p.suppliers as any)?.name;
                         const priceObj = Array.isArray(p.prices) ? p.prices[0] : p.prices;
                         
                         results.push({
                             product_id: p.id,
                             product_name: p.name,
                             product_description: p.description,
                             supplier_id: supplierId || 'unknown',
                             supplier_name: supplierName || 'Unknown',
                             price_gbp: priceObj?.price_gbp || p.typical_price || 0,
                             image_url: p.image_url,
                             source_url: p.source_url,
                             match_type: 'category_equivalence',
                             match_score: 55, // distinct score to highlight it
                             pack_quantity: u?.pack_quantity || 1,
                             pack_unit: u?.pack_unit || 'pack',
                             unit_price_each: u?.unit_price_each || null,
                             unit_weight_g: u?.unit_weight_g || null,
                             canonical_product_key: null,
                             equivalence_group: sourceUnit.equivalence_group,
                             price_date: priceObj?.price_date || null,
                             rating_value: p.rating_value || null,
                             rating_count: p.rating_count || null
                         });
                     }
                 }
             }
         }
     }
  }

  // Deduplicate and sort by price
  const unique = Array.from(new Map(results.map(r => [r.product_id, r])).values());
  const missingDescriptions = unique.filter((result) => result.product_description === undefined);
  if (missingDescriptions.length > 0) {
    const { data: descriptions } = await db()
      .from("products")
      .select("id,description")
      .in(
        "id",
        missingDescriptions.map((result) => result.product_id),
      );
    const descriptionById = new Map(
      (descriptions || []).map((row) => [row.id, row.description || null]),
    );
    for (const result of unique) {
      if (result.product_description === undefined) {
        result.product_description = descriptionById.get(result.product_id) ?? null;
      }
    }
  }
  unique.sort((a, b) => (a.price_gbp || 9999) - (b.price_gbp || 9999));
  
  return unique.slice(0, limit);
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

  if (!existingId) {
    const { data: byName } = await db()
      .from("products")
      .select("id")
      .eq("name", product.name)
      .limit(1)
      .maybeSingle();
    if (byName) existingId = byName.id;
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
  const client = db();
  let { data, error } = await client
    .from("supplier_url_patterns")
    .select("supplier_id, search_url_template, suppliers(name)")
    .eq("is_active", true)
    .not("search_url_template", "is", null);

  if (error) {
    console.error("getSupplierSearchUrls error:", error);
    return [];
  }

  if ((data || []).length < SEARCHABLE_SUPPLIER_TARGET) {
    supplierRegistrySync ||= ensureStaticSupplierRegistry().finally(() => {
      supplierRegistrySync = null;
    });
    await supplierRegistrySync;

    const refreshed = await client
      .from("supplier_url_patterns")
      .select("supplier_id, search_url_template, suppliers(name)")
      .eq("is_active", true)
      .not("search_url_template", "is", null);

    if (refreshed.error) {
      console.error("getSupplierSearchUrls refresh error:", refreshed.error);
    } else {
      data = refreshed.data;
    }
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    supplier_id: row.supplier_id as string,
    supplier_name:
      (row.suppliers as { name: string } | null)?.name || "Unknown",
    search_url_template: row.search_url_template as string | null,
  }));
}
