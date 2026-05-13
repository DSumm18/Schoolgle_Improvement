import type {
  ComplianceItem,
  MeetingTemplate,
  PreparationGuide,
  TemplateCategory,
} from "./types";

export interface CustomMeetingTemplateInput {
  name: string;
  category: TemplateCategory;
  description?: string;
  discussionItemsText: string;
  policyRefsText?: string;
}

export interface CustomMeetingTemplatePayload {
  name: string;
  category: TemplateCategory;
  description: string;
  opening_script: string[];
  closing_script: string[];
  compliance_items: ComplianceItem[];
  preparation_guide: PreparationGuide;
  is_custom: true;
}

export interface CloneMeetingTemplateInput {
  template: MeetingTemplate;
  name: string;
  description?: string;
  discussionItemsText: string;
  policyRefsText?: string;
}

export function parseDiscussionItems(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildCustomMeetingTemplatePayload(
  input: CustomMeetingTemplateInput,
): CustomMeetingTemplatePayload {
  const discussionItems = parseDiscussionItems(input.discussionItemsText);
  const policyRefs = parseDiscussionItems(input.policyRefsText || "");

  return {
    name: input.name.trim() || "Custom Meeting",
    category: input.category,
    description: input.description?.trim() || "",
    opening_script: [
      "Thank you for joining this meeting. The purpose is to work through the agreed discussion points and capture clear actions.",
    ],
    closing_script: [
      "Before we close, can we confirm the decisions, action owners, due dates, and any unresolved points?",
    ],
    compliance_items: discussionItems.map((phrase, orderIndex) => ({
      phrase,
      category: "Discussion point",
      is_critical: true,
      order_index: orderIndex,
    })),
    preparation_guide: {
      context_prompts: [
        "Add any local context, documents, or risks the chair should understand before the meeting.",
      ],
      documents_needed: [],
      key_phrases: discussionItems,
      policy_refs: policyRefs,
    },
    is_custom: true,
  };
}

export function cloneMeetingTemplateToCustomPayload(
  input: CloneMeetingTemplateInput,
): CustomMeetingTemplatePayload {
  const discussionItems = parseDiscussionItems(input.discussionItemsText);
  const policyRefs = parseDiscussionItems(input.policyRefsText || "");

  return {
    name: input.name.trim() || `Copy of ${input.template.name}`,
    category: input.template.category,
    description: input.description?.trim() || input.template.description || "",
    opening_script: input.template.opening_script,
    closing_script: input.template.closing_script,
    compliance_items: discussionItems.map((phrase, orderIndex) => ({
      phrase,
      category:
        input.template.compliance_items[orderIndex]?.category ||
        "Discussion point",
      is_critical:
        input.template.compliance_items[orderIndex]?.is_critical ?? true,
      order_index: orderIndex,
    })),
    preparation_guide: {
      ...input.template.preparation_guide,
      key_phrases: discussionItems,
      policy_refs: policyRefs,
    },
    is_custom: true,
  };
}
