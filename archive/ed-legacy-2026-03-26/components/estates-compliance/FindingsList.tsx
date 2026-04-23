"use client";

/**
 * FindingsList Component
 *
 * Displays compliance findings with color-coded classification badges.
 * Distinguishes between statutory requirements, good practice, and contractor suggestions.
 *
 * Features:
 * - Red badge = Statutory Required (legal requirement)
 * - Amber badge = Good Practice (recommended)
 * - Blue badge = Contractor Suggestion (optional)
 * - Source references with links to legislation/guidance
 * - Decision support UI
 * - Filtering by classification
 */

import { useState } from "react";
import {
  Finding,
  FindingClassification,
} from "@/lib/estates-compliance/findings-database";
import {
  getClassificationBadgeClasses,
  formatClassification,
} from "@/lib/estates-compliance/findings-database";

interface FindingsListProps {
  findings: Finding[];
  onApprove?: (findingId: string) => void;
  onDecline?: (findingId: string) => void;
  onDefer?: (findingId: string, deferUntil: Date) => void;
  showDecisionButtons?: boolean;
  title?: string;
}

const severityConfig: Record<
  Finding["severity"],
  { label: string; className: string }
> = {
  critical: { label: "Critical", className: "bg-red-600 text-white" },
  high: { label: "High", className: "bg-orange-500 text-white" },
  medium: { label: "Medium", className: "bg-yellow-500 text-white" },
  low: { label: "Low", className: "bg-gray-400 text-white" },
};

const classificationConfig: Record<
  FindingClassification,
  { label: string; description: string; icon: string }
> = {
  statutory: {
    label: "Statutory Required",
    description: "Legal requirement - non-compliance may result in prosecution",
    icon: "⚖️",
  },
  good_practice: {
    label: "Good Practice",
    description: "Recommended by industry guidance - not legally required",
    icon: "📋",
  },
  contractor_suggestion: {
    label: "Contractor Suggestion",
    description: "Optional - not required by regulation or guidance",
    icon: "💡",
  },
};

export function FindingsList({
  findings,
  onApprove,
  onDecline,
  onDefer,
  showDecisionButtons = true,
  title = "Findings Report",
}: FindingsListProps) {
  const [filter, setFilter] = useState<FindingClassification | "all">("all");
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  // Filter findings by classification
  const filteredFindings = findings.filter((finding) => {
    if (filter === "all") return true;
    return finding.classification === filter;
  });

  // Count by classification
  const counts: Record<FindingClassification | "all", number> = {
    all: findings.length,
    statutory: findings.filter((f) => f.classification === "statutory").length,
    good_practice: findings.filter((f) => f.classification === "good_practice")
      .length,
    contractor_suggestion: findings.filter(
      (f) => f.classification === "contractor_suggestion",
    ).length,
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="text-sm text-muted-foreground">
            {findings.length} finding{findings.length !== 1 ? "s" : ""} total
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 border-b">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilter("statutory")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === "statutory"
                ? "border-red-600 text-red-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            🔴 Statutory ({counts.statutory})
          </button>
          <button
            onClick={() => setFilter("good_practice")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === "good_practice"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            🟡 Good Practice ({counts.good_practice})
          </button>
          <button
            onClick={() => setFilter("contractor_suggestion")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === "contractor_suggestion"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            🔵 Contractor Suggestions ({counts.contractor_suggestion})
          </button>
        </div>

        {/* Findings List */}
        {filteredFindings.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">
              No findings match the current filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFindings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                isExpanded={expandedFinding === finding.id}
                onToggle={() =>
                  setExpandedFinding(
                    expandedFinding === finding.id ? null : finding.id,
                  )
                }
                onDecisionClick={() => setSelectedFinding(finding)}
                showDecisionButtons={showDecisionButtons}
              />
            ))}
          </div>
        )}
      </div>

      {/* Decision Support Modal */}
      {selectedFinding && (
        <DecisionSupportModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          onApprove={() => {
            onApprove?.(selectedFinding.id);
            setSelectedFinding(null);
          }}
          onDecline={() => {
            onDecline?.(selectedFinding.id);
            setSelectedFinding(null);
          }}
          onDefer={(date) => {
            onDefer?.(selectedFinding.id, date);
            setSelectedFinding(null);
          }}
        />
      )}
    </>
  );
}

interface FindingCardProps {
  finding: Finding;
  isExpanded: boolean;
  onToggle: () => void;
  onDecisionClick: () => void;
  showDecisionButtons: boolean;
}

