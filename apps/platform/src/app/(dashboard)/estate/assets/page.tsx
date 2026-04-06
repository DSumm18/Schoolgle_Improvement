"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  Loader2,
  Package,
  Plus,
  QrCode,
  Search,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Asset,
  AssetStatus,
  AssetType,
} from "@/types/estates-compliance";
import { useAuth } from "@/context/SupabaseAuthContext";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ASSET_TYPES: AssetType[] = [
  "building",
  "room",
  "outlet",
  "equipment",
  "fire_extinguisher",
  "emergency_light",
  "lift",
  "playground_equipment",
  "accessibility_equipment",
  "vehicle",
];

const ASSET_STATUSES: AssetStatus[] = [
  "active",
  "inactive",
  "under_maintenance",
  "requires_inspection",
  "under_repair",
  "disposed",
  "retired",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function humanLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusBadgeClass(status: AssetStatus): string {
  const map: Record<AssetStatus, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
    disposed: "bg-gray-200 text-gray-500",
    under_repair: "bg-orange-100 text-orange-700",
    under_maintenance: "bg-amber-100 text-amber-700",
    requires_inspection: "bg-red-100 text-red-700",
    retired: "bg-gray-100 text-gray-500",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function typeBadgeClass(type: AssetType): string {
  const map: Partial<Record<AssetType, string>> = {
    building: "bg-blue-100 text-blue-700",
    room: "bg-indigo-100 text-indigo-700",
    equipment: "bg-purple-100 text-purple-700",
    fire_extinguisher: "bg-red-100 text-red-700",
    emergency_light: "bg-amber-100 text-amber-700",
    lift: "bg-teal-100 text-teal-700",
    playground_equipment: "bg-green-100 text-green-700",
    vehicle: "bg-sky-100 text-sky-700",
  };
  return map[type] ?? "bg-gray-100 text-gray-600";
}

function formatDate(iso?: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EstateAssetsPage() {
  const { organizationId, session } = useAuth();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetType | "">("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "">("");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    underMaintenance: 0,
    requiresInspection: 0,
  });

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    asset_type: "equipment" as AssetType,
    building: "",
    floor: "",
    room: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    notes: "",
  });

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchAssets = useCallback(async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      if (typeFilter) params.set("asset_type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/estates/assets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      if (!res.ok) throw new Error("Failed to load assets");
      const data = await res.json();
      const list: Asset[] = data.assets ?? data.data ?? [];
      setAssets(list);
      setStats({
        total: list.length,
        active: list.filter((a) => a.status === "active").length,
        underMaintenance: list.filter((a) => a.status === "under_maintenance").length,
        requiresInspection: list.filter((a) => a.status === "requires_inspection").length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [organizationId, session, typeFilter, statusFilter, search]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // ---------------------------------------------------------------------------
  // Create asset
  // ---------------------------------------------------------------------------

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId) return;
    if (!form.name.trim()) {
      toast.error("Asset name is required");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/estates/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          "x-organization-id": organizationId,
        },
        body: JSON.stringify({
          ...form,
          status: "active",
          compliance_domains: [],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create asset");
      }
      toast.success("Asset added successfully");
      setForm({
        name: "",
        asset_type: "equipment",
        building: "",
        floor: "",
        room: "",
        manufacturer: "",
        model: "",
        serial_number: "",
        notes: "",
      });
      setShowCreateForm(false);
      fetchAssets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create asset");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/estate" className="hover:text-[#9F1239] transition-colors font-medium">
          Estate
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Asset Register</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Register</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track buildings, equipment, and infrastructure
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm((v) => !v)}
          className="gap-2 bg-[#9F1239] hover:bg-[#881030] text-white"
        >
          {showCreateForm ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Add Asset
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Assets", value: stats.total, color: "text-gray-700 bg-gray-50 border-gray-200" },
          { label: "Active", value: stats.active, color: "text-green-700 bg-green-50 border-green-200" },
          { label: "Maintenance", value: stats.underMaintenance, color: "text-amber-700 bg-amber-50 border-amber-200" },
          { label: "Inspection Due", value: stats.requiresInspection, color: "text-red-700 bg-red-50 border-red-200" },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-lg border px-4 py-3 text-center ${s.color}`}
          >
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <Card className="border-[#9F1239]/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#9F1239]">Add Asset</CardTitle>
            <CardDescription>Register a new asset to the estate</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Main Boiler Unit"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={form.asset_type}
                    onChange={(e) =>
                      setForm({ ...form, asset_type: e.target.value as AssetType })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  >
                    {ASSET_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {humanLabel(t)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Building
                  </label>
                  <input
                    type="text"
                    value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value })}
                    placeholder="e.g. Main Block"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Floor
                  </label>
                  <input
                    type="text"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    placeholder="e.g. Ground"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    placeholder="e.g. Boiler Room"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={form.manufacturer}
                    onChange={(e) =>
                      setForm({ ...form, manufacturer: e.target.value })
                    }
                    placeholder="e.g. Vaillant"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={form.serial_number}
                    onChange={(e) =>
                      setForm({ ...form, serial_number: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#9F1239] hover:bg-[#881030] text-white gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Asset
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center bg-gray-50 border border-gray-200 rounded-lg p-3">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchAssets()}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AssetType | "")}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
        >
          <option value="">All Types</option>
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {humanLabel(t)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AssetStatus | "")}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
        >
          <option value="">All Statuses</option>
          {ASSET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {humanLabel(s)}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchAssets}
          className="border-[#9F1239] text-[#9F1239] hover:bg-[#9F1239]/5"
        >
          Apply
        </Button>
      </div>

      {/* Asset list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading assets...</span>
        </div>
      ) : error ? (
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={fetchAssets}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : assets.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-14 text-center">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No assets found</p>
          <p className="text-sm text-gray-400 mt-1">
            Add an asset to start building the register.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Compliance</th>
                  <th className="px-4 py-3">Installed</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map((asset) => (
                  <>
                    <tr
                      key={asset.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() =>
                        setExpandedId(expandedId === asset.id ? null : asset.id)
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{asset.name}</div>
                        {asset.code && (
                          <div className="text-xs text-gray-400">{asset.code}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${typeBadgeClass(asset.asset_type)}`}>
                          {humanLabel(asset.asset_type)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {[asset.building, asset.floor, asset.room]
                          .filter(Boolean)
                          .join(" / ") || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(asset.compliance_domains ?? []).slice(0, 3).map((d) => (
                            <Badge
                              key={d}
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {humanLabel(d)}
                            </Badge>
                          ))}
                          {(asset.compliance_domains ?? []).length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              +{asset.compliance_domains.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(asset.installation_date)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${statusBadgeClass(asset.status)}`}>
                          {humanLabel(asset.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {asset.qr_code && (
                            <QrCode className="w-3.5 h-3.5 text-gray-400" />
                          )}
                          {expandedId === asset.id ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === asset.id && (
                      <tr key={`${asset.id}-detail`} className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-4">
                          <AssetDetail asset={asset} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {assets.map((asset) => (
              <Card
                key={asset.id}
                className="cursor-pointer hover:border-[#9F1239]/40 transition-all"
                onClick={() =>
                  setExpandedId(expandedId === asset.id ? null : asset.id)
                }
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{asset.name}</p>
                      {asset.code && (
                        <p className="text-xs text-gray-400">{asset.code}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className={`text-xs ${statusBadgeClass(asset.status)}`}>
                        {humanLabel(asset.status)}
                      </Badge>
                      {expandedId === asset.id ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`text-xs ${typeBadgeClass(asset.asset_type)}`}>
                      {humanLabel(asset.asset_type)}
                    </Badge>
                    {[asset.building, asset.floor, asset.room]
                      .filter(Boolean)
                      .join(" / ") && (
                      <span className="text-xs text-gray-500">
                        <Layers className="w-3 h-3 inline mr-0.5" />
                        {[asset.building, asset.floor, asset.room]
                          .filter(Boolean)
                          .join(" / ")}
                      </span>
                    )}
                  </div>
                  {expandedId === asset.id && <AssetDetail asset={asset} />}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asset detail panel
// ---------------------------------------------------------------------------

function AssetDetail({ asset }: { asset: Asset }) {
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm border-t border-gray-200 pt-3 mt-1">
      {asset.manufacturer && (
        <div>
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            Manufacturer
          </span>
          <p className="text-gray-800">{asset.manufacturer}</p>
        </div>
      )}
      {asset.model && (
        <div>
          <span className="text-xs text-gray-400 uppercase tracking-wide">Model</span>
          <p className="text-gray-800">{asset.model}</p>
        </div>
      )}
      {asset.serial_number && (
        <div>
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            Serial Number
          </span>
          <p className="text-gray-800 font-mono">{asset.serial_number}</p>
        </div>
      )}
      {asset.installation_date && (
        <div>
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            Installed
          </span>
          <p className="text-gray-800">
            {new Date(asset.installation_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      )}
      {asset.notes && (
        <div className="sm:col-span-2 md:col-span-3">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Notes</span>
          <p className="text-gray-700 whitespace-pre-wrap">{asset.notes}</p>
        </div>
      )}
    </div>
  );
}
