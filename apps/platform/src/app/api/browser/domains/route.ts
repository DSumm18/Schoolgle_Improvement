/**
 * Browser Domains API
 *
 * Provides endpoints for managing approved browser domains:
 * - GET /api/browser/domains - List approved domains for organization
 * - POST /api/browser/domains - Add a new approved domain (admin only)
 * - PATCH /api/browser/domains - Update domain settings (admin only)
 * - DELETE /api/browser/domains - Remove an approved domain (admin only)
 *
 * All endpoints require authentication and organization membership.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ============================================================================
// TYPES
// ============================================================================

interface CreateDomainRequest {
  domain: string;
  description?: string;
  category: "government" | "internal" | "vendor" | "other";
  requiresAuth?: boolean;
  authMethod?: "sso" | "headers" | "credentials" | "none";
  authConfig?: Record<string, any>;
  allowedPaths?: string[];
  deniedPaths?: string[];
  maxSessionDuration?: number;
}

interface UpdateDomainRequest {
  domainId: string;
  description?: string;
  requiresAuth?: boolean;
  authMethod?: "sso" | "headers" | "credentials" | "none";
  authConfig?: Record<string, any>;
  allowedPaths?: string[];
  deniedPaths?: string[];
  maxSessionDuration?: number;
  isActive?: boolean;
}

interface DeleteDomainRequest {
  domainId: string;
}

// ============================================================================
// GET - List approved domains
// ============================================================================

export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const organizationId = auth.organizationId;

  const { data: domains, error } = await supabase
    .from("browser_approved_domains")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return apiSuccess({ domains });
});

// ============================================================================
// POST - Add a new approved domain (admin only)
// ============================================================================

export const POST = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();
    const organizationId = auth.organizationId;

    const body: CreateDomainRequest = await request.json();
    const {
      domain,
      description,
      category,
      requiresAuth = false,
      authMethod = "none",
      authConfig = {},
      allowedPaths = ["/**"],
      deniedPaths = [],
      maxSessionDuration = 1800,
    } = body;

    if (!domain || !category) {
      return apiError("Domain and category are required", 400);
    }

    // Check if domain already exists
    const { data: existing } = await supabase
      .from("browser_approved_domains")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("domain", domain)
      .maybeSingle();

    if (existing) {
      return apiError("Domain already exists for this organization", 409);
    }

    // Insert new domain
    const { data: newDomain, error } = await supabase
      .from("browser_approved_domains")
      .insert({
        organization_id: organizationId,
        domain: domain.toLowerCase(),
        description,
        category,
        requires_auth: requiresAuth,
        auth_method: authMethod,
        auth_config: authConfig,
        allowed_paths: allowedPaths,
        denied_paths: deniedPaths,
        max_session_duration: maxSessionDuration,
        created_by: auth.userId,
      })
      .select()
      .single();

    if (error) throw error;

    return apiSuccess({ domain: newDomain });
  },
  { requiredRole: "admin" },
);

// ============================================================================
// PATCH - Update domain settings (admin only)
// ============================================================================

export const PATCH = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();
    const organizationId = auth.organizationId;

    const body: UpdateDomainRequest = await request.json();
    const { domainId, ...updates } = body;

    if (!domainId) {
      return apiError("Domain ID is required", 400);
    }

    // Verify domain belongs to organization
    const { data: existing } = await supabase
      .from("browser_approved_domains")
      .select("id")
      .eq("id", domainId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!existing) {
      return apiError("Domain not found or access denied", 404);
    }

    // Update domain
    const { data: updatedDomain, error } = await supabase
      .from("browser_approved_domains")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", domainId)
      .select()
      .single();

    if (error) throw error;

    return apiSuccess({ domain: updatedDomain });
  },
  { requiredRole: "admin" },
);

// ============================================================================
// DELETE - Remove an approved domain (admin only)
// ============================================================================

export const DELETE = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();
    const organizationId = auth.organizationId;

    const body: DeleteDomainRequest = await request.json();
    const { domainId } = body;

    if (!domainId) {
      return apiError("Domain ID is required", 400);
    }

    // Verify domain belongs to organization
    const { data: existing } = await supabase
      .from("browser_approved_domains")
      .select("id")
      .eq("id", domainId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!existing) {
      return apiError("Domain not found or access denied", 404);
    }

    // Delete domain
    const { error } = await supabase
      .from("browser_approved_domains")
      .delete()
      .eq("id", domainId);

    if (error) throw error;

    return apiSuccess({ message: "Domain removed successfully" });
  },
  { requiredRole: "admin" },
);
