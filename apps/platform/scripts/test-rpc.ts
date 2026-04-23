import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: matches, error } = await db.rpc('find_similar_products', { p_product_id: '8ef011fc-0b9e-4656-8062-be80bf0c792b', p_limit: 10 });
  console.log("Error:", error);
  console.log("Matches:", matches);
}
run();
