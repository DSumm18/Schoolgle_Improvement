#!/usr/bin/env node
/**
 * Generate 3 years of monthly energy invoices and half-hourly data files
 * for Aurora Primary School test harness.
 *
 * Output: test-harness/aurora-primary/energy-invoices/
 *   - 36 electricity PDF invoices (3 pages each) + JSON sidecar files
 *   - 36 gas PDF invoices (3 pages each) + JSON sidecar files
 *   - 36 half-hourly CSV files
 *
 * Run: node scripts/generate-monthly-invoices.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "test-harness",
  "aurora-primary",
  "energy-invoices",
);

// ─── Constants ────────────────────────────────────────────

const ELEC = {
  mpan: "03-801-110-13-0000-6945-816",
  mpanShort: "6945816",
  supplier: "EDF Energy",
  meterSerial: "E19K02843",
  customer: "Aurora Primary School",
  address:
    "Aurora Primary School, 15 School Lane, Oakworth, Bradford, BD22 7PX",
  accountRef: "EDF-SCH-78291",
  contractRef: "EDF-FX-2023-78291",
  agreedCapacity: 100, // kVA
};

const GAS = {
  mprn: "3574829103",
  supplier: "British Gas",
  meterSerial: "G4S01982",
  customer: "Aurora Primary School",
  address:
    "Aurora Primary School, 15 School Lane, Oakworth, Bradford, BD22 7PX",
  accountRef: "BG-7829103-01",
  contractRef: "BG-FX-2023-7829103",
  correctionFactor: 1.02264,
  calorificValue: 39.2,
};

// Rates by financial year (Apr-Mar)
const ELEC_RATES = {
  "2023-24": { unit: 29.5, standing: 48, ccl: 0.775 },
  "2024-25": { unit: 28.1, standing: 50, ccl: 0.775 },
  "2025-26": { unit: 27.4, standing: 53, ccl: 0.812 },
};

const GAS_RATES = {
  "2023-24": { unit: 7.8, standing: 29, ccl: 0.568 },
  "2024-25": { unit: 7.1, standing: 28, ccl: 0.568 },
  "2025-26": { unit: 6.8, standing: 27, ccl: 0.595 },
};

// Electricity other charge rates (p/kWh or p/day as noted)
const ELEC_OTHER_RATES = {
  duos: 2.1, // p/kWh - Distribution Use of System
  tnuos: 0.8, // p/kWh - Transmission Network Use of System
  bsuos: 0.3, // p/kWh - Balancing Services Use of System
  meterOp: 12.0, // p/day - Meter Operator Charge
  ro: 1.2, // p/kWh - Renewables Obligation
  cfd: 0.5, // p/kWh - Contracts for Difference / FiT
  capacityMarket: 0.3, // p/kWh - Capacity Market
};

// Gas other charge rates
const GAS_OTHER_RATES = {
  admin: 2.2, // p/kWh - Consumption Based Administration
  transport: 0.09, // p/kWh - Consumption Based Transportation
  meterRead: 18.7, // p/day - Meter Read Cost
  metering: 15.2, // p/day - Metering Charge
  ncTransport: 239, // p/day - Non-Consumption Based Transportation (£2.39/day = 239p/day)
  uig: 0.26, // p/kWh - Unidentified Gas Estimate
};

// Base monthly kWh (index 0=Jan)
const ELEC_KWH = [
  14500, 13800, 13200, 12100, 11400, 10800, 9200, 7500, 11800, 12600, 13500,
  14200,
];
const GAS_KWH = [
  48000, 42000, 32000, 18000, 5000, 1500, 800, 800, 5000, 22000, 35000, 45000,
];

const CO2_FACTOR = 0.23314; // kg CO2 per kWh electricity
const GAS_CO2_FACTOR = 0.18316; // kg CO2 per kWh gas

// ─── Term Date Calendar ───────────────────────────────────

function isSchoolHoliday(date) {
  const m = date.getMonth();
  const d = date.getDate();

  if ((m === 6 && d >= 20) || m === 7 || (m === 8 && d <= 3)) return true;
  if ((m === 11 && d >= 20) || (m === 0 && d <= 3)) return true;
  if ((m === 9 && d >= 25) || (m === 10 && d <= 1)) return true;
  if (m === 1 && d >= 17 && d <= 21) return true;
  if (m === 3 && d >= 5 && d <= 18) return true;
  if (m === 4 && d >= 26 && d <= 30) return true;

  return false;
}

function isWeekend(date) {
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}

// ─── Helpers ──────────────────────────────────────────────

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatDateUK(d) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatDateLong(d) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function financialYear(year, month) {
  if (month >= 3) return `${year}-${String(year + 1).slice(2)}`;
  return `${year - 1}-${String(year).slice(2)}`;
}

function addNoise(base, pct = 0.05) {
  const factor = 1 + (Math.random() * 2 - 1) * pct;
  return Math.round(base * factor);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function fmtMoney(n) {
  return n.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtNum(n) {
  return n.toLocaleString("en-GB");
}

function fmtRate(n, decimals = 3) {
  return n.toFixed(decimals);
}

// ─── Generate months Apr 2023 -> Mar 2026 ─────────────────

function generateMonths() {
  const months = [];
  for (let y = 2023; y <= 2025; y++) {
    const startMonth = y === 2023 ? 3 : 0;
    const endMonth = 11;
    for (let m = startMonth; m <= endMonth; m++) {
      if (y === 2023 && m < 3) continue;
      const monthKey = `${y}-${pad2(m + 1)}`;
      if (monthKey >= "2023-04" && monthKey <= "2026-03") {
        months.push({ year: y, month: m });
      }
    }
  }
  for (let m = 0; m <= 2; m++) {
    months.push({ year: 2026, month: m });
  }
  return months;
}

// ─── Shared CSS ──────────────────────────────────────────

function sharedCSS(brandColor, brandGradient) {
  return `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 10pt; color: #1a1a1a; padding: 0; }
  .page { width: 210mm; min-height: 297mm; padding: 18mm 20mm 15mm 20mm; position: relative; }
  .page-break { page-break-before: always; }

  .header { background: ${brandGradient || brandColor}; color: white; padding: 14px 24px; margin: -18mm -20mm 14px -20mm; padding-top: 20px; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { font-size: 22pt; font-weight: 700; letter-spacing: 1px; }
  .header-right { text-align: right; }
  .header-sub { font-size: 8pt; color: rgba(255,255,255,0.8); margin-top: 3px; }

  .page-title { font-size: 16pt; font-weight: 700; color: ${brandColor.replace(/linear-gradient.*/, brandColor)}; margin: 8px 0 14px 0; border-bottom: 2px solid ${brandColor.replace(/linear-gradient.*/, brandColor)}; padding-bottom: 6px; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px; }

  .info-box { border: 1px solid #d0d0d0; border-radius: 4px; padding: 10px 12px; }
  .info-box h3 { font-size: 7.5pt; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-bottom: 5px; font-weight: 600; }
  .info-row { display: flex; justify-content: space-between; font-size: 9pt; margin: 2px 0; }
  .info-row .label { color: #555; }
  .info-row .value { font-weight: 600; }

  .summary-box { background: #f7f9fc; border: 1px solid #d0d0d0; border-radius: 4px; padding: 10px 12px; margin-bottom: 14px; }
  .summary-box h3 { font-size: 7.5pt; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-bottom: 5px; font-weight: 600; }
  .summary-total { font-size: 14pt; font-weight: 700; color: ${brandColor.replace(/linear-gradient.*/, brandColor)}; margin-top: 6px; }

  .sidebar { background: #f0f4f8; border: 1px solid #d0d0d0; border-radius: 4px; padding: 10px 12px; }
  .sidebar h3 { font-size: 7.5pt; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-bottom: 5px; font-weight: 600; }
  .sidebar p { font-size: 8.5pt; color: #444; margin: 3px 0; line-height: 1.4; }
  .sidebar .emergency { color: #c00; font-weight: 700; font-size: 9pt; }

  .payment-callout { background: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 4px; padding: 10px 14px; margin-bottom: 14px; font-size: 9.5pt; }
  .payment-callout strong { color: #2e7d32; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt; }
  th { background: ${brandColor.replace(/linear-gradient.*/, brandColor)}; color: white; text-align: left; padding: 6px 8px; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; }
  tr:last-child td { border-bottom: none; }
  .align-right { text-align: right; }
  .align-center { text-align: center; }
  .row-total td { border-top: 2px solid #333; font-weight: 700; }
  .row-subtotal td { border-top: 1px solid #999; font-weight: 600; }

  .vat-table { width: 50%; margin-left: auto; margin-bottom: 14px; }
  .vat-table td { font-size: 9pt; padding: 4px 8px; }
  .vat-table .grand-total td { background: ${brandColor.replace(/linear-gradient.*/, brandColor)}; color: white; font-weight: 700; font-size: 11pt; }

  .section-heading { font-size: 11pt; font-weight: 700; color: #333; margin: 14px 0 6px 0; border-bottom: 1px solid #ddd; padding-bottom: 4px; }

  .info-section { margin-bottom: 14px; }
  .info-section h3 { font-size: 9.5pt; font-weight: 700; color: #333; margin-bottom: 4px; }
  .info-section p { font-size: 8.5pt; color: #444; line-height: 1.5; margin: 2px 0; }

  .meter-callout { background: #fff3e0; border: 1px solid #ffcc80; border-radius: 4px; padding: 8px 12px; margin: 10px 0; font-size: 8.5pt; text-align: center; }
  .meter-callout strong { color: #e65100; }

  .reading-key { font-size: 8pt; color: #666; margin: 4px 0 8px 0; }
  .reading-key span { margin-right: 12px; }

  .footer { text-align: center; font-size: 7.5pt; color: #999; border-top: 1px solid #e0e0e0; padding-top: 6px; position: absolute; bottom: 10mm; left: 20mm; right: 20mm; }
  .footer-text { margin-bottom: 2px; }
  `;
}

// ─── Electricity Invoice HTML (3 pages) ───────────────────

function buildElecInvoiceHTML(data) {
  const {
    invoiceNum,
    invoiceDate,
    dueDate,
    periodStart,
    periodEnd,
    days,
    openingReading,
    closingReading,
    kwhUsed,
    rates,
    energyCharge,
    standingTotal,
    cclCharge,
    otherCharges,
    otherChargesTotal,
    netAmount,
    vatAmount,
    totalAmount,
    co2Tonnes,
  } = data;

  const vatNet = netAmount;
  const brandColor = "#003DA5";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  ${sharedCSS(brandColor, brandColor)}
  .summary-box { background: #f0f4ff; }
  .page-title { color: #003DA5; border-bottom-color: #003DA5; }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════ PAGE 1: SUMMARY ═══ -->
<div class="page">
  <div class="header">
    <div>
      <h1>EDF Energy</h1>
      <div class="header-sub">90 Whitfield Street, London, W1T 4EZ</div>
    </div>
    <div class="header-right">
      <div style="font-size: 9pt; font-weight: 600;">Electricity Supply</div>
      <div class="header-sub">VAT Registration: GB 927 7219 46</div>
    </div>
  </div>

  <div class="page-title">Your Electricity Invoice Summary</div>

  <div class="two-col">
    <div>
      <div class="info-box" style="margin-bottom: 12px;">
        <h3>Customer</h3>
        <div style="font-weight: 600; font-size: 10pt; margin-bottom: 4px;">${ELEC.customer}</div>
        <div style="font-size: 9pt; color: #555; line-height: 1.5;">15 School Lane<br>Oakworth<br>Bradford<br>BD22 7PX</div>
      </div>

      <div class="summary-box">
        <h3>Your Charges Summary</h3>
        <div class="info-row"><span class="label">Total Electricity Consumed</span><span class="value">${fmtNum(kwhUsed)} kWh</span></div>
        <div class="info-row"><span class="label">Consumption Charges</span><span class="value">&pound;${fmtMoney(energyCharge)}</span></div>
        <div class="info-row"><span class="label">Standing Charge</span><span class="value">&pound;${fmtMoney(standingTotal)}</span></div>
        <div class="info-row"><span class="label">Other Charges and Adjustments</span><span class="value">&pound;${fmtMoney(otherChargesTotal)}</span></div>
        <div class="info-row"><span class="label">Climate Change Levy</span><span class="value">&pound;${fmtMoney(cclCharge)}</span></div>
        <div class="info-row" style="border-top: 1px solid #ccc; padding-top: 4px; margin-top: 4px;"><span class="label"><strong>Total Excluding VAT</strong></span><span class="value"><strong>&pound;${fmtMoney(netAmount)}</strong></span></div>
        <div class="info-row"><span class="label">VAT @ 5%</span><span class="value">&pound;${fmtMoney(vatAmount)}</span></div>
        <div class="summary-total">Total Amount Payable: &pound;${fmtMoney(totalAmount)}</div>
      </div>

      <div class="payment-callout">
        <strong>&pound;${fmtMoney(totalAmount)}</strong> will be collected by Direct Debit on or after <strong>${formatDateUK(dueDate)}</strong>
      </div>

      <div class="info-box">
        <h3>Your VAT Summary</h3>
        <table style="margin-bottom: 0;">
          <thead><tr><th>Description</th><th class="align-right">Net</th><th class="align-right">Rate</th><th class="align-right">VAT Due</th></tr></thead>
          <tbody>
            <tr><td>Electricity Supply</td><td class="align-right">&pound;${fmtMoney(vatNet)}</td><td class="align-right">5.00%</td><td class="align-right">&pound;${fmtMoney(vatAmount)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <div class="info-box" style="margin-bottom: 12px;">
        <h3>Invoice Details</h3>
        <div class="info-row"><span class="label">Invoice Number</span><span class="value">${invoiceNum}</span></div>
        <div class="info-row"><span class="label">Date of Invoice</span><span class="value">${formatDateUK(invoiceDate)}</span></div>
        <div class="info-row"><span class="label">Invoice Period</span><span class="value">${formatDateUK(periodStart)} &ndash; ${formatDateUK(periodEnd)}</span></div>
        <div class="info-row"><span class="label">Account Number</span><span class="value">${ELEC.accountRef}</span></div>
        <div class="info-row"><span class="label">Due Date</span><span class="value">${formatDateUK(dueDate)}</span></div>
        <div class="info-row"><span class="label">Contract Ref</span><span class="value">${ELEC.contractRef}</span></div>
      </div>

      <div class="sidebar">
        <h3>Any Questions?</h3>
        <p><strong>Email:</strong> business@edfenergy.com</p>
        <p><strong>Phone:</strong> 0345 055 2277</p>
        <p><strong>Payment Line:</strong> 0800 096 9000</p>
        <p><strong>Opening Hours:</strong></p>
        <p>Mon-Fri: 8am - 6pm</p>
        <p>Sat: 8am - 2pm</p>
        <p style="margin-top: 8px;"><strong>Website:</strong> edfenergy.com/business</p>
        <p style="margin-top: 10px;" class="emergency">Electricity Emergencies: 105</p>
        <p style="font-size: 8pt; color: #666; margin-top: 2px;">(24-hour national power cut number)</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-text">This is a tax invoice &nbsp;|&nbsp; EDF Energy Customers Ltd &nbsp;|&nbsp; Registered in England &amp; Wales No. 02228297</div>
    <div>Registered Office: 90 Whitfield Street, London, W1T 4EZ &nbsp;|&nbsp; Page 1 of 3</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════ PAGE 2: FURTHER INFO ═══ -->
<div class="page page-break">
  <div class="header">
    <div>
      <h1>EDF Energy</h1>
      <div class="header-sub">Further Information</div>
    </div>
    <div class="header-right">
      <div style="font-size: 9pt;">${invoiceNum}</div>
    </div>
  </div>

  <div class="page-title">Further Information</div>

  <div class="two-col">
    <div>
      <div class="info-section">
        <h3>Paying Your Invoice</h3>
        <p><strong>Direct Debit:</strong> Your payment of &pound;${fmtMoney(totalAmount)} will be collected on or after ${formatDateUK(dueDate)}. If you need to change your Direct Debit instruction, please contact us at least 5 working days before the collection date.</p>
        <p style="margin-top: 6px;"><strong>BACS/CHAPS:</strong></p>
        <p>Bank: Barclays Bank plc</p>
        <p>Sort Code: 20-00-00</p>
        <p>Account No: 30985721</p>
        <p>Reference: ${ELEC.accountRef}</p>
        <p style="margin-top: 6px;"><strong>Cheque:</strong> Please make payable to "EDF Energy Customers Ltd" and post to our address shown on page 1. Please write your account number on the reverse.</p>
      </div>

      <div class="info-section">
        <h3>Understanding Your Electricity Charges</h3>
        <p>Your electricity charges are made up of several components:</p>
        <p style="margin-top: 4px;"><strong>Consumption Charges:</strong> The cost of the electricity you have used, calculated by multiplying your metered consumption (kWh) by your contracted unit rate.</p>
        <p style="margin-top: 4px;"><strong>Standing Charge:</strong> A daily charge for maintaining your supply connection to the distribution network.</p>
        <p style="margin-top: 4px;"><strong>Distribution Use of System (DUoS):</strong> Charges levied by your local distribution network operator for transporting electricity from the transmission network to your premises.</p>
        <p style="margin-top: 4px;"><strong>Transmission Network Use of System (TNUoS):</strong> Charges for transporting electricity across the high-voltage national transmission network.</p>
        <p style="margin-top: 4px;"><strong>Balancing Services Use of System (BSUoS):</strong> Costs incurred by National Grid ESO for balancing electricity supply and demand in real time.</p>
      </div>

      <div class="info-section">
        <h3>Renewables Obligation (RO)</h3>
        <p>A government scheme requiring licensed electricity suppliers to source a proportion of their supply from renewable sources. The cost of compliance is passed through to customers.</p>
      </div>

      <div class="info-section">
        <h3>Contracts for Difference (CfD) / Feed-in Tariff (FiT)</h3>
        <p>Government levies supporting low-carbon electricity generation. These are statutory charges applied to all non-domestic supplies.</p>
      </div>
    </div>

    <div>
      <div class="info-section">
        <h3>Capacity Market</h3>
        <p>A government scheme to ensure security of electricity supply. Capacity providers are paid to ensure generation capacity is available when needed, and these costs are recovered from suppliers.</p>
      </div>

      <div class="info-section">
        <h3>Climate Change Levy (CCL)</h3>
        <p>The CCL is a government environmental tax on the supply of energy to non-domestic consumers. Schools and academies are generally liable for CCL at the standard rate unless they hold a Climate Change Agreement.</p>
        <p style="margin-top: 4px;">Current CCL rate for electricity: ${rates.ccl}p per kWh.</p>
        <p style="margin-top: 4px;">If you believe your organisation qualifies for reduced-rate CCL or exemption, please provide us with a valid exemption certificate.</p>
      </div>

      <div class="info-section">
        <h3>Value Added Tax (VAT)</h3>
        <p>Energy supplied to schools and other qualifying institutions is normally charged at the reduced rate of 5% VAT, provided usage does not exceed 33 units of electricity per day (approximately 1,000 kWh per month) or the supply is solely for non-business purposes.</p>
        <p style="margin-top: 4px;">If your school uses energy partly for business purposes (e.g. lettings), the business proportion may be charged at the standard rate of 20%.</p>
        <p style="margin-top: 4px;">Please provide a VAT declaration form if your circumstances change.</p>
      </div>

      <div class="info-section">
        <h3>Complaints</h3>
        <p>If you are unhappy with any aspect of our service, please contact our Business Customer Services team on 0345 055 2277 or email business@edfenergy.com.</p>
        <p style="margin-top: 4px;">If we are unable to resolve your complaint, you may refer it to the Energy Ombudsman at ombudsman-services.org or call 0330 440 1624.</p>
      </div>

      <div class="info-section">
        <h3>Moving Premises</h3>
        <p>If you are vacating these premises, please contact us at least 28 days in advance with your final meter reading and forwarding address for the final invoice.</p>
      </div>

      <div class="info-section" style="background: #fff3e0; border: 1px solid #ffcc80; border-radius: 4px; padding: 10px 12px;">
        <h3 style="color: #e65100;">Electricity Emergencies</h3>
        <p style="font-size: 10pt; font-weight: 700; color: #c00;">Call 105</p>
        <p>The national power cut number &mdash; available 24 hours a day, 7 days a week. This is a free service operated by your local distribution network operator.</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-text">EDF Energy Customers Ltd &nbsp;|&nbsp; Registered in England &amp; Wales No. 02228297</div>
    <div>Page 2 of 3</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════ PAGE 3: BREAKDOWN ═══ -->
<div class="page page-break">
  <div class="header">
    <div>
      <h1>EDF Energy</h1>
      <div class="header-sub">Invoice Breakdown</div>
    </div>
    <div class="header-right">
      <div style="font-size: 9pt;">${invoiceNum}</div>
    </div>
  </div>

  <div class="page-title">Your Invoice Breakdown</div>

  <div class="info-box" style="margin-bottom: 12px;">
    <h3>Supply Address</h3>
    <div style="font-size: 9pt;">${ELEC.customer}, 15 School Lane, Oakworth, Bradford, BD22 7PX</div>
  </div>

  <div class="section-heading">Consumption Information</div>
  <table>
    <thead>
      <tr>
        <th>MPAN</th>
        <th>Serial No.</th>
        <th class="align-right">Previous Read</th>
        <th class="align-center">Prev Date</th>
        <th class="align-right">Current Read</th>
        <th class="align-center">Curr Date</th>
        <th class="align-right">Units (kWh)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${ELEC.mpan}</td>
        <td>${ELEC.meterSerial}</td>
        <td class="align-right">${fmtNum(openingReading)} (A)</td>
        <td class="align-center">${formatDateUK(periodStart)}</td>
        <td class="align-right">${fmtNum(closingReading)} (A)</td>
        <td class="align-center">${formatDateUK(periodEnd)}</td>
        <td class="align-right"><strong>${fmtNum(kwhUsed)}</strong></td>
      </tr>
    </tbody>
  </table>
  <div class="reading-key"><span><strong>A</strong> = Actual</span><span><strong>C</strong> = Customer</span><span><strong>E</strong> = Estimated</span></div>

  <div style="margin-bottom: 4px; font-size: 9pt;"><strong>Total Electricity Consumed: ${fmtNum(kwhUsed)} kWh</strong></div>

  <div class="section-heading">Consumption Charges</div>
  <table>
    <thead><tr><th>Charge Description</th><th class="align-center">Start</th><th class="align-center">End</th><th class="align-right">Energy (kWh)</th><th class="align-right">Price (p/kWh)</th><th class="align-center">VAT Rate</th><th class="align-right">Total (&pound;)</th></tr></thead>
    <tbody>
      <tr>
        <td>Flexible Product Charge</td>
        <td class="align-center">${formatDateUK(periodStart)}</td>
        <td class="align-center">${formatDateUK(periodEnd)}</td>
        <td class="align-right">${fmtNum(kwhUsed)}</td>
        <td class="align-right">${fmtRate(rates.unit, 2)}</td>
        <td class="align-center">5%</td>
        <td class="align-right">${fmtMoney(energyCharge)}</td>
      </tr>
      <tr>
        <td>Standing Charge</td>
        <td class="align-center">${formatDateUK(periodStart)}</td>
        <td class="align-center">${formatDateUK(periodEnd)}</td>
        <td class="align-right">${days} days</td>
        <td class="align-right">${fmtRate(rates.standing, 2)} p/day</td>
        <td class="align-center">5%</td>
        <td class="align-right">${fmtMoney(standingTotal)}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-heading">Other Charges and Adjustments</div>
  <table>
    <thead><tr><th>Charge Description</th><th class="align-center">Start</th><th class="align-center">End</th><th class="align-right">Quantity</th><th class="align-right">Price</th><th class="align-center">VAT Rate</th><th class="align-right">Total (&pound;)</th></tr></thead>
    <tbody>
      ${otherCharges
        .map(
          (c) => `<tr>
        <td>${c.description}</td>
        <td class="align-center">${formatDateUK(periodStart)}</td>
        <td class="align-center">${formatDateUK(periodEnd)}</td>
        <td class="align-right">${c.quantityStr}</td>
        <td class="align-right">${c.priceStr}</td>
        <td class="align-center">5%</td>
        <td class="align-right">${fmtMoney(c.amount)}</td>
      </tr>`,
        )
        .join("\n      ")}
      <tr class="row-subtotal">
        <td colspan="6"><strong>Total Other Charges and Adjustments</strong></td>
        <td class="align-right"><strong>${fmtMoney(otherChargesTotal)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="section-heading">Climate Change Levy</div>
  <table>
    <thead><tr><th>Charge Description</th><th class="align-center">Start</th><th class="align-center">End</th><th class="align-right">Energy (kWh)</th><th class="align-right">Price (p/kWh)</th><th class="align-center">VAT Rate</th><th class="align-right">Total (&pound;)</th></tr></thead>
    <tbody>
      <tr>
        <td>Climate Change Levy</td>
        <td class="align-center">${formatDateUK(periodStart)}</td>
        <td class="align-center">${formatDateUK(periodEnd)}</td>
        <td class="align-right">${fmtNum(kwhUsed)}</td>
        <td class="align-right">${fmtRate(rates.ccl)}</td>
        <td class="align-center">N/A</td>
        <td class="align-right">${fmtMoney(cclCharge)}</td>
      </tr>
    </tbody>
  </table>

  <table class="vat-table">
    <tbody>
      <tr><td><strong>Total Charges Excluding VAT</strong></td><td class="align-right"><strong>&pound;${fmtMoney(netAmount)}</strong></td></tr>
      <tr><td>VAT @ 5% on &pound;${fmtMoney(vatNet)}</td><td class="align-right">&pound;${fmtMoney(vatAmount)}</td></tr>
      <tr class="grand-total"><td>Total Charges</td><td class="align-right">&pound;${fmtMoney(totalAmount)}</td></tr>
    </tbody>
  </table>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
    <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 8px 12px; font-size: 9pt;">
      <strong style="color: #2e7d32;">CO\u2082 Emissions:</strong> ${co2Tonnes.toFixed(2)} tonnes<br>
      <span style="font-size: 8pt; color: #666;">Based on ${fmtNum(kwhUsed)} kWh &times; ${CO2_FACTOR} kg/kWh</span>
    </div>
    <div class="meter-callout">
      <strong>Send your meter readings to:</strong><br>
      meterreads@edfenergy.com<br>
      or call 0345 055 2277
    </div>
  </div>

  <div class="footer">
    <div class="footer-text">EDF Energy Customers Ltd &nbsp;|&nbsp; Registered in England &amp; Wales No. 02228297</div>
    <div>Page 3 of 3</div>
  </div>
</div>

</body>
</html>`;
}

// ─── Gas Invoice HTML (3 pages) ──────────────────────────

function buildGasInvoiceHTML(data) {
  const {
    invoiceNum,
    invoiceDate,
    dueDate,
    periodStart,
    periodEnd,
    days,
    openingReadingM3,
    closingReadingM3,
    m3Used,
    kwhUsed,
    rates,
    energyCharge,
    standingTotal,
    cclCharge,
    otherCharges,
    otherChargesTotal,
    netAmount,
    vatAmount,
    totalAmount,
    co2Tonnes,
  } = data;

  const vatNet = netAmount;
  const brandColor = "#FF6B00";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  ${sharedCSS(brandColor, "linear-gradient(135deg, #FF6B00 0%, #003DA5 100%)")}
  .summary-box { background: #fff8f0; }
  .page-title { color: #FF6B00; border-bottom-color: #FF6B00; }
  th { background: #FF6B00; }
  .summary-total { color: #FF6B00; }
  .vat-table .grand-total td { background: #FF6B00; }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════ PAGE 1: SUMMARY ═══ -->
<div class="page">
  <div class="header">
    <div>
      <h1>British Gas</h1>
      <div class="header-sub">Millstream, Maidenhead Road, Windsor, Berkshire, SL4 5GD</div>
    </div>
    <div class="header-right">
      <div style="font-size: 9pt; font-weight: 600;">Gas Supply</div>
      <div class="header-sub">VAT Registration: GB 684 4929 14</div>
    </div>
  </div>

  <div class="page-title">Your Gas Invoice Summary</div>

  <div class="two-col">
    <div>
      <div class="info-box" style="margin-bottom: 12px;">
        <h3>Customer</h3>
        <div style="font-weight: 600; font-size: 10pt; margin-bottom: 4px;">${GAS.customer}</div>
        <div style="font-size: 9pt; color: #555; line-height: 1.5;">15 School Lane<br>Oakworth<br>Bradford<br>BD22 7PX</div>
      </div>

      <div class="summary-box">
        <h3>Your Charges Summary</h3>
        <div class="info-row"><span class="label">Total Gas Consumed</span><span class="value">${fmtNum(kwhUsed)} kWh</span></div>
        <div class="info-row"><span class="label">Consumption Charges</span><span class="value">&pound;${fmtMoney(energyCharge)}</span></div>
        <div class="info-row"><span class="label">Other Charges and Adjustments</span><span class="value">&pound;${fmtMoney(otherChargesTotal)}</span></div>
        <div class="info-row"><span class="label">Climate Change Levy</span><span class="value">&pound;${fmtMoney(cclCharge)}</span></div>
        <div class="info-row" style="border-top: 1px solid #ccc; padding-top: 4px; margin-top: 4px;"><span class="label"><strong>Total Excluding VAT</strong></span><span class="value"><strong>&pound;${fmtMoney(netAmount)}</strong></span></div>
        <div class="info-row"><span class="label">VAT @ 5%</span><span class="value">&pound;${fmtMoney(vatAmount)}</span></div>
        <div class="summary-total">Total Amount Payable: &pound;${fmtMoney(totalAmount)}</div>
      </div>

      <div class="payment-callout">
        <strong>&pound;${fmtMoney(totalAmount)}</strong> will be collected by Direct Debit on or after <strong>${formatDateUK(dueDate)}</strong>
      </div>

      <div class="info-box">
        <h3>Your VAT Summary</h3>
        <table style="margin-bottom: 0;">
          <thead><tr><th>Description</th><th class="align-right">Net</th><th class="align-right">Rate</th><th class="align-right">VAT Due</th></tr></thead>
          <tbody>
            <tr><td>Gas Supply</td><td class="align-right">&pound;${fmtMoney(vatNet)}</td><td class="align-right">5.00%</td><td class="align-right">&pound;${fmtMoney(vatAmount)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <div class="info-box" style="margin-bottom: 12px;">
        <h3>Invoice Details</h3>
        <div class="info-row"><span class="label">Invoice Number</span><span class="value">${invoiceNum}</span></div>
        <div class="info-row"><span class="label">Date of Invoice</span><span class="value">${formatDateUK(invoiceDate)}</span></div>
        <div class="info-row"><span class="label">Invoice Period</span><span class="value">${formatDateUK(periodStart)} &ndash; ${formatDateUK(periodEnd)}</span></div>
        <div class="info-row"><span class="label">Account Number</span><span class="value">${GAS.accountRef}</span></div>
        <div class="info-row"><span class="label">Due Date</span><span class="value">${formatDateUK(dueDate)}</span></div>
        <div class="info-row"><span class="label">Contract Ref</span><span class="value">${GAS.contractRef}</span></div>
      </div>

      <div class="sidebar">
        <h3>Any Questions?</h3>
        <p><strong>Email:</strong> businessenergy@britishgas.co.uk</p>
        <p><strong>Phone:</strong> 0333 202 9802</p>
        <p><strong>Payment Line:</strong> 0800 107 0190</p>
        <p><strong>Opening Hours:</strong></p>
        <p>Mon-Fri: 8am - 6pm</p>
        <p>Sat: 8am - 1pm</p>
        <p style="margin-top: 8px;"><strong>Website:</strong> britishgas.co.uk/business</p>
        <p style="margin-top: 10px;" class="emergency">Gas Emergencies: 0800 111 999</p>
        <p style="font-size: 8pt; color: #666; margin-top: 2px;">(National Gas Emergency Service &mdash; 24 hours)</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-text">This is a tax invoice &nbsp;|&nbsp; British Gas Trading Ltd &nbsp;|&nbsp; Registered in England &amp; Wales No. 03078711</div>
    <div>Registered Office: Millstream, Maidenhead Road, Windsor, Berkshire, SL4 5GD &nbsp;|&nbsp; Page 1 of 3</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════ PAGE 2: FURTHER INFO ═══ -->
<div class="page page-break">
  <div class="header">
    <div>
      <h1>British Gas</h1>
      <div class="header-sub">Further Information</div>
    </div>
    <div class="header-right">
      <div style="font-size: 9pt;">${invoiceNum}</div>
    </div>
  </div>

  <div class="page-title">Further Information</div>

  <div class="two-col">
    <div>
      <div class="info-section">
        <h3>Paying Your Invoice</h3>
        <p><strong>Direct Debit:</strong> Your payment of &pound;${fmtMoney(totalAmount)} will be collected on or after ${formatDateUK(dueDate)}. If you need to change your Direct Debit instruction, please contact us at least 5 working days before the collection date.</p>
        <p style="margin-top: 6px;"><strong>BACS/CHAPS:</strong></p>
        <p>Bank: National Westminster Bank plc</p>
        <p>Sort Code: 60-00-01</p>
        <p>Account No: 41298765</p>
        <p>Reference: ${GAS.accountRef}</p>
        <p style="margin-top: 6px;"><strong>Cheque:</strong> Please make payable to "British Gas Trading Ltd" and post to the address shown on page 1. Write your account number on the reverse.</p>
      </div>

      <div class="info-section">
        <h3>How to Calculate Your Gas Cost</h3>
        <p>Gas is measured by your meter in cubic metres (m&sup3;) or cubic feet (ft&sup3;). To convert the volume of gas used into energy (kWh), we apply the following formula:</p>
        <p style="margin-top: 6px; padding: 8px; background: #f0f4ff; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 9pt;">
          <strong>Metric meter:</strong><br>
          Volume (m&sup3;) &times; Correction Factor &times; Calorific Value &divide; 3.6 = kWh
        </p>
        <p style="margin-top: 6px; padding: 8px; background: #f0f4ff; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 9pt;">
          <strong>Imperial meter:</strong><br>
          Volume (ft&sup3;) &times; 2.83 &times; Correction Factor &times; Calorific Value &divide; 3.6 = kWh
        </p>
        <p style="margin-top: 6px;"><strong>Correction Factor (${GAS.correctionFactor}):</strong> Adjusts the volume of gas to account for temperature and pressure variations at the meter. This is set by Ofgem.</p>
        <p style="margin-top: 4px;"><strong>Calorific Value (${GAS.calorificValue} MJ/m&sup3;):</strong> A measure of the heat energy content of the gas. This value is published daily by National Gas and averaged over the billing period.</p>
      </div>

      <div class="info-section">
        <h3>Climate Change Levy (CCL)</h3>
        <p>The CCL is a government environmental tax on the supply of energy to non-domestic consumers. Schools and academies are generally liable for CCL at the standard rate unless they hold a Climate Change Agreement.</p>
        <p style="margin-top: 4px;">Current CCL rate for gas: ${rates.ccl}p per kWh.</p>
        <p style="margin-top: 4px;">If you believe your organisation qualifies for reduced-rate CCL or exemption, please provide us with a valid exemption certificate.</p>
      </div>
    </div>

    <div>
      <div class="info-section">
        <h3>Value Added Tax (VAT)</h3>
        <p>Energy supplied to schools and other qualifying institutions is normally charged at the reduced rate of 5% VAT, provided usage does not exceed 145 kWh of gas per day (approximately 4,397 kWh per month) or the supply is solely for non-business purposes.</p>
        <p style="margin-top: 4px;">If your school uses energy partly for business purposes (e.g. lettings), the business proportion may be charged at the standard rate of 20%.</p>
        <p style="margin-top: 4px;">Please provide a VAT declaration form if your circumstances change.</p>
      </div>

      <div class="info-section">
        <h3>Understanding Your Other Charges</h3>
        <p><strong>Administration Charge:</strong> Covers the cost of billing, customer services and account management.</p>
        <p style="margin-top: 4px;"><strong>Transportation Charge:</strong> The cost of transporting gas through the national transmission system and local distribution networks to your meter.</p>
        <p style="margin-top: 4px;"><strong>Meter Read Cost:</strong> The cost of obtaining periodic meter readings from your supply.</p>
        <p style="margin-top: 4px;"><strong>Metering Charge:</strong> Rental, maintenance and data processing charges for your gas meter.</p>
        <p style="margin-top: 4px;"><strong>Non-Consumption Based Transportation:</strong> A fixed daily charge for capacity reserved on the gas network, regardless of actual consumption.</p>
        <p style="margin-top: 4px;"><strong>Unidentified Gas (UIG):</strong> An industry charge to cover gas losses in the distribution network that cannot be attributed to a specific supply point.</p>
      </div>

      <div class="info-section">
        <h3>Complaints</h3>
        <p>If you are unhappy with any aspect of our service, please contact our Business Customer Services team on 0333 202 9802 or email businessenergy@britishgas.co.uk.</p>
        <p style="margin-top: 4px;">If we cannot resolve your complaint, you may refer it to the Energy Ombudsman at ombudsman-services.org or call 0330 440 1624.</p>
      </div>

      <div class="info-section">
        <h3>Moving Premises</h3>
        <p>If you are vacating these premises, please contact us at least 28 days in advance with your final meter reading and forwarding address.</p>
      </div>

      <div class="info-section" style="background: #fff3e0; border: 1px solid #ffcc80; border-radius: 4px; padding: 10px 12px;">
        <h3 style="color: #e65100;">Gas Emergencies</h3>
        <p style="font-size: 10pt; font-weight: 700; color: #c00;">Call 0800 111 999</p>
        <p>National Gas Emergency Service &mdash; available 24 hours a day, 7 days a week. If you smell gas, suspect a gas leak or have concerns about a gas appliance, call immediately.</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-text">British Gas Trading Ltd &nbsp;|&nbsp; Registered in England &amp; Wales No. 03078711</div>
    <div>Page 2 of 3</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════ PAGE 3: BREAKDOWN ═══ -->
<div class="page page-break">
  <div class="header">
    <div>
      <h1>British Gas</h1>
      <div class="header-sub">Invoice Breakdown</div>
    </div>
    <div class="header-right">
      <div style="font-size: 9pt;">${invoiceNum}</div>
    </div>
  </div>

  <div class="page-title">Your Invoice Breakdown</div>

  <div class="info-box" style="margin-bottom: 12px;">
    <h3>Supply Address</h3>
    <div style="font-size: 9pt;">${GAS.customer}, 15 School Lane, Oakworth, Bradford, BD22 7PX</div>
  </div>

  <div class="section-heading">Consumption Information</div>
  <table>
    <thead>
      <tr>
        <th>MPRN</th>
        <th>Serial No.</th>
        <th class="align-right">Prev Read</th>
        <th class="align-center">Prev Date</th>
        <th class="align-right">Curr Read</th>
        <th class="align-center">Curr Date</th>
        <th class="align-right">Metered Units</th>
        <th class="align-center">Unit</th>
        <th class="align-right">Corr. Factor</th>
        <th class="align-right">Cal. Value</th>
        <th class="align-right">Energy (kWh)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${GAS.mprn}</td>
        <td>${GAS.meterSerial}</td>
        <td class="align-right">${fmtNum(openingReadingM3)} (A)</td>
        <td class="align-center">${formatDateUK(periodStart)}</td>
        <td class="align-right">${fmtNum(closingReadingM3)} (A)</td>
        <td class="align-center">${formatDateUK(periodEnd)}</td>
        <td class="align-right">${fmtMoney(m3Used)}</td>
        <td class="align-center">m&sup3;</td>
        <td class="align-right">${GAS.correctionFactor}</td>
        <td class="align-right">${GAS.calorificValue}</td>
        <td class="align-right"><strong>${fmtNum(kwhUsed)}</strong></td>
      </tr>
    </tbody>
  </table>
  <div class="reading-key"><span><strong>A</strong> = Actual</span><span><strong>C</strong> = Customer</span><span><strong>E</strong> = Estimated</span></div>

  <div style="margin-bottom: 4px; font-size: 9pt;"><strong>Total Gas Consumed: ${fmtNum(kwhUsed)} kWh</strong></div>

  <div class="section-heading">Consumption Charges</div>
  <table>
    <thead><tr><th>Charge Description</th><th class="align-center">Start</th><th class="align-center">End</th><th class="align-right">Energy (kWh)</th><th class="align-right">Price (p/kWh)</th><th class="align-center">VAT Rate</th><th class="align-right">Total (&pound;)</th></tr></thead>
    <tbody>
      <tr>
        <td>Flexible Product Charge</td>
        <td class="align-center">${formatDateUK(periodStart)}</td>
        <td class="align-center">${formatDateUK(periodEnd)}</td>
        <td class="align-right">${fmtNum(kwhUsed)}</td>
        <td class="align-right">${fmtRate(rates.unit, 2)}</td>
        <td class="align-center">5%</td>
        <td class="align-right">${fmtMoney(energyCharge)}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-heading">Other Charges and Adjustments</div>
  <table>
    <thead><tr><th>Charge Description</th><th class="align-center">Start</th><th class="align-center">End</th><th class="align-right">Quantity</th><th class="align-right">Price</th><th class="align-center">VAT Rate</th><th class="align-right">Total (&pound;)</th></tr></thead>
    <tbody>
      ${otherCharges
        .map(
          (c) => `<tr>
        <td>${c.description}</td>
        <td class="align-center">${formatDateUK(periodStart)}</td>
        <td class="align-center">${formatDateUK(periodEnd)}</td>
        <td class="align-right">${c.quantityStr}</td>
        <td class="align-right">${c.priceStr}</td>
        <td class="align-center">5%</td>
        <td class="align-right">${fmtMoney(c.amount)}</td>
      </tr>`,
        )
        .join("\n      ")}
      <tr class="row-subtotal">
        <td colspan="6"><strong>Total Other Charges and Adjustments</strong></td>
        <td class="align-right"><strong>${fmtMoney(otherChargesTotal)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="section-heading">Climate Change Levy</div>
  <table>
    <thead><tr><th>Charge Description</th><th class="align-center">Start</th><th class="align-center">End</th><th class="align-right">Energy (kWh)</th><th class="align-right">Price (p/kWh)</th><th class="align-center">VAT Rate</th><th class="align-right">Total (&pound;)</th></tr></thead>
    <tbody>
      <tr>
        <td>Climate Change Levy</td>
        <td class="align-center">${formatDateUK(periodStart)}</td>
        <td class="align-center">${formatDateUK(periodEnd)}</td>
        <td class="align-right">${fmtNum(kwhUsed)}</td>
        <td class="align-right">${fmtRate(rates.ccl)}</td>
        <td class="align-center">N/A</td>
        <td class="align-right">${fmtMoney(cclCharge)}</td>
      </tr>
    </tbody>
  </table>

  <table class="vat-table">
    <tbody>
      <tr><td><strong>Total Charges Excluding VAT</strong></td><td class="align-right"><strong>&pound;${fmtMoney(netAmount)}</strong></td></tr>
      <tr><td>VAT @ 5% on &pound;${fmtMoney(vatNet)}</td><td class="align-right">&pound;${fmtMoney(vatAmount)}</td></tr>
      <tr class="grand-total"><td>Total Charges</td><td class="align-right">&pound;${fmtMoney(totalAmount)}</td></tr>
    </tbody>
  </table>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
    <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 8px 12px; font-size: 9pt;">
      <strong style="color: #2e7d32;">CO\u2082 Emissions:</strong> ${co2Tonnes.toFixed(2)} tonnes<br>
      <span style="font-size: 8pt; color: #666;">Based on ${fmtNum(kwhUsed)} kWh &times; ${GAS_CO2_FACTOR} kg/kWh</span>
    </div>
    <div class="meter-callout">
      <strong>Send your meter readings to:</strong><br>
      meterreads@britishgas.co.uk<br>
      or call 0333 202 9802
    </div>
  </div>

  <div class="footer">
    <div class="footer-text">British Gas Trading Ltd &nbsp;|&nbsp; Registered in England &amp; Wales No. 03078711</div>
    <div>Page 3 of 3</div>
  </div>
</div>

</body>
</html>`;
}

// ─── Calculate Electricity Other Charges ─────────────────

function calcElecOtherCharges(kwhUsed, days) {
  const r = ELEC_OTHER_RATES;
  const charges = [
    {
      description: "Distribution Use of System (DUoS)",
      basis: "per_kwh",
      rate: r.duos,
      quantityStr: `${fmtNum(kwhUsed)} kWh`,
      priceStr: `${fmtRate(r.duos)} p/kWh`,
      amount: round2((kwhUsed * r.duos) / 100),
    },
    {
      description: "Transmission Network Use of System (TNUoS)",
      basis: "per_kwh",
      rate: r.tnuos,
      quantityStr: `${fmtNum(kwhUsed)} kWh`,
      priceStr: `${fmtRate(r.tnuos)} p/kWh`,
      amount: round2((kwhUsed * r.tnuos) / 100),
    },
    {
      description: "Balancing Services Use of System (BSUoS)",
      basis: "per_kwh",
      rate: r.bsuos,
      quantityStr: `${fmtNum(kwhUsed)} kWh`,
      priceStr: `${fmtRate(r.bsuos)} p/kWh`,
      amount: round2((kwhUsed * r.bsuos) / 100),
    },
    {
      description: "Meter Operator Charge",
      basis: "per_day",
      rate: r.meterOp,
      quantityStr: `${days} days`,
      priceStr: `${fmtRate(r.meterOp, 2)} p/day`,
      amount: round2((days * r.meterOp) / 100),
    },
    {
      description: "Renewables Obligation (RO)",
      basis: "per_kwh",
      rate: r.ro,
      quantityStr: `${fmtNum(kwhUsed)} kWh`,
      priceStr: `${fmtRate(r.ro)} p/kWh`,
      amount: round2((kwhUsed * r.ro) / 100),
    },
    {
      description: "Contracts for Difference (CfD) / FiT Levy",
      basis: "per_kwh",
      rate: r.cfd,
      quantityStr: `${fmtNum(kwhUsed)} kWh`,
      priceStr: `${fmtRate(r.cfd)} p/kWh`,
      amount: round2((kwhUsed * r.cfd) / 100),
    },
    {
      description: "Capacity Market",
      basis: "per_kwh",
      rate: r.capacityMarket,
      quantityStr: `${fmtNum(kwhUsed)} kWh`,
      priceStr: `${fmtRate(r.capacityMarket)} p/kWh`,
      amount: round2((kwhUsed * r.capacityMarket) / 100),
    },
  ];
  const total = round2(charges.reduce((s, c) => s + c.amount, 0));
  return { charges, total };
}

// ─── Calculate Gas Other Charges ─────────────────────────

function calcGasOtherCharges(kwhUsed, days) {
  const r = GAS_OTHER_RATES;
  const charges = [
    {
      description: "Consumption Based Administration",
      basis: "per_kwh",
      rate: r.admin,
      quantityStr: `${fmtNum(kwhUsed)} kWh`,
      priceStr: `${fmtRate(r.admin)} p/kWh`,
      amount: round2((kwhUsed * r.admin) / 100),
    },
    {
      description: "Consumption Based Transportation",
      basis: "per_kwh",
      rate: r.transport,
      quantityStr: `${fmtNum(kwhUsed)} kWh`,
      priceStr: `${fmtRate(r.transport)} p/kWh`,
      amount: round2((kwhUsed * r.transport) / 100),
    },
    {
      description: "Meter Read Cost",
      basis: "per_day",
      rate: r.meterRead,
      quantityStr: `${days} days`,
      priceStr: `${fmtRate(r.meterRead, 1)} p/day`,
      amount: round2((days * r.meterRead) / 100),
    },
    {
      description: "Metering Charge",
      basis: "per_day",
      rate: r.metering,
      quantityStr: `${days} days`,
      priceStr: `${fmtRate(r.metering, 1)} p/day`,
      amount: round2((days * r.metering) / 100),
    },
    {
      description: "Non-Consumption Based Transportation",
      basis: "per_day",
      rate: r.ncTransport,
      quantityStr: `${days} days`,
      priceStr: `\u00A3${fmtMoney(r.ncTransport / 100)}/day`,
      amount: round2((days * r.ncTransport) / 100),
    },
    {
      description: "Unidentified Gas Estimate (UIG)",
      basis: "per_kwh",
      rate: r.uig,
      quantityStr: `${fmtNum(kwhUsed)} kWh`,
      priceStr: `${fmtRate(r.uig)} p/kWh`,
      amount: round2((kwhUsed * r.uig) / 100),
    },
  ];
  const total = round2(charges.reduce((s, c) => s + c.amount, 0));
  return { charges, total };
}

// ─── Electricity Invoice PDF + JSON ─────────────────────────

async function createElecInvoice(page, year, month, kwhUsed, openingReading) {
  const fy = financialYear(year, month);
  const rates = ELEC_RATES[fy];
  const days = daysInMonth(year, month);
  const closingReading = openingReading + kwhUsed;

  const periodStart = new Date(year, month, 1);
  const periodEnd = new Date(year, month, days);
  const invoiceDate = new Date(year, month + 1, 5);
  const dueDate = new Date(invoiceDate.getTime() + 28 * 86400000);

  const monthStr = `${year}-${pad2(month + 1)}`;
  const invoiceNum = `EDF-${monthStr}-78291`;

  const energyCharge = round2((kwhUsed * rates.unit) / 100);
  const standingTotal = round2((days * rates.standing) / 100);
  const cclCharge = round2((kwhUsed * rates.ccl) / 100);

  const { charges: otherCharges, total: otherChargesTotal } =
    calcElecOtherCharges(kwhUsed, days);

  const netAmount = round2(
    energyCharge + standingTotal + cclCharge + otherChargesTotal,
  );
  const vatAmount = round2(netAmount * 0.05);
  const totalAmount = round2(netAmount + vatAmount);
  const co2Tonnes = round2((kwhUsed * CO2_FACTOR) / 1000);

  // Generate PDF
  const html = buildElecInvoiceHTML({
    invoiceNum,
    invoiceDate,
    dueDate,
    periodStart,
    periodEnd,
    days,
    openingReading,
    closingReading,
    kwhUsed,
    rates,
    energyCharge,
    standingTotal,
    cclCharge,
    otherCharges,
    otherChargesTotal,
    netAmount,
    vatAmount,
    totalAmount,
    co2Tonnes,
  });

  const baseName = `EDF_Electric_MPAN_${ELEC.mpanShort}_${monthStr}`;
  const pdfPath = path.join(OUTPUT_DIR, `${baseName}.pdf`);
  const jsonPath = path.join(OUTPUT_DIR, `${baseName}.json`);

  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({ path: pdfPath, format: "A4", printBackground: true });

  // Generate sidecar JSON (extracted data)
  const extractedData = {
    Supplier: ELEC.supplier,
    "Invoice Number": invoiceNum,
    "Invoice Date": formatDate(invoiceDate),
    "Due Date": formatDate(dueDate),
    "Account Reference": ELEC.accountRef,
    "Contract Reference": ELEC.contractRef,
    "Customer Name": ELEC.customer,
    "Supply Address": ELEC.address,
    MPAN: ELEC.mpan,
    "Meter Serial": ELEC.meterSerial,
    "Energy Type": "electricity",
    "Billing Period Start": formatDate(periodStart),
    "Billing Period End": formatDate(periodEnd),
    "Supply Days": days,
    "Opening Reading": openingReading,
    "Closing Reading": closingReading,
    "Total kWh": kwhUsed,
    "Unit Rate (p/kWh)": rates.unit,
    "Standing Charge (p/day)": rates.standing,
    "CCL Rate (p/kWh)": rates.ccl,
    "Energy Charge": energyCharge,
    "Standing Charge Total": standingTotal,
    "CCL Charge": cclCharge,
    "Other Charges": otherCharges.map((c) => ({
      description: c.description,
      basis: c.basis,
      rate: c.rate,
      amount: c.amount,
    })),
    "Other Charges Total": otherChargesTotal,
    "Net Amount": netAmount,
    "VAT Rate": "5%",
    "VAT Amount": vatAmount,
    "Total Amount": totalAmount,
    "CO2 Tonnes": co2Tonnes,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(extractedData, null, 2));

  return {
    closingReading,
    kwhUsed,
    pdfFile: `${baseName}.pdf`,
    jsonFile: `${baseName}.json`,
  };
}

// ─── Gas Invoice PDF + JSON ─────────────────────────────────

async function createGasInvoice(page, year, month, kwhUsed, openingReadingM3) {
  const fy = financialYear(year, month);
  const rates = GAS_RATES[fy];
  const days = daysInMonth(year, month);

  const m3Used = round2(
    kwhUsed / ((GAS.correctionFactor * GAS.calorificValue) / 3.6),
  );
  const closingReadingM3 = round2(openingReadingM3 + m3Used);

  const periodStart = new Date(year, month, 1);
  const periodEnd = new Date(year, month, days);
  const invoiceDate = new Date(year, month + 1, 8);
  const dueDate = new Date(invoiceDate.getTime() + 28 * 86400000);

  const monthStr = `${year}-${pad2(month + 1)}`;
  const invoiceNum = `BG-${monthStr}-7829103`;

  const energyCharge = round2((kwhUsed * rates.unit) / 100);
  const standingTotal = round2((days * rates.standing) / 100);
  const cclCharge = round2((kwhUsed * rates.ccl) / 100);

  const { charges: otherCharges, total: otherChargesTotal } =
    calcGasOtherCharges(kwhUsed, days);

  const netAmount = round2(
    energyCharge + standingTotal + cclCharge + otherChargesTotal,
  );
  const vatAmount = round2(netAmount * 0.05);
  const totalAmount = round2(netAmount + vatAmount);
  const co2Tonnes = round2((kwhUsed * GAS_CO2_FACTOR) / 1000);

  // Generate PDF
  const html = buildGasInvoiceHTML({
    invoiceNum,
    invoiceDate,
    dueDate,
    periodStart,
    periodEnd,
    days,
    openingReadingM3,
    closingReadingM3,
    m3Used,
    kwhUsed,
    rates,
    energyCharge,
    standingTotal,
    cclCharge,
    otherCharges,
    otherChargesTotal,
    netAmount,
    vatAmount,
    totalAmount,
    co2Tonnes,
  });

  const baseName = `BritishGas_Gas_MPRN_${GAS.mprn}_${monthStr}`;
  const pdfPath = path.join(OUTPUT_DIR, `${baseName}.pdf`);
  const jsonPath = path.join(OUTPUT_DIR, `${baseName}.json`);

  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({ path: pdfPath, format: "A4", printBackground: true });

  // Generate sidecar JSON (extracted data)
  const extractedData = {
    Supplier: GAS.supplier,
    "Invoice Number": invoiceNum,
    "Invoice Date": formatDate(invoiceDate),
    "Due Date": formatDate(dueDate),
    "Account Reference": GAS.accountRef,
    "Contract Reference": GAS.contractRef,
    "Customer Name": GAS.customer,
    "Supply Address": GAS.address,
    MPRN: GAS.mprn,
    "Meter Serial": GAS.meterSerial,
    "Energy Type": "gas",
    "Billing Period Start": formatDate(periodStart),
    "Billing Period End": formatDate(periodEnd),
    "Supply Days": days,
    "Opening Reading (m3)": openingReadingM3,
    "Closing Reading (m3)": closingReadingM3,
    "Volume Used (m3)": m3Used,
    "Total kWh": kwhUsed,
    "Unit Rate (p/kWh)": rates.unit,
    "Standing Charge (p/day)": rates.standing,
    "CCL Rate (p/kWh)": rates.ccl,
    "Energy Charge": energyCharge,
    "Standing Charge Total": standingTotal,
    "CCL Charge": cclCharge,
    "Other Charges": otherCharges.map((c) => ({
      description: c.description,
      basis: c.basis,
      rate: c.rate,
      amount: c.amount,
    })),
    "Other Charges Total": otherChargesTotal,
    "Net Amount": netAmount,
    "VAT Rate": "5%",
    "VAT Amount": vatAmount,
    "Total Amount": totalAmount,
    "CO2 Tonnes": co2Tonnes,
    "Calorific Value": GAS.calorificValue,
    "Correction Factor": GAS.correctionFactor,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(extractedData, null, 2));

  return {
    closingReadingM3,
    kwhUsed,
    m3Used,
    pdfFile: `${baseName}.pdf`,
    jsonFile: `${baseName}.json`,
  };
}

// ─── Half-Hourly CSV ──────────────────────────────────────

function createHalfHourlyCSV(year, month, targetKwh) {
  const days = daysInMonth(year, month);
  const monthStr = `${year}-${pad2(month + 1)}`;

  const rows = [];

  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    const weekend = isWeekend(date);
    const holiday = isSchoolHoliday(date);

    for (let hh = 0; hh < 48; hh++) {
      const hour = Math.floor(hh / 2);
      const minute = (hh % 2) * 30;
      let kwh;

      if (weekend) {
        kwh = 1.5 + Math.random() * 0.5;
      } else if (holiday) {
        kwh = 1.8 + Math.random() * 0.7;
      } else {
        if (hour < 7 || (hour === 6 && minute === 30)) {
          kwh = 1.5 + Math.random() * 0.5;
        } else if (hour === 7 || (hour === 7 && minute === 30)) {
          kwh = 3.0 + Math.random() * 2.0;
        } else if (hour === 8 && minute === 0) {
          kwh = 4.0 + Math.random() * 2.0;
        } else if ((hour === 8 && minute === 30) || (hour >= 9 && hour < 15)) {
          kwh = 6.0 + Math.random() * 2.0;
        } else if (hour === 15) {
          kwh = 5.0 + Math.random() * 1.0;
        } else if (hour >= 16 && hour < 18) {
          kwh = 3.0 + Math.random() * 1.0;
        } else {
          kwh = 1.8 + Math.random() * 0.4;
        }
      }

      rows.push({
        timestamp: `${year}-${pad2(month + 1)}-${pad2(d)} ${pad2(hour)}:${pad2(minute)}`,
        kwh,
      });
    }
  }

  const rawTotal = rows.reduce((sum, r) => sum + r.kwh, 0);
  const scaleFactor = targetKwh / rawTotal;

  let csv = "Timestamp,kWh,MPAN\n";
  let scaledTotal = 0;
  for (const row of rows) {
    const scaledKwh = round2(row.kwh * scaleFactor);
    scaledTotal += scaledKwh;
    csv += `${row.timestamp},${scaledKwh},${ELEC.mpan}\n`;
  }

  const errorPct = (Math.abs(scaledTotal - targetKwh) / targetKwh) * 100;
  if (errorPct > 0.1) {
    const lastLine = csv.lastIndexOf("\n", csv.length - 2);
    const prevLine = csv.lastIndexOf("\n", lastLine - 1);
    const lastRow = csv.substring(prevLine + 1, lastLine);
    const parts = lastRow.split(",");
    const adjustment = round2(targetKwh - scaledTotal + parseFloat(parts[1]));
    csv =
      csv.substring(0, prevLine + 1) +
      `${parts[0]},${adjustment},${parts[2]}` +
      csv.substring(lastLine);
  }

  const filename = `HH_Electric_MPAN_${ELEC.mpanShort}_${monthStr}.csv`;
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), csv);

  return { filename, rows: rows.length };
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log(
    "Generating monthly energy invoices (3-page PDFs) and HH data...\n",
  );

  // Clean output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    const existing = fs.readdirSync(OUTPUT_DIR);
    for (const f of existing) {
      fs.unlinkSync(path.join(OUTPUT_DIR, f));
    }
    console.log(
      `Cleaned ${existing.length} existing files from ${OUTPUT_DIR}\n`,
    );
  } else {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created ${OUTPUT_DIR}\n`);
  }

  const months = generateMonths();
  console.log(
    `Generating data for ${months.length} months (Apr 2023 - Mar 2026)\n`,
  );

  // Launch Playwright browser once
  console.log("Launching headless browser for PDF generation...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log("Browser ready.\n");

  let elecReading = 142850;
  let gasReadingM3 = 28450;
  let elecCount = 0;
  let gasCount = 0;
  let hhCount = 0;

  for (const { year, month } of months) {
    const monthIndex = month;

    // Electricity
    const elecKwh = addNoise(ELEC_KWH[monthIndex]);
    const elecResult = await createElecInvoice(
      page,
      year,
      month,
      elecKwh,
      elecReading,
    );
    elecReading = elecResult.closingReading;
    elecCount++;
    console.log(
      `  [ELEC] ${elecResult.pdfFile}  ${elecKwh.toLocaleString()} kWh`,
    );

    // Gas
    const gasKwh = addNoise(GAS_KWH[monthIndex]);
    const gasResult = await createGasInvoice(
      page,
      year,
      month,
      gasKwh,
      gasReadingM3,
    );
    gasReadingM3 = gasResult.closingReadingM3;
    gasCount++;
    console.log(
      `  [GAS]  ${gasResult.pdfFile}  ${gasKwh.toLocaleString()} kWh (${gasResult.m3Used} m\u00B3)`,
    );

    // Half-hourly data (electricity only)
    const hhResult = createHalfHourlyCSV(year, month, elecKwh);
    hhCount++;
    console.log(`  [HH]   ${hhResult.filename}  ${hhResult.rows} readings`);

    console.log();
  }

  await browser.close();

  const totalPDFs = elecCount + gasCount;
  const totalJSONs = elecCount + gasCount;
  const totalFiles = totalPDFs + totalJSONs + hhCount;
  console.log("\u2500".repeat(60));
  console.log(`Done! Generated ${totalFiles} files:`);
  console.log(`  Electricity invoice PDFs (3 pages each): ${elecCount}`);
  console.log(`  Gas invoice PDFs (3 pages each):         ${gasCount}`);
  console.log(`  Sidecar JSON files:                      ${totalJSONs}`);
  console.log(`  Half-hourly CSVs:                        ${hhCount}`);
  console.log(`\nOutput: ${OUTPUT_DIR}`);

  console.log(
    `\nFinal electricity meter reading: ${elecReading.toLocaleString()} kWh`,
  );
  console.log(
    `Final gas meter reading: ${gasReadingM3.toLocaleString()} m\u00B3`,
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
