"use client";

/**
 * AssetPicker — searchable asset selector with live warranty status check.
 *
 * When the user types, it queries the asset register by name/code/serial.
 * When an asset is selected, it fetches warranty status and shows a banner
 * advising the user to contact the supplier first if the asset is under
 * warranty (the killer demo moment).
 */

import { useState, useEffect, useRef } from "react";
import { Search, X, Shield, AlertTriangle, CheckCircle2, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AssetSummary {
  id: string;
  code: string | null;
  name: string;
  asset_type: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  building: string | null;
  room: string | null;
}

interface WarrantyInfo {
  asset_id: string;
  asset_name: string;
  asset_code: string | null;
  warranty_status: "active" | "expiring_soon" | "expired" | "none";
  warranty_expiry: string | null;
  warranty_provider: string | null;
  warranty_days_remaining: number | null;
  supplier_contact: {
    contractor_id: string;
    company_name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  purchase_date: string | null;
  invoice_number: string | null;
  purchase_order_number: string | null;
  recommended_action: "call_supplier" | "warranty_expiring" | "out_of_warranty" | "unknown";
}

interface AssetPickerProps {
  organizationId: string;
  onSelect: (asset: AssetSummary | null, warranty: WarrantyInfo | null) => void;
  selectedAssetId?: string | null;
}

export function AssetPicker({
  organizationId,
  onSelect,
  selectedAssetId,
}: AssetPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AssetSummary | null>(null);
  const [warranty, setWarranty] = useState<WarrantyInfo | null>(null);
  const [warrantyLoading, setWarrantyLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-load selected asset if an ID is passed in
  useEffect(() => {
    if (selectedAssetId && !selected) {
      void loadAssetById(selectedAssetId);
    }
  }, [selectedAssetId]);

  async function getToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  async function loadAssetById(id: string) {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(
      `/api/estates/assets/${id}?organizationId=${organizationId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return;
    const body = await res.json();
    const asset = body?.data || body;
    if (asset?.id) {
      setSelected(asset);
      void fetchWarranty(asset.id);
    }
  }

  async function searchAssets(q: string) {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/estates/assets?organizationId=${organizationId}&search=${encodeURIComponent(q)}&pageSize=10`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        setResults([]);
        return;
      }
      const body = await res.json();
      const items = body?.data || body?.assets || [];
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWarranty(assetId: string) {
    setWarrantyLoading(true);
    setWarranty(null);
    const token = await getToken();
    if (!token) {
      setWarrantyLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/estates/assets/${assetId}/warranty?organizationId=${organizationId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return;
      const body = await res.json();
      setWarranty(body);
      // Emit to parent
      if (selected) onSelect(selected, body);
    } catch {
      setWarranty(null);
    } finally {
      setWarrantyLoading(false);
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void searchAssets(value), 250);
  }

  function handleSelect(asset: AssetSummary) {
    setSelected(asset);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    void fetchWarranty(asset.id);
  }

  function handleClear() {
    setSelected(null);
    setWarranty(null);
    setQuery("");
    setResults([]);
    onSelect(null, null);
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Affected Asset
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          (optional but recommended — lets Ed check warranty)
        </span>
      </label>

      {!selected && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search by name, code (e.g. BOI-001), or serial number..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {showDropdown && (results.length > 0 || loading) && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
              {loading && (
                <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
              )}
              {!loading &&
                results.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleSelect(a)}
                    className="block w-full border-b border-border px-4 py-3 text-left transition hover:bg-accent"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {a.code && (
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
                              {a.code}
                            </span>
                          )}
                          <span className="truncate text-sm font-medium text-foreground">
                            {a.name}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {[a.manufacturer, a.model, a.serial_number]
                            .filter(Boolean)
                            .join(" • ") || a.asset_type}
                        </div>
                        {(a.building || a.room) && (
                          <div className="text-xs text-muted-foreground/70">
                            {[a.building, a.room].filter(Boolean).join(" → ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="rounded-lg border border-border bg-muted p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {selected.code && (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
                    {selected.code}
                  </span>
                )}
                <span className="truncate text-sm font-semibold text-foreground">
                  {selected.name}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {[selected.manufacturer, selected.model, selected.serial_number]
                  .filter(Boolean)
                  .join(" • ")}
              </div>
              {(selected.building || selected.room) && (
                <div className="text-xs text-muted-foreground/70">
                  {[selected.building, selected.room].filter(Boolean).join(" → ")}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Clear asset selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Warranty banner */}
      {warrantyLoading && (
        <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
          Checking warranty status...
        </div>
      )}

      {warranty && warranty.warranty_status === "active" && (
        <div className="rounded-lg border-2 border-green-600 bg-green-50 p-4 dark:border-green-700 dark:bg-green-950/40">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-green-900 dark:text-green-300">
                Under warranty — don&apos;t call a different contractor
              </div>
              <div className="mt-1 text-sm text-green-800 dark:text-green-200">
                {warranty.warranty_provider} covers this until{" "}
                <span className="font-semibold">{warranty.warranty_expiry}</span>
                {warranty.warranty_days_remaining !== null && (
                  <> ({warranty.warranty_days_remaining} days remaining)</>
                )}
                . The repair should be free.
              </div>
              {warranty.supplier_contact && (
                <div className="mt-2 text-xs text-green-900 dark:text-green-100">
                  Contact:{" "}
                  <span className="font-medium">
                    {warranty.supplier_contact.contact_name || warranty.supplier_contact.company_name}
                  </span>{" "}
                  {warranty.supplier_contact.email && (
                    <>
                      •{" "}
                      <a
                        href={`mailto:${warranty.supplier_contact.email}`}
                        className="underline hover:opacity-80"
                      >
                        {warranty.supplier_contact.email}
                      </a>
                    </>
                  )}
                  {warranty.supplier_contact.phone && (
                    <>
                      {" "}
                      •{" "}
                      <a
                        href={`tel:${warranty.supplier_contact.phone}`}
                        className="underline hover:opacity-80"
                      >
                        {warranty.supplier_contact.phone}
                      </a>
                    </>
                  )}
                </div>
              )}
              {warranty.invoice_number && (
                <div className="mt-1 text-xs text-green-700/80 dark:text-green-300/70">
                  Invoice ref: {warranty.invoice_number}
                </div>
              )}
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("ed:draft-warranty-email", {
                      detail: { asset_id: warranty.asset_id },
                    }),
                  );
                }}
              >
                <Mail className="h-3 w-3" />
                Ask Ed to draft a warranty claim email
              </button>
            </div>
          </div>
        </div>
      )}

      {warranty && warranty.warranty_status === "expiring_soon" && (
        <div className="rounded-lg border-2 border-amber-500 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-amber-900 dark:text-amber-300">
                Warranty expiring in {warranty.warranty_days_remaining} days
              </div>
              <div className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                {warranty.warranty_provider} cover expires{" "}
                <span className="font-semibold">{warranty.warranty_expiry}</span>.
                Raise this now while it&apos;s still covered.
              </div>
            </div>
          </div>
        </div>
      )}

      {warranty && warranty.warranty_status === "expired" && (
        <div className="rounded-lg border border-border bg-muted/60 p-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              Warranty expired on {warranty.warranty_expiry}. You will need to pay
              for this repair or book a different contractor.
            </div>
          </div>
        </div>
      )}

      {warranty && warranty.warranty_status === "none" && (
        <div className="rounded-lg border border-border bg-muted/60 p-3 text-xs text-muted-foreground">
          No warranty information recorded for this asset.
        </div>
      )}
    </div>
  );
}
