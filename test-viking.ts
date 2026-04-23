import { firecrawlExtract } from "./apps/platform/src/lib/deal-finder/extractors/firecrawl";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "apps/platform/.env.local") });

async function test() {
  console.log("Testing Viking URL...");
  const result = await firecrawlExtract("https://www.viking-direct.co.uk/en/p/1022616");
  console.log("Extracted Data:", result);
}

test();
