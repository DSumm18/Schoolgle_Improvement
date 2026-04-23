"use client";

import { 
  PenTool, 
  Sparkles, 
  Monitor, 
  Sofa, 
  Utensils, 
  BookOpen, 
  Palmtree, 
  Wrench 
} from "lucide-react";

interface CategoryGridProps {
  onCategorySelect: (categoryName: string) => void;
}

const CATEGORIES = [
  { name: "Stationery", icon: PenTool, color: "text-blue-500", bg: "bg-blue-500/10" },
  { name: "Cleaning", icon: Sparkles, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { name: "IT Equipment", icon: Monitor, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { name: "Furniture", icon: Sofa, color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "Catering", icon: Utensils, color: "text-red-500", bg: "bg-red-500/10" },
  { name: "Educational", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { name: "Playground", icon: Palmtree, color: "text-green-500", bg: "bg-green-500/10" },
  { name: "Maintenance", icon: Wrench, color: "text-gray-400", bg: "bg-gray-800" },
];

export function CategoryGrid({ onCategorySelect }: CategoryGridProps) {
  return (
    <div className="mt-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 text-center">
        Browse Popular Categories
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => onCategorySelect(cat.name)}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800 hover:border-gray-700 transition-all group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${cat.bg}`}>
              <cat.icon className={`w-5 h-5 ${cat.color}`} />
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
