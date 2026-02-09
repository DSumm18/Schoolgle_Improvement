'use client';

/**
 * ReportGenerator Component
 *
 * Modal component for generating various types of governor reports.
 * Supports:
 * - Annual compliance report
 * - Pre-Ofsted assurance report
 * - Budget planning report
 * - Termly summary
 * - Domain deep-dive
 *
 * Features:
 * - Report type selection with descriptions
 * - Format selection (PDF/Excel)
 * - Domain filtering
 * - Classification filtering (statutory only vs all)
 * - Date range selection
 * - Progress indicator during generation
 */

import { useState } from 'react';
import {
  X,
  FileText,
  Shield,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  Check,
  ChevronRight,
  AlertCircle,
  Loader2,
  Download,
  Eye
} from 'lucide-react';
import {
  GovernorReportType,
  ReportFormat,
  REPORT_TEMPLATES,
  GenerateReportRequest,
  GenerateReportResponse
} from '@/lib/estates-compliance/reports/governor-reports';
import { DOMAIN_METADATA, type ComplianceDomain } from '@/lib/estates-compliance/statutory-checks';

interface ReportGeneratorProps {
  onClose: () => void;
  initialReportType?: GovernorReportType | null;
  onSuccess?: (reportId: string) => void;
}

// Format options with descriptions
const FORMAT_OPTIONS: Array<{ value: ReportFormat; label: string; description: string; icon: React.ReactNode }> = [
  {
    value: 'pdf',
    label: 'PDF Document',
    description: 'Professional formatted document for meetings and printing',
    icon: <FileText className="w-5 h-5" />
  },
  {
    value: 'excel',
    label: 'Excel Spreadsheet',
    description: 'Editable data for further analysis and customization',
    icon: <FileSpreadsheet className="w-5 h-5" />
  }
];

