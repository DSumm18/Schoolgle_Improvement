import { NextRequest, NextResponse } from "next/server";
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

/**
 * POST /api/tools/deal-finder/search
 *
 * 1. Stores the searched product in the database
 * 2. Finds cheaper alternatives from education suppliers
 * 3. Finds similar products other schools have searched for
 */
export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();

    if (!body.title || !body.source_url) {
      return NextResponse.json(
        { error: "title and source_url are required" },
        { status: 400 },
      );
    }

    const supabase = getSupabase();

    // 1. Store or update the searched product
    const unitPrice =
      body.price && body.pack_qty && body.pack_qty > 1
        ? body.price / body.pack_qty
        : body.price;

    // Check if this exact URL was already searched
    const { data: existing } = await supabase
      .from("deal_finder_products")
      .select("id, search_count")
      .eq("source_url", body.source_url)
      .single();

    if (existing) {
      // Update search count and price if changed
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
      // Insert new product
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
    const { data: supplierAlts } = await supabase
      .from("deal_finder_products")
      .select("*")
      .eq("category", body.category || "general")
      .eq("is_education_supplier", true)
      .not("price", "is", null)
      .order("price", { ascending: true })
      .limit(6);

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
        .order("price", { ascending: true })
        .limit(10);

      similarProducts = similar;
    }

    // 4. Combine and deduplicate results
    const allAlts = [...(supplierAlts || []), ...(similarProducts || [])];

    // Deduplicate by id
    const seen = new Set<string>();
    const dedupedAlts = allAlts.filter((alt) => {
      if (seen.has(alt.id)) return false;
      // Don't include the product itself
      if (alt.source_url === body.source_url) return false;
      seen.add(alt.id);
      return true;
    });

    // Sort: education suppliers first, then by price
    dedupedAlts.sort((a, b) => {
      if (a.is_education_supplier && !b.is_education_supplier) return -1;
      if (!a.is_education_supplier && b.is_education_supplier) return 1;
      return (a.price || 999) - (b.price || 999);
    });

    // Calculate savings for each alternative
    const alternatives = dedupedAlts.slice(0, 8).map((alt) => ({
      id: alt.id,
      title: alt.title,
      price: alt.price ? parseFloat(alt.price) : null,
      pack_qty: alt.pack_qty,
      unit_price: alt.unit_price ? parseFloat(alt.unit_price) : null,
      supplier: alt.brand || alt.source_domain,
      source_url: alt.source_url,
      source_domain: alt.source_domain,
      is_education_supplier: alt.is_education_supplier,
      supplier_framework: alt.supplier_framework,
      saving:
        body.price && alt.price
          ? Math.round((body.price - parseFloat(alt.price)) * 100) / 100
          : null,
      saving_pct:
        body.price && alt.price
          ? Math.round(
              ((body.price - parseFloat(alt.price)) / body.price) * 100,
            )
          : null,
    }));

    // 5. Get total stats
    const { count: totalProducts } = await supabase
      .from("deal_finder_products")
      .select("*", { count: "exact", head: true });

    const { count: totalSearches } = await supabase
      .from("deal_finder_products")
      .select("*", { count: "exact", head: true })
      .eq("is_education_supplier", false);

    return NextResponse.json(
      {
        alternatives,
        stats: {
          total_products: totalProducts || 0,
          total_searches: totalSearches || 0,
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache",
        },
      },
    );
  } catch (error) {
    console.error("Deal Finder search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
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
