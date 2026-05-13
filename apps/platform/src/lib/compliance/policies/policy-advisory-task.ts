import type { ActionForm, Department, TaskPriority } from "@/lib/tasks";
import type { PolicyQualityCheck } from "./policy-quality-analyser";
import type { PolicyRequirementMatch } from "./policy-matcher";

type BuildPolicyAdvisoryTaskInput = {
  match: PolicyRequirementMatch;
  check: PolicyQualityCheck;
};

type BuildPolicyAdvisoryTaskRequestInput = BuildPolicyAdvisoryTaskInput & {
  organizationId: string;
};

export function buildPolicyAdvisoryTaskRequest({
  organizationId,
  match,
  check,
}: BuildPolicyAdvisoryTaskRequestInput): {
  organizationId: string;
  task: ActionForm;
} {
  return {
    organizationId,
    task: buildPolicyAdvisoryTask({ match, check }),
  };
}

export function buildPolicyAdvisoryTask({
  match,
  check,
}: BuildPolicyAdvisoryTaskInput): ActionForm {
  const policyName = match.requirement.canonicalName;
  const ruleTitle = check.rule.title;
  const sourceRecordId = `${match.requirement.id}:${check.rule.id}`;
  const sourceLines = check.rule.sourceRefs.map(
    (source) =>
      `- ${source.title} (${source.publisher}, ${formatAuthority(source.authority)}): ${source.url}`,
  );

  return {
    title: `Update ${policyName}: ${ruleTitle}`,
    description: [
      `Schoolgle found an advisory gap in ${policyName}.`,
      "",
      `Finding: ${check.rule.description}`,
      `Suggested update: ${check.rule.missingAction}`,
      `Current status: ${check.status}`,
      "",
      "Official sources checked:",
      ...sourceLines,
      "",
      match.matchedFile?.webViewLink
        ? `Current policy file: ${match.matchedFile.name} (${match.matchedFile.webViewLink})`
        : `Current policy file: ${match.matchedFile?.name || "No matched file"}`,
      "",
      "This task was created by a user from an advisory finding. It does not automatically edit or approve the policy.",
    ].join("\n"),
    task_type: "compliance",
    department: mapPolicyDomainToDepartment(match.requirement.domain),
    priority: mapPolicyCheckToPriority(check),
    status: "not_started",
    module: "Policy Manager",
    source: "policy_manager",
    route_path: "/dashboard/compliance/policies",
    source_record_id: sourceRecordId,
    source_table_name: "policy_quality_advisory",
    linked_evidence: match.matchedFile
      ? [
          {
            documentId: match.matchedFile.id,
            documentName: match.matchedFile.name,
            type: "url",
            title: match.matchedFile.name,
            url: match.matchedFile.webViewLink,
          },
        ]
      : [],
    checklist: [
      { title: `Review the current ${policyName}` },
      { title: `Update the policy section for ${ruleTitle}` },
      { title: "Check the update against the cited official sources" },
      { title: `Send for approval via ${match.requirement.approvalHint}` },
    ],
  };
}

function mapPolicyCheckToPriority(check: PolicyQualityCheck): TaskPriority {
  if (check.rule.severity === "statutory" && check.status === "missing") {
    return "high";
  }

  if (check.rule.severity === "statutory" || check.status === "missing") {
    return "medium";
  }

  return "low";
}

function mapPolicyDomainToDepartment(domain: string): Department {
  if (domain === "finance") return "finance";
  if (domain === "hr") return "hr";
  if (domain === "send_inclusion") return "send";
  if (domain === "safeguarding") return "safeguarding";
  if (domain === "health_safety") return "premises";
  if (domain === "governance" || domain === "admissions") return "governors";

  return "senior_leadership";
}

function formatAuthority(authority: string): string {
  return authority.replace(/_/g, " ");
}
