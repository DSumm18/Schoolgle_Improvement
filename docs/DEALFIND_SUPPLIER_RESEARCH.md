# DealFind Supplier Research: UK School Supply Market

**Date**: 14 April 2026
**Purpose**: Comprehensive supplier research for DealFind product seeding
**Action**: Hand to Jarvis/AI agent to pull product data and seed the DealFind database

---

## Executive Summary

DealFind currently has **13 suppliers** configured. This research identifies **87 suppliers** across **16 categories** that schools routinely purchase from. The document provides supplier details, product specialisms, example product URLs, and extraction feasibility notes for each.

The goal is to pre-seed the DealFind database with enough product data (target: 500-1000 products) across these suppliers so that when a school user pastes a URL, there are genuine alternatives to compare against.

---

## Current State (13 Suppliers)

Already in `suppliers.ts`:

| ID | Name | Website | DfE Approved | Has Extractor |
|----|------|---------|-------------|---------------|
| findel | Findel Education | findel-education.co.uk | Yes | No (generic) |
| tts | TTS Group | tts-group.co.uk | Yes | Yes |
| consortium | The Consortium | theconsortium.com | No | No (generic) |
| viking | Viking Direct | viking-direct.co.uk | No | No (generic) |
| staples | Staples | staples.co.uk | No | No (generic) |
| ryman | Ryman | ryman.co.uk | No | No (generic) |
| computacenter | Computacenter | computacenter.com | No | No (generic) |
| xma | XMA | xma.co.uk | No | No (generic) |
| espo | ESPO | espo.org | Yes | No (generic) |
| ypo | YPO | ypo.co.uk | Yes | No (generic) |
| amazon | Amazon | amazon.co.uk | No | Yes |
| cultpens | Cult Pens | cultpens.com | No | Yes |
| gompels | Gompels | gompels.co.uk | No | Yes |

---

## NEW Suppliers to Add (74 Additional)

### Category 1: General Education Suppliers (Multi-Category)

These are the "must haves" — large suppliers schools use for everyday purchasing across multiple categories.

| # | Supplier | Website | Specialisms | DfE/Framework | Priority |
|---|----------|---------|-------------|---------------|----------|
| 1 | **KCS Education** | kcs.co.uk | Stationery, furniture, art, PE, catering, cleaning — one of the largest school suppliers in the UK | No | HIGH |
| 2 | **Hope Education** | hope-education.co.uk | Curriculum resources, art, furniture, catering, SEND, PE — major school supplier | No | HIGH |
| 3 | **GLS Educational Supplies** | glsed.co.uk | Art, stationery, cleaning, catering, curriculum resources | No | HIGH |
| 4 | **Early Years Resources (EYR)** | earlyyearsresources.co.uk | EYFS, nursery, SEN, art, sensory, role play | No | MEDIUM |
| 5 | **CostCutters UK** | costcuttersuk.com | Furniture, SEN, sports, outdoor, display — education discount supplier | No | MEDIUM |
| 6 | **Edusentials** | edusentials.co.uk | Catering equipment, educational supplies, furniture | No | MEDIUM |
| 7 | **School Stationery** | schoolstationery.co.uk | Budget stationery, classroom basics, exercise books | No | MEDIUM |

**Example products to seed**: A4 copier paper (ream/box), whiteboard markers, exercise books, glue sticks, pencils, scissors, Pritt sticks, laminating pouches, filing, envelopes.

### Category 2: Purchasing Organisations & Frameworks

These are the buying consortia — schools buy through these at framework rates. Critical for the DfE compliance angle.

| # | Supplier | Website | Specialisms | DfE/Framework | Priority |
|---|----------|---------|-------------|---------------|----------|
| 8 | **CPC (Crescent Purchasing Consortium)** | thecpc.ac.uk | Further education purchasing consortium — DfE recommended frameworks | DfE Recommended | HIGH |
| 9 | **Crown Commercial Service (GCA)** | crowncommercial.gov.uk / gca.gov.uk | UK's largest public procurement organisation — school/academy frameworks | DfE Approved | HIGH |
| 10 | **NEPO (North East Procurement Organisation)** | nepo.org | Regional purchasing, energy, facilities, fleet | Framework | MEDIUM |
| 11 | **SUPC (Southern Universities Purchasing Consortium)** | supc.ac.uk | HE/FE procurement frameworks | Framework | LOW |

