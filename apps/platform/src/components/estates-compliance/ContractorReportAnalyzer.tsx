'use client';

/**
 * ContractorReportAnalyzer Component
 *
 * Upload and analyze contractor reports (PDF, DOCX, etc.) to extract findings.
 * Automatically classifies each finding as statutory, good practice, or contractor suggestion.
 *
 * Features:
 * - File upload (PDF, DOCX, images)
 * - AI-powered text extraction and analysis
 * - Automatic classification based on regulatory database
 * - Confidence scoring
 * - Review and edit interface
 * - Export to action plan
 */

import { useState, useCallback } from 'react';
import { Finding, FindingClassification, FindingDomain, classifyFinding } from '@/lib/estates-compliance/findings-database';
import { FindingsList } from './FindingsList';

interface ExtractedFinding extends Finding {
  id: string;
  rawText?: string;
  aiProcessed: boolean;
  confidence: number;
}

interface AnalysisResult {
  findings: ExtractedFinding[];
  totalFindings: number;
  statutoryCount: number;
  goodPracticeCount: number;
  suggestionCount: number;
  estimatedTotalCost: number;
  processingTime: number;
}

interface ContractorReportAnalyzerProps {
  onFindingsExtracted?: (findings: ExtractedFinding[]) => void;
  onExportToActionPlan?: (findings: ExtractedFinding[]) => void;
  organizationId?: string;
}

