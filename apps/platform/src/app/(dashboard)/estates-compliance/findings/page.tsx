'use client';

/**
 * Findings Classification Demo Page
 *
 * Demonstrates the statutory vs good practice classification system.
 */

import { useState } from 'react';
import { ContractorReportAnalyzer } from '@/components/estates-compliance/ContractorReportAnalyzer';
import { FindingsList } from '@/components/estates-compliance/FindingsList';
import { Finding } from '@/lib/estates-compliance/findings-database';
import Link from 'next/link';

// Demo findings to showcase the classification system
const demoFindings: Finding[] = [
  {
    id: 'demo-1',
    severity: 'high',
    description: 'Cold water temperature at outlet 3 exceeds 20°C limit',
    action_required: 'Investigate cause and increase flushing frequency',
    classification: 'statutory',
    source: 'HSE L8 para 157',
    source_url: 'https://www.hse.gov.uk/pubns/books/l8.htm',
    estimated_cost: 0,
    suggested_action: 'Check for nearby heat sources, increase flushing to twice daily until resolved',
    confidence: 0.95,
    explanation: 'This is a statutory requirement from HSE L8 (ACoP). Cold water must be below 20°C after running for 2 minutes. Exceeding this limit indicates a system failure that requires corrective action.',
  },
  {
    id: 'demo-2',
    severity: 'high',
    description: 'Weekly flushing not completed - Science lab outlets unused for 12 days',
    action_required: 'Flush all outlets immediately and update log',
    classification: 'statutory',
    source: 'HSE L8 para 155',
    source_url: 'https://www.hse.gov.uk/pubns/books/l8.htm',
    estimated_cost: 0,
    suggested_action: 'Flush outlets for 5 minutes, record in log, review flushing procedures',
    confidence: 0.98,
    explanation: 'Statutory requirement from HSE L8 ACoP. Outlets not used for 7+ days must be flushed weekly. This is a legal requirement, not guidance.',
  },
  {
    id: 'demo-3',
    severity: 'medium',
    description: 'Consider installing sentinel outlets on all risers',
    action_required: 'Review and decide if installation is beneficial',
    classification: 'good_practice',
    source: 'HSE HSG274',
    source_url: 'https://www.hse.gov.uk/pubns/priced/hsg274part2.pdf',
    estimated_cost: 850,
    suggested_action: 'Add to wishlist for next financial year if budget allows',
    confidence: 0.85,
    explanation: 'Good practice from HSE HSG274. Sentinel outlets are mentioned as an example for monitoring, but this is NOT a statutory requirement. HSE L8 does not require sentinel outlets.',
  },
  {
    id: 'demo-4',
    severity: 'critical',
    description: 'Annual fire risk assessment review overdue',
    action_required: 'Complete fire risk assessment review immediately',
    classification: 'statutory',
    source: 'RRO 2005 Article 9',
    source_url: 'https://www.legislation.gov.uk/ukdsi/2005/1541/contents/made',
    estimated_cost: 500,
    suggested_action: 'Contract qualified fire risk assessor to review and update assessment',
    confidence: 1.0,
    explanation: 'Statutory requirement under RRO 2005 Article 9. A suitable and sufficient fire risk assessment must be carried out and reviewed regularly. Non-compliance is a criminal offense.',
  },
  {
    id: 'demo-5',
    severity: 'medium',
    description: 'Fire extinguishers showing signs of age - consider early replacement',
    action_required: 'Review extinguisher condition and replacement schedule',
    classification: 'contractor_suggestion',
    source: '',
    source_url: '',
    estimated_cost: 1200,
    suggested_action: 'Continue annual servicing, replace at end of normal service life unless failed',
    confidence: 0.7,
    explanation: 'This does not appear to be a statutory requirement. Extinguishers should be replaced if they fail annual service (BS5306), but age alone is not a legal requirement for replacement. This appears to be a contractor suggestion.',
  },
  {
    id: 'demo-6',
    severity: 'medium',
    description: 'Install additional smoke detectors in corridors',
    action_required: 'Review current detector coverage and decide',
    classification: 'good_practice',
    source: 'BS5839',
    source_url: 'https://www.bsi.group.com/en/standards/british-standards',
    estimated_cost: 2500,
    suggested_action: 'Review current coverage against BS5839 recommendations',
    confidence: 0.75,
    explanation: 'Good practice from BS5839. While BS5839 provides recommendations for detector spacing, RRO 2005 requires a "suitable" system. Whether additional detectors are required depends on current coverage and risk assessment.',
  },
  {
    id: 'demo-7',
    severity: 'critical',
    description: 'Asbestos register not reviewed in past 12 months',
    action_required: 'Review and update asbestos register immediately',
    classification: 'statutory',
    source: 'CAR 2012',
    source_url: 'https://www.legislation.gov.uk/ukdsi/2012/2307/contents/made',
    estimated_cost: 0,
    suggested_action: 'Review register for accuracy, update if any ACMs have been disturbed or removed',
    confidence: 1.0,
    explanation: 'Statutory duty under CAR 2012. The asbestos register must be kept up to date and reviewed regularly. Annual review is the expected standard.',
  },
  {
    id: 'demo-8',
    severity: 'low',
    description: 'Cold water tank showing signs of age - recommend replacement',
    action_required: 'Monitor and plan for eventual replacement',
    classification: 'contractor_suggestion',
    source: '',
    source_url: '',
    estimated_cost: 2500,
    suggested_action: 'Add to 3-year replacement plan. No immediate action required unless leaks or contamination detected.',
    confidence: 0.6,
    explanation: 'While tank condition should be monitored, there is no statutory age limit for cold water tanks. Replacement is only required if the tank fails inspection or affects water quality. This appears to be a contractor suggestion.',
  },
];