**Note**: CPC and GCA don't sell products directly but their framework suppliers should all be in DealFind. When a school says "we bought through YPO framework", the comparison should show prices from other framework suppliers.

### Category 3: Office Supplies & Stationery

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 12 | **Office World** | officeworld.uk.com | Education supplies, stationery, free delivery over £45 | MEDIUM |
| 13 | **Premier Office Supplies** | premier-office-supplies.co.uk | 24+ years serving schools, bulk stationery | MEDIUM |
| 14 | **Choice Stationery** | choicestationery.com | Ink/toner, office supplies for schools | MEDIUM |
| 15 | **Alexander Paper Supplies** | alexanderpapersupplies.co.uk | Paper, art materials, accepts LA requisitions, since 1994 | MEDIUM |
| 16 | **Banner** | banneruk.com | Part of ACCO Brands, supplies to education, office products | MEDIUM |
| 17 | **Lyreco** | lyreco.com/webshop/GB | Workplace supplies, large European supplier | MEDIUM |

**Example products to seed**: Printer cartridges (HP, Brother, Canon, Epson), A4/A3 paper, envelopes, binders, folders, sticky notes, markers, dry wipe pens, rubber bands, staples, paperclips, correction fluid.

### Category 4: Printer Ink & Toner Specialists

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 18 | **Cartridge People** | cartridgepeople.com | Ink and toner for schools, compatible and original | HIGH |
| 19 | **Cartridge Save** | cartridgesave.co.uk | Compatible/remanufactured cartridges, big savings | MEDIUM |
| 20 | **TonerGiant** | tonergiant.co.uk | Toner cartridges, next-day delivery | MEDIUM |
| 21 | **Printerland** | printerland.co.uk | Printers and consumables, HP/Brother/Canon authorised | MEDIUM |
| 22 | **Stinkyink** | stinkyink.com | Compatible and original cartridges, education pricing | LOW |

**Example products to seed**: HP 305A/305X toner, Brother TN-2420, Canon PGI-570/CLI-571, Epson 502XL, HP 953XL ink.

### Category 5: IT Hardware & Technology

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 23 | **Classroom365** | classroom365.co.uk | Interactive displays, Chromebooks, HP/Dell/Lenovo — CCS framework supplier | HIGH |
| 24 | **Tel Group** | telgroup.co.uk | IT equipment for schools since 2005, AV, networking, devices | HIGH |
| 25 | **SchoolCare** | schoolcare.co.uk | AV systems, interactive displays, school IT | MEDIUM |
| 26 | **NCi Technologies** | ncitech.co.uk | School IT procurement, desktops, tablets, printers | MEDIUM |
| 27 | **Combro Technology** | combrotechnology.com | Bulk laptops for education, Chromebooks | MEDIUM |
| 28 | **Pure IT Refurbished** | pureitrefurbished.co.uk | Refurbished laptops/desktops for schools, ~50% of new cost | MEDIUM |
| 29 | **School Business Services (SBS)** | schoolbusinessservices.co.uk | ICT procurement services, MIS, broadband | MEDIUM |
| 30 | **Stone Group** | stonegroup.co.uk | Public sector IT supplier, DfE framework, devices | HIGH |
| 31 | **Insight** | uk.insight.com | Enterprise IT, public sector pricing, HP/Dell/Lenovo | MEDIUM |
| 32 | **Sync** | wearesync.co.uk | Apple education reseller, iPads for schools | MEDIUM |

**Example products to seed**: HP Chromebook 14, Lenovo 100e/300e, Dell Latitude 3440, iPad 10th Gen, HP LaserJet Pro, Brother MFC-L2750DW, USB-C hubs, headphones (bulk), mouse + keyboard sets, webcams, interactive displays (Promethean, SMART, Clevertouch).

### Category 6: Audio Visual & Display

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 33 | **SmartBoards UK** | smartboardsuk.co.uk | SMART, BenQ, Promethean, Clevertouch — since 2001 | MEDIUM |
| 34 | **Midshire AV** | midshire.co.uk | Sharp BIG PAD, interactive screens for education | MEDIUM |
| 35 | **DVAD** | dvad.co.uk | AV equipment, projectors, whiteboards for schools | LOW |

