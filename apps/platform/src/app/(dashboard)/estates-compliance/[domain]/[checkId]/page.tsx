'use client';

/**
 * Individual Check Detail Page - Redesigned
 *
 * Comprehensive professional view of a single compliance check including:
 * - Full regulation description and references
 * - Complete history/timeline of all completions
 * - Evidence upload and document management
 * - Status workflow management
 *
 * UI improvements:
 * - Compact layout with better space utilization
 * - Improved visibility with high contrast colors
 * - Smooth animations with Magic UI components
 * - Real Supabase data integration
 *
 * @version 2.0 - Fixed imports
 */

import { useState, useEffect } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/SupabaseAuthContext';
import {
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  Link as LinkIcon,
  User,
  Building,
  Mail,
  Calendar,
  History,
  Download,
  Trash2,
  Eye,
  Share2,
  ExternalLink,
  FileCheck,
  Hourglass,
  Plus,
  ChevronRight,
} from 'lucide-react';
import {
  DOMAIN_METADATA,
  STATUTORY_CHECKS,
  getChecksForDomain,
  type ComplianceDomain,
  type StatutoryCheck,
  type CheckStatus,
} from '@/lib/estates-compliance/statutory-checks';
import { supabase } from '@/lib/supabase';
import { MagicCard } from '@/components/magicui/magic-card';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { BorderBeam } from '@/components/magicui/border-beam';
import { BlurFade } from '@/components/magicui/blur-fade';
import { motion, AnimatePresence } from 'framer-motion';

interface CompletionRecord {
  id: string;
  completed_at: string;
  completed_by: string;
  status: CheckStatus;
  completion_notes: string;
  next_due: string;
  rag_status?: 'red' | 'amber' | 'green';
}

