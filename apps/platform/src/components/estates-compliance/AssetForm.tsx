"use client";

/**
 * AssetForm — shared create/edit form for the estates asset register.
 * Used by /estates-compliance/assets/new and /estates-compliance/assets/[id]/edit
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Save, X, Plus, Search, ExternalLink, Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { AssetInput, AssetType, AssetStatus, ConditionGrade } from "@/types/estates-compliance";
import type { Contractor } from "@/types/estates-compliance";

// ============================================================================
// Constants
// ============================================================================

const ASSET_TYPE_OPTIONS: { value: AssetType; label: string; codePrefix: string }[] = [
  { value: "building", label: "Building", codePrefix: "BLD-" },
  { value: "room", label: "Room", codePrefix: "RM-" },
  { value: "outlet", label: "Outlet", codePrefix: "OUT-" },
  { value: "equipment", label: "Equipment", codePrefix: "EQ-" },
  { value: "fire_extinguisher", label: "Fire Extinguisher", codePrefix: "FE-" },
  { value: "emergency_light", label: "Emergency Light", codePrefix: "EL-" },
  { value: "lift", label: "Lift", codePrefix: "LFT-" },
  { value: "playground_equipment", label: "Playground Equipment", codePrefix: "PG-" },
  { value: "accessibility_equipment", label: "Accessibility Equipment", codePrefix: "ACC-" },
  { value: "vehicle", label: "Vehicle", codePrefix: "VEH-" },
  { value: "furniture", label: "Furniture", codePrefix: "FUR-" },
  { value: "it_equipment", label: "IT Equipment", codePrefix: "IT-" },
  { value: "kitchen_equipment", label: "Kitchen Equipment", codePrefix: "KIT-" },
  { value: "av_equipment", label: "AV Equipment", codePrefix: "AV-" },
  { value: "musical_instrument", label: "Musical Instrument", codePrefix: "MUS-" },
  { value: "sports_equipment", label: "Sports Equipment", codePrefix: "SPT-" },
  { value: "grounds_equipment", label: "Grounds Equipment", codePrefix: "GRD-" },
  { value: "teaching_resource", label: "Teaching Resource", codePrefix: "TR-" },
  { value: "signage", label: "Signage", codePrefix: "SGN-" },
  { value: "security_equipment", label: "Security Equipment", codePrefix: "SEC-" },
];

const ASSET_STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "under_repair", label: "Under Repair" },
  { value: "disposed", label: "Disposed" },
  { value: "retired", label: "Retired" },
];

const CONDITION_GRADES: { value: ConditionGrade; label: string; description: string; color: string }[] = [
  { value: "A", label: "A", description: "Excellent", color: "bg-green-500 text-white" },
  { value: "B", label: "B", description: "Good", color: "bg-blue-500 text-white" },
  { value: "C", label: "C", description: "Fair", color: "bg-yellow-500 text-white" },
  { value: "D", label: "D", description: "Poor", color: "bg-red-500 text-white" },
];

const COMPLIANCE_DOMAINS = [
  { value: "legionella", label: "Legionella" },
  { value: "fire", label: "Fire Safety" },
  { value: "asbestos", label: "Asbestos" },
  { value: "electrical", label: "Electrical" },
  { value: "gas", label: "Gas" },
  { value: "water", label: "Water Quality" },
  { value: "mechanical", label: "Mechanical" },
  { value: "lifts", label: "Lifts" },
  { value: "playground", label: "Playground" },
  { value: "accessibility", label: "Accessibility" },
  { value: "security", label: "Security" },
  { value: "coshh", label: "COSHH" },
  { value: "food_safety", label: "Food Safety" },
  { value: "transport", label: "Transport" },
  { value: "safeguarding", label: "Safeguarding" },
  { value: "seasonal", label: "Seasonal" },
];

const CURRENCIES = [
  { value: "GBP", label: "GBP (£)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
];

// ============================================================================
// Props
// ============================================================================

export interface AssetFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<AssetInput>;
  assetId?: string;
  organizationId: string;
  onSuccess: (assetId: string) => void;
}

// ============================================================================
// Form state type
// ============================================================================

interface FormState {
  // Basic
  name: string;
  asset_type: AssetType | "";
  category: string;
  subcategory: string;
  code: string;
  status: AssetStatus;
  // Location
  building: string;
  floor: string;
  room: string;
  // Technical
  manufacturer: string;
  model: string;
  serial_number: string;
  installation_date: string;
  // Purchase
  purchase_date: string;
  purchase_price: string;
  purchase_currency: string;
  purchase_order_number: string;
  invoice_number: string;
  purchased_from_contractor_id: string;
  maintained_by_contractor_id: string;
  // Warranty
  warranty_start_date: string;
  warranty_expiry: string;
  warranty_provider: string;
  warranty_terms: string;
  // Lifecycle
  expected_life_years: string;
  condition_grade: ConditionGrade | "";
  replacement_cost_estimate: string;
  insurance_value: string;
  // Compliance
  compliance_domains: string[];
  last_inspection_date: string;
  next_inspection_due: string;
  // Notes
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  asset_type: "",
  category: "",
  subcategory: "",
  code: "",
  status: "active",
  building: "",
  floor: "",
  room: "",
  manufacturer: "",
  model: "",
  serial_number: "",
  installation_date: "",
  purchase_date: "",
  purchase_price: "",
  purchase_currency: "GBP",
  purchase_order_number: "",
  invoice_number: "",
  purchased_from_contractor_id: "",
  maintained_by_contractor_id: "",
  warranty_start_date: "",
  warranty_expiry: "",
  warranty_provider: "",
  warranty_terms: "",
  expected_life_years: "",
  condition_grade: "",
  replacement_cost_estimate: "",
  insurance_value: "",
  compliance_domains: [],
  last_inspection_date: "",
  next_inspection_due: "",
  notes: "",
};

function toFormState(values: Partial<AssetInput>): FormState {
  return {
    name: values.name ?? "",
    asset_type: (values.asset_type as AssetType) ?? "",
    category: values.category ?? "",
    subcategory: values.subcategory ?? "",
    code: values.code ?? "",
    status: values.status ?? "active",
    building: values.building ?? "",
    floor: values.floor ?? "",
    room: values.room ?? "",
    manufacturer: values.manufacturer ?? "",
    model: values.model ?? "",
    serial_number: values.serial_number ?? "",
    installation_date: values.installation_date ?? "",
    purchase_date: values.purchase_date ?? "",
    purchase_price: values.purchase_price != null ? String(values.purchase_price) : "",
    purchase_currency: values.purchase_currency ?? "GBP",
    purchase_order_number: values.purchase_order_number ?? "",
    invoice_number: values.invoice_number ?? "",
    purchased_from_contractor_id: values.purchased_from_contractor_id ?? "",
    maintained_by_contractor_id:
      values.maintained_by_contractor_id ??
      ((values.specifications as { maintained_by_contractor_id?: string } | undefined)
        ?.maintained_by_contractor_id ||
        ""),
    warranty_start_date: values.warranty_start_date ?? "",
    warranty_expiry: values.warranty_expiry ?? "",
    warranty_provider: values.warranty_provider ?? "",
    warranty_terms: values.warranty_terms ?? "",
    expected_life_years: values.expected_life_years != null ? String(values.expected_life_years) : "",
    condition_grade: (values.condition_grade as ConditionGrade) ?? "",
    replacement_cost_estimate: values.replacement_cost_estimate != null ? String(values.replacement_cost_estimate) : "",
    insurance_value: values.insurance_value != null ? String(values.insurance_value) : "",
    compliance_domains: values.compliance_domains ?? [],
    last_inspection_date: values.last_inspection_date ?? "",
    next_inspection_due: values.next_inspection_due ?? "",
    notes: values.notes ?? "",
  };
}

// ============================================================================
// Section wrapper
// ============================================================================

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

function FieldLabel({ htmlFor, required, children }: { htmlFor?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function AssetForm({ mode, initialValues, assetId, organizationId, onSuccess }: AssetFormProps) {
  const [form, setForm] = useState<FormState>(
    initialValues ? toFormState(initialValues) : EMPTY_FORM
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorSearch, setContractorSearch] = useState("");
  const [contractorDropdownOpen, setContractorDropdownOpen] = useState(false);
  const [maintainerSearch, setMaintainerSearch] = useState("");
  const [maintainerDropdownOpen, setMaintainerDropdownOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  async function getAuthHeaders(contentType = true): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      ...(contentType ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // Load contractors
  useEffect(() => {
    if (!organizationId) return;
    getAuthHeaders()
      .then((headers) =>
        fetch(`/api/estates/contractors?organizationId=${organizationId}`, {
          headers,
        }),
      )
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => {
        if (Array.isArray(d.contractors)) setContractors(d.contractors);
        if (Array.isArray(d.data)) setContractors(d.data);
        else if (Array.isArray(d)) setContractors(d);
      })
      .catch(() => {/* non-critical */});
  }, [organizationId]);

  // When asset_type changes, auto-suggest code prefix if code is empty
  const handleAssetTypeChange = useCallback((value: AssetType) => {
    const option = ASSET_TYPE_OPTIONS.find((o) => o.value === value);
    setForm((prev) => ({
      ...prev,
      asset_type: value,
      code: prev.code === "" && option ? option.codePrefix : prev.code,
    }));
  }, []);

  // When supplier is selected, auto-fill warranty provider
  const handleContractorSelect = useCallback((contractor: Contractor) => {
    setForm((prev) => ({
      ...prev,
      purchased_from_contractor_id: contractor.id,
      warranty_provider: prev.warranty_provider === "" ? contractor.company_name : prev.warranty_provider,
    }));
    setContractorSearch(contractor.company_name);
    setContractorDropdownOpen(false);
  }, []);

  const handleMaintainerSelect = useCallback((contractor: Contractor) => {
    setForm((prev) => ({
      ...prev,
      maintained_by_contractor_id: contractor.id,
    }));
    setMaintainerSearch(contractor.company_name);
    setMaintainerDropdownOpen(false);
  }, []);

  // When purchase_date changes, auto-fill warranty_start_date if empty
  const handlePurchaseDateChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      purchase_date: value,
      warranty_start_date: prev.warranty_start_date === "" ? value : prev.warranty_start_date,
    }));
  }, []);

  const toggleComplianceDomain = useCallback((domain: string) => {
    setForm((prev) => ({
      ...prev,
      compliance_domains: prev.compliance_domains.includes(domain)
        ? prev.compliance_domains.filter((d) => d !== domain)
        : [...prev.compliance_domains, domain],
    }));
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Asset name is required";
    if (!form.asset_type) errs.asset_type = "Asset type is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = (): AssetInput & { organizationId: string } => {
    const payload: AssetInput & { organizationId: string } = {
      organizationId,
      asset_type: form.asset_type as AssetType,
      name: form.name.trim(),
      status: form.status,
      compliance_domains: form.compliance_domains,
    };
    if (form.category.trim()) payload.category = form.category.trim();
    if (form.subcategory.trim()) payload.subcategory = form.subcategory.trim();
    if (form.code.trim()) payload.code = form.code.trim();
    if (form.building.trim()) payload.building = form.building.trim();
    if (form.floor.trim()) payload.floor = form.floor.trim();
    if (form.room.trim()) payload.room = form.room.trim();
    if (form.manufacturer.trim()) payload.manufacturer = form.manufacturer.trim();
    if (form.model.trim()) payload.model = form.model.trim();
    if (form.serial_number.trim()) payload.serial_number = form.serial_number.trim();
    if (form.installation_date) payload.installation_date = form.installation_date;
    if (form.purchase_date) payload.purchase_date = form.purchase_date;
    if (form.purchase_price) payload.purchase_price = parseFloat(form.purchase_price);
    payload.purchase_currency = form.purchase_currency;
    if (form.purchase_order_number.trim()) payload.purchase_order_number = form.purchase_order_number.trim();
    if (form.invoice_number.trim()) payload.invoice_number = form.invoice_number.trim();
    if (form.purchased_from_contractor_id) payload.purchased_from_contractor_id = form.purchased_from_contractor_id;
    if (form.maintained_by_contractor_id) {
      payload.maintained_by_contractor_id = form.maintained_by_contractor_id;
      payload.specifications = {
        ...(payload.specifications || {}),
        maintained_by_contractor_id: form.maintained_by_contractor_id,
      };
    }
    if (form.warranty_start_date) payload.warranty_start_date = form.warranty_start_date;
    if (form.warranty_expiry) payload.warranty_expiry = form.warranty_expiry;
    if (form.warranty_provider.trim()) payload.warranty_provider = form.warranty_provider.trim();
    if (form.warranty_terms.trim()) payload.warranty_terms = form.warranty_terms.trim();
    if (form.expected_life_years) payload.expected_life_years = parseInt(form.expected_life_years, 10);
    if (form.condition_grade) payload.condition_grade = form.condition_grade as ConditionGrade;
    if (form.replacement_cost_estimate) payload.replacement_cost_estimate = parseFloat(form.replacement_cost_estimate);
    if (form.insurance_value) payload.insurance_value = parseFloat(form.insurance_value);
    if (form.last_inspection_date) payload.last_inspection_date = form.last_inspection_date;
    if (form.next_inspection_due) payload.next_inspection_due = form.next_inspection_due;
    if (form.notes.trim()) payload.notes = form.notes.trim();
    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      const url = mode === "create" ? "/api/estates/assets" : `/api/estates/assets/${assetId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to ${mode === "create" ? "create" : "update"} asset`);
      }

      const result = await response.json();
      const newId: string = result.data?.id ?? result.id ?? assetId ?? "";

      // Upload photo if selected (create mode)
      if (photoFile && newId) {
        const photoFormData = new FormData();
        photoFormData.append("file", photoFile);
        photoFormData.append("evidence_type", "photo");
        photoFormData.append("asset_id", newId);
        photoFormData.append("organizationId", organizationId);
        photoFormData.append("title", `Photo — ${form.name}`);
        photoFormData.append("source_type", "upload");
        // Best-effort — don't block on failure
        await fetch(`/api/estates/evidence?organizationId=${organizationId}`, {
          method: "POST",
          headers: await getAuthHeaders(false),
          body: photoFormData,
        }).catch(() => {});
      }

      toast.success(mode === "create" ? "Asset created successfully" : "Asset updated successfully");
      onSuccess(newId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedContractor = contractors.find((c) => c.id === form.purchased_from_contractor_id);
  const selectedMaintainer = contractors.find((c) => c.id === form.maintained_by_contractor_id);
  const filteredContractors = contractors.filter((c) =>
    c.company_name.toLowerCase().includes(contractorSearch.toLowerCase())
  );
  const filteredMaintainers = contractors.filter((c) =>
    c.company_name.toLowerCase().includes(maintainerSearch.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Section 1: Basic Information */}
      <FormSection title="Basic Information">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="name" required>Asset Name</FieldLabel>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Main Boiler Unit A"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Asset Type */}
          <div>
            <FieldLabel htmlFor="asset_type" required>Asset Type</FieldLabel>
            <Select
              value={form.asset_type}
              onValueChange={(v) => handleAssetTypeChange(v as AssetType)}
            >
              <SelectTrigger id="asset_type" className={errors.asset_type ? "border-red-500" : ""}>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.asset_type && <p className="mt-1 text-xs text-red-500">{errors.asset_type}</p>}
          </div>

          {/* Status */}
          <div>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((p) => ({ ...p, status: v as AssetStatus }))}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asset Code */}
          <div>
            <FieldLabel htmlFor="code">Asset Code</FieldLabel>
            <Input
              id="code"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="e.g., BOI-001"
            />
            <p className="mt-1 text-xs text-muted-foreground">Auto-suggested from asset type — edit as needed</p>
          </div>

          {/* Category */}
          <div>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              placeholder="e.g., Boiler, Cold Water Tap"
            />
          </div>

          {/* Subcategory */}
          <div>
            <FieldLabel htmlFor="subcategory">Subcategory</FieldLabel>
            <Input
              id="subcategory"
              value={form.subcategory}
              onChange={(e) => setForm((p) => ({ ...p, subcategory: e.target.value }))}
              placeholder="Optional subcategory"
            />
          </div>
        </div>
      </FormSection>

      {/* Section 2: Location */}
      <FormSection title="Location">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor="building">Building</FieldLabel>
            <Input
              id="building"
              value={form.building}
              onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))}
              placeholder="Main Building"
            />
          </div>
          <div>
            <FieldLabel htmlFor="floor">Floor</FieldLabel>
            <Input
              id="floor"
              value={form.floor}
              onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))}
              placeholder="Ground Floor"
            />
          </div>
          <div>
            <FieldLabel htmlFor="room">Room</FieldLabel>
            <Input
              id="room"
              value={form.room}
              onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
              placeholder="Boiler Room"
            />
          </div>
        </div>
      </FormSection>

      {/* Section 3: Technical Specifications */}
      <FormSection title="Technical Specifications">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="manufacturer">Manufacturer</FieldLabel>
            <Input
              id="manufacturer"
              value={form.manufacturer}
              onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))}
              placeholder="e.g., Ideal Boilers"
            />
          </div>
          <div>
            <FieldLabel htmlFor="model">Model</FieldLabel>
            <Input
              id="model"
              value={form.model}
              onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
              placeholder="e.g., Logic Max 30"
            />
          </div>
          <div>
            <FieldLabel htmlFor="serial_number">Serial Number</FieldLabel>
            <Input
              id="serial_number"
              value={form.serial_number}
              onChange={(e) => setForm((p) => ({ ...p, serial_number: e.target.value }))}
              placeholder="Asset serial number"
            />
          </div>
          <div>
            <FieldLabel htmlFor="installation_date">Installation Date</FieldLabel>
            <Input
              id="installation_date"
              type="date"
              value={form.installation_date}
              onChange={(e) => setForm((p) => ({ ...p, installation_date: e.target.value }))}
            />
          </div>
        </div>
      </FormSection>

      {/* Section 4: Purchase Information */}
      <FormSection title="Purchase Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="purchase_date">Purchase Date</FieldLabel>
            <Input
              id="purchase_date"
              type="date"
              value={form.purchase_date}
              onChange={(e) => handlePurchaseDateChange(e.target.value)}
            />
          </div>

          {/* Purchase Price */}
          <div>
            <FieldLabel htmlFor="purchase_price">Purchase Price</FieldLabel>
            <div className="flex gap-2">
              <Select
                value={form.purchase_currency}
                onValueChange={(v) => setForm((p) => ({ ...p, purchase_currency: v }))}
              >
                <SelectTrigger className="w-28 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                min="0"
                value={form.purchase_price}
                onChange={(e) => setForm((p) => ({ ...p, purchase_price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="purchase_order_number">Purchase Order Number</FieldLabel>
            <Input
              id="purchase_order_number"
              value={form.purchase_order_number}
              onChange={(e) => setForm((p) => ({ ...p, purchase_order_number: e.target.value }))}
              placeholder="PO-2024-001"
            />
          </div>
          <div>
            <FieldLabel htmlFor="invoice_number">Invoice Number</FieldLabel>
            <Input
              id="invoice_number"
              value={form.invoice_number}
              onChange={(e) => setForm((p) => ({ ...p, invoice_number: e.target.value }))}
              placeholder="INV-12345"
            />
          </div>
        </div>

        {/* Supplier Picker */}
        <div>
          <FieldLabel>Purchased From / Supplier</FieldLabel>
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={contractorSearch}
                  placeholder="Search suppliers..."
                  onChange={(e) => {
                    setContractorSearch(e.target.value);
                    setContractorDropdownOpen(true);
                    if (e.target.value === "") {
                      setForm((p) => ({ ...p, purchased_from_contractor_id: "" }));
                    }
                  }}
                  onFocus={() => setContractorDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setContractorDropdownOpen(false), 200)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <Link
                href="/estates-compliance/contractors/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button type="button" variant="outline" size="icon" title="Add new supplier">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Dropdown */}
            {contractorDropdownOpen && filteredContractors.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg max-h-48 overflow-y-auto">
                {filteredContractors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                    onMouseDown={() => handleContractorSelect(c)}
                  >
                    <span className="font-medium">{c.company_name}</span>
                    {c.contact_name && (
                      <span className="ml-2 text-muted-foreground text-xs">{c.contact_name}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedContractor && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{selectedContractor.company_name}</span>
              {selectedContractor.email && ` · ${selectedContractor.email}`}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Opens supplier list — or{" "}
            <Link
              href="/estates-compliance/contractors/new"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              add a new supplier
            </Link>
          </p>
        </div>

        {/* Maintenance contractor picker */}
        <div>
          <FieldLabel>Maintained / Supported By</FieldLabel>
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={maintainerSearch}
                  placeholder="Search maintenance contractor..."
                  onChange={(e) => {
                    setMaintainerSearch(e.target.value);
                    setMaintainerDropdownOpen(true);
                    if (e.target.value === "") {
                      setForm((p) => ({
                        ...p,
                        maintained_by_contractor_id: "",
                      }));
                    }
                  }}
                  onFocus={() => setMaintainerDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setMaintainerDropdownOpen(false), 200)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <Link
                href="/estates-compliance/contractors/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button type="button" variant="outline" size="icon" title="Add new contractor">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {maintainerDropdownOpen && filteredMaintainers.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg max-h-48 overflow-y-auto">
                {filteredMaintainers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                    onMouseDown={() => handleMaintainerSelect(c)}
                  >
                    <span className="font-medium">{c.company_name}</span>
                    {c.contact_name && (
                      <span className="ml-2 text-muted-foreground text-xs">{c.contact_name}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedMaintainer && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{selectedMaintainer.company_name}</span>
              {selectedMaintainer.email && ` · ${selectedMaintainer.email}`}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            This is the contractor you normally contact for servicing, repairs,
            or support. It can be different from the supplier/warranty contact.
          </p>
        </div>
      </FormSection>

      {/* Section 5: Warranty */}
      <FormSection title="Warranty">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="warranty_start_date">Warranty Start Date</FieldLabel>
            <Input
              id="warranty_start_date"
              type="date"
              value={form.warranty_start_date}
              onChange={(e) => setForm((p) => ({ ...p, warranty_start_date: e.target.value }))}
            />
            <p className="mt-1 text-xs text-muted-foreground">Defaults to purchase date if left blank</p>
          </div>
          <div>
            <FieldLabel htmlFor="warranty_expiry">Warranty Expiry Date</FieldLabel>
            <Input
              id="warranty_expiry"
              type="date"
              value={form.warranty_expiry}
              onChange={(e) => setForm((p) => ({ ...p, warranty_expiry: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel htmlFor="warranty_provider">Warranty Provider</FieldLabel>
            <Input
              id="warranty_provider"
              value={form.warranty_provider}
              onChange={(e) => setForm((p) => ({ ...p, warranty_provider: e.target.value }))}
              placeholder="e.g., Ideal Boilers Ltd"
            />
            <p className="mt-1 text-xs text-muted-foreground">Auto-filled from selected supplier</p>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="warranty_terms">Warranty Terms</FieldLabel>
            <Textarea
              id="warranty_terms"
              value={form.warranty_terms}
              onChange={(e) => setForm((p) => ({ ...p, warranty_terms: e.target.value }))}
              placeholder="e.g., 5-year parts and labour, annual service required"
              rows={3}
            />
          </div>
        </div>
      </FormSection>

      {/* Section 6: Lifecycle & Condition */}
      <FormSection title="Lifecycle & Condition">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="expected_life_years">Expected Life (years)</FieldLabel>
            <Input
              id="expected_life_years"
              type="number"
              min="0"
              step="1"
              value={form.expected_life_years}
              onChange={(e) => setForm((p) => ({ ...p, expected_life_years: e.target.value }))}
              placeholder="e.g., 15"
            />
          </div>
          <div>
            <FieldLabel>Condition Grade</FieldLabel>
            <div className="flex gap-2">
              {CONDITION_GRADES.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      condition_grade: p.condition_grade === g.value ? "" : g.value,
                    }))
                  }
                  className={`flex-1 rounded-lg border-2 py-2 text-sm font-semibold transition-all ${
                    form.condition_grade === g.value
                      ? `${g.color} border-transparent`
                      : "border-border bg-background text-muted-foreground hover:border-ring"
                  }`}
                  title={g.description}
                >
                  {g.label}
                  <span className="block text-xs font-normal">{g.description}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="replacement_cost_estimate">Replacement Cost Estimate (£)</FieldLabel>
            <Input
              id="replacement_cost_estimate"
              type="number"
              step="0.01"
              min="0"
              value={form.replacement_cost_estimate}
              onChange={(e) => setForm((p) => ({ ...p, replacement_cost_estimate: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div>
            <FieldLabel htmlFor="insurance_value">Insurance Value (£)</FieldLabel>
            <Input
              id="insurance_value"
              type="number"
              step="0.01"
              min="0"
              value={form.insurance_value}
              onChange={(e) => setForm((p) => ({ ...p, insurance_value: e.target.value }))}
              placeholder="0.00"
            />
          </div>
        </div>
      </FormSection>

      {/* Section 7: Compliance & Inspection */}
      <FormSection title="Compliance & Inspection">
        <div>
          <FieldLabel>Compliance Domains</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {COMPLIANCE_DOMAINS.map((d) => {
              const active = form.compliance_domains.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleComplianceDomain(d.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-ring"
                  }`}
                >
                  {active && <span className="mr-1">✓</span>}
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="last_inspection_date">Last Inspection Date</FieldLabel>
            <Input
              id="last_inspection_date"
              type="date"
              value={form.last_inspection_date}
              onChange={(e) => setForm((p) => ({ ...p, last_inspection_date: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel htmlFor="next_inspection_due">Next Inspection Due</FieldLabel>
            <Input
              id="next_inspection_due"
              type="date"
              value={form.next_inspection_due}
              onChange={(e) => setForm((p) => ({ ...p, next_inspection_due: e.target.value }))}
            />
          </div>
        </div>
      </FormSection>

      {/* Section 8: Notes */}
      <FormSection title="Notes">
        <div>
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Any additional notes about this asset..."
            rows={4}
          />
        </div>
      </FormSection>

      {/* Section 9: Photo */}
      <FormSection title="Photo">
        <div>
          <FieldLabel htmlFor="photo">Asset Photo</FieldLabel>
          {photoFile ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate flex-1">{photoFile.name}</span>
              <button
                type="button"
                onClick={() => setPhotoFile(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="photo"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-6 cursor-pointer hover:border-ring hover:bg-muted/40 transition-all"
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium">Click to upload photo</span>
              <span className="text-xs text-muted-foreground mt-1">JPEG, PNG up to 10MB</span>
              <input
                id="photo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Photo will be uploaded after the asset is{" "}
            {mode === "create" ? "created" : "updated"}
          </p>
        </div>
      </FormSection>

      {/* Form Actions */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 sticky bottom-4 shadow-lg">
        <Link href={assetId ? `/estates-compliance/assets/${assetId}` : "/estates-compliance/assets"}>
          <Button type="button" variant="outline">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          {isSubmitting
            ? mode === "create" ? "Creating..." : "Saving..."
            : mode === "create" ? "Create Asset" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