**Example products to seed**: Promethean ActivPanel 9, SMART Board MX, Clevertouch Impact Plus, Epson EB-L200F projector, visualisers, PA/sound systems.

### Category 7: Furniture

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 36 | **Education Furniture** | education-furniture.co.uk | Specialist school desks, chairs, tables, stools | HIGH |
| 37 | **Rosehill Furnishings** | rosehill.co.uk | Classroom tables, chairs, dining furniture | MEDIUM |
| 38 | **Furniture At Work** | furniture-work.co.uk | One of the UK's largest education furniture suppliers | MEDIUM |
| 39 | **Furniture For Schools** | furnitureforschools.co.uk | Largest selection in London — tables, chairs, storage | MEDIUM |
| 40 | **Schoolsrus** | schoolsrus.co.uk | Postura chairs, exam desks, classroom furniture | MEDIUM |
| 41 | **Direct Educational Furniture** | directeducationalfurniture.co.uk | LEA approved, lab furniture, lockers, staffroom | MEDIUM |
| 42 | **Brookhouse** | brookhouse.com | FF&E specialists, full school fitout catalogues | MEDIUM |
| 43 | **UK Educational Furniture** | ukeducationalfurniture.co.uk | Online school furniture retailer | LOW |

**Example products to seed**: Postura+ chairs (sizes 1-6), classroom tables, lab stools, exam desks, tray storage units, bookcases, notice boards, lockers, staffroom furniture, reception furniture.

### Category 8: Cleaning, Hygiene & Janitorial

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 44 | **phs Direct** | phsdirect.co.uk | Washroom, cleaning, janitorial — 20+ years in education | HIGH |
| 45 | **Duckworth Group** | duckworthgroup.co.uk | 200+ schools served, 3000+ cleaning products | HIGH |
| 46 | **Caxton Supplies** | caxtonsupplies.co.uk | Janitorial, cleaning, hygiene — 40 years' experience | MEDIUM |
| 47 | **One Stop Cleaning Shop** | onestopcleaningshop.co.uk | School cleaning supplies range | MEDIUM |
| 48 | **Power Hygiene** | powerhygiene.com | Environmentally friendly cleaning for schools | MEDIUM |
| 49 | **Knighton Janitorial** | knightonjanitorial.com | Midlands-based, education sector specialism | LOW |
| 50 | **Jangro** | jangro.net | UK's largest network of janitorial distributors | MEDIUM |
| 51 | **Bunzl Cleaning & Hygiene** | bunzlchs.com | Major UK distributor, PPE, cleaning chemicals | MEDIUM |

**Example products to seed**: Hand soap (bulk 5L), paper towels (C-fold/Z-fold), toilet rolls (bulk), disinfectant spray, floor cleaner concentrate, bleach, anti-bacterial wipes, hand sanitiser, mops/buckets, bin liners, rubber gloves, microfibre cloths.

### Category 9: Science & Lab Equipment

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 52 | **Timstar** | timstar.co.uk | UK's leading school science equipment — biology, chemistry, physics | HIGH |
| 53 | **Philip Harris** | philipharris.co.uk | Science equipment and resources for school labs | HIGH |
| 54 | **Breckland Scientific** | brecklandscientific.co.uk | School chemicals, physics/chemistry/biology equipment | MEDIUM |
| 55 | **SLS Select Education** | science2education.co.uk | Division of SLS (largest independent UK lab supplier) | MEDIUM |
| 56 | **Better Equipped** | betterequipped.co.uk | Science, DT, safety equipment — 95% dispatched within 24hrs | MEDIUM |
| 57 | **Didactic Scientific** | didacscientific.co.uk | Lab equipment manufacturers, microscopes, centrifuges | LOW |
| 58 | **Beecroft & Partners** | beecroft-science.co.uk | Educational science apparatus, Fisher products | LOW |

**Example products to seed**: Microscopes (student/compound), beakers, test tubes, Bunsen burners, safety goggles, lab coats, chemicals (acids, indicators), periodic tables, circuit kits, springs, thermometers, digital balances.

