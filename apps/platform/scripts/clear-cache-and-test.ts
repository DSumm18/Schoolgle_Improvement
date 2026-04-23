import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const vikingUrl = "https://www.viking-direct.co.uk/en/p/1022616";
  
  // Get product ID
  const { data: prod } = await db.from('products').select('id').eq('source_url', vikingUrl).single();
  if (prod) {
      console.log("Clearing matches for", prod.id);
      await db.from('product_matches').delete().eq('source_product_id', prod.id);
  }

  // Clear scrape job
  console.log("Clearing scrape job");
  await db.from('url_scrape_jobs').delete().like('url', '%1022616%');

  // Let's manually run the RPC to see what it returns
  if (prod) {
      console.log("Testing find_similar_products RPC...");
      const { data: matches } = await db.rpc('find_similar_products', { p_product_id: prod.id, p_limit: 10 });
      console.log("RPC returned:", matches?.length, "matches");
      console.log(matches);
  }
}
run();
