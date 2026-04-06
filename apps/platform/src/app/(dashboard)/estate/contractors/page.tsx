"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
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
import { Contractor } from "@/types/estates-compliance";
import { useAuth } from "@/context/SupabaseAuthContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function humanLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso?: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isExpiringSoon(dateStr?: string): boolean {
  if (!dateStr) return false;
  const days = (new Date(dateStr).getTime() - Date.now()) / 86400000;
  return days >= 0 && days <= 60;
}

function isExpired(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

function insuranceRagClass(contractor: Contractor): string {
  const certs = contractor.insurance_certificates ?? [];
  if (certs.length === 0) return "bg-gray-100 text-gray-600";
  const anyExpired = certs.some((c) => isExpired(c.expiry_date));
  if (anyExpired) return "bg-red-100 text-red-700";
  const anySoon = certs.some((c) => isExpiringSoon(c.expiry_date));
  if (anySoon) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

function insuranceRagLabel(contractor: Contractor): string {
  const certs = contractor.insurance_certificates ?? [];
  if (certs.length === 0) return "No Insurance";
  const anyExpired = certs.some((c) => isExpired(c.expiry_date));
  if (anyExpired) return "Expired";
  const anySoon = certs.some((c) => isExpiringSoon(c.expiry_date));
  if (anySoon) return "Expiring Soon";
  return "Valid";
}

function dbsStatus(contractor: Contractor): { label: string; cls: string } {
  const doc = (contractor.safeguarding_docs ?? []).find(
    (d) => d.type === "dbs_check",
  );
  if (!doc) return { label: "No DBS", cls: "bg-gray-100 text-gray-500" };
  if (isExpired(doc.expiry_date))
    return { label: "DBS Expired", cls: "bg-red-100 text-red-700" };
  if (isExpiringSoon(doc.expiry_date))
    return { label: "DBS Expiring", cls: "bg-amber-100 text-amber-700" };
  return { label: "DBS Valid", cls: "bg-green-100 text-green-700" };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EstateContractorsPage() {
  const { organizationId, session } = useAuth();

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive" | "restricted">("");

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    services: "",
    notes: "",
  });

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchContractors = useCallback(async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/estates/contractors?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      if (!res.ok) throw new Error("Failed to load contractors");
      const data = await res.json();
      setContractors(data.contractors ?? data.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load contractors",
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId, session, statusFilter, search]);

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  // ---------------------------------------------------------------------------
  // Create contractor
  // ---------------------------------------------------------------------------

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId) return;
    if (!form.company_name.trim()) {
      toast.error("Company name is required");
      return;
    }
    try {
      setSubmitting(true);
      const services = form.services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((service_type) => ({ service_type }));

      const res = await fetch("/api/estates/contractors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          "x-organization-id": organizationId,
        },
        body: JSON.stringify({
          company_name: form.company_name,
          contact_name: form.contact_name,
          email: form.email,
          phone: form.phone,
          services,
          notes: form.notes,
          status: "active",
          preferred: false,
          accreditations: [],
          insurance_certificates: [],
          safeguarding_docs: [],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create contractor");
      }
      toast.success("Contractor added successfully");
      setForm({
        company_name: "",
        contact_name: "",
        email: "",
        phone: "",
        services: "",
        notes: "",
      });
      setShowCreateForm(false);
      fetchContractors();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create contractor",
      );
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
        <Link
          href="/estate"
          className="hover:text-[#9F1239] transition-colors font-medium"
        >
          Estate
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Contractors</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contractors</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage approved contractors and their compliance documents
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
              <Plus className="w-4 h-4" /> Add Contractor
            </>
          )}
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <Card className="border-[#9F1239]/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#9F1239]">
              Add Contractor
            </CardTitle>
            <CardDescription>
              Register a new contractor to the approved list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={(e) =>
                      setForm({ ...form, company_name: e.target.value })
                    }
                    placeholder="e.g. ABC Plumbing Ltd"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={form.contact_name}
                    onChange={(e) =>
                      setForm({ ...form, contact_name: e.target.value })
                    }
                    placeholder="e.g. John Smith"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Services{" "}
                    <span className="text-gray-400 font-normal">
                      (comma separated)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.services}
                    onChange={(e) =>
                      setForm({ ...form, services: e.target.value })
                    }
                    placeholder="e.g. Plumbing, Heating, Gas Safety"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
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
                  Add Contractor
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
            placeholder="Search contractors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchContractors()}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as "" | "active" | "inactive" | "restricted",
            )
          }
          className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="restricted">Restricted</option>
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchContractors}
          className="border-[#9F1239] text-[#9F1239] hover:bg-[#9F1239]/5"
        >
          Apply
        </Button>
      </div>

      {/* Contractor grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading contractors...</span>
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
              onClick={fetchContractors}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : contractors.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-14 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No contractors found</p>
          <p className="text-sm text-gray-400 mt-1">
            Add a contractor to start building your approved list.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contractors.map((contractor) => {
            const dbs = dbsStatus(contractor);
            const insRag = insuranceRagClass(contractor);
            const insLabel = insuranceRagLabel(contractor);
            const isExpanded = expandedId === contractor.id;

            return (
              <Card
                key={contractor.id}
                className={`transition-all hover:shadow-md cursor-pointer ${isExpanded ? "border-[#9F1239]/40" : ""}`}
                onClick={() =>
                  setExpandedId(isExpanded ? null : contractor.id)
                }
              >
                <CardContent className="p-5 space-y-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-base">
                        {contractor.company_name}
                      </p>
                      {contractor.contact_name && (
                        <p className="text-sm text-gray-500">
                          {contractor.contact_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {contractor.preferred && (
                        <Badge className="bg-[#9F1239]/10 text-[#9F1239] text-xs">
                          Preferred
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Services */}
                  {(contractor.services ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {contractor.services.slice(0, 5).map((s, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs px-2 py-0.5"
                        >
                          {s.service_type}
                        </Badge>
                      ))}
                      {contractor.services.length > 5 && (
                        <Badge
                          variant="outline"
                          className="text-xs px-2 py-0.5"
                        >
                          +{contractor.services.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* RAG indicators */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`text-xs ${insRag}`}>
                      Insurance: {insLabel}
                    </Badge>
                    <Badge className={`text-xs ${dbs.cls}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {dbs.label}
                    </Badge>
                  </div>

                  {/* Contact links */}
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    {contractor.phone && (
                      <a
                        href={`tel:${contractor.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 hover:text-[#9F1239] transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {contractor.phone}
                      </a>
                    )}
                    {contractor.email && (
                      <a
                        href={`mailto:${contractor.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 hover:text-[#9F1239] transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {contractor.email}
                      </a>
                    )}
                    {contractor.website && (
                      <a
                        href={contractor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 hover:text-[#9F1239] transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Website
                      </a>
                    )}
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 pt-4 space-y-4">
                      {/* Accreditations */}
                      {(contractor.accreditations ?? []).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                            Accreditations
                          </p>
                          <div className="space-y-1">
                            {contractor.accreditations.map((acc, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-gray-800">
                                  {acc.type}
                                  {acc.number && (
                                    <span className="text-gray-400 ml-1.5 font-mono text-xs">
                                      #{acc.number}
                                    </span>
                                  )}
                                </span>
                                {acc.expiry_date && (
                                  <span
                                    className={`text-xs ${isExpired(acc.expiry_date) ? "text-red-600" : isExpiringSoon(acc.expiry_date) ? "text-amber-600" : "text-gray-400"}`}
                                  >
                                    Exp: {formatDate(acc.expiry_date)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Insurance certificates */}
                      {(contractor.insurance_certificates ?? []).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                            Insurance Certificates
                          </p>
                          <div className="space-y-1">
                            {contractor.insurance_certificates.map((cert, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-gray-800">
                                  {humanLabel(cert.type)}
                                  {cert.coverage_amount && (
                                    <span className="text-gray-400 ml-1.5 text-xs">
                                      £
                                      {cert.coverage_amount.toLocaleString()}
                                    </span>
                                  )}
                                </span>
                                <span
                                  className={`text-xs ${isExpired(cert.expiry_date) ? "text-red-600 font-semibold" : isExpiringSoon(cert.expiry_date) ? "text-amber-600" : "text-gray-400"}`}
                                >
                                  Exp: {formatDate(cert.expiry_date)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Safeguarding docs */}
                      {(contractor.safeguarding_docs ?? []).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                            Safeguarding Documents
                          </p>
                          <div className="space-y-1">
                            {contractor.safeguarding_docs.map((doc, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-gray-800 flex items-center gap-1.5">
                                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                                  {humanLabel(doc.type)}
                                </span>
                                {doc.expiry_date && (
                                  <span
                                    className={`text-xs ${isExpired(doc.expiry_date) ? "text-red-600 font-semibold" : isExpiringSoon(doc.expiry_date) ? "text-amber-600" : "text-gray-400"}`}
                                  >
                                    Exp: {formatDate(doc.expiry_date)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {contractor.notes && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                            Notes
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {contractor.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
