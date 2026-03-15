"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Trophy,
  Users,
  AlertTriangle,
  CloudRain,
  Church,
  Star,
  Calendar,
  MapPin,
  BookOpen,
  UtensilsCrossed,
  Heart,
  Clipboard,
  Search,
} from "lucide-react";

interface NoticeTemplate {
  id: string;
  template_name: string;
  category: string;
  notice_type: string;
  title_template: string;
  body_template: string;
  default_audience: string;
  default_priority: string;
  default_display_style: string;
  default_show_on_display: boolean;
  default_show_on_dashboard: boolean;
  icon?: string;
  color?: string;
  usage_count: number;
}

const ICON_MAP: Record<string, typeof FileText> = {
  trophy: Trophy,
  users: Users,
  "alert-triangle": AlertTriangle,
  "cloud-rain": CloudRain,
  church: Church,
  star: Star,
  calendar: Calendar,
  "map-pin": MapPin,
  "book-open": BookOpen,
  utensils: UtensilsCrossed,
  heart: Heart,
  clipboard: Clipboard,
};

const COLOR_MAP: Record<string, string> = {
  amber: "bg-amber-100 text-amber-700",
  indigo: "bg-indigo-100 text-indigo-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  pink: "bg-pink-100 text-pink-700",
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
  slate: "bg-slate-100 text-slate-700",
  violet: "bg-violet-100 text-violet-700",
};

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "daily", label: "Daily" },
  { value: "events", label: "Events" },
  { value: "urgent", label: "Urgent" },
  { value: "term", label: "Term" },
  { value: "celebration", label: "Celebration" },
  { value: "staff", label: "Staff" },
  { value: "pta", label: "PTA" },
  { value: "custom", label: "Custom" },
];

interface NoticeTemplatesProps {
  onSelect: (template: NoticeTemplate) => void;
  onClose: () => void;
}

export function NoticeTemplates({ onSelect, onClose }: NoticeTemplatesProps) {
  const [templates, setTemplates] = useState<NoticeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/notices/templates")
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d.templates || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = templates.filter((t) => {
    if (category !== "all" && t.category !== category) return false;
    if (search && !t.template_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Notice Templates
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setCategory(value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  category === value
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading templates...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>No templates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((template) => {
                const Icon = ICON_MAP[template.icon || ""] || FileText;
                const colorClass = COLOR_MAP[template.color || ""] || "bg-gray-100 text-gray-700";
                return (
                  <button
                    key={template.id}
                    onClick={() => onSelect(template)}
                    className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 group-hover:text-indigo-700 transition">
                          {template.template_name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {template.title_template.replace(/\{\{.*?\}\}/g, "___")}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded capitalize">
                            {template.category}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded capitalize">
                            {template.default_audience.replace("_", " ")}
                          </span>
                          {template.usage_count > 0 && (
                            <span className="text-[10px] text-gray-400">
                              Used {template.usage_count}x
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
