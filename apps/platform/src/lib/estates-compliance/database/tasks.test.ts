import { describe, expect, it } from "vitest";
import {
  buildTaskUpdateRow,
  buildTaskInsertRow,
  normalizeComplianceTaskRow,
} from "./tasks";

describe("estates compliance task row mapping", () => {
  it("maps task creation input to estates_compliance_tasks columns", () => {
    const row = buildTaskInsertRow({
      organization_id: "org-1",
      title: "Monthly fire door check",
      description: "Inspect all fire doors",
      task_type: "inspection",
      compliance_domain: "fire",
      priority: "medium",
      due_date: "2026-05-12",
      contractor_id: "contractor-1",
      recurring: true,
      recurrence_pattern: "monthly",
      recurrence_interval: 1,
      checklist_items: ["Check seals", "Check closers"],
    });

    expect(row).toMatchObject({
      organization_id: "org-1",
      task_name: "Monthly fire door check",
      description: "Inspect all fire doors",
      task_type: "inspection",
      compliance_domain: "fire",
      priority: "medium",
      scheduled_for: "2026-05-12",
      due_by: "2026-05-12",
      frequency: "monthly",
      task_source: "external",
      assigned_contractor_id: "contractor-1",
      is_recurring: true,
      recurrence_pattern: { type: "monthly", interval: 1 },
      checklist: ["Check seals", "Check closers"],
      status: "pending",
    });
    expect(row).not.toHaveProperty("title");
    expect(row).not.toHaveProperty("due_date");
    expect(row).not.toHaveProperty("contractor_id");
  });

  it("normalizes database rows with UI aliases", () => {
    const row = normalizeComplianceTaskRow({
      id: "task-1",
      task_name: "Monthly fire door check",
      due_by: "2026-05-12",
    });

    expect(row.title).toBe("Monthly fire door check");
    expect(row.due_date).toBe("2026-05-12");
  });

  it("maps update aliases without leaking non-columns", () => {
    const row = buildTaskUpdateRow({
      title: "Updated task",
      due_date: "2026-06-01",
      contractor_id: "contractor-2",
      checklist_items: ["Updated item"],
      recurring: false,
      recurrence_interval: 2,
    });

    expect(row).toMatchObject({
      task_name: "Updated task",
      due_by: "2026-06-01",
      assigned_contractor_id: "contractor-2",
      checklist: ["Updated item"],
      is_recurring: false,
    });
    expect(row).not.toHaveProperty("title");
    expect(row).not.toHaveProperty("due_date");
    expect(row).not.toHaveProperty("contractor_id");
    expect(row).not.toHaveProperty("recurrence_interval");
  });
});
