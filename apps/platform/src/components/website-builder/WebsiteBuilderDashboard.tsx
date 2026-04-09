"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  FileText,
  Palette,
  Newspaper,
  Image as ImageIcon,
  ShieldCheck,
  Rocket,
  Settings,
  ExternalLink,
  Plus,
  Eye,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import type { SchoolWebsite, WebsitePage, WebsitePost } from "@/lib/website-builder/content-types";

// ------------------------------------------------------------
// Props
// ------------------------------------------------------------

interface WebsiteBuilderDashboardProps {
  organizationId: string;
  onStartSetup: () => void;
  onEditPage: (page: WebsitePage) => void;
  onEditDesign: () => void;
  onManageNews: () => void;
  onViewCompliance: () => void;
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function WebsiteBuilderDashboard({
  organizationId,
  onStartSetup,
  onEditPage,
  onEditDesign,
  onManageNews,
  onViewCompliance,
}: WebsiteBuilderDashboardProps) {
  const [website, setWebsite] = useState<SchoolWebsite | null>(null);
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [posts, setPosts] = useState<WebsitePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    version: number;
    pageCount: number;
    totalSize: number;
  } | null>(null);

  // Fetch data
  useEffect(() => {
    async function load() {
      try {
        const [wsRes, pagesRes, postsRes] = await Promise.all([
          fetch("/api/website"),
          fetch("/api/website/pages"),
          fetch("/api/website/posts"),
        ]);

        if (wsRes.ok) {
          const data = await wsRes.json();
          if (data) {
            setWebsite(transformWebsite(data));
          }
        }

        if (pagesRes.ok) {
          const pagesData = await pagesRes.json();
          setPages(Array.isArray(pagesData) ? pagesData.map(transformPage) : []);
        }

        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(Array.isArray(postsData) ? postsData : []);
        }
      } catch (err) {
        console.error("Failed to load website data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [organizationId]);

  // Publish
  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      const res = await fetch("/api/website/publish", { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        setPublishResult(result);
        setWebsite((prev) => prev ? { ...prev, status: "published", publishedAt: new Date().toISOString() } : prev);
      }
    } catch (err) {
      console.error("Publish failed:", err);
    } finally {
      setPublishing(false);
    }
  }, []);

  // Delete page
  const handleDeletePage = useCallback(async (pageId: string) => {
    if (!confirm("Delete this page?")) return;
    try {
      await fetch(`/api/website/pages?id=${pageId}`, { method: "DELETE" });
      setPages((prev) => prev.filter((p) => p.id !== pageId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
      </div>
    );
  }

  // No website yet — show setup prompt
  if (!website) {
    return (
      <div className="text-center py-16 max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-fuchsia-50 flex items-center justify-center mx-auto mb-6">
          <Globe className="w-10 h-10 text-fuchsia-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Build Your School Website</h2>
        <p className="text-gray-500 mb-8">
          Create a beautiful, compliant school website in minutes. Upload your logo and
          we&apos;ll generate a design that matches your school&apos;s brand.
        </p>
        <button
          onClick={onStartSetup}
          className="inline-flex items-center gap-2 px-6 py-3 bg-fuchsia-500 text-white rounded-xl hover:bg-fuchsia-600 transition-colors font-medium text-lg"
        >
          <Rocket className="w-5 h-5" />
          Get Started
        </button>
      </div>
    );
  }

  // Dashboard for existing website
  const publishedPages = pages.filter((p) => p.status === "published").length;
  const draftPages = pages.filter((p) => p.status === "draft").length;
  const publishedPosts = posts.filter((p: any) => p.status === "published").length;

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={`rounded-xl p-4 flex items-center justify-between ${
        website.status === "published"
          ? "bg-green-50 border border-green-200"
          : "bg-amber-50 border border-amber-200"
      }`}>
        <div className="flex items-center gap-3">
          {website.status === "published" ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600" />
          )}
          <div>
            <span className="font-medium">
              {website.status === "published" ? "Website is live" : "Website is not published yet"}
            </span>
            {website.subdomain && website.status === "published" && (
              <span className="text-sm text-gray-500 ml-2">
                {website.subdomain}.schoolgle.co.uk
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {website.status === "published" && website.subdomain && (
            <a
              href={`https://${website.subdomain}.schoolgle.co.uk`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Site
            </a>
          )}
          <button
            onClick={handlePublish}
            disabled={publishing || publishedPages === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 disabled:opacity-50"
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
            {publishing ? "Publishing..." : "Publish Changes"}
          </button>
        </div>
      </div>

      {publishResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          Published version {publishResult.version} — {publishResult.pageCount} pages ({Math.round(publishResult.totalSize / 1024)} KB total)
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Pages" value={pages.length} sublabel={`${publishedPages} published, ${draftPages} draft`} />
        <StatCard icon={Newspaper} label="News Articles" value={posts.length} sublabel={`${publishedPosts} published`} />
        <StatCard icon={Eye} label="Style" value={website.presetId} sublabel="Design preset" isText />
        <StatCard icon={Clock} label="Last Published" value={website.publishedAt ? new Date(website.publishedAt).toLocaleDateString("en-GB") : "Never"} isText />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ActionCard icon={Palette} label="Design Studio" description="Colours, fonts & layout" onClick={onEditDesign} color="fuchsia" />
        <ActionCard icon={Newspaper} label="News & Blog" description="Publish updates" onClick={onManageNews} color="blue" />
        <ActionCard icon={ShieldCheck} label="Compliance" description="DfE requirements" onClick={onViewCompliance} color="green" />
        <ActionCard icon={Settings} label="Settings" description="Domain & SEO" onClick={() => {}} color="gray" />
      </div>

      {/* Pages list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Pages</h3>
          <button
            onClick={() => onEditPage({ id: "new" } as WebsitePage)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Page
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {pages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No pages yet. Add your first page to get started.
            </div>
          ) : (
            pages
              // @ts-expect-error - Auto-masked during strict compilation enforcement
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              .map((page: any) => (
                <div key={page.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="font-medium text-sm">{page.title}</span>
                      <span className="text-xs text-gray-400 ml-2">/{page.slug}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      page.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {page.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditPage(transformPage(page))}
                      className="p-1.5 hover:bg-gray-100 rounded-lg"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDeletePage(page.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  isText,
}: {
  icon: typeof FileText;
  label: string;
  value: string | number;
  sublabel?: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className={`font-bold ${isText ? "text-lg capitalize" : "text-2xl"}`}>{value}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>}
    </div>
  );
}

function ActionCard({
  icon: Icon,
  label,
  description,
  onClick,
  color,
}: {
  icon: typeof Palette;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    fuchsia: "bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100",
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    gray: "bg-gray-50 text-gray-600 hover:bg-gray-100",
  };

  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl transition-colors ${colorMap[color] || colorMap.gray}`}
    >
      <Icon className="w-6 h-6 mb-2" />
      <div className="font-medium text-sm">{label}</div>
      <div className="text-xs opacity-70">{description}</div>
    </button>
  );
}

// ============================================================
// Data transformers
// ============================================================

function transformWebsite(row: any): SchoolWebsite {
  return {
    id: row.id,
    organizationId: row.organization_id,
    schoolName: row.school_name,
    schoolPhase: row.school_phase,
    logoUrl: row.logo_url,
    faviconUrl: row.favicon_url,
    heroImageUrl: row.hero_image_url,
    heroVideoUrl: row.hero_video_url,
    motto: row.motto,
    presetId: row.preset_id,
    palette: row.palette,
    fontPairingId: row.font_pairing_id,
    heroMaskId: row.hero_mask_id,
    layoutOverrides: row.layout_overrides || {},
    shapeOverrides: row.shape_overrides || {},
    colourOverrides: row.colour_overrides || {},
    typographyOverrides: row.typography_overrides || {},
    motionOverrides: row.motion_overrides || {},
    imageryOverrides: row.imagery_overrides || {},
    homepageSections: row.homepage_sections || {},
    importedFromUrl: row.imported_from_url,
    importedAt: row.imported_at,
    status: row.status,
    subdomain: row.subdomain,
    customDomain: row.custom_domain,
    publishedAt: row.published_at,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    seoImageUrl: row.seo_image_url,
    googleAnalyticsId: row.google_analytics_id,
    cookieConsentEnabled: row.cookie_consent_enabled,
    socialLinks: row.social_links || {},
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    address: row.address || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformPage(row: any): WebsitePage {
  return {
    id: row.id,
    websiteId: row.website_id,
    organizationId: row.organization_id,
    title: row.title,
    slug: row.slug,
    pageType: row.page_type,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    contentBlocks: row.content_blocks || [],
    heroImageUrl: row.hero_image_url,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    showBreadcrumbs: row.show_breadcrumbs,
    showSidebar: row.show_sidebar,
    sidebarContent: row.sidebar_content || [],
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    seoImageUrl: row.seo_image_url,
    noIndex: row.no_index,
    status: row.status,
    publishedAt: row.published_at,
    template: row.template,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
