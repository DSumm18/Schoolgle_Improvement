/**
 * Custom Checks Database Layer
 *
 * Functions for interacting with custom_checks table.
 * Custom checks are user-created compliance checks specific to a school's needs.
 */

import { createServiceRoleClient } from "@/lib/supabase-server";
import type { CheckVisibility, RecurrencePattern } from "../check-templates";
import type { ComplianceDomain } from "../statutory-checks";

/**
 * Custom Check interface matching the database schema
 */
export interface CustomCheck {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  compliance_domain: ComplianceDomain;
  frequency: RecurrencePattern;
  estimated_duration?: number; // minutes
  requires_qualification?: string;
  evidence_required: string[];
  checklist_items?: string[];
  notes?: string;
  classification: "statutory" | "non_statutory";
  frequency_locked: boolean;
  statutory_reference?: string;
  visibility: CheckVisibility;
  tags: string[];
  is_template: boolean;
  template_parent_id?: string; // If cloned from a template
  cloned_from?: string; // If cloned from another custom check
  usage_count?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

/**
 * Input for creating a custom check
 */
export interface CreateCustomCheckInput {
  organization_id: string;
  name: string;
  description: string;
  compliance_domain: ComplianceDomain;
  frequency: RecurrencePattern;
  estimated_duration?: number;
  requires_qualification?: string;
  evidence_required: string[];
  checklist_items?: string[];
  notes?: string;
  classification?: "statutory" | "non_statutory";
  frequency_locked?: boolean;
  statutory_reference?: string;
  visibility: CheckVisibility;
  tags?: string[];
  is_template?: boolean;
  template_parent_id?: string;
  cloned_from?: string;
  created_by: string;
}

/**
 * Input for updating a custom check
 */
export type UpdateCustomCheckInput = Partial<
  Omit<CreateCustomCheckInput, "organization_id" | "created_by">
> & {
  archived?: boolean;
};

/**
 * Filters for custom check queries
 */
export interface CustomCheckFilters {
  domain?: ComplianceDomain;
  frequency?: RecurrencePattern;
  visibility?: CheckVisibility;
  is_template?: boolean;
  search?: string;
  tags?: string[];
  include_archived?: boolean;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get custom checks for an organization
 */
export async function getCustomChecks(
  organizationId: string,
  filters?: CustomCheckFilters,
  pagination?: PaginationOptions,
): Promise<PaginatedResponse<CustomCheck>> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("custom_checks")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId);

  // Don't include archived by default
  if (!filters?.include_archived) {
    query = query.is("archived_at", null);
  }

  query = query.order("created_at", { ascending: false });

  // Apply filters
  if (filters?.domain) {
    query = query.eq("compliance_domain", filters.domain);
  }
  if (filters?.frequency) {
    query = query.eq("frequency", filters.frequency);
  }
  if (filters?.visibility) {
    query = query.eq("visibility", filters.visibility);
  }
  if (filters?.is_template !== undefined) {
    query = query.eq("is_template", filters.is_template);
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
    );
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains("tags", filters.tags);
  }

  // Apply pagination
  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching custom checks:", error);
    throw new Error("Failed to fetch custom checks");
  }

  const totalPages = pagination
    ? Math.ceil((count || 0) / pagination.pageSize)
    : 1;

  return {
    data: data || [],
    total: count || 0,
    page: pagination?.page || 1,
    pageSize: pagination?.pageSize || data?.length || 0,
    totalPages,
  };
}

/**
 * Get a single custom check by ID
 */
export async function getCustomCheckById(
  checkId: string,
): Promise<CustomCheck | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("custom_checks")
    .select("*")
    .eq("id", checkId)
    .single();

  if (error) {
    console.error("Error fetching custom check:", error);
    return null;
  }

  return data;
}

/**
 * Create a new custom check
 */
export async function createCustomCheck(
  input: CreateCustomCheckInput,
): Promise<CustomCheck> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("custom_checks")
    .insert({
      ...input,
      tags: input.tags || [],
      evidence_required: input.evidence_required || [],
      checklist_items: input.checklist_items || [],
      classification: input.classification || "non_statutory",
      frequency_locked:
        input.frequency_locked ?? input.classification === "statutory",
      statutory_reference: input.statutory_reference || null,
      is_template: input.is_template || false,
      usage_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating custom check:", error);
    throw new Error("Failed to create custom check");
  }

  return data;
}

