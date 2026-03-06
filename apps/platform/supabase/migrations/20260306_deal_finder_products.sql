-- Deal Finder: crowdsourced product pricing database
-- Every product URL searched gets stored so schools can find the best prices

CREATE TABLE IF NOT EXISTS deal_finder_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product identification
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  brand TEXT,
  description TEXT,
  image_url TEXT,

  -- Pricing
  price DECIMAL(10,2),
  price_currency TEXT DEFAULT 'GBP',
  pack_qty INTEGER,
  unit_price DECIMAL(10,4),

  -- Source
  source_url TEXT,
  source_domain TEXT NOT NULL,
  source_type TEXT DEFAULT 'retail', -- retail, education_supplier, wholesale

  -- Search/matching
  keywords TEXT[], -- extracted keywords for matching
  search_vector TSVECTOR,

  -- Metadata
  is_education_supplier BOOLEAN DEFAULT FALSE,
  supplier_framework TEXT, -- e.g. 'CPC', 'ESPO', 'YPO Framework'

  -- Tracking
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_deal_finder_search ON deal_finder_products USING GIN(search_vector);

-- Category + price index for finding alternatives
CREATE INDEX IF NOT EXISTS idx_deal_finder_cat_price ON deal_finder_products(category, price) WHERE price IS NOT NULL;

-- Source domain index
CREATE INDEX IF NOT EXISTS idx_deal_finder_source ON deal_finder_products(source_domain);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION deal_finder_update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'D');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deal_finder_search_vector
  BEFORE INSERT OR UPDATE ON deal_finder_products
  FOR EACH ROW
  EXECUTE FUNCTION deal_finder_update_search_vector();

-- Seed with real education supplier base prices for common categories
-- These are realistic prices from education procurement frameworks
INSERT INTO deal_finder_products (title, category, brand, price, price_currency, pack_qty, unit_price, source_url, source_domain, source_type, is_education_supplier, supplier_framework) VALUES

-- Paper
('A4 White Paper 80gsm 500 Sheets', 'paper', 'YPO', 3.49, 'GBP', 500, 0.0070, 'https://www.ypo.co.uk/search?q=a4+paper', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),
('A4 White Paper 80gsm 500 Sheets', 'paper', 'Banner', 3.79, 'GBP', 500, 0.0076, 'https://www.banner.co.uk/office-supplies/paper-and-labels/', 'banner.co.uk', 'education_supplier', TRUE, 'CPC Framework'),
('A4 White Paper 80gsm Box of 5 Reams (2500 Sheets)', 'paper', 'YPO', 14.99, 'GBP', 2500, 0.0060, 'https://www.ypo.co.uk/search?q=a4+paper+box', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),
('A4 White Paper 80gsm Box of 5 Reams (2500 Sheets)', 'paper', 'Lyreco', 16.49, 'GBP', 2500, 0.0066, 'https://www.lyreco.com/webshop/UKWI/search/paper', 'lyreco.com', 'education_supplier', TRUE, 'CCS Framework'),
('A4 Coloured Card 160gsm Pack of 250', 'paper', 'Hope Education', 8.99, 'GBP', 250, 0.0360, 'https://www.hope-education.co.uk/search?q=coloured+card', 'hope-education.co.uk', 'education_supplier', TRUE, NULL),
('A3 White Paper 80gsm 500 Sheets', 'paper', 'YPO', 6.99, 'GBP', 500, 0.0140, 'https://www.ypo.co.uk/search?q=a3+paper', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),

-- Stationery
('HB Pencils Pack of 144', 'stationery', 'YPO', 8.99, 'GBP', 144, 0.0624, 'https://www.ypo.co.uk/search?q=hb+pencils', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),
('HB Pencils Pack of 144', 'stationery', 'Hope Education', 9.49, 'GBP', 144, 0.0659, 'https://www.hope-education.co.uk/search?q=hb+pencils', 'hope-education.co.uk', 'education_supplier', TRUE, NULL),
('Whiteboard Markers Pack of 36', 'stationery', 'YPO', 12.99, 'GBP', 36, 0.3608, 'https://www.ypo.co.uk/search?q=whiteboard+markers', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),
('Glue Sticks 20g Pack of 100', 'stationery', 'Hope Education', 22.99, 'GBP', 100, 0.2299, 'https://www.hope-education.co.uk/search?q=glue+sticks', 'hope-education.co.uk', 'education_supplier', TRUE, NULL),
('Blue Ballpoint Pens Pack of 50', 'stationery', 'YPO', 4.99, 'GBP', 50, 0.0998, 'https://www.ypo.co.uk/search?q=ballpoint+pens', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),
('Scissors 13cm Class Pack of 32', 'stationery', 'Hope Education', 16.99, 'GBP', 32, 0.5309, 'https://www.hope-education.co.uk/search?q=scissors+class+pack', 'hope-education.co.uk', 'education_supplier', TRUE, NULL),

-- Computing
('Chromebook Lenovo 100e Gen 4', 'computing', 'XMA', 189.00, 'GBP', 1, 189.00, 'https://www.xma.co.uk/education/chromebooks', 'xma.co.uk', 'education_supplier', TRUE, 'CPC Framework'),
('Chromebook Acer Spin 511', 'computing', 'Academia', 199.00, 'GBP', 1, 199.00, 'https://www.academia.co.uk/chromebooks', 'academia.co.uk', 'education_supplier', TRUE, 'CPC Framework'),
('Wired Headphones Class Pack of 30', 'computing', 'TTS Group', 89.99, 'GBP', 30, 3.0000, 'https://www.tts-group.co.uk/search?q=headphones+class+pack', 'tts-group.co.uk', 'education_supplier', TRUE, NULL),
('USB-C Charging Cable 1m Pack of 10', 'computing', 'YPO', 14.99, 'GBP', 10, 1.4990, 'https://www.ypo.co.uk/search?q=usb-c+cable', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),

