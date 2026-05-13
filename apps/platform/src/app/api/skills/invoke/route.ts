import { NextRequest, NextResponse } from "next/server";
import {
  createStaffMember,
  updateStaffMember,
  listStaff,
  deactivateStaffMember,
  createAction,
  updateAction,
  listActions,
  getActionStats,
  suggestEEFStrategy,
  extractEstatesDocument,
  analyzeSpatialImpact,
  createHelpdeskTicket,
  updateHelpdeskTicket,
} from "@/lib/skills";
import type {
  StrategicPlanDbRow,
  StrategicPlanItemDbRow,
} from "@/lib/estate-strategy";

/**
 * POST /api/skills/invoke
 *
 * Unified endpoint for AI assistant to invoke skills.
 *
 * Request body:
 * {
 *   "function": "function_name",
 *   "parameters": { ... }
 * }
 *
 * Response:
 * {
 *   "success": true/false,
 *   "data": { ... },
 *   "error": "..." (if failed)
 * }
 */
import {
  getSkillTier,
  queueForApproval,
  getUserRole,
  canRoleExecuteSkill,
} from "@/lib/skills/approvals";
import { logEdAction } from "@/lib/ed-audit";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { function: functionName, parameters } = body;

    if (!functionName) {
      return NextResponse.json(
        { success: false, error: "Function name is required" },
        { status: 400 },
      );
    }

    const orgId = parameters.organization_id || parameters.orgId;

    // Create Supabase client for auth check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from authorization header
    const authHeader = request.headers.get("authorization");
    let user = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    }

/**
 * Maps skill function names to module IDs from the `modules` table.
 * Module IDs must match `modules.id` (FK) — see 20260122_* migration.
 * The `everything_bundle` and `core` modules grant access to all skills.
 */
