"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";
import { PolicyList } from "@/components/compliance";
import { TemplatePickerModal } from "@/components/compliance";
import { PolicyEditor } from "@/components/compliance";

export default function PoliciesPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  if (selectedPolicyId || selectedTemplateId) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <PolicyEditor
          organizationId={organizationId}
          itemId={selectedPolicyId || undefined}
          templateId={selectedTemplateId || undefined}
          onClose={() => {
            setSelectedPolicyId(null);
            setSelectedTemplateId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Link
          href="/dashboard/compliance"
          className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-purple-600" />
        </Link>
        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-2xl">
          <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
            <Sparkles size={14} className="animate-pulse" />
            Policy Management
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Policies
          </h1>
        </div>
      </motion.div>

      <PolicyList
        organizationId={organizationId}
        onCreatePolicy={() => setShowTemplatePicker(true)}
        onSelectPolicy={(id) => setSelectedPolicyId(id)}
      />

      <TemplatePickerModal
        organizationId={organizationId}
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelect={(templateId) => {
          setSelectedTemplateId(templateId);
          setShowTemplatePicker(false);
        }}
      />
    </div>
  );
}
