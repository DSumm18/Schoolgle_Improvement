"use client";

import { useState } from "react";
import {
  CheckCircle,
  Edit3,
  XCircle,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { TerryProposal } from "@/lib/ed/specialists/terry/tools";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketProposalProps {
  proposal: TerryProposal;
  onApprove: (proposal: TerryProposal) => void;
  onReject: (proposal: TerryProposal, reason: string) => void;
  isProcessing?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Human-readable action label derived from tool name + action */
function actionLabel(tool: string, action: TerryProposal["action"]): string {
  const toolMap: Record<string, string> = {
    terry_create_ticket: "Create Ticket",
    terry_update_ticket: "Update Ticket",
    terry_log_compliance_check: "Log Compliance Check",
    terry_assess_risk: "Risk Assessment",
  };
  if (toolMap[tool]) return toolMap[tool];
  // Fallback: derive from action
  const actionMap: Record<TerryProposal["action"], string> = {
    create: "Create Record",
    update: "Update Record",
    log: "Log Entry",
    assess: "Risk Assessment",
  };
  return actionMap[action];
}

/** Risk score band styles (matches RiskScoreBadge convention) */
function riskScoreStyles(score: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (score < 5) return { bg: "bg-green-100", text: "text-green-800", label: "Low" };
  if (score < 15) return { bg: "bg-amber-100", text: "text-amber-800", label: "Medium" };
  return { bg: "bg-red-100", text: "text-red-800", label: "High" };
}

/** Requirement type badge styles */
function reqTypeStyles(type: "must" | "should" | "could"): string {
  switch (type) {
    case "must":
      return "bg-red-100 text-red-800 border-red-200";
    case "should":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "could":
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
}

/** Confidence percentage badge colour */
function confidenceStyles(confidence: number): string {
  if (confidence >= 0.85) return "bg-green-100 text-green-800";
  if (confidence >= 0.6) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

/** Format a field value for display */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

/** Convert snake_case / camelCase field key to a readable label */
function fieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function RejectionPanel({
  onConfirm,
  onCancel,
  disabled,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  disabled: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-sm font-medium text-red-800">
        Please tell Terry why you&apos;re rejecting this proposal:
      </p>
      <textarea
        className="w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        rows={3}
        placeholder="e.g. Wrong priority, incorrect location, duplicate ticket…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={disabled}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(reason)}
          disabled={disabled || reason.trim().length === 0}
          className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <XCircle className="h-4 w-4" />
          Confirm Rejection
        </button>
        <button
          onClick={onCancel}
          disabled={disabled}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function TicketProposal({
  proposal,
  onApprove,
  onReject,
  isProcessing = false,
}: TicketProposalProps) {
  // Edit mode: clone of fields that the user can modify
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, unknown>>(
    () => ({ ...proposal.fields })
  );

  // Rejection state
  const [isRejecting, setIsRejecting] = useState(false);

  // Regulatory references collapse
  const [refsExpanded, setRefsExpanded] = useState(false);

  const risk = proposal.risk_assessment;
  const riskStyles = risk ? riskScoreStyles(risk.score) : null;
  const label = actionLabel(proposal.tool, proposal.action);
  const confidencePct = Math.round(proposal.confidence * 100);

  function handleFieldChange(key: string, rawValue: string) {
    // Try to preserve the original type
    const original = proposal.fields[key];
    let parsed: unknown = rawValue;
    if (typeof original === "number") {
      const n = Number(rawValue);
      parsed = isNaN(n) ? rawValue : n;
    } else if (typeof original === "boolean") {
      parsed = rawValue === "true";
    }
    setEditedFields((prev) => ({ ...prev, [key]: parsed }));
  }

  function handleApprove() {
    const updated: TerryProposal = {
      ...proposal,
      fields: isEditing ? editedFields : proposal.fields,
    };
    onApprove(updated);
  }

  function handleRejectConfirm(reason: string) {
    onReject(proposal, reason);
  }

  const fieldEntries = Object.entries(isEditing ? editedFields : proposal.fields);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Action label */}
            <span className="inline-flex items-center rounded-md bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 uppercase tracking-wide">
              {label}
            </span>

            {/* Confidence */}
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${confidenceStyles(proposal.confidence)}`}
            >
              {confidencePct}% confidence
            </span>

            {/* Safeguarding flag */}
            {risk?.safeguarding_flag && (
              <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
                <Shield className="h-3.5 w-3.5" />
                Safeguarding
              </span>
            )}

            {/* Risk register flag */}
            {risk?.register_entry_required && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                Risk Register
              </span>
            )}
          </div>

          {/* Summary */}
          <p className="text-sm text-gray-800 font-medium leading-snug mt-0.5">
            {proposal.summary}
          </p>
        </div>
      </div>

      {/* ── Risk Assessment ─────────────────────────────────────────────────── */}
      {risk && riskStyles && (
        <div className="px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Risk Score
            </span>
            <span
              className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-bold ${riskStyles.bg} ${riskStyles.text}`}
            >
              {risk.score} / 25 — {riskStyles.label}
            </span>
            <span className="text-xs text-gray-500">
              Likelihood {risk.likelihood} × Impact {risk.impact}
            </span>
          </div>
          {risk.reasoning && (
            <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
              {risk.reasoning}
            </p>
          )}
        </div>
      )}

      {/* ── Fields Table ────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Pre-filled Fields
          {isEditing && (
            <span className="ml-2 text-indigo-600 normal-case font-normal">
              (editing — modify values below)
            </span>
          )}
        </p>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {fieldEntries.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-gray-400 text-xs italic">
                    No fields provided
                  </td>
                </tr>
              )}
              {fieldEntries.map(([key, value], idx) => (
                <tr
                  key={key}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-3 py-2 font-medium text-gray-600 text-xs w-2/5 align-top whitespace-nowrap">
                    {fieldLabel(key)}
                  </td>
                  <td className="px-3 py-2 text-gray-900 text-xs align-top">
                    {isEditing ? (
                      typeof value === "boolean" ? (
                        <select
                          value={String(editedFields[key])}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          disabled={isProcessing}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formatValue(editedFields[key])}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          disabled={isProcessing}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      )
                    ) : (
                      <span className="whitespace-pre-wrap break-words">
                        {formatValue(value)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Regulatory References ───────────────────────────────────────────── */}
      {proposal.regulatory_references.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100">
          <button
            onClick={() => setRefsExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors"
          >
            Regulatory References ({proposal.regulatory_references.length})
            {refsExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {refsExpanded && (
            <ul className="mt-2 space-y-1.5">
              {proposal.regulatory_references.map((ref, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${reqTypeStyles(ref.requirement_type)}`}
                  >
                    {ref.requirement_type}
                  </span>
                  <span className="text-xs text-gray-700 leading-snug">
                    <span className="font-medium">{ref.legislation}</span>
                    {ref.section && (
                      <span className="text-gray-500"> — {ref.section}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Action Buttons ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3 bg-gray-50 flex flex-wrap gap-2">
        {/* Approve */}
        <button
          onClick={handleApprove}
          disabled={isProcessing || isRejecting}
          className="flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <CheckCircle className="h-4 w-4" />
          Approve
        </button>

        {/* Edit / Stop editing */}
        <button
          onClick={() => {
            if (isEditing) {
              // Discard edits
              setEditedFields({ ...proposal.fields });
            }
            setIsEditing((v) => !v);
            setIsRejecting(false);
          }}
          disabled={isProcessing}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
            isEditing
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Edit3 className="h-4 w-4" />
          {isEditing ? "Cancel Edit" : "Edit"}
        </button>

        {/* Reject */}
        {!isRejecting ? (
          <button
            onClick={() => {
              setIsRejecting(true);
              setIsEditing(false);
            }}
            disabled={isProcessing}
            className="flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        ) : null}
      </div>

      {/* ── Rejection Panel ─────────────────────────────────────────────────── */}
      {isRejecting && (
        <div className="px-4 pb-4">
          <RejectionPanel
            onConfirm={handleRejectConfirm}
            onCancel={() => setIsRejecting(false)}
            disabled={isProcessing}
          />
        </div>
      )}
    </div>
  );
}

export default TicketProposal;