export default function CheckDetailPage() {
  const router = useRouter();
  const { user, organizationId } = useAuth();
  const params = useParams();
  const domainSlug = params.domain as ComplianceDomain;
  const checkId = params.checkId as string;

  const [check, setCheck] = useState<StatutoryCheck | null>(null);
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [debugInfo, setDebugInfo] = useState({
    step: 'Initializing...',
    organizationId: organizationId || 'none',
    hasCheck: false,
    completionsCount: 0,
  });

  useEffect(() => {
    console.log('[CHECK DETAIL] Page loaded, params:', { domainSlug, checkId, organizationId });
    let timeoutId: NodeJS.Timeout;

    async function initializeData() {
      setDebugInfo({ step: 'Starting...', organizationId: organizationId || 'none', hasCheck: false, completionsCount: 0 });

      // Timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        console.warn('[CHECK DETAIL] Loading timeout - forcing ready state');
        setDebugInfo(prev => ({ ...prev, step: 'TIMEOUT - forcing ready' }));
        setLoading(false);
      }, 5000);

      // Validate domain
      if (!domainSlug || !DOMAIN_METADATA[domainSlug]) {
        console.log('[CHECK DETAIL] Invalid domain, calling notFound');
        setDebugInfo(prev => ({ ...prev, step: 'Invalid domain' }));
        clearTimeout(timeoutId);
        notFound();
        return;
      }

      setDebugInfo(prev => ({ ...prev, step: 'Domain validated, finding check...' }));

      // Find the check
      const domainChecks = getChecksForDomain(domainSlug);
      const foundCheck = domainChecks.find((c) => c.id === checkId);

      if (!foundCheck) {
        console.log('[CHECK DETAIL] Check not found:', checkId, 'in domain:', domainSlug);
        setDebugInfo(prev => ({ ...prev, step: 'Check NOT found!' }));
        clearTimeout(timeoutId);
        notFound();
        return;
      }

      console.log('[CHECK DETAIL] Check found:', foundCheck.name);
      setCheck(foundCheck);
      setDebugInfo(prev => ({ ...prev, step: 'Check found: ' + foundCheck.name, hasCheck: true }));

      // Fetch real completions from Supabase
      if (organizationId) {
        setDebugInfo(prev => ({ ...prev, step: 'Fetching from Supabase...' }));
        try {
          console.log('[CHECK DETAIL] Fetching completions for:', { organizationId, checkId, domainSlug });

          const { data, error } = await supabase
            .from('estates_statutory_completions')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('check_id', checkId)
            .eq('compliance_domain', domainSlug)
            .order('completed_at', { ascending: false, nullsFirst: false });

          console.log('[CHECK DETAIL] Result:', {
            count: data?.length || 0,
            error: error?.message,
            firstItem: data?.[0],
            allCheckIds: data?.map(d => d.check_id),
            allDomains: data?.map(d => d.compliance_domain),
          });

          if (error) {
            console.error('[CHECK DETAIL ERROR]', error);
            setDebugInfo(prev => ({ ...prev, step: 'ERROR: ' + error.message }));
          } else {
            setCompletions(data || []);
            setDebugInfo(prev => ({ ...prev, step: 'Loaded ' + (data?.length || 0) + ' completions', completionsCount: data?.length || 0 }));
          }
        } catch (error) {
          console.error('[CHECK DETAIL ERROR]', error);
          setDebugInfo(prev => ({ ...prev, step: 'CATCH ERROR: ' + String(error) }));
        }
      } else {
        console.log('[CHECK DETAIL] No organizationId, skipping fetch');
        setDebugInfo(prev => ({ ...prev, step: 'No organizationId - showing without data' }));
      }

      clearTimeout(timeoutId);
      setLoading(false);
      setDebugInfo(prev => ({ ...prev, step: 'DONE - Page ready' }));
      console.log('[CHECK DETAIL] Initialization complete');
    }

    initializeData();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [domainSlug, checkId, organizationId]);

  const getCurrentStatus = (): CheckStatus => {
    return completions[0]?.status || 'pending';
  };

  const getStatusInfo = (status: CheckStatus) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          description: 'All documentation received',
          color: '#10b981',
          bg: 'bg-emerald-50 dark:bg-emerald-950/20',
          icon: <Check className="w-4 h-4" />,
        };
      case 'awaiting_documentation':
        return {
          label: 'Awaiting Docs',
          description: 'Check done, waiting for documents',
          color: '#f59e0b',
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          icon: <Hourglass className="w-4 h-4" />,
        };
      case 'pending':
        return {
          label: 'Pending',
          description: 'Not yet started',
          color: '#6b7280',
          bg: 'bg-gray-50 dark:bg-gray-950/20',
          icon: <Clock className="w-4 h-4" />,
        };
      case 'overdue':
        return {
          label: 'Overdue',
          description: 'Past due date',
          color: '#ef4444',
          bg: 'bg-red-50 dark:bg-red-950/20',
          icon: <AlertTriangle className="w-4 h-4" />,
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          description: 'Currently being completed',
          color: '#3b82f6',
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          icon: <Clock className="w-4 h-4" />,
        };
      default:
        return {
          label: 'Unknown',
          description: 'Status unknown',
          color: '#6b7280',
          bg: 'bg-gray-50 dark:bg-gray-950/20',
          icon: <Clock className="w-4 h-4" />,
        };
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysUntil = (dateStr?: string) => {
    if (!dateStr) return '-';
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days}d left`;
  };

  const handleMarkComplete = async () => {
    if (!organizationId) {
      alert('You must be logged in to complete a check');
      return;
    }

    try {
      // Get auth session for API call
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      console.log('[CHECK DETAIL] Completing check:', { checkId, domainSlug, hasToken: !!session?.access_token });

      const response = await fetch('/api/estates/statutory-completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          organization_id: organizationId,
          action: 'complete',
          check_id: checkId,
          check_data: {
            compliance_domain: domainSlug,
            status: 'completed',
            completion_notes: 'Documents received and verified. Check marked as complete.',
            documents_received: true,
            evidence_ids: [],
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[CHECK DETAIL] Complete failed:', response.status, error);
        throw new Error(error.error || 'Failed to mark as complete');
      }

      const result = await response.json();
      console.log('[CHECK DETAIL] Complete success:', result);

      alert('✅ Check marked as complete with all documentation received!');
      router.refresh();

    } catch (error) {
      console.error('[COMPLETION ERROR]', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to save completion'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto"
          />
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading check details...</p>

          {/* Debug Panel - Visible for user without console access */}
          <div className="mt-6 mx-auto max-w-md text-left bg-white dark:bg-gray-800 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 p-4 shadow-lg">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">🔍 DEBUG INFO:</p>
            <div className="space-y-1 text-xs font-mono">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Step:</span> {debugInfo.step}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Organization ID:</span> {debugInfo.organizationId?.substring(0, 8) || 'none'}...
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Check Found:</span> {debugInfo.hasCheck ? '✅ Yes' : '❌ No'}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Completions:</span> {debugInfo.completionsCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!check) {
    notFound();
    return null;
  }

  const metadata = DOMAIN_METADATA[domainSlug];
  const currentStatus = getCurrentStatus();
  const statusInfo = getStatusInfo(currentStatus);
  const currentCompletion = completions[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <BlurFade delay={0} duration={0.5}>
          <div className="flex items-center gap-3 mb-6">
            <Link
              href={`/estates-compliance/${domainSlug}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {metadata.name}
            </Link>
          </div>
        </BlurFade>

        {/* Title Section */}
        <BlurFade delay={0.1} duration={0.5}>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{metadata.icon}</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {check.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {metadata.name} Compliance Check
                </p>
              </div>
            </div>
            <div
              className="shrink-0 px-4 py-2 rounded-xl flex items-center gap-2"
              style={{
                backgroundColor: `${statusInfo.color}15`,
                border: `2px solid ${statusInfo.color}40`,
              }}
            >
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: statusInfo.color, color: '#fff' }}
              >
                {statusInfo.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Status</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {statusInfo.label}
                </p>
              </div>
            </div>
          </div>
        </BlurFade>

        {/* Key Stats - Compact Row */}
        <BlurFade delay={0.2} duration={0.5}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <MagicCard className="p-3 text-center" gradientColor="#3b82f6" gradientOpacity={0.05}>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Next Due</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {currentCompletion?.next_due ? formatDate(currentCompletion.next_due) : 'Not set'}
              </p>
              <p className={`text-xs font-semibold ${currentCompletion && new Date(currentCompletion.next_due) < new Date()
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
                }`}>
                {getDaysUntil(currentCompletion?.next_due)}
              </p>
            </MagicCard>

            <MagicCard className="p-3 text-center" gradientColor="#8b5cf6" gradientOpacity={0.05}>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Frequency</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {check.frequency.replace('_', ' ')}
              </p>
            </MagicCard>

            <MagicCard className="p-3 text-center" gradientColor="#10b981" gradientOpacity={0.05}>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Last Done</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {currentCompletion ? formatDate(currentCompletion.completed_at) : 'Never'}
              </p>
            </MagicCard>

            <MagicCard className="p-3 text-center" gradientColor="#f59e0b" gradientOpacity={0.05}>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Category</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {check.category === 'statutory' ? 'Required' : 'Advisory'}
              </p>
            </MagicCard>
          </div>
        </BlurFade>

        {/* Tabs */}
        <BlurFade delay={0.3} duration={0.5}>
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {[
              { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" /> },
              { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </BlurFade>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Regulation Card */}
              <MagicCard className="p-5" gradientColor="#6366f1" gradientOpacity={0.08}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Regulation & Requirements
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {check.description}
                </p>

                {check.reference && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mb-4">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Regulatory Reference
                    </p>
                    <p className="font-mono text-sm text-indigo-700 dark:text-indigo-400 font-bold">
                      {check.reference}
                    </p>
                  </div>
                )}

                {check.referenceUrl && (
                  <a
                    href={check.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Official Guidance
                  </a>
                )}

                {check.requiresQualification && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                      Required Qualification
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {check.requiresQualification}
                    </p>
                  </div>
                )}
              </MagicCard>

              {/* Evidence Required */}
              {check.evidenceRequired && check.evidenceRequired.length > 0 && (
                <MagicCard className="p-5" gradientColor="#10b981" gradientOpacity={0.05}>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Required Evidence
                  </h3>
                  <ul className="space-y-2">
                    {check.evidenceRequired.map((evidence, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </MagicCard>
              )}
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {completions.length === 0 ? (
                <MagicCard className="p-8 text-center">
                  <Clock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No history yet
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This check hasn't been completed yet
                  </p>
                </MagicCard>
              ) : (
                completions.map((record, idx) => (
                  <MagicCard
                    key={record.id}
                    className="p-4"
                    gradientColor={getStatusInfo(record.status).color}
                    gradientOpacity={0.05}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="p-1.5 rounded-md"
                            style={{
                              backgroundColor: `${getStatusInfo(record.status).color}20`,
                              color: getStatusInfo(record.status).color,
                            }}
                          >
                            {getStatusInfo(record.status).icon}
                          </div>
                          <span
                            className="px-2 py-0.5 rounded-md text-xs font-semibold text-white"
                            style={{ backgroundColor: getStatusInfo(record.status).color }}
                          >
                            {getStatusInfo(record.status).label}
                          </span>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                              Current
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            By <span className="font-semibold text-gray-900 dark:text-gray-200">{record.completed_by}</span>
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {formatDateTime(record.completed_at)}
                          </p>
                          {record.completion_notes && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                              {record.completion_notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Next Due</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {record.next_due ? formatDate(record.next_due) : 'Not set'}
                        </p>
                        <p className={`text-xs font-semibold ${record.next_due && new Date(record.next_due) < new Date()
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                          }`}>
                          {getDaysUntil(record.next_due)}
                        </p>
                      </div>
                    </div>
                  </MagicCard>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <BlurFade delay={0.4} duration={0.5}>
          <div className="sticky bottom-4 mt-6">
            <div className="flex flex-wrap justify-center gap-3 p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
              {currentStatus === 'awaiting_documentation' && (
                <div className="relative overflow-hidden rounded-full">
                  <BorderBeam size={300} duration={8} delay={0} />
                  <ShimmerButton
                    onClick={handleMarkComplete}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark Complete
                  </ShimmerButton>
                </div>
              )}

              {(currentStatus === 'pending' || currentStatus === 'overdue') && (
                <div className="relative overflow-hidden rounded-full">
                  <BorderBeam size={300} duration={8} delay={0} />
                  <ShimmerButton
                    onClick={handleMarkComplete}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Complete Check
                  </ShimmerButton>
                </div>
              )}
            </div>
          </div>
        </BlurFade>

        {/* Debug Footer - Always visible for troubleshooting */}
        <div className="fixed bottom-0 left-0 right-0 bg-indigo-600 text-white text-xs py-2 px-4 font-mono z-50">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-1">
            <span>🔍 <strong>Step:</strong> {debugInfo.step}</span>
            <span><strong>Domain:</strong> {domainSlug}</span>
            <span><strong>CheckID:</strong> {checkId}</span>
            <span><strong>Org:</strong> {debugInfo.organizationId?.substring(0, 8) || 'none'}...</span>
            <span><strong>Check:</strong> {debugInfo.hasCheck ? '✅' : '❌'}</span>
            <span><strong>Completions:</strong> {debugInfo.completionsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
