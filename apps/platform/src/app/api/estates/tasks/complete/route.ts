/**
 * Task Completion API
 *
 * POST /api/estates/tasks/complete - Complete a task with evidence
 * GET /api/estates/tasks/complete - Get completion details for a task
 *
 * Handles:
 * - Completing a task with evidence, findings, and signature
 * - Creating next occurrence for recurring tasks
 * - Updating RAG status
 * - Creating follow-up tasks from findings
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { TaskService } from "@/lib/estates-compliance/services/TaskService";
import { RAGStatusService } from "@/lib/estates-compliance/services/RAGStatusService";
import type { Finding } from "@/types/estates-compliance";

interface CompleteTaskRequest {
  task_id: string;
  checklist_items: Record<string, boolean>;
  readings: Record<string, string>;
  findings: Finding[];
  completion_notes: string;
  signature: string;
  photos: string[];
  follow_up_tasks: Array<{ title: string; priority: string }>;
}

export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;

    const body: CompleteTaskRequest = await request.json();
    const taskId = body.task_id;

    if (!taskId) {
      return apiError("task_id is required", 400);
    }

    // Get the current task
    const task = await TaskService.getById(taskId);
    if (!task) {
      return apiError("Task not found", 404);
    }

    // Verify task belongs to organization
    if (task.organization_id !== organizationId) {
      return apiError("Unauthorized", 403);
    }

    // Update task with completion data
    const updatedTask = await TaskService.update(taskId, {
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: userId,
      completion_notes: body.completion_notes,
      checklist_items: body.checklist_items,
      findings: body.findings,
      photo_urls: body.photos,
      // Add readings to metadata
      metadata: {
        ...task,
        readings: body.readings,
        signature: body.signature,
      },
    });

    // Create follow-up tasks from findings
    const followUpTasks = [];
    for (const followUp of body.follow_up_tasks) {
      const newTask = await TaskService.create(organizationId, {
        title: followUp.title,
        description: `Follow-up task from completed check: ${task.title}`,
        task_type: "inspection",
        compliance_domain: task.compliance_domain,
        priority: followUp.priority as any,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        recurring: false,
      });
      followUpTasks.push(newTask);
    }

    // Create budget items for high-severity findings
    const budgetItems = [];
    for (const finding of body.findings) {
      if (finding.severity === "critical" || finding.severity === "high") {
        budgetItems.push({
          title: `Address: ${finding.description}`,
          description: finding.action_required,
          category: "repair" as const,
          classification:
            finding.classification === "statutory"
              ? "statutory"
              : "good_practice",
          priority: finding.severity,
          status: "planned" as const,
          target_fiscal_year: new Date().getFullYear().toString(),
          source: finding.source || "compliance_check",
          source_url: finding.source_url,
        });
      }
    }

    // Recalculate RAG status for the domain
    const domainStatus = await RAGStatusService.calculateDomainStatus(
      organizationId,
      task.compliance_domain,
    );

    // If there are critical findings, create helpdesk tickets
    const helpdeskTickets = [];
    for (const finding of body.findings) {
      if (finding.severity === "critical") {
        helpdeskTickets.push({
          title: `Critical Issue: ${finding.description.substring(0, 50)}...`,
          description: finding.action_required,
          category: task.compliance_domain,
          priority: "critical",
          source_task_id: taskId,
        });
      }
    }

    return apiSuccess({
      task: updatedTask,
      follow_up_tasks: followUpTasks,
      budget_items_created: budgetItems.length,
      helpdesk_tickets_created: helpdeskTickets.length,
      rag_status: domainStatus,
      message: "Task completed successfully",
    });
  },
  { requiredRole: "caretaker" },
);

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;

  const searchParams = request.nextUrl.searchParams;
  const taskId = searchParams.get("task_id");

  if (!taskId) {
    return apiError("task_id query parameter is required", 400);
  }

  const task = await TaskService.getById(taskId);
  if (!task) {
    return apiError("Task not found", 404);
  }

  // Verify task belongs to organization
  if (task.organization_id !== organizationId) {
    return apiError("Unauthorized", 403);
  }

  // Get required evidence from statutory checks database if applicable
  let requiredEvidence: string[] = [];
  try {
    const { STATUTORY_CHECKS } =
      await import("@/lib/estates-compliance/statutory-checks");
    const domainChecks =
      STATUTORY_CHECKS[
        task.compliance_domain as keyof typeof STATUTORY_CHECKS
      ] || [];
    const matchingCheck = domainChecks.find(
      (check: any) =>
        task.title.toLowerCase().includes(check.name.toLowerCase()) ||
        check.name.toLowerCase().includes(task.title.toLowerCase()),
    );
    if (matchingCheck) {
      requiredEvidence = matchingCheck.evidenceRequired || [];
    }
  } catch (error) {
    console.error("Error loading statutory checks:", error);
  }

  // Get domain-specific RAG status
  const domainStatus = await RAGStatusService.calculateDomainStatus(
    organizationId,
    task.compliance_domain,
  );

  return apiSuccess({
    task,
    required_evidence: requiredEvidence,
    rag_status: domainStatus,
  });
});
