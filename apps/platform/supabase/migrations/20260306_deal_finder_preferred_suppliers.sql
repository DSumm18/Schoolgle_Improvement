-- Add preferred supplier and bulk buy fields
ALTER TABLE deal_finder_products
  ADD COLUMN IF NOT EXISTS is_preferred BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bulk_discount_pct DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_bulk_qty INTEGER,
  ADD COLUMN IF NOT EXISTS bulk_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS bulk_unit_price DECIMAL(10,4);

-- Mark preferred suppliers (higher commission rates)
UPDATE deal_finder_products SET is_preferred = TRUE, commission_rate = 8.00 WHERE brand = 'YPO' AND is_education_supplier = TRUE;
UPDATE deal_finder_products SET is_preferred = TRUE, commission_rate = 6.00 WHERE brand = 'Hope Education' AND is_education_supplier = TRUE;
UPDATE deal_finder_products SET is_preferred = TRUE, commission_rate = 5.00 WHERE brand = 'TTS Group' AND is_education_supplier = TRUE;

-- Bulk buy options for consumables
INSERT INTO deal_finder_products (title, category, brand, price, price_currency, pack_qty, unit_price, source_url, source_domain, source_type, is_education_supplier, supplier_framework, is_preferred, commission_rate, min_bulk_qty, bulk_price, bulk_unit_price) VALUES
('A4 White Paper 80gsm Pallet of 40 Boxes (100,000 Sheets)', 'paper', 'YPO', 499.00, 'GBP', 100000, 0.0050, 'https://www.ypo.co.uk/search?q=a4+paper+pallet', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework', TRUE, 8.00, 40, 499.00, 0.0050),
('A4 White Paper 80gsm 10 Reams (5,000 Sheets)', 'paper', 'YPO', 27.99, 'GBP', 5000, 0.0056, 'https://www.ypo.co.uk/search?q=a4+paper+10+reams', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework', TRUE, 8.00, 10, 27.99, 0.0056),
('A4 White Paper 80gsm 10 Reams (5,000 Sheets)', 'paper', 'Banner', 29.99, 'GBP', 5000, 0.0060, 'https://www.banner.co.uk/office-supplies/paper-and-labels/', 'banner.co.uk', 'education_supplier', TRUE, 'CPC Framework', FALSE, 3.00, 10, 29.99, 0.0060),
('HB Pencils Bulk Pack of 720 (5 x 144)', 'stationery', 'YPO', 37.99, 'GBP', 720, 0.0528, 'https://www.ypo.co.uk/search?q=hb+pencils+bulk', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework', TRUE, 8.00, 5, 37.99, 0.0528),
('Blue Ballpoint Pens Bulk Pack of 300', 'stationery', 'YPO', 22.99, 'GBP', 300, 0.0767, 'https://www.ypo.co.uk/search?q=ballpoint+pens+bulk', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework', TRUE, 8.00, 6, 22.99, 0.0767),
('Glue Sticks 20g Bulk Pack of 300', 'stationery', 'Hope Education', 59.99, 'GBP', 300, 0.2000, 'https://www.hope-education.co.uk/search?q=glue+sticks+bulk', 'hope-education.co.uk', 'education_supplier', TRUE, NULL, TRUE, 6.00, 3, 59.99, 0.2000),
('Whiteboard Markers Bulk Pack of 144', 'stationery', 'YPO', 44.99, 'GBP', 144, 0.3124, 'https://www.ypo.co.uk/search?q=whiteboard+markers+bulk', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework', TRUE, 8.00, 4, 44.99, 0.3124),
('Anti-Bacterial Hand Soap 5L Case of 4', 'cleaning', 'YPO', 21.99, 'GBP', 4, 5.4975, 'https://www.ypo.co.uk/search?q=hand+soap+case', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework', TRUE, 8.00, 4, 21.99, 5.4975),
('Surface Sanitiser Spray 750ml Case of 24', 'cleaning', 'YPO', 39.99, 'GBP', 24, 1.6663, 'https://www.ypo.co.uk/search?q=sanitiser+case', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework', TRUE, 8.00, 4, 39.99, 1.6663),
('Paper Hand Towels V-Fold 21,600 (6 Cases)', 'cleaning', 'Banner', 64.99, 'GBP', 21600, 0.0030, 'https://www.banner.co.uk/office-supplies/washroom/', 'banner.co.uk', 'education_supplier', TRUE, 'CPC Framework', FALSE, 3.00, 6, 64.99, 0.0030),
('Ready Mix Paint 600ml Class Set of 20 Colours', 'art', 'Hope Education', 34.99, 'GBP', 20, 1.7500, 'https://www.hope-education.co.uk/search?q=ready+mix+paint+class+set', 'hope-education.co.uk', 'education_supplier', TRUE, NULL, TRUE, 6.00, 1, 34.99, 1.7500),
('Paint Brushes Assorted Bulk Pack of 100', 'art', 'YPO', 19.99, 'GBP', 100, 0.2000, 'https://www.ypo.co.uk/search?q=paint+brushes+bulk', 'ypo.co.uk', 'education_supplier', TRUE, 'YPO Framework', TRUE, 8.00, 3, 19.99, 0.2000)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_deal_finder_preferred ON deal_finder_products(is_preferred, category) WHERE is_preferred = TRUE;
