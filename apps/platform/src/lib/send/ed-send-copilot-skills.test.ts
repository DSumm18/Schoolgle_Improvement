import { describe, expect, it } from "vitest";
import {
  SEND_ED_COPILOT_SKILLS,
  getSendEdSkillByName,
  listHumanApprovalSendSkills,
} from "./ed-send-copilot-skills";

const requiredSkills = [
  "send_list_open_actions",
  "send_create_case_note",
  "send_summarise_upload",
  "send_prepare_meeting",
  "send_generate_minutes_outputs",
  "send_check_ehcp_quality",
  "send_build_evidence_pack",
  "send_reconcile_funding",
  "send_generate_la_query",
  "send_generate_governor_report",
];

describe("Ed SEND copilot skills", () => {
  it("covers the SENCO day-in-the-life workflow", () => {
    expect(SEND_ED_COPILOT_SKILLS.map((skill) => skill.name)).toEqual(requiredSkills);
  });

  it("marks external or statutory outputs as human approval required", () => {
    const approvalSkillNames = listHumanApprovalSendSkills().map((skill) => skill.name);

    expect(approvalSkillNames).toContain("send_generate_minutes_outputs");
    expect(approvalSkillNames).toContain("send_build_evidence_pack");
    expect(approvalSkillNames).toContain("send_generate_la_query");
    expect(approvalSkillNames).toContain("send_generate_governor_report");
  });

  it("keeps safe internal support tasks available for automatic help", () => {
    expect(getSendEdSkillByName("send_list_open_actions")?.risk).toBe("safe_auto");
    expect(getSendEdSkillByName("send_create_case_note")?.risk).toBe("safe_auto");
    expect(getSendEdSkillByName("send_summarise_upload")?.risk).toBe("safe_auto");
    expect(getSendEdSkillByName("send_reconcile_funding")?.risk).toBe("safe_auto");
  });

  it("requires every skill to declare concrete outputs", () => {
    for (const skill of SEND_ED_COPILOT_SKILLS) {
      expect(skill.produces.length).toBeGreaterThan(0);
    }
  });
});

