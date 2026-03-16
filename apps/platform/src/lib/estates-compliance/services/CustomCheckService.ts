/**
 * Custom Check Service
 *
 * Business logic layer for managing custom compliance checks.
 */

import {
  getCustomChecks,
  getCustomCheckById,
  createCustomCheck,
  updateCustomCheck,
  archiveCustomCheck,
  deleteCustomCheck,
  cloneCustomCheck,
  incrementTemplateUsage,
  getPublicTemplates,
  type CreateCustomCheckInput,
  type UpdateCustomCheckInput,
  type CustomCheckFilters,
  type CustomCheck,
  type PaginatedResponse,
} from "../database/custom-checks";
import { COMMON_TEMPLATES } from "../check-templates";
import type { ComplianceDomain } from "../statutory-checks";

export type {
  CustomCheck,
  CreateCustomCheckInput,
  UpdateCustomCheckInput,
  CustomCheckFilters,
};

/**
 * Service class for managing custom checks
 */
export class CustomCheckService {
  /**
   * List custom checks with optional filters and pagination
   */
  static async list(
    organizationId: string,
    filters?: CustomCheckFilters,
    pagination?: { page: number; pageSize: number },
  ): Promise<PaginatedResponse<CustomCheck>> {
    return getCustomChecks(organizationId, filters, pagination);
  }

  /**
   * Get a single custom check by ID
   */
  static async getById(checkId: string): Promise<CustomCheck | null> {
    return getCustomCheckById(checkId);
  }

  /**
   * Create a new custom check
   */
  static async create(
    organizationId: string,
    userId: string,
    input: Omit<CreateCustomCheckInput, "organization_id" | "created_by">,
  ): Promise<CustomCheck> {
    return createCustomCheck({
      ...input,
      organization_id: organizationId,
      created_by: userId,
    });
  }

  /**
   * Update an existing custom check
   */
  static async update(
    checkId: string,
    updates: UpdateCustomCheckInput,
  ): Promise<CustomCheck> {
    return updateCustomCheck(checkId, updates);
  }

  /**
   * Archive a custom check (soft delete)
   */
  static async archive(checkId: string): Promise<void> {
    return archiveCustomCheck(checkId);
  }

  /**
   * Permanently delete a custom check
   */
  static async delete(checkId: string): Promise<void> {
    return deleteCustomCheck(checkId);
  }

  /**
   * Clone a custom check
   */
  static async clone(
    originalCheckId: string,
    organizationId: string,
    userId: string,
    overrides?: Partial<CreateCustomCheckInput>,
  ): Promise<CustomCheck> {
    const cloned = await cloneCustomCheck(
      originalCheckId,
      organizationId,
      userId,
      overrides,
    );

    // Increment usage count if the original is a template
    await incrementTemplateUsage(originalCheckId);

    return cloned;
  }

  /**
   * Clone from a built-in template
   */
  static async cloneFromTemplate(
    templateId: string,
    organizationId: string,
    userId: string,
    overrides?: Partial<CreateCustomCheckInput>,
  ): Promise<CustomCheck> {
    const template = COMMON_TEMPLATES.find((t) => t.id === templateId);

    if (!template) {
      throw new Error("Template not found");
    }

    return createCustomCheck({
      organization_id: organizationId,
      name: overrides?.name || template.name,
      description: overrides?.description || template.description,
      compliance_domain:
        overrides?.compliance_domain || template.compliance_domain,
      frequency: (overrides?.frequency || template.frequency) as any,
      estimated_duration:
        overrides?.estimated_duration ?? template.estimated_duration,
      requires_qualification:
        overrides?.requires_qualification || template.requires_qualification,
      evidence_required:
        overrides?.evidence_required || template.evidence_required,
      checklist_items: overrides?.checklist_items || template.checklist_items,
      notes: overrides?.notes || template.notes,
      visibility: overrides?.visibility || "private",
      tags: overrides?.tags || template.tags,
      is_template: false,
      template_parent_id: template.id,
      created_by: userId,
    });
  }

  /**
   * Get public templates (built-in + user-created)
   */
  static async getTemplates(
    filters?: CustomCheckFilters,
    pagination?: { page: number; pageSize: number },
  ): Promise<{
    builtIn: typeof COMMON_TEMPLATES;
    custom: PaginatedResponse<CustomCheck>;
  }> {
    const customTemplates = await getPublicTemplates(filters, pagination);

    // Filter built-in templates based on filters
    let builtIn = COMMON_TEMPLATES;

    if (filters?.domain) {
      builtIn = builtIn.filter((t) => t.compliance_domain === filters.domain);
    }
    if (filters?.frequency) {
      builtIn = builtIn.filter((t) => t.frequency === filters.frequency);
    }
    if (filters?.search) {
      const query = filters.search.toLowerCase();
      builtIn = builtIn.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }
    if (filters?.tags && filters.tags.length > 0) {
      builtIn = builtIn.filter((t) =>
        filters.tags!.some((tag) => t.tags.includes(tag)),
      );
    }

    // Sort by usage count
    builtIn = [...builtIn].sort(
      (a, b) => (b.usage_count || 0) - (a.usage_count || 0),
    );

    return { builtIn, custom: customTemplates };
  }

  /**
   * Save a custom check as a template
   */
  static async saveAsTemplate(
    checkId: string,
    name?: string,
  ): Promise<CustomCheck> {
    const existing = await getCustomCheckById(checkId);
    if (!existing) {
      throw new Error("Custom check not found");
    }

    return createCustomCheck({
      organization_id: existing.organization_id,
      name: name || `${existing.name} (Template)`,
      description: existing.description,
      compliance_domain: existing.compliance_domain,
      frequency: existing.frequency,
      estimated_duration: existing.estimated_duration,
      requires_qualification: existing.requires_qualification,
      evidence_required: existing.evidence_required,
      checklist_items: existing.checklist_items,
      notes: existing.notes,
      visibility:
        existing.visibility === "private"
          ? "organization"
          : existing.visibility,
      tags: [...existing.tags, "template"],
      is_template: true,
      template_parent_id: existing.template_parent_id,
      created_by: existing.created_by,
    });
  }

  /**
   * Get custom checks by domain
   */
  static async getByDomain(
    organizationId: string,
    domain: ComplianceDomain,
    pagination?: { page: number; pageSize: number },
  ): Promise<PaginatedResponse<CustomCheck>> {
    return getCustomChecks(organizationId, { domain }, pagination);
  }

  /**
   * Search custom checks
   */
  static async search(
    organizationId: string,
    query: string,
    pagination?: { page: number; pageSize: number },
  ): Promise<PaginatedResponse<CustomCheck>> {
    return getCustomChecks(organizationId, { search: query }, pagination);
  }

  /**
   * Get statistics for an organization's custom checks
   */
  static async getStats(organizationId: string): Promise<{
    total: number;
    templates: number;
    byDomain: Record<string, number>;
    byFrequency: Record<string, number>;
  }> {
    const allChecks = await getCustomChecks(
      organizationId,
      {},
      { page: 1, pageSize: 1000 },
    );

    const templates = allChecks.data.filter((c) => c.is_template).length;

    const byDomain: Record<string, number> = {};
    const byFrequency: Record<string, number> = {};

    allChecks.data.forEach((check) => {
      // Count by domain
      byDomain[check.compliance_domain] =
        (byDomain[check.compliance_domain] || 0) + 1;

      // Count by frequency
      byFrequency[check.frequency] = (byFrequency[check.frequency] || 0) + 1;
    });

    return {
      total: allChecks.total,
      templates,
      byDomain,
      byFrequency,
    };
  }
}
