"use client";

/**
 * Asset Detail Page
 *
 * Full detail view for a single estate asset. Shows all linked data:
 * technical specs, location, purchase info, warranty, service history,
 * linked tickets, compliance tasks, evidence, lifecycle data, and activity feed.
 *
 * Layout: two-column on desktop (60/40 split), single column on mobile.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  Wrench,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Package,
  Tag,
  Banknote,
  ClipboardList,
  Activity,
  Image as ImageIcon,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import type {
  AssetWithWarrantyStatus,
  MaintenanceHistoryEntry,
  AssetType,
  AssetStatus,
  WarrantyStatus,
  ConditionGrade,
} from "@/types/estates-compliance";

// ---------------------------------------------------------------------------
// Extended types for the full detail endpoint
// ---------------------------------------------------------------------------

interface LinkedTicket {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface LinkedTask {
  id: string;
  task_name: string;
  task_type: string;
  status: string;
  due_by?: string | null;
  frequency?: string | null;
}

interface LinkedEvidence {
  id: string;
  title: string;
  evidence_type: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  created_at: string;
}

interface AssetFullDetail extends AssetWithWarrantyStatus {
  linked_tickets: LinkedTicket[];
  linked_tasks: LinkedTask[];
  linked_evidence: LinkedEvidence[];
}

// ---------------------------------------------------------------------------
// Helpers — formatting & config maps
// ---------------------------------------------------------------------------

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  building: "Building",
  room: "Room",
  outlet: "Outlet",
  equipment: "Equipment",
  fire_extinguisher: "Fire Extinguisher",
  emergency_light: "Emergency Light",
  lift: "Lift",
  playground_equipment: "Playground Equipment",
  accessibility_equipment: "Accessibility Equipment",
  vehicle: "Vehicle",
  furniture: "Furniture",
  it_equipment: "IT Equipment",
  kitchen_equipment: "Kitchen Equipment",
  av_equipment: "AV Equipment",
  musical_instrument: "Musical Instrument",
  sports_equipment: "Sports Equipment",
  grounds_equipment: "Grounds Equipment",
  teaching_resource: "Teaching Resource",
  signage: "Signage",
  security_equipment: "Security Equipment",
};

const STATUS_CONFIG: Record<AssetStatus, { label: string; variant: string }> =
  {
    active: { label: "Active", variant: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
    inactive: { label: "Inactive", variant: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
    disposed: { label: "Disposed", variant: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
    under_repair: { label: "Under Repair", variant: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
    under_maintenance: { label: "Under Maintenance", variant: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
    requires_inspection: { label: "Requires Inspection", variant: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
    retired: { label: "Retired", variant: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  };

const WARRANTY_CONFIG: Record<WarrantyStatus, { label: (days: number | null) => string; variant: string }> =
  {
    active: {
      label: (days) => days != null ? `Under warranty (${days} days remaining)` : "Under warranty",
      variant: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    },
    expiring_soon: {
      label: (days) => days != null ? `Expiring soon (${days} days)` : "Expiring soon",
      variant: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    },
    expired: {
      label: () => "Warranty expired",
      variant: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    },
    none: {
      label: () => "No warranty",
      variant: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
  };

const CONDITION_CONFIG: Record<ConditionGrade, { label: string; variant: string }> = {
  A: { label: "Grade A — Excellent", variant: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  B: { label: "Grade B — Good", variant: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  C: { label: "Grade C — Fair", variant: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  D: { label: "Grade D — Poor", variant: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
};

const TICKET_STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  open: { label: "Open", variant: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  in_progress: { label: "In Progress", variant: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
  pending: { label: "Pending", variant: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  resolved: { label: "Resolved", variant: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  closed: { label: "Closed", variant: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const PRIORITY_CONFIG: Record<string, { label: string; variant: string }> = {
  low: { label: "Low", variant: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  medium: { label: "Medium", variant: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  high: { label: "High", variant: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  critical: { label: "Critical", variant: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount?: number | null, currency = "GBP"): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calcAge(installDate?: string | null): string {
  if (!installDate) return "Unknown";
  const install = new Date(installDate);
  const now = new Date();
  const years = Math.floor(
    (now.getTime() - install.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );
  if (years < 1) return "Less than 1 year";
  return `${years} year${years !== 1 ? "s" : ""}`;
}

function calcEndOfLifeYear(installDate?: string | null, lifeYears?: number | null): string {
  if (!installDate || !lifeYears) return "—";
  const install = new Date(installDate);
  return String(install.getFullYear() + lifeYears);
}

function isImageFile(fileType?: string | null, fileName?: string | null): boolean {
  if (fileType?.startsWith("image/")) return true;
  if (fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "");
  }
  return false;
}

function isOverdue(dueDateStr?: string | null): boolean {
  if (!dueDateStr) return false;
  return new Date(dueDateStr) < new Date();
}

// ---------------------------------------------------------------------------
// Simple QR code SVG (reused pattern from QRCodeGenerator)
// ---------------------------------------------------------------------------

function generateQRPattern(input: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (sr: number, sc: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if ((isOuter || isInner) && sr + r < size && sc + c < size) {
          grid[sr + r][sc + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }

  let seed = Math.abs(hash);
  const lcg = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= size - 8;
      const inBL = r >= size - 8 && c < 8;
      const isTiming = r === 6 || c === 6;
      if (!inTL && !inTR && !inBL && !isTiming) {
        grid[r][c] = lcg() % 3 !== 0;
      }
    }
  }

  return grid;
}

function QRCodeDisplay({ value, size = 128 }: { value: string; size?: number }) {
  const grid = generateQRPattern(value);
  const modules = grid.length;
  const cell = size / modules;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      className="rounded"
    >
      <rect width={size} height={size} fill="white" />
      {grid.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill="black"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-24" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info row helper
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | null;
  children?: React.ReactNode;
}) {
  if (!value && !children) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground sm:w-44 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium">{children ?? value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function AssetDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { organizationId, session } = useAuth();

  const [asset, setAsset] = useState<AssetFullDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAsset = useCallback(async () => {
    if (!organizationId || !id) return;

    try {
      setLoading(true);
      setError(null);

      // Refresh session token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token ?? session?.access_token;

      const res = await fetch(
        `/api/estates/assets/${id}/full?organizationId=${organizationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        if (res.status === 404) {
          setError("Asset not found.");
        } else {
          setError("Failed to load asset details.");
        }
        return;
      }

      const data = await res.json();
      setAsset(data.asset ?? data);
    } catch {
      setError("Something went wrong loading this asset.");
    } finally {
      setLoading(false);
    }
  }, [organizationId, id, session?.access_token]);

  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]);

  // -------------------------------------------------------------------------
  // Render states
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <XCircle className="w-12 h-12 text-red-400" />
          <h2 className="text-xl font-semibold">{error ?? "Asset not found"}</h2>
          <p className="text-muted-foreground text-sm">
            The asset may have been deleted or you may not have permission to view it.
          </p>
          <Button asChild variant="outline">
            <Link href="/estates-compliance/assets">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Asset Register
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const statusCfg = STATUS_CONFIG[asset.status] ?? STATUS_CONFIG.active;
  const warrantyCfg = WARRANTY_CONFIG[asset.warranty_status];
  const conditionCfg = asset.condition_grade ? CONDITION_CONFIG[asset.condition_grade] : null;

  const maintenanceHistory: MaintenanceHistoryEntry[] = asset.maintenance_history ?? [];
  const totalMaintenanceSpend = maintenanceHistory.reduce(
    (sum, entry) => sum + (entry.cost ?? 0),
    0,
  );
  const spendRatio =
    asset.replacement_cost_estimate && asset.replacement_cost_estimate > 0
      ? (totalMaintenanceSpend / asset.replacement_cost_estimate) * 100
      : null;

  const openTickets = (asset.linked_tickets ?? []).filter(
    (t) => !["resolved", "closed"].includes(t.status),
  );
  const resolvedTickets = (asset.linked_tickets ?? []).filter((t) =>
    ["resolved", "closed"].includes(t.status),
  );

  const qrValue =
    asset.qr_code ||
    `https://app.schoolgle.co.uk/scan/${asset.id}`;

  // Activity feed — merge all events into one timeline
  const activityItems: { date: string; icon: React.ReactNode; description: string }[] = [
    ...maintenanceHistory.map((h) => ({
      date: h.date,
      icon: <Wrench className="w-3.5 h-3.5 text-blue-500" />,
      description: `Service: ${h.action}${h.performed_by ? ` by ${h.performed_by}` : ""}`,
    })),
    ...(asset.linked_tickets ?? []).map((t) => ({
      date: t.created_at,
      icon: <ClipboardList className="w-3.5 h-3.5 text-orange-500" />,
      description: `Ticket ${t.ticket_number}: ${t.title}`,
    })),
    ...(asset.linked_tasks ?? []).map((t) => ({
      date: t.due_by ?? asset.created_at,
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
      description: `Task: ${t.task_name} (${t.status})`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href="/estates-compliance/assets">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Asset Register
          </Link>
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold truncate">{asset.name}</h1>
            {asset.code && (
              <Badge variant="outline" className="font-mono text-xs">
                {asset.code}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.variant}`}
            >
              {statusCfg.label}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${warrantyCfg.variant}`}
            >
              <ShieldCheck className="w-3 h-3 mr-1" />
              {warrantyCfg.label(asset.warranty_days_remaining)}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="self-start">
              Actions
              <MoreHorizontal className="w-4 h-4 ml-1.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/estates-compliance/assets/${asset.id}/edit`}>
                Edit asset
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <QrCode className="w-4 h-4 mr-2" />
              Generate QR label
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ImageIcon className="w-4 h-4 mr-2" />
              Add photo
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Wrench className="w-4 h-4 mr-2" />
              Record service
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Dispose asset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ================================================================
            LEFT COLUMN (60%)
        ================================================================ */}
        <div className="lg:col-span-3 space-y-6">

          {/* 1. Technical specifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                Technical Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/50">
              <InfoRow
                label="Asset type"
                value={ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}
              />
              {asset.category && <InfoRow label="Category" value={asset.category} />}
              {asset.subcategory && <InfoRow label="Subcategory" value={asset.subcategory} />}
              <InfoRow label="Manufacturer" value={asset.manufacturer} />
              <InfoRow label="Model" value={asset.model} />
              <InfoRow label="Serial number">
                {asset.serial_number ? (
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {asset.serial_number}
                  </code>
                ) : null}
              </InfoRow>
              <InfoRow label="Installation date" value={formatDate(asset.installation_date)} />
              <InfoRow label="Barcode">
                {asset.barcode ? (
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {asset.barcode}
                  </code>
                ) : null}
              </InfoRow>
              {asset.specifications &&
                Object.entries(asset.specifications).map(([k, v]) => (
                  <InfoRow
                    key={k}
                    label={k.replace(/_/g, " ")}
                    value={String(v)}
                  />
                ))}
            </CardContent>
          </Card>

          {/* 2. Location */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/50">
              <InfoRow label="Building" value={asset.building} />
              <InfoRow label="Floor" value={asset.floor} />
              <InfoRow label="Room" value={asset.room} />
              {asset.location && <InfoRow label="Location" value={asset.location} />}
              <div className="pt-3">
                <Button variant="outline" size="sm" disabled className="text-xs">
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  View on floor plan
                  <Badge variant="secondary" className="ml-2 text-xs">Coming soon</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 3. Purchase information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="w-4 h-4 text-muted-foreground" />
                Purchase Information
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/50">
              <InfoRow label="Purchase date" value={formatDate(asset.purchase_date)} />
              <InfoRow
                label="Purchase price"
                value={formatCurrency(asset.purchase_price, asset.purchase_currency ?? "GBP")}
              />
              <InfoRow label="PO number">
                {asset.purchase_order_number ? (
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {asset.purchase_order_number}
                  </code>
                ) : null}
              </InfoRow>
              <InfoRow label="Invoice number">
                {asset.invoice_number ? (
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {asset.invoice_number}
                  </code>
                ) : null}
              </InfoRow>

              {/* Supplier */}
              {asset.supplier_contact && (
                <div className="py-2 space-y-1.5">
                  <span className="text-sm text-muted-foreground block">Purchased from</span>
                  <div className="pl-0 space-y-1">
                    <p className="text-sm font-semibold">
                      {asset.supplier_contact.company_name}
                    </p>
                    {asset.supplier_contact.contact_name && (
                      <p className="text-sm text-muted-foreground">
                        {asset.supplier_contact.contact_name}
                      </p>
                    )}
                    {asset.supplier_contact.email && (
                      <a
                        href={`mailto:${asset.supplier_contact.email}`}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {asset.supplier_contact.email}
                      </a>
                    )}
                    {asset.supplier_contact.phone && (
                      <a
                        href={`tel:${asset.supplier_contact.phone}`}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {asset.supplier_contact.phone}
                      </a>
                    )}
                    {asset.supplier_contact.mobile && (
                      <a
                        href={`tel:${asset.supplier_contact.mobile}`}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {asset.supplier_contact.mobile}{" "}
                        <span className="text-xs text-muted-foreground">(mobile)</span>
                      </a>
                    )}
                    {asset.purchased_from_contractor_id && (
                      <Link
                        href={`/estates-compliance/contractors/${asset.purchased_from_contractor_id}`}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
                      >
                        View supplier profile
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Warranty card */}
          <Card className={`border-2 ${
            asset.warranty_status === "active"
              ? "border-green-300 dark:border-green-700"
              : asset.warranty_status === "expiring_soon"
              ? "border-amber-300 dark:border-amber-700"
              : asset.warranty_status === "expired"
              ? "border-red-200 dark:border-red-900"
              : "border-border"
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                Warranty
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status banner */}
              <div
                className={`rounded-lg px-4 py-3 flex items-center gap-3 ${warrantyCfg.variant}`}
              >
                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-semibold">
                  {warrantyCfg.label(asset.warranty_days_remaining)}
                </p>
              </div>

              <div className="divide-y divide-border/50">
                <InfoRow label="Start date" value={formatDate(asset.warranty_start_date)} />
                <InfoRow label="Expiry date" value={formatDate(asset.warranty_expiry)} />
                {asset.warranty_days_remaining != null && (
                  <InfoRow
                    label="Days remaining"
                    value={String(asset.warranty_days_remaining)}
                  />
                )}
                <InfoRow label="Provider" value={asset.warranty_provider} />
                {asset.warranty_terms && (
                  <div className="py-2">
                    <span className="text-sm text-muted-foreground block mb-1">Terms</span>
                    <p className="text-sm leading-relaxed">{asset.warranty_terms}</p>
                  </div>
                )}
              </div>

              {/* Warranty action buttons */}
              {asset.warranty_status === "active" && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {openTickets.length > 0 && (
                    <div className="w-full rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-3 py-2 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        This asset has open helpdesk tickets. Check if the issue may be covered by warranty before authorising repairs.
                      </p>
                    </div>
                  )}
                  <Button variant="outline" size="sm">
                    <Mail className="w-3.5 h-3.5 mr-1.5" />
                    Draft warranty claim email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5. Service history */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                Service History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {maintenanceHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No service records yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left pb-2 pr-3 font-medium">Date</th>
                        <th className="text-left pb-2 pr-3 font-medium">Action</th>
                        <th className="text-left pb-2 pr-3 font-medium">Performed by</th>
                        <th className="text-right pb-2 font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {[...maintenanceHistory]
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() - new Date(a.date).getTime(),
                        )
                        .map((entry, i) => (
                          <tr key={i} className="align-top">
                            <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                              {formatDate(entry.date)}
                            </td>
                            <td className="py-2 pr-3">
                              <p>{entry.action}</p>
                              {entry.notes && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {entry.notes}
                                </p>
                              )}
                            </td>
                            <td className="py-2 pr-3 text-muted-foreground">
                              {entry.performed_by}
                            </td>
                            <td className="py-2 text-right whitespace-nowrap">
                              {entry.cost != null
                                ? formatCurrency(entry.cost)
                                : "—"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t font-semibold">
                        <td colSpan={3} className="pt-3 text-sm">
                          Total maintenance spend
                        </td>
                        <td className="pt-3 text-right text-sm">
                          {formatCurrency(totalMaintenanceSpend)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Spend vs replacement warning */}
              {spendRatio !== null && spendRatio >= 50 && (
                <div
                  className={`rounded-lg px-4 py-3 flex items-start gap-2 ${
                    spendRatio >= 75
                      ? "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
                      : "bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700"
                  }`}
                >
                  <AlertTriangle
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      spendRatio >= 75 ? "text-red-600" : "text-amber-600"
                    }`}
                  />
                  <p
                    className={`text-sm ${
                      spendRatio >= 75
                        ? "text-red-800 dark:text-red-300"
                        : "text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {spendRatio >= 75
                      ? "Replacement strongly recommended. "
                      : "Consider replacement. "}
                    Maintenance costs have reached{" "}
                    <strong>{Math.round(spendRatio)}%</strong> of replacement
                    value ({formatCurrency(totalMaintenanceSpend)} of{" "}
                    {formatCurrency(asset.replacement_cost_estimate)}).
                  </p>
                </div>
              )}

              <Button variant="outline" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add service record
              </Button>
            </CardContent>
          </Card>

          {/* 6. Linked helpdesk tickets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                Helpdesk Tickets
                {openTickets.length > 0 && (
                  <Badge className="ml-auto bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {openTickets.length} open
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {asset.linked_tickets?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-1">No linked tickets.</p>
              ) : (
                <>
                  {openTickets.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Open
                      </p>
                      {openTickets.map((t) => (
                        <Link
                          key={t.id}
                          href={`/estates-compliance/helpdesk/${t.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="text-xs text-muted-foreground font-mono">
                                #{t.ticket_number}
                              </code>
                              <span className="text-sm font-medium truncate">
                                {t.title}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                (PRIORITY_CONFIG[t.priority] ?? PRIORITY_CONFIG.medium).variant
                              }`}
                            >
                              {(PRIORITY_CONFIG[t.priority] ?? PRIORITY_CONFIG.medium).label}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                (TICKET_STATUS_CONFIG[t.status] ?? TICKET_STATUS_CONFIG.open).variant
                              }`}
                            >
                              {(TICKET_STATUS_CONFIG[t.status] ?? TICKET_STATUS_CONFIG.open).label}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {resolvedTickets.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Resolved / Closed
                      </p>
                      {resolvedTickets.map((t) => (
                        <Link
                          key={t.id}
                          href={`/estates-compliance/helpdesk/${t.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border border-dashed hover:bg-accent transition-colors opacity-70"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="text-xs text-muted-foreground font-mono">
                                #{t.ticket_number}
                              </code>
                              <span className="text-sm truncate">{t.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(t.created_at)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              (TICKET_STATUS_CONFIG[t.status] ?? TICKET_STATUS_CONFIG.closed).variant
                            }`}
                          >
                            {(TICKET_STATUS_CONFIG[t.status] ?? TICKET_STATUS_CONFIG.closed).label}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}

              <Button variant="outline" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create ticket for this asset
              </Button>
            </CardContent>
          </Card>

          {/* 7. Compliance tasks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Compliance Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(!asset.linked_tasks || asset.linked_tasks.length === 0) ? (
                <p className="text-sm text-muted-foreground py-1">
                  No compliance tasks linked to this asset.
                </p>
              ) : (
                asset.linked_tasks.map((task) => {
                  const overdue = isOverdue(task.due_by) && task.status !== "completed";
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        overdue ? "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${overdue ? "text-red-700 dark:text-red-400" : ""}`}>
                          {task.task_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {task.frequency && (
                            <span className="text-xs text-muted-foreground">
                              {task.frequency}
                            </span>
                          )}
                          {task.due_by && (
                            <span className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                              {overdue ? "Overdue — " : "Due "}
                              {formatDate(task.due_by)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={
                          task.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : overdue
                            ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }
                      >
                        {task.status}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* 8. Evidence & documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Evidence & Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(!asset.linked_evidence || asset.linked_evidence.length === 0) ? (
                <p className="text-sm text-muted-foreground py-1">
                  No evidence files attached.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {asset.linked_evidence.map((ev) => {
                    const isImg = isImageFile(ev.file_type, ev.file_name);
                    return (
                      <div
                        key={ev.id}
                        className="rounded-lg border overflow-hidden group relative"
                      >
                        {isImg && ev.file_url ? (
                          <img
                            src={ev.file_url}
                            alt={ev.title}
                            className="w-full h-24 object-cover"
                          />
                        ) : (
                          <div className="w-full h-24 flex items-center justify-center bg-muted">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-2">
                          <p className="text-xs font-medium truncate">{ev.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ev.file_name ?? ev.evidence_type}
                          </p>
                        </div>
                        {ev.file_url && (
                          <a
                            href={ev.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background rounded p-0.5 shadow"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <Button variant="outline" size="sm">
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload evidence
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ================================================================
            RIGHT COLUMN (40%)
        ================================================================ */}
        <div className="lg:col-span-2 space-y-6">

          {/* 9. Lifecycle card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                Lifecycle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {conditionCfg && (
                <div
                  className={`rounded-lg px-3 py-2 flex items-center gap-2 ${conditionCfg.variant}`}
                >
                  <span className="text-sm font-semibold">{conditionCfg.label}</span>
                </div>
              )}

              <div className="divide-y divide-border/50">
                <InfoRow
                  label="Age"
                  value={calcAge(asset.installation_date)}
                />
                <InfoRow
                  label="Expected life"
                  value={
                    asset.expected_life_years
                      ? `${asset.expected_life_years} years`
                      : undefined
                  }
                />
                <InfoRow
                  label="End of life"
                  value={calcEndOfLifeYear(
                    asset.installation_date,
                    asset.expected_life_years,
                  )}
                />
                <InfoRow
                  label="Replacement cost"
                  value={formatCurrency(asset.replacement_cost_estimate)}
                />
                <InfoRow
                  label="Insurance value"
                  value={formatCurrency(asset.insurance_value)}
                />
                <InfoRow
                  label="Last inspected"
                  value={formatDate(asset.last_inspection_date)}
                />
                <InfoRow
                  label="Next inspection"
                  value={formatDate(asset.next_inspection_due)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 10. Compliance domains */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                Compliance Domains
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(!asset.compliance_domains || asset.compliance_domains.length === 0) ? (
                <p className="text-sm text-muted-foreground">
                  No compliance domains assigned.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {asset.compliance_domains.map((domain) => (
                    <Badge key={domain} variant="secondary">
                      {domain}
                    </Badge>
                  ))}
                </div>
              )}
              <Link
                href={`/estates-compliance/tasks?asset=${asset.id}`}
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline pt-1"
              >
                View compliance tasks for this asset
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* 11. QR code */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="w-4 h-4 text-muted-foreground" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-center p-3 bg-white rounded-lg border">
                <QRCodeDisplay value={qrValue} size={140} />
              </div>
              <p className="text-xs text-center text-muted-foreground break-all">
                {qrValue}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.print()}
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print label
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Open scan URL
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 12. Activity feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-1">No activity yet.</p>
              ) : (
                <ol className="relative border-l border-border ml-2 space-y-4">
                  {activityItems.slice(0, 20).map((item, i) => (
                    <li key={i} className="ml-4">
                      <span className="absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full bg-background border border-border">
                        {item.icon}
                      </span>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {formatDate(item.date)}
                      </p>
                      <p className="text-sm">{item.description}</p>
                    </li>
                  ))}
                  {activityItems.length > 20 && (
                    <li className="ml-4">
                      <p className="text-xs text-muted-foreground">
                        + {activityItems.length - 20} more events
                      </p>
                    </li>
                  )}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Asset notes */}
          {asset.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{asset.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Asset photo */}
          {asset.image_url && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  Asset Photo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={asset.image_url}
                  alt={asset.name}
                  className="w-full rounded-lg object-cover max-h-64"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