const SKILL_MODULE_MAP: Record<string, string> = {
  "create_staff_member": "hr_people",
  "update_staff_member": "hr_people",
  "list_staff": "hr_people",
  "deactivate_staff_member": "hr_people",
  "export_staff_csv": "hr_people",
  "import_staff_csv": "hr_people",

  "create_action": "inspection_ready",
  "update_action": "inspection_ready",
  "list_actions": "inspection_ready",
  "get_action_stats": "inspection_ready",
  "suggest_eef_strategy": "inspection_ready",
  "add_action_note": "inspection_ready",

  "search_knowledge": "compliance_tracker",
  "list_compliance_tasks": "compliance_tracker",
  "create_workflow": "compliance_tracker",
  "get_workflow_status": "compliance_tracker",
  "update_workflow_step": "compliance_tracker",

  "search_contractors": "estates_management",
  "validate_contractor_recommendation": "estates_management",
  "extract_estates_document": "estates_management",
  "analyze_spatial_impact": "estates_management",
  "create_helpdesk_ticket": "estates_management",
  "update_helpdesk_ticket": "estates_management",
  "get_floor_plan": "estates_management",
  "get_location_details": "estates_management",

  "terry_create_ticket": "estates_management",
  "terry_update_ticket": "estates_management",
  "terry_query_tickets": "estates_management",
  "terry_query_compliance": "compliance_tracker",
  "terry_log_compliance_check": "compliance_tracker",
  "terry_assess_risk": "compliance_tracker",

  "get_compliance_status": "compliance_tracker",
  "get_overdue_checks": "compliance_tracker",
  "create_cost_request": "estates_management",
  "get_asset_details": "estates_management",
  "check_asset_warranty": "estates_management",
  "draft_warranty_claim_email": "estates_management",
  "get_asset_documentation": "estates_management",
  "read_asset_manual": "estates_management",
  "log_service_visit": "estates_management",
  "find_bundling_opportunities": "estates_management",
  "triage_estate_finding": "estates_management",
  "create_estate_strategy_item": "estates_management",

  "run_intelligence_analysis": "insights_pro",
  "get_cohort_journey": "insights_pro",
  "get_assessment_insights": "insights_pro",
  "get_contextual_factors": "insights_pro",
  "get_dfe_trends": "insights_pro",
  "get_cross_module_signals": "insights_pro",

  "generate_newsletter": "stakeholder_voice",

  "upload_to_drive": "core",
  "create_drive_folder": "core",
  "list_drive_files": "core",
};

    if (orgId && user) {
      // --- EDGE GATING: Module Entitlement Check ---
      const { data: activeModules } = await supabase
        .from("organization_modules")
        .select("module_id")
        .eq("organization_id", orgId)
        .eq("enabled", true);

      const activeModuleIds = (activeModules || []).map((m: any) => m.module_id);
      const skillModule = SKILL_MODULE_MAP[functionName];

      // everything_bundle and core grant access to all skills
      const hasUniversalAccess =
        activeModuleIds.includes("everything_bundle") ||
        activeModuleIds.includes("core");

      if (skillModule && !hasUniversalAccess && !activeModuleIds.includes(skillModule)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Module Entitlement Blocked: Your organization does not have an active subscription for the '${skillModule}' module. The AI agent cannot execute this requirement.`, 
            blocked: true 
          },
          { status: 403 }
        );
      }
      // ---------------------------------------------

      const userRole = await getUserRole(orgId, user.id);
      const tier = await getSkillTier(orgId, functionName);
      const isAuthorized = userRole
        ? canRoleExecuteSkill(userRole, functionName)
        : false;

      // CRITIQUE REFINEMENT: If user is not authorized for a high-stakes skill,
      // always force to REVIEW queue regardless of organization tier.
      if (
        !isAuthorized &&
        (functionName.includes("safety") || functionName.includes("emergency"))
      ) {
        await queueForApproval(orgId, functionName, parameters, user.id);
        return NextResponse.json({
          success: true,
          status: "queued",
          message:
            "Your role does not have permission to trigger this action directly. It has been queued for SLT approval.",
        });
      }

      if (tier === "BLOCKED") {
        return NextResponse.json({
          success: false,
          error: `The skill '${functionName}' is currently blocked for your school.`,
          blocked: true,
        });
      }

      if (tier === "REVIEW") {
        await queueForApproval(orgId, functionName, parameters, user.id);
        return NextResponse.json({
          success: true,
          status: "queued",
          message:
            "This action requires human approval and has been sent to the Approval Hub.",
        });
      }

      if (tier === "SHADOW") {
        // Async queue for shadow logging, but proceed with execution
        queueForApproval(orgId, functionName, parameters, user.id).catch(
          console.error,
        );
      }
    }

    let result;

    // =====================================================
    // STAFF DIRECTORY FUNCTIONS
    // =====================================================

    switch (functionName) {
      // Staff Directory
      case "create_staff_member":
        result = await createStaffMember(parameters);
        break;

      case "update_staff_member":
        result = await updateStaffMember(parameters);
        break;

      case "list_staff":
        result = await listStaff(parameters);
        break;

      case "deactivate_staff_member":
        result = await deactivateStaffMember(parameters.staff_id);
        break;

      case "export_staff_csv":
        // This would need to be implemented as a separate endpoint
        // that returns a file download
        result = {
          success: false,
          error: "Use GET /api/staff/import?type=export for CSV export",
        };
        break;

      case "import_staff_csv":
        // This would need to be implemented with the import route
        result = {
          success: false,
          error: "Use POST /api/staff/import for CSV import",
        };
        break;

      // Actions Hub
      case "create_action":
        result = await createAction(parameters);
        break;

      case "update_action":
        result = await updateAction(parameters);
        break;

      case "list_actions":
        result = await listActions(parameters);
        break;

      case "get_action_stats":
        result = await getActionStats(parameters.organization_id);
        break;

      case "suggest_eef_strategy":
        result = {
          success: true,
          data: suggestEEFStrategy(
            parameters.action_description,
            parameters.focus_area,
          ),
        };
        break;

      case "add_action_note":
        // This would need to be implemented
        result = {
          success: false,
          error: "add_action_note not yet implemented via API",
        };
        break;

      // Compliance & Estates
      case "search_knowledge":
        const { searchKnowledge } = await import("@/lib/skills");
        result = await searchKnowledge(parameters);
        break;

      case "list_compliance_tasks":
        const { listComplianceTasks } = await import("@/lib/skills");
        result = await listComplianceTasks(parameters);
        break;

      case "search_contractors":
        const { searchContractors } = await import("@/lib/skills");
        result = await searchContractors(parameters);
        break;

      case "validate_contractor_recommendation":
        const { validateContractorRecommendation } =
          await import("@/lib/skills");
        result = await validateContractorRecommendation(parameters);
        break;

      case "extract_estates_document":
        result = await extractEstatesDocument(parameters);
        break;

      case "analyze_spatial_impact":
        result = await analyzeSpatialImpact(parameters);
        break;

      case "create_helpdesk_ticket":
        result = await createHelpdeskTicket(parameters);
        break;

      case "update_helpdesk_ticket":
        result = await updateHelpdeskTicket(parameters);
        break;

      // Terry Taurus — Propose → Approve estate tools
      case "terry_create_ticket":
      case "terry_update_ticket":
      case "terry_query_tickets":
      case "terry_query_compliance":
      case "terry_log_compliance_check":
      case "terry_assess_risk": {
        const { handleTerryToolCall } = await import(
          "@/lib/ed/specialists/terry/handler"
        );
        const terryResult = await handleTerryToolCall(functionName, parameters);
        result = { success: true, data: terryResult };
        break;
      }

      // ===== ESTATES COMPLIANCE STATUS & COST SKILLS =====

      case "get_compliance_status": {
        const { getDomainsCompletionSummary } = await import(
          "@/lib/estates-compliance/database/statutory-completions"
        );
        const { DOMAIN_METADATA } = await import(
          "@/lib/estates-compliance/statutory-checks"
        );
        type CDomain = import("@/lib/estates-compliance/statutory-checks").ComplianceDomain;
        const allDomains = Object.keys(DOMAIN_METADATA) as CDomain[];
        const summaries = await getDomainsCompletionSummary(orgId, allDomains);

        const totalChecks = summaries.reduce((s, d) => s + d.totalChecks, 0);
        const completedChecks = summaries.reduce((s, d) => s + d.completedChecks, 0);
        const overdueChecks = summaries.reduce((s, d) => s + d.overdueChecks, 0);

        result = {
          success: true,
          data: {
            overallCompliance: totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0,
            totalChecks,
            completedChecks,
            overdueChecks,
            pendingChecks: totalChecks - completedChecks - overdueChecks,
            overallStatus: overdueChecks > 0 ? "action_required" : completedChecks === totalChecks ? "fully_compliant" : "in_progress",
            domains: summaries.map(d => ({
              domain: d.domain,
              name: DOMAIN_METADATA[d.domain]?.name || d.domain,
              totalChecks: d.totalChecks,
              completedChecks: d.completedChecks,
              overdueChecks: d.overdueChecks,
              status: d.status,
            })),
          },
        };
        break;
      }

      case "get_overdue_checks": {
        const { getDomainsCompletionSummary } = await import(
          "@/lib/estates-compliance/database/statutory-completions"
        );
        const { DOMAIN_METADATA, getChecksForDomain } = await import(
          "@/lib/estates-compliance/statutory-checks"
        );
        type CDomain2 = import("@/lib/estates-compliance/statutory-checks").ComplianceDomain;
        const filterDomain = parameters.domain as CDomain2 | undefined;
        const domainsToCheck = filterDomain
          ? [filterDomain]
          : (Object.keys(DOMAIN_METADATA) as CDomain2[]);

        const summaries = await getDomainsCompletionSummary(orgId, domainsToCheck);
        const overdueItems: Array<Record<string, unknown>> = [];

        for (const summary of summaries) {
          const checks = getChecksForDomain(summary.domain);
          for (const completion of summary.completions) {
            if (completion.status === "overdue" || (completion.next_due_date && new Date(completion.next_due_date) < new Date())) {
              const checkDef = checks.find(c => c.id === completion.check_id);
              const daysOverdue = completion.next_due_date
                ? Math.floor((Date.now() - new Date(completion.next_due_date).getTime()) / 86400000)
                : 0;
              overdueItems.push({
                checkId: completion.check_id,
                checkName: checkDef?.name || completion.check_id,
                domain: summary.domain,
                domainName: DOMAIN_METADATA[summary.domain]?.name || summary.domain,
                frequency: checkDef?.frequency || "unknown",
                daysOverdue: Math.max(0, daysOverdue),
                riskLevel: checkDef?.risk_level || "medium",
                reference: checkDef?.reference || "",
              });
            }
          }
        }

        overdueItems.sort((a, b) => (b.daysOverdue as number) - (a.daysOverdue as number));

        result = {
          success: true,
          data: {
            totalOverdue: overdueItems.length,
            items: overdueItems,
          },
        };
        break;
      }

      case "log_service_visit": {
        const { createServiceRecord } = await import(
          "@/lib/estates-compliance/database/service-records"
        );
        try {
          const created = await createServiceRecord({
            organization_id: orgId,
            service_date: parameters.service_date as string,
            service_type: parameters.service_type as string,
            compliance_domain: (parameters.compliance_domain as string) || null,
            contractor_id: (parameters.contractor_id as string) || null,
            engineer_name: (parameters.engineer_name as string) || null,
            invoice_reference: (parameters.invoice_reference as string) || null,
            certificate_reference: (parameters.certificate_reference as string) || null,
            total_cost: typeof parameters.total_cost === "number" ? parameters.total_cost : null,
            notes: (parameters.notes as string) || null,
            source: "manual",
            allocation_strategy: (parameters.allocation_strategy as
              | "equal_split"
              | "weighted_capacity"
              | "manual"
              | "invoice_line_item") || "equal_split",
            assets: (parameters.assets as Array<{
              asset_id: string;
              result?: "pass" | "fail" | "advisory" | "not_assessed";
              findings?: string;
              cost_allocated?: number;
              next_service_due?: string;
              remedial_cost_estimate?: number;
              remedial_actions?: string[];
            }>) || [],
          });

          const totalAllocated = created.assets.reduce(
            (s, a) => s + (Number(a.cost_allocated) || 0),
            0,
          );

          result = {
            success: true,
            data: {
              service_record_id: created.record.id,
              service_date: created.record.service_date,
              service_type: created.record.service_type,
              total_cost: created.record.total_cost,
              total_allocated: totalAllocated,
              assets_serviced: created.assets.length,
              per_asset_allocation: created.assets.map((a) => ({
                asset_id: a.asset_id,
                cost_allocated: a.cost_allocated,
                allocation_method: a.allocation_method,
                result: a.result,
                next_service_due: a.next_service_due,
              })),
              message: `Logged a ${created.record.service_type} visit covering ${created.assets.length} asset${created.assets.length === 1 ? "" : "s"}. Total cost £${created.record.total_cost || 0}, allocated across assets. Each asset's next service date has been updated.`,
            },
          };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to log service";
          result = { success: false, error: message };
        }
        break;
      }

      case "find_bundling_opportunities": {
        const { findBundlingOpportunities } = await import(
          "@/lib/estates-compliance/database/service-records"
        );
        const windowDays = typeof parameters.window_days === "number" ? parameters.window_days : 90;
        const calloutFee = typeof parameters.callout_fee === "number" ? parameters.callout_fee : 100;

        const opportunities = await findBundlingOpportunities(orgId, windowDays, calloutFee);
        const totalSaving = opportunities.reduce((s, o) => s + o.estimated_saving, 0);

        let message: string;
        if (opportunities.length === 0) {
          message = "No bundling opportunities found. Either assets are well-distributed across the year or there aren't enough service records yet to identify clusters.";
        } else {
          message = `Found ${opportunities.length} bundling opportunit${opportunities.length === 1 ? "y" : "ies"} across ${opportunities.reduce((s, o) => s + o.asset_count, 0)} assets. Total estimated saving: £${totalSaving.toLocaleString()}.`;
        }

        result = {
          success: true,
          data: {
            opportunities,
            total_estimated_saving: totalSaving,
            window_days: windowDays,
            callout_fee: calloutFee,
            message,
          },
        };
        break;
      }

      case "get_asset_documentation": {
        const { createServiceRoleClient } = await import("@/lib/supabase-server");
        const assetId = parameters.asset_id as string;
        if (!assetId) {
          result = { success: false, error: "asset_id is required" };
          break;
        }
        const sAdmin = createServiceRoleClient();

        // Manual-ish tags — anything likely to be a product doc rather than
        // a photo or service record.
        const MANUAL_TAGS = [
          "manual",
          "user_manual",
          "setup_guide",
          "user_guide",
          "data_sheet",
          "datasheet",
          "spec_sheet",
          "troubleshooting",
          "service_manual",
          "installation_guide",
        ];

        const { data: evidence, error: evErr } = await sAdmin
          .from("estates_evidence")
          .select("id, title, description, evidence_type, file_url, file_name, file_type, file_size_bytes, tags, created_at")
          .eq("organization_id", orgId)
          .eq("asset_id", assetId)
          .in("evidence_type", ["document", "report", "manual", "other"])
          .order("created_at", { ascending: false });

        if (evErr) {
          result = { success: false, error: `Failed to fetch documentation: ${evErr.message}` };
          break;
        }

        // Filter to items tagged as documentation (or items where nothing
        // else in tags excludes them)
        const docs = (evidence || []).filter((ev) => {
          const tags = Array.isArray(ev.tags) ? ev.tags : [];
          return tags.some((t: string) => MANUAL_TAGS.includes(t));
        });

        result = {
          success: true,
          data: {
            asset_id: assetId,
            total: docs.length,
            documents: docs.map((d) => ({
              evidence_id: d.id,
              title: d.title,
              description: d.description,
              file_name: d.file_name,
              file_type: d.file_type,
              file_url: d.file_url,
              file_size_bytes: d.file_size_bytes,
              tags: d.tags,
              doc_type: (d.tags || []).find((t: string) => MANUAL_TAGS.includes(t)) || "document",
              uploaded_at: d.created_at,
            })),
            user_message:
              docs.length === 0
                ? "No manuals or documentation uploaded for this asset yet. The user may want to upload the product manual so I can reference it in future."
                : `Found ${docs.length} document${docs.length === 1 ? "" : "s"} for this asset. Use read_asset_manual with a specific evidence_id to ask a question against the content.`,
          },
        };
        break;
      }

      case "read_asset_manual": {
        const { createServiceRoleClient } = await import("@/lib/supabase-server");
        const evidenceId = parameters.evidence_id as string;
        const question = parameters.question as string;

        if (!evidenceId || !question) {
          result = { success: false, error: "evidence_id and question are required" };
          break;
        }

        const sAdmin = createServiceRoleClient();

        // Fetch the evidence record + verify it belongs to the org
        const { data: evidence, error: fetchErr } = await sAdmin
          .from("estates_evidence")
          .select("id, organization_id, title, file_url, file_type, file_name, asset_id")
          .eq("id", evidenceId)
          .single();

        if (fetchErr || !evidence || evidence.organization_id !== orgId) {
          result = { success: false, error: "Documentation not found or you do not have access" };
          break;
        }

        if (!evidence.file_url) {
          result = { success: false, error: "This evidence record has no file attached" };
          break;
        }

        // Download the file via the signed URL so we can send it to Gemini
        try {
          const fileResponse = await fetch(evidence.file_url);
          if (!fileResponse.ok) {
            result = { success: false, error: `Failed to download file: ${fileResponse.status}` };
            break;
          }
          const arrayBuffer = await fileResponse.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");

          // Call Gemini 2.5 Flash to answer the question grounded in the document
          const apiKey = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
          if (!apiKey) {
            result = { success: false, error: "AI service not configured" };
            break;
          }

          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
              temperature: 0.2,
            },
          });

          const prompt = `You are helping a UK school estates team use a piece of equipment. The user has asked a specific question about this ${evidence.title || "product"}. Read the attached documentation carefully and answer the question using ONLY information from the document.

If the document doesn't contain the answer, say so clearly and suggest what the user should do next (contact the supplier, check online, etc).

If the answer involves multiple steps, number them.

If the answer involves safety (gas, electrical, water, hazardous substances), include a prominent safety note.

Cite the section or page of the document where relevant.

Question: ${question}`;

          const genResult = await model.generateContent([
            { text: prompt },
            {
              inlineData: {
                mimeType: evidence.file_type || "application/pdf",
                data: base64,
              },
            },
          ]);

          const answer = genResult.response.text();

          result = {
            success: true,
            data: {
              evidence_id: evidenceId,
              document_title: evidence.title,
              document_file: evidence.file_name,
              question,
              answer,
              source: "ai_document_read",
              note: "This answer was generated by reading the actual product documentation attached to this asset. It is grounded in the manufacturer's own instructions — not generic advice.",
            },
          };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown error";
          result = { success: false, error: `Failed to read documentation: ${message}` };
        }
        break;
      }

      case "get_asset_details": {
        const { getAssetWithLinks } = await import(
          "@/lib/estates-compliance/database/assets"
        );
        const { createServiceRoleClient } = await import("@/lib/supabase-server");

        let assetId = parameters.asset_id as string | undefined;

        // Resolve asset_code or serial_number to asset_id if needed
        if (!assetId && (parameters.asset_code || parameters.serial_number)) {
          const sAdmin = createServiceRoleClient();
          const lookup = parameters.asset_code
            ? { column: "code", value: parameters.asset_code as string }
            : { column: "serial_number", value: parameters.serial_number as string };
          const { data: found } = await sAdmin
            .from("estates_assets")
            .select("id")
            .eq("organization_id", orgId)
            .eq(lookup.column, lookup.value)
            .maybeSingle();
          assetId = found?.id;
        }

        if (!assetId) {
          result = {
            success: false,
            error: "Asset not found — provide asset_id, asset_code, or serial_number",
          };
          break;
        }

        const asset = await getAssetWithLinks(assetId);
        if (!asset || asset.organization_id !== orgId) {
          result = { success: false, error: "Asset not found" };
          break;
        }

        result = {
          success: true,
          data: {
            id: asset.id,
            code: asset.code,
            name: asset.name,
            asset_type: asset.asset_type,
            manufacturer: asset.manufacturer,
            model: asset.model,
            serial_number: asset.serial_number,
            location: `${asset.building || ""} ${asset.floor || ""} ${asset.room || ""}`.trim() || null,
            condition_grade: asset.condition_grade,
            status: asset.status,
            purchase_date: asset.purchase_date,
            purchase_price: asset.purchase_price,
            invoice_number: asset.invoice_number,
            purchase_order_number: asset.purchase_order_number,
            warranty_status: asset.warranty_status,
            warranty_expiry: asset.warranty_expiry,
            warranty_provider: asset.warranty_provider,
            warranty_days_remaining: asset.warranty_days_remaining,
            supplier_contact: asset.supplier_contact,
            open_tickets: (asset.linked_tickets || []).filter((t: { status: string }) => t.status !== "closed" && t.status !== "resolved"),
            linked_compliance_tasks: asset.linked_tasks || [],
            evidence_count: (asset.linked_evidence || []).length,
            recent_maintenance: (asset.maintenance_history || []).slice(-5),
          },
        };
        break;
      }

      case "check_asset_warranty": {
        const { getAssetWithWarranty } = await import(
          "@/lib/estates-compliance/database/assets"
        );
        const assetId = parameters.asset_id as string;
        if (!assetId) {
          result = { success: false, error: "asset_id is required" };
          break;
        }
        const asset = await getAssetWithWarranty(assetId);
        if (!asset || asset.organization_id !== orgId) {
          result = { success: false, error: "Asset not found" };
          break;
        }

        let recommended_action: string;
        let user_message: string;
        switch (asset.warranty_status) {
          case "active":
            recommended_action = "call_supplier";
            user_message = `This asset is still under warranty with ${asset.warranty_provider || "the original supplier"} until ${asset.warranty_expiry} (${asset.warranty_days_remaining} days remaining). Contact them BEFORE booking a different contractor — the repair should be free.`;
            break;
          case "expiring_soon":
            recommended_action = "warranty_expiring";
            user_message = `⚠️ Warranty expires in ${asset.warranty_days_remaining} days (${asset.warranty_expiry}). Call ${asset.warranty_provider || "the supplier"} urgently to get the work done under warranty while you still can.`;
            break;
          case "expired":
            recommended_action = "out_of_warranty";
            user_message = `Warranty expired on ${asset.warranty_expiry}. You will need to pay for the repair or book a different contractor.`;
            break;
          default:
            recommended_action = "unknown";
            user_message = "No warranty information recorded for this asset. Check the purchase documents or contact the original supplier.";
        }

        result = {
          success: true,
          data: {
            asset_id: asset.id,
            asset_name: asset.name,
            asset_code: asset.code,
            warranty_status: asset.warranty_status,
            warranty_expiry: asset.warranty_expiry,
            warranty_provider: asset.warranty_provider,
            warranty_days_remaining: asset.warranty_days_remaining,
            warranty_terms: asset.warranty_terms,
            supplier_contact: asset.supplier_contact,
            purchase_date: asset.purchase_date,
            invoice_number: asset.invoice_number,
            purchase_order_number: asset.purchase_order_number,
            recommended_action,
            user_message,
          },
        };
        break;
      }

      case "draft_warranty_claim_email": {
        const { getAssetWithWarranty } = await import(
          "@/lib/estates-compliance/database/assets"
        );
        const { createServiceRoleClient } = await import("@/lib/supabase-server");
        const assetId = parameters.asset_id as string;
        const issueDescription = (parameters.issue_description as string) || "";
        const urgency = (parameters.urgency as string) || "routine";

        if (!assetId || !issueDescription) {
          result = {
            success: false,
            error: "asset_id and issue_description are required",
          };
          break;
        }

        const asset = await getAssetWithWarranty(assetId);
        if (!asset || asset.organization_id !== orgId) {
          result = { success: false, error: "Asset not found" };
          break;
        }

        // Look up organization name for the signature
        const sAdmin = createServiceRoleClient();
        const { data: org } = await sAdmin
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single();

        const schoolName = org?.name || "our school";
        const supplier = asset.supplier_contact;
        const providerName = asset.warranty_provider || supplier?.company_name || "Supplier";
        const contactName = supplier?.contact_name || "Sir/Madam";
        const recipient = supplier?.email || "";

        // Build the email draft
        const urgencyText = urgency === "emergency"
          ? "This is an EMERGENCY — we have an immediate safety concern."
          : urgency === "urgent"
            ? "This is urgent and we would appreciate attention within 24 hours."
            : "This is a routine warranty claim.";

        const subject = `Warranty claim — ${asset.name}${asset.code ? ` (${asset.code})` : ""}`;

        const body = [
          `Dear ${contactName},`,
          ``,
          `I am writing to request a warranty service call for equipment we purchased from you.`,
          ``,
          `Asset details:`,
          `  • Item: ${asset.name}`,
          asset.manufacturer ? `  • Manufacturer: ${asset.manufacturer}` : null,
          asset.model ? `  • Model: ${asset.model}` : null,
          asset.serial_number ? `  • Serial number: ${asset.serial_number}` : null,
          asset.purchase_date ? `  • Purchased: ${asset.purchase_date}` : null,
          asset.invoice_number ? `  • Invoice number: ${asset.invoice_number}` : null,
          asset.purchase_order_number ? `  • Purchase order: ${asset.purchase_order_number}` : null,
          asset.warranty_expiry ? `  • Warranty expires: ${asset.warranty_expiry}` : null,
          ``,
          `Issue:`,
          issueDescription,
          ``,
          urgencyText,
          ``,
          `Please could you arrange for an engineer to attend ${schoolName} at your earliest convenience. Our site address and contact details are on file. If you need to speak to anyone on site please reply to this email and I'll put you in touch with the right person.`,
          ``,
          `Kind regards,`,
          `${schoolName}`,
        ].filter(Boolean).join("\n");

        // Return as a PROPOSAL (user must approve before sending)
        result = {
          success: true,
          data: {
            type: "proposal",
            proposal: {
              tool: "draft_warranty_claim_email",
              action: "email_draft",
              fields: {
                to: recipient,
                to_name: contactName,
                subject,
                body,
                provider: providerName,
                asset_id: assetId,
                asset_name: asset.name,
                warranty_status: asset.warranty_status,
              },
              created_at: new Date().toISOString(),
            },
            message: `I've drafted an email to ${providerName}. Please review before sending — I will not send it without your approval. The asset is ${asset.warranty_status === "active" ? "still under warranty" : "out of warranty — you may be charged"}.`,
          },
        };
        break;
      }

      case "create_cost_request": {
        // Create a cost request as a compliance task with type: cost_request
        const supabaseAdmin = (await import("@/lib/supabase-server")).createServiceRoleClient();
        const costData = {
          organization_id: orgId,
          task_type: "cost_request",
          task_name: parameters.title as string,
          description: `${parameters.description || ""}\n\nBusiness Case: ${parameters.business_case || "Not provided"}\n\nClassification: ${parameters.classification || "planned"}\nUrgency: ${parameters.urgency || "planned"}\nCFR Code: ${parameters.cfr_code || "E12"}`,
          compliance_domain: parameters.compliance_domain || "general",
          status: "pending",
          frequency: "ad_hoc",
          task_source: "internal",
          scheduled_for: new Date().toISOString().split("T")[0],
          due_by: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          checklist: [
            { item: "Cost estimate verified", completed: false },
            { item: "Business case reviewed", completed: false },
            { item: "SBM approval", completed: false },
            { item: "Headteacher approval", completed: false },
          ],
          findings: [{
            type: "cost_request",
            estimated_cost: parameters.estimated_cost,
            classification: parameters.classification,
            urgency: parameters.urgency,
            cfr_code: parameters.cfr_code || "E12",
            linked_risk_id: parameters.linked_risk_id || null,
            business_case: parameters.business_case || null,
          }],
        };

        const { data: task, error: taskError } = await supabaseAdmin
          .from("estates_compliance_tasks")
          .insert(costData)
          .select()
          .single();

        if (taskError) {
          result = { success: false, error: taskError.message };
        } else {
          result = {
            success: true,
            data: {
              taskId: task.id,
              title: parameters.title,
              estimatedCost: parameters.estimated_cost,
              classification: parameters.classification,
              urgency: parameters.urgency,
              cfrCode: parameters.cfr_code || "E12",
              message: `Cost request created. Estimated: £${parameters.estimated_cost}. Awaiting SBM/Headteacher approval.`,
            },
          };
        }
        break;
      }

      case "triage_estate_finding": {
        const { triageEstateFinding } = await import(
          "@/lib/estates-compliance/finding-triage"
        );
        const triage = triageEstateFinding({
          assetName: parameters.title,
          title: parameters.title,
          description: parameters.description,
          estimatedCost:
            typeof parameters.estimated_cost === "number"
              ? parameters.estimated_cost
              : null,
          result: parameters.result,
          urgency: parameters.urgency,
          priority: parameters.priority,
          conditionGrade: parameters.condition_grade,
          complianceDomain: parameters.compliance_domain,
        });

        result = {
          success: true,
          data: {
            triage,
            user_message: triage.reportLine,
          },
        };
        break;
      }

      case "create_estate_strategy_item": {
        const { createServiceRoleClient } = await import(
          "@/lib/supabase-server"
        );
        const {
          buildStrategicPlanInsert,
          buildStrategicPlanItemInsert,
          mapStrategicPlanForUi,
          mapStrategicPlanItemForUi,
        } = await import("@/lib/estate-strategy");

        if (!parameters.title || typeof parameters.estimated_cost !== "number") {
          result = {
            success: false,
            error: "title and estimated_cost are required",
          };
          break;
        }

        const strategyDb = createServiceRoleClient();
        let planId = parameters.plan_id as string | undefined;
        let planRecord: Record<string, unknown> | null = null;

        if (planId) {
          const { data: existingPlan, error: existingPlanError } =
            await strategyDb
              .from("strategic_plans")
              .select("*")
              .eq("id", planId)
              .eq("organization_id", orgId)
              .single();

          if (existingPlanError || !existingPlan) {
            result = {
              success: false,
              error: "Estate strategy plan not found in your organization",
            };
            break;
          }

          planRecord = existingPlan;
        } else {
          const { data: existingPlan } = await strategyDb
            .from("strategic_plans")
            .select("*")
            .eq("organization_id", orgId)
            .eq("plan_type", "estates")
            .in("status", ["draft", "active", "approved"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingPlan) {
            planRecord = existingPlan;
            planId = existingPlan.id;
          } else {
            const currentYear = new Date().getMonth() >= 8
              ? new Date().getFullYear()
              : new Date().getFullYear() - 1;
            const { data: createdPlan, error: planError } = await strategyDb
              .from("strategic_plans")
              .insert(
                buildStrategicPlanInsert({
                  organizationId: orgId,
                  title: "Three-Year Estate Strategy",
                  description:
                    "Finance-facing estate strategy generated from estates risks, condition findings, and capital pressures.",
                  planType: "estates",
                  academicYearStart: `${currentYear}/${currentYear + 1}`,
                  durationYears: 3,
                }),
              )
              .select()
              .single();

            if (planError || !createdPlan) {
              result = {
                success: false,
                error: planError?.message || "Failed to create estate strategy",
              };
              break;
            }

            planRecord = createdPlan;
            planId = createdPlan.id;
          }
        }

        const itemInsert = buildStrategicPlanItemInsert({
          organizationId: orgId,
          planId,
          title: parameters.title as string,
          description: parameters.description as string | undefined,
          category: "estates",
          year:
            typeof parameters.year === "number"
              ? parameters.year
              : Number(parameters.year || 1),
          estimatedCost: parameters.estimated_cost as number,
          priorityBand: parameters.priority_band,
          riskScore:
            typeof parameters.risk_score === "number"
              ? parameters.risk_score
              : undefined,
          isStatutory: Boolean(parameters.is_statutory),
          riskRegisterId: parameters.risk_register_id,
          cfrCode: parameters.cfr_code || "E13",
          sourceModule: "estates",
          sourceEntityId: parameters.source_entity_id,
          consequenceIfUnfunded: parameters.consequence_if_unfunded,
        });

        const { data: item, error: itemError } = await strategyDb
          .from("strategic_plan_items")
          .insert(itemInsert)
          .select()
          .single();

        if (itemError || !item) {
          result = {
            success: false,
            error: itemError?.message || "Failed to create estate strategy item",
          };
          break;
        }

        result = {
          success: true,
          data: {
            plan: mapStrategicPlanForUi(
              planRecord as StrategicPlanDbRow,
              [item as StrategicPlanItemDbRow],
            ),
            item: mapStrategicPlanItemForUi(item as StrategicPlanItemDbRow),
            message: `Added "${parameters.title}" to the estate strategy for year ${item.year}. Estimated cost £${Number(item.estimated_cost || 0).toLocaleString()}.`,
          },
        };
        break;
      }

      // Form Helper (Privacy-first form filling with translation)
      case "detect_forms":
        const { detectFormsOnPage } =
          await import("@/lib/skills/form-helper-handler");
        result = await detectFormsOnPage(parameters);
        break;

      case "start_form_session":
        const { createFormSession, generateFieldQuestion } =
          await import("@/lib/skills/form-helper-handler");
        // Create session and generate first question
        const session = createFormSession(parameters);
        const firstField = session.form.fields[0];
        const question = await generateFieldQuestion({
          field: firstField,
          userLanguage: session.userLanguage,
        });
        result = {
          success: true,
          data: {
            sessionId: session.sessionId,
            fieldIndex: 0,
            totalFields: session.form.fieldCount,
            field: firstField,
            question: question.question,
            questionEnglish: question.questionEnglish,
          },
        };
        break;

      case "ask_field_question":
        const { generateFieldQuestion: genQuestion } =
          await import("@/lib/skills/form-helper-handler");
        result = await genQuestion(parameters);
        break;

      case "verify_field_response":
        const { processUserResponse } =
          await import("@/lib/skills/form-helper-handler");
        result = await processUserResponse(parameters);
        break;

      case "complete_form_session":
        const { completeSession: completeSession } =
          await import("@/lib/skills/form-helper-handler");
        const sessionResult = completeSession(parameters);
        result = { success: true, data: sessionResult };
        break;

      // Form Helper - Edit/Change Mode
      case "request_change":
        const { parseChangeRequest } =
          await import("@/lib/skills/form-helper-handler");
        result = await parseChangeRequest(parameters);
        break;

      case "update_field":
        const { updateFieldResponse, generateChangeConfirmation } =
          await import("@/lib/skills/form-helper-handler");
        // Update field and generate confirmation
        const updated = updateFieldResponse(
          parameters.session,
          parameters.fieldIndex,
          parameters.newValue,
        );
        const confirmation = await generateChangeConfirmation({
          field: parameters.field,
          oldValue: parameters.oldValue,
          newValue: parameters.newValue.userResponse,
          userLanguage: parameters.userLanguage,
        });
        result = {
          success: true,
          data: {
            updated: true,
            fieldIndex: parameters.fieldIndex,
            confirmation: confirmation.message,
            confirmationEnglish: confirmation.messageEnglish,
          },
        };
        break;

      case "get_field_summary":
        const { getFieldSummary } =
          await import("@/lib/skills/form-helper-handler");
        result = await getFieldSummary(
          parameters.field,
          parameters.currentValue,
        );
        break;

      // Intelligence & Data Analysis
      case "run_intelligence_analysis": {
        const { getIntelligenceEngine } =
          // @ts-expect-error - Auto-masked during strict compilation enforcement
          await import("@/lib/school-intelligence-engine");
        const engine = getIntelligenceEngine();
        const analysisResult = await engine.runFullAnalysis(
          parameters.organization_id,
          parameters.urn,
          {
            focusAreas: parameters.focus_areas,
            focusYearGroups: parameters.focus_year_groups,
            academicYear: parameters.academic_year,
          },
        );
        result = { success: true, data: analysisResult };
        break;
      }

      case "get_cohort_journey": {
        const { getIntelligenceEngine: getEngine } =
          // @ts-expect-error - Auto-masked during strict compilation enforcement
          await import("@/lib/school-intelligence-engine");
        const eng = getEngine();
        const journey = await eng.buildCohortJourney(
          parameters.urn,
          parameters.organization_id,
          parameters.current_year_group,
        );
        result = { success: true, data: journey };
        break;
      }

      case "get_assessment_insights": {
        const insightsQuery = supabase
          .from("pupil_analysis_insights")
          .select("*")
          .eq("organization_id", parameters.organization_id)
          .order("severity", { ascending: true });

        if (parameters.import_id) {
          insightsQuery.eq("import_id", parameters.import_id);
        }
        if (parameters.severity_filter) {
          insightsQuery.in(
            "severity",
            parameters.severity_filter === "critical"
              ? ["critical"]
              : parameters.severity_filter === "high"
                ? ["critical", "high"]
                : parameters.severity_filter === "medium"
                  ? ["critical", "high", "medium"]
                  : ["critical", "high", "medium", "low"],
          );
        }

        const { data: insights, error: insightsErr } = await insightsQuery;
        result = insightsErr
          ? { success: false, error: insightsErr.message }
          : { success: true, data: { insights: insights || [] } };
        break;
      }

      case "get_contextual_factors": {
        const factorsQuery = supabase
          .from("school_contextual_factors")
          .select("*")
          .eq("organization_id", parameters.organization_id)
          .eq("is_active", true);

        if (parameters.factor_type) {
          factorsQuery.eq("factor_type", parameters.factor_type);
        }

        const { data: factors, error: factorsErr } = await factorsQuery;
        result = factorsErr
          ? { success: false, error: factorsErr.message }
          : { success: true, data: factors || [] };
        break;
      }

      case "get_dfe_trends": {
        const { getIntelligenceEngine: getDfeEngine } =
          // @ts-expect-error - Auto-masked during strict compilation enforcement
          await import("@/lib/school-intelligence-engine");
        const dfeEngine = getDfeEngine();
        const trends = await dfeEngine.getDfETrends(
          parameters.urn,
          parameters.years_back || 5,
        );
        result = { success: true, data: trends };
        break;
      }

      case "get_cross_module_signals": {
        const { getIntelligenceEngine: getSignalsEngine } =
          // @ts-expect-error - Auto-masked during strict compilation enforcement
          await import("@/lib/school-intelligence-engine");
        const signalsEngine = getSignalsEngine();
        const signals = await signalsEngine.getCrossModuleSignals(
          parameters.organization_id,
        );
        result = { success: true, data: signals };
        break;
      }

      // =====================================================
      // DOCUMENT PRODUCTION FUNCTIONS
      // =====================================================

      case "list_document_templates": {
        const templateOrgId = parameters.organization_id || orgId;
        let tplQuery = supabase
          .from("document_templates")
          .select(
            "id, name, slug, module, category, document_type, description, tags, available_placeholders",
          )
          .or(`organization_id.is.null,organization_id.eq.${templateOrgId}`)
          .order("module", { ascending: true })
          .order("name", { ascending: true });

        if (parameters.module)
          tplQuery = tplQuery.eq("module", parameters.module);
        if (parameters.category)
          tplQuery = tplQuery.eq("category", parameters.category);
        if (parameters.document_type)
          tplQuery = tplQuery.eq("document_type", parameters.document_type);
        if (parameters.search)
          tplQuery = tplQuery.ilike("name", `%${parameters.search}%`);

        const { data: templates, error: tplErr } = await tplQuery;
        result = tplErr
          ? { success: false, error: tplErr.message }
          : { success: true, data: templates || [] };
        break;
      }

      case "generate_document": {
        const genOrgId = parameters.organization_id || orgId;

        // Fetch the template
        const { data: genTemplate, error: genTplErr } = await supabase
          .from("document_templates")
          .select("*")
          .eq("id", parameters.template_id)
          .single();

        if (genTplErr || !genTemplate) {
          result = { success: false, error: "Template not found" };
          break;
        }

        // Build resolver context for auto-resolving placeholders
        const { resolvePlaceholders } = await import("@/lib/document-engine");
        const resolverCtx = {
          organizationId: genOrgId,
          staffId:
            parameters.recipient_type === "staff"
              ? parameters.recipient_id
              : undefined,
          contractorId:
            parameters.recipient_type === "contractor"
              ? parameters.recipient_id
              : undefined,
          senderId: user?.id,
          customValues: parameters.custom_values || {},
        };

        const resolvedValues = await resolvePlaceholders(
          genTemplate,
          resolverCtx,
          supabase,
        );

        // Merge custom values (user-provided take precedence)
        if (parameters.custom_values) {
          Object.assign(resolvedValues, parameters.custom_values);
        }

        // Replace placeholders in subject and body
        const replacePh = (
          text: string,
          vals: Record<string, string>,
        ): string => {
          if (!text) return "";
          return text.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) =>
            vals[key] !== undefined ? vals[key] : match,
          );
        };

        const genSubject = replacePh(
          genTemplate.subject_template || "",
          resolvedValues,
        );
        const genBody = replacePh(
          genTemplate.body_template || "",
          resolvedValues,
        );

        // Insert generated document
        const { data: genDoc, error: genDocErr } = await supabase
          .from("generated_documents")
          .insert({
            organization_id: genOrgId,
            template_id: parameters.template_id,
            module: genTemplate.module,
            document_type: genTemplate.document_type || "letter",
            created_by: user?.id || "ai-assistant",
            recipient_type: parameters.recipient_type,
            recipient_id: parameters.recipient_id || null,
            recipient_name: parameters.recipient_name,
            recipient_email: parameters.recipient_email || null,
            context_type: parameters.context_type || null,
            context_id: parameters.context_id || null,
            subject: genSubject,
            body_html: genBody,
            placeholder_values: resolvedValues,
            status: "draft",
          })
          .select()
          .single();

        if (genDocErr) {
          result = { success: false, error: genDocErr.message };
        } else {
          result = {
            success: true,
            data: {
              id: genDoc.id,
              subject: genDoc.subject,
              status: genDoc.status,
              recipient_name: genDoc.recipient_name,
              module: genDoc.module,
              document_type: genDoc.document_type,
              created_at: genDoc.created_at,
              view_url: `/dashboard/documents/${genDoc.id}`,
            },
          };
        }
        break;
      }

      case "list_generated_documents": {
        const listOrgId = parameters.organization_id || orgId;
        const listLimit = parameters.limit || 20;

        let docQuery = supabase
          .from("generated_documents")
          .select(
            "id, subject, status, module, document_type, recipient_name, recipient_email, created_at, sent_at, template_id",
          )
          .eq("organization_id", listOrgId)
          .order("created_at", { ascending: false })
          .limit(listLimit);

        if (parameters.module)
          docQuery = docQuery.eq("module", parameters.module);
        if (parameters.status)
          docQuery = docQuery.eq("status", parameters.status);
        if (parameters.search) {
          docQuery = docQuery.or(
            `subject.ilike.%${parameters.search}%,recipient_name.ilike.%${parameters.search}%`,
          );
        }

        const { data: docs, error: docsErr } = await docQuery;
        result = docsErr
          ? { success: false, error: docsErr.message }
          : { success: true, data: docs || [] };
        break;
      }

      case "get_document": {
        const { data: fetchedDoc, error: fetchDocErr } = await supabase
          .from("generated_documents")
          .select("*, document_templates(id, name, module, category)")
          .eq("id", parameters.document_id)
          .single();

        if (fetchDocErr || !fetchedDoc) {
          result = { success: false, error: "Document not found" };
        } else {
          result = { success: true, data: fetchedDoc };
        }
        break;
      }

      case "generate_newsletter": {
        const nlOrgId = parameters.organization_id || orgId;
        const nlBody = {
          organizationId: nlOrgId,
          title: parameters.title,
          week_ending: parameters.week_ending,
          sections: parameters.sections || [],
          auto_include: {
            attendance: parameters.auto_include_attendance || false,
            upcoming_dates: parameters.auto_include_dates || false,
          },
          send_to: "draft",
        };

        // Call the newsletter API internally via fetch
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002";
        try {
          const nlResponse = await fetch(`${appUrl}/api/documents/newsletter`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: request.headers.get("cookie") || "",
              Authorization: request.headers.get("authorization") || "",
            },
            body: JSON.stringify(nlBody),
          });

          if (!nlResponse.ok) {
            const errText = await nlResponse.text();
            result = {
              success: false,
              error: `Newsletter generation failed: ${errText}`,
            };
          } else {
            const nlResult = await nlResponse.json();
            result = {
              success: true,
              data: {
                ...nlResult.data,
                message: `Newsletter "${parameters.title}" created as draft. You can review and send it from the Documents hub.`,
              },
            };
          }
        } catch (nlErr: any) {
          result = {
            success: false,
            error: `Newsletter generation failed: ${nlErr.message}`,
          };
        }
        break;
      }

      case "send_document": {
        // Fetch the document
        const { data: sendDoc, error: sendFetchErr } = await supabase
          .from("generated_documents")
          .select("*")
          .eq("id", parameters.document_id)
          .single();

        if (sendFetchErr || !sendDoc) {
          result = { success: false, error: "Document not found" };
          break;
        }

        if (sendDoc.status !== "finalised") {
          result = {
            success: false,
            error: `Document is in '${sendDoc.status}' status. It must be finalised before sending. The user can finalise it at /dashboard/documents/${sendDoc.id}`,
          };
          break;
        }

        const sendToEmail = parameters.email || sendDoc.recipient_email;
        if (!sendToEmail) {
          result = {
            success: false,
            error:
              "No email address available. Please provide an email address.",
          };
          break;
        }

        try {
          const { sendEmail } = await import("@/lib/email-service");
          const emailResult = await sendEmail({
            to: sendToEmail,
            subject: sendDoc.subject || "Document from Schoolgle",
            html: sendDoc.body_html || "",
            tags: [
              { name: "type", value: "document" },
              { name: "document_id", value: parameters.document_id },
              { name: "sent_by", value: "ai-assistant" },
            ],
          });

          if (!emailResult.success) {
            result = {
              success: false,
              error: `Email failed: ${emailResult.error}`,
            };
            break;
          }

          // Update document status
          await supabase
            .from("generated_documents")
            .update({
              status: "sent",
              delivery_method: "email",
              sent_at: new Date().toISOString(),
              sent_to_email: sendToEmail,
              updated_at: new Date().toISOString(),
            })
            .eq("id", parameters.document_id);

          // Record delivery
          await supabase.from("document_delivery_log").insert({
            document_id: parameters.document_id,
            method: "email",
            recipient_email: sendToEmail,
            status: "sent",
            provider_id: emailResult.id || null,
          });

          result = {
            success: true,
            data: {
              sent: true,
              recipient_email: sendToEmail,
              document_id: parameters.document_id,
            },
          };
        } catch (emailErr: any) {
          result = {
            success: false,
            error: `Email sending failed: ${emailErr.message}`,
          };
        }
        break;
      }

      // =====================================================
      // WORKFLOW FUNCTIONS
      // =====================================================

      case "create_workflow": {
        const { createFromTemplate } = await import("@/lib/workflow-engine");
        result = await createFromTemplate(
          supabase,
          parameters.organization_id || orgId,
          parameters.template_slug,
          {
            title: parameters.title,
            description: parameters.description,
            createdBy: user?.id || "ai-assistant",
          },
        );
        break;
      }

      case "get_workflow_status": {
        const { getWorkflowWithDetails } =
          await import("@/lib/workflow-engine");
        result = await getWorkflowWithDetails(supabase, parameters.workflow_id);
        break;
      }

      case "update_workflow_step": {
        const { updateStepStatus, advanceWorkflow: advanceAfterStep } =
          await import("@/lib/workflow-engine");
        const stepResult = await updateStepStatus(
          supabase,
          parameters.step_id,
          parameters.status,
          user?.id || "ai-assistant",
          parameters.completion_notes,
        );
        result = stepResult as any;
        // Auto-advance after step update
        const advanceResult = await advanceAfterStep(
          supabase,
          parameters.workflow_id,
        );
        if (advanceResult?.phaseAdvanced) {
          result = {
            ...result,
            phaseAdvanced: true,
            nextPhase: advanceResult.nextPhase,
          };
        }
        if (advanceResult?.progress !== undefined) {
          result = {
            ...result,
            progress: advanceResult.progress,
          };
        }
        break;
      }

      case "get_my_workflow_tasks": {
        const { getMyTasks } = await import("@/lib/workflow-engine");
        const taskOrgId = parameters.organization_id || orgId;
        const userRole = user ? await getUserRole(taskOrgId, user.id) : null;
        result = await getMyTasks(
          supabase,
          taskOrgId,
          userRole || "viewer",
          user?.id,
        );
        break;
      }

      case "advance_workflow": {
        const { advanceWorkflow: doAdvance } =
          await import("@/lib/workflow-engine");
        result = await doAdvance(supabase, parameters.workflow_id);
        break;
      }

      case "create_procurement_request": {
        const { createProcurementRequest } =
          await import("@/lib/workflow-engine");
        result = await createProcurementRequest(supabase, {
          organizationId: parameters.organization_id || orgId,
          workflowId: parameters.workflow_id,
          workflowStepId: parameters.workflow_step_id,
          title: parameters.title,
          description: parameters.description,
          estimatedValue: parameters.estimated_amount,
          requestedBy: user?.id || "ai-assistant",
        });
        break;
      }

      // ===== INCIDENT REPORTING SKILLS =====

      case "report_incident": {
        const incidentData: Record<string, any> = {
          organization_id: parameters.organization_id || orgId,
          incident_type: parameters.incident_type,
          severity: parameters.severity,
          incident_date: parameters.incident_date,
          incident_time: parameters.incident_time || null,
          location: parameters.location,
          location_detail: parameters.location_detail || null,
          injured_person_name: parameters.injured_person_name || null,
          injured_person_type: parameters.injured_person_type || null,
          title: parameters.title,
          description: parameters.description,
          immediate_actions: parameters.immediate_actions || null,
          first_aid_given: parameters.first_aid_given || false,
          hospital_attendance: parameters.hospital_attendance || false,
          is_riddor_reportable: parameters.is_riddor_reportable || false,
          riddor_category: parameters.riddor_category || null,
          investigation_required: parameters.investigation_required || false,
          status: parameters.is_riddor_reportable ? "awaiting_riddor" : "open",
          reported_by_id: user?.id || "ai-assistant",
          reported_by_name: parameters.reported_by_name || "Ed AI Assistant",
        };
        if (parameters.is_riddor_reportable) {
          const d = new Date(parameters.incident_date);
          let wd = 0;
          while (wd < 10) {
            d.setDate(d.getDate() + 1);
            if (d.getDay() !== 0 && d.getDay() !== 6) wd++;
          }
          incidentData.riddor_deadline = d.toISOString().split("T")[0];
        }
        const { data: newInc, error: incErr } = await supabase
          .from("incident_reports")
          .insert(incidentData)
          .select()
          .single();
        if (incErr) {
          result = { success: false, error: incErr.message };
        } else {
          let riskId = null;
          if (
            parameters.severity === "major" ||
            parameters.severity === "critical"
          ) {
            try {
              const { createRiskFromIncident } =
                await import("@/lib/risk-integration");
              const rr = await createRiskFromIncident({
                organization_id: parameters.organization_id || orgId,
                title: `Incident: ${parameters.title}`,
                description: parameters.description,
                severity: parameters.severity,
                source_module: "incidents",
                source_record_id: newInc.id,
                reported_by_id: user?.id,
                reported_by_name: parameters.reported_by_name,
                has_safeguarding_impact:
                  parameters.injured_person_type === "pupil",
              });
              riskId = rr?.risk_id;
              if (riskId)
                await supabase
                  .from("incident_reports")
                  .update({ linked_risk_id: riskId })
                  .eq("id", newInc.id);
            } catch {
              /* risk failure doesn't block */
            }
          }
          result = {
            success: true,
            incident: newInc,
            risk_created: riskId,
          };
        }
        break;
      }

      case "get_incidents": {
        let incQuery = supabase
          .from("incident_reports")
          .select("*")
          .eq("organization_id", parameters.organization_id || orgId)
          .order("incident_date", { ascending: false })
          .limit(20);
        if (parameters.status)
          incQuery = incQuery.eq("status", parameters.status);
        if (parameters.incident_type)
          incQuery = incQuery.eq("incident_type", parameters.incident_type);
        if (parameters.severity)
          incQuery = incQuery.eq("severity", parameters.severity);
        if (parameters.riddor_only)
          incQuery = incQuery.eq("is_riddor_reportable", true);
        const { data: incList, error: incListErr } = await incQuery;
        if (incListErr) {
          result = { success: false, error: incListErr.message };
        } else {
          const all = incList || [];
          result = {
            success: true,
            incidents: all,
            stats: {
              total: all.length,
              open: all.filter(
                (i: any) => i.status === "open" || i.status === "investigating",
              ).length,
              riddor_reportable: all.filter((i: any) => i.is_riddor_reportable)
                .length,
            },
          };
        }
        break;
      }

      case "update_incident": {
        const incUpdate: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        const incFields = [
          "status",
          "investigation_notes",
          "root_cause",
          "riddor_reference",
          "riddor_reported_date",
          "closure_notes",
          "corrective_actions",
        ];
        for (const f of incFields) {
          if (parameters[f] !== undefined) incUpdate[f] = parameters[f];
        }
        if (
          parameters.status === "closed" ||
          parameters.status === "closed_no_action"
        ) {
          incUpdate.closed_by_id = user?.id || "ai-assistant";
          incUpdate.closed_by_name = "Ed AI Assistant";
          incUpdate.closed_at = new Date().toISOString();
        }
        const { data: updInc, error: updIncErr } = await supabase
          .from("incident_reports")
          .update(incUpdate)
          .eq("id", parameters.incident_id)
          .select()
          .single();
        result = updIncErr
          ? { success: false, error: updIncErr.message }
          : { success: true, incident: updInc };
        break;
      }

      // ===== SOP SKILLS =====
      case "start_sop": {
        const { data: sopTemplate } = await supabase
          .from("sop_templates")
          .select("*")
          .eq("template_id", parameters.template_id)
          .single();

        if (!sopTemplate) {
          result = {
            success: false,
            error: `SOP template '${parameters.template_id}' not found`,
          };
          break;
        }

        // Initialize steps_data from template
        const stepsData = (sopTemplate.steps as any[]).map((step: any) => ({
          ...step,
          status: "pending",
          completed_at: null,
          completed_by: null,
          notes: null,
          evidence: [],
        }));

        const { data: sopRun, error: sopErr } = await supabase
          .from("sop_runs")
          .insert({
            organization_id: orgId,
            template_id: parameters.template_id,
            context: parameters.context || null,
            status: "in_progress",
            steps_data: stepsData,
            started_by: user?.id || "ai-assistant",
            started_at: new Date().toISOString(),
            linked_incident_id: parameters.linked_incident_id || null,
            linked_module: parameters.linked_module || null,
            linked_entity_id: parameters.linked_entity_id || null,
          })
          .select()
          .single();

        result = sopErr
          ? { success: false, error: sopErr.message }
          : {
              success: true,
              run: sopRun,
              template: {
                name: sopTemplate.name,
                description: sopTemplate.description,
              },
              message: `Started "${sopTemplate.name}" — ${stepsData.length} steps to complete.`,
              next_step: stepsData[0]
                ? {
                    step_id: stepsData[0].step_id,
                    title: stepsData[0].title,
                    instruction: stepsData[0].instruction,
                  }
                : null,
            };
        break;
      }

      case "get_sop_status": {
        const { data: sopRunDetail, error: sopDetailErr } = await supabase
          .from("sop_runs")
          .select("*")
          .eq("id", parameters.run_id)
          .single();

        if (sopDetailErr || !sopRunDetail) {
          result = { success: false, error: "SOP run not found" };
          break;
        }

        const sopSteps = (sopRunDetail.steps_data as any[]) || [];
        const sopCompleted = sopSteps.filter(
          (s: any) => s.status === "done",
        ).length;
        const sopTotal = sopSteps.length;
        const nextSopStep = sopSteps.find((s: any) => s.status === "pending");

        result = {
          success: true,
          run: sopRunDetail,
          progress: {
            completed: sopCompleted,
            total: sopTotal,
            percentage:
              sopTotal > 0 ? Math.round((sopCompleted / sopTotal) * 100) : 0,
          },
          next_step: nextSopStep
            ? {
                step_id: nextSopStep.step_id,
                title: nextSopStep.title,
                instruction: nextSopStep.instruction,
              }
            : null,
          status: sopRunDetail.status,
        };
        break;
      }

      case "update_sop_step": {
        const { data: runToUpdate, error: runFetchErr } = await supabase
          .from("sop_runs")
          .select("*")
          .eq("id", parameters.run_id)
          .single();

        if (runFetchErr || !runToUpdate) {
          result = { success: false, error: "SOP run not found" };
          break;
        }

        const updatedSteps = ((runToUpdate.steps_data as any[]) || []).map(
          (s: any) => {
            if (s.step_id === parameters.step_id) {
              return {
                ...s,
                status: parameters.status,
                completed_at:
                  parameters.status === "done"
                    ? new Date().toISOString()
                    : null,
                completed_by: user?.id || "ai-assistant",
                notes: parameters.notes || s.notes,
              };
            }
            return s;
          },
        );

        const { error: stepUpErr } = await supabase
          .from("sop_runs")
          .update({ steps_data: updatedSteps })
          .eq("id", parameters.run_id);

        const nextPending = updatedSteps.find(
          (s: any) => s.status === "pending",
        );
        const doneCount = updatedSteps.filter(
          (s: any) => s.status === "done",
        ).length;

        result = stepUpErr
          ? { success: false, error: stepUpErr.message }
          : {
              success: true,
              message: `Step "${parameters.step_id}" marked as ${parameters.status}.`,
              progress: {
                completed: doneCount,
                total: updatedSteps.length,
                percentage: Math.round((doneCount / updatedSteps.length) * 100),
              },
              next_step: nextPending
                ? {
                    step_id: nextPending.step_id,
                    title: nextPending.title,
                    instruction: nextPending.instruction,
                  }
                : null,
              all_done: !nextPending,
            };
        break;
      }

      case "get_sop_templates": {
        let sopTplQuery = supabase
          .from("sop_templates")
          .select("*")
          .eq("is_active", true);
        if (parameters.category)
          sopTplQuery = sopTplQuery.eq("category", parameters.category);
        const { data: sopTpls, error: sopTplErr } = await sopTplQuery
          .order("category")
          .order("name");

        result = sopTplErr
          ? { success: false, error: sopTplErr.message }
          : {
              success: true,
              templates: (sopTpls || []).map((t: any) => ({
                template_id: t.template_id,
                name: t.name,
                description: t.description,
                category: t.category,
                frequency: t.frequency,
                step_count: (t.steps as any[])?.length || 0,
                estimated_minutes: t.estimated_time_minutes,
                owner_role: t.owner_role,
              })),
            };
        break;
      }

      case "get_my_sop_runs": {
        let sopRunsQuery = supabase
          .from("sop_runs")
          .select("*")
          .eq("organization_id", orgId)
          .order("started_at", { ascending: false })
          .limit(20);

        if (parameters.status)
          sopRunsQuery = sopRunsQuery.eq("status", parameters.status);
        if (parameters.linked_module)
          sopRunsQuery = sopRunsQuery.eq(
            "linked_module",
            parameters.linked_module,
          );

        const { data: myRuns, error: myRunsErr } = await sopRunsQuery;

        result = myRunsErr
          ? { success: false, error: myRunsErr.message }
          : {
              success: true,
              runs: (myRuns || []).map((r: any) => {
                const steps = (r.steps_data as any[]) || [];
                const done = steps.filter(
                  (s: any) => s.status === "done",
                ).length;
                return {
                  id: r.id,
                  template_id: r.template_id,
                  context: r.context,
                  status: r.status,
                  progress: {
                    completed: done,
                    total: steps.length,
                    percentage:
                      steps.length > 0
                        ? Math.round((done / steps.length) * 100)
                        : 0,
                  },
                  started_at: r.started_at,
                  linked_module: r.linked_module,
                };
              }),
            };
        break;
      }

      case "suggest_sops_for_incident": {
        const suggestedIds: string[] = [];
        const reasons: Record<string, string> = {};

        if (parameters.incident_type === "near_miss") {
          suggestedIds.push("near_miss_recording");
          reasons["near_miss_recording"] =
            "Near-miss incident — quick capture and escalation check";
        } else {
          suggestedIds.push("incident_response");
          reasons["incident_response"] = "Standard incident response checklist";
        }

        if (parameters.is_riddor_reportable) {
          suggestedIds.push("riddor_assessment");
          reasons["riddor_assessment"] =
            "RIDDOR reportable — must file with HSE within deadline";
        }

        if (
          parameters.investigation_required ||
          parameters.severity === "major" ||
          parameters.severity === "critical"
        ) {
          suggestedIds.push("incident_investigation");
          reasons["incident_investigation"] =
            "Severity requires formal root cause investigation";
        }

        if (parameters.incident_type === "violence") {
          suggestedIds.push("violence_response");
          reasons["violence_response"] =
            "Violence incident — safeguarding and staff wellbeing protocol";
        }

        if (parameters.incident_type === "dangerous_occurrence") {
          suggestedIds.push("dangerous_occurrence");
          reasons["dangerous_occurrence"] =
            "Dangerous occurrence — ALWAYS RIDDOR reportable, evacuation may be needed";
        }

        // Fetch template details
        const { data: suggestedTpls } = await supabase
          .from("sop_templates")
          .select("template_id, name, description, estimated_time_minutes")
          .in("template_id", suggestedIds);

        result = {
          success: true,
          suggestions: (suggestedTpls || []).map((t: any) => ({
            template_id: t.template_id,
            name: t.name,
            description: t.description,
            estimated_minutes: t.estimated_time_minutes,
            reason: reasons[t.template_id],
          })),
        };
        break;
      }

      // ===== RISK MANAGEMENT SKILLS =====

      case "get_risk_register": {
        const status = parameters.status;
        const category = parameters.category;
        const band = parameters.band;

        let riskQuery = supabase
          .from("risk_register_with_mitigations")
          .select("*")
          .eq("organization_id", orgId)
          .order("updated_at", { ascending: false })
          .limit(50);

        if (status) riskQuery = riskQuery.eq("status", status);
        if (category)
          riskQuery = riskQuery.contains("risk_categories", [category]);

        const { data: riskData, error: riskErr } = await riskQuery;

        if (riskErr) {
          result = { success: false, error: riskErr.message };
          break;
        }

        let risks = riskData || [];
        if (band) {
          risks = risks.filter((r: any) => {
            const score =
              r.effective_residual_score ??
              // @ts-expect-error - Auto-masked during strict compilation enforcement
              r.inherent_likelihood * r.inherent_impact ??
              0;
            if (band === "critical") return score >= 17;
            if (band === "high") return score >= 10 && score < 17;
            if (band === "medium") return score >= 5 && score < 10;
            if (band === "low") return score < 5;
            return true;
          });
        }

        result = { success: true, data: risks };
        break;
      }

      case "get_risk_heatmap": {
        const { data: hmRisks, error: hmErr } = await supabase
          .from("risk_register")
          .select(
            "id, title, risk_ref, status, inherent_likelihood, inherent_impact, system_residual_likelihood, system_residual_impact, effective_residual_score, risk_categories, above_appetite, direction_of_travel",
          )
          .eq("organization_id", orgId)
          .neq("status", "closed");

        if (hmErr) {
          result = { success: false, error: hmErr.message };
          break;
        }

        // Build 5x5 matrix
        const matrix: Record<string, any[]> = {};
        for (let l = 1; l <= 5; l++) {
          for (let i = 1; i <= 5; i++) {
            matrix[`${l}_${i}`] = [];
          }
        }
        for (const r of hmRisks || []) {
          const l = r.system_residual_likelihood ?? r.inherent_likelihood ?? 1;
          const i = r.system_residual_impact ?? r.inherent_impact ?? 1;
          const key = `${l}_${i}`;
          if (matrix[key])
            matrix[key].push({ id: r.id, title: r.title, ref: r.risk_ref });
        }

        result = {
          success: true,
          data: { matrix, total_risks: (hmRisks || []).length },
        };
        break;
      }

      case "recalculate_risk_scores": {
        // Fetch all open risks and their mitigations, recalculate residual scores
        const { data: openRisks, error: openErr } = await supabase
          .from("risk_register")
          .select("id, inherent_likelihood, inherent_impact")
          .eq("organization_id", orgId)
          .neq("status", "closed");

        if (openErr) {
          result = { success: false, error: openErr.message };
          break;
        }

        let updated = 0;
        for (const risk of openRisks || []) {
          const { data: mits } = await supabase
            .from("risk_mitigations")
            .select("likelihood_reduction, impact_reduction, is_operating")
            .eq("risk_id", risk.id)
            .eq("is_operating", true);

          let lReduction = 0,
            iReduction = 0;
          for (const m of mits || []) {
            lReduction += m.likelihood_reduction || 0;
            iReduction += m.impact_reduction || 0;
          }

          const resL = Math.max(
            1,
            (risk.inherent_likelihood || 1) - lReduction,
          );
          const resI = Math.max(1, (risk.inherent_impact || 1) - iReduction);

          await supabase
            .from("risk_register")
            .update({
              system_residual_likelihood: resL,
              system_residual_impact: resI,
              effective_residual_score: resL * resI,
              updated_at: new Date().toISOString(),
            })
            .eq("id", risk.id);

          updated++;
        }

        result = { success: true, data: { risks_recalculated: updated } };
        break;
      }

      case "create_risk": {
        const { generateRiskRef } = await import("@/lib/risk-engine");

        const riskTitle = parameters.title;
        const riskDesc = parameters.description;
        const categories = parameters.categories || [];
        const inhLikelihood = parameters.inherent_likelihood;
        const inhImpact = parameters.inherent_impact;

        if (!riskTitle || !inhLikelihood || !inhImpact) {
          result = {
            success: false,
            error:
              "title, inherent_likelihood, and inherent_impact are required",
          };
          break;
        }

        const primaryCat = categories[0] || "operational";
        const { count: riskCount } = await supabase
          .from("risk_register")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .contains("risk_categories", [primaryCat]);

        const { data: orgData } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single();
        const schoolCode = orgData?.name
          ? orgData.name
              .substring(0, 3)
              .toUpperCase()
              .replace(/[^A-Z]/g, "X")
          : "SCH";
        const riskRef = generateRiskRef(
          primaryCat,
          schoolCode,
          (riskCount ?? 0) + 1,
        );

        const { data: newRisk, error: createErr } = await supabase
          .from("risk_register")
          .insert({
            organization_id: orgId,
            risk_ref: riskRef,
            title: riskTitle,
            description: riskDesc,
            tier: "school",
            status: "identified",
            risk_categories: categories,
            inherent_likelihood: inhLikelihood,
            inherent_impact: inhImpact,
            system_residual_likelihood: inhLikelihood,
            system_residual_impact: inhImpact,
            effective_residual_score: inhLikelihood * inhImpact,
          })
          .select()
          .single();

        if (createErr) {
          result = { success: false, error: createErr.message };
          break;
        }

        result = { success: true, data: newRisk };
        break;
      }

      case "add_mitigation": {
        const riskId = parameters.risk_id;
        const mitTitle = parameters.title;
        const mitType = parameters.mitigation_type || "treat";

        if (!riskId || !mitTitle) {
          result = { success: false, error: "risk_id and title are required" };
          break;
        }

        // Verify risk belongs to org
        const { data: targetRisk } = await supabase
          .from("risk_register")
          .select("id, organization_id")
          .eq("id", riskId)
          .eq("organization_id", orgId)
          .single();

        if (!targetRisk) {
          result = {
            success: false,
            error: "Risk not found in your organization",
          };
          break;
        }

        const { data: newMit, error: mitErr } = await supabase
          .from("risk_mitigations")
          .insert({
            risk_id: riskId,
            organization_id: orgId,
            title: mitTitle,
            description: parameters.description || "",
            mitigation_type: mitType,
            source_module: parameters.source_module || "manual",
            owner_id: parameters.owner_id,
            due_date: parameters.due_date,
            is_operating: false,
            likelihood_reduction: 0,
            impact_reduction: 0,
          })
          .select()
          .single();

        if (mitErr) {
          result = { success: false, error: mitErr.message };
          break;
        }

        result = { success: true, data: newMit };
        break;
      }

      case "record_risk_decision": {
        const decRiskId = parameters.risk_id;
        const decision = parameters.decision;
        const rationale = parameters.rationale;

        if (!decRiskId || !decision || !rationale) {
          result = {
            success: false,
            error: "risk_id, decision, and rationale are required",
          };
          break;
        }

        // Verify risk belongs to org
        const { data: decRisk } = await supabase
          .from("risk_register")
          .select("id, organization_id")
          .eq("id", decRiskId)
          .eq("organization_id", orgId)
          .single();

        if (!decRisk) {
          result = {
            success: false,
            error: "Risk not found in your organization",
          };
          break;
        }

        const { data: newDec, error: decErr } = await supabase
          .from("risk_decisions")
          .insert({
            risk_id: decRiskId,
            organization_id: orgId,
            decision,
            rationale,
            decided_by: parameters.decided_by || user?.id,
            review_date: parameters.review_date,
            decision_date: new Date().toISOString(),
          })
          .select()
          .single();

        if (decErr) {
          result = { success: false, error: decErr.message };
          break;
        }

        // Update risk status based on decision
        const statusMap: Record<string, string> = {
          treat: "treating",
          tolerate: "tolerated",
          transfer: "treating",
          terminate: "closed",
        };
        if (statusMap[decision]) {
          await supabase
            .from("risk_register")
            .update({
              status: statusMap[decision],
              updated_at: new Date().toISOString(),
            })
            .eq("id", decRiskId);
        }

        result = { success: true, data: newDec };
        break;
      }

      // Google Drive Skills
      case "upload_to_drive": {
        const driveUploadRes = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/drive/upload`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "upload",
              organization_id: parameters.organization_id,
              file_name: parameters.file_name,
              content: parameters.content,
              mime_type: parameters.mime_type,
              folder_id: parameters.folder_id,
            }),
          },
        );
        result = await driveUploadRes.json();
        break;
      }

      case "create_drive_folder": {
        const driveFolderRes = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/drive/upload`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create_folder",
              organization_id: parameters.organization_id,
              folder_name: parameters.folder_name,
              parent_folder_id: parameters.parent_folder_id,
            }),
          },
        );
        result = await driveFolderRes.json();
        break;
      }

      case "list_drive_files": {
        const driveListRes = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/drive/upload`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "list",
              organization_id: parameters.organization_id,
              folder_id: parameters.folder_id,
            }),
          },
        );
        result = await driveListRes.json();
        break;
      }

      default:
        result = {
          success: false,
          error: `Unknown function: ${functionName}`,
        };
    }

    // Audit log: record WHAT was done, not the content (GDPR-safe)
    if (
      user &&
      orgId &&
      functionName !== "list_staff" &&
      functionName !== "list_actions" &&
      functionName !== "list_compliance_tasks" &&
      functionName !== "list_document_templates" &&
      functionName !== "list_generated_documents" &&
      functionName !== "get_document" &&
      functionName !== "get_risk_register" &&
      functionName !== "get_risk_heatmap" &&
      functionName !== "get_workflow_status" &&
      functionName !== "get_my_workflow_tasks" &&
      functionName !== "get_sop_status" &&
      functionName !== "get_sop_templates" &&
      functionName !== "get_my_sop_runs" &&
      functionName !== "suggest_sops_for_incident"
    ) {
      logEdAction(supabase, {
        organizationId: orgId,
        userId: user.id,
        skillName: functionName,
        actionSummary: `Executed ${functionName}`,
        success: (result as any)?.success !== false,
        recordId:
          (result as any)?.data?.id ||
          (result as any)?.data?.staff_id ||
          undefined,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in POST /api/skills/invoke:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/skills/invoke
 *
 * Returns available functions and their schemas for discovery.
 */
export async function GET() {
  const {
    STAFF_FUNCTION_SCHEMAS,
    ACTIONS_FUNCTION_SCHEMAS,
    ESTATES_FUNCTION_SCHEMAS,
    INTELLIGENCE_FUNCTION_SCHEMAS,
    RISK_FUNCTION_SCHEMAS,
    DOCUMENT_FUNCTION_SCHEMAS,
    WORKFLOW_FUNCTION_SCHEMAS,
    TERRY_FUNCTION_SCHEMAS,
    GDRIVE_FUNCTION_SCHEMAS,
  } = await import("@/lib/skills/school-skills-registry");

  return NextResponse.json({
    success: true,
    data: {
      functions: [
        ...STAFF_FUNCTION_SCHEMAS,
        ...ACTIONS_FUNCTION_SCHEMAS,
        ...ESTATES_FUNCTION_SCHEMAS,
        ...INTELLIGENCE_FUNCTION_SCHEMAS,
        ...RISK_FUNCTION_SCHEMAS,
        ...DOCUMENT_FUNCTION_SCHEMAS,
        ...WORKFLOW_FUNCTION_SCHEMAS,
        ...TERRY_FUNCTION_SCHEMAS,
        ...GDRIVE_FUNCTION_SCHEMAS,
      ],
      categories: {
        staff: {
          name: "Staff Directory",
          description: "Manage school staff directory",
          functions: STAFF_FUNCTION_SCHEMAS.map((f: any) => f.name),
        },
        actions: {
          name: "Actions Hub",
          description: "AI-augmented school improvement",
          functions: ACTIONS_FUNCTION_SCHEMAS.map((f: any) => f.name),
        },
        estates: {
          name: "Estates & Compliance",
          description: "Estate management and statutory compliance",
          functions: ESTATES_FUNCTION_SCHEMAS.map((f: any) => f.name),
        },
        terry: {
          name: "Terry Taurus (Propose → Approve)",
          description:
            "Estate & H&S specialist tools with human-in-the-loop governance. Write ops return proposals for user approval.",
          functions: TERRY_FUNCTION_SCHEMAS.map((f: any) => f.name),
        },
        intelligence: {
          name: "School Intelligence",
          description:
            "Data analysis, cohort tracking, attainment gaps, EEF research recommendations",
          functions: INTELLIGENCE_FUNCTION_SCHEMAS.map((f: any) => f.name),
        },
        risk: {
          name: "Risk Management",
          description:
            "Risk register, heat maps, mitigations, and 4T decisions",
          functions: RISK_FUNCTION_SCHEMAS.map((f: any) => f.name),
        },
        documents: {
          name: "Document Production",
          description:
            "Generate, manage, and send letters, notices, reports, and certificates from templates",
          functions: DOCUMENT_FUNCTION_SCHEMAS.map((f: any) => f.name),
        },
        workflow: {
          name: "Workflow Engine",
          description:
            "Create and manage multi-phase workflows with step tracking, evidence collection, and procurement",
          functions: WORKFLOW_FUNCTION_SCHEMAS.map((f: any) => f.name),
        },
        gdrive: {
          name: "Google Drive",
          description:
            "Upload files, create folders, and list files in the school's Google Drive",
          functions: GDRIVE_FUNCTION_SCHEMAS.map((f: any) => f.name),
        },
      },
    },
  });
}
