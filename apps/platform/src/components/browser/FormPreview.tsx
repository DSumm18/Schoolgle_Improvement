"use client";

/**
 * Form Preview Component - Side-by-side form display with translations
 *
 * Shows:
 * - Native language chat/messages on the left
 * - English form preview on the right
 * - Form fields with translated labels
 * - Approve/Edit/Cancel actions
 */

import { useState } from "react";
import { Check, X, Edit2, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LanguageCode } from "@/lib/translation-service";

// ============================================================================
// TYPES
// ============================================================================

export interface FormFieldData {
  ref: string;
  name: string;
  value: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

export interface TranslatedFormField {
  field: string;
  label: string;
  translatedLabel: string;
  placeholder?: string;
  translatedPlaceholder?: string;
}

export interface FormPreviewProps {
  /** URL of the form being filled */
  formUrl: string;
  /** Domain of the form */
  domain: string;
  /** Original form fields (English) */
  fields: FormFieldData[];
  /** Translated field labels */
  translatedFields?: TranslatedFormField[];
  /** User's preferred language */
  userLanguage: LanguageCode;
  /** Native language name for display */
  nativeLanguageName: string;
  /** Chat/conversation history in native language */
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
  /** Called when user confirms and submits */
  onConfirm: () => void | Promise<void>;
  /** Called when user wants to edit */
  onEdit?: (field: string) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Whether form is being submitted */
  isSubmitting?: boolean;
  /** Warnings about sensitive fields */
  warnings?: Array<{
    field: string;
    message: string;
  }>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FormPreview({
  formUrl,
  domain,
  fields,
  translatedFields,
  userLanguage,
  nativeLanguageName,
  conversationHistory = [],
  onConfirm,
  onEdit,
  onCancel,
  isSubmitting = false,
  warnings = [],
}: FormPreviewProps) {
  const [showFullUrl, setShowFullUrl] = useState(false);

  // Group fields by category for better UX
  const groupedFields = fields.reduce(
    (acc, field, index) => {
      const translatedField = translatedFields?.[index];
      const key = translatedField?.label || field.name;

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        ...field,
        translatedLabel: translatedField?.translatedLabel || field.name,
        translatedPlaceholder: translatedField?.translatedPlaceholder,
      });
      return acc;
    },
    {} as Record<
      string,
      Array<
        FormFieldData & {
          translatedLabel: string;
          translatedPlaceholder?: string;
        }
      >
    >,
  );

  const hasWarnings = warnings.length > 0;
  const requiredFields = fields.filter((f) => f.required);
  const filledRequiredFields = requiredFields.filter(
    (f) => f.value.trim() !== "",
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <Card className="border-sky-200 bg-sky-50">
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
            <Eye className="w-5 h-5 text-sky-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sky-900">
              Form Ready for Submission
            </h3>
            <p className="text-sm text-sky-700">
              Please review before Ed submits the form
            </p>
          </div>
          <div className="text-right text-sm text-sky-600">
            <span className="font-medium">
              {filledRequiredFields.length}/{requiredFields.length}
            </span>{" "}
            required fields filled
          </div>
        </div>
      </Card>

      {/* Warnings */}
      {hasWarnings && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4" />
              <span className="font-semibold">Please Note:</span>
            </div>
            {warnings.map((warning, index) => (
              <p key={index} className="text-sm text-amber-800 ml-6">
                • {warning.message}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Side-by-side Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Native Language Context */}
        <Card>
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              💬 Your Conversation
              <span className="text-xs font-normal text-gray-500">
                ({nativeLanguageName})
              </span>
            </h4>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {conversationHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Conversation will appear here</p>
              </div>
            ) : (
              conversationHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.role === "user"
                        ? "bg-sky-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === "user" ? "text-sky-200" : "text-gray-500"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right: English Form Preview */}
        <Card>
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              📋 Form Preview
              <span className="text-xs font-normal text-gray-500">
                (English)
              </span>
            </h4>
            <div className="mt-1 text-xs text-gray-500">
              {showFullUrl ? (
                <>
                  <a
                    href={formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 hover:underline"
                  >
                    {formUrl}
                  </a>
                  <button
                    onClick={() => setShowFullUrl(false)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    (less)
                  </button>
                </>
              ) : (
                <>
                  <span>{domain}</span>
                  <button
                    onClick={() => setShowFullUrl(true)}
                    className="ml-2 text-sky-600 hover:underline"
                  >
                    (show URL)
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {Object.values(groupedFields).map((group, groupIndex) => {
              const field = group[0];
              const warning = warnings.find((w) => w.field === field.ref);

              return (
                <div
                  key={groupIndex}
                  className={`p-3 rounded-lg border ${
                    warning
                      ? "border-amber-300 bg-amber-50"
                      : field.required && !field.value
                        ? "border-red-200 bg-red-50"
                        : "border-gray-200 bg-white"
                  }`}
                >
                  {/* Field Label (English) */}
                  <div className="flex items-start justify-between mb-1">
                    <label className="text-sm font-medium text-gray-900">
                      {field.name}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(field.ref)}
                        className="text-gray-400 hover:text-sky-600"
                        title="Edit this field"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Translated Label */}
                  {field.translatedLabel &&
                    field.translatedLabel !== field.name && (
                      <p className="text-xs text-gray-500 mb-2 italic">
                        "{field.translatedLabel}"
                      </p>
                    )}

                  {/* Value */}
                  <div className="p-2 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-900 break-words">
                      {field.value || (
                        <span className="text-gray-400 italic">
                          {field.placeholder || "No value"}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Warning */}
                  {warning && (
                    <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {warning.message}
                    </p>
                  )}

                  {/* Multiple values for same field */}
                  {group.length > 1 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Additional values:
                      </p>
                      {group.slice(1).map((additionalField, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-gray-50 rounded border border-gray-200 mt-1"
                        >
                          <p className="text-sm text-gray-700">
                            {additionalField.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Summary */}
      <Card className="border-gray-200">
        <div className="p-4 bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Fields</p>
              <p className="font-semibold text-gray-900">{fields.length}</p>
            </div>
            <div>
              <p className="text-gray-500">Filled</p>
              <p className="font-semibold text-green-700">
                {fields.filter((f) => f.value).length}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Required</p>
              <p className="font-semibold text-gray-900">
                {requiredFields.length}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Warnings</p>
              <p
                className={`font-semibold ${hasWarnings ? "text-amber-700" : "text-gray-500"}`}
              >
                {warnings.length}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        {onEdit && (
          <Button
            variant="outline"
            onClick={() => onEdit("")}
            disabled={isSubmitting}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Details
          </Button>
        )}
        <Button
          onClick={onConfirm}
          disabled={isSubmitting || hasWarnings}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <>Submitting...</>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Confirm & Submit Form
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// FIELD EDITOR COMPONENT
// ============================================================================

interface FieldEditorProps {
  field: FormFieldData;
  translatedLabel?: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function FieldEditor({
  field,
  translatedLabel,
  value,
  onChange,
  onSave,
  onCancel,
}: FieldEditorProps) {
  return (
    <Card className="border-sky-200">
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.name}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {translatedLabel && translatedLabel !== field.name && (
            <p className="text-xs text-gray-500 mb-2 italic">
              "{translatedLabel}"
            </p>
          )}
          <input
            type={field.type || "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            className="bg-sky-600 hover:bg-sky-700"
          >
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
}
