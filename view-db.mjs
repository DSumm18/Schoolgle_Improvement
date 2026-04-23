import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "apps/platform/.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkData() {
  const { data, error } = await supabase
    .from("deal_finder_products")
    .select("title, price, source_domain, source_url")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Failed to query DB:", error.message);
  } else {
    console.table(data);
  }
}

checkData();
