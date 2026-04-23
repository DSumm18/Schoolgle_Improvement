import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: prods } = await db.from('products').select('id, name, image_url').ilike('name', '%paper%');
  console.log("--- PRODUCTS in DB ---");
  console.log(JSON.stringify(prods, null, 2));

  const { data: units } = await db.from('product_unit_details').select('product_id, equivalence_group');
  console.log("--- UNIT DETAILS ---");
  console.log(units?.filter(u => prods?.some(p => p.id === u.product_id)));
  
  const { data: matches } = await db.from('product_matches').select('*');
  console.log("--- CACHED MATCHES ---");
  console.log(matches);
}
run();
