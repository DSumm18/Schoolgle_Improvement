'use client';

/**
 * Statutory Check Completion Page
 *
 * Professional completion workflow for statutory compliance checks with:
 * - Full audit trail (user ID, timestamp, IP)
 * - Completion status options
 * - Required notes/observations
 * - Evidence upload
 * - Findings recording
 * - Contractor notification
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Upload,
  FileText,
  Camera,
  User,
  Calendar,
  Save,
  X,
  Plus,
  Mail,
  Building,
} from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { createBrowserClient } from '@supabase/ssr';
import {
  DOMAIN_METADATA,
  getChecksForDomain,
  type ComplianceDomain,
  type StatutoryCheck,
} from '@/lib/estates-compliance/statutory-checks';

type CompletionStatus = 'completed' | 'awaiting_documentation' | 'pending_contractor' | 'incomplete';

interface Finding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  actionRequired: string;
  classification: 'statutory' | 'good_practice' | 'contractor_suggestion';
}

interface EvidenceFile {
  id: string;
  file: File;
  preview: string;
  category: 'certificate' | 'report' | 'photo' | 'document';
}

export default function CheckCompletionPage() {
  const params = useParams();
  const router = useRouter();
  const { organizationId, user } = useAuth();
  const domainSlug = params.domain as ComplianceDomain;
  const checkId = params.checkId as string;

  const [check, setCheck] = useState<StatutoryCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // User info (would come from auth in production)
  const [userInfo] = useState({
    id: 'user_001',
    name: 'John Smith',
    email: 'john.smith@school.co.uk',
    role: 'Site Manager',
  });

  // Form state
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>('completed');
  const [notes, setNotes] = useState('');
  const [observations, setObservations] = useState('');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [contractorNotified, setContractorNotified] = useState(false);
  const [nextDueDate, setNextDueDate] = useState('');

  // New finding form
  const [newFinding, setNewFinding] = useState({
    severity: 'medium' as Finding['severity'],
    description: '',
    actionRequired: '',
    classification: 'statutory' as Finding['classification'],
  });

  useEffect(() => {
    if (!domainSlug || !DOMAIN_METADATA[domainSlug]) {
      notFound();
      return;
    }

    const domainChecks = getChecksForDomain(domainSlug);
    const foundCheck = domainChecks.find((c) => c.id === checkId);

    if (!foundCheck) {
      notFound();
      return;
    }

    setCheck(foundCheck);

    // Calculate next due date based on check frequency
    calculateNextDueDate(foundCheck.frequency);
  }, [domainSlug, checkId]);

  const calculateNextDueDate = (frequency: string) => {
    const nextDate = new Date();
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'annually':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'termly':
        nextDate.setMonth(nextDate.getMonth() + 4);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    setNextDueDate(nextDate.toISOString().split('T')[0]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: EvidenceFile[] = Array.from(files).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        category: 'document',
      }));
      setEvidenceFiles([...evidenceFiles, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setEvidenceFiles(evidenceFiles.filter((f) => f.id !== id));
  };

  const updateFileCategory = (id: string, category: EvidenceFile['category']) => {
    setEvidenceFiles(evidenceFiles.map((f) => (f.id === id ? { ...f, category } : f)));
  };

  const addFinding = () => {
    if (newFinding.description && newFinding.actionRequired) {
      setFindings([
        ...findings,
        {
          id: Math.random().toString(36).substr(2, 9),
          ...newFinding,
        },
      ]);
      setNewFinding({
        severity: 'medium',
        description: '',
        actionRequired: '',
        classification: 'statutory',
      });
    }
  };

  const removeFinding = (id: string) => {
    setFindings(findings.filter((f) => f.id !== id));
  };

  const handleSubmit = async () => {
    if (!organizationId) {
      setSubmitError('You must be logged in to complete a check');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Get auth session for API call
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      console.log('[COMPLETION PAGE] Submitting completion:', { checkId, domainSlug, hasToken: !!session?.access_token });

      // Call the API to complete the statutory check
      const response = await fetch('/api/estates/statutory-completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          organization_id: organizationId,
          action: 'complete',
          check_id: checkId,
          check_data: {
            compliance_domain: domainSlug,
            status: completionStatus === 'incomplete' ? 'pending' : 'completed',
            completion_notes: `${notes}\n\n${observations ? `Additional observations: ${observations}` : ''}`,
            next_due_date: nextDueDate,
            evidence_ids: [], // TODO: Upload files and get IDs
            documents_received: false,
            findings: findings.map(f => ({
              severity: f.severity,
              description: f.description,
              action_required: f.actionRequired,
              classification: f.classification,
            })),
            completion_duration_minutes: undefined, // Could calculate from form start time
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete check');
      }

      const result = await response.json();

      console.log('[COMPLETION SAVED]', result);

      setSubmitSuccess(true);

      // Redirect after a short delay to show success
      setTimeout(() => {
        router.push(`/estates-compliance/${domainSlug}`);
      }, 1500);

    } catch (error) {
      console.error('[COMPLETION ERROR]', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to save completion');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    if (completionStatus === 'completed' && notes.trim() === '') return false;
    if (completionStatus === 'awaiting_documentation' && notes.trim() === '') return false;
    if (completionStatus === 'pending_contractor' && notes.trim() === '') return false;
    return true;
  };

  if (!check) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-semibold">Loading check details...</p>
        </div>
      </div>
    );
  }

  const metadata = DOMAIN_METADATA[domainSlug];

  const getStatusInfo = (status: CompletionStatus) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          description: 'Check fully completed with all documentation',
          bg: 'bg-green-50 dark:bg-green-950/30',
          border: 'border-green-300 dark:border-green-700',
          text: 'text-green-800 dark:text-green-300',
          icon: <Check className="w-5 h-5" />,
        };
      case 'awaiting_documentation':
        return {
          label: 'Awaiting Documentation',
          description: 'Check completed but waiting for contractor certificates',
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-300 dark:border-amber-700',
          text: 'text-amber-800 dark:text-amber-300',
          icon: <Clock className="w-5 h-5" />,
        };
      case 'pending_contractor':
        return {
          label: 'Pending Contractor',
          description: 'Check to be completed by contractor',
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-300 dark:border-blue-700',
          text: 'text-blue-800 dark:text-blue-300',
          icon: <Building className="w-5 h-5" />,
        };
      case 'incomplete':
        return {
          label: 'Incomplete',
          description: 'Check could not be completed - issues found',
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-300 dark:border-red-700',
          text: 'text-red-800 dark:text-red-300',
          icon: <AlertTriangle className="w-5 h-5" />,
        };
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
        <Link
          href={`/estates-compliance/${domainSlug}/${checkId}`}
          className="inline-flex items-center gap-2 w-fit px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {check.name}
        </Link>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{metadata.icon}</span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Complete Compliance Check</h1>
              <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">
                {metadata.name} • {check.name}
              </p>
            </div>
          </div>
        </div>

        {/* Audit Trail Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="font-semibold">{userInfo.name}</span>
            <span>({userInfo.role})</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Audit ID: {Date.now().toString(36).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Check Information */}
      <div className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Check Details</h3>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Reference</p>
              <p className="font-mono text-sm text-indigo-700 dark:text-indigo-400">{check.reference || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Frequency</p>
              <p className="text-gray-900 dark:text-white capitalize">{check.frequency}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Description</p>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{check.description}</p>
          </div>
          {check.requiresQualification && (
            <div className="mt-4 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Required Qualification: {check.requiresQualification}
              </p>
            </div>
          )}
          {check.evidenceRequired && check.evidenceRequired.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Required Evidence:</p>
              <ul className="space-y-1">
                {check.evidenceRequired.map((ev, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                    <Check className="w-4 h-4 text-green-500" />
                    {ev}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Completion Status */}
      <div className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">1. Completion Status</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Select the status of this check</p>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { value: 'completed' as CompletionStatus, title: 'Fully Completed', desc: 'All checks done with documentation' },
              { value: 'awaiting_documentation' as CompletionStatus, title: 'Awaiting Documentation', desc: 'Check done, waiting for certificates' },
              { value: 'pending_contractor' as CompletionStatus, title: 'Pending Contractor', desc: 'Contractor will complete' },
              { value: 'incomplete' as CompletionStatus, title: 'Incomplete', desc: 'Issues found, cannot complete' },
            ].map((status) => {
              const info = getStatusInfo(status.value);
              const isSelected = completionStatus === status.value;
              return (
                <button
                  key={status.value}
                  onClick={() => setCompletionStatus(status.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected
                      ? `${info.bg} ${info.border} ${info.text} shadow-md`
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? info.bg + ' ' + info.border : 'bg-gray-100 dark:bg-gray-800'}`}>
                      {info.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{status.title}</p>
                      <p className="text-sm mt-1">{status.desc}</p>
                    </div>
                    {isSelected && <Check className="w-5 h-5" />}
                  </div>
                </button>
              );
            })}
          </div>

          {completionStatus === 'awaiting_documentation' && (
            <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contractorNotified}
                  onChange={(e) => setContractorNotified(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">Notify Contractor</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Send automatic email requesting documentation</p>
                </div>
                <Mail className="w-5 h-5 text-gray-400" />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Notes & Observations */}
      <div className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">2. Notes & Observations</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Record details of this check (required)</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Completion Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what was checked, results, and any important observations..."
              rows={5}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This becomes part of the permanent audit record
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Additional Observations (optional)
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Any additional observations, recommendations, or notes for future reference..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Findings */}
      <div className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">3. Findings / Issues (optional)</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Record any problems or compliance issues found</p>
        </div>
        <div className="p-6 space-y-4">
          {findings.map((finding) => (
            <div key={finding.id} className="p-4 rounded-xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${finding.severity === 'critical' ? 'bg-red-600 text-white' :
                        finding.severity === 'high' ? 'bg-orange-600 text-white' :
                          finding.severity === 'medium' ? 'bg-yellow-600 text-white' :
                            'bg-gray-600 text-white'
                      }`}>
                      {finding.severity.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {finding.classification.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{finding.description}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    <strong>Action required:</strong> {finding.actionRequired}
                  </p>
                </div>
                <button
                  onClick={() => removeFinding(finding.id)}
                  className="p-2 rounded hover:bg-red-200 dark:hover:bg-red-900/50 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          <div className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
            <div className="grid gap-4 sm:grid-cols-2 mb-3">
              <select
                value={newFinding.severity}
                onChange={(e) => setNewFinding({ ...newFinding, severity: e.target.value as Finding['severity'] })}
                className="px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold"
              >
                <option value="low">Low Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="high">High Severity</option>
                <option value="critical">Critical Severity</option>
              </select>
              <select
                value={newFinding.classification}
                onChange={(e) => setNewFinding({ ...newFinding, classification: e.target.value as Finding['classification'] })}
                className="px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold"
              >
                <option value="statutory">Statutory Requirement</option>
                <option value="good_practice">Good Practice</option>
                <option value="contractor_suggestion">Contractor Suggestion</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Describe the issue found..."
              value={newFinding.description}
              onChange={(e) => setNewFinding({ ...newFinding, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold mb-2"
            />
            <input
              type="text"
              placeholder="What action is required?"
              value={newFinding.actionRequired}
              onChange={(e) => setNewFinding({ ...newFinding, actionRequired: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold mb-3"
            />
            <button
              onClick={addFinding}
              disabled={!newFinding.description || !newFinding.actionRequired}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Finding
            </button>
          </div>
        </div>
      </div>

      {/* Evidence Upload */}
      <div className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">4. Evidence Upload (optional)</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Attach photos, certificates, or supporting documents</p>
        </div>
        <div className="p-6">
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 bg-gray-50 dark:bg-gray-900/30 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">PDF, Images, Word, Excel (MAX. 10MB)</p>
            </div>
            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
          </label>

          {evidenceFiles.length > 0 && (
            <div className="mt-4 space-y-3">
              {evidenceFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-4 p-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                  {file.file.type.startsWith('image/') ? (
                    <img src={file.preview} alt="" className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-16 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{file.file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <select
                    value={file.category}
                    onChange={(e) => updateFileCategory(file.id, e.target.value as EvidenceFile['category'])}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-semibold"
                  >
                    <option value="certificate">Certificate</option>
                    <option value="report">Report</option>
                    <option value="photo">Photo</option>
                    <option value="document">Document</option>
                  </select>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Next Due Date */}
      <div className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">5. Next Due Date</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">When should this check be completed next?</p>
        </div>
        <div className="p-6">
          <input
            type="date"
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Automatically calculated based on {check.frequency} frequency
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="space-y-4">
        {submitError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700">
            <p className="text-sm font-bold text-red-900 dark:text-red-200">
              {submitError}
            </p>
          </div>
        )}

        {submitSuccess && (
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700">
            <p className="text-sm font-bold text-green-900 dark:text-green-200 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Check completed successfully! Redirecting...
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href={`/estates-compliance/${domainSlug}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || submitting || submitSuccess}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {submitSuccess ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Complete Check & Save Record
              </>
            )}
          </button>
        </div>
      </div>

      {!isFormValid() && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700">
          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
            Please add completion notes to proceed
          </p>
        </div>
      )}
    </div>
  );
}
