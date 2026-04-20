/**
 * Governor Assessment Report — HTML Template Generator
 *
 * Produces a self-contained, print-optimised A4 HTML document for
 * governor board meetings. No external CSS, no CDN fonts, inline SVG.
 *
 * v2: Interactive — presentation mode, edit mode, export options.
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

  // Intra-year progression data (optional — from School Data Summary)
  intraYearProgression?: {
    yearGroup: string;
    autumnCombined: number | null;
    midYearCombined: number | null;
    targetCombined: number | null;
    delta: number | null;          // autumn → mid-year
    isOutlierRed: boolean;         // delta > 8pp
    isOutlierAmber: boolean;       // delta > 5pp
    subjectDeltas?: { reading: number | null; writing: number | null; maths: number | null };
    fsmDelta?: number | null;
    nonFsmDelta?: number | null;
    ks1Baseline?: { year: string; combined: number | null };
  }[];

  // Reliability-tagged verification items
  verificationChecklist?: {
    label: string;
    value: string;
    tier: 'external' | 'derived' | 'self_reported';
    source: string;
  }[];

  // Branding
  primaryColor?: string;
  secondaryColor?: string;

  // Options
  includeDataAppendix?: boolean;
  confidential?: boolean;

  // Share token (set by API route)
  shareToken?: string;
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

// ─── Speaker prompt helper ────────────────────────────────────────────────────

function generateSpeakerPrompts(data: GovernorReportData): { p1: string; p2: string; p3: string; p4: string } {
  const { severity, keyFindings, recommendations } = data.narrative;
  const percentile = data.nationalPercentile;
  const school = data.schoolName;

  const p1 = severity === 'urgent'
    ? `Opening: ${school} sits in the bottom quartile nationally${percentile ? ` — the ${percentile}th percentile` : ''}. The number isn't the conversation — the reasons are. Let's look at what's driving it.`
    : severity === 'attention'
    ? `Opening: ${school} is showing signs that need our attention${percentile ? ` — ${percentile}th percentile` : ''}. The data tells a specific story. Let's walk through it together.`
    : `Opening: ${school} is performing${percentile ? ` at the ${percentile}th percentile` : ' well'} nationally. The data gives us a strong foundation — and some specific areas to build on.`;

  const topFinding = keyFindings && keyFindings.length > 0 ? keyFindings[0].title : 'attainment gap';
  const p2 = `Key point: The cohort chart shows how this year group has moved through the school. Focus on the gap between subjects — ${topFinding} is the most significant signal here. Ask: is this consistent across year groups, or is it specific to this cohort?`;

  const topAction = recommendations && recommendations.length > 0 ? recommendations[0].action : 'the first recommendation';
  const p3 = `Transition: Each action shown is EEF-evidenced. ${topAction} — start there. The ask isn't more work. It's focused work, measured monthly. You'll see the evidence grade and cost estimate for each.`;

  const p4 = `Closing: These five questions are ones the board can reasonably put to school leadership at the next meeting. Each is rooted in the data we've shown. They're designed to open dialogue, not create defensiveness.`;

  return { p1, p2, p3, p4 };
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

  // Build path for a subject — with stroke-dasharray trick for animation
  const buildPath = (key: 'reading' | 'writing' | 'maths', color: string, id: string) => {
    const pts = sorted.map((d, i) => ({ x: xPos(i), y: d[key], i })).filter(p => p.y !== null);
    if (pts.length < 2) return '';

    const pathD = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${yPos(p.y as number)}`).join(' ');
    const circles = pts.map((p, idx) => `<circle class="chart-dot" cx="${p.x}" cy="${yPos(p.y as number)}" r="4" fill="${color}" stroke="white" stroke-width="1.5" style="opacity:0;transition:opacity 0.3s ease ${0.8 + idx * 0.1}s"/>`).join('');

    // Approximate path length for dashoffset animation
    const approxLen = pts.length * 150;

    return `<path d="${pathD}" id="${id}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"
      class="chart-line" style="stroke-dasharray:${approxLen};stroke-dashoffset:${approxLen};transition:stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)"/>
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

  return `<svg id="cohort-chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${legend}
  ${gridLines}
  ${natLine}
  ${buildPath('reading', '#3b82f6', 'line-reading')}
  ${buildPath('writing', '#f59e0b', 'line-writing')}
  ${buildPath('maths', '#10b981', 'line-maths')}
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

  const shareToken = data.shareToken ?? 'no-token';
  const prompts = generateSpeakerPrompts(data);

  // Chart SVG — gracefully skip if no cohort data, but always render container
  const hasCohortData = data.cohortJourney && data.cohortJourney.dataPoints.length >= 2;
  const cohortSvg = hasCohortData
    ? generateCohortChartSvg(data.cohortJourney!.dataPoints)
    : generateCohortChartSvg([]);
  const chartBlock = hasCohortData
    ? `<div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:24px;background:#fafafa;">
    ${cohortSvg}
    <div style="display:flex;gap:24px;justify-content:center;margin-top:10px;font-size:10pt;color:#6b7280;">
      <span style="display:flex;align-items:center;gap:6px;"><span style="width:20px;height:3px;background:#3b82f6;display:inline-block;border-radius:2px;"></span>Reading</span>
      <span style="display:flex;align-items:center;gap:6px;"><span style="width:20px;height:3px;background:#f59e0b;display:inline-block;border-radius:2px;"></span>Writing</span>
      <span style="display:flex;align-items:center;gap:6px;"><span style="width:20px;height:3px;background:#10b981;display:inline-block;border-radius:2px;"></span>Maths</span>
      <span style="display:flex;align-items:center;gap:6px;"><span style="width:20px;height:1px;background:#6b7280;display:inline-block;"></span>National avg (~60%)</span>
    </div>
  </div>`
    : `<div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:24px;background:#fafafa;">
    ${cohortSvg}
    <div style="font-size:10pt;color:#d1d5db;text-align:center;margin-top:8px;">Connect CTF assessment data to unlock per-cohort journey tracking</div>
  </div>`;

  // Build key findings cards
  const findingCards = (data.narrative.keyFindings ?? []).slice(0, 3).map((f, i) => `
    <div class="finding-card editable-region" data-field="finding-${i}" style="flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;">
      <div class="key-number" style="font-size:36px;font-weight:800;color:${primary};line-height:1;margin-bottom:8px;">${esc(f.number)}</div>
      <div class="editable" style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">${i + 1}. ${esc(f.title)}</div>
      <div class="editable" style="font-size:12px;color:#4b5563;line-height:1.5;">${esc(f.detail)}</div>
    </div>`).join('');

  // Build recommendations
  const recCards = (data.narrative.recommendations ?? []).slice(0, 3).map((r, i) => `
    <div class="rec-card" data-field="rec-${i}" style="border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:12px;background:white;">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <div class="action-number" style="width:32px;height:32px;border-radius:50%;background:${primary};color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0;">${i + 1}</div>
        <div style="flex:1;">
          <div class="editable" style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">${esc(r.action)}</div>
          ${r.eefStrategy ? `<span class="eef-badge" style="display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600;margin-bottom:8px;">EEF: ${esc(r.eefStrategy)}</span>` : ''}
          <div style="display:flex;gap:16px;font-size:12px;color:#6b7280;margin-top:4px;">
            <span><strong>Impact:</strong> <span class="editable">${esc(r.impact)}</span></span>
            <span><strong>Cost:</strong> <span class="editable">${esc(r.cost)}</span></span>
          </div>
        </div>
      </div>
    </div>`).join('');

  // Build governor questions
  const questionItems = (data.narrative.questionsForHeadteacher ?? []).slice(0, 5).map((q, i) => `
    <div class="question-card" data-field="question-${i}" style="border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:12px;background:white;">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <div class="question-number" style="font-size:22px;font-weight:800;color:${primary};flex-shrink:0;width:30px;text-align:center;">${i + 1}</div>
        <div class="editable" style="font-size:14px;color:#111827;line-height:1.6;">${esc(q)}</div>
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

  // At-a-glance stat boxes (Page 1 hero row) — only render if data exists
  const heroStatItems = [
    data.y6Combined !== null ? { label: 'Y6 Combined', value: `${data.y6Combined}%`, sub: 'All Pupils ARE' } : null,
    data.fsmPct !== null ? { label: 'FSM Eligible', value: `${data.fsmPct}%`, sub: 'of all pupils' } : null,
    data.totalPupils !== null ? { label: 'Total Pupils', value: String(data.totalPupils), sub: 'on roll' } : null,
  ].filter(Boolean) as { label: string; value: string; sub: string }[];
  const heroStats = heroStatItems.map(s => `
    <div class="stat-tile" style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;text-align:center;flex:1;">
      <div class="key-number" style="font-size:24px;font-weight:800;color:#111827;">${esc(s.value)}</div>
      <div style="font-size:13px;font-weight:600;color:#374151;margin-top:4px;">${esc(s.label)}</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${esc(s.sub)}</div>
    </div>`).join('');

  // School logo or text fallback
  const logoHtml = data.schoolLogoUrl
    ? `<img src="${esc(data.schoolLogoUrl)}" alt="${esc(data.schoolName)} logo" style="max-height:50px;max-width:120px;object-fit:contain;" />`
    : `<div style="font-size:16px;font-weight:800;color:${primary};">${esc(data.schoolName)}</div>`;

  // Confidentiality watermark
  const confWatermark = data.confidential
    ? `<div id="conf-watermark" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:80px;font-weight:900;color:rgba(0,0,0,0.04);z-index:0;pointer-events:none;white-space:nowrap;letter-spacing:8px;">CONFIDENTIAL</div>`
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
  const percentileNumeric = data.nationalPercentile ?? data.y6Combined ?? 0;

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
      .no-print { display: none !important; }
      .speaker-prompt { display: none !important; }
      #edit-toolbar { display: none !important; }
      #edits-banner { display: none !important; }
      .is-presenting .page { display: none !important; }
    }
    .page-break { page-break-before: always; }

    /* ── Control panel ── */
    #control-panel {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9000;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ctrl-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid rgba(0,0,0,0.15);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      background: white;
      color: #374151;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      transition: background 0.15s, box-shadow 0.15s;
      font-family: system-ui, sans-serif;
      line-height: 1;
    }
    .ctrl-btn:hover { background: #f9fafb; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
    .ctrl-btn.active { background: ${primary}; color: white; border-color: ${primary}; }
    .export-wrap { position: relative; }
    .export-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      min-width: 180px;
      overflow: hidden;
      display: none;
      z-index: 9001;
    }
    .export-menu.open { display: block; }
    .export-menu button {
      display: block;
      width: 100%;
      padding: 10px 16px;
      text-align: left;
      font-size: 13px;
      color: #374151;
      background: none;
      border: none;
      cursor: pointer;
      font-family: system-ui, sans-serif;
    }
    .export-menu button:hover { background: #f9fafb; }

    /* ── Speaker prompts ── */
    .speaker-prompt {
      display: none;
      margin-top: 16px;
      padding: 12px 16px;
      background: #fefce8;
      border: 1px solid #fde68a;
      border-radius: 8px;
      font-size: 11px;
      color: #92400e;
      line-height: 1.6;
      font-style: italic;
    }

    /* ── Edit mode styles ── */
    body.edit-mode .editable {
      outline: 1px dashed #6366f1 !important;
      border-radius: 3px;
      cursor: text;
    }
    body.edit-mode .editable:hover {
      outline: 2px solid #6366f1 !important;
      background: rgba(99,102,241,0.04) !important;
    }
    body.edit-mode .editable:focus {
      outline: 2px solid #6366f1 !important;
      background: rgba(99,102,241,0.06) !important;
    }
    #edit-toolbar {
      display: none;
      position: fixed;
      top: 60px;
      right: 16px;
      z-index: 8999;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      padding: 10px;
      gap: 8px;
      flex-direction: column;
      min-width: 160px;
    }
    #edit-toolbar.visible { display: flex; }
    .edit-toolbar-btn {
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      background: white;
      color: #374151;
      font-family: system-ui, sans-serif;
      text-align: center;
    }
    .edit-toolbar-btn:hover { background: #f9fafb; }
    .edit-toolbar-btn.save { background: ${primary}; color: white; border-color: ${primary}; }
    .edit-toolbar-btn.save:hover { opacity: 0.9; }

    /* ── Edits banner ── */
    #edits-banner {
      display: none;
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9000;
      background: #1e1b4b;
      color: white;
      border-radius: 10px;
      padding: 12px 20px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    #edits-banner button {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      font-family: system-ui, sans-serif;
      font-weight: 600;
    }
    #edits-banner .btn-keep { background: ${primary}; color: white; border: none; }
    #edits-banner .btn-revert { background: transparent; color: #a5b4fc; border: 1px solid #4338ca; }

    /* ══════════════════════════════════════════
       PRESENTATION MODE
    ════════════════════════════════════════════ */
    body.is-presenting {
      background: #0f0e17 !important;
      overflow: hidden;
    }
    body.is-presenting #control-panel { top: 12px; right: 12px; }
    body.is-presenting .ctrl-btn { background: rgba(255,255,255,0.1); color: white; border-color: rgba(255,255,255,0.2); }
    body.is-presenting .ctrl-btn:hover { background: rgba(255,255,255,0.2); }

    /* Hide all pages by default in present mode */
    body.is-presenting .page {
      display: none !important;
    }
    /* Show only active slide */
    body.is-presenting .page.slide-active {
      display: block !important;
      position: fixed !important;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100vw !important;
      min-height: 100vh !important;
      margin: 0 !important;
      padding: 5vw 7vw 80px !important;
      background: white !important;
      overflow-y: auto;
      box-shadow: none !important;
      border-radius: 0 !important;
      z-index: 100;
      animation: slide-enter 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    @keyframes slide-enter {
      from { opacity: 0; transform: translateX(40px); }
      to { opacity: 1; transform: translateX(0); }
    }

    /* Navigation overlay */
    #pres-nav {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 200;
      padding: 16px 24px;
      background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
      align-items: center;
      justify-content: space-between;
    }
    body.is-presenting #pres-nav { display: flex; }

    #pres-progress-dots {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .pres-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      transition: background 0.2s, transform 0.2s;
      cursor: pointer;
    }
    .pres-dot.active {
      background: white;
      transform: scale(1.4);
    }

    #pres-counter {
      font-size: 13px;
      color: rgba(255,255,255,0.7);
      font-family: system-ui, sans-serif;
    }

    .pres-arrow {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .pres-arrow:hover { background: rgba(255,255,255,0.3); }
    .pres-arrow:disabled { opacity: 0.3; cursor: default; }

    /* Speaker prompt in present mode */
    body.is-presenting .speaker-prompt {
      display: block !important;
      position: relative;
      margin-top: 20px;
    }

    /* Key number pulse animation */
    @keyframes key-pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      50% { transform: scale(1.03); box-shadow: 0 0 0 16px rgba(239, 68, 68, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    .key-number--pulse {
      animation: key-pulse 1.5s ease-out 0.4s;
    }

    /* Stagger animations for cards */
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slide-right {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes scale-bounce {
      0% { transform: scale(0); opacity: 0; }
      60% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes word-reveal {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes circle-draw {
      from { stroke-dashoffset: 100; }
      to { stroke-dashoffset: 0; }
    }
  </style>
</head>
<body>
${confWatermark}

<!-- ══════════════════════════════════════════════════════════════════
     CONTROL PANEL (top-right, no-print)
═══════════════════════════════════════════════════════════════════ -->
<div id="control-panel" class="no-print" role="toolbar" aria-label="Report controls">
  <button id="btn-present" class="ctrl-btn" aria-label="Enter presentation mode" title="Present (fullscreen)">▶ Present</button>
  <button id="btn-edit" class="ctrl-btn" aria-label="Toggle edit mode" title="Edit report text">✏ Edit</button>
  <div class="export-wrap">
    <button id="btn-export" class="ctrl-btn" aria-haspopup="true" aria-expanded="false" title="Export options">⬇ Export</button>
    <div id="export-menu" class="export-menu" role="menu">
      <button data-export="html" role="menuitem">Save as HTML</button>
      <button data-export="md" role="menuitem">Save as Markdown</button>
      <button data-export="pdf" role="menuitem">Print / Save as PDF</button>
      <button data-export="txt" role="menuitem">Copy as plain text</button>
    </div>
  </div>
</div>

<!-- Edit toolbar -->
<div id="edit-toolbar" role="toolbar" aria-label="Edit mode controls">
  <div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.05em;padding:0 4px 4px;">Edit Mode</div>
  <button class="edit-toolbar-btn save" id="btn-save-edits">Save Changes</button>
  <button class="edit-toolbar-btn" id="btn-reset-edits">Reset to Original</button>
  <button class="edit-toolbar-btn" id="btn-exit-edit">Exit Edit Mode</button>
</div>

<!-- Edits banner (shown on load if saved edits exist) -->
<div id="edits-banner" role="status" style="display:none;">
  <span>You have saved edits.</span>
  <button class="btn-revert" id="btn-revert-edits">Revert to original</button>
  <button class="btn-keep" id="btn-keep-edits">Keep my edits</button>
</div>

<!-- ══════════════════════════════════════════════════════════════════
     PAGE 1 — Executive Summary
═══════════════════════════════════════════════════════════════════ -->
<div class="page" id="slide-1" data-slide="1" data-slide-title="Executive Summary">

  <!-- Speaker prompt (hidden by default, shown in present mode) -->
  <aside class="speaker-prompt no-print" aria-hidden="true">${esc(prompts.p1)}</aside>

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
    <div id="hero-percentile" class="hero-number key-number" style="color:${sevColor};">${esc(percentileDisplay)}</div>
    <div style="font-size:11pt;color:#6b7280;margin-top:4px;margin-bottom:14px;">${esc(percentileLabel)}</div>
    ${rankText ? `<div style="font-size:10pt;color:#6b7280;margin-bottom:14px;">${esc(rankText)}</div>` : ''}
    <span id="sev-badge" class="label-tag" style="background:${sevColor}1a;color:${sevColor};">${esc(sevLabel)}</span>
    <p class="editable" style="font-size:12pt;font-weight:600;color:#111827;margin-top:14px;">${esc(data.narrative.verdict)}</p>
  </div>

  <!-- At-a-glance stat row -->
  <div style="display:flex;gap:12px;margin-bottom:24px;">
    ${heroStats}
  </div>

  <!-- Headline callout -->
  <div class="callout">
    <div style="font-size:8pt;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${primary};margin-bottom:6px;">Key Finding</div>
    <p class="editable">${esc(data.narrative.headline)}</p>
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
<div class="page page-break" id="slide-2" data-slide="2" data-slide-title="Cohort Performance">

  <aside class="speaker-prompt no-print" aria-hidden="true">${esc(prompts.p2)}</aside>

  <div class="section-title">Cohort Performance</div>

  <!-- Chart (gracefully skipped if no cohort data) -->
  ${chartBlock}

  <!-- Context & Defence narrative -->
  <div style="margin-bottom:24px;">
    <div style="font-size:11pt;font-weight:700;color:#111827;margin-bottom:10px;">Context and Analysis</div>
    <p class="editable" style="font-size:11pt;color:#374151;line-height:1.65;">${esc(data.narrative.contextDefence)}</p>
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
<div class="page page-break" id="slide-3" data-slide="3" data-slide-title="Recommended Actions">

  <aside class="speaker-prompt no-print" aria-hidden="true">${esc(prompts.p3)}</aside>

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
     PAGE 4 — Intra-Year Progression + Governor Questions
═══════════════════════════════════════════════════════════════════ -->
<div class="page page-break" id="slide-4" data-slide="4" data-slide-title="Intra-Year Progression &amp; Questions">

  <aside class="speaker-prompt no-print" aria-hidden="true">${esc(prompts.p4)}</aside>

  <!-- Reliability tier legend -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:9pt;color:#6b7280;flex-wrap:wrap;">
    <span style="font-weight:700;color:#374151;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.05em;">Data tiers:</span>
    <span style="display:inline-flex;align-items:center;gap:4px;background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:999px;padding:2px 8px;font-weight:700;font-size:8pt;">&#9679; External</span>
    <span style="display:inline-flex;align-items:center;gap:4px;background:#fef9c3;color:#854d0e;border:1px solid #fde047;border-radius:999px;padding:2px 8px;font-weight:700;font-size:8pt;">&#9679; Derived</span>
    <span style="display:inline-flex;align-items:center;gap:4px;background:#ffe4e6;color:#9f1239;border:1px solid #fda4af;border-radius:999px;padding:2px 8px;font-weight:700;font-size:8pt;">&#9679; Self-reported</span>
    <span style="font-size:8pt;color:#9ca3af;margin-left:4px;">External = DfE validated. Self-reported = school/trust assessment data.</span>
  </div>

  ${(data.intraYearProgression && data.intraYearProgression.length > 0) ? `
  <div style="margin-bottom:24px;">
    <div class="section-title" style="margin-bottom:12px;">Intra-Year Progression — Autumn → Mid-year → Target</div>
    <div style="font-size:10pt;color:#6b7280;margin-bottom:14px;">All data self-reported. Typical Autumn→Mid gain: 3–5pp. Flags shown where delta exceeds threshold.</div>
    <table style="width:100%;border-collapse:collapse;font-size:10pt;">
      <thead>
        <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
          <th style="text-align:left;padding:8px 10px;color:#374151;font-weight:700;">Year Group</th>
          <th style="text-align:center;padding:8px 10px;color:#374151;font-weight:700;">Autumn</th>
          <th style="text-align:center;padding:8px 10px;color:#374151;font-weight:700;">Mid-year <span style="font-weight:400;color:#9ca3af;">(self-rep)</span></th>
          <th style="text-align:center;padding:8px 10px;color:#374151;font-weight:700;">Target</th>
          <th style="text-align:center;padding:8px 10px;color:#374151;font-weight:700;">Autumn→Mid Δ</th>
          <th style="text-align:left;padding:8px 10px;color:#374151;font-weight:700;">Flag</th>
        </tr>
      </thead>
      <tbody>
        ${data.intraYearProgression.map((row, idx) => {
          const rowBg = idx % 2 === 0 ? '#fff' : '#f9fafb';
          const deltaColor = row.isOutlierRed ? '#991b1b' : row.isOutlierAmber ? '#92400e' : row.delta !== null && row.delta >= 0 ? '#065f46' : '#6b7280';
          const deltaBg = row.isOutlierRed ? '#fecaca' : row.isOutlierAmber ? '#fde68a' : '#f0fdf4';
          const flagText = row.isOutlierRed ? 'Significant outlier >8pp' : row.isOutlierAmber ? 'Outlier >5pp — verify' : '';
          const flagColor = row.isOutlierRed ? '#991b1b' : '#92400e';
          return `<tr style="background:${rowBg};border-bottom:1px solid #f3f4f6;">
            <td style="padding:8px 10px;font-weight:700;color:#111827;">${esc(row.yearGroup)}</td>
            <td style="padding:8px 10px;text-align:center;color:#374151;">${row.autumnCombined !== null ? `${row.autumnCombined}%` : '—'}</td>
            <td style="padding:8px 10px;text-align:center;font-weight:700;color:#374151;">${row.midYearCombined !== null ? `${row.midYearCombined}%` : '—'}</td>
            <td style="padding:8px 10px;text-align:center;color:#9ca3af;font-style:italic;">${row.targetCombined !== null ? `${row.targetCombined}%` : '—'}</td>
            <td style="padding:8px 10px;text-align:center;"><span style="background:${deltaBg};color:${deltaColor};border-radius:999px;padding:2px 8px;font-weight:700;">${row.delta !== null ? `${row.delta >= 0 ? '+' : ''}${row.delta}pp` : '—'}</span></td>
            <td style="padding:8px 10px;font-size:9pt;color:${flagColor};font-weight:700;">${flagText}</td>
          </tr>
          ${row.ks1Baseline ? `<tr style="background:#f0fdf4;"><td colspan="6" style="padding:6px 10px;font-size:9pt;color:#065f46;border-bottom:1px solid #bbf7d0;">
            <strong style="color:#14532d;">KS1 ${esc(row.ks1Baseline.year)} Combined: ${row.ks1Baseline.combined !== null ? `${row.ks1Baseline.combined}%` : '—'}</strong>
            <span style="margin-left:8px;background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:999px;padding:1px 6px;font-weight:700;font-size:8pt;">External · last statutory year</span>
            ${row.midYearCombined !== null && row.ks1Baseline.combined !== null ? `<span style="margin-left:8px;color:#374151;">vs mid-year: <strong>${Math.round(row.midYearCombined - row.ks1Baseline.combined) >= 0 ? '+' : ''}${Math.round(row.midYearCombined - row.ks1Baseline.combined)}pp</strong></span>` : ''}
          </td></tr>` : ''}`;
        }).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <!-- Auto-generated Five Questions based on outlier data -->
  <div class="section-title">Five Questions for the Headteacher</div>
  <div style="font-size:9.5pt;color:#6b7280;margin-bottom:12px;">Auto-generated from the intra-year data. Each question is exploratory, not accusatory.</div>

  ${(data.intraYearProgression && data.intraYearProgression.some(r => r.isOutlierRed || r.isOutlierAmber)) ? (() => {
    const outlierQuestions: string[] = [];
    for (const row of (data.intraYearProgression ?? [])) {
      if (!row.delta) continue;
      if (row.isOutlierRed && row.delta > 0) {
        outlierQuestions.push(`${row.yearGroup} Combined jumped <strong>${row.delta >= 0 ? '+' : ''}${row.delta}pp</strong> from Autumn to Mid-year. Most cohorts show 3–5pp at this point. What&apos;s driving the faster progress, and what moderation supported it?`);
      }
      if (row.subjectDeltas?.writing && Math.abs(row.subjectDeltas.writing) > 8) {
        outlierQuestions.push(`Writing in ${row.yearGroup} jumped <strong>${row.subjectDeltas.writing >= 0 ? '+' : ''}${row.subjectDeltas.writing}pp</strong> Autumn to Mid-year. Writing is the subject most vulnerable to teacher-assessment drift. What moderation occurred between checkpoints?`);
      }
      if (row.nonFsmDelta !== null && row.fsmDelta !== null && row.nonFsmDelta > (row.fsmDelta ?? 0) + 5) {
        outlierQuestions.push(`In ${row.yearGroup}, non-FSM pupils gained <strong>${row.nonFsmDelta}pp</strong> vs FSM pupils <strong>${row.fsmDelta}pp</strong>. Typically Pupil Premium strategy drives faster FSM progress. Is there a reason the gain is reversed here?`);
      }
      if (row.ks1Baseline?.combined !== null && row.midYearCombined !== null && row.midYearCombined - (row.ks1Baseline?.combined ?? 0) > 5) {
        const gap = Math.round(row.midYearCombined - (row.ks1Baseline?.combined ?? 0));
        outlierQuestions.push(`This cohort&apos;s KS1 ${row.ks1Baseline?.year} Combined was <strong>${row.ks1Baseline?.combined}%</strong> (externally moderated). The mid-year prediction is <strong>${row.midYearCombined}%</strong> — <strong>+${gap}pp above</strong> the last external anchor. What evidence supports clearing the KS1 baseline by ${gap}pp?`);
      }
    }
    // Add external validation question if any outliers
    outlierQuestions.push('What external validation — beyond teacher assessment — would give the trust confidence in these figures? Cross-moderation? SATs practice paper outcomes? Standardised reading scores?');
    return outlierQuestions.slice(0, 5).map((q, i) => `
      <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin-bottom:10px;background:white;">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <div style="font-size:20px;font-weight:800;color:${primary};flex-shrink:0;width:28px;text-align:center;">${i + 1}</div>
          <div style="font-size:12px;color:#111827;line-height:1.6;">${q}</div>
        </div>
      </div>`).join('');
  })() : questionItems}

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

<!-- ══════════════════════════════════════════════════════════════════
     PRESENTATION NAVIGATION OVERLAY
═══════════════════════════════════════════════════════════════════ -->
<div id="pres-nav" class="no-print" role="navigation" aria-label="Presentation navigation">
  <button class="pres-arrow" id="pres-prev" aria-label="Previous slide" disabled>&#8592;</button>
  <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
    <div id="pres-progress-dots">
      <button class="pres-dot active" data-target="0" aria-label="Slide 1"></button>
      <button class="pres-dot" data-target="1" aria-label="Slide 2"></button>
      <button class="pres-dot" data-target="2" aria-label="Slide 3"></button>
      <button class="pres-dot" data-target="3" aria-label="Slide 4"></button>
    </div>
    <div id="pres-counter">1 / 4</div>
  </div>
  <button class="pres-arrow" id="pres-next" aria-label="Next slide">&#8594;</button>
</div>

<!-- ══════════════════════════════════════════════════════════════════
     INLINE JAVASCRIPT
═══════════════════════════════════════════════════════════════════ -->
<script>
(function() {
  'use strict';

  /* ── Constants ── */
  var SHARE_TOKEN = '${shareToken}';
  var STORAGE_KEY = 'report-' + SHARE_TOKEN + '-edits';
  var TOTAL_SLIDES = 4;
  var slides = Array.from(document.querySelectorAll('.page[data-slide]'));
  var currentSlide = 0;
  var isPresenting = false;
  var isEditing = false;

  /* ── Helpers ── */
  function $(id) { return document.getElementById(id); }

  /* ─── Count-up animation ─── */
  function countUp(el, from, to, duration) {
    if (!el) return;
    var start = null;
    var isFloat = String(to).indexOf('.') !== -1;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var val = from + (to - from) * eased;
      el.textContent = isFloat ? val.toFixed(1) : Math.round(val);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ─── Animate chart lines ─── */
  function animateChart() {
    var lines = document.querySelectorAll('.chart-line');
    lines.forEach(function(line, i) {
      setTimeout(function() {
        line.style.strokeDashoffset = '0';
      }, i * 200);
    });
    setTimeout(function() {
      document.querySelectorAll('.chart-dot').forEach(function(dot) {
        dot.style.opacity = '1';
      });
    }, 1200);
  }

  /* ─── Animate finding cards ─── */
  function animateFindingCards() {
    document.querySelectorAll('.finding-card').forEach(function(card, i) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(function() {
        card.style.transition = 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 300 + i * 120);
    });
  }

  /* ─── Animate rec cards ─── */
  function animateRecCards() {
    document.querySelectorAll('.rec-card').forEach(function(card, i) {
      card.style.opacity = '0';
      card.style.transform = 'translateX(30px)';
      setTimeout(function() {
        card.style.transition = 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)';
        card.style.opacity = '1';
        card.style.transform = 'translateX(0)';
        var badge = card.querySelector('.eef-badge');
        if (badge) {
          badge.style.transform = 'scale(0)';
          setTimeout(function() {
            badge.style.transition = 'transform 0.4s cubic-bezier(0.22,1,0.36,1)';
            badge.style.transform = 'scale(1)';
          }, 250);
        }
        var num = card.querySelector('.action-number');
        if (num) { num.classList.add('key-number--pulse'); }
      }, 200 + i * 150);
    });
  }

  /* ─── Animate question cards ─── */
  function animateQuestionCards() {
    document.querySelectorAll('.question-card').forEach(function(card, i) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(16px)';
      setTimeout(function() {
        card.style.transition = 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 150 + i * 130);
    });
  }

  /* ─── Animate stat tiles ─── */
  function animateStatTiles() {
    document.querySelectorAll('.stat-tile').forEach(function(tile, i) {
      tile.style.opacity = '0';
      tile.style.transform = 'translateY(20px)';
      setTimeout(function() {
        tile.style.transition = 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)';
        tile.style.opacity = '1';
        tile.style.transform = 'translateY(0)';
      }, 600 + i * 100);
    });
  }

  /* ─── On slide enter ─── */
  function onSlideEnter(idx) {
    var slide = slides[idx];
    if (!slide) return;

    if (idx === 0) {
      // Page 1: count up hero number, pulse badge, animate stat tiles
      var heroEl = $('hero-percentile');
      if (heroEl) {
        var target = ${percentileNumeric};
        if (target > 0) {
          heroEl.textContent = '0';
          setTimeout(function() { countUp(heroEl, 0, target, 1200); }, 200);
        }
        setTimeout(function() { heroEl.classList.add('key-number--pulse'); }, 1400);
      }
      var badge = $('sev-badge');
      if (badge) {
        badge.style.opacity = '0';
        badge.style.transform = 'scale(0.7)';
        setTimeout(function() {
          badge.style.transition = 'opacity 0.4s, transform 0.4s cubic-bezier(0.22,1,0.36,1)';
          badge.style.opacity = '1';
          badge.style.transform = 'scale(1)';
        }, 300);
      }
      animateStatTiles();
      animateFindingCards();
    } else if (idx === 1) {
      // Page 2: chart line draw
      setTimeout(animateChart, 300);
    } else if (idx === 2) {
      // Page 3: rec cards slide in
      animateRecCards();
    } else if (idx === 3) {
      // Page 4: question cards stagger
      animateQuestionCards();
    }
  }

  /* ══════════════════════════════════════
     PRESENTATION MODE
  ════════════════════════════════════════ */
  function enterPresentation() {
    isPresenting = true;
    document.body.classList.add('is-presenting');
    $('btn-present').classList.add('active');
    $('btn-present').textContent = '✕ Exit';
    try { document.documentElement.requestFullscreen(); } catch(e) {}
    goToSlide(0);
  }

  function exitPresentation() {
    isPresenting = false;
    document.body.classList.remove('is-presenting');
    slides.forEach(function(s) { s.classList.remove('slide-active'); });
    $('btn-present').classList.remove('active');
    $('btn-present').textContent = '▶ Present';
    try { document.exitFullscreen(); } catch(e) {}
  }

  function goToSlide(idx) {
    if (idx < 0 || idx >= TOTAL_SLIDES) return;
    slides.forEach(function(s) { s.classList.remove('slide-active'); });
    slides[idx].classList.add('slide-active');
    currentSlide = idx;

    // Update dots
    document.querySelectorAll('.pres-dot').forEach(function(dot, i) {
      dot.classList.toggle('active', i === idx);
    });

    // Update counter
    var counter = $('pres-counter');
    if (counter) counter.textContent = (idx + 1) + ' / ' + TOTAL_SLIDES;

    // Update arrows
    var prev = $('pres-prev'), next = $('pres-next');
    if (prev) prev.disabled = idx === 0;
    if (next) next.disabled = idx === TOTAL_SLIDES - 1;

    // Scroll slide to top
    slides[idx].scrollTop = 0;

    // Trigger entry animations
    onSlideEnter(idx);
  }

  function nextSlide() { if (currentSlide < TOTAL_SLIDES - 1) goToSlide(currentSlide + 1); }
  function prevSlide() { if (currentSlide > 0) goToSlide(currentSlide - 1); }

  // Button handlers
  $('btn-present').addEventListener('click', function() {
    if (isPresenting) exitPresentation(); else enterPresentation();
  });

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (!isPresenting) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault(); nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'ArrowUp') {
      e.preventDefault(); prevSlide();
    } else if (e.key === 'Escape') {
      exitPresentation();
    }
  });

  $('pres-prev').addEventListener('click', prevSlide);
  $('pres-next').addEventListener('click', nextSlide);

  document.querySelectorAll('.pres-dot').forEach(function(dot, i) {
    dot.addEventListener('click', function() { goToSlide(i); });
  });

  // Exit fullscreen detection
  document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement && isPresenting) exitPresentation();
  });

  /* ══════════════════════════════════════
     EDIT MODE
  ════════════════════════════════════════ */
  function enterEditMode() {
    isEditing = true;
    document.body.classList.add('edit-mode');
    $('btn-edit').classList.add('active');
    $('btn-edit').textContent = '✕ Editing';
    $('edit-toolbar').classList.add('visible');

    // Make all .editable elements contenteditable
    document.querySelectorAll('.editable').forEach(function(el, i) {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('data-original', el.innerHTML);
      if (!el.id) el.id = 'editable-' + i;
    });
  }

  function exitEditMode() {
    isEditing = false;
    document.body.classList.remove('edit-mode');
    $('btn-edit').classList.remove('active');
    $('btn-edit').textContent = '✏ Edit';
    $('edit-toolbar').classList.remove('visible');

    document.querySelectorAll('.editable').forEach(function(el) {
      el.removeAttribute('contenteditable');
    });
  }

  function saveEdits() {
    var edits = {};
    document.querySelectorAll('.editable[id]').forEach(function(el) {
      edits[el.id] = el.innerHTML;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), edits: edits }));
      // Visual feedback
      var btn = $('btn-save-edits');
      btn.textContent = 'Saved ✓';
      setTimeout(function() { btn.textContent = 'Save Changes'; }, 2000);
    } catch(e) {
      alert('Could not save to localStorage. Your browser may have storage disabled.');
    }

    // Fire-and-forget POST to save-edits endpoint
    try {
      fetch('/api/trust-assessor/generate-report/save-edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareToken: SHARE_TOKEN, edits: edits })
      }).catch(function() {}); // Ignore errors — localStorage is the source of truth
    } catch(e) {}
  }

  function resetEdits() {
    if (!confirm('Reset all text to the original AI-generated content? This cannot be undone.')) return;
    document.querySelectorAll('.editable[data-original]').forEach(function(el) {
      el.innerHTML = el.getAttribute('data-original');
    });
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    hideBanner();
  }

  function applyEdits(edits) {
    Object.keys(edits).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = edits[id];
    });
  }

  $('btn-edit').addEventListener('click', function() {
    if (isEditing) exitEditMode(); else enterEditMode();
  });
  $('btn-save-edits').addEventListener('click', saveEdits);
  $('btn-reset-edits').addEventListener('click', resetEdits);
  $('btn-exit-edit').addEventListener('click', exitEditMode);

  /* ── Load saved edits on startup ── */
  function hideBanner() {
    var b = $('edits-banner');
    if (b) b.style.display = 'none';
  }

  (function loadSavedEdits() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || !saved.edits) return;

      var banner = $('edits-banner');
      if (banner) {
        banner.style.display = 'flex';
        $('btn-keep-edits').addEventListener('click', function() {
          // Pre-apply edits first, then assign IDs
          document.querySelectorAll('.editable').forEach(function(el, i) {
            if (!el.id) el.id = 'editable-' + i;
          });
          applyEdits(saved.edits);
          hideBanner();
        });
        $('btn-revert-edits').addEventListener('click', function() {
          try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
          hideBanner();
        });
      }
    } catch(e) {}
  })();

  /* ══════════════════════════════════════
     EXPORT
  ════════════════════════════════════════ */
  var exportBtn = $('btn-export');
  var exportMenu = $('export-menu');

  exportBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = exportMenu.classList.contains('open');
    exportMenu.classList.toggle('open');
    exportBtn.setAttribute('aria-expanded', !isOpen);
  });

  document.addEventListener('click', function() {
    exportMenu.classList.remove('open');
    exportBtn.setAttribute('aria-expanded', 'false');
  });

  function getEditedHtml() {
    // Clone the document, remove no-print elements, return outer HTML
    var clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('.no-print').forEach(function(el) { el.remove(); });
    return '<!DOCTYPE html>\\n' + clone.outerHTML;
  }

  function htmlToMarkdown() {
    var lines = [];
    var schoolName = ${JSON.stringify(esc(data.schoolName))};
    lines.push('# ' + schoolName + ' — Governor Assessment Report');
    lines.push('*' + ${JSON.stringify(esc(data.reportDate))} + ' | Academic Year ' + ${JSON.stringify(esc(data.academicYear))} + '*');
    lines.push('');

    // Verdict
    var verdict = document.querySelector('#slide-1 .hero-number');
    var badge = $('sev-badge');
    if (verdict) lines.push('## ' + (verdict.textContent || '') + ' ' + (badge ? badge.textContent : ''));
    lines.push('');

    // Key findings
    lines.push('## Key Findings');
    document.querySelectorAll('.finding-card').forEach(function(card, i) {
      var divs = card.querySelectorAll('.editable');
      if (divs.length >= 2) {
        lines.push((i+1) + '. **' + (divs[0].textContent || '').trim() + '**');
        lines.push('   ' + (divs[1].textContent || '').trim());
      }
    });
    lines.push('');

    // Headline
    var headline = document.querySelector('.callout .editable');
    if (headline) {
      lines.push('## Key Finding');
      lines.push((headline.textContent || '').trim());
      lines.push('');
    }

    // Context
    var context = document.querySelector('#slide-2 .editable');
    if (context) {
      lines.push('## Context and Analysis');
      lines.push((context.textContent || '').trim());
      lines.push('');
    }

    // Recommendations
    lines.push('## Recommended Actions');
    document.querySelectorAll('.rec-card').forEach(function(card, i) {
      var action = card.querySelector('.editable');
      var badge = card.querySelector('.eef-badge');
      if (action) {
        lines.push((i+1) + '. ' + (action.textContent || '').trim());
        if (badge) lines.push('   *EEF: ' + (badge.textContent || '').replace('EEF: ', '').trim() + '*');
      }
    });
    lines.push('');

    // Questions
    lines.push('## Questions for the Board');
    document.querySelectorAll('.question-card .editable').forEach(function(el, i) {
      lines.push((i+1) + '. ' + (el.textContent || '').trim());
    });
    lines.push('');
    lines.push('---');
    lines.push('*Generated by Schoolgle Intelligence. AI-assisted — review before formal use.*');

    return lines.join('\\n');
  }

  function downloadBlob(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportMenu.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-export]');
    if (!btn) return;
    var type = btn.getAttribute('data-export');
    var safeName = ${JSON.stringify(data.schoolName.replace(/[^a-z0-9]/gi, '-').toLowerCase())};

    if (type === 'html') {
      downloadBlob(getEditedHtml(), safeName + '-governor-report.html', 'text/html;charset=utf-8');
    } else if (type === 'md') {
      downloadBlob(htmlToMarkdown(), safeName + '-governor-report.md', 'text/markdown;charset=utf-8');
    } else if (type === 'pdf') {
      window.print();
    } else if (type === 'txt') {
      var text = document.querySelectorAll('.page');
      var plain = Array.from(text).map(function(p) { return p.innerText || p.textContent || ''; }).join('\\n\\n---\\n\\n');
      navigator.clipboard.writeText(plain).then(function() {
        btn.textContent = 'Copied ✓';
        setTimeout(function() { btn.textContent = 'Copy as plain text'; }, 2000);
      }).catch(function() {
        prompt('Copy this text:', plain);
      });
    }

    exportMenu.classList.remove('open');
  });

})();
</script>

</body>
</html>`;
}
