import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { firecrawlExtract } from "@/lib/deal-finder/extractors/firecrawl";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/cron/deal-finder-sweep
 * Runs nightly via Vercel Cron.
 * Purpose: Finds top 20% most popular items needing a price update and triggers live scrape.
 */
export async function GET(request: Request) {
  // Simple auth to prevent public triggering (Vercel sets cron header)
  const authHeader = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  
  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch top 50 products that haven't been swept in the last 24 hours, ordered by popularity
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { data: popularProducts, error } = await supabase
    .from("deal_finder_products")
    .select("id, source_url, source_domain, price, title")
    .order("search_count", { ascending: false })
    // Only where last_searched_at is null OR older than yesterday
    .or(`last_searched_at.is.null, last_searched_at.lt.${yesterday.toISOString()}`)
    .limit(50); // Batch size logic

  if (error || !popularProducts) {
    console.error("Deal Finder Sweep Error: ", error);
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }

  // 2. Iterate and re-calculate price using Firecrawl or API dispatch
  let updatedCount = 0;
  let failedCount = 0;

  for (const product of popularProducts) {
    try {
      // In full production, we'd check if domain uses 'api' or 'scrape' based on suppliers.ts
      // Fallback is Firecrawl headless sweep
      console.log(`[Sweep] Refreshing ${product.title} from ${product.source_domain}`);
      
      const latestData = await firecrawlExtract(product.source_url);

      if (latestData.price) {
        // Update product row
        const unitPrice =
          latestData.pack_quantity && latestData.pack_quantity > 1
            ? latestData.price / latestData.pack_quantity
            : latestData.price;

        await supabase
          .from("deal_finder_products")
          .update({
            price: latestData.price,
            unit_price: unitPrice,
            in_stock: latestData.in_stock,
            last_searched_at: new Date().toISOString()
          })
          .eq("id", product.id);
          
        updatedCount++;
      }
    } catch (err) {
      console.error(`[Sweep] Failed to update product ${product.id}`, err);
      // Even if failed, mark as updated to avoid infinite retries blocking the queue
      await supabase.from("deal_finder_products").update({
        last_searched_at: new Date().toISOString()
      }).eq("id", product.id);
      
      failedCount++;
    }
  }

  return NextResponse.json({
    success: true,
    swept: popularProducts.length,
    updated: updatedCount,
    failed: failedCount
  });
}
