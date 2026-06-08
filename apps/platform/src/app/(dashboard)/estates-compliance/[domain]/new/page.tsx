'use client';

/**
 * Custom Check Builder - Wizard Page
 *
 * Multi-step wizard for creating custom compliance checks.
 *
 * Steps:
 * 1. Check Details - Name, description, domain
 * 2. Requirements - Qualifications, evidence, duration
 * 3. Checklist - Define checklist items
 * 4. Scheduling - Frequency, reminders, assignees
 * 5. Review & Create
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Plus,
  Trash2,
  FileText,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import {
  DOMAIN_METADATA,
  type ComplianceDomain,
  type CheckFrequency,
} from '@/lib/estates-compliance/statutory-checks';
import { COMMON_TEMPLATES, getTemplatesByDomain, type CheckVisibility, type RecurrencePattern } from '@/lib/estates-compliance/check-templates';

type WizardStep = 'template' | 'details' | 'requirements' | 'checklist' | 'scheduling' | 'review';

interface FormData {
  // From template
  clone_from?: string;

  // Step 1: Details
  name: string;
  description: string;
  compliance_domain: ComplianceDomain;
  classification: 'statutory' | 'non_statutory';
  statutory_reference?: string;

  // Step 2: Requirements
  estimated_duration?: number;
  requires_qualification?: string;
  evidence_required: string[];

  // Step 3: Checklist
  checklist_items: string[];

  // Step 4: Scheduling
  frequency: RecurrencePattern;
  visibility: CheckVisibility;
  tags: string[];
  notes?: string;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  compliance_domain: 'security',
  classification: 'non_statutory',
  statutory_reference: '',
  estimated_duration: undefined,
  requires_qualification: '',
  evidence_required: [],
  checklist_items: [],
  frequency: 'weekly',
  visibility: 'private',
  tags: [],
  notes: '',
};

export default function NewCustomCheckPage() {
  const params = useParams();
  const router = useRouter();
  const { organizationId } = useAuth();
  const domainSlug = params.domain as ComplianceDomain;

  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    compliance_domain: domainSlug || 'security',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const steps: Array<{ id: WizardStep; label: string; icon: React.ReactNode }> = [
    { id: 'template', label: 'Template', icon: <Copy className="w-4 h-4" /> },
    { id: 'details', label: 'Details', icon: <FileText className="w-4 h-4" /> },
    { id: 'requirements', label: 'Requirements', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'checklist', label: 'Checklist', icon: <Check className="w-4 h-4" /> },
    { id: 'scheduling', label: 'Scheduling', icon: <Calendar className="w-4 h-4" /> },
    { id: 'review', label: 'Review', icon: <Eye className="w-4 h-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const filteredTemplates = searchQuery
    ? COMMON_TEMPLATES.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : getTemplatesByDomain(domainSlug);

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 'details':
        if (!formData.name.trim()) {
          newErrors.name = 'Name is required';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        }
        if (
          formData.classification === 'statutory' &&
          !formData.statutory_reference?.trim()
        ) {
          newErrors.statutory_reference = 'Add the legal, regulatory, or approved strategy reference';
        }
        break;
      case 'requirements':
        if (formData.evidence_required.length === 0) {
          newErrors.evidence = 'Add at least one evidence requirement';
        }
        break;
      case 'checklist':
        if (formData.checklist_items.length === 0) {
          newErrors.checklist = 'Add at least one checklist item';
        }
        break;
      case 'scheduling':
        if (!formData.frequency) {
          newErrors.frequency = 'Frequency is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(steps[prevIndex].id);
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = COMMON_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        clone_from: `builtin_${templateId}`,
        name: template.name,
        description: template.description,
        compliance_domain: template.compliance_domain,
        classification: 'non_statutory',
        statutory_reference: '',
        estimated_duration: template.estimated_duration,
        requires_qualification: template.requires_qualification,
        evidence_required: [...template.evidence_required],
        checklist_items: template.checklist_items ? [...template.checklist_items] : [],
        frequency: template.frequency as RecurrencePattern,
        tags: [...template.tags],
        notes: template.notes,
      });
      setCurrentStep('details');
    }
  };

  const handleStartFromScratch = () => {
    setFormData({
      ...initialFormData,
      compliance_domain: domainSlug || 'security',
    });
    setCurrentStep('details');
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    if (!organizationId) {
      setErrors({ submit: 'Please sign in before creating a check.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/estates/checks/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          frequency_locked: formData.classification === 'statutory',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create custom check');
      }

      const result = await response.json();
      router.push(`/estates-compliance/${domainSlug}?success=check-created`);
    } catch (error) {
      console.error('Error creating custom check:', error);
      setErrors({ submit: 'Failed to create custom check. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addListItem = (field: 'evidence_required' | 'checklist_items' | 'tags', value: string) => {
    if (value.trim()) {
      setFormData({
        ...formData,
        [field]: [...formData[field], value.trim()],
      });
    }
  };

  const removeListItem = (field: 'evidence_required' | 'checklist_items' | 'tags', index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose a Starting Point</h2>
              <p className="text-muted-foreground">
                Start with a template or create your check from scratch
              </p>
            </div>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 rounded-md border bg-background px-3 py-2"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No templates found. Try a different search or start from scratch.
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    className="text-left p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{DOMAIN_METADATA[template.compliance_domain]?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            {template.frequency}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            {template.estimated_duration}m
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleStartFromScratch}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border bg-background hover:bg-accent"
              >
                <Sparkles className="w-4 h-4" />
                Start from Scratch
              </button>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Check Details</h2>
              <p className="text-muted-foreground">
                Basic information about your custom check
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Check Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2"
                  placeholder="e.g., Daily Gate Lock Check"
                />
                {errors.name && <p className="text-sm text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2"
                  placeholder="Describe what this check involves..."
                />
                {errors.description && <p className="text-sm text-rose-600 mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Compliance Domain</label>
                <select
                  value={formData.compliance_domain}
                  onChange={(e) => setFormData({ ...formData, compliance_domain: e.target.value as ComplianceDomain })}
                  className="w-full rounded-md border bg-background px-3 py-2"
                >
                  {Object.entries(DOMAIN_METADATA).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.icon} {meta.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Check Type</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer gap-3 rounded-lg border bg-card p-3 hover:bg-accent">
                    <input
                      type="radio"
                      name="classification"
                      value="non_statutory"
                      checked={formData.classification === 'non_statutory'}
                      onChange={() => setFormData({ ...formData, classification: 'non_statutory', statutory_reference: '' })}
                      className="mt-1 h-4 w-4"
                    />
                    <div>
                      <p className="text-sm font-semibold">School check / non-statutory</p>
                      <p className="text-xs text-muted-foreground">
                        A local routine or good-practice inspection where the school controls the frequency.
                      </p>
                    </div>
                  </label>
                  <label className="flex cursor-pointer gap-3 rounded-lg border bg-card p-3 hover:bg-accent">
                    <input
                      type="radio"
                      name="classification"
                      value="statutory"
                      checked={formData.classification === 'statutory'}
                      onChange={() => setFormData({ ...formData, classification: 'statutory' })}
                      className="mt-1 h-4 w-4"
                    />
                    <div>
                      <p className="text-sm font-semibold">Statutory / regulated</p>
                      <p className="text-xs text-muted-foreground">
                        Use only where the requirement comes from law, regulation, or an approved Schoolgle strategy. Frequency is locked once created.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {formData.classification === 'statutory' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Statutory Reference</label>
                  <input
                    type="text"
                    value={formData.statutory_reference || ''}
                    onChange={(e) => setFormData({ ...formData, statutory_reference: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2"
                    placeholder="e.g., HSE L8, Fire Safety Order, trust policy reference"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    This makes clear why the check is treated as mandatory.
                  </p>
                  {errors.statutory_reference && (
                    <p className="text-sm text-rose-600 mt-1">{errors.statutory_reference}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'requirements':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Requirements</h2>
              <p className="text-muted-foreground">
                What's needed to complete this check
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Estimated Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.estimated_duration || ''}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full rounded-md border bg-background px-3 py-2"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Required Qualification</label>
                <input
                  type="text"
                  value={formData.requires_qualification || ''}
                  onChange={(e) => setFormData({ ...formData, requires_qualification: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2"
                  placeholder="e.g., Gas Safe registered, First Aid trained"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Evidence Required *</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="new-evidence"
                    className="flex-1 rounded-md border bg-background px-3 py-2"
                    placeholder="e.g., Photo of completed check"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        addListItem('evidence_required', input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-evidence') as HTMLInputElement;
                      addListItem('evidence_required', input.value);
                      input.value = '';
                    }}
                    className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.evidence_required.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeListItem('evidence_required', index)}
                        className="text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {errors.evidence && <p className="text-sm text-rose-600 mt-1">{errors.evidence}</p>}
              </div>
            </div>
          </div>
        );

      case 'checklist':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Checklist Items</h2>
              <p className="text-muted-foreground">
                Define the specific items to check
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Add Checklist Item</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="new-checklist"
                    className="flex-1 rounded-md border bg-background px-3 py-2"
                    placeholder="e.g., Main gate is locked"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        addListItem('checklist_items', input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-checklist') as HTMLInputElement;
                      addListItem('checklist_items', input.value);
                      input.value = '';
                    }}
                    className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.checklist_items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted">
                      <span className="flex-1 text-sm">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeListItem('checklist_items', index)}
                        className="text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {errors.checklist && <p className="text-sm text-rose-600 mt-1">{errors.checklist}</p>}
              </div>
            </div>
          </div>
        );

      case 'scheduling':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Scheduling & Sharing</h2>
              <p className="text-muted-foreground">
                Set frequency and visibility options
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Frequency *</label>
                {formData.classification === 'statutory' && (
                  <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    Statutory frequencies should come from the regulation, approved strategy, or Schoolgle-managed check library. This frequency will be locked when saved.
                  </div>
                )}
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurrencePattern })}
                  className="w-full rounded-md border bg-background px-3 py-2"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="termly">Termly</option>
                  <option value="annually">Annually</option>
                  <option value="ad_hoc">Ad-hoc / One-time</option>
                </select>
                {errors.frequency && <p className="text-sm text-rose-600 mt-1">{errors.frequency}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Visibility</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-3 rounded-md border bg-card cursor-pointer hover:bg-accent">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={formData.visibility === 'private'}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value as CheckVisibility })}
                      className="w-4 h-4"
                    />
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Private</p>
                      <p className="text-xs text-muted-foreground">Only visible to your school</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-md border bg-card cursor-pointer hover:bg-accent">
                    <input
                      type="radio"
                      name="visibility"
                      value="organization"
                      checked={formData.visibility === 'organization'}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value as CheckVisibility })}
                      className="w-4 h-4"
                    />
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Organization</p>
                      <p className="text-xs text-muted-foreground">Share across your organization (multi-academy trust)</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-md border bg-card cursor-pointer hover:bg-accent">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={formData.visibility === 'public'}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value as CheckVisibility })}
                      className="w-4 h-4"
                    />
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Public</p>
                      <p className="text-xs text-muted-foreground">Share with all schools (coming soon)</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="new-tag"
                    className="flex-1 rounded-md border bg-background px-3 py-2"
                    placeholder="e.g., safety, daily"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        addListItem('tags', input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-tag') as HTMLInputElement;
                      addListItem('tags', input.value);
                      input.value = '';
                    }}
                    className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-sm">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeListItem('tags', index)}
                        className="text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2"
                  placeholder="Any additional notes or instructions..."
                />
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Review & Create</h2>
              <p className="text-muted-foreground">
                Review your custom check before creating
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold">{formData.name}</h3>
                <p className="text-muted-foreground">{formData.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-full bg-muted text-sm">
                  {DOMAIN_METADATA[formData.compliance_domain]?.icon} {DOMAIN_METADATA[formData.compliance_domain]?.name}
                </span>
                <span className="px-2 py-1 rounded-full bg-muted text-sm">
                  <Clock className="w-3 h-3 inline" /> {formData.frequency}
                </span>
                <span className="px-2 py-1 rounded-full bg-muted text-sm">
                  {formData.classification === 'statutory' ? 'Statutory / frequency locked' : 'Non-statutory'}
                </span>
                {formData.estimated_duration && (
                  <span className="px-2 py-1 rounded-full bg-muted text-sm">
                    {formData.estimated_duration} minutes
                  </span>
                )}
                <span className="px-2 py-1 rounded-full bg-muted text-sm">
                  {formData.visibility === 'private' ? <EyeOff className="w-3 h-3 inline" /> : <Eye className="w-3 h-3 inline" />}
                  {' '}{formData.visibility}
                </span>
              </div>

              {formData.requires_qualification && (
                <div>
                  <p className="text-sm font-medium">Required Qualification:</p>
                  <p className="text-sm text-muted-foreground">{formData.requires_qualification}</p>
                </div>
              )}

              {formData.evidence_required.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Evidence Required:</p>
                  <ul className="space-y-1">
                    {formData.evidence_required.map((item, index) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <Check className="w-3 h-3 text-emerald-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {formData.checklist_items.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Checklist ({formData.checklist_items.length} items):</p>
                  <ol className="space-y-1">
                    {formData.checklist_items.map((item, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground">{index + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {formData.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Tags:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-0.5 rounded-full bg-muted text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.notes && (
                <div>
                  <p className="text-sm font-medium">Notes:</p>
                  <p className="text-sm text-muted-foreground">{formData.notes}</p>
                </div>
              )}
            </div>

            {errors.submit && (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
                <p className="text-sm text-rose-600">{errors.submit}</p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/estates-compliance/${domainSlug}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Back to {DOMAIN_METADATA[domainSlug]?.name || 'Compliance'}
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Custom Check</h1>
        <p className="text-muted-foreground">Build your own compliance check tailored to your school's needs</p>
      </div>

      {/* Step Progress */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => {
                  // Only allow going back to already completed steps or next step
                  if (index <= currentStepIndex || (index === currentStepIndex + 1 && validateStep(currentStep))) {
                    setCurrentStep(step.id);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : index < currentStepIndex
                    ? 'bg-muted hover:bg-accent'
                    : 'text-muted-foreground'
                }`}
              >
                {step.icon}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-lg border bg-card p-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 'template' || currentStep === 'details'}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex gap-2">
          {currentStep !== 'review' ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {currentStep === 'template' ? 'Skip Templates' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Creating...' : 'Create Custom Check'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
