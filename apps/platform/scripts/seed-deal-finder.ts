import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load platform environment variables
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
  console.log("🌱 Starting Deal Finder Database Bulk Seed...");

  // Load JSON data
  const rawData = fs.readFileSync(path.resolve(process.cwd(), "apps/platform/scripts/seed/deal-finder-data.json"), "utf8");
  const products = JSON.parse(rawData);

  console.log(`📦 Found ${products.length} products to inject.`);

  for (const p of products) {
    const unitPrice = p.price && p.pack_qty ? p.price / p.pack_qty : p.price;
    const keywords = generateKeywords(p.title);

    const payload = {
        title: p.title,
        category: p.category,
        brand: p.brand,
        description: p.description,
        image_url: p.image_url,
        price: p.price,
        pack_qty: p.pack_qty,
        unit_price: unitPrice,
        source_url: p.source_url,
        source_domain: p.source_domain,
        source_type: p.source_type,
        is_education_supplier: p.is_education_supplier,
        is_preferred: p.is_preferred,
        supplier_framework: p.supplier_framework,
        keywords: keywords,
        last_searched_at: new Date().toISOString(),
      };

    const { data: existing } = await supabase.from("deal_finder_products").select("id").eq("source_url", p.source_url).single();
    let error;
    if (existing) {
       const { error: updateErr } = await supabase.from("deal_finder_products").update(payload).eq("id", existing.id);
       error = updateErr;
    } else {
       const { error: insertErr } = await supabase.from("deal_finder_products").insert(payload);
       error = insertErr;
    }

    if (error) {
      console.error(`❌ Failed to insert ${p.title} from ${p.source_domain}:`, error.message);
    } else {
      console.log(`✅ Upserted ${p.title} from ${p.source_domain}`);
    }
  }

  console.log("🏁 Bulk seeding complete!");
}

bulkSeed().catch((e) => console.error(e));
