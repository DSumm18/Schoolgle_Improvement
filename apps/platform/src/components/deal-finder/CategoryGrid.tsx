"use client";

import { 
  PenTool, 
  Sparkles, 
  Monitor,
  Sofa, 
  Utensils, 
  BookOpen, 
  Palmtree, 
  Wrench,
  ArrowRight,
} from "lucide-react";

interface CategoryGridProps {
  onCategorySelect: (categoryName: string) => void;
}

const CATEGORIES = [
  {
    name: "Stationery",
    description: "Exercise books, pens, glue, paper",
    status: "Seed suppliers mapped",
    icon: PenTool,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    name: "Cleaning",
    description: "Washroom, paper, wipes, COSHH",
    status: "Bulk suppliers mapped",
    icon: Sparkles,
    color: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
  },
  {
    name: "IT Equipment",
    description: "Chromebooks, cables, headphones",
    status: "Computing targets mapped",
    icon: Monitor,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    name: "Furniture",
    description: "Chairs, desks, storage, carpets",
    status: "Supplier list ready",
    icon: Sofa,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    name: "Catering",
    description: "Kitchen, disposables, food prep",
    status: "Coming next",
    icon: Utensils,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    name: "Educational",
    description: "Books, curriculum, SEND, EYFS",
    status: "Supplier list ready",
    icon: BookOpen,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    name: "Playground",
    description: "Outdoor learning and PE equipment",
    status: "Nice-to-have",
    icon: Palmtree,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-100",
  },
  {
    name: "Maintenance",
    description: "Tools, safety, repairs, estates",
    status: "Nice-to-have",
    icon: Wrench,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
];

export function CategoryGrid({ onCategorySelect }: CategoryGridProps) {
  return (
    <div className="mt-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-5 text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">
          Start with the regular school baskets
        </p>
        <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          Browse the categories schools buy every week
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          These category buttons use the community database today and give us
          the cleanest route to supplier-specific searches next.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => onCategorySelect(cat.name)}
            className={`group rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${cat.border}`}
          >
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 ${cat.bg}`}>
              <cat.icon className={`h-5 w-5 ${cat.color}`} />
            </div>
            <span className="text-base font-black text-slate-950">
              {cat.name}
            </span>
            <p className="mt-1 text-sm leading-5 text-slate-600">{cat.description}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                {cat.status}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-700" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
