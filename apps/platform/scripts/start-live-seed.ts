import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { firecrawlExtract } from "../src/lib/deal-finder/extractors/firecrawl";

dotenv.config({ path: path.resolve(process.cwd(), "apps/platform/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in apps/platform/.env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Stop words for keyword generation
const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "is", "pack", "box", "set"]);
function generateKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 10);
}

async function bulkSeed() {
  console.log("🚀 Starting Live Deal Finder Extraction Seeding...");

  // We are targeting specific product portals that are known to have high success rates with the Firecrawl API
  const liveUrls = [
    // We are deliberately keeping this batch small to avoid extreme API credit drain or Cloudflare rate-limiting in one go.
    { domain: "ypo.co.uk", url: "https://www.ypo.co.uk/product/detail/office-supplies/pens-and-pencils/700030" },
    { domain: "tts-group.co.uk", url: "https://www.tts-group.co.uk/tts-blue-glue-sticks-10pk/1014815.html" },
    { domain: "hope-education.co.uk", url: "https://www.hope-education.co.uk/product/early-years/creative-play/glue-sticks-40g-pack-of-100/he212133" }
  ];

  console.log(`📡 Queued ${liveUrls.length} Live Extraction jobs.`);

  for (const item of liveUrls) {
    console.log(`\n🕵️ Initiating Firecrawl Live Extract for: ${item.url}`);
    try {
      // the extractor natively uses the LLM schema and fires a true headless request via Mendable
      const extracted = await firecrawlExtract(item.url);
      
      const unitPrice = extracted.price && extracted.pack_quantity ? extracted.price / extracted.pack_quantity : extracted.price;
      const keywords = generateKeywords(extracted.name);

      const payload = {
        title: extracted.name,
        category: "general", // Normally mapped via AI schema or constants
        brand: extracted.brand || null,
        description: extracted.description || null,
        image_url: extracted.image_url || null,
        price: extracted.price,
        pack_qty: extracted.pack_quantity || 1,
        unit_price: unitPrice,
        source_url: extracted.source_url,
        source_domain: item.domain,
        source_type: "scrape",
        is_education_supplier: true,
        is_preferred: true,
        supplier_framework: null, // Hardcoded for this demo
        keywords: keywords,
        last_searched_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase.from("deal_finder_products").select("id").eq("source_url", item.url).single();
      
      let dbError;
      if (existing) {
         const { error } = await supabase.from("deal_finder_products").update(payload).eq("id", existing.id);
         dbError = error;
      } else {
         const { error } = await supabase.from("deal_finder_products").insert(payload);
         dbError = error;
      }

      if (dbError) {
        console.error(`❌ DB Insert Failed for ${item.domain}:`, dbError.message);
      } else {
        console.log(`✅ successfully ingested Live Data: ${extracted.name} at £${extracted.price}`);
      }
    } catch (err) {
      console.log(`⚠️ Scraper failed for ${item.url}: ${err.message}`);
    }
  }

  console.log("\n🏁 Live Seeding Batch 1 Complete.");
}

bulkSeed().catch((e) => console.error(e));
