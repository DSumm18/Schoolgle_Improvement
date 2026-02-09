'use client';

/**
 * Document Verifier Component
 *
 * Displays AI verification results for uploaded compliance documents
 * and allows users to trigger verification on-demand.
 */

import { useState, useEffect } from 'react';
import {
  FileCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface VerificationResult {
  verified: boolean;
  confidence: number;
  certificateInfo?: {
    certificateNumber?: string;
    issuingBody: string;
    issuedDate?: string;
    expiryDate?: string;
    certifyingEntity?: string;
    recipient?: string;
    address?: string;
    keyFindings?: string[];
    standardsMet?: string[];
    recommendations?: string[];
  };
  validationChecks: {
    documentTypeValid: boolean;
    issuingBodyRecognised: boolean;
    datesValid: boolean;
    datesConsistent: boolean;
    certificateNumberPresent: boolean;
    noTamperingDetected: boolean;
  };
  issues: string[];
  warnings: string[];
  suggestions: string[];
  complianceDomains: string[];
  extractedData: Record<string, any>;
  modelUsed: string;
  processingTime: number;
}

interface DocumentVerifierProps {
  evidenceId: string;
  organizationId: string;
  fileName: string;
  fileType: string;
  existingVerification?: VerificationResult | null;
  onVerified?: (result: VerificationResult) => void;
}

export function DocumentVerifier({
  evidenceId,
  organizationId,
  fileName,
  fileType,
  existingVerification,
  onVerified,
}: DocumentVerifierProps) {
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(existingVerification || null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (existingVerification) {
      setVerification(existingVerification);
    }
  }, [existingVerification]);

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/estates/evidence/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidence_id: evidenceId,
          organization_id: organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Verification failed');
      }

      const data = await response.json();
      setVerification(data.data.verification);

      if (onVerified) {
        onVerified(data.data.verification);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify document');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = () => {
    if (!verification) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
          <Clock className="w-4 h-4" />
          Not Verified
        </span>
      );
    }

    if (verifying) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700 animate-pulse">
          <Shield className="w-4 h-4 animate-spin" />
          Verifying...
        </span>
      );
    }

    if (verification.verified) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-4 h-4" />
          Verified ({Math.round(verification.confidence * 100)}% confidence)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-rose-100 text-rose-800">
        <XCircle className="w-4 h-4" />
        Verification Failed
      </span>
    );
  };

  const getValidationCheckIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    ) : (
      <XCircle className="w-4 h-4 text-rose-600" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Verification Status Bar */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-4">
          <FileCheck className={`w-8 h-8 ${verification?.verified ? 'text-emerald-600' : 'text-gray-400'}`} />
          <div>
            <h3 className="font-semibold">Document Verification</h3>
            <p className="text-sm text-muted-foreground">{fileName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          {!verification && !verifying && (
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verifying...' : 'Verify Document'}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
            <div>
              <p className="font-medium text-rose-900">Verification Error</p>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Results */}
      {verification && !verifying && (
        <div className="space-y-4">
          {/* Validation Checks */}
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-3">Validation Checks</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm">
                {getValidationCheckIcon(verification.validationChecks.documentTypeValid)}
                <span>Document Type</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getValidationCheckIcon(verification.validationChecks.issuingBodyRecognised)}
                <span>Issuing Body</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getValidationCheckIcon(verification.validationChecks.datesValid)}
                <span>Dates Valid</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getValidationCheckIcon(verification.validationChecks.datesConsistent)}
                <span>Dates Consistent</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getValidationCheckIcon(verification.validationChecks.certificateNumberPresent)}
                <span>Certificate Number</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getValidationCheckIcon(verification.validationChecks.noTamperingDetected)}
                <span>No Tampering</span>
              </div>
            </div>
          </div>

          {/* Issues and Warnings */}
          {(verification.issues.length > 0 || verification.warnings.length > 0) && (
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold mb-3">Issues & Warnings</h4>
              <div className="space-y-2">
                {verification.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                    <span className="text-rose-700">{issue}</span>
                  </div>
                ))}
                {verification.warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-amber-700">{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Information */}
          {verification.certificateInfo && (
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Extracted Information</h4>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {showDetails ? 'Hide' : 'Show'} Details
                  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {verification.certificateInfo.certificateNumber && (
                  <div>
                    <span className="text-muted-foreground">Certificate Number:</span>
                    <p className="font-medium">{verification.certificateInfo.certificateNumber}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Issuing Body:</span>
                  <p className="font-medium">{verification.certificateInfo.issuingBody}</p>
                </div>
                {verification.certificateInfo.issuedDate && (
                  <div>
                    <span className="text-muted-foreground">Issued Date:</span>
                    <p className="font-medium">{verification.certificateInfo.issuedDate}</p>
                  </div>
                )}
                {verification.certificateInfo.expiryDate && (
                  <div>
                    <span className="text-muted-foreground">Expiry Date:</span>
                    <p className="font-medium">{verification.certificateInfo.expiryDate}</p>
                  </div>
                )}
                {verification.certificateInfo.certifyingEntity && (
                  <div>
                    <span className="text-muted-foreground">Certifier:</span>
                    <p className="font-medium">{verification.certificateInfo.certifyingEntity}</p>
                  </div>
                )}
                {verification.certificateInfo.recipient && (
                  <div>
                    <span className="text-muted-foreground">Recipient:</span>
                    <p className="font-medium">{verification.certificateInfo.recipient}</p>
                  </div>
                )}
              </div>

              {showDetails && (
                <div className="mt-4 space-y-3 text-sm border-t pt-4">
                  {verification.certificateInfo.address && (
                    <div>
                      <span className="text-muted-foreground">Address:</span>
                      <p>{verification.certificateInfo.address}</p>
                    </div>
                  )}
                  {verification.certificateInfo.keyFindings && verification.certificateInfo.keyFindings.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Key Findings:</span>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {verification.certificateInfo.keyFindings.map((finding, i) => (
                          <li key={i}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {verification.certificateInfo.standardsMet && verification.certificateInfo.standardsMet.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Standards Met:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {verification.certificateInfo.standardsMet.map((standard, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">
                            {standard}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {verification.certificateInfo.recommendations && verification.certificateInfo.recommendations.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Recommendations:</span>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {verification.certificateInfo.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {verification.suggestions.length > 0 && (
            <div className="p-4 rounded-lg border bg-blue-50">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900">Suggestions</h4>
                  <ul className="mt-2 space-y-1 text-sm text-blue-800">
                    {verification.suggestions.map((suggestion, i) => (
                      <li key={i}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
            <span>Model: {verification.modelUsed}</span>
            <span>Processed in: {verification.processingTime}ms</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentVerifier;
