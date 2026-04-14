"use client";

import React, { useRef } from "react";

const THEMES = [
  { id: "none", emoji: "📚", name: "Standard", hook: "Curriculum-focused, no theme" },
  { id: "football", emoji: "⚽", name: "Football", hook: "Goals, pitches, leagues & stats" },
  { id: "space", emoji: "🚀", name: "Space", hook: "Planets, rockets & astronauts" },
  { id: "baking", emoji: "🧁", name: "Baking", hook: "Recipes, ingredients & measurements" },
  { id: "ocean", emoji: "🌊", name: "Ocean", hook: "Sea creatures, waves & coral" },
  { id: "dinosaurs", emoji: "🦕", name: "Dinosaurs", hook: "Fossils, eras & giant creatures" },
  { id: "minecraft", emoji: "⛏️", name: "Minecraft", hook: "Blocks, crafting & building" },
  { id: "animals", emoji: "🐾", name: "Animals", hook: "Habitats, species & nature" },
  { id: "superheroes", emoji: "🦸", name: "Superheroes", hook: "Powers, missions & teamwork" },
  { id: "music", emoji: "🎵", name: "Music", hook: "Rhythm, instruments & songs" },
  { id: "art", emoji: "🎨", name: "Art", hook: "Colours, shapes & creativity" },
  { id: "travel", emoji: "✈️", name: "Travel", hook: "Countries, maps & cultures" },
  { id: "garden", emoji: "🌱", name: "Garden", hook: "Plants, seasons & growing" },
  { id: "sports", emoji: "🏅", name: "Sports", hook: "Olympics, records & fitness" },
  { id: "fairytale", emoji: "🏰", name: "Fairy Tales", hook: "Once upon a time..." },
  { id: "cooking", emoji: "👨‍🍳", name: "Cooking", hook: "Kitchen maths & world food" },
];

interface ThemeCarouselProps {
  selectedTheme: string;
  onSelect: (themeId: string) => void;
}

export function ThemeCarousel({ selectedTheme, onSelect }: ThemeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Lesson Theme
        </span>
        <span className="text-[10px] text-slate-400 font-normal normal-case tracking-normal">
          (optional)
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {THEMES.map((theme) => {
          const isSelected = selectedTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              style={{ scrollSnapAlign: "start" }}
              className={`
                flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-center transition-all
                w-[88px] min-w-[88px]
                ${isSelected
                  ? "border-teal-400 bg-teal-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50"
                }
              `}
            >
              <span className="text-2xl leading-none">{theme.emoji}</span>
              <span
                className={`text-[11px] font-semibold leading-tight ${
                  isSelected ? "text-teal-700" : "text-slate-700"
                }`}
              >
                {theme.name}
              </span>
              <span className="text-[9px] text-slate-400 leading-tight line-clamp-2 text-center">
                {theme.hook}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hide scrollbar for WebKit */}
      <style>{`
        div[style*="scrollbarWidth"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
