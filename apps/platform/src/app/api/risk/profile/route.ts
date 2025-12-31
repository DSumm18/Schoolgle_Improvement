import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- Risk Calculation Helpers (Ported from MCP tool for MVP speed) ---

function calculateRiskScore(
  daysSinceInspection: number | null,
  headteacherTenureMonths: number | null,
  lastRating: string | null,
  performanceTrend: 'improving' | 'stable' | 'declining' | 'unknown'
): number {
  let riskScore = 0;

  // Time since last inspection (0-40)
  if (daysSinceInspection !== null) {
    if (daysSinceInspection > 2000) riskScore += 40;
    else if (daysSinceInspection > 1500) riskScore += 30;
    else if (daysSinceInspection > 1000) riskScore += 20;
    else if (daysSinceInspection > 500) riskScore += 10;
  } else {
    riskScore += 25;
  }

  // Headteacher change (0-30)
  if (headteacherTenureMonths !== null) {
    if (headteacherTenureMonths < 6) riskScore += 30;
    else if (headteacherTenureMonths < 12) riskScore += 20;
    else if (headteacherTenureMonths < 24) riskScore += 10;
  }

  // Last rating (0-20)
  if (lastRating) {
    const rating = lastRating.toLowerCase();
    if (rating.includes('inadequate') || rating.includes('serious weaknesses')) riskScore += 20;
    else if (rating.includes('requires improvement') || rating.includes('special measures')) riskScore += 15;
  }

  // Trend (0-10)
  if (performanceTrend === 'declining') riskScore += 10;
  else if (performanceTrend === 'stable') riskScore += 5;

  return Math.min(riskScore, 100);
}

function predictInspectionWindow(daysSinceInspection: number | null, riskScore: number) {
  const now = new Date();
  let earliestMonths = 6;
  let latestMonths = 18;

  if (riskScore >= 70) { earliestMonths = 0; latestMonths = 6; }
  else if (riskScore >= 50) { earliestMonths = 3; latestMonths = 12; }
  else if (riskScore >= 30) { earliestMonths = 6; latestMonths = 18; }
  else { earliestMonths = 12; latestMonths = 24; }

  if (daysSinceInspection && daysSinceInspection > 1500) {
    earliestMonths = Math.max(0, earliestMonths - 3);
    latestMonths = Math.max(6, latestMonths - 6);
  }

  const earliest = new Date(now);
  earliest.setMonth(earliest.getMonth() + earliestMonths);
  const latest = new Date(now);
  latest.setMonth(latest.getMonth() + latestMonths);

  return {
    earliest: earliest.toISOString().split('T')[0],
    latest: latest.toISOString().split('T')[0],
  };
}

export async function POST(req: NextRequest) {
  try {
    const { urn } = await req.json();
    if (!urn) return NextResponse.json({ error: 'URN is required' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Parallel Fetch of DfE Data via RPC
    const [inspectionResult, htResult, performanceResult, schoolResult] = await Promise.all([
      supabase.rpc('get_last_inspection', { lookup_urn: urn }),
      supabase.rpc('get_headteacher_info', { lookup_urn: urn }),
      supabase.rpc('get_performance_trends', { lookup_urn: urn }),
      supabase.from('organizations').select('name').eq('urn', urn).single()
    ]);

    const inspectionData = inspectionResult.data || {};
    const headteacherData = htResult.data || {};
    const performanceData = performanceResult.data || {};
    const schoolName = schoolResult.data?.name || "Your School";

    // Logic processing
    const lastInspectionDate = inspectionData.date || null;
    const lastRating = inspectionData.rating || null;
    let daysSinceInspection = null;
    if (lastInspectionDate) {
      daysSinceInspection = Math.floor((new Date().getTime() - new Date(lastInspectionDate).getTime()) / (1000 * 3600 * 24));
    }

    const headteacherStartDate = headteacherData.start_date || null;
    const headteacherTenureMonths = headteacherData.tenure_months || null;
    const isNewHeadteacher = headteacherData.is_new || false;

    const performanceTrend = performanceData.trend || 'unknown';

    const riskScore = calculateRiskScore(daysSinceInspection, headteacherTenureMonths, lastRating, performanceTrend);
    const predictedWindow = predictInspectionWindow(daysSinceInspection, riskScore);

    // Mapping to UI format
    const responseData = {
      urn,
      schoolName,
      riskScore,
      riskLevel: riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
      predictedWindow,
      lastInspection: {
        date: lastInspectionDate,
        rating: lastRating,
        daysSince: daysSinceInspection
      },
      headteacher: {
        startDate: headteacherStartDate,
        tenureMonths: headteacherTenureMonths,
        isNew: isNewHeadteacher
      },
      riskFactors: [
        ...(daysSinceInspection && daysSinceInspection > 1500 ? [{ category: 'Time', severity: 'high', description: `Last inspection was ${Math.floor(daysSinceInspection / 365)} years ago`, impact: 30 }] : []),
        ...(isNewHeadteacher ? [{ category: 'Leadership', severity: 'high', description: `Headteacher tenure is ${headteacherTenureMonths} months`, impact: 25 }] : []),
        ...(performanceTrend === 'declining' ? [{ category: 'Performance', severity: 'medium', description: 'Declining trends detected', impact: 10 }] : [])
      ],
      recommendations: [
        'Prioritize evidence gathering for key framework areas',
        'Ensure SEF and SDP documents are up to date'
      ]
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('[RiskAPI] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
