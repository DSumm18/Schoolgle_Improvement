"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface DPIAWizardProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const STEPS = [
  { title: "Processing Details", description: "Describe the data processing" },
  { title: "Lawful Basis", description: "Necessity and proportionality" },
  { title: "Risk Assessment", description: "Identify risks to individuals" },
  { title: "Mitigations", description: "Measures to reduce risk" },
  { title: "Review & Sign Off", description: "Confirm and submit" },
];

const LAWFUL_BASES = [
  "Consent",
  "Contract",
  "Legal obligation",
  "Vital interests",
  "Public task",
  "Legitimate interests",
];

export default function DPIAWizard({
  organizationId,
  isOpen,
  onClose,
  onSave,
}: DPIAWizardProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    processing_description: "",
    purpose: "",
    lawful_basis: "",
    data_categories: [] as string[],
    special_category_data: false,
    recipients: "",
    transfers_outside_uk: false,
    necessity_assessment: "",
    proportionality_assessment: "",
    risks: [] as Array<{
      description: string;
      likelihood: string;
      severity: string;
    }>,
    mitigations: [] as Array<{ risk: string; measure: string; status: string }>,
    consultation_required: false,
    consultation_notes: "",
  });

  const addRisk = () => {
    setFormData((prev) => ({
      ...prev,
      risks: [
        ...prev.risks,
        { description: "", likelihood: "medium", severity: "medium" },
      ],
    }));
  };

  const removeRisk = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      risks: prev.risks.filter((_, i) => i !== index),
    }));
  };

  const updateRisk = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      risks: prev.risks.map((r, i) =>
        i === index ? { ...r, [field]: value } : r,
      ),
    }));
  };

  const addMitigation = () => {
    setFormData((prev) => ({
      ...prev,
      mitigations: [
        ...prev.mitigations,
        { risk: "", measure: "", status: "planned" },
      ],
    }));
  };

  const removeMitigation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      mitigations: prev.mitigations.filter((_, i) => i !== index),
    }));
  };

  const updateMitigation = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      mitigations: prev.mitigations.map((m, i) =>
        i === index ? { ...m, [field]: value } : m,
      ),
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/compliance/gdpr/dpia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, ...formData }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create DPIA");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleDataCategory = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      data_categories: prev.data_categories.includes(cat)
        ? prev.data_categories.filter((c) => c !== cat)
        : [...prev.data_categories, cat],
    }));
  };

  const DATA_CATEGORIES = [
    "Names",
    "Contact details",
    "Date of birth",
    "Health data",
    "SEN records",
    "Ethnicity",
    "Religion",
    "Attendance",
    "Assessment data",
    "Behaviour records",
    "Financial data",
    "Photographs",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Data Protection Impact Assessment
          </DialogTitle>
          <DialogDescription>
            Following ICO guidance for schools. Complete all steps.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => setStep(i)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                  i === step
                    ? "bg-purple-100 text-purple-700"
                    : i < step
                      ? "text-emerald-600"
                      : "text-slate-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i === step
                      ? "bg-purple-600 text-white"
                      : i < step
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-1 ${i < step ? "bg-emerald-300" : "bg-slate-200"}`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-lg">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Step 1: Processing Details */}
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="processing_description">
                    What processing are you planning? *
                  </Label>
                  <Textarea
                    id="processing_description"
                    value={formData.processing_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        processing_description: e.target.value,
                      })
                    }
                    placeholder="Describe the data processing activity in plain language..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purpose">What is the purpose? *</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, purpose: e.target.value })
                    }
                    placeholder="Why does the school need to process this data?"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>What categories of data are involved?</Label>
                  <div className="flex flex-wrap gap-2">
                    {DATA_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleDataCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          formData.data_categories.includes(cat)
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipients">Who will receive the data?</Label>
                  <Input
                    id="recipients"
                    value={formData.recipients}
                    onChange={(e) =>
                      setFormData({ ...formData, recipients: e.target.value })
                    }
                    placeholder="e.g. DfE, local authority, cloud provider"
                  />
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <Checkbox
                    id="special_category"
                    checked={formData.special_category_data}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        special_category_data: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor="special_category"
                    className="text-sm cursor-pointer"
                  >
                    Includes special category data (health, religion, ethnicity)
                  </Label>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <Checkbox
                    id="transfers_outside"
                    checked={formData.transfers_outside_uk}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        transfers_outside_uk: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor="transfers_outside"
                    className="text-sm cursor-pointer"
                  >
                    Data may be transferred outside the UK
                  </Label>
                </div>
              </>
            )}

            {/* Step 2: Lawful Basis */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="lawful_basis">
                    Lawful basis for processing *
                  </Label>
                  <Select
                    value={formData.lawful_basis}
                    onValueChange={(value) =>
                      setFormData({ ...formData, lawful_basis: value })
                    }
                  >
                    <SelectTrigger id="lawful_basis">
                      <SelectValue placeholder="Select lawful basis..." />
                    </SelectTrigger>
                    <SelectContent>
                      {LAWFUL_BASES.map((basis) => (
                        <SelectItem key={basis} value={basis}>
                          {basis}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="necessity_assessment">
                    Is the processing necessary? *
                  </Label>
                  <Textarea
                    id="necessity_assessment"
                    value={formData.necessity_assessment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        necessity_assessment: e.target.value,
                      })
                    }
                    placeholder="Explain why this processing is necessary to achieve the purpose..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proportionality_assessment">
                    Is the processing proportionate? *
                  </Label>
                  <Textarea
                    id="proportionality_assessment"
                    value={formData.proportionality_assessment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proportionality_assessment: e.target.value,
                      })
                    }
                    placeholder="Explain why the amount and type of data collected is proportionate..."
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <Checkbox
                    id="consultation_required"
                    checked={formData.consultation_required}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        consultation_required: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor="consultation_required"
                    className="text-sm cursor-pointer"
                  >
                    Consultation with data subjects or their representatives is
                    needed
                  </Label>
                </div>
                {formData.consultation_required && (
                  <div className="space-y-2">
                    <Label htmlFor="consultation_notes">
                      Consultation Details
                    </Label>
                    <Textarea
                      id="consultation_notes"
                      value={formData.consultation_notes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consultation_notes: e.target.value,
                        })
                      }
                      placeholder="How will consultation be carried out?"
                      rows={3}
                    />
                  </div>
                )}
              </>
            )}

            {/* Step 3: Risk Assessment */}
            {step === 2 && (
              <>
                <div className="flex items-center justify-between">
                  <Label>Identified Risks</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRisk}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Risk
                  </Button>
                </div>
                {formData.risks.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-300 rounded-lg">
                    <p className="text-sm text-slate-500">
                      No risks identified yet. Click "Add Risk" to begin.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.risks.map((risk, i) => (
                      <div
                        key={i}
                        className="p-3 border border-slate-200 rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <Label className="text-xs font-bold text-slate-500">
                            Risk {i + 1}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRisk(i)}
                            className="text-rose-600 hover:text-rose-700 h-6"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Textarea
                          value={risk.description}
                          onChange={(e) =>
                            updateRisk(i, "description", e.target.value)
                          }
                          placeholder="Describe the risk to individuals..."
                          rows={2}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Likelihood</Label>
                            <Select
                              value={risk.likelihood}
                              onValueChange={(v) =>
                                updateRisk(i, "likelihood", v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Severity</Label>
                            <Select
                              value={risk.severity}
                              onValueChange={(v) =>
                                updateRisk(i, "severity", v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 4: Mitigations */}
            {step === 3 && (
              <>
                <div className="flex items-center justify-between">
                  <Label>Mitigation Measures</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMitigation}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Mitigation
                  </Button>
                </div>
                {formData.mitigations.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-300 rounded-lg">
                    <p className="text-sm text-slate-500">
                      No mitigations added. Click "Add Mitigation" to begin.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.mitigations.map((m, i) => (
                      <div
                        key={i}
                        className="p-3 border border-slate-200 rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <Label className="text-xs font-bold text-slate-500">
                            Mitigation {i + 1}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMitigation(i)}
                            className="text-rose-600 hover:text-rose-700 h-6"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Input
                          value={m.risk}
                          onChange={(e) =>
                            updateMitigation(i, "risk", e.target.value)
                          }
                          placeholder="Which risk does this address?"
                        />
                        <Textarea
                          value={m.measure}
                          onChange={(e) =>
                            updateMitigation(i, "measure", e.target.value)
                          }
                          placeholder="What measure will reduce the risk?"
                          rows={2}
                        />
                        <Select
                          value={m.status}
                          onValueChange={(v) =>
                            updateMitigation(i, "status", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="in_progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="implemented">
                              Implemented
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 5: Review */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Summary</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-slate-500 text-xs">Processing</dt>
                      <dd>
                        {formData.processing_description || "Not provided"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs">Purpose</dt>
                      <dd>{formData.purpose || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs">Lawful Basis</dt>
                      <dd>{formData.lawful_basis || "Not selected"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs">
                        Data Categories
                      </dt>
                      <dd>
                        {formData.data_categories.join(", ") || "None selected"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs">
                        Risks Identified
                      </dt>
                      <dd>{formData.risks.length} risk(s)</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 text-xs">Mitigations</dt>
                      <dd>{formData.mitigations.length} measure(s)</dd>
                    </div>
                  </dl>
                </div>
                <p className="text-xs text-slate-500">
                  By submitting, you confirm that this assessment is accurate
                  and complete to the best of your knowledge.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? "Submitting..." : "Submit DPIA"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