export default function FindingsDemoPage() {
  const [view, setView] = useState<'demo' | 'upload'>('demo');
  const [findings, setFindings] = useState<Finding[]>(demoFindings);

  const handleApprove = (findingId: string) => {
    console.log('Approved:', findingId);
    alert(`Finding ${findingId} approved and added to action plan`);
  };

  const handleDecline = (findingId: string) => {
    console.log('Declined:', findingId);
    setFindings(prev => prev.filter(f => f.id !== findingId));
  };

  const handleDefer = (findingId: string, deferUntil: Date) => {
    console.log('Deferred:', findingId, 'until:', deferUntil);
    alert(`Finding ${findingId} deferred until ${deferUntil.toLocaleDateString()}`);
  };

  const handleExport = (approvedFindings: Finding[]) => {
    console.log('Exporting findings:', approvedFindings);
    alert(`${approvedFindings.length} findings exported to action plan`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Statutory vs Good Practice</h1>
            <p className="text-muted-foreground mt-2">
              Know what you MUST do, not what they want you to buy
            </p>
          </div>
          <Link
            href="/estates-compliance"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            ← Back to Estates Compliance
          </Link>
        </div>

        {/* Explanation Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">
            The Problem: Everything Looks the Same
          </h2>
          <p className="text-blue-800 mb-4">
            When contractors provide inspection reports, they typically list findings and recommendations without
            distinguishing between legal requirements and suggestions. This leads to:
          </p>
          <ul className="list-disc list-inside text-blue-800 space-y-1">
            <li>Schools spending money on things that aren't legally required</li>
            <li>Contractor bias using "good practice" to generate additional work</li>
            <li>Uncertainty for site managers and SBMs who aren't regulation experts</li>
          </ul>
        </div>

        {/* Solution Banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-green-900 mb-3">
            Our Solution: Three-Tier Classification
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-600 font-bold">🔴 STATUTORY REQUIRED</span>
              </div>
              <p className="text-sm text-gray-700">
                Legal requirements from legislation or ACoP. Non-compliance may result in prosecution.
              </p>
            </div>
            <div className="bg-white border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-600 font-bold">🟡 GOOD PRACTICE</span>
              </div>
              <p className="text-sm text-gray-700">
                Recommended by industry guidance but not legally required.
              </p>
            </div>
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600 font-bold">🔵 CONTRACTOR SUGGESTION</span>
              </div>
              <p className="text-sm text-gray-700">
                Optional improvements suggested by the contractor.
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('demo')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'demo'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            View Demo Findings
          </button>
          <button
            onClick={() => setView('upload')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'upload'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upload Contractor Report
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'demo' ? (
        <>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              Demo findings showing real examples of how we classify contractor recommendations
            </p>
          </div>
          <FindingsList
            findings={findings}
            onApprove={handleApprove}
            onDecline={handleDecline}
            onDefer={handleDefer}
            showDecisionButtons={true}
            title="Demo: Legionella & Fire Safety Report"
          />
        </>
      ) : (
        <ContractorReportAnalyzer
          onFindingsExtracted={(extractedFindings) => {
            console.log('Extracted findings:', extractedFindings);
          }}
          onExportToActionPlan={handleExport}
        />
      )}

      {/* Footer Note */}
      <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-2">How Classification Works</h3>
        <p className="text-sm text-gray-700 mb-3">
          Every finding is traced to its source:
        </p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li><strong>Primary Legislation</strong> (RRO 2005, CAR 2012) → Statutory Required</li>
          <li><strong>HSE Approved Codes of Practice</strong> (HSE L8) → Statutory Required</li>
          <li><strong>HSE Guidance</strong> (HSE L8, HSG274) → Good Practice</li>
          <li><strong>British Standards</strong> (BS5839, BS7671) → Good Practice</li>
          <li><strong>Contractor Suggestions</strong> → Contractor Suggestion</li>
        </ul>
        <p className="text-sm text-gray-700 mt-3">
          When AI is uncertain, findings are flagged for manual review. The system is conservative:
          when in doubt, we classify as "good practice" rather than "statutory" to avoid false alarms.
        </p>
      </div>
    </div>
  );
}
