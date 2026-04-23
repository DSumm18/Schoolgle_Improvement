import { findSimilarProducts } from "../src/lib/deal-finder/services/matcher";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function run() {
  console.log("Testing findSimilarProducts logic...");
  const matches = await findSimilarProducts('8ef011fc-0b9e-4656-8062-be80bf0c792b', 10);
  console.log("Returned", matches.length, "matches");
  console.log(matches.map(m => `${m.supplier_name} - £${m.price_gbp} - Match: ${m.match_type} - Image: ${m.image_url}`));
}
run();