/**
 * Update a custom check
 */
export async function updateCustomCheck(
  checkId: string,
  updates: UpdateCustomCheckInput,
): Promise<CustomCheck> {
  const supabase = createServiceRoleClient();

  const updateData: Record<string, unknown> = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Handle archiving
  if (updates.archived) {
    updateData.archived_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("custom_checks")
    .update(updateData)
    .eq("id", checkId)
    .select()
    .single();

  if (error) {
    console.error("Error updating custom check:", error);
    throw new Error("Failed to update custom check");
  }

  return data;
}

/**
 * Delete (archive) a custom check
 */
export async function archiveCustomCheck(checkId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("custom_checks")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", checkId);

  if (error) {
    console.error("Error archiving custom check:", error);
    throw new Error("Failed to archive custom check");
  }
}

/**
 * Permanently delete a custom check
 */
export async function deleteCustomCheck(checkId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("custom_checks")
    .delete()
    .eq("id", checkId);

  if (error) {
    console.error("Error deleting custom check:", error);
    throw new Error("Failed to delete custom check");
  }
}

/**
 * Clone a custom check (for the same or different organization)
 */
export async function cloneCustomCheck(
  originalCheckId: string,
  newOrganizationId: string,
  createdBy: string,
  overrides?: Partial<CreateCustomCheckInput>,
): Promise<CustomCheck> {
  const original = await getCustomCheckById(originalCheckId);
  if (!original) {
    throw new Error("Original check not found");
  }

  return createCustomCheck({
    organization_id: newOrganizationId,
    name: overrides?.name || `${original.name} (Copy)`,
    description: overrides?.description || original.description,
    compliance_domain:
      overrides?.compliance_domain || original.compliance_domain,
    frequency: overrides?.frequency || original.frequency,
    estimated_duration:
      overrides?.estimated_duration ?? original.estimated_duration,
    requires_qualification:
      overrides?.requires_qualification || original.requires_qualification,
    evidence_required:
      overrides?.evidence_required || original.evidence_required,
    checklist_items: overrides?.checklist_items || original.checklist_items,
    notes: overrides?.notes || original.notes,
    classification: overrides?.classification || original.classification,
    frequency_locked:
      overrides?.frequency_locked ?? original.frequency_locked,
    statutory_reference:
      overrides?.statutory_reference || original.statutory_reference,
    visibility: overrides?.visibility || "private",
    tags: overrides?.tags || original.tags,
    is_template: false,
    cloned_from: originalCheckId,
    created_by: createdBy,
  });
}

/**
 * Increment usage count for a template
 */
export async function incrementTemplateUsage(
  templateId: string,
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.rpc("increment_usage_count", {
    check_id: templateId,
  });

  if (error) {
    // If RPC doesn't exist, fall back to manual update
    const check = await getCustomCheckById(templateId);
    if (check) {
      await supabase
        .from("custom_checks")
        .update({ usage_count: (check.usage_count || 0) + 1 })
        .eq("id", templateId);
    }
  }
}

/**
 * Get public/organization templates (for template library)
 */
export async function getPublicTemplates(
  filters?: CustomCheckFilters,
  pagination?: PaginationOptions,
): Promise<PaginatedResponse<CustomCheck>> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("custom_checks")
    .select("*", { count: "exact" })
    .or("visibility.eq.public,is_template.eq.true")
    .is("archived_at", null)
    .order("usage_count", { ascending: false });

  // Apply filters
  if (filters?.domain) {
    query = query.eq("compliance_domain", filters.domain);
  }
  if (filters?.frequency) {
    query = query.eq("frequency", filters.frequency);
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
    );
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains("tags", filters.tags);
  }

  // Apply pagination
  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching public templates:", error);
    throw new Error("Failed to fetch public templates");
  }

  const totalPages = pagination
    ? Math.ceil((count || 0) / pagination.pageSize)
    : 1;

  return {
    data: data || [],
    total: count || 0,
    page: pagination?.page || 1,
    pageSize: pagination?.pageSize || data?.length || 0,
    totalPages,
  };
}
