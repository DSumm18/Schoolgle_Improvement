import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

function extractKeywords(title: string): string[] {
  const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "pack", "box", "set"]);
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 10);
}

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  try {
    const body = await request.json();
    const { title, supplier_name, source_url, price, pack_qty, purchase_date } = body;

    if (!title || !supplier_name || !price) {
      return apiError("Missing required fields", 400);
    }

    const supabase = createServiceRoleClient();
    const unitPrice = pack_qty && pack_qty > 1 ? price / pack_qty : price;

    // Use a synthetic source URL if one isn't provided
    const safeSourceUrl = source_url || `https://${supplier_name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com/community-submission/${Date.now()}`;

    const { error } = await supabase.from("deal_finder_products").insert({
      title,
      category: "general", // Can be enhanced with AI categorization later
      brand: supplier_name,
      price,
      pack_qty: pack_qty || 1,
      unit_price: unitPrice,
      source_url: safeSourceUrl,
      source_domain: supplier_name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com",
      source_type: "community",
      is_education_supplier: true,
      is_preferred: false,
      keywords: extractKeywords(title),
      last_searched_at: new Date().toISOString(),
      created_at: new Date(purchase_date).toISOString(), // Used for freshness indicator
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return apiError("Failed to save community deal", 500);
    }

    return apiSuccess({ success: true });
  } catch (err) {
    console.error("Community deal submission error:", err);
    return apiError("Submission failed", 500);
  }
});
