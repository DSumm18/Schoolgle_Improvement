import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load env before importing services
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Import the modern Deal Finder architecture services
import { upsertProduct, upsertPrice, upsertProductUnitDetails } from "../src/lib/deal-finder/services/matcher";
import { generateFingerprint } from "../src/lib/deal-finder/services/fingerprint";
import { generateCanonicalKey, generateEquivalenceGroup } from "../src/lib/deal-finder/services/equivalence";
import { createServiceRoleClient } from "../src/lib/supabase-server";

async function run() {
  console.log("🌱 Migrating Seed Data into Modern Deal Finder Architecture...");
  
  const rawData = fs.readFileSync(path.resolve(process.cwd(), "scripts/seed/deal-finder-data.json"), "utf8");
  const products = JSON.parse(rawData);
  const db = createServiceRoleClient();

  for (const item of products) {
    try {
      // 1. Get or create supplier
      let supplierId = null;
      // Let's find existing supplier by name or domain
      const { data: sup } = await db.from("suppliers").select("id").eq("name", item.source_domain.split(".")[0].toUpperCase()).maybeSingle();
      if (sup) {
          supplierId = sup.id;
      } else {
          const { data: newSup, error: supErr } = await db.from("suppliers").insert({
              name: item.source_domain.split(".")[0].toUpperCase(),
              is_education_specialist: item.is_education_supplier,
              is_preferred: item.is_preferred,
              website_url: `https://www.${item.source_domain}`
          }).select("id").single();
          if (supErr) console.log("Supplier Insert Error:", supErr.message);
          supplierId = newSup?.id;
      }

      // insert pattern
      const { error: patErr } = await db.from("supplier_url_patterns").upsert({
          supplier_id: supplierId,
          url_pattern: item.source_domain,
          extractor_key: "default"
      }, { onConflict: "url_pattern" });
      if (patErr) console.log("Pattern Error:", patErr.message);

      // 2. Build Extracted Payload format to generate Fingerprint
      const extractedMock = {
         name: item.title,
         description: item.description,
         price: item.price,
         source_url: item.source_url,
         image_url: item.image_url,
         pack_quantity: item.pack_qty,
         brand: item.brand,
         currency: "GBP"
      };
      
      const fingerprint = generateFingerprint(extractedMock as any);
      
      // 3. Upsert Product
      const productId = await upsertProduct({
        name: item.title,
        description: item.description,
        brand: item.brand,
        image_url: item.image_url,
        source_url: item.source_url,
        fingerprint: fingerprint,
        supplier_id: supplierId,
        typical_price: item.price,
      });

      // 4. Upsert Price
      if (item.price && supplierId) {
         await upsertPrice(productId, supplierId, item.price, item.source_url);
      }

      // 5. Upsert Unit Details
      const unitWeightG = null;
      const unitVolumeMl = null;
      const unitPriceEach = item.price && item.pack_qty > 0 ? +(item.price / item.pack_qty).toFixed(4) : item.price;
      
      const canonicalKey = generateCanonicalKey(item.title, item.brand, unitWeightG, unitVolumeMl);
      const equivalenceGroup = generateEquivalenceGroup(item.title, item.description);

      await upsertProductUnitDetails({
        product_id: productId,
        pack_quantity: item.pack_qty || 1,
        pack_unit: "pack",
        unit_weight_g: unitWeightG,
        unit_volume_ml: unitVolumeMl,
        unit_price_each: unitPriceEach,
        unit_price_per_g: null,
        canonical_product_key: canonicalKey,
        equivalence_group: equivalenceGroup,
        raw_pack_text: `Pack of ${item.pack_qty}`,
        raw_weight_text: null,
        extraction_confidence: 1.0,
      });

      console.log(`✅ Fully Injected into new schema: ${item.title}`);
    } catch (e) {
      console.error(`❌ Failed on ${item.title}:`, e);
    }
  }

  console.log("🏁 Migration Complete. Deal Finder UI will now correctly match alternatives.");
}

run();
