import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await db.rpc('exec_sql', { sql: "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'find_similar_products';" });
  if (error) {
     console.log("exec_sql missing. Let's try connecting via Postgres directly if possible, or we just write a new RPC/query.");
  } else {
     console.log(data);
  }
}
run();
