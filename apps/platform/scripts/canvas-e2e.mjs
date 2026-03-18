#!/usr/bin/env node
/**
 * Canvas E2E Test — Full flow: upload → analyse → confirm → reconcile
 */

import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const OUTPUT_DIR = "/tmp/ui-screenshots";
mkdirSync(OUTPUT_DIR, { recursive: true });

const envPath = join(
  new URL(".", import.meta.url).pathname,
  "..",
  ".env.local",
);
const env = {};
try {
  for (const rawLine of readFileSync(envPath, "utf-8").split("\n")) {
    const line = rawLine.replace(/\r$/, "").trim();
    const idx = line.indexOf("=");
    if (idx > 0 && !line.startsWith("#")) {
      env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
} catch {}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE = "http://localhost:3002";

// Create a second test file — payroll export with deliberate differences
const PAYROLL_CSV = `FORENAME,SURNAME,PAYROLL_REF,NI_NO,EMPLOY_START,ANNUAL_SALARY,GRADE,FTE,WORK_EMAIL,HOME_ADDRESS_1,HOME_POSTCODE
Sarah,Johnson,PAY001,AB123456C,01/09/2019,72500,L18,1.0,s.johnson@aurora.sch.uk,15 Elm Street,SW1A 1AA
James,Williams,PAY002,CD234567D,01/09/2020,58000,L12,1.0,j.williams@aurora.sch.uk,42 Oak Road,EC2A 4BX
Emma,Brown,PAY003,EF345678A,01/09/2021,36413,M6,1.0,e.brown@aurora.sch.uk,8 Birch Lane,N1 9GU
Michael,Davies,PAY004,GH456789B,01/09/2018,41604,U2,1.0,m.davies@aurora.sch.uk,22 Pine Close,SE1 7PB
Rachel,Taylor,PAY005,IJ567890C,01/09/2017,44687,U3,1.0,r.taylor@aurora.sch.uk,5 Maple Drive,W1B 3HH
David,Wilson,PAY006,KL678901D,01/09/2022,34502,M4,1.0,d.wilson@aurora.sch.uk,17 Cedar Way,E14 5HP
Lucy,Thomas,PAY007,MN789012A,01/01/2023,33814,M3,1.0,l.thomas@aurora.sch.uk,31 Ash Grove,NW3 2QY
Robert,Evans,PAY008,OP890123B,01/09/2016,39492,U1,1.0,r.evans@aurora.sch.uk,9 Willow Road,BR1 1LU
Sophie,Roberts,PAY009,QR901234C,01/09/2023,30000,M2,1.0,s.roberts@aurora.sch.uk,44 Hazel Court,CR0 1TG
Andrew,Clark,PAY010,ST012345D,01/09/2020,35218,M5,1.0,a.clark@aurora.sch.uk,3 Rowan Place,TW1 3QS
Helen,Lewis,PAY011,UV123456A,01/09/2015,22500,NJC12,0.8,h.lewis@aurora.sch.uk,66 Beech Avenue,KT2 5AU
Mark,Walker,PAY012,WX234567B,01/09/2021,18000,NJC10,0.6,m.walker@aurora.sch.uk,12 Lime Street,IG1 1AT
Claire,Hall,PAY013,YZ345678C,01/09/2019,20000,NJC11,0.8,c.hall@aurora.sch.uk,25 Poplar Lane,RM1 3ER
Peter,Young,PAY014,AB456789D,01/09/2014,28000,NJC16,1.0,p.young@aurora.sch.uk,7 Chestnut Close,DA1 1DZ
Karen,Allen,PAY015,CD567890A,01/09/2018,24000,NJC14,0.8,k.allen@aurora.sch.uk,19 Sycamore Road,ME1 1QX
Jane,Baker,PAY017,GH789012C,01/09/2012,12000,NJC3,0.25,j.baker@aurora.sch.uk,52 Laurel Gardens,CT1 2PU`;

async function run() {
  // Auth
  console.log("Authenticating...");
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({
      email: "ui-test@schoolgle.co.uk",
      password: "UIReview2026x",
    }),
  });
  const session = await res.json();
  if (!session.access_token) {
    console.error("Auth failed:", session);
    return;
  }
  console.log("Authenticated.\n");

  const projectRef = SUPABASE_URL.match(/https:\/\/(\w+)\./)?.[1] || "";
  const storageKey = `sb-${projectRef}-auth-token`;
  const storageValue = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
    expires_in: session.expires_in,
    token_type: "bearer",
    user: session.user,
  });

  // Save payroll CSV to desktop
  writeFileSync("/Users/david/Desktop/payroll_export.csv", PAYROLL_CSV);
  console.log("Created payroll_export.csv on Desktop\n");

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE,
          localStorage: [{ name: storageKey, value: storageValue }],
        },
      ],
    },
  });
  const page = await ctx.newPage();

  // Listen for console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`  [BROWSER ERROR] ${msg.text()}`);
  });

  // ═══════════════════════════════════════════════════════════
  // TEST 1: Upload Arbor CSV and confirm mappings
  // ═══════════════════════════════════════════════════════════
  console.log("═══ TEST 1: Smart Ingest — Arbor Staff Export ═══");

  await page.goto(`${BASE}/dashboard/canvas`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Click Smart Ingest
  await page.getByText("Smart Ingest").click();
  await page.waitForTimeout(1000);

  // Upload Arbor CSV
  console.log("Uploading arbor_staff_export.csv...");
  await page
    .locator('input[type="file"]')
    .setInputFiles("/Users/david/Desktop/arbor_staff_export.csv");
  await page.waitForTimeout(8000);

  // Check for detection banner
  const detectionText = await page
    .locator("text=Detected:")
    .textContent()
    .catch(() => null);
  if (detectionText) {
    console.log(`✅ Source detected: ${detectionText}`);
  } else {
    console.log("❌ No source detection banner found");
    await page.screenshot({ path: `${OUTPUT_DIR}/e2e-fail-detection.png` });
  }

  // Check warnings
  const warnings = await page
    .locator("text=values are empty")
    .allTextContents();
  if (warnings.length > 0) {
    console.log(`✅ Warnings shown: ${warnings.join(", ")}`);
  }

  // Count mapped fields
  const checkboxes = await page.locator('input[type="checkbox"]').count();
  console.log(`✅ Field mappings shown: ${checkboxes} columns`);

  // Check confidence bars
  const highConfidence = await page.locator("text=95%").count();
  console.log(`✅ High confidence (95%+): ${highConfidence} fields`);

  await page.screenshot({ path: `${OUTPUT_DIR}/e2e-01-arbor-mapped.png` });
  console.log("  📸 e2e-01-arbor-mapped.png\n");

  // Click Confirm Mappings
  console.log("Clicking Confirm Mappings...");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const confirmBtn = page.getByText("Confirm Mappings");
  if (await confirmBtn.isVisible()) {
    await confirmBtn.click();
    await page.waitForTimeout(3000);

    const successText = await page
      .locator("text=Mappings Confirmed")
      .textContent()
      .catch(() => null);
    if (successText) {
      console.log("✅ Mappings confirmed successfully!");
    } else {
      console.log("❌ Confirmation may have failed");
    }
    await page.screenshot({ path: `${OUTPUT_DIR}/e2e-02-confirmed.png` });
    console.log("  📸 e2e-02-confirmed.png\n");
  } else {
    console.log("❌ Confirm button not visible");
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 2: Upload Payroll CSV (second source)
  // ═══════════════════════════════════════════════════════════
  console.log("═══ TEST 2: Smart Ingest — Payroll Export ═══");

  // Click Upload Another File or navigate back
  const uploadAnother = page.getByText("Upload Another File");
  if (await uploadAnother.isVisible()) {
    await uploadAnother.click();
    await page.waitForTimeout(1000);
  } else {
    await page.getByText("Smart Ingest").click();
    await page.waitForTimeout(1000);
  }

  console.log("Uploading payroll_export.csv...");
  await page
    .locator('input[type="file"]')
    .setInputFiles("/Users/david/Desktop/payroll_export.csv");
  await page.waitForTimeout(8000);

  const payrollDetection = await page
    .locator("text=Detected:")
    .textContent()
    .catch(() => null);
  if (payrollDetection) {
    console.log(`✅ Source detected: ${payrollDetection}`);
  } else {
    console.log(
      "⚠️  No source detection (payroll format may not match signatures)",
    );
  }

  const payrollMappings = await page.locator('input[type="checkbox"]').count();
  console.log(`✅ Field mappings shown: ${payrollMappings} columns`);

  await page.screenshot({ path: `${OUTPUT_DIR}/e2e-03-payroll-mapped.png` });
  console.log("  📸 e2e-03-payroll-mapped.png\n");

  // ═══════════════════════════════════════════════════════════
  // TEST 3: API direct test — reconciliation
  // ═══════════════════════════════════════════════════════════
  console.log("═══ TEST 3: Reconciliation API ═══");

  const orgId = session.user?.user_metadata?.organization_id || "";

  // Call the reconciliation API directly
  const reconRes = await fetch(
    `${BASE}/api/canvas/reconcile?organizationId=${orgId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        sourceA: {
          name: "arbor",
          entityType: "staff",
          rows: [
            {
              "First Name": "Sarah",
              "Last Name": "Johnson",
              Email: "s.johnson@aurora.sch.uk",
              "NI Number": "AB123456C",
              "Pay Scale": "L18",
            },
            {
              "First Name": "Karen",
              "Last Name": "Allen",
              Email: "",
              "NI Number": "CD567890A",
              "Pay Scale": "NJC14",
            },
            {
              "First Name": "Emma",
              "Last Name": "Brown",
              Email: "e.brown@aurora.sch.uk",
              "NI Number": "EF345678A",
              "Pay Scale": "M6",
            },
          ],
          mappings: [
            { sourceColumn: "First Name", targetField: "first_name" },
            { sourceColumn: "Last Name", targetField: "last_name" },
            { sourceColumn: "Email", targetField: "email" },
            { sourceColumn: "NI Number", targetField: "ni_number" },
            { sourceColumn: "Pay Scale", targetField: "pay_scale" },
          ],
        },
        sourceB: {
          name: "la_payroll",
          entityType: "staff",
          rows: [
            {
              FORENAME: "Sarah",
              SURNAME: "Johnson",
              WORK_EMAIL: "s.johnson@aurora.sch.uk",
              NI_NO: "AB123456C",
              GRADE: "L18",
              HOME_ADDRESS_1: "15 Elm Street",
              HOME_POSTCODE: "SW1A 1AA",
            },
            {
              FORENAME: "Karen",
              SURNAME: "Allen",
              WORK_EMAIL: "k.allen@aurora.sch.uk",
              NI_NO: "CD567890A",
              GRADE: "NJC14",
              HOME_ADDRESS_1: "19 Sycamore Road",
              HOME_POSTCODE: "ME1 1QX",
            },
            {
              FORENAME: "Emma",
              SURNAME: "Brown",
              WORK_EMAIL: "e.brown@aurora.sch.uk",
              NI_NO: "EF345678A",
              GRADE: "M6",
              HOME_ADDRESS_1: "8 Birch Lane",
              HOME_POSTCODE: "N1 9GU",
            },
          ],
          mappings: [
            { sourceColumn: "FORENAME", targetField: "first_name" },
            { sourceColumn: "SURNAME", targetField: "last_name" },
            { sourceColumn: "WORK_EMAIL", targetField: "email" },
            { sourceColumn: "NI_NO", targetField: "ni_number" },
            { sourceColumn: "GRADE", targetField: "pay_scale" },
            { sourceColumn: "HOME_ADDRESS_1", targetField: "address_line_1" },
            { sourceColumn: "HOME_POSTCODE", targetField: "postcode" },
          ],
        },
        businessArea: "staffing_hr",
      }),
    },
  );

  if (reconRes.ok) {
    const reconData = await reconRes.json();
    const recon = reconData.reconciliation;
    console.log(`✅ Reconciliation complete:`);
    console.log(`   Records compared: ${recon.totalRecordsCompared}`);
    console.log(`   Matched: ${recon.matchedRecords}`);
    console.log(`   Conflicts: ${recon.conflictCount}`);
    if (recon.conflicts.length > 0) {
      console.log(
        `   First conflict: ${recon.conflicts[0].entityLabel} — ${recon.conflicts[0].fieldLabel}`,
      );
      console.log(
        `     ${recon.conflicts[0].sourceA}: "${recon.conflicts[0].sourceAValue}"`,
      );
      console.log(
        `     ${recon.conflicts[0].sourceB}: "${recon.conflicts[0].sourceBValue}"`,
      );
      console.log(
        `     Recommendation: ${recon.conflicts[0].recommendationReason}`,
      );
    }
    if (reconData.healthAlerts?.length > 0) {
      console.log(`   Health alerts: ${reconData.healthAlerts.length}`);
      for (const alert of reconData.healthAlerts.slice(0, 3)) {
        console.log(`     [${alert.severity}] ${alert.title}`);
      }
    }
  } else {
    const err = await reconRes.text();
    console.log(`❌ Reconciliation failed: ${reconRes.status} ${err}`);
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 4: Migration API
  // ═══════════════════════════════════════════════════════════
  console.log("\n═══ TEST 4: Migration Report API ═══");

  const migRes = await fetch(
    `${BASE}/api/canvas/migration?organizationId=${orgId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        sourceSystem: {
          name: "Arbor",
          headers: [
            "First Name",
            "Last Name",
            "Email",
            "NI Number",
            "Pay Scale",
          ],
          rows: [
            {
              "First Name": "Sarah",
              "Last Name": "Johnson",
              Email: "s.johnson@aurora.sch.uk",
              "NI Number": "AB123456C",
              "Pay Scale": "L18",
            },
            {
              "First Name": "James",
              "Last Name": "Williams",
              Email: "j.williams@aurora.sch.uk",
              "NI Number": "CD234567D",
              "Pay Scale": "L12",
            },
            {
              "First Name": "Tom",
              "Last Name": "Wright",
              Email: "t.wright@aurora.sch.uk",
              "NI Number": "EF678901B",
              "Pay Scale": "M1",
            },
          ],
          mappings: [
            {
              sourceColumn: "First Name",
              targetEntity: "staff",
              targetField: "first_name",
              confidence: 0.99,
            },
            {
              sourceColumn: "Last Name",
              targetEntity: "staff",
              targetField: "last_name",
              confidence: 0.99,
            },
            {
              sourceColumn: "Email",
              targetEntity: "staff",
              targetField: "email",
              confidence: 0.99,
            },
            {
              sourceColumn: "NI Number",
              targetEntity: "staff",
              targetField: "ni_number",
              confidence: 0.99,
            },
            {
              sourceColumn: "Pay Scale",
              targetEntity: "staff",
              targetField: "pay_scale",
              confidence: 0.95,
            },
          ],
        },
        targetSystem: {
          name: "Bromcom",
          headers: [
            "Forename",
            "Surname",
            "EmailAddress",
            "NINumber",
            "PayPoint",
          ],
          rows: [
            {
              Forename: "Sarah",
              Surname: "Johnson",
              EmailAddress: "s.johnson@aurora.sch.uk",
              NINumber: "AB123456C",
              PayPoint: "L18",
            },
            {
              Forename: "James",
              Surname: "Williams",
              EmailAddress: "j.williams@aurora.sch.uk",
              NINumber: "CD234567D",
              PayPoint: "L12",
            },
          ],
          mappings: [
            {
              sourceColumn: "Forename",
              targetEntity: "staff",
              targetField: "first_name",
              confidence: 0.99,
            },
            {
              sourceColumn: "Surname",
              targetEntity: "staff",
              targetField: "last_name",
              confidence: 0.99,
            },
            {
              sourceColumn: "EmailAddress",
              targetEntity: "staff",
              targetField: "email",
              confidence: 0.99,
            },
            {
              sourceColumn: "NINumber",
              targetEntity: "staff",
              targetField: "ni_number",
              confidence: 0.99,
            },
            {
              sourceColumn: "PayPoint",
              targetEntity: "staff",
              targetField: "pay_scale",
              confidence: 0.85,
            },
          ],
        },
        entityType: "staff",
      }),
    },
  );

  if (migRes.ok) {
    const migData = await migRes.json();
    const r = migData.report;
    console.log(`✅ Migration report generated:`);
    console.log(`   Readiness: ${r.readinessScore}/100 — ${r.readinessLabel}`);
    console.log(`   From: ${r.fromSystem} (${r.records.sourceCount} records)`);
    console.log(`   To: ${r.toSystem} (${r.records.targetCount} records)`);
    console.log(`   Matched: ${r.records.matchedCount}`);
    console.log(`   Only in ${r.fromSystem}: ${r.records.onlyInSource.length}`);
    if (r.records.onlyInSource.length > 0) {
      console.log(
        `     Missing: ${r.records.onlyInSource.map((s) => s.label).join(", ")}`,
      );
    }
    console.log(
      `   Field mapping: ${r.fieldMapping.autoMappedFields}/${r.fieldMapping.totalSourceFields} auto-mapped`,
    );
    console.log(`   Conflicts: ${r.reconciliation.conflictCount}`);
    console.log(`   Actions: ${r.actions.length}`);
    for (const a of r.actions) {
      console.log(`     [${a.priority.toUpperCase()}] ${a.title}`);
    }
  } else {
    const err = await migRes.text();
    console.log(`❌ Migration report failed: ${migRes.status} ${err}`);
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 5: Templates API
  // ═══════════════════════════════════════════════════════════
  console.log("\n═══ TEST 5: Templates API ═══");

  const tmplRes = await fetch(
    `${BASE}/api/canvas/templates?organizationId=${orgId}`,
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  );
  if (tmplRes.ok) {
    const tmplData = await tmplRes.json();
    console.log(
      `✅ Templates loaded: ${tmplData.totalSystem} system + ${tmplData.totalCustom} custom`,
    );
    const areas = [...new Set(tmplData.templates.map((t) => t.businessArea))];
    console.log(`   Business areas: ${areas.join(", ")}`);
  } else {
    console.log(`❌ Templates failed: ${tmplRes.status}`);
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 6: Spreadsheet download API
  // ═══════════════════════════════════════════════════════════
  console.log("\n═══ TEST 6: Spreadsheet Download API ═══");

  const xlsxRes = await fetch(
    `${BASE}/api/canvas/spreadsheet?organizationId=${orgId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        type: "data",
        title: "Test Export",
        headers: ["Name", "Role", "Email"],
        rows: [
          ["Sarah Johnson", "Headteacher", "s.johnson@aurora.sch.uk"],
          ["James Williams", "Deputy Head", "j.williams@aurora.sch.uk"],
        ],
      }),
    },
  );
  if (xlsxRes.ok) {
    const xlsxBuf = await xlsxRes.arrayBuffer();
    console.log(`✅ Spreadsheet generated: ${xlsxBuf.byteLength} bytes`);
    const contentType = xlsxRes.headers.get("content-type");
    console.log(`   Content-Type: ${contentType}`);
    const disposition = xlsxRes.headers.get("content-disposition");
    console.log(`   Filename: ${disposition}`);
  } else {
    const err = await xlsxRes.text();
    console.log(`❌ Spreadsheet failed: ${xlsxRes.status} ${err}`);
  }

  // Final screenshot — reconciliation tab
  console.log("\n═══ Final Screenshots ═══");
  await page.goto(`${BASE}/dashboard/canvas`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.getByText("Data Reconciliation").click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUTPUT_DIR}/e2e-04-recon-tab.png` });
  console.log("  📸 e2e-04-recon-tab.png");

  console.log("\n═══ ALL TESTS COMPLETE ═══\n");
  await browser.close();
}

run().catch(console.error);
