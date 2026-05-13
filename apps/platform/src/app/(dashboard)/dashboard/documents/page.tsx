"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  Plus,
  Send,
  LayoutTemplate,
  Sparkles,
  Search,
  Filter,
  ChevronRight,
  Loader2,
  FileCheck,
  FilePen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";

interface DocumentSummary {
  id: string;
  title?: string;
  subject?: string;
  template_name?: string;
  document_templates?: { name?: string };
  status: "draft" | "finalised" | "sent" | "archived";
  recipient_name?: string;
  created_at: string;
  updated_at: string;
}

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  module?: string;
  document_type?: string;
  is_system?: boolean;
  created_at: string;
  updated_at?: string;
}

type TabKey = "documents" | "templates";

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  draft: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Draft" },
  finalised: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    label: "Finalised",
  },
  sent: { bg: "bg-green-500/10", text: "text-green-400", label: "Sent" },
  archived: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    label: "Archived",
  },
};

function DocumentStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

export default function DocumentProductionPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const [activeTab, setActiveTab] = useState<TabKey>("documents");
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [templateSearch, setTemplateSearch] = useState("");
  const [counts, setCounts] = useState({
    total: 0,
    drafts: 0,
    sent_this_month: 0,
    templates_available: 0,
  });

  // Fetch documents
  useEffect(() => {
    if (!organizationId) return;
    fetch(`/api/documents?organizationId=${organizationId}`)
      .then((r) => r.json())
      .then((data) => {
        const docs = Array.isArray(data)
          ? data
          : data.documents || data.data || [];
        const normalisedDocs = docs.map((doc: DocumentSummary) => ({
          ...doc,
          title: doc.title || doc.subject || "Untitled document",
          template_name:
            doc.template_name ||
            doc.document_templates?.name ||
            "Document template",
        }));
        setDocuments(normalisedDocs);

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const drafts = normalisedDocs.filter(
          (d: DocumentSummary) => d.status === "draft",
        ).length;
        const sentThisMonth = normalisedDocs.filter(
          (d: DocumentSummary) =>
            d.status === "sent" && new Date(d.updated_at) >= monthStart,
        ).length;

        setCounts((prev) => ({
          ...prev,
          total: normalisedDocs.length,
          drafts,
          sent_this_month: sentThisMonth,
        }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organizationId]);

  // Fetch templates
  useEffect(() => {
    if (!organizationId) return;
    fetch(`/api/documents/templates?organizationId=${organizationId}`)
      .then((r) => r.json())
      .then((data) => {
        const tmpls = Array.isArray(data)
          ? data
          : data.templates || data.data || [];
        setTemplates(tmpls);
        setCounts((prev) => ({
          ...prev,
          templates_available: tmpls.length,
        }));
      })
      .catch(console.error)
      .finally(() => setLoadingTemplates(false));
  }, [organizationId]);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      !search ||
      (doc.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (doc.recipient_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (doc.template_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTemplates = templates.filter((tmpl) => {
    return (
      !templateSearch ||
      tmpl.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      (tmpl.description || "")
        .toLowerCase()
        .includes(templateSearch.toLowerCase()) ||
      (tmpl.category || "").toLowerCase().includes(templateSearch.toLowerCase())
    );
  });

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
            <Sparkles size={14} className="animate-pulse" />
            Document Management
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Document Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage school-branded templates, generated documents and review maintenance across all modules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/documents/triggers">
            <Button
              variant="outline"
              className="rounded-xl gap-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
            >
              <Sparkles size={16} />
              Triggers
            </Button>
          </Link>
          <Link href="/dashboard/documents/new">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl gap-2">
              <Plus size={16} />
              New Document
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Documents",
            value: counts.total,
            icon: FileText,
            color: "purple",
          },
          {
            label: "Drafts Pending",
            value: counts.drafts,
            icon: FilePen,
            color: "amber",
          },
          {
            label: "Sent This Month",
            value: counts.sent_this_month,
            icon: Send,
            color: "green",
          },
          {
            label: "Templates",
            value: counts.templates_available,
            icon: LayoutTemplate,
            color: "blue",
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700${stat.value === 0 ? " opacity-50" : ""}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} className="text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 w-fit">
        {[
          { key: "documents" as TabKey, label: "Documents", icon: FileText },
          {
            key: "templates" as TabKey,
            label: "Templates",
            icon: LayoutTemplate,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by title, recipient or template..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>
            <div className="relative">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 appearance-none cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="finalised">Finalised</option>
                <option value="sent">Sent</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Documents List */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Recent Documents
              </h2>
            </div>
            {loading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Loading documents...
              </div>
            ) : filteredDocuments.length === 0 && documents.length > 0 ? (
              <div className="p-12 text-center">
                <Search
                  size={48}
                  className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                  No matching documents
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  variant="outline"
                  className="rounded-xl gap-2"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="p-12 text-center">
                <FileText
                  size={48}
                  className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                  No documents yet
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Create your first document to get started with document
                  production
                </p>
                <Link href="/dashboard/documents/new">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2">
                    <Plus size={16} />
                    New Document
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/dashboard/documents/${doc.id}`}
                    className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-md transition-all duration-150"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {doc.title}
                        </h3>
                        <DocumentStatusBadge status={doc.status} />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {doc.template_name}
                        {doc.recipient_name && ` — ${doc.recipient_name}`}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(doc.updated_at).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-300 dark:text-slate-600 ml-3 shrink-0"
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <>
          {/* Template Search */}
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search templates..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>

          {/* Template Grid */}
          {loadingTemplates ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 size={20} className="animate-spin" />
              Loading templates...
            </div>
          ) : filteredTemplates.length === 0 && templates.length > 0 ? (
            <div className="p-12 text-center">
              <Search
                size={48}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
              />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                No matching templates
              </h3>
              <p className="text-sm text-slate-500">
                Try adjusting your search criteria
              </p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-12 text-center">
              <LayoutTemplate
                size={48}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
              />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                No templates available
              </h3>
              <p className="text-sm text-slate-500">
                Templates will appear here once configured by your administrator
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((tmpl) => (
                <Link
                  key={tmpl.id}
                  href={`/dashboard/documents/new?templateId=${tmpl.id}`}
                  className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400">
                      <FileCheck size={20} />
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {tmpl.name}
                  </h3>
                  {tmpl.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                      {tmpl.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {tmpl.module && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300">
                        {tmpl.module.replace(/_/g, " ")}
                      </span>
                    )}
                    {tmpl.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        {tmpl.category.replace(/_/g, " ")}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                      {tmpl.is_system ? "Schoolgle standard" : "School custom"}
                    </span>
                  </div>
                  <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-3 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <p>
                      Last updated:{" "}
                      {new Date(tmpl.updated_at || tmpl.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p>Review check: standard template, school can clone and maintain</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
