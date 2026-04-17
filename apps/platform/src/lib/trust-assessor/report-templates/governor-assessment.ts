/**
 * Governor Assessment Report — HTML Template Generator
 *
 * Produces a self-contained, print-optimised A4 HTML document for
 * governor board meetings. No external CSS, no CDN fonts, inline SVG.
 *
 * Usage:
 *   const html = generateGovernorReportHtml(data);
 *   // Open in a new tab, print to PDF, or email as an attachment.
 */

export interface GovernorReportData {
  schoolName: string;
  schoolLogoUrl?: string | null;
  trustName?: string | null;
  generatedAt: Date;
  reportDate: string; // e.g. "April 2026"
  academicYear: string; // e.g. "2025/26"

  // Core metrics
  y6Combined: number | null;
  nationalPercentile: number | null;
  nationalRank: { rank: number; total: number } | null;
  threeYearAverage: number | null;

  // Context
  fsmPct: number | null;
  sendPct: number | null;
  trustFsmPct: number | null;
  totalPupils: number | null;

  // Data quality alerts
  dataQualityAlerts: { severity: 'low' | 'medium' | 'high'; title: string; explanation: string }[];

  // Cohort journey data for the chart
  cohortJourney?: {
    label: string;
    dataPoints: { year: number; yearGroup: number; reading: number | null; writing: number | null; maths: number | null }[];
  };

  // AI-generated narrative
  narrative: {
    verdict: string;
    severity: 'strong' | 'secure' | 'attention' | 'urgent';
    headline: string;
    keyFindings: { number: string; title: string; detail: string }[];
    contextDefence: string;
    recommendations: { action: string; eefStrategy: string | null; impact: string; cost: string }[];
    questionsForHeadteacher: string[];
  };

  // Branding
  primaryColor?: string;
  secondaryColor?: string;

  // Options
  includeDataAppendix?: boolean;
  confidential?: boolean;
}

// ─── Severity colour helper ───────────────────────────────────────────────────

function severityColor(severity: GovernorReportData['narrative']['severity']): string {
  switch (severity) {
    case 'strong':
    case 'secure':
      return '#10b981';
    case 'attention':
      return '#f59e0b';
    case 'urgent':
      return '#ef4444';
  }
}

function severityLabel(severity: GovernorReportData['narrative']['severity']): string {
  switch (severity) {
    case 'strong': return 'Strong';
    case 'secure': return 'Secure';
    case 'attention': return 'Needs Attention';
    case 'urgent': return 'Urgent Improvement Required';
  }
}

// ─── Inline SVG cohort chart ──────────────────────────────────────────────────

