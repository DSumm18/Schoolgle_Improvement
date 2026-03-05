'use client';

/**
 * Governor Reports Dashboard
 *
 * Provides school governors and trust boards with clear, actionable compliance reports.
 * Features:
 * - Executive summary with RAG status
 * - Domain-by-domain breakdown
 * - Key actions required (statutory vs optional)
 * - Budget requirements breakdown
 * - Export to PDF/Excel
 * - Ofsted readiness assessment
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Shield,
  DollarSign,
  Award,
  ChevronRight,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  GovernorReportType,
  ReportFormat,
  ReportStatus,
  GovernorReport,
  REPORT_TEMPLATES,
  RagStatus
} from '@/lib/estates-compliance/reports/governor-reports';
import { DOMAIN_METADATA, type ComplianceDomain } from '@/lib/estates-compliance/statutory-checks';
import ReportGenerator from '@/components/estates-compliance/ReportGenerator';

interface ReportCard {
  id: string;
  title: string;
  reportType: GovernorReportType;
  generatedAt: string;
  generatedBy: string;
  status: ReportStatus;
  downloadUrl?: string;
  format: ReportFormat;
}

// Mock report data - in production this would come from the API
const mockReports: ReportCard[] = [
  {
    id: '1',
    title: 'Autumn Term 2025 Compliance Summary',
    reportType: 'termly_summary',
    generatedAt: '2025-12-15T10:30:00Z',
    generatedBy: 'John Smith',
    status: 'ready',
    downloadUrl: '/api/reports/download/1',
    format: 'pdf'
  },
  {
    id: '2',
    title: 'Annual Compliance Report 2024/25',
    reportType: 'annual_compliance',
    generatedAt: '2025-07-20T14:00:00Z',
    generatedBy: 'Sarah Jones',
    status: 'ready',
    downloadUrl: '/api/reports/download/2',
    format: 'pdf'
  }
];

// Mock executive summary data
const mockExecutiveSummary = {
  overallStatus: 'green' as RagStatus,
  overallScore: 92,
  headlineStatement: 'The school maintains a high standard of statutory compliance with all critical areas meeting requirements.',
  keyAchievements: [
    'All statutory fire safety checks completed on schedule',
    'Legionella monitoring 100% compliant for 12 months',
    'Gas safety certificate obtained with no remedial actions required',
    'Asbestos management plan reviewed and updated'
  ],
  criticalIssues: [],
  immediateActionsRequired: 0,
  statutoryComplianceRate: 94,
  readyForOfsted: true,
  ofstedReadinessDetails: [
    'All statutory checks up to date',
    'Evidence readily available for inspection',
    'No critical compliance gaps identified'
  ]
};

// Mock domain summaries
const mockDomainSummaries: Array<{
  domain: ComplianceDomain;
  ragStatus: RagStatus;
  completionRate: number;
  statutoryCompleted: number;
  statutoryTotal: number;
  overdueChecks: number;
}> = [
  { domain: 'fire', ragStatus: 'green', completionRate: 100, statutoryCompleted: 8, statutoryTotal: 8, overdueChecks: 0 },
  { domain: 'legionella', ragStatus: 'green', completionRate: 95, statutoryCompleted: 5, statutoryTotal: 6, overdueChecks: 0 },
  { domain: 'asbestos', ragStatus: 'green', completionRate: 100, statutoryCompleted: 4, statutoryTotal: 4, overdueChecks: 0 },
  { domain: 'electrical', ragStatus: 'amber', completionRate: 85, statutoryCompleted: 4, statutoryTotal: 5, overdueChecks: 1 },
  { domain: 'gas', ragStatus: 'green', completionRate: 100, statutoryCompleted: 3, statutoryTotal: 3, overdueChecks: 0 },
];

// Mock budget summary
const mockBudgetSummary = {
  statutory: { required: 3, estimatedCost: 1250 },
  goodPractice: { recommended: 5, estimatedCost: 3500 },
  optional: { suggested: 2, estimatedCost: 1200 },
  totalEstimatedCost: 5950
};

export default function GovernorReportsPage() {
  const [reports, setReports] = useState<ReportCard[]>(mockReports);
  const [selectedReportType, setSelectedReportType] = useState<GovernorReportType | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<GovernorReportType | 'all'>('all');

  const getRagColor = (status: RagStatus) => {
    switch (status) {
      case 'green': return 'bg-emerald-500';
      case 'amber': return 'bg-amber-500';
      case 'red': return 'bg-rose-500';
    }
  };

  const getRagBgColor = (status: RagStatus) => {
    switch (status) {
      case 'green': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'amber': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'red': return 'bg-rose-50 border-rose-200 text-rose-800';
    }
  };

  const getRagTextColor = (status: RagStatus) => {
    switch (status) {
      case 'green': return 'text-emerald-600';
      case 'amber': return 'text-amber-600';
      case 'red': return 'text-rose-600';
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    if (filterType !== 'all' && report.reportType !== filterType) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getReportTypeLabel = (type: GovernorReportType) => {
    return REPORT_TEMPLATES[type].name;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/estates-compliance"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-5 h-5 rotate-[-180deg]" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Governor Reports</h1>
              <p className="text-muted-foreground mt-1">
                Compliance reports for governing boards and trust committees
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowGenerator(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <FileText className="w-4 h-4" />
          Generate New Report
        </button>
      </div>

      {/* Executive Summary Card */}
      <div className="rounded-lg border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Compliance Executive Summary</h2>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {mockExecutiveSummary.readyForOfsted && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
                <Award className="w-4 h-4" />
                Ready for Ofsted
              </div>
            )}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getRagBgColor(mockExecutiveSummary.overallStatus)}`}>
              <span className={`w-3 h-3 rounded-full ${getRagColor(mockExecutiveSummary.overallStatus)}`} />
              {mockExecutiveSummary.overallStatus === 'green' && 'Compliant'}
              {mockExecutiveSummary.overallStatus === 'amber' && 'Attention Needed'}
              {mockExecutiveSummary.overallStatus === 'red' && 'Action Required'}
            </div>
          </div>
        </div>

        <p className="text-base mb-4">{mockExecutiveSummary.headlineStatement}</p>

        {/* Key Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockExecutiveSummary.overallScore}%</p>
              <p className="text-xs text-muted-foreground">Compliance Score</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockExecutiveSummary.statutoryComplianceRate}%</p>
              <p className="text-xs text-muted-foreground">Statutory Checks</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockExecutiveSummary.immediateActionsRequired}</p>
              <p className="text-xs text-muted-foreground">Critical Actions</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">£{mockBudgetSummary.statutory.estimatedCost.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Statutory Budget</p>
            </div>
          </div>
        </div>

        {/* Key Achievements */}
        {mockExecutiveSummary.keyAchievements.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Key Achievements
            </h3>
            <ul className="space-y-1">
              {mockExecutiveSummary.keyAchievements.map((achievement, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Critical Issues */}
        {mockExecutiveSummary.criticalIssues.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Requires Immediate Attention
            </h3>
            <ul className="space-y-1">
              {mockExecutiveSummary.criticalIssues.map((issue, i) => (
                <li key={i} className="text-sm text-rose-600 flex items-start gap-2">
                  <span className="mt-0.5">⚠</span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Domain-by-Domain Summary */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Domain-by-Domain Status</h2>
          <p className="text-sm text-muted-foreground">
            Compliance status across all statutory areas
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {mockDomainSummaries.map((summary) => {
              const metadata = DOMAIN_METADATA[summary.domain];
              return (
                <div
                  key={summary.domain}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl" aria-hidden="true">{metadata.icon}</span>
                    <div>
                      <h3 className="font-medium">{metadata.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {summary.statutoryCompleted}/{summary.statutoryTotal} statutory checks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{summary.completionRate}%</p>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getRagColor(summary.ragStatus)}`} />
                    {summary.overdueChecks > 0 && (
                      <span className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-medium">
                        {summary.overdueChecks} overdue
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Budget Requirements Summary */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Budget Requirements</h2>
          <p className="text-sm text-muted-foreground">
            Statutory vs recommended vs optional compliance costs
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Statutory - Must Have */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                  <span className="text-lg" aria-hidden="true">⚖️</span>
                </div>
                <div>
                  <h3 className="font-medium">Statutory Required (Must Have)</h3>
                  <p className="text-sm text-muted-foreground">
                    {mockBudgetSummary.statutory.required} items · Legal requirements
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-rose-700">
                  £{mockBudgetSummary.statutory.estimatedCost.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Estimated cost</p>
              </div>
            </div>

            {/* Good Practice - Should Have */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <span className="text-lg" aria-hidden="true">📋</span>
                </div>
                <div>
                  <h3 className="font-medium">Good Practice (Should Have)</h3>
                  <p className="text-sm text-muted-foreground">
                    {mockBudgetSummary.goodPractice.recommended} items · Industry recommended
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-amber-700">
                  £{mockBudgetSummary.goodPractice.estimatedCost.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Estimated cost</p>
              </div>
            </div>

            {/* Optional - Nice to Have */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <span className="text-lg" aria-hidden="true">💡</span>
                </div>
                <div>
                  <h3 className="font-medium">Optional (Nice to Have)</h3>
                  <p className="text-sm text-muted-foreground">
                    {mockBudgetSummary.optional.suggested} items · Contractor suggestions
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-700">
                  £{mockBudgetSummary.optional.estimatedCost.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Estimated cost</p>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border-t-2">
              <div>
                <h3 className="font-semibold">Total Estimated Cost</h3>
              </div>
              <p className="text-2xl font-bold">
                £{mockBudgetSummary.totalEstimatedCost.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Reports Section */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Generated Reports</h2>
              <p className="text-sm text-muted-foreground">
                View and download previously generated reports
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as GovernorReportType | 'all')}
                className="text-sm border rounded-md px-3 py-1.5 bg-background"
              >
                <option value="all">All Types</option>
                {Object.entries(REPORT_TEMPLATES).map(([key, value]) => (
                  <option key={key} value={key}>{value.name}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ReportStatus | 'all')}
                className="text-sm border rounded-md px-3 py-1.5 bg-background"
              >
                <option value="all">All Status</option>
                <option value="ready">Ready</option>
                <option value="generating">Generating</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
        <div className="divide-y">
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No reports found</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="p-4 hover:bg-accent/50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{report.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(report.generatedAt)}
                      </span>
                      <span>by {report.generatedBy}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        report.format === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {report.format.toUpperCase()}
                      </span>
                      {report.status === 'generating' && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Generating...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {report.status === 'ready' && report.downloadUrl && (
                    <button
                      onClick={() => window.open(report.downloadUrl, '_blank')}
                      className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report Generator Modal */}
      {showGenerator && (
        <ReportGenerator
          onClose={() => {
            setShowGenerator(false);
            setSelectedReportType(null);
          }}
          initialReportType={selectedReportType}
        />
      )}
    </div>
  );
}