### Category 10: Art, Craft & DT Materials

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 59 | **Specialist Crafts** | specialistcrafts.co.uk | Largest independent art materials supplier to schools | HIGH |
| 60 | **Abacus Creative Resources** | abacusresources.co.uk | Art, DT materials, acrylic paints, sketchbooks | MEDIUM |
| 61 | **Creative Activity** | creative-activity.co.uk | Education art/craft products, classroom resources | MEDIUM |
| 62 | **Pisces Education** | pisceseducation.co.uk | Art supplies for education, West Yorkshire-based | LOW |

**Example products to seed**: Acrylic paint sets, poster paint, brushes, cartridge paper, sugar paper, card (A4/A3), PVA glue, clay, fabric, sewing kits, DT tools (saws, vices, clamps), timber, plastics.

### Category 11: PE, Sports & Outdoor

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 63 | **Davies Sports** | daviessports.co.uk | 60+ years, specialist PE/sports/playground equipment | HIGH |
| 64 | **Fitness-Sports** | fitness-sports.co.uk | Gymnasium PE installations, apparatus | MEDIUM |
| 65 | **Sportsafe UK** | sportsafeuk.com | PE equipment, sports hall, outdoor | MEDIUM |
| 66 | **Universal Services** | universalservicesuk.co.uk | Physical education equipment, leading UK supplier | MEDIUM |
| 67 | **Schoolscapes** | schoolscapesuk.com | Playground equipment, outdoor learning | MEDIUM |
| 68 | **Pentagon Play** | pentagonplay.co.uk | Playground equipment, 400+ freestanding products, from £55 | MEDIUM |

**Example products to seed**: Footballs (size 4/5), netballs, basketballs, rounders sets, athletics equipment, gym mats, benches, cones, bibs, skipping ropes, tennis rackets, badminton sets, stopwatches, first aid kits (PE).

### Category 12: SEND & Sensory

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 69 | **Sensory Toy Warehouse** | sensorytoywarehouse.com | Sensory toys, weighted items, fidget tools — works with educators/therapists | MEDIUM |
| 70 | **Sensory Education** | sensoryeducation.co.uk | SEN toys, fidget tools, calming aids | MEDIUM |
| 71 | **Sensory Wise** | sensorywise.co.uk | Families, schools, NHS — trusted SEND supplier | LOW |
| 72 | **Rompa** | rompa.com | Sensory rooms, multi-sensory equipment, 40+ years | MEDIUM |

**Example products to seed**: Weighted lap pads, fidget spinners/cubes, noise-cancelling headphones, visual timers, wobble cushions, sensory chew toys, light-up toys, tactile balls, communication aids.

### Category 13: Books & Educational Publishing

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 73 | **CGP Books** | cgpbooks.co.uk | UK's #1 education publisher — used in 9/10 schools | HIGH |
| 74 | **Pearson Schools** | pearsonschoolsandfecolleges.co.uk | Major textbook publisher, curriculum resources | HIGH |
| 75 | **Collins Education** | collins.co.uk | Dictionaries, atlases, revision, curriculum resources | HIGH |
| 76 | **Oxford University Press Education** | oxfordprimary.co.uk / oxfordsecondary.co.uk | Textbooks, reading schemes (Oxford Reading Tree) | MEDIUM |
| 77 | **Scholastic UK** | shop.scholastic.co.uk | Children's books, book fairs, teaching resources | MEDIUM |
| 78 | **Peters Books** | peters.co.uk | Library supplier, children's books for schools | MEDIUM |

**Example products to seed**: CGP KS2 SATs revision, CGP GCSE maths/English, Collins dictionaries, Oxford Reading Tree stages, Pearson ActiveLearn, exercise books (lined/squared/plain), reading comprehension packs.

### Category 14: Safety, First Aid & Fire

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 79 | **First Aid Online** | firstaid.co.uk | First aid kits, safety supplies, signs, PPE, fire safety | MEDIUM |
| 80 | **Fire Protection Shop** | fireprotectionshop.co.uk | Fire extinguishers, blankets, servicing for schools | MEDIUM |
| 81 | **Eureka Direct** | eurekadirect.co.uk | First aid supplies, safety signs, medical essentials | MEDIUM |
| 82 | **St John Ambulance Supplies** | sja.org.uk | First aid kits for schools, training equipment | MEDIUM |

