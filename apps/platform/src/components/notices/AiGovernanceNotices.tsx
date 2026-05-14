import {
  ClipboardCheck,
  Eye,
  FileClock,
  Info,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AI_ADVISORY_ONLY_COPY,
  AI_TRANSPARENCY_COPY,
  AUDIT_TRAIL_COPY,
  HUMAN_REVIEW_REQUIRED_COPY,
  SENSITIVE_DATA_WARNING_COPY,
} from "@/lib/ai-governance";
import { cn } from "@/lib/utils";

type NoticeTone = "info" | "warning" | "success" | "neutral";

interface GovernanceNoticeProps {
  className?: string;
  title?: string;
  children?: ReactNode;
  tone?: NoticeTone;
}

const toneStyles: Record<NoticeTone, string> = {
  info: "border-indigo-200 bg-indigo-50 text-indigo-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  neutral: "border-slate-200 bg-slate-50 text-slate-950",
};

const iconStyles: Record<NoticeTone, string> = {
  info: "text-indigo-600",
  warning: "text-amber-600",
  success: "text-emerald-600",
  neutral: "text-slate-600",
};

function GovernanceNotice({
  className,
  title,
  children,
  tone = "info",
  icon: Icon,
}: GovernanceNoticeProps & { icon: typeof Info }) {
  return (
    <Alert className={cn(toneStyles[tone], className)}>
      <Icon className={cn("h-4 w-4", iconStyles[tone])} />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription className="text-sm leading-relaxed">
        {children}
      </AlertDescription>
    </Alert>
  );
}

export function AdvisoryOnlyBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-indigo-200 bg-indigo-50 text-indigo-700", className)}
    >
      Advisory only
    </Badge>
  );
}

export function AITransparencyNotice(props: GovernanceNoticeProps) {
  return (
    <GovernanceNotice
      title={props.title ?? "AI-assisted"}
      tone={props.tone ?? "info"}
      icon={Info}
      className={props.className}
    >
      {props.children ?? AI_TRANSPARENCY_COPY}
    </GovernanceNotice>
  );
}

export function HumanReviewRequiredNotice(props: GovernanceNoticeProps) {
  return (
    <GovernanceNotice
      title={props.title ?? "Human review required"}
      tone={props.tone ?? "warning"}
      icon={UserCheck}
      className={props.className}
    >
      {props.children ?? HUMAN_REVIEW_REQUIRED_COPY}
    </GovernanceNotice>
  );
}

export function SensitiveDataWarning(props: GovernanceNoticeProps) {
  return (
    <GovernanceNotice
      title={props.title ?? "Sensitive data warning"}
      tone={props.tone ?? "warning"}
      icon={ShieldAlert}
      className={props.className}
    >
      {props.children ?? SENSITIVE_DATA_WARNING_COPY}
    </GovernanceNotice>
  );
}

export function AuditTrailNotice(props: GovernanceNoticeProps) {
  return (
    <GovernanceNotice
      title={props.title ?? "Audit trail"}
      tone={props.tone ?? "success"}
      icon={FileClock}
      className={props.className}
    >
      {props.children ?? AUDIT_TRAIL_COPY}
    </GovernanceNotice>
  );
}

export function AdvisoryOnlyNotice(props: GovernanceNoticeProps) {
  return (
    <GovernanceNotice
      title={props.title ?? "Advisory only"}
      tone={props.tone ?? "neutral"}
      icon={ClipboardCheck}
      className={props.className}
    >
      {props.children ?? AI_ADVISORY_ONLY_COPY}
    </GovernanceNotice>
  );
}

export function EvidenceReviewNotice(props: GovernanceNoticeProps) {
  return (
    <GovernanceNotice
      title={props.title ?? "Check the evidence"}
      tone={props.tone ?? "info"}
      icon={Eye}
      className={props.className}
    >
      {props.children ??
        "Review the source evidence, assumptions and any missing information before relying on this output."}
    </GovernanceNotice>
  );
}