export default function ReportGenerator({ onClose, initialReportType, onSuccess }: ReportGeneratorProps) {
  const [step, setStep] = useState<'select' | 'configure' | 'generating' | 'complete'>('select');
  const [selectedReportType, setSelectedReportType] = useState<GovernorReportType | null>(initialReportType || null);
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('pdf');
  const [selectedDomains, setSelectedDomains] = useState<ComplianceDomain[]>([]);
  const [classificationFilter, setClassificationFilter] = useState<'all' | 'statutory_only' | 'statutory_and_good_practice'>('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [preparedFor, setPreparedFor] = useState('Governing Board');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedReport, setGeneratedReport] = useState<GenerateReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = selectedReportType ? REPORT_TEMPLATES[selectedReportType] : null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStep('generating');
    setProgress(0);
    setError(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const request: GenerateReportRequest = {
        reportType: selectedReportType!,
        format: selectedFormat,
        reportingPeriod: dateRange.startDate && dateRange.endDate ? {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        } : undefined,
        includeDomains: selectedDomains.length > 0 ? selectedDomains : undefined,
        classification: classificationFilter,
        preparedFor
      };

      // Call API to generate report
      const response = await fetch('/api/estates/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const result: GenerateReportResponse = await response.json();
      clearInterval(progressInterval);
      setProgress(100);
      setGeneratedReport(result);
      setStep('complete');
      onSuccess?.(result.reportId);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setStep('configure');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleDomain = (domain: ComplianceDomain) => {
    setSelectedDomains(prev =>
      prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  const selectAllDomains = () => {
    setSelectedDomains(Object.keys(DOMAIN_METADATA) as ComplianceDomain[]);
  };

  const clearDomains = () => {
    setSelectedDomains([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Generate Governor Report
            </h2>
            {step === 'configure' && selectedTemplate && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTemplate.name} · {selectedTemplate.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
            disabled={isGenerating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'select' && (
            <SelectReportType
              onSelect={(type) => {
                setSelectedReportType(type);
                setStep('configure');
              }}
            />
          )}

          {step === 'configure' && selectedReportType && (
            <ConfigureReport
              reportType={selectedReportType}
              selectedFormat={selectedFormat}
              onFormatChange={setSelectedFormat}
              selectedDomains={selectedDomains}
              onToggleDomain={toggleDomain}
              onSelectAllDomains={selectAllDomains}
              onClearDomains={clearDomains}
              classificationFilter={classificationFilter}
              onClassificationChange={setClassificationFilter}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              preparedFor={preparedFor}
              onPreparedForChange={setPreparedFor}
              onBack={() => setStep('select')}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          )}

          {step === 'generating' && (
            <GeneratingProgress progress={progress} reportType={selectedReportType!} />
          )}

          {step === 'complete' && generatedReport && (
            <ReportComplete
              report={generatedReport}
              reportType={selectedReportType!}
              format={selectedFormat}
              onClose={onClose}
              onGenerateAnother={() => {
                setGeneratedReport(null);
                setSelectedReportType(null);
                setSelectedDomains([]);
                setStep('select');
              }}
            />
          )}

          {error && (
            <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-rose-900 dark:text-rose-100">Error generating report</p>
                <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar for generation */}
        {step === 'generating' && (
          <div className="border-t p-4 bg-muted/30">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Generating report...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SELECT REPORT TYPE STEP
// ============================================================================

interface SelectReportTypeProps {
  onSelect: (type: GovernorReportType) => void;
}

function SelectReportType({ onSelect }: SelectReportTypeProps) {
  const reportTypes = Object.entries(REPORT_TEMPLATES) as Array<[GovernorReportType, typeof REPORT_TEMPLATES[GovernorReportType]]>;

  const getIconForType = (type: GovernorReportType) => {
    switch (type) {
      case 'annual_compliance':
        return <Shield className="w-6 h-6 text-blue-600" />;
      case 'pre_ofsted_assurance':
        return <Check className="w-6 h-6 text-emerald-600" />;
      case 'budget_planning':
        return <DollarSign className="w-6 h-6 text-amber-600" />;
      case 'termly_summary':
        return <Calendar className="w-6 h-6 text-purple-600" />;
      case 'domain_deep_dive':
        return <FileText className="w-6 h-6 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Report Type</h3>
        <p className="text-sm text-muted-foreground">
          Choose the type of report you want to generate for your governing board
        </p>
      </div>

      <div className="space-y-3">
        {reportTypes.map(([key, template]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="w-full text-left p-4 rounded-lg border hover:border-primary hover:bg-accent/50 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center border">
                {getIconForType(key)}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold flex items-center gap-2">
                  {template.name}
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </h4>
                <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {template.frequency}
                  </span>
                  <span>·</span>
                  <span>{template.audience.join(', ')}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CONFIGURE REPORT STEP
// ============================================================================

interface ConfigureReportProps {
  reportType: GovernorReportType;
  selectedFormat: ReportFormat;
  onFormatChange: (format: ReportFormat) => void;
  selectedDomains: ComplianceDomain[];
  onToggleDomain: (domain: ComplianceDomain) => void;
  onSelectAllDomains: () => void;
  onClearDomains: () => void;
  classificationFilter: 'all' | 'statutory_only' | 'statutory_and_good_practice';
  onClassificationChange: (filter: 'all' | 'statutory_only' | 'statutory_and_good_practice') => void;
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void;
  preparedFor: string;
  onPreparedForChange: (value: string) => void;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

function ConfigureReport({
  reportType,
  selectedFormat,
  onFormatChange,
  selectedDomains,
  onToggleDomain,
  onSelectAllDomains,
  onClearDomains,
  classificationFilter,
  onClassificationChange,
  dateRange,
  onDateRangeChange,
  preparedFor,
  onPreparedForChange,
  onBack,
  onGenerate,
  isGenerating
}: ConfigureReportProps) {
  const allDomains = Object.keys(DOMAIN_METADATA) as ComplianceDomain[];
  const allSelected = selectedDomains.length === allDomains.length;
  const someSelected = selectedDomains.length > 0 && !allSelected;

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Report Format</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {FORMAT_OPTIONS.map((format) => (
            <button
              key={format.value}
              onClick={() => onFormatChange(format.value)}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedFormat === format.value
                  ? 'border-primary bg-primary/5'
                  : 'border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={selectedFormat === format.value ? 'text-primary' : 'text-muted-foreground'}>
                  {format.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{format.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{format.description}</p>
                </div>
                {selectedFormat === format.value && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Domain Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Include Domains</h3>
          <div className="flex gap-2">
            <button
              onClick={onSelectAllDomains}
              className="text-xs text-primary hover:underline"
            >
              Select All
            </button>
            <button
              onClick={onClearDomains}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
          <div className="grid gap-2 sm:grid-cols-2">
            {allDomains.map((domain) => {
              const metadata = DOMAIN_METADATA[domain];
              const isSelected = selectedDomains.includes(domain);
              return (
                <button
                  key={domain}
                  onClick={() => onToggleDomain(domain)}
                  className={`flex items-center gap-3 p-2 rounded-md text-left transition-colors ${
                    isSelected ? 'bg-primary/10' : 'hover:bg-accent/50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    isSelected ? 'bg-primary border-primary' : 'border'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="text-lg" aria-hidden="true">{metadata.icon}</span>
                  <span className="text-sm font-medium">{metadata.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Classification Filter */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Include Items</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onClassificationChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              classificationFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-accent'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => onClassificationChange('statutory_only')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              classificationFilter === 'statutory_only'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-background hover:bg-accent'
            }`}
          >
            ⚖️ Statutory Only
          </button>
          <button
            onClick={() => onClassificationChange('statutory_and_good_practice')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              classificationFilter === 'statutory_and_good_practice'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-background hover:bg-accent'
            }`}
          >
            📋 Statutory + Good Practice
          </button>
        </div>
      </div>

      {/* Date Range (optional) */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Reporting Period (Optional)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-3 py-2 rounded-md border text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 rounded-md border text-sm"
            />
          </div>
        </div>
      </div>

      {/* Prepared For */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Prepared For</h3>
        <input
          type="text"
          value={preparedFor}
          onChange={(e) => onPreparedForChange(e.target.value)}
          placeholder="e.g., Governing Board, Trust Board, Finance Committee"
          className="w-full px-3 py-2 rounded-md border text-sm"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={onBack}
          disabled={isGenerating}
          className="flex-1 px-4 py-2 rounded-md border hover:bg-accent font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// GENERATING PROGRESS
// ============================================================================

interface GeneratingProgressProps {
  progress: number;
  reportType: GovernorReportType;
}

function GeneratingProgress({ progress, reportType }: GeneratingProgressProps) {
  const template = REPORT_TEMPLATES[reportType];

  const getProgressMessage = () => {
    if (progress < 30) return 'Gathering compliance data...';
    if (progress < 50) return 'Calculating RAG status...';
    if (progress < 70) return 'Analyzing statutory requirements...';
    if (progress < 90) return 'Generating report content...';
    return 'Finalizing report...';
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Generating {template.name}</h3>
      <p className="text-sm text-muted-foreground mb-6">{getProgressMessage()}</p>
      <div className="w-64">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REPORT COMPLETE
// ============================================================================

interface ReportCompleteProps {
  report: GenerateReportResponse;
  reportType: GovernorReportType;
  format: ReportFormat;
  onClose: () => void;
  onGenerateAnother: () => void;
}

function ReportComplete({ report, reportType, format, onClose, onGenerateAnother }: ReportCompleteProps) {
  const template = REPORT_TEMPLATES[reportType];

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
        <Check className="w-8 h-8 text-emerald-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Report Generated Successfully</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {template.name} has been generated and is ready to download
      </p>

      <div className="w-full max-w-sm space-y-3">
        {report.downloadUrl && (
          <a
            href={report.downloadUrl}
            download
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download {format.toUpperCase()}
          </a>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onGenerateAnother}
            className="px-4 py-2 rounded-md border hover:bg-accent font-medium transition-colors text-sm"
          >
            Generate Another
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border hover:bg-accent font-medium transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