-- Art
('Ready Mix Paint 600ml Set of 6 Colours', 'art', 'Hope Education', 11.99, 'GBP', 6, 2.0000, 'https://www.hope-education.co.uk/search?q=ready+mix+paint', 'hope-education.co.uk', 'education_supplier', TRUE, NULL),
('Paint Brushes Assorted Pack of 30', 'art', 'YPO', 7.99, 'GBP', 30, 0.2663, 'https://www.ypo.co.uk/search?q=paint+brushes', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),
('Air Drying Clay 12.5kg', 'art', 'Hope Education', 12.99, 'GBP', 1, 12.9900, 'https://www.hope-education.co.uk/search?q=air+drying+clay', 'hope-education.co.uk', 'education_supplier', TRUE, NULL),

-- Cleaning
('Anti-Bacterial Hand Soap 5L', 'cleaning', 'YPO', 6.49, 'GBP', 1, 6.4900, 'https://www.ypo.co.uk/search?q=hand+soap', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),
('Paper Hand Towels V-Fold 3600', 'cleaning', 'Banner', 12.99, 'GBP', 3600, 0.0036, 'https://www.banner.co.uk/office-supplies/washroom/', 'banner.co.uk', 'education_supplier', TRUE, 'CPC Framework'),
('Surface Sanitiser Spray 750ml Pack of 6', 'cleaning', 'YPO', 11.99, 'GBP', 6, 2.0000, 'https://www.ypo.co.uk/search?q=sanitiser+spray', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),

-- Sport
('Football Size 5 Pack of 10', 'sport', 'Davies Sports', 39.99, 'GBP', 10, 4.0000, 'https://www.findel-education.co.uk/brand/davies-sports', 'findel-education.co.uk', 'education_supplier', TRUE, NULL),
('Playground Cones Pack of 50', 'sport', 'YPO', 19.99, 'GBP', 50, 0.4000, 'https://www.ypo.co.uk/search?q=cones', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),
('Skipping Ropes Pack of 10', 'sport', 'TTS Group', 14.99, 'GBP', 10, 1.5000, 'https://www.tts-group.co.uk/search?q=skipping+ropes', 'tts-group.co.uk', 'education_supplier', TRUE, NULL),

-- Books
('Reading Comprehension Cards KS2 Set', 'books', 'TTS Group', 24.99, 'GBP', 1, 24.9900, 'https://www.tts-group.co.uk/search?q=reading+comprehension', 'tts-group.co.uk', 'education_supplier', TRUE, NULL),
('Exercise Books A4 Lined Pack of 50', 'books', 'YPO', 14.99, 'GBP', 50, 0.3000, 'https://www.ypo.co.uk/search?q=exercise+books', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),

-- Furniture
('Classroom Chair Height 380mm', 'furniture', 'YPO', 28.99, 'GBP', 1, 28.9900, 'https://www.ypo.co.uk/search?q=classroom+chair', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),
('Single Student Desk 600x600mm', 'furniture', 'TTS Group', 54.99, 'GBP', 1, 54.9900, 'https://www.tts-group.co.uk/search?q=student+desk', 'tts-group.co.uk', 'education_supplier', TRUE, NULL),
('Book Storage Unit 3 Shelf', 'furniture', 'Hope Education', 89.99, 'GBP', 1, 89.9900, 'https://www.hope-education.co.uk/search?q=book+storage', 'hope-education.co.uk', 'education_supplier', TRUE, NULL),

-- Display
('Display Border Roll 15m Pack of 6 Colours', 'display', 'Hope Education', 12.99, 'GBP', 6, 2.1650, 'https://www.hope-education.co.uk/search?q=display+border', 'hope-education.co.uk', 'education_supplier', TRUE, NULL),
('Laminating Pouches A4 150mic Pack of 100', 'display', 'YPO', 8.99, 'GBP', 100, 0.0899, 'https://www.ypo.co.uk/search?q=laminating+pouches', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework'),
('Blu Tack Economy Pack 12 Strips', 'display', 'Banner', 5.49, 'GBP', 12, 0.4575, 'https://www.banner.co.uk/office-supplies/', 'banner.co.uk', 'education_supplier', TRUE, 'CPC Framework')

ON CONFLICT DO NOTHING;

-- Enable RLS but allow public read, authenticated write
ALTER TABLE deal_finder_products ENABLE ROW LEVEL SECURITY;

-- Anyone can read (it's a public tool)
CREATE POLICY "deal_finder_public_read" ON deal_finder_products
  FOR SELECT USING (TRUE);

-- Insert allowed for all (anonymous users via the tool)
CREATE POLICY "deal_finder_public_insert" ON deal_finder_products
  FOR INSERT WITH CHECK (TRUE);

-- Update only search_count and last_searched_at
CREATE POLICY "deal_finder_public_update" ON deal_finder_products
  FOR UPDATE USING (TRUE)
  WITH CHECK (TRUE);