export function ContractorReportAnalyzer({
  onFindingsExtracted,
  onExportToActionPlan,
  organizationId
}: ContractorReportAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<FindingDomain | 'auto'>('auto');
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.pdf')) {
      setError('Please upload a PDF, DOCX, XLSX, or image file.');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setFile(selectedFile);
    setAnalysisResult(null);
  }, []);

  // Process the uploaded file
  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const startTime = Date.now();

    try {
      // Extract text from file
      const text = await extractTextFromFile(file);

      if (!text || text.length < 50) {
        throw new Error('Could not extract sufficient text from the file. Please ensure the file contains readable text.');
      }

      // Analyze text for findings
      const findings = await analyzeTextForFindings(text, selectedDomain);

      // Calculate statistics
      const processingTime = Date.now() - startTime;
      const statutoryCount = findings.filter(f => f.classification === 'statutory').length;
      const goodPracticeCount = findings.filter(f => f.classification === 'good_practice').length;
      const suggestionCount = findings.filter(f => f.classification === 'contractor_suggestion').length;
      const estimatedTotalCost = findings.reduce((sum, f) => sum + (f.estimatedCost || 0), 0);

      const result: AnalysisResult = {
        findings,
        totalFindings: findings.length,
        statutoryCount,
        goodPracticeCount,
        suggestionCount,
        estimatedTotalCost,
        processingTime
      };

      setAnalysisResult(result);
      onFindingsExtracted?.(findings);

    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(err.message || 'Failed to process file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract text from file using appropriate method
  async function extractTextFromFile(file: File): Promise<string> {
    // This would call the extractors
    // For now, simulate with a mock implementation
    const formData = new FormData();
    formData.append('file', file);

    // Call API endpoint for text extraction
    const response = await fetch('/api/estates-compliance/extract-text', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to extract text from file');
    }

    const data = await response.json();
    return data.text || '';
  }

  // Analyze text for findings using AI
  async function analyzeTextForFindings(text: string, domain: FindingDomain | 'auto'): Promise<ExtractedFinding[]> {
    // Call AI analysis endpoint
    const response = await fetch('/api/estates-compliance/analyze-findings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        domain: domain === 'auto' ? undefined : domain,
        organizationId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze text for findings');
    }

    const data = await response.json();

    // Process and classify each finding
    const findings: ExtractedFinding[] = (data.findings || []).map((finding: any, index: number) => {
      const classification = classifyFinding(finding.description, domain === 'auto' ? undefined : domain);

      return {
        id: `finding-${Date.now()}-${index}`,
        severity: finding.severity || classification.severity,
        description: finding.description,
        action_required: finding.actionRequired || classification.suggestedAction || 'Review and determine action required',
        classification: classification.classification,
        source: classification.source,
        source_url: classification.sourceUrl,
        estimated_cost: finding.estimatedCost || classification.estimatedCost,
        suggested_action: classification.suggestedAction,
        rawText: finding.rawText,
        aiProcessed: true,
        confidence: classification.confidence,
      };
    });

    return findings;
  }

  // Handle finding approval
  const handleApprove = (findingId: string) => {
    if (!analysisResult) return;

    const updatedFindings = analysisResult.findings.map(f =>
      f.id === findingId ? { ...f, status: 'approved' as const } : f
    );

    setAnalysisResult({ ...analysisResult, findings: updatedFindings });
  };

  // Handle finding decline
  const handleDecline = (findingId: string) => {
    if (!analysisResult) return;

    const updatedFindings = analysisResult.findings.map(f =>
      f.id === findingId ? { ...f, status: 'declined' as const } : f
    );

    setAnalysisResult({ ...analysisResult, findings: updatedFindings });
  };

  // Handle finding defer
  const handleDefer = (findingId: string, deferUntil: Date) => {
    if (!analysisResult) return;

    const updatedFindings = analysisResult.findings.map(f =>
      f.id === findingId ? { ...f, status: 'deferred' as const, deferredUntil: deferUntil.toISOString() } : f
    );

    setAnalysisResult({ ...analysisResult, findings: updatedFindings });
  };

  // Export findings to action plan
  const handleExportToActionPlan = () => {
    if (!analysisResult) return;

    const approvedFindings = analysisResult.findings.filter(f => f.status !== 'declined');
    onExportToActionPlan?.(approvedFindings);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Contractor Report Analyzer</h2>
        <p className="text-muted-foreground mt-1">
          Upload a contractor report to automatically extract and classify findings.
        </p>
      </div>

      {/* Domain Selection */}
      <div>
        <label htmlFor="domain" className="block text-sm font-medium mb-2">
          Compliance Domain
        </label>
        <select
          id="domain"
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value as FindingDomain | 'auto')}
          className="w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="auto">Auto-detect</option>
          <option value="legionella">Legionella</option>
          <option value="fire">Fire Safety</option>
          <option value="asbestos">Asbestos</option>
          <option value="electrical">Electrical</option>
          <option value="gas">Gas</option>
          <option value="water">Water Quality</option>
          <option value="mechanical">Mechanical & Heating</option>
          <option value="lifts">Lifts & LOLER</option>
          <option value="playground">Playground Safety</option>
          <option value="accessibility">Accessibility</option>
        </select>
      </div>

      {/* File Upload Area */}
      {!analysisResult && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) {
              handleFileSelect(droppedFile);
            }
          }}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) {
                handleFileSelect(selectedFile);
              }
            }}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-sm">
                <span className="font-medium text-primary">Click to upload</span> or drag and drop
              </div>
              <p className="text-xs text-muted-foreground">
                PDF, DOCX, XLSX, or images up to 10MB
              </p>
            </div>
          </label>

          {file && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={processFile}
                disabled={isProcessing}
                className="mt-3 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Analyze Report'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-900 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Analyzing contractor report...</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && !isProcessing && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <p className="text-2xl font-bold">{analysisResult.totalFindings}</p>
              <p className="text-xs text-muted-foreground">Total Findings</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-red-600">{analysisResult.statutoryCount}</p>
              <p className="text-xs text-red-600">Statutory Required</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-amber-600">{analysisResult.goodPracticeCount}</p>
              <p className="text-xs text-amber-600">Good Practice</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">{analysisResult.suggestionCount}</p>
              <p className="text-xs text-blue-600">Contractor Suggestions</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-2xl font-bold">£{analysisResult.estimatedTotalCost.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Est. Total Cost</p>
            </div>
          </div>

          {/* Processing Info */}
          <div className="text-sm text-muted-foreground">
            Processed in {analysisResult.processingTime / 1000} seconds
          </div>

          {/* Findings List */}
          <FindingsList
            findings={analysisResult.findings}
            onApprove={handleApprove}
            onDecline={handleDecline}
            onDefer={handleDefer}
            showDecisionButtons={true}
            title="Extracted Findings"
          />

          {/* Export Options */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <button
              onClick={handleExportToActionPlan}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Export to Action Plan
            </button>
            <button
              onClick={() => {
                setFile(null);
                setAnalysisResult(null);
              }}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-6 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Analyze Another Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
