// ============================================================================
// DealFind URL Comparison Types
// ============================================================================

export interface ScrapedProduct {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency: string;
  sku?: string;
  brand?: string;
  image_url?: string;
  source_url: string;
  supplier_name?: string;
  pack_quantity: number;
  pack_unit: string;
  unit_weight_g: number | null;
  unit_price_each: number | null;
  comparison_unit_label: string;
  rating_value: number | null;
  rating_count: number | null;
}

export interface ProductMatch {
  product_id: string;
  product_name: string;
  supplier_id: string;
  supplier_name: string;
  price_gbp: number | null;
  image_url: string | null;
  source_url: string | null;
  match_type:
    | "exact_sku"
    | "barcode"
    | "fingerprint"
    | "fuzzy_name"
    | "brand_category";
  match_score: number;
  saving_gbp: number | null;
  saving_pct: number | null;
  pack_quantity: number;
  pack_unit: string;
  unit_price_each: number | null;
  unit_saving_gbp: number | null;
  unit_saving_pct: number | null;
  equivalence_type: "identical" | "alternative" | "different";
  value_score: number;
  is_best_value: boolean;
  price_date: string | null;
  comparison_unit_label: string;
  rating_value: number | null;
  rating_count: number | null;
}

export interface ScrapeResponse {
  job_id: string;
  status: "complete" | "failed";
  product: ScrapedProduct | null;
  matches: ProductMatch[];
  best_saving_gbp: number | null;
  best_saving_pct: number | null;
  best_unit_saving_gbp: number | null;
  best_unit_saving_pct: number | null;
  best_value_match_id: string | null;
  match_count: number;
  duration_ms: number;
  discovery_pending: boolean;
  error?: string;
}

export interface ProcurementDecision {
  id: string;
  school_id?: string;
  user_id?: string;
  scrape_job_id?: string;
  chosen_product_id?: string;
  chosen_supplier_id?: string;
  price_paid: number;
  quantity: number;
  reason_text?: string;
  reason_category?:
    | "best_price"
    | "best_quality"
    | "framework_compliant"
    | "existing_supplier"
    | "other";
  alternatives_considered: ProductMatch[];
  threshold_band?: string;
  policy_compliant?: boolean;
  created_at: string;
}

export interface ProcurementThreshold {
  band: string;
  min_gbp?: number;
  max_gbp?: number;
  quotes_required: number;
  label: string;
}
