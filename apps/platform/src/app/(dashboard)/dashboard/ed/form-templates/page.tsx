/**
 * Ed Form Templates Dashboard
 *
 * Manage pre-configured forms that Ed knows how to fill.
 * Schools can add their own templates, plus use public templates like RIDDOR.
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';

interface FormTemplate {
  id: string;
  form_key: string;
  form_name: string;
  form_category: string;
  description: string;
  url_pattern: string;
  estimated_time_minutes: number;
  help_text: string;
  is_public: boolean;
}

interface TemplateGroup {
  category: string;
  templates: FormTemplate[];
}

export default function EdFormTemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<TemplateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .get('ed/form-templates')
      .getJSON<{ templates: { public: FormTemplate[], school: FormTemplate[] } }>();

    if (data?.templates) {
      const all = [...data.templates.public, ...data.templates.school];
      const grouped = groupByCategory(all);
      setTemplates(grouped);
    }
    setLoading(false);
  };

  const groupByCategory = (templates: FormTemplate[]): TemplateGroup[] => {
    const groups: Record<string, FormTemplate[]> = {};
    templates.forEach(t => {
      if (!groups[t.form_category]) {
        groups[t.form_category] = [];
      }
      groups[t.form_category].push(t);
    });
    return Object.entries(groups).map(([category, templates]) => ({
      category,
      templates,
    }));
  };

  const categoryIcons: Record<string, string> = {
    hse: '⚠️',
    safeguarding: '🛡️',
    admissions: '📚',
    compliance: '✅',
    other: '📋',
  };

  const categoryNames: Record<string, string> = {
    hse: 'Health & Safety Executive (HSE)',
    safeguarding: 'Safeguarding',
    admissions: 'Admissions',
    compliance: 'Compliance',
    other: 'Other Forms',
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ed Form Templates</h1>
          <p className="text-gray-600 mt-1">
            Pre-configured forms that Ed knows how to fill
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          + Add Custom Template
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {templates.map((group) => (
            <div key={group.category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                <span className="text-2xl">{categoryIcons[group.category] || '📋'}</span>
                <h2 className="text-xl font-semibold text-gray-900">
                  {categoryNames[group.category] || group.category}
                </h2>
                <span className="ml-auto text-sm text-gray-500">
                  {group.templates.length} template{group.templates.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {group.templates.map((template) => (
                  <div key={template.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {template.form_name}
                          </h3>
                          {template.is_public && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Public
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{template.description}</p>
                        {template.help_text && (
                          <p className="text-sm text-gray-500 mt-2">{template.help_text}</p>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          <span>🔗 {template.url_pattern}</span>
                          {template.estimated_time_minutes && (
                            <span>⏱️ ~{template.estimated_time_minutes} minutes</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                          View
                        </button>
                        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddTemplateModal
          onClose={() => setShowAddModal(false)}
          onSave={loadTemplates}
        />
      )}
    </div>
  );
}

function AddTemplateModal({ onClose, onSave }: { onClose: () => void, onSave: () => void }) {
  const [formKey, setFormKey] = useState('');
  const [formName, setFormName] = useState('');
  const [category, setCategory] = useState('other');
  const [urlPattern, setUrlPattern] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Save template...
    await fetch('/api/ed/form-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_key: formKey,
        form_name: formName,
        form_category: category,
        url_pattern: urlPattern,
        form_structure: { fields: [] },
        description,
      }),
    });
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Add Custom Form Template</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Form Key
            </label>
            <input
              type="text"
              value={formKey}
              onChange={(e) => setFormKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., school_absence_report"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Form Name
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., School Absence Report"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="safeguarding">Safeguarding</option>
              <option value="compliance">Compliance</option>
              <option value="hse">Health & Safety</option>
              <option value="admissions">Admissions</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Pattern
            </label>
            <input
              type="text"
              value={urlPattern}
              onChange={(e) => setUrlPattern(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., reports.hse.gov.uk or hse.gov.uk/riddor"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Ed will match forms containing this text in the URL
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="What is this form for?"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
