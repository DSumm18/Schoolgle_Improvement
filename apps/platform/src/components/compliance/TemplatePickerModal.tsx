"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Layout, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComplianceTemplate, ITEM_TYPE_LABELS } from "@/lib/compliance/types";

interface TemplatePickerModalProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
}

export default function TemplatePickerModal({
  organizationId,
  isOpen,
  onClose,
  onSelect,
}: TemplatePickerModalProps) {
  const [templates, setTemplates] = useState<ComplianceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, organizationId]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/compliance/templates?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = templates.filter(
    (t) =>
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const grouped = filtered.reduce<Record<string, ComplianceTemplate[]>>(
    (acc, t) => {
      const key = t.template_type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    },
    {},
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Choose a Template</DialogTitle>
          <DialogDescription>
            Select a template to create a new compliance document.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12">
            <Layout className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">No templates found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                  {ITEM_TYPE_LABELS[type as keyof typeof ITEM_TYPE_LABELS] ||
                    type}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((template, idx) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Card
                        className="cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
                        onClick={() => onSelect(template.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-slate-900 dark:text-white">
                                {template.name}
                              </p>
                              {template.description && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {template.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {template.is_statutory && (
                                  <Badge className="text-[10px] bg-red-100 text-red-700">
                                    Statutory
                                  </Badge>
                                )}
                                <span className="text-[10px] text-slate-400">
                                  v{template.version}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
