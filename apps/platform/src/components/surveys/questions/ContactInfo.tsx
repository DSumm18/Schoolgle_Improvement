"use client";

import { motion } from "framer-motion";
import { User, Mail, Phone, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SurveyQuestion } from "@/lib/surveys/types";

interface QuestionComponentProps {
  question: SurveyQuestion;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  preview?: boolean;
}

const FIELD_CONFIG = {
  name: {
    label: "Name",
    icon: User,
    type: "text",
    placeholder: "Full name",
    autoComplete: "name",
  },
  email: {
    label: "Email",
    icon: Mail,
    type: "email",
    placeholder: "email@example.com",
    autoComplete: "email",
  },
  phone: {
    label: "Phone",
    icon: Phone,
    type: "tel",
    placeholder: "Phone number",
    autoComplete: "tel",
  },
  organisation: {
    label: "Organisation",
    icon: Building2,
    type: "text",
    placeholder: "Organisation name",
    autoComplete: "organization",
  },
} as const;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ContactInfo({
  question,
  value,
  onChange,
  error,
  disabled,
}: QuestionComponentProps) {
  const contactFields = question.settings?.contact_fields ?? [
    "name",
    "email",
    "phone",
    "organisation",
  ];
  const values: Record<string, string> =
    value && typeof value === "object" ? value : {};

  function handleChange(field: string, val: string) {
    if (disabled) return;
    onChange({ ...values, [field]: val });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div
        className={cn(
          "space-y-4",
          error && "rounded-md ring-2 ring-red-500/20 p-3",
        )}
        role="group"
        aria-label={question.title}
      >
        {contactFields.map((field) => {
          const config = FIELD_CONFIG[field];
          if (!config) return null;
          const Icon = config.icon;
          const fieldValue = values[field] ?? "";
          const emailError =
            field === "email" &&
            fieldValue.length > 0 &&
            !isValidEmail(fieldValue);

          return (
            <div key={field} className="space-y-1.5">
              <Label
                htmlFor={`contact-${field}`}
                className="text-sm font-medium"
              >
                {config.label}
              </Label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`contact-${field}`}
                  type={config.type}
                  placeholder={config.placeholder}
                  autoComplete={config.autoComplete}
                  value={fieldValue}
                  onChange={(e) => handleChange(field, e.target.value)}
                  disabled={disabled}
                  aria-label={config.label}
                  className={cn(
                    "pl-10",
                    emailError && "border-red-500 focus-visible:ring-red-500",
                  )}
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500">
                  Please enter a valid email address
                </p>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}
