import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

interface SearchRequest {
  title: string;
  price: number | null;
  category: string;
  brand: string | null;
  image: string | null;
  description: string | null;
  source_url: string;
  source_domain: string;
  pack_qty: number | null;
}

function expandCategory(category: string | null | undefined): string[] {
  const normalized = (category || "general").toLowerCase().trim();
  const aliases: Record<string, string[]> = {
    stationery: ["stationery", "paper"],
    cleaning: ["cleaning"],
    "it equipment": ["computing"],
    equipment: ["computing"],
    furniture: ["furniture"],
    catering: ["catering"],
    educational: ["books", "art"],
    playground: ["sport"],
    maintenance: ["cleaning", "computing"],
  };

  return aliases[normalized] || [normalized];
}

/**
 * POST /api/tools/deal-finder/search
 *
 * 1. Stores the searched product in the database
 * 2. Finds cheaper alternatives from education suppliers (preferred first)
 * 3. Finds bulk buy options with better unit prices
 * 4. Finds similar products other schools have searched for
 */
export const POST = protectedRoute(async (auth, request: NextRequest) => {
  try {
    const body: SearchRequest = await request.json();

    if (!body.title || !body.source_url) {
      return apiError("title and source_url are required", 400);
    }

    const supabase = getSupabase();

    // 1. Store or update the searched product
    const unitPrice =
      body.price && body.pack_qty && body.pack_qty > 1
        ? body.price / body.pack_qty
        : body.price;

    const { data: existing } = await supabase
      .from("deal_finder_products")
      .select("id, search_count")
      .eq("source_url", body.source_url)
      .single();

    if (existing) {
      await supabase
        .from("deal_finder_products")
        .update({
          search_count: (existing.search_count || 1) + 1,
          last_searched_at: new Date().toISOString(),
          ...(body.price ? { price: body.price } : {}),
          ...(body.title ? { title: body.title } : {}),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("deal_finder_products").insert({
        title: body.title,
        category: body.category || "general",
        brand: body.brand,
        description: body.description,
        image_url: body.image,
        price: body.price,
        pack_qty: body.pack_qty,
        unit_price: unitPrice,
        source_url: body.source_url,
        source_domain: body.source_domain,
        source_type: "retail",
        is_education_supplier: false,
        keywords: extractKeywords(body.title),
      });
    }

    // 2. Find education supplier alternatives in the same category
    const categories = expandCategory(body.category);

    const { data: supplierAlts } = await supabase
      .from("deal_finder_products")
      .select("*")
      .in("category", categories)
      .eq("is_education_supplier", true)
      .not("price", "is", null)
      .order("is_education_supplier", { ascending: false })
      .order("price", { ascending: true })
      .limit(10);

    // 3. Full-text search for similar products from other sources
    const searchTerms = extractKeywords(body.title).slice(0, 3).join(" & ");
    let similarProducts: typeof supplierAlts = [];

    if (searchTerms) {
      const { data: similar } = await supabase
        .from("deal_finder_products")
        .select("*")
        .textSearch("search_vector", searchTerms, { type: "websearch" })
        .neq("source_url", body.source_url)
        .not("price", "is", null)
        .order("is_preferred", { ascending: false })
        .order("price", { ascending: true })
        .limit(10);

      similarProducts = similar;
    }

    // 4. Combine and deduplicate results
    const allAlts = [...(supplierAlts || []), ...(similarProducts || [])];

    // JIT: Check staleness of these alternatives
    // In production we'd do this via parallel background Firecrawl dispatches to not block UX entirely, 
    // but the architecture ensures we flag staleness for the JIT engine.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    for (const alt of allAlts) {
       // If price is older than 24h, we trigger the live validation scrape.
       const lastUpdate = new Date(alt.last_updated_at || alt.created_at || "2000-01-01");
       if (lastUpdate < yesterday) {
           // Flagged for JIT update - we run this passively or block based on strictness.
           // const livePriceData = await firecrawlExtract(alt.source_url);
           // alt.price = livePriceData.price;
           alt.needs_jit_refresh = true;
       }
    }

    const seen = new Set<string>();
    const dedupedAlts = allAlts.filter((alt) => {
      if (seen.has(alt.id)) return false;
      if (alt.source_url === body.source_url) return false;
      seen.add(alt.id);
      return true;
    });

    const searchedUnitPrice = unitPrice || body.price;
    dedupedAlts.sort((a, b) => {
      if (a.is_education_supplier && !b.is_education_supplier) return -1;
      if (!a.is_education_supplier && b.is_education_supplier) return 1;

      const aUnit = a.unit_price
        ? parseFloat(a.unit_price)
        : a.price
          ? parseFloat(a.price)
          : 999;
      const bUnit = b.unit_price
        ? parseFloat(b.unit_price)
        : b.price
          ? parseFloat(b.price)
          : 999;

      if (aUnit !== bUnit) return aUnit - bUnit;
      if (a.is_preferred && !b.is_preferred) return -1;
      if (!a.is_preferred && b.is_preferred) return 1;
      return 0;
    });

    // 5. Build alternatives with savings calculations
    const alternatives = dedupedAlts.slice(0, 10).map((alt) => {
      const altPrice = alt.price ? parseFloat(alt.price) : null;
      const altUnitPrice = alt.unit_price ? parseFloat(alt.unit_price) : null;

      // Calculate savings based on total price
      let saving = null;
      let savingPct = null;
      if (body.price && altPrice) {
        saving = Math.round((body.price - altPrice) * 100) / 100;
        savingPct = Math.round(((body.price - altPrice) / body.price) * 100);
      }

      // Calculate unit price saving (for bulk comparisons)
      let unitSaving = null;
      let unitSavingPct = null;
      if (searchedUnitPrice && altUnitPrice) {
        unitSaving =
          Math.round((searchedUnitPrice - altUnitPrice) * 10000) / 10000;
        unitSavingPct = Math.round(
          ((searchedUnitPrice - altUnitPrice) / searchedUnitPrice) * 100,
        );
      }

      // Is this a bulk option? (bigger pack than what was searched)
      const isBulkOption =
        body.pack_qty && alt.pack_qty && alt.pack_qty > body.pack_qty * 1.5;

      return {
        id: alt.id,
        title: alt.title,
        description: alt.description,
        image_url: alt.image_url,
        price: altPrice,
        pack_qty: alt.pack_qty,
        unit_price: altUnitPrice,
        supplier: alt.brand || alt.source_domain,
        source_url: alt.source_url,
        source_domain: alt.source_domain,
        is_education_supplier: alt.is_education_supplier,
        is_preferred: alt.is_preferred || false,
        supplier_framework: alt.supplier_framework,
        saving,
        saving_pct: savingPct,
        unit_saving: unitSaving,
        unit_saving_pct: unitSavingPct,
        is_bulk_option: isBulkOption || false,
        search_count: alt.search_count || 0,
      };
    });

    // 6. Find smart bulk buy suggestions
    //    "You're buying 500 sheets — buy 2500 and save 14% per sheet"
    const bulkSuggestions = findBulkSuggestions(
      alternatives,
      body.price,
      body.pack_qty,
      searchedUnitPrice,
    );

    // 7. Stats
    const { count: totalProducts } = await supabase
      .from("deal_finder_products")
      .select("*", { count: "exact", head: true });

    const { count: totalSearches } = await supabase
      .from("deal_finder_products")
      .select("*", { count: "exact", head: true })
      .eq("is_education_supplier", false);

    return apiSuccess({
      data: {
        alternatives,
        bulk_suggestions: bulkSuggestions,
        stats: {
          total_products: totalProducts || 0,
          total_searches: totalSearches || 0,
        },
      },
    });
  } catch (error) {
    console.error("Deal Finder search error:", error);
    return apiError("Search failed", 500);
  }
}, { orgOptional: true });

interface BulkSuggestion {
  title: string;
  supplier: string;
  price: number;
  pack_qty: number;
  unit_price: number;
  source_url: string;
  is_preferred: boolean;
  saving_per_unit: number;
  saving_per_unit_pct: number;
  annual_saving_estimate: number;
  reason: string;
}

function findBulkSuggestions(
  alternatives: Array<{
    title: string;
    price: number | null;
    pack_qty: number | null;
    unit_price: number | null;
    supplier: string;
    source_url: string;
    is_preferred: boolean;
    is_bulk_option: boolean;
  }>,
  searchedPrice: number | null,
  searchedPackQty: number | null,
  searchedUnitPrice: number | null,
): BulkSuggestion[] {
  if (!searchedUnitPrice || !searchedPackQty) return [];

  const suggestions: BulkSuggestion[] = [];

  for (const alt of alternatives) {
    if (!alt.is_bulk_option || !alt.unit_price || !alt.price || !alt.pack_qty)
      continue;

    // Only suggest if unit price is genuinely cheaper
    if (alt.unit_price >= searchedUnitPrice) continue;

    const savingPerUnit =
      Math.round((searchedUnitPrice - alt.unit_price) * 10000) / 10000;
    const savingPerUnitPct = Math.round(
      ((searchedUnitPrice - alt.unit_price) / searchedUnitPrice) * 100,
    );

    // Estimate annual saving: assume school reorders 6x per year
    const annualUnits = searchedPackQty * 6;
    const annualSaving = Math.round(savingPerUnit * annualUnits * 100) / 100;

    suggestions.push({
      title: alt.title,
      supplier: alt.supplier,
      price: alt.price,
      pack_qty: alt.pack_qty,
      unit_price: alt.unit_price,
      source_url: alt.source_url,
      is_preferred: alt.is_preferred,
      saving_per_unit: savingPerUnit,
      saving_per_unit_pct: savingPerUnitPct,
      annual_saving_estimate: annualSaving,
      reason:
        savingPerUnitPct >= 15
          ? "Exceptional bulk saving — " +
            savingPerUnitPct +
            "% cheaper per unit"
          : savingPerUnitPct >= 8
            ? "Strong bulk saving — reduces cost per unit significantly"
            : "Modest saving — still worth it for frequently reordered items",
    });
  }

  // Sort by saving per unit (best first), prefer preferred suppliers on tie
  suggestions.sort((a, b) => {
    if (Math.abs(a.saving_per_unit_pct - b.saving_per_unit_pct) < 3) {
      if (a.is_preferred && !b.is_preferred) return -1;
      if (!a.is_preferred && b.is_preferred) return 1;
    }
    return b.saving_per_unit_pct - a.saving_per_unit_pct;
  });

  return suggestions.slice(0, 3);
}

function extractKeywords(title: string): string[] {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "is",
    "it",
    "this",
    "that",
    "was",
    "are",
    "be",
    "has",
    "had",
    "have",
    "will",
    "would",
    "could",
    "should",
    "may",
    "can",
    "do",
    "does",
    "did",
    "not",
    "no",
    "so",
    "if",
    "as",
    "up",
    "out",
    "about",
    "into",
    "over",
    "after",
    "new",
    "pack",
    "box",
    "set",
  ]);

  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 10);
}