**Example products to seed**: BS 8599-1 first aid kits (large/small), defibrillators (AED), fire extinguishers (CO2, foam, water), fire blankets, high-vis vests, safety signs, PPE (goggles, ear defenders, gloves).

### Category 15: Catering & Kitchen

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 83 | **Bidfood** | bidfood.co.uk | UK's leading foodservice wholesaler, dedicated education team | MEDIUM |
| 84 | **Abraxas Catering** | abraxascatering.co.uk | 25 years, school kitchen equipment and fitouts | MEDIUM |
| 85 | **School Catering Equipment** | schoolcateringequipment.co.uk | Purchase order site for education, comprehensive catalogue | MEDIUM |
| 86 | **Nisbets** | nisbets.co.uk | UK's largest catering equipment supplier | MEDIUM |

**Example products to seed**: Commercial dishwashers, food warmers, bain-maries, serving trays, cutlery (bulk), dinner plates/bowls (polycarbonate), food prep tables, commercial fridges/freezers, oven gloves.

### Category 16: Waste, Recycling & Signage

| # | Supplier | Website | Specialisms | Priority |
|---|----------|---------|-------------|----------|
| 87 | **RecyclingBins.co.uk** | recyclingbins.co.uk | School recycling bins, colour-coded, accepts purchase orders | MEDIUM |

**Example products to seed**: Recycling bins (paper/plastic/food), general waste bins, pedal bins, outdoor litter bins, recycling signage, wet floor signs.

---

## Extraction Feasibility Assessment

### How DealFind Extracts Data

The system uses a **two-stage extraction**:
1. **Firecrawl API** (primary) — AI-powered page scraping with structured JSON output. Works on most sites including JavaScript-rendered pages.
2. **Fallback extractors** — Axios + Cheerio HTML parsing using JSON-LD, Open Graph, and meta tags.

### Extraction Likelihood by Supplier Type

| Supplier Type | Firecrawl Success | Generic Fallback | Notes |
|--------------|-------------------|------------------|-------|
| **Large e-commerce** (Amazon, Viking, Staples, Ryman) | HIGH | MEDIUM | Most have JSON-LD Product schema. Some have bot protection. |
| **Education specialists** (YPO, TTS, KCS, Hope, GLS) | HIGH | HIGH | Purpose-built shops with good SEO/structured data. Usually no bot protection. |
| **Niche specialists** (Timstar, Philip Harris, Davies Sports) | HIGH | MEDIUM | Varies — some have good schema, some have bare HTML. |
| **Publishers** (CGP, Pearson, Collins) | MEDIUM | LOW | Often DRM/login walls for digital products. Physical books should work. |
| **Cleaning/janitorial** (Gompels, phs, Duckworth) | HIGH | HIGH | Simple e-commerce sites, good structured data. |
| **IT resellers** (Classroom365, Stone, XMA) | MEDIUM | LOW | Often quote-based or require login for pricing. |
| **Furniture** (Education Furniture, Schoolsrus) | MEDIUM | MEDIUM | Prices may require "add to basket" or "request quote". |
| **Framework organisations** (CPC, CCS) | LOW | LOW | Catalogue/PDF-based, not product pages. Not scrapable. |

### Suppliers Likely to Need Custom Extractors

Based on the existing extractor architecture, these may need dedicated parsers:

1. **Staples.co.uk** — Bot protection (Cloudflare), needs proper headers or Firecrawl
2. **Amazon.co.uk** — Already has extractor, but aggressive bot detection
3. **YPO.co.uk** — Product IDs in URL, may need specific selector patterns
4. **Viking Direct** — Part of RAJA Group, likely has structured data but may have session requirements
5. **CGP Books** — Custom shop platform, may need specific extraction logic

### Suppliers That Should "Just Work" with Generic + Firecrawl

These are built on standard e-commerce platforms (Shopify, WooCommerce, Magento) that produce clean JSON-LD:

- KCS Education, Hope Education, GLS, CostCutters UK
- Gompels (already has extractor), Cult Pens (already has extractor)
- Cartridge People, TonerGiant
- Education Furniture, Schoolsrus
- phs Direct, Caxton Supplies
- Sensory Toy Warehouse, Sensory Education
- RecyclingBins.co.uk

---

## Priority Seeding Plan

### Phase 1: HIGH priority suppliers (seed first — 20 suppliers, ~300 products)

Focus on the suppliers schools use most frequently with products they buy most often.

**Stationery & Paper** (everyday purchases):
- YPO, TTS, KCS, Hope Education, GLS, Findel
- Products: A4 paper, exercise books, pens, pencils, glue, markers, folders

**Cleaning & Hygiene** (regular reorders):
- Gompels, phs Direct, Duckworth
- Products: Hand soap, paper towels, disinfectant, toilet rolls, bin liners

**IT Consumables** (frequent purchases):
- Cartridge People, Viking, Staples, Amazon
- Products: Printer cartridges (top 20 models), USB drives, mice, keyboards

**General comparison stock**:
- Ryman, CostCutters
- Products: Matching products from above categories for comparison

### Phase 2: MEDIUM priority (weeks 2-3, +40 suppliers, ~400 products)

**Furniture** (big ticket):
- Education Furniture, Schoolsrus, Furniture At Work
- Products: Postura chairs, classroom tables, storage, lockers

**Science** (termly purchases):
- Timstar, Philip Harris, Breckland Scientific, Better Equipped
- Products: Microscopes, safety goggles, chemicals, lab equipment

**Art & DT** (termly):
- Specialist Crafts, Abacus, Creative Activity
- Products: Paint, paper, clay, DT materials

**PE & Sports** (annual):
- Davies Sports, TTS Sport
- Products: Balls, mats, cones, bibs

**Books** (annual/termly):
- CGP, Collins, Scholastic
- Products: Revision guides, dictionaries, reading scheme books

### Phase 3: LOW priority (month 2, +20 suppliers, ~200 products)

- SEND specialists, niche IT, playground, catering equipment, fire safety
- These are lower frequency purchases but important for completeness

---

## Suggested Product Categories for Seeding

To ensure good coverage, seed products across these categories (with suggested quantities):

| Category | Example Products | Target Count |
|----------|-----------------|-------------|
| Paper & Printing | A4/A3 paper, copier paper (white/coloured), laminating pouches, card | 30 |
| Ink & Toner | HP, Brother, Canon, Epson — top selling cartridges | 40 |
| Writing & Drawing | Pens (ballpoint, felt), pencils (HB, coloured), markers, highlighters | 30 |
| Adhesives & Fixing | Glue sticks, PVA, Pritt, tape (Sellotape, masking), Blu-Tack | 15 |
| Exercise Books | Lined, squared, plain — A4 and A5, class packs | 15 |
| Filing & Organisation | Folders, ring binders, lever arch files, wallets, dividers | 15 |
| Display | Backing paper, borders, laminating pouches, display boards | 15 |
| Cleaning Products | Hand soap, disinfectant, bleach, floor cleaner, paper towels, toilet rolls | 30 |
| IT Hardware | Chromebooks, laptops, mice, keyboards, headphones, USB drives | 25 |
| IT Consumables | Printer cartridges, toner, USB cables, HDMI cables, batteries | 25 |
| Furniture | Chairs (Postura sizes), tables, storage, lockers, whiteboards | 20 |
| Science Equipment | Microscopes, goggles, beakers, test tubes, Bunsen burners, chemicals | 25 |
| Art Materials | Paint (poster/acrylic), brushes, paper, card, clay, fabric | 20 |
| PE Equipment | Footballs, netballs, cones, bibs, gym mats, skipping ropes | 20 |
| Books & Revision | CGP revision guides, dictionaries, reading books (class sets) | 20 |
| Safety & First Aid | First aid kits, fire blankets, safety signs, PPE, defibrillators | 15 |
| SEND Resources | Fidget tools, weighted items, visual timers, noise-cancelling headphones | 15 |
| Catering | Cutlery, crockery, serving equipment, disposables | 10 |

**Total target: ~385 core products × multiple suppliers = 800-1200 price records**

---

## Implementation Notes for Jarvis/Agent

### How to Seed a Product

