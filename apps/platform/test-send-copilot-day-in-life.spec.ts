import { expect, test } from "@playwright/test";

const SEND_COPILOT_URL =
  process.env.SEND_COPILOT_URL ?? "http://127.0.0.1:3000/dashboard/send/copilot";

async function openView(page: import("@playwright/test").Page, name: string) {
  await page.getByRole("button", { name, exact: true }).click();
}

async function openPupilFileArea(page: import("@playwright/test").Page, name: string) {
  await openView(page, "Pupil File");
  await page.getByRole("button", { name, exact: true }).click();
}

test.describe("SEND & Inclusion Copilot day in the life", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SEND_COPILOT_URL);
    await expect(
      page.getByRole("heading", {
        name: /SENCO workbench: pupils, meetings, evidence, provision, funding and reporting/i,
      }),
    ).toBeVisible();
  });

  test("first login dashboard shows register, EHCP plans, KPIs and filters", async ({ page }) => {
    await expect(page.getByText("SENCO dashboard · first login view")).toBeVisible();
    await expect(page.getByText("EHCP plans", { exact: true })).toBeVisible();
    await expect(page.getByText("SEND register", { exact: true })).toBeVisible();
    await expect(page.getByText("84", { exact: true })).toBeVisible();
    await expect(page.getByText("Open actions", { exact: true })).toBeVisible();
    await expect(page.getByText("EHCP plan tracker")).toBeVisible();
    await expect(page.getByText("Next deadlines")).toBeVisible();
    await expect(page.getByText("Open actions log")).toBeVisible();

    await page.getByLabel("Pupil").selectOption("sofia");
    await expect(page.getByRole("cell", { name: "Sofia B." }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "Amelia R." }).first()).not.toBeVisible();

    await page.getByLabel("Workflow").selectOption("Funding");
    await page.getByLabel("Priority").selectOption("Low");
    await expect(page.getByRole("cell", { name: "Review Band 2 funding end date" })).toBeVisible();
  });

  test("morning triage shows what the SENCO does next", async ({ page }) => {
    await openView(page, "SEND Today");

    await expect(page.getByRole("heading", { level: 2, name: "Check October top-up underpayment with finance" })).toBeVisible();
    await expect(page.getByText("SENCO dashboard · first login view")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Action queue" })).toBeVisible();
    await expect(page.getByText("filter by pupil, workflow, deadline and priority")).toBeVisible();
    await expect(page.getByText("Open actions log")).toBeVisible();
    await expect(page.getByRole("cell", { name: "LA query pack" }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "Evidence pack update" }).first()).toBeVisible();
  });

  test("full register is visible and opens a secure pupil file", async ({ page }) => {
    await openView(page, "SEND Register");

    await expect(page.getByRole("heading", { name: "Full SEND register" })).toBeVisible();
    await expect(page.getByText("84 pupils on register")).toBeVisible();
    await expect(page.getByRole("button", { name: /Import from Arbor/i })).toBeVisible();
    await page.getByRole("button", { name: /Sofia B./ }).click();
    await expect(page.getByText("Confidential pupil file", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Sofia B./ })).toBeVisible();
  });

  test("diary controls statutory deadlines and routes next work", async ({ page }) => {
    await openView(page, "SENCO Diary");

    await expect(page.getByRole("heading", { name: /SENCO diary and deadline tracker/i })).toBeVisible();
    await expect(page.getByText("EHCP annual review preparation deadline")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Annual review meeting" })).toBeVisible();
    await expect(page.getByText("LA top-up funding receipt expected")).toBeVisible();
    await expect(page.getByText("Next action: Upload SALT report and confirm quantified provision wording.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Do next action" }).first()).toBeVisible();
  });

  test("pupil one-view replaces the paper file index", async ({ page }) => {
    await openView(page, "Pupil File");

    await expect(page.getByRole("heading", { name: /Amelia R./ })).toBeVisible();
    await expect(page.getByText("Confidential pupil file", { exact: true })).toBeVisible();
    await expect(page.getByText("This is the secure pupil record.")).toBeVisible();
    await expect(page.getByText("Next statutory step")).toBeVisible();
    await expect(page.getByText("Provision in place")).toBeVisible();
    await expect(page.getByText("EHCP provision evidence")).toBeVisible();
    await expect(page.getByText("Evidence readiness")).toBeVisible();
    await expect(page.getByRole("button", { name: /Diary .* EHCP annual review preparation deadline/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Notes 2 current case notes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Uploads 1 item needs upload" })).toBeVisible();
  });

  test("EHCP provision tracker evidences delivery and annual review runway", async ({ page }) => {
    await openPupilFileArea(page, "EHCP provision");

    await expect(page.getByRole("heading", { name: /EHCP Section F provision tracker for Amelia R./ })).toBeVisible();
    await expect(page.getByText("Provision delivery evidence log")).toBeVisible();
    await expect(page.getByText("Daily adult support during English and unstructured transitions")).toBeVisible();
    await expect(page.getByText("SALT programme targets embedded across classroom routines")).toBeVisible();
    await expect(page.getByText("Evidence gap", { exact: true })).toBeVisible();
    await expect(page.getByText("Annual review automation")).toBeVisible();
    await expect(page.getByText("12 weeks before")).toBeVisible();
    await expect(page.getByText("2 weeks after")).toBeVisible();

    await page.getByRole("button", { name: "Prepare LA/parent update" }).click();
    await expect(page.getByText("Draft created: provision evidence update")).toBeVisible();
  });

  test("notes and uploads create structured record, evidence and actions", async ({ page }) => {
    await openPupilFileArea(page, "Case notes & uploads");

    await expect(page.getByRole("heading", { name: /Confidential notes and uploads for Amelia R./ })).toBeVisible();
    await expect(page.getByText("This is inside the pupil file.")).toBeVisible();
    await expect(page.getByText("Access-controlled SEND information")).toBeVisible();
    await expect(page.getByText("Drop a report, plan, form or LA file here")).toBeVisible();
    await expect(page.getByText("SALT report - April 2026")).toBeVisible();
    await expect(page.getByText("Creates: Evidence item, annual review prompt and provision wording check.")).toBeVisible();

    await page.getByRole("button", { name: "Save note to Amelia R.'s file" }).click();
    await expect(page.getByText("Note saved and linked to the annual review pack.")).toBeVisible();
    await expect(page.getByText("Today · SENCO")).toBeVisible();
    await expect(
      page.locator("p").filter({ hasText: "Parent has asked whether sensory breaks can be made more consistent after lunch." }),
    ).toBeVisible();
  });

  test("meeting copilot reuses Schoolgle Meetings template model", async ({ page }) => {
    await openPupilFileArea(page, "Meetings");

    await expect(page.getByRole("heading", { name: /Annual Review Meeting Copilot/i })).toBeVisible();
    await expect(page.getByText("Confidential pupil file · meeting")).toBeVisible();
    await expect(
      page.getByText("Uses the existing Schoolgle Meetings engine with the SEND EHCP Annual Review template."),
    ).toBeVisible();
    await expect(page.getByText("Confirm parent, pupil, school and professional views")).toBeVisible();
    await expect(page.getByText("Template outputs")).toBeVisible();
    await expect(page.getByText("Minutes", { exact: true })).toBeVisible();
    await expect(page.getByText("Actions", { exact: true })).toBeVisible();
    await expect(page.getByText("Annual review report", { exact: true })).toBeVisible();
  });

  test("documents are generated from minutes, evidence and notes", async ({ page }) => {
    await openPupilFileArea(page, "Documents");

    await expect(page.getByRole("heading", { name: /SEND document builder for Amelia R./ })).toBeVisible();
    await expect(page.getByText("Confidential pupil file · documents")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Annual review report" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "EHCP amendment request" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "LA funding query" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Teacher one-page plan" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Parent meeting summary" })).toBeVisible();

    await page.getByRole("button", { name: "Generate Annual review report" }).click();
    await expect(page.getByText("Annual review report draft created")).toBeVisible();
    await expect(page.getByText("Source pack includes latest notes")).toBeVisible();
  });

  test("evidence pack exposes missing items before statutory paperwork", async ({ page }) => {
    await openPupilFileArea(page, "Evidence");

    await expect(page.getByRole("heading", { name: /Evidence pack builder/i })).toBeVisible();
    await expect(page.getByText("Confidential pupil file · evidence")).toBeVisible();
    await expect(page.getByText("6 of 8 evidence areas complete")).toBeVisible();
    await expect(page.getByText("Professional reports")).toBeVisible();
    await expect(page.getByText("Funding/provision cost evidence")).toBeVisible();

    await page.getByRole("button", { name: "Generate evidence pack" }).click();
    await expect(page.getByText("Pack generated")).toBeVisible();
    await expect(page.getByText("Two missing evidence actions were added")).toBeVisible();
  });

  test("funding reconciliation produces query-ready evidence", async ({ page }) => {
    await openPupilFileArea(page, "Funding");

    await expect(page.getByRole("heading", { name: "Funding action needed for Amelia R." })).toBeVisible();
    await expect(page.getByText("Confidential pupil file · funding")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Transparent funding calculation" })).toBeVisible();
    await expect(page.getByText("Base Element 3 top-up", { exact: true })).toBeVisible();
    await expect(page.getByText("Communication and interaction add-on", { exact: true })).toBeVisible();
    await expect(page.getByText("Agreed LA increase from annual review", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Forecast funding schedule" })).toBeVisible();
    await expect(page.getByText("Forecast from agreed change", { exact: true })).toHaveCount(2);
    await expect(page.getByText("Expected", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Received", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Outstanding", { exact: true })).toBeVisible();
    await expect(page.getByText("Backdated due", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Funding reconciliation/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "LA query pack" })).toBeVisible();
  });

  test("leadership reporting rolls up SENCO work", async ({ page }) => {
    await openView(page, "Leadership");

    await expect(page.getByText("SEND pupils", { exact: true })).toBeVisible();
    await expect(page.getByText("Evidence packs ready", { exact: true })).toBeVisible();
    await expect(page.getByText("Funding variance", { exact: true })).toBeVisible();
    await expect(page.getByText("Governor report", { exact: true })).toBeVisible();
    await expect(page.getByText("SLT Inclusion Brief")).toBeVisible();
    await expect(page.getByText("Governor SEND/Inclusion Report")).toBeVisible();
    await expect(page.getByText("Ofsted Inclusion Evidence Pack")).toBeVisible();
  });
});
