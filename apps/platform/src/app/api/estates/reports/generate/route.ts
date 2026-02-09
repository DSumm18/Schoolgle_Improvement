/**
 * Governor Reports API
 *
 * POST /api/estates/reports/generate - Generate a governor report
 *
 * Generates compliance reports specifically designed for school governors
 * and trust boards, with clear RAG status, statutory vs optional items,
 * budget breakdowns, and Ofsted readiness assessment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GovernorReportType, ReportFormat, GenerateReportRequest, GenerateReportResponse } from '@/lib/estates-compliance/reports/governor-reports';
import { RAGStatusService, type RAGReport } from '@/lib/estates-compliance/services/RAGStatusService';
import { TaskService } from '@/lib/estates-compliance/services/TaskService';
import { AssetService } from '@/lib/estates-compliance/services/AssetService';
import { DOMAIN_METADATA, STATUTORY_CHECKS, type ComplianceDomain } from '@/lib/estates-compliance/statutory-checks';
import { GovernorReport, DomainSummary, BudgetSummary, ActionRequired } from '@/lib/estates-compliance/reports/governor-reports';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateReportRequest = await request.json();

    // Validate request
    if (!body.reportType) {
      return NextResponse.json(
        { error: 'reportType is required' },
        { status: 400 }
      );
    }

    // Get organization ID from auth context (for now, use demo)
    const organizationId = request.headers.get('x-organization-id') || 'demo';

    // Generate the report
    const report = await generateGovernorReport(organizationId, body);

    // In a real implementation, we would:
    // 1. Generate PDF/Excel file using a library like jsPDF or exceljs
    // 2. Upload to storage
    // 3. Return download URL

    // For now, return a mock response
    const response: GenerateReportResponse = {
      reportId: `report_${Date.now()}`,
      status: 'ready',
      downloadUrl: `/api/estates/reports/download/report_${Date.now()}.${body.format === 'excel' ? 'xlsx' : 'pdf'}`,
      message: 'Report generated successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating governor report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// REPORT GENERATION LOGIC
// ============================================================================

async function generateGovernorReport(
  organizationId: string,
  request: GenerateReportRequest
): Promise<GovernorReport> {
  const {
    reportType,
    reportingPeriod,
    includeDomains,
    classification = 'all',
    preparedFor = 'Governing Board'
  } = request;

  // Get RAG status data
  const ragReport: RAGReport = await RAGStatusService.calculateOverallStatus(organizationId);

  // Get domain summaries
  const domains = await generateDomainSummaries(organizationId, includeDomains);

  // Get actions required
  const actionsRequired = await generateActionsRequired(organizationId, classification);

  // Get budget requirements
  const budgetRequirements = await generateBudgetSummary(organizationId, classification);

  // Determine if ready for Ofsted
  const readyForOfsted = ragReport.overall === 'green' && ragReport.overallScore >= 90;

  // Create executive summary
  const executiveSummary = generateExecutiveSummary(ragReport, domains, readyForOfsted);

  // Generate report
  const report: GovernorReport = {
    id: `report_${Date.now()}`,
    organizationId,
    reportType,
    format: request.format,
    status: 'ready',
    generatedAt: new Date().toISOString(),
    generatedBy: 'System', // Would come from auth context
    title: getReportTitle(reportType),
    reportingPeriod: reportingPeriod || {
      startDate: getDefaultStartDate(reportType),
      endDate: new Date().toISOString()
    },
    preparedFor,
    executiveSummary,
    domains,
    actionsRequired,
    budgetRequirements,
    evidenceSummary: await generateEvidenceSummary(organizationId),
    recommendations: generateRecommendations(executiveSummary, domains),
    nextReviewDate: getNextReviewDate(reportType),
    nextReportDueDate: getNextReportDueDate(reportType)
  };

  return report;
}

// ============================================================================
// DOMAIN SUMMARIES
// ============================================================================

async function generateDomainSummaries(
  organizationId: string,
  includeDomains?: ComplianceDomain[]
): Promise<DomainSummary[]> {
  const allDomains = Object.keys(DOMAIN_METADATA) as ComplianceDomain[];
  const domainsToInclude = includeDomains || allDomains;

  const summaries: DomainSummary[] = [];

  for (const domain of domainsToInclude) {
    const metadata = DOMAIN_METADATA[domain];
    const checks = STATUTORY_CHECKS[domain] || [];

    // Get tasks for this domain
    const tasksResult = await TaskService.list(organizationId, { domain }, { page: 1, pageSize: 1000 });
    const tasks = tasksResult.data;

    // Calculate completion rates
    const statutoryChecks = checks.filter(c => c.category === 'statutory');
    const goodPracticeChecks = checks.filter(c => c.category === 'good_practice');

    const completedStatutory = statutoryChecks.length; // In production, calculate from actual task completion
    const completedGoodPractice = goodPracticeChecks.length;

    // Count overdue tasks
    const overdueChecks = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed' || t.status === 'cancelled') return false;
      return new Date(t.due_date) < new Date();
    }).length;

    // Get RAG status for this domain
    const domainStatus = await RAGStatusService.calculateDomainStatus(organizationId, domain);

    // Identify key issues
    const keyIssues: string[] = [];
    if (overdueChecks > 0) {
      keyIssues.push(`${overdueChecks} overdue check(s)`);
    }
    if (domainStatus.issues.length > 0) {
      keyIssues.push(...domainStatus.issues.slice(0, 2));
    }

    summaries.push({
      domain,
      domainName: metadata.name,
      ragStatus: domainStatus.status,
      completionRate: domainStatus.score,
      statutoryChecksCompleted: completedStatutory,
      statutoryChecksTotal: statutoryChecks.length,
      goodPracticeChecksCompleted: completedGoodPractice,
      goodPracticeChecksTotal: goodPracticeChecks.length,
      overdueChecks,
      nextReviewDate: getNextWeekDate().toISOString()
    });
  }

  return summaries;
}

// ============================================================================
// ACTIONS REQUIRED
// ============================================================================

async function generateActionsRequired(
  organizationId: string,
  classification: string
): Promise<{
  critical: ActionRequired[];
  high: ActionRequired[];
  medium: ActionRequired[];
}> {
  // Get overdue tasks
  const tasksResult = await TaskService.list(organizationId, {}, { page: 1, pageSize: 1000 });
  const overdueTasks = tasksResult.data.filter(t => {
    if (!t.due_date || t.status === 'completed' || t.status === 'cancelled') return false;
    return new Date(t.due_date) < new Date();
  });

  // Convert to actions
  const actions: ActionRequired[] = overdueTasks.map(task => ({
    id: task.id,
    title: task.task_name,
    description: task.description || '',
    domain: task.compliance_domain as ComplianceDomain,
    classification: 'statutory',
    severity: task.priority as 'critical' | 'high' | 'medium' | 'low',
    targetDate: task.due_date,
    estimatedCost: task.findings?.[0]?.estimated_cost,
    assignedTo: task.assigned_to,
    source: 'Compliance Task',
    statutoryReference: STATUTORY_CHECKS[task.compliance_domain as ComplianceDomain]?.find(
      c => c.id === task.task_type
    )?.reference
  }));

  // Group by severity
  return {
    critical: actions.filter(a => a.severity === 'critical'),
    high: actions.filter(a => a.severity === 'high'),
    medium: actions.filter(a => a.severity === 'medium')
  };
}

// ============================================================================
// BUDGET SUMMARY
// ============================================================================

async function generateBudgetSummary(
  organizationId: string,
  classification: string
): Promise<BudgetSummary> {
  // In production, this would fetch from the budget_items table
  // For now, return mock data

  return {
    statutory: {
      required: 3,
      estimatedCost: 1250,
      items: [
        {
          id: '1',
          title: 'Fire Extinguisher Annual Service',
          category: 'maintenance',
          classification: 'statutory',
          estimatedCost: 450,
          priority: 'high',
          domain: 'fire',
          targetFiscalYear: '2025/26',
          status: 'planned',
          source: 'BS5306'
        },
        {
          id: '2',
          title: 'Fixed Wire Testing (EICR)',
          category: 'inspection',
          classification: 'statutory',
          estimatedCost: 600,
          priority: 'critical',
          domain: 'electrical',
          targetFiscalYear: '2025/26',
          status: 'planned',
          source: 'BS7671'
        },
        {
          id: '3',
          title: 'Legionella Risk Assessment Review',
          category: 'inspection',
          classification: 'statutory',
          estimatedCost: 200,
          priority: 'high',
          domain: 'legionella',
          targetFiscalYear: '2025/26',
          status: 'planned',
          source: 'HSE L8'
        }
      ]
    },
    goodPractice: {
      recommended: 5,
      estimatedCost: 3500,
      items: [
        {
          id: '4',
          title: 'Smoke Detector Cleaning',
          category: 'maintenance',
          classification: 'good_practice',
          estimatedCost: 500,
          priority: 'medium',
          domain: 'fire',
          targetFiscalYear: '2025/26',
          status: 'planned'
        }
      ]
    },
    optional: {
      suggested: 2,
      estimatedCost: 1200,
      items: []
    },
    totalEstimatedCost: 5950
  };
}

// ============================================================================
// EVIDENCE SUMMARY
// ============================================================================

async function generateEvidenceSummary(organizationId: string) {
  // In production, this would fetch from the evidence table
  const domains = Object.keys(DOMAIN_METADATA) as ComplianceDomain[];

  return {
    totalEvidenceItems: 127,
    evidenceByDomain: domains.reduce((acc, domain) => {
      acc[domain] = Math.floor(Math.random() * 20) + 5;
      return acc;
    }, {} as Record<ComplianceDomain, number>),
    recentUploads: 8,
    evidenceGaps: []
  };
}

// ============================================================================
// EXECUTIVE SUMMARY
// ============================================================================

function generateExecutiveSummary(
  ragReport: RAGReport,
  domains: DomainSummary[],
  readyForOfsted: boolean
) {
  const criticalIssues = domains.flatMap(d => d.keyIssues);
  const statutoryChecksTotal = domains.reduce((sum, d) => sum + d.statutoryChecksTotal, 0);
  const statutoryChecksCompleted = domains.reduce((sum, d) => sum + d.statutoryChecksCompleted, 0);
  const statutoryComplianceRate = statutoryChecksTotal > 0
    ? Math.round((statutoryChecksCompleted / statutoryChecksTotal) * 100)
    : 0;

  return {
    overallComplianceStatus: ragReport.overall,
    overallComplianceScore: ragReport.overallScore,
    headlineStatement: getHeadlineStatement(ragReport.overall, ragReport.overallScore),
    keyAchievements: getKeyAchievements(domains),
    criticalIssues,
    immediateActionsRequired: domains.reduce((sum, d) => sum + d.overdueChecks, 0),
    statutoryComplianceRate,
    readyForOfsted,
    ofstedReadinessDetails: getOfstedReadinessDetails(readyForOfsted, domains)
  };
}

function getHeadlineStatement(status: string, score: number): string {
  if (status === 'green') {
    return `The school maintains a high standard of statutory compliance with a compliance score of ${score}%. All critical areas meet requirements.`;
  }
  if (status === 'amber') {
    return `The school demonstrates good overall compliance (score: ${score}%) with some areas requiring attention to maintain statutory requirements.`;
  }
  return `The school requires immediate attention to address critical compliance gaps (score: ${score}%). Several statutory areas are not meeting requirements.`;
}

function getKeyAchievements(domains: DomainSummary[]): string[] {
  const achievements: string[] = [];

  domains.forEach(domain => {
    if (domain.ragStatus === 'green' && domain.statutoryChecksCompleted === domain.statutoryChecksTotal) {
      achievements.push(`${domain.domainName}: All statutory checks completed and compliant`);
    }
    if (domain.completionRate >= 90) {
      achievements.push(`${domain.domainName}: ${domain.completionRate}% compliance rate achieved`);
    }
  });

  return achievements.slice(0, 5);
}

function getOfstedReadinessDetails(ready: boolean, domains: DomainSummary[]): string[] {
  if (ready) {
    return [
      'All statutory checks up to date',
      'Evidence readily available for inspection',
      'No critical compliance gaps identified',
      'RAG status green across all domains'
    ];
  }

  const details: string[] = [];
  const amberDomains = domains.filter(d => d.ragStatus === 'amber');
  const redDomains = domains.filter(d => d.ragStatus === 'red');

  if (redDomains.length > 0) {
    details.push(`${redDomains.length} domain(s) require immediate attention before inspection`);
  }
  if (amberDomains.length > 0) {
    details.push(`${amberDomains.length} domain(s) have areas that may be queried`);
  }

  return details;
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

function generateRecommendations(
  executiveSummary: any,
  domains: DomainSummary[]
) {
  const forGovernors: string[] = [];
  const forSeniorLeadership: string[] = [];
  const forBusinessManager: string[] = [];

  // Governor recommendations
  if (executiveSummary.readyForOfsted) {
    forGovernors.push('Maintain current compliance processes to ensure continued readiness');
  } else {
    forGovernors.push('Review critical compliance issues at next governing board meeting');
    forGovernors.push('Ensure adequate budget allocation for statutory compliance items');
  }

  // Senior leadership recommendations
  const domainsWithIssues = domains.filter(d => d.ragStatus !== 'green');
  if (domainsWithIssues.length > 0) {
    forSeniorLeadership.push('Prioritize completion of overdue compliance checks');
    forSeniorLeadership.push('Review staff responsibilities for compliance monitoring');
  }

  // Business manager recommendations
  forBusinessManager.push('Review statutory budget requirements for next fiscal year');
  forBusinessManager.push('Ensure contracts for statutory services are up to date');
  forBusinessManager.push('Schedule annual inspections and renewals in advance');

  return {
    forGovernors,
    forSeniorLeadership,
    forBusinessManager
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getReportTitle(reportType: GovernorReportType): string {
  const titles: Record<GovernorReportType, string> = {
    annual_compliance: 'Annual Compliance Report',
    pre_ofsted_assurance: 'Pre-Ofsted Assurance Report',
    budget_planning: 'Budget Planning Report',
    termly_summary: 'Termly Compliance Summary',
    domain_deep_dive: 'Domain Deep Dive Report'
  };
  return titles[reportType];
}

function getDefaultStartDate(reportType: GovernorReportType): string {
  const now = new Date();

  switch (reportType) {
    case 'annual_compliance':
      return new Date(now.getFullYear(), 8, 1).toISOString(); // Start of academic year
    case 'termly_summary':
      return new Date(now.getMonth() - 3, 1).toISOString(); // 3 months ago
    case 'budget_planning':
      return new Date(now.getFullYear(), 3, 1).toISOString(); // Start of fiscal year
    default:
      return new Date(now.getMonth() - 6, 1).toISOString();
  }
}

function getNextReviewDate(reportType: GovernorReportType): string {
  const now = new Date();

  switch (reportType) {
    case 'termly_summary':
      return new Date(now.getMonth() + 3, 15).toISOString();
    case 'annual_compliance':
      return new Date(now.getFullYear() + 1, 0, 31).toISOString();
    default:
      return new Date(now.getMonth() + 1, 1).toISOString();
  }
}

function getNextReportDueDate(reportType: GovernorReportType): string {
  const now = new Date();

  switch (reportType) {
    case 'termly_summary':
      return new Date(now.getMonth() + 3, 15).toISOString();
    case 'annual_compliance':
      return new Date(now.getFullYear() + 1, 6, 1).toISOString();
    case 'budget_planning':
      return new Date(now.getMonth() + 6, 1).toISOString();
    default:
      return new Date(now.getMonth() + 1, 1).toISOString();
  }
}

function getNextWeekDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}