For each product, the agent should:

1. **Find the product URL** on the supplier's website (search for the product name)
2. **Call the scrape API**: `POST /api/tools/deal-finder/scrape` with `{ "url": "<product_url>" }`
3. **Check the response** — if `status: "complete"`, the product is stored
4. **If scrape fails**, try Firecrawl directly or use the search API: `POST /api/tools/deal-finder/search`
5. **Rate limit**: Wait 2-3 seconds between scrapes to avoid triggering bot protection
6. **Log failures** for manual review

### Database Tables Required

Before seeding, verify these tables exist in Supabase (some may be missing):
- `products` — Core product records
- `prices` — Price per supplier per date
- `suppliers` — Supplier master list
- `supplier_url_patterns` — URL patterns for supplier detection
- `product_unit_details` — Pack info, unit prices, equivalence groups
- `product_matches` — Cached comparison pairs
- `url_scrape_jobs` — Scrape job tracking

### Supplier URL Pattern Registration

For each new supplier, register a URL pattern so the system can identify which supplier a URL belongs to:

```sql
INSERT INTO supplier_url_patterns (supplier_id, url_pattern, search_url_template, extractor_key)
VALUES
  ('kcs', '.*kcs\.co\.uk.*', 'https://www.kcs.co.uk/catalogsearch/result/?q={query}', 'generic'),
  ('hope', '.*hope-education\.co\.uk.*', 'https://www.hope-education.co.uk/search?q={query}', 'generic'),
  ('gls', '.*glsed\.co\.uk.*', 'https://www.glsed.co.uk/search?q={query}', 'generic'),
  ('cartridgepeople', '.*cartridgepeople\.com.*', 'https://www.cartridgepeople.com/search?q={query}', 'generic'),
  ('timstar', '.*timstar\.co\.uk.*', 'https://www.timstar.co.uk/catalogsearch/result/?q={query}', 'generic'),
  -- ... etc for all 87 suppliers
;
```

### Updating suppliers.ts

The `suppliers.ts` file needs updating with all 87 suppliers. Each entry needs:
- `id`: lowercase slug
- `name`: Display name
- `website`: Domain
- `verified`: true once extraction is confirmed working
- `dfe_approved`: true if on a DfE framework

---

## Key Risks & Considerations

1. **Bot protection**: Staples, Amazon, and some large retailers actively block scraping. Firecrawl handles most of these, but we should monitor failure rates.

2. **Price accuracy**: Prices change frequently. Need a scheduled refresh (weekly minimum for high-priority suppliers).

3. **VAT handling**: Some suppliers show prices ex-VAT, some inc-VAT. The system needs to normalise — schools pay VAT on most supplies but recover it on some items. Currently the system doesn't handle this distinction.

4. **Login-walled pricing**: Some IT suppliers (XMA, Computacenter, Stone) require account login for education pricing. These may need manual data entry or a different approach.

5. **Framework pricing**: YPO/ESPO/CPC framework prices are often lower than website prices. The scraped price may not reflect the framework rate schools actually pay.

6. **Pack size normalisation**: A "ream" is 500 sheets at one supplier but a "box" might be 2500 (5 reams) at another. The pack parser handles common patterns but edge cases exist.

7. **Product matching**: Two suppliers may sell the same paper (e.g., Navigator A4 80gsm) but one calls it "Navigator Universal A4 80gsm White Paper 500 Sheets" and another "Navigator A4 Paper 80gsm Ream of 500". The equivalence engine needs to match these.

---

## Sources

- [DfE Buying for Schools](https://www.gov.uk/guidance/buying-for-schools)
- [Get Help Buying for Schools](https://get-help-buying-for-schools.education.gov.uk/solutions)
- [DfE Approved Frameworks](https://www.gov.uk/guidance/find-a-dfe-approved-framework-for-your-school)
- [ESPO Education Resources](https://www.espo.org/our-2025-26-product-range)
- [YPO School Supplies](https://www.ypo.co.uk/education)
- [CPC DfE Recommended Frameworks](https://www.thecpc.ac.uk/services/dfe-recommended-frameworks)
- [Crown Commercial Service Schools](https://www.crowncommercial.gov.uk/news/get-help-buying-for-schools)
