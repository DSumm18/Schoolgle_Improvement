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

    if (orgId && user) {
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
          await import("@/lib/school-intelligence-engine");
        const eng = getEngine();
        const journey = await eng.buildCohortJourney(
          parameters.urn,
          parameters.organization_id,
          parameters.current_year_group,
          parameters.years_back,
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
      functionName !== "get_risk_heatmap"
    ) {
      logEdAction(supabase, {
        organizationId: orgId,
        userId: user.id,
        skillName: functionName,
        actionSummary: `Executed ${functionName}`,
        success: result?.success !== false,
        recordId: result?.data?.id || result?.data?.staff_id || undefined,
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
      },
    },
  });
}