function FindingCard({
  finding,
  isExpanded,
  onToggle,
  onDecisionClick,
  showDecisionButtons,
}: FindingCardProps) {
  const classification = finding.classification || "contractor_suggestion";
  const config = classificationConfig[classification];
  const severity = severityConfig[finding.severity];

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${
        classification === "statutory"
          ? "border-red-200 bg-red-50/30"
          : classification === "good_practice"
            ? "border-amber-200 bg-amber-50/30"
            : "border-blue-200 bg-blue-50/30"
      }`}
    >
      {/* Main Card */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Classification and Content */}
          <div className="flex-1 min-w-0">
            {/* Classification Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-lg`} aria-hidden="true">
                {config.icon}
              </span>
              <span className={getClassificationBadgeClasses(classification)}>
                {config.label}
              </span>
              {severity && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${severity.className}`}
                >
                  {severity.label}
                </span>
              )}
            </div>

            {/* Description */}
            <h3 className="font-semibold text-base mb-1">
              {finding.description}
            </h3>

            {/* Source Reference */}
            {finding.source && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>Source:</span>
                {finding.source_url ? (
                  <a
                    href={finding.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {finding.source}
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                ) : (
                  <span>{finding.source}</span>
                )}
              </div>
            )}

            {/* Confidence Score */}
            {finding.confidence !== undefined && (
              <div className="text-xs text-muted-foreground">
                Classification confidence:{" "}
                {Math.round(finding.confidence * 100)}%
                {finding.confidence < 0.7 && (
                  <span className="ml-2 text-amber-600">
                    (Manual review recommended)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={onToggle}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isExpanded ? "Show less" : "Show more"}
            >
              {isExpanded ? "▲ Less" : "▼ More"}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {/* Explanation */}
            {finding.explanation && (
              <div>
                <h4 className="text-sm font-medium mb-1">
                  Why this classification:
                </h4>
                <p className="text-sm text-muted-foreground">
                  {finding.explanation}
                </p>
              </div>
            )}

            {/* Suggested Action */}
            {finding.suggested_action && (
              <div>
                <h4 className="text-sm font-medium mb-1">Suggested action:</h4>
                <p className="text-sm">{finding.suggested_action}</p>
              </div>
            )}

            {/* Estimated Cost */}
            {finding.estimated_cost && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Estimated cost:</span>
                <span className="font-semibold text-lg">
                  £{finding.estimated_cost.toLocaleString()}
                </span>
              </div>
            )}

            {/* Decision Buttons */}
            {showDecisionButtons && (
              <div className="flex flex-wrap gap-2 pt-3 border-t">
                <button
                  onClick={onDecisionClick}
                  className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={onDecisionClick}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  ◔ Defer
                </button>
                <button
                  onClick={onDecisionClick}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-gray-50 transition-colors"
                >
                  ✕ Decline
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface DecisionSupportModalProps {
  finding: Finding;
  onClose: () => void;
  onApprove: () => void;
  onDecline: () => void;
  onDefer: (date: Date) => void;
}

function DecisionSupportModal({
  finding,
  onClose,
  onApprove,
  onDecline,
  onDefer,
}: DecisionSupportModalProps) {
  const classification = finding.classification || "contractor_suggestion";
  const config = classificationConfig[classification];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Decision Support</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Finding Summary */}
          <div>
            <span className={getClassificationBadgeClasses(classification)}>
              {config.label}
            </span>
            <h3 className="text-lg font-semibold mt-2">
              {finding.description}
            </h3>
            {finding.estimated_cost && (
              <p className="text-2xl font-bold mt-2">
                Estimated cost: £{finding.estimated_cost.toLocaleString()}
              </p>
            )}
          </div>

          {/* What is this? */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">What does this mean?</h4>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>

          {/* Source */}
          {finding.source && (
            <div>
              <h4 className="font-semibold mb-2">Source:</h4>
              <p className="text-sm text-muted-foreground">
                {finding.source_url ? (
                  <a
                    href={finding.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {finding.source} ↗
                  </a>
                ) : (
                  finding.source
                )}
              </p>
            </div>
          )}

          {/* Explanation */}
          {finding.explanation && (
            <div>
              <h4 className="font-semibold mb-2">Schoolgle Analysis:</h4>
              <p className="text-sm text-muted-foreground">
                {finding.explanation}
              </p>
            </div>
          )}

          {/* Your Options */}
          <div>
            <h4 className="font-semibold mb-3">Your Options:</h4>
            <div className="space-y-3">
              {/* Statutory - must do */}
              {finding.classification === "statutory" && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900 mb-2">
                    ⚠️ Statutory Requirement - Action Required
                  </p>
                  <p className="text-sm text-red-800 mb-3">
                    This is a legal requirement. Non-compliance may result in:
                  </p>
                  <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                    <li>Legal prosecution</li>
                    <li>Insurance invalidation</li>
                    <li>HSE enforcement notices</li>
                    <li>Inability to defend negligence claims</li>
                  </ul>
                </div>
              )}

              {/* Good Practice - recommended */}
              {finding.classification === "good_practice" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900 mb-2">
                    📋 Good Practice - Recommended
                  </p>
                  <p className="text-sm text-amber-800 mb-3">
                    This is recommended by industry guidance but is not legally
                    required:
                  </p>
                  <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
                    <li>Recommended by HSE guidance</li>
                    <li>May be cited in incidents</li>
                    <li>Shows commitment to best practice</li>
                    <li>Not prosecutable by itself</li>
                  </ul>
                </div>
              )}

              {/* Contractor Suggestion - optional */}
              {finding.classification === "contractor_suggestion" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    💡 Contractor Suggestion - Optional
                  </p>
                  <p className="text-sm text-blue-800 mb-3">
                    This is a contractor recommendation that is optional:
                  </p>
                  <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                    <li>Not required by law or guidance</li>
                    <li>May be beneficial but can be deferred</li>
                    <li>Consider when budget allows</li>
                    <li>No legal consequence for declining</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button
              onClick={onApprove}
              className="flex-1 inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              ✓ Approve & Add to Action Plan
            </button>
            {finding.classification !== "statutory" && (
              <button
                onClick={() =>
                  onDefer(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
                }
                className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                ◔ Add to Wishlist (Defer)
              </button>
            )}
            {finding.classification !== "statutory" && (
              <button
                onClick={onDecline}
                className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-muted-foreground hover:bg-gray-50 transition-colors"
              >
                ✕ Decline (Not Required)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