function generateCohortChartSvg(
  dataPoints: { year: number; yearGroup: number; reading: number | null; writing: number | null; maths: number | null }[]
): string {
  if (!dataPoints || dataPoints.length === 0) {
    return `<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
      <text x="400" y="200" text-anchor="middle" fill="#9ca3af" font-family="system-ui,sans-serif" font-size="16">No cohort journey data available</text>
    </svg>`;
  }

  const W = 800;
  const H = 400;
  const PAD_LEFT = 60;
  const PAD_RIGHT = 30;
  const PAD_TOP = 60;
  const PAD_BOTTOM = 50;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  const sorted = [...dataPoints].sort((a, b) => a.yearGroup - b.yearGroup);
  const n = sorted.length;

  const xPos = (i: number) => PAD_LEFT + (i / Math.max(n - 1, 1)) * chartW;
  const yPos = (pct: number) => PAD_TOP + chartH - (pct / 100) * chartH;

  // Grid lines at 20%, 40%, 60%, 80%
  const gridLines = [20, 40, 60, 80].map(pct => {
    const y = yPos(pct);
    return `<line x1="${PAD_LEFT}" y1="${y}" x2="${PAD_LEFT + chartW}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>
    <text x="${PAD_LEFT - 8}" y="${y + 4}" text-anchor="end" fill="#9ca3af" font-size="11" font-family="system-ui,sans-serif">${pct}%</text>`;
  }).join('\n');

  // National reference line at 60%
  const natY = yPos(60);
  const natLine = `<line x1="${PAD_LEFT}" y1="${natY}" x2="${PAD_LEFT + chartW}" y2="${natY}" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="${PAD_LEFT + chartW + 8}" y="${natY + 4}" fill="#6b7280" font-size="10" font-family="system-ui,sans-serif">Nat. avg</text>`;

  // X-axis labels
  const xLabels = sorted.map((d, i) => {
    const label = d.yearGroup === 0 ? 'EYFS' : `Y${d.yearGroup}`;
    return `<text x="${xPos(i)}" y="${PAD_TOP + chartH + 20}" text-anchor="middle" fill="#6b7280" font-size="11" font-family="system-ui,sans-serif">${label}</text>`;
  }).join('\n');

  // Build path for a subject
  const buildPath = (key: 'reading' | 'writing' | 'maths', color: string, label: string) => {
    const pts = sorted.map((d, i) => ({ x: xPos(i), y: d[key], i })).filter(p => p.y !== null);
    if (pts.length < 2) return '';

    const pathD = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${yPos(p.y as number)}`).join(' ');
    const circles = pts.map(p => `<circle cx="${p.x}" cy="${yPos(p.y as number)}" r="4" fill="${color}" stroke="white" stroke-width="1.5"/>`).join('');

    return `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${circles}`;
  };

  // Legend
  const legendItems = [
    { color: '#3b82f6', label: 'Reading' },
    { color: '#f59e0b', label: 'Writing' },
    { color: '#10b981', label: 'Maths' },
  ];
  const legend = legendItems.map((item, i) => {
    const lx = PAD_LEFT + i * 120;
    return `<line x1="${lx}" y1="20" x2="${lx + 24}" y2="20" stroke="${item.color}" stroke-width="2.5"/>
    <circle cx="${lx + 12}" cy="20" r="4" fill="${item.color}"/>
    <text x="${lx + 32}" y="24" fill="#374151" font-size="12" font-family="system-ui,sans-serif">${item.label}</text>`;
  }).join('\n');

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${legend}
  ${gridLines}
  ${natLine}
  ${buildPath('reading', '#3b82f6', 'Reading')}
  ${buildPath('writing', '#f59e0b', 'Writing')}
  ${buildPath('maths', '#10b981', 'Maths')}
  ${xLabels}
  <!-- X-axis -->
  <line x1="${PAD_LEFT}" y1="${PAD_TOP + chartH}" x2="${PAD_LEFT + chartW}" y2="${PAD_TOP + chartH}" stroke="#d1d5db" stroke-width="1"/>
  <!-- Y-axis -->
  <line x1="${PAD_LEFT}" y1="${PAD_TOP}" x2="${PAD_LEFT}" y2="${PAD_TOP + chartH}" stroke="#d1d5db" stroke-width="1"/>
</svg>`;
}

// ─── Escape HTML helper ───────────────────────────────────────────────────────

function esc(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateGovernorReportHtml(data: GovernorReportData): string {
  const primary = data.primaryColor ?? '#6366f1';
  const sevColor = severityColor(data.narrative.severity);
  const sevLabel = severityLabel(data.narrative.severity);
  const genDate = data.generatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const nextReviewDate = new Date(data.generatedAt.getTime() + 28 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Chart SVG
  const chartSvg = data.cohortJourney
    ? generateCohortChartSvg(data.cohortJourney.dataPoints)
    : generateCohortChartSvg([]);

  // Build key findings cards
  const findingCards = (data.narrative.keyFindings ?? []).slice(0, 3).map((f, i) => `
    <div style="flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;">
      <div style="font-size:36px;font-weight:800;color:${primary};line-height:1;margin-bottom:8px;">${esc(f.number)}</div>
      <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">${i + 1}. ${esc(f.title)}</div>
      <div style="font-size:12px;color:#4b5563;line-height:1.5;">${esc(f.detail)}</div>
    </div>`).join('');

  // Build recommendations
  const recCards = (data.narrative.recommendations ?? []).slice(0, 3).map((r, i) => `
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:12px;background:white;">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <div style="width:32px;height:32px;border-radius:50%;background:${primary};color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0;">${i + 1}</div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">${esc(r.action)}</div>
          ${r.eefStrategy ? `<span style="display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600;margin-bottom:8px;">EEF: ${esc(r.eefStrategy)}</span>` : ''}
          <div style="display:flex;gap:16px;font-size:12px;color:#6b7280;margin-top:4px;">
            <span><strong>Impact:</strong> ${esc(r.impact)}</span>
            <span><strong>Cost:</strong> ${esc(r.cost)}</span>
          </div>
        </div>
      </div>
    </div>`).join('');

  // Build governor questions
  const questionItems = (data.narrative.questionsForHeadteacher ?? []).slice(0, 5).map((q, i) => `
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:12px;background:white;">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <div style="font-size:22px;font-weight:800;color:${primary};flex-shrink:0;width:30px;text-align:center;">${i + 1}</div>
        <div style="font-size:14px;color:#111827;line-height:1.6;">${esc(q)}</div>
      </div>
    </div>`).join('');

  // Data quality alerts
  const alertSevColor = (s: string) => s === 'high' ? '#ef4444' : s === 'medium' ? '#f59e0b' : '#6b7280';
  const alertBg = (s: string) => s === 'high' ? '#fef2f2' : s === 'medium' ? '#fffbeb' : '#f9fafb';
  const alertBorder = (s: string) => s === 'high' ? '#fecaca' : s === 'medium' ? '#fde68a' : '#e5e7eb';

  const alertItems = data.dataQualityAlerts.length > 0
    ? data.dataQualityAlerts.map(a => `
      <div style="background:${alertBg(a.severity)};border:1px solid ${alertBorder(a.severity)};border-radius:8px;padding:12px 16px;margin-bottom:8px;">
        <div style="font-size:12px;font-weight:700;color:${alertSevColor(a.severity)};margin-bottom:4px;">${esc(a.title)}</div>
        <div style="font-size:11px;color:#374151;line-height:1.5;">${esc(a.explanation)}</div>
      </div>`).join('')
    : `<div style="font-size:12px;color:#10b981;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;">No data quality alerts — data submission appears complete and consistent.</div>`;

  // Context stats
  const contextStats = [
    { label: 'Total Pupils', value: data.totalPupils !== null ? String(data.totalPupils) : 'N/A' },
    { label: 'FSM %', value: data.fsmPct !== null ? `${data.fsmPct}%` : 'N/A' },
    { label: 'SEND %', value: data.sendPct !== null ? `${data.sendPct}%` : 'N/A' },
    { label: 'Trust FSM Avg', value: data.trustFsmPct !== null ? `${Math.round(data.trustFsmPct)}%` : 'N/A' },
  ].map(s => `
    <div style="text-align:center;padding:10px;">
      <div style="font-size:20px;font-weight:800;color:#111827;">${esc(s.value)}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px;">${esc(s.label)}</div>
    </div>`).join('');

  // At-a-glance stat boxes (Page 1 hero row)
  const heroStats = [
    { label: 'Y6 Combined', value: data.y6Combined !== null ? `${data.y6Combined}%` : 'N/A', sub: 'All Pupils ARE' },
    { label: 'FSM Eligible', value: data.fsmPct !== null ? `${data.fsmPct}%` : 'N/A', sub: 'of all pupils' },
    { label: 'Total Pupils', value: data.totalPupils !== null ? String(data.totalPupils) : 'N/A', sub: 'on roll' },
  ].map(s => `
    <div style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;text-align:center;flex:1;">
      <div style="font-size:24px;font-weight:800;color:#111827;">${esc(s.value)}</div>
      <div style="font-size:13px;font-weight:600;color:#374151;margin-top:4px;">${esc(s.label)}</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${esc(s.sub)}</div>
    </div>`).join('');

  // School logo or text fallback
  const logoHtml = data.schoolLogoUrl
    ? `<img src="${esc(data.schoolLogoUrl)}" alt="${esc(data.schoolName)} logo" style="max-height:50px;max-width:120px;object-fit:contain;" />`
    : `<div style="font-size:16px;font-weight:800;color:${primary};">${esc(data.schoolName)}</div>`;

  // Confidentiality watermark
  const confWatermark = data.confidential
    ? `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:80px;font-weight:900;color:rgba(0,0,0,0.04);z-index:0;pointer-events:none;white-space:nowrap;letter-spacing:8px;">CONFIDENTIAL</div>`
    : '';

  // Percentile display
  const percentileDisplay = data.nationalPercentile !== null
    ? String(data.nationalPercentile)
    : data.y6Combined !== null
    ? String(data.y6Combined) + '%'
    : 'N/A';
  const percentileLabel = data.nationalPercentile !== null
    ? 'National Percentile'
    : 'Y6 Combined ARE';

  // Rank text
  const rankText = data.nationalRank
    ? `Ranked ${data.nationalRank.rank} of ${data.nationalRank.total} schools`
    : data.threeYearAverage !== null
    ? `3-Year Average: ${data.threeYearAverage}%`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(data.schoolName)} — Governor Assessment Report ${esc(data.reportDate)}</title>
  <style>
    /* ── Base reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 11pt; }
    body {
      font-family: system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
      background: #f3f4f6;
      color: #111827;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page container ── */
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto 20px;
      background: white;
      padding: 24mm 22mm;
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }

    /* ── Typography ── */
    .hero-number {
      font-size: 96pt;
      font-weight: 900;
      line-height: 1;
    }
    .section-title {
      font-size: 20pt;
      font-weight: 700;
      color: #111827;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .verdict-text {
      font-size: 18pt;
      font-weight: 700;
    }
    .label-tag {
      display: inline-block;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 20px;
    }

    /* ── Callout / headline box ── */
    .callout {
      background: #f9fafb;
      border-left: 4px solid ${primary};
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 20px;
    }
    .callout p {
      font-size: 13pt;
      color: #111827;
      line-height: 1.55;
    }

    /* ── Footer ── */
    .page-footer {
      position: absolute;
      bottom: 14mm;
      left: 22mm;
      right: 22mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8pt;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
    }

    /* ── Page break ── */
    @media print {
      .page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
      }
      body { background: white; }
      .no-print { display: none; }
    }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
${confWatermark}

<!-- ══════════════════════════════════════════════════════════════════
     PAGE 1 — Executive Summary
═══════════════════════════════════════════════════════════════════ -->
<div class="page">

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
    <div>${logoHtml}</div>
    <div style="text-align:right;">
      <div style="font-size:15pt;font-weight:800;color:#111827;">Governor Assessment Report</div>
      <div style="font-size:10pt;color:#6b7280;margin-top:2px;">${esc(data.reportDate)} &nbsp;·&nbsp; Academic Year ${esc(data.academicYear)}</div>
      ${data.trustName ? `<div style="font-size:9pt;color:#9ca3af;margin-top:2px;">${esc(data.trustName)}</div>` : ''}
    </div>
  </div>

  <!-- Hero panel -->
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:28px 32px;margin-bottom:24px;text-align:center;">
    <div class="hero-number" style="color:${sevColor};">${esc(percentileDisplay)}</div>
    <div style="font-size:11pt;color:#6b7280;margin-top:4px;margin-bottom:14px;">${esc(percentileLabel)}</div>
    ${rankText ? `<div style="font-size:10pt;color:#6b7280;margin-bottom:14px;">${esc(rankText)}</div>` : ''}
    <span class="label-tag" style="background:${sevColor}1a;color:${sevColor};">${esc(sevLabel)}</span>
    <p style="font-size:12pt;font-weight:600;color:#111827;margin-top:14px;">${esc(data.narrative.verdict)}</p>
  </div>

  <!-- At-a-glance stat row -->
  <div style="display:flex;gap:12px;margin-bottom:24px;">
    ${heroStats}
  </div>

  <!-- Headline callout -->
  <div class="callout">
    <div style="font-size:8pt;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${primary};margin-bottom:6px;">Key Finding</div>
    <p>${esc(data.narrative.headline)}</p>
  </div>

  <!-- Two-column: findings + context -->
  <div style="display:flex;gap:16px;margin-bottom:24px;">
    <!-- Findings -->
    <div style="flex:3;display:flex;flex-direction:column;gap:10px;">
      <div style="font-size:11pt;font-weight:700;color:#111827;margin-bottom:4px;">Key Findings</div>
      ${findingCards}
    </div>
    <!-- Context -->
    <div style="flex:2;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;">
      <div style="font-size:11pt;font-weight:700;color:#111827;margin-bottom:12px;">Context at a Glance</div>
      <div style="display:flex;flex-wrap:wrap;gap:0;">
        ${contextStats}
      </div>
      ${data.confidential ? `<div style="margin-top:12px;font-size:9pt;font-weight:700;color:#ef4444;letter-spacing:0.05em;text-transform:uppercase;">Confidential</div>` : ''}
    </div>
  </div>

  <!-- Page footer -->
  <div class="page-footer">
    <span>Generated by Schoolgle &nbsp;·&nbsp; ${esc(genDate)}</span>
    <span>${esc(data.schoolName)} &nbsp;·&nbsp; Page 1 of 4</span>
    ${data.confidential ? '<span style="font-weight:700;color:#ef4444;">CONFIDENTIAL</span>' : '<span></span>'}
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════
     PAGE 2 — The Story (cohort performance chart)
═══════════════════════════════════════════════════════════════════ -->
<div class="page page-break">

  <div class="section-title">Cohort Performance</div>

  <!-- Chart -->
  <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:24px;background:#fafafa;">
    ${chartSvg}
    <div style="display:flex;gap:24px;justify-content:center;margin-top:10px;font-size:10pt;color:#6b7280;">
      <span style="display:flex;align-items:center;gap:6px;"><span style="width:20px;height:3px;background:#3b82f6;display:inline-block;border-radius:2px;"></span>Reading</span>
      <span style="display:flex;align-items:center;gap:6px;"><span style="width:20px;height:3px;background:#f59e0b;display:inline-block;border-radius:2px;"></span>Writing</span>
      <span style="display:flex;align-items:center;gap:6px;"><span style="width:20px;height:3px;background:#10b981;display:inline-block;border-radius:2px;"></span>Maths</span>
      <span style="display:flex;align-items:center;gap:6px;"><span style="width:20px;height:1px;background:#6b7280;display:inline-block;"></span>National avg (~60%)</span>
    </div>
  </div>

  <!-- Context & Defence narrative -->
  <div style="margin-bottom:24px;">
    <div style="font-size:11pt;font-weight:700;color:#111827;margin-bottom:10px;">Context and Analysis</div>
    <p style="font-size:11pt;color:#374151;line-height:1.65;">${esc(data.narrative.contextDefence)}</p>
  </div>

  <!-- Data sources sidebar -->
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;">
    <div style="font-size:10pt;font-weight:700;color:#111827;margin-bottom:10px;">Data Sources</div>
    <div style="display:flex;gap:24px;flex-wrap:wrap;">
      <div style="font-size:10pt;color:#6b7280;display:flex;align-items:center;gap:8px;">
        <span style="width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block;"></span>
        DfE Validated KS2 Results
      </div>
      <div style="font-size:10pt;color:#6b7280;display:flex;align-items:center;gap:8px;">
        <span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;display:inline-block;"></span>
        Trust Self-Reported Mid-Year Data
      </div>
      <div style="font-size:10pt;color:#6b7280;display:flex;align-items:center;gap:8px;">
        <span style="width:8px;height:8px;border-radius:50%;background:#3b82f6;display:inline-block;"></span>
        CTF Per-Pupil Assessment Data
      </div>
    </div>
    <p style="font-size:9pt;color:#9ca3af;margin-top:8px;">Self-reported mid-year data has not been externally validated. Figures should be treated as indicative until end-of-year assessment.</p>
  </div>

  <div class="page-footer">
    <span>Generated by Schoolgle &nbsp;·&nbsp; ${esc(genDate)}</span>
    <span>${esc(data.schoolName)} &nbsp;·&nbsp; Page 2 of 4</span>
    ${data.confidential ? '<span style="font-weight:700;color:#ef4444;">CONFIDENTIAL</span>' : '<span></span>'}
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════
     PAGE 3 — Recommendations + Data Quality
═══════════════════════════════════════════════════════════════════ -->
<div class="page page-break">

  <div class="section-title">Recommended Actions</div>

  ${recCards}

  <!-- Data Quality Notes -->
  <div style="margin-top:28px;">
    <div style="font-size:11pt;font-weight:700;color:#111827;margin-bottom:10px;">Data Quality Notes</div>
    ${alertItems}
  </div>

  <div class="page-footer">
    <span>Generated by Schoolgle &nbsp;·&nbsp; ${esc(genDate)}</span>
    <span>${esc(data.schoolName)} &nbsp;·&nbsp; Page 3 of 4</span>
    ${data.confidential ? '<span style="font-weight:700;color:#ef4444;">CONFIDENTIAL</span>' : '<span></span>'}
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════
     PAGE 4 — Governor Questions
═══════════════════════════════════════════════════════════════════ -->
<div class="page page-break">

  <div class="section-title">Five Questions for the Headteacher</div>

  ${questionItems}

  <!-- Next review + sign-off -->
  <div style="margin-top:28px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;">
      <div>
        <div style="font-size:10pt;font-weight:700;color:#111827;margin-bottom:4px;">Next Review Date</div>
        <div style="font-size:13pt;font-weight:800;color:${primary};">${esc(nextReviewDate)}</div>
        <div style="font-size:9pt;color:#9ca3af;margin-top:2px;">Recommended: 4 weeks from report generation</div>
      </div>
      <div style="flex:1;min-width:200px;">
        <div style="font-size:10pt;font-weight:700;color:#111827;margin-bottom:8px;">Signature / Acknowledgement</div>
        <div style="border-bottom:1px solid #d1d5db;margin-bottom:4px;height:28px;"></div>
        <div style="font-size:9pt;color:#9ca3af;">Link Governor &nbsp;·&nbsp; Date: ____________</div>
      </div>
    </div>
  </div>

  <div style="margin-top:20px;font-size:9pt;color:#9ca3af;line-height:1.6;">
    Prepared by ${esc(data.schoolName)} leadership team with Schoolgle Intelligence.
    This report is generated from trust mid-year assessment data cross-referenced against DfE validated KS2 results.
    All analysis is AI-assisted and should be reviewed by a qualified School Improvement Partner before formal use.
    ${data.confidential ? 'This document is CONFIDENTIAL and intended for governors only.' : ''}
  </div>

  <div class="page-footer">
    <span>Generated by Schoolgle &nbsp;·&nbsp; ${esc(genDate)}</span>
    <span>${esc(data.schoolName)} &nbsp;·&nbsp; Page 4 of 4</span>
    ${data.confidential ? '<span style="font-weight:700;color:#ef4444;">CONFIDENTIAL</span>' : '<span style="font-size:8pt;color:#d1d5db;">Schoolgle</span>'}
  </div>
</div>

</body>
</html>`;
}
