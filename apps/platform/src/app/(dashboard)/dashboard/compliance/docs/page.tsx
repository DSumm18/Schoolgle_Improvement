"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileEdit, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";
import { TemplatePickerModal, PolicyEditor } from "@/components/compliance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DOC_TYPES = [
  {
    type: "incident",
    label: "Incident Report",
    description: "Record a safeguarding, behaviour, or H&S incident",
    icon: "📋",
  },
  {
    type: "doc",
    label: "Record of Concern",
    description: "Document a welfare or safeguarding concern",
    icon: "📝",
  },
  {
    type: "doc",
    label: "Parent Complaint Summary",
    description: "Log and track a formal complaint",
    icon: "📨",
  },
  {
    type: "doc",
    label: "GDPR SAR Log Entry",
    description: "Record a subject access request",
    icon: "🔒",
  },
  {
    type: "doc",
    label: "Contractor Visit Record",
    description: "Log contractor attendance and work completed",
    icon: "🔧",
  },
];

export default function DocsPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  if (selectedTemplateId) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <PolicyEditor
          organizationId={organizationId}
          templateId={selectedTemplateId}
          onClose={() => setSelectedTemplateId(null)}
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
          <FileEdit className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
            <Sparkles size={14} className="animate-pulse" />
            Document Builder
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Documents
          </h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DOC_TYPES.map((doc, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className="cursor-pointer hover:shadow-md hover:border-purple-200 transition-all group"
              onClick={() => setShowTemplatePicker(true)}
            >
              <CardHeader className="pb-2">
                <div className="text-2xl mb-2">{doc.icon}</div>
                <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                  {doc.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{doc.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="pt-4">
        <Button variant="outline" onClick={() => setShowTemplatePicker(true)}>
          Browse All Templates
        </Button>
      </div>

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
