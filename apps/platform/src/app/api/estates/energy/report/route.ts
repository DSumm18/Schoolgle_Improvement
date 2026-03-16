/**
 * AI Energy Report Generation
 *
 * POST /api/estates/energy/report — Generate a trustee-quality energy report
 * GET  /api/estates/energy/report — List previously generated reports
 *
 * Uses DeepSeek to analyse energy data and produce a structured report
 * that auto-links to the governance document suite.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "deepseek/deepseek-chat";

// ─── GET: List reports ───────────────────────────────────────────────

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;

  const { data: reports, error } = await supabase
    .from("generated_documents")
    .select("id, subject, status, created_at, created_by, category")
    .eq("organization_id", orgId)
    .eq("module", "estates")
    .eq("category", "energy_report")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return apiError(`Failed to fetch reports: ${error.message}`, 500);
  }

  return apiSuccess({ reports: reports ?? [] });
});

// ─── POST: Generate report ───────────────────────────────────────────

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  const body = await request.json();
  const { period_months = 12, include_recommendations = true } = body;

  // ─── 1. Gather all energy data ──────────────────────────────────

  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - period_months);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  // Parallel data fetch
  const [
    { data: meters },
    { data: invoices },
    { data: anomalies },
    { data: hhReadings },
    { data: termDates },
    { data: calendarEvents },
  ] = await Promise.all([
    supabase.from("energy_meters").select("*").eq("organization_id", orgId),
    supabase
      .from("energy_invoices")
      .select("*")
      .eq("organization_id", orgId)
      .gte("invoice_date", startStr)
      .order("invoice_date"),
    supabase
      .from("energy_anomalies")
      .select("*")
      .eq("organization_id", orgId)
      .gte("detected_date", startStr)
      .order("detected_date"),
    supabase
      .from("energy_hh_readings")
      .select("reading_timestamp, kwh, day_type, is_school_day")
      .eq("organization_id", orgId)
      .gte("reading_timestamp", `${startStr}T00:00:00Z`)
      .lte("reading_timestamp", `${endStr}T23:59:59Z`)
      .order("reading_timestamp"),
    supabase
      .from("school_term_dates")
      .select("*")
      .eq("organization_id", orgId)
      .order("start_date"),
    supabase
      .from("school_calendar_events")
      .select("*")
      .eq("organization_id", orgId)
      .gte("start_date", startStr)
      .order("start_date"),
  ]);

  // ─── 2. Calculate summary metrics ────────────────────────────────

  // Monthly consumption aggregation
  const monthlyMap = new Map<
    string,
    { electricity: number; gas: number; cost: number }
  >();
  for (const inv of invoices ?? []) {
    const month = (inv.invoice_date as string).slice(0, 7);
    const existing = monthlyMap.get(month) ?? {
      electricity: 0,
      gas: 0,
      cost: 0,
    };
    if (inv.energy_type === "electricity") {
      existing.electricity += inv.total_kwh ?? 0;
    } else {
      existing.gas += inv.total_kwh ?? 0;
    }
    existing.cost += inv.total_amount ?? 0;
    monthlyMap.set(month, existing);
  }

  const monthlyData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  // Total consumption
  const totalElec = monthlyData.reduce((s, m) => s + m.electricity, 0);
  const totalGas = monthlyData.reduce((s, m) => s + m.gas, 0);
  const totalCost = monthlyData.reduce((s, m) => s + m.cost, 0);
  const totalKwh = totalElec + totalGas;

  // CO2
  const co2Electricity = totalElec * 0.233;
  const co2Gas = totalGas * 0.184;
  const totalCO2 = (co2Electricity + co2Gas) / 1000; // tonnes

  // HH daily aggregation for baseload analysis
  const dailyMap = new Map<string, number>();
  for (const r of hhReadings ?? []) {
    const date = (r.reading_timestamp as string).slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + (r.kwh ?? 0));
  }
  const dailyValues = Array.from(dailyMap.values());
  const avgDailyKwh =
    dailyValues.length > 0
      ? dailyValues.reduce((s, v) => s + v, 0) / dailyValues.length
      : 0;
  const peakDailyKwh = dailyValues.length > 0 ? Math.max(...dailyValues) : 0;

  // Anomaly summary
  const activeAnomalies = (anomalies ?? []).filter(
    (a) => a.status !== "resolved" && a.status !== "accepted",
  );
  const totalWasteCost = (anomalies ?? []).reduce(
    (s, a) => s + (a.estimated_annual_cost ?? 0),
    0,
  );

  // Floor area (from meters or default)
  const floorArea = 3200; // TODO: pull from org settings

  // ─── 3. Build AI prompt ──────────────────────────────────────────

  const dataContext = JSON.stringify(
    {
      period: { start: startStr, end: endStr, months: period_months },
      school: {
        name: "Aurora Primary School",
        type: "Primary",
        floor_area_sqm: floorArea,
        pupils: 420,
      },
      meters: (meters ?? []).map((m) => ({
        type: m.meter_type,
        reference: m.meter_reference,
        location: m.location,
      })),
      consumption: {
        total_electricity_kwh: Math.round(totalElec),
        total_gas_kwh: Math.round(totalGas),
        total_cost_gbp: Math.round(totalCost),
        co2_tonnes: Math.round(totalCO2 * 10) / 10,
        kwh_per_sqm: Math.round(totalKwh / floorArea),
        avg_daily_kwh: Math.round(avgDailyKwh),
        peak_daily_kwh: Math.round(peakDailyKwh),
      },
      monthly_breakdown: monthlyData.map((m) => ({
        month: m.month,
        electricity_kwh: Math.round(m.electricity),
        gas_kwh: Math.round(m.gas),
        cost_gbp: Math.round(m.cost),
      })),
      anomalies: {
        total: (anomalies ?? []).length,
        active: activeAnomalies.length,
        estimated_annual_waste_gbp: Math.round(totalWasteCost),
        details: activeAnomalies.slice(0, 10).map((a) => ({
          type: a.anomaly_type,
          severity: a.severity,
          title: a.title,
          description: a.description,
          estimated_waste_gbp: a.estimated_annual_cost,
        })),
      },
      term_dates: (termDates ?? []).map((t) => ({
        term: t.term_name,
        start: t.start_date,
        end: t.end_date,
      })),
      school_events: (calendarEvents ?? [])
        .filter((e) => e.affects_energy)
        .map((e) => ({
          type: e.event_type,
          title: e.title,
          start: e.start_date,
          end: e.end_date,
        })),
      dec_benchmarks: {
        A: "< 25 kWh/m²",
        B: "25-50 kWh/m²",
        C: "50-75 kWh/m²",
        D: "75-100 kWh/m²",
        E: "100-125 kWh/m²",
        F: "125-150 kWh/m²",
        G: "> 150 kWh/m²",
        typical_primary: "80-120 kWh/m²",
        good_practice: "< 80 kWh/m²",
      },
    },
    null,
    2,
  );

  const systemPrompt = `You are an expert school energy consultant writing a formal report for school governors and trustees.

Your reports must be:
- Professional and evidence-based, suitable for a governors' meeting pack
- Written in clear, accessible English (avoid jargon)
- Structured with numbered sections and clear headings
- Include specific numbers, percentages, and comparisons to benchmarks
- Actionable — each finding should have a clear recommendation
- Balanced — acknowledge what's working well alongside areas for improvement

Output format: Return a JSON object with these sections:
{
  "title": "Energy Performance Report — [School Name]",
  "period": "Period covered",
  "executive_summary": "2-3 paragraph overview for busy governors",
  "dec_rating": {
    "current_rating": "A-G",
    "kwh_per_sqm": number,
    "benchmark_comparison": "text comparing to typical schools",
    "trend": "improving/stable/declining"
  },
  "consumption_analysis": {
    "overview": "paragraph summarising overall consumption",
    "electricity": "paragraph on electricity patterns",
    "gas": "paragraph on gas/heating patterns",
    "seasonal_patterns": "paragraph on term vs holiday differences"
  },
  "cost_analysis": {
    "total_spend": "formatted text",
    "monthly_average": "formatted text",
    "cost_per_pupil": "formatted text",
    "cost_trend": "paragraph on cost trajectory"
  },
  "anomalies_and_waste": {
    "summary": "paragraph summarising issues found",
    "findings": [
      {
        "title": "string",
        "severity": "critical/high/medium/low",
        "description": "what was found",
        "estimated_cost": "annual cost",
        "recommendation": "what to do about it"
      }
    ],
    "total_waste_estimate": "formatted text"
  },
  "recommendations": [
    {
      "priority": 1-5,
      "title": "string",
      "description": "detailed recommendation",
      "estimated_saving": "annual saving",
      "implementation": "easy/medium/complex",
      "payback_period": "text"
    }
  ],
  "conclusion": "1-2 paragraphs wrapping up with next steps"
}`;

  const userPrompt = `Generate a comprehensive energy report for the school governors based on this data:\n\n${dataContext}`;

  if (!OPENROUTER_API_KEY) {
    return apiError("AI provider not configured", 500);
  }

  // ─── 4. Call AI ──────────────────────────────────────────────────

  try {
    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://schoolgle.co.uk",
          "X-Title": "Schoolgle Energy Report",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }),
      },
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[energy-report] AI error:", aiResponse.status, errorText);
      return apiError(`AI model error: ${aiResponse.status}`, 502);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content ?? "";

    // Parse JSON response
    const cleaned = content
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();

    let reportData: any;
    try {
      reportData = JSON.parse(cleaned);
    } catch {
      console.error("[energy-report] Failed to parse AI response:", content);
      return apiError("Failed to parse report from AI", 500);
    }

    // ─── 5. Render to HTML ──────────────────────────────────────────

    const reportHtml = renderReportHtml(reportData);

    // ─── 6. Save to generated_documents ─────────────────────────────

    const { data: doc, error: docError } = await supabase
      .from("generated_documents")
      .insert({
        organization_id: orgId,
        template_id: null,
        module: "estates",
        document_type: "report",
        category: "energy_report",
        status: "draft",
        subject: reportData.title ?? "Energy Performance Report",
        body_html: reportHtml,
        placeholder_values: {
          period: reportData.period,
          ai_model: MODEL,
          raw_data: reportData,
        },
        recipient_type: "governor",
        related_entity_type: "energy_report",
        delivery_method: "download",
        created_by: auth.userId,
      })
      .select("id")
      .single();

    if (docError) {
      console.error("[energy-report] Save error:", docError.message);
      return apiError(`Failed to save report: ${docError.message}`, 500);
    }

    return apiSuccess({
      report_id: doc?.id,
      title: reportData.title,
      status: "draft",
      report_data: reportData,
      html: reportHtml,
    });
  } catch (err: any) {
    console.error("[energy-report] Generation failed:", err.message);
    return apiError(`Report generation failed: ${err.message}`, 500);
  }
});

// ─── HTML Renderer ────────────────────────────────────────────────────

function renderReportHtml(data: any): string {
  const findings = (data.anomalies_and_waste?.findings ?? [])
    .map(
      (f: any) => `
    <div style="border-left: 4px solid ${f.severity === "critical" ? "#ef4444" : f.severity === "high" ? "#f97316" : f.severity === "medium" ? "#eab308" : "#3b82f6"}; padding: 12px 16px; margin: 12px 0; background: #fafafa; border-radius: 0 8px 8px 0;">
      <strong>${f.title}</strong> <span style="color: #6b7280; font-size: 13px;">(${f.severity})</span>
      <p style="margin: 6px 0 0; color: #374151;">${f.description}</p>
      ${f.estimated_cost ? `<p style="margin: 4px 0 0; font-size: 13px; color: #ef4444;">Estimated cost: ${f.estimated_cost}</p>` : ""}
      ${f.recommendation ? `<p style="margin: 4px 0 0; font-size: 13px; color: #059669;"><strong>Recommendation:</strong> ${f.recommendation}</p>` : ""}
    </div>`,
    )
    .join("");

  const recommendations = (data.recommendations ?? [])
    .map(
      (r: any, i: number) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold; color: #00D4D4;">${r.priority ?? i + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>${r.title}</strong><br><span style="font-size: 13px; color: #6b7280;">${r.description}</span></td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold; color: #059669;">${r.estimated_saving ?? "TBC"}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${r.implementation ?? "-"}</td>
    </tr>`,
    )
    .join("");

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #1f2937;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #00D4D4, #0891b2); color: white; padding: 32px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">${data.title ?? "Energy Performance Report"}</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">${data.period ?? ""}</p>
        <p style="margin: 4px 0 0; opacity: 0.7; font-size: 12px;">Generated by Schoolgle Energy Intelligence</p>
      </div>

      <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">

        <!-- Executive Summary -->
        <h2 style="color: #0891b2; border-bottom: 2px solid #00D4D4; padding-bottom: 8px; margin-top: 0;">Executive Summary</h2>
        <div style="background: #f0fdfa; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; line-height: 1.6;">
          ${data.executive_summary ?? ""}
        </div>

        <!-- DEC Rating -->
        ${
          data.dec_rating
            ? `
        <h2 style="color: #0891b2; border-bottom: 2px solid #00D4D4; padding-bottom: 8px;">Display Energy Certificate</h2>
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: ${getDECColour(data.dec_rating.current_rating)}; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold;">${data.dec_rating.current_rating}</div>
          <div>
            <p style="margin: 0; font-size: 18px; font-weight: bold;">${data.dec_rating.kwh_per_sqm ?? "—"} kWh/m²/year</p>
            <p style="margin: 4px 0 0; color: #6b7280;">${data.dec_rating.benchmark_comparison ?? ""}</p>
            <p style="margin: 4px 0 0; color: #6b7280;">Trend: ${data.dec_rating.trend ?? "—"}</p>
          </div>
        </div>`
            : ""
        }

        <!-- Consumption Analysis -->
        <h2 style="color: #0891b2; border-bottom: 2px solid #00D4D4; padding-bottom: 8px;">Consumption Analysis</h2>
        ${data.consumption_analysis?.overview ? `<p style="line-height: 1.6;">${data.consumption_analysis.overview}</p>` : ""}
        ${data.consumption_analysis?.electricity ? `<h3 style="color: #374151;">Electricity</h3><p style="line-height: 1.6;">${data.consumption_analysis.electricity}</p>` : ""}
        ${data.consumption_analysis?.gas ? `<h3 style="color: #374151;">Gas</h3><p style="line-height: 1.6;">${data.consumption_analysis.gas}</p>` : ""}
        ${data.consumption_analysis?.seasonal_patterns ? `<h3 style="color: #374151;">Seasonal Patterns</h3><p style="line-height: 1.6;">${data.consumption_analysis.seasonal_patterns}</p>` : ""}

        <!-- Cost Analysis -->
        <h2 style="color: #0891b2; border-bottom: 2px solid #00D4D4; padding-bottom: 8px;">Cost Analysis</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <tr style="background: #f9fafb;">
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Total Spend</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.cost_analysis?.total_spend ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Monthly Average</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.cost_analysis?.monthly_average ?? "—"}</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Cost Per Pupil</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.cost_analysis?.cost_per_pupil ?? "—"}</td>
          </tr>
        </table>
        ${data.cost_analysis?.cost_trend ? `<p style="line-height: 1.6;">${data.cost_analysis.cost_trend}</p>` : ""}

        <!-- Anomalies & Waste -->
        <h2 style="color: #0891b2; border-bottom: 2px solid #00D4D4; padding-bottom: 8px;">Anomalies & Energy Waste</h2>
        ${data.anomalies_and_waste?.summary ? `<p style="line-height: 1.6;">${data.anomalies_and_waste.summary}</p>` : ""}
        ${findings}
        ${data.anomalies_and_waste?.total_waste_estimate ? `<p style="font-weight: bold; color: #ef4444; margin-top: 12px;">Total estimated waste: ${data.anomalies_and_waste.total_waste_estimate}</p>` : ""}

        <!-- Recommendations -->
        <h2 style="color: #0891b2; border-bottom: 2px solid #00D4D4; padding-bottom: 8px;">Recommendations</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #0891b2; color: white;">
              <th style="padding: 10px; text-align: center; width: 60px;">Priority</th>
              <th style="padding: 10px; text-align: left;">Recommendation</th>
              <th style="padding: 10px; text-align: center; width: 120px;">Est. Saving</th>
              <th style="padding: 10px; text-align: center; width: 100px;">Complexity</th>
            </tr>
          </thead>
          <tbody>
            ${recommendations}
          </tbody>
        </table>

        <!-- Conclusion -->
        <h2 style="color: #0891b2; border-bottom: 2px solid #00D4D4; padding-bottom: 8px; margin-top: 32px;">Conclusion & Next Steps</h2>
        <div style="background: #f0fdfa; padding: 16px 20px; border-radius: 8px; line-height: 1.6;">
          ${data.conclusion ?? ""}
        </div>

      </div>

      <!-- Footer -->
      <div style="background: #1e293b; color: #94a3b8; padding: 16px 32px; border-radius: 0 0 12px 12px; font-size: 12px; text-align: center;">
        <p style="margin: 0;">This report was generated by Schoolgle Energy Intelligence using AI analysis.</p>
        <p style="margin: 4px 0 0;">Data accuracy depends on meter readings and invoice data provided. Review before distributing.</p>
      </div>
    </div>
  `;
}

function getDECColour(rating: string): string {
  const colours: Record<string, string> = {
    A: "#16a34a",
    B: "#22c55e",
    C: "#facc15",
    D: "#eab308",
    E: "#fb923c",
    F: "#f97316",
    G: "#ef4444",
  };
  return colours[rating] ?? "#9ca3af";
}
