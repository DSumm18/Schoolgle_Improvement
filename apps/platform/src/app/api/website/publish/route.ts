import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { generateStaticSite } from "@/lib/website-builder/static-generator";
import type { SchoolWebsite, WebsitePage, WebsitePost, NavigationItem } from "@/lib/website-builder/content-types";

// POST /api/website/publish — Generate and store a static snapshot
export const POST = protectedRoute(
  async (auth) => {
    const supabase = createServiceRoleClient();

    // Fetch website config
    const { data: websiteRow, error: wsError } = await supabase
      .from("school_websites")
      .select("*")
      .eq("organization_id", auth.organizationId)
      .single();

    if (wsError || !websiteRow) {
      return apiError("No website found", 404);
    }

    // Fetch pages, posts, navigation
    const [pagesRes, postsRes, navRes] = await Promise.all([
      supabase
        .from("website_pages")
        .select("*")
        .eq("website_id", websiteRow.id)
        .eq("status", "published")
        .order("sort_order"),
      supabase
        .from("website_posts")
        .select("*")
        .eq("website_id", websiteRow.id)
        .eq("status", "published")
        .order("published_at", { ascending: false }),
      supabase
        .from("website_navigation")
        .select("*")
        .eq("website_id", websiteRow.id)
        .order("sort_order"),
    ]);

    if (pagesRes.error) return apiError(pagesRes.error.message, 500);
    if (postsRes.error) return apiError(postsRes.error.message, 500);

    // Transform database rows to app types
    const website: SchoolWebsite = {
      id: websiteRow.id,
      organizationId: websiteRow.organization_id,
      schoolName: websiteRow.school_name,
      schoolPhase: websiteRow.school_phase,
      logoUrl: websiteRow.logo_url,
      faviconUrl: websiteRow.favicon_url,
      heroImageUrl: websiteRow.hero_image_url,
      heroVideoUrl: websiteRow.hero_video_url,
      motto: websiteRow.motto,
      presetId: websiteRow.preset_id,
      palette: websiteRow.palette,
      fontPairingId: websiteRow.font_pairing_id,
      heroMaskId: websiteRow.hero_mask_id,
      layoutOverrides: websiteRow.layout_overrides || {},
      shapeOverrides: websiteRow.shape_overrides || {},
      colourOverrides: websiteRow.colour_overrides || {},
      typographyOverrides: websiteRow.typography_overrides || {},
      motionOverrides: websiteRow.motion_overrides || {},
      imageryOverrides: websiteRow.imagery_overrides || {},
      homepageSections: websiteRow.homepage_sections || {},
      importedFromUrl: websiteRow.imported_from_url,
      importedAt: websiteRow.imported_at,
      status: websiteRow.status,
      subdomain: websiteRow.subdomain,
      customDomain: websiteRow.custom_domain,
      publishedAt: websiteRow.published_at,
      seoTitle: websiteRow.seo_title,
      seoDescription: websiteRow.seo_description,
      seoImageUrl: websiteRow.seo_image_url,
      googleAnalyticsId: websiteRow.google_analytics_id,
      cookieConsentEnabled: websiteRow.cookie_consent_enabled,
      socialLinks: websiteRow.social_links || {},
      contactEmail: websiteRow.contact_email,
      contactPhone: websiteRow.contact_phone,
      address: websiteRow.address || {},
      createdAt: websiteRow.created_at,
      updatedAt: websiteRow.updated_at,
    };

    const pages: WebsitePage[] = (pagesRes.data || []).map((r: any) => ({
      id: r.id,
      websiteId: r.website_id,
      organizationId: r.organization_id,
      title: r.title,
      slug: r.slug,
      pageType: r.page_type,
      parentId: r.parent_id,
      sortOrder: r.sort_order,
      contentBlocks: r.content_blocks || [],
      heroImageUrl: r.hero_image_url,
      heroTitle: r.hero_title,
      heroSubtitle: r.hero_subtitle,
      showBreadcrumbs: r.show_breadcrumbs,
      showSidebar: r.show_sidebar,
      sidebarContent: r.sidebar_content || [],
      seoTitle: r.seo_title,
      seoDescription: r.seo_description,
      seoImageUrl: r.seo_image_url,
      noIndex: r.no_index,
      status: r.status,
      publishedAt: r.published_at,
      template: r.template,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    const posts: WebsitePost[] = (postsRes.data || []).map((r: any) => ({
      id: r.id,
      websiteId: r.website_id,
      organizationId: r.organization_id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      contentBlocks: r.content_blocks || [],
      featuredImageUrl: r.featured_image_url,
      category: r.category,
      tags: r.tags || [],
      authorName: r.author_name,
      status: r.status,
      publishedAt: r.published_at,
      pinned: r.pinned,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    const navigation: NavigationItem[] = (navRes.data || []).map((r: any) => ({
      id: r.id,
      websiteId: r.website_id,
      menuLocation: r.menu_location,
      label: r.label,
      url: r.url,
      pageId: r.page_id,
      parentId: r.parent_id,
      sortOrder: r.sort_order,
      openInNewTab: r.open_in_new_tab,
      icon: r.icon,
    }));

    // Generate the static site
    const output = generateStaticSite({ website, pages, posts, navigation });

    // Get current version
    const { data: latestSnapshot } = await supabase
      .from("website_published_snapshots")
      .select("version")
      .eq("website_id", websiteRow.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latestSnapshot?.version || 0) + 1;

    // Store snapshot
    const { error: snapError } = await supabase
      .from("website_published_snapshots")
      .insert({
        website_id: websiteRow.id,
        organization_id: auth.organizationId,
        version: nextVersion,
        snapshot_hash: output.hash,
        pages: output.pages,
        css: output.css,
        page_count: output.pageCount,
        total_size_bytes: output.totalSize,
        published_by: auth.userId,
      });

    if (snapError) return apiError(snapError.message, 500);

    // Update website status
    await supabase
      .from("school_websites")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        last_published_html: output.hash,
      })
      .eq("id", websiteRow.id);

    return apiSuccess({
      version: nextVersion,
      hash: output.hash,
      pageCount: output.pageCount,
      totalSize: output.totalSize,
    });
  },
  { requiredRole: "slt" }
);
