"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  Palette,
  Layout,
  Type,
  Image as ImageIcon,
  Eye,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import type {
  SetupStep,
  SetupWizardState,
  ExtractedColour,
  PaletteOption,
  StylePreset,
  FontPairing,
  HeroMaskId,
} from "@/lib/website-builder/types";
import {
  extractColoursFromLogo,
  generatePaletteOptions,
  getAllPresets,
  getPresetsForPhase,
  getAllFontPairings,
  HERO_MASKS,
} from "@/lib/website-builder";

// ------------------------------------------------------------
// Step definitions
// ------------------------------------------------------------

const STEPS: Array<{
  id: SetupStep;
  label: string;
  icon: typeof Upload;
  description: string;
}> = [
  { id: "upload_logo", label: "Logo", icon: Upload, description: "Upload your school logo" },
  { id: "choose_palette", label: "Colours", icon: Palette, description: "Choose your colour palette" },
  { id: "choose_preset", label: "Style", icon: Layout, description: "Pick a design style" },
  { id: "choose_font", label: "Fonts", icon: Type, description: "Select your font pairing" },
  { id: "choose_hero", label: "Hero", icon: ImageIcon, description: "Set up your hero section" },
  { id: "preview", label: "Preview", icon: Eye, description: "Review your website design" },
];

// ------------------------------------------------------------
// Props
// ------------------------------------------------------------

interface SetupWizardProps {
  schoolName: string;
  schoolPhase: "primary" | "secondary" | "all_through";
  onComplete: (config: {
    logoUrl: string | null;
    palette: PaletteOption["palette"];
    presetId: string;
    fontPairingId: string;
    heroMaskId: HeroMaskId;
    heroImageUrl: string | null;
    motto: string;
  }) => void;
  onCancel?: () => void;
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function SetupWizard({ schoolName, schoolPhase, onComplete, onCancel }: SetupWizardProps) {
  const [state, setState] = useState<SetupWizardState>({
    currentStep: "upload_logo",
    logoFile: null,
    logoPreviewUrl: null,
    extractedColours: [],
    paletteOptions: [],
    selectedPaletteIndex: null,
    selectedPresetId: null,
    selectedFontPairingId: null,
    selectedHeroMaskId: null,
    heroFile: null,
    heroPreviewUrl: null,
    motto: "",
    isPreviewLive: true,
  });

  const [isExtracting, setIsExtracting] = useState(false);

  const currentStepIndex = STEPS.findIndex((s) => s.id === state.currentStep);

  // --- Logo upload & colour extraction ---
  const handleLogoUpload = useCallback(async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setState((prev) => ({ ...prev, logoFile: file, logoPreviewUrl: previewUrl }));

    setIsExtracting(true);
    try {
      const colours = await extractColoursFromLogo(file);
      const palettes = generatePaletteOptions(colours);
      setState((prev) => ({
        ...prev,
        extractedColours: colours,
        paletteOptions: palettes,
        selectedPaletteIndex: 0,
      }));
    } catch (err) {
      console.error("Colour extraction failed:", err);
    } finally {
      setIsExtracting(false);
    }
  }, []);

  // --- Navigation ---
  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setState((prev) => ({ ...prev, currentStep: STEPS[nextIndex].id }));
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setState((prev) => ({ ...prev, currentStep: STEPS[prevIndex].id }));
    }
  };

  const handleComplete = () => {
    const selectedPalette = state.selectedPaletteIndex !== null
      ? state.paletteOptions[state.selectedPaletteIndex]?.palette
      : state.paletteOptions[0]?.palette;

    onComplete({
      logoUrl: state.logoPreviewUrl,
      palette: selectedPalette || ({} as PaletteOption["palette"]),
      presetId: state.selectedPresetId || "friendly",
      fontPairingId: state.selectedFontPairingId || "nunito",
      heroMaskId: (state.selectedHeroMaskId || "wave_bottom") as HeroMaskId,
      heroImageUrl: state.heroPreviewUrl,
      motto: state.motto,
    });
  };

  // --- Render steps ---
  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8 px-4">
        {STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isActive = i === currentStepIndex;
          const isDone = i < currentStepIndex;
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    isDone
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-fuchsia-500 text-white ring-4 ring-fuchsia-100"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-1 ${isActive ? "text-fuchsia-600 font-medium" : "text-gray-400"}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 mx-1 mt-[-1rem] ${i < currentStepIndex ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 min-h-[400px]">
        <h2 className="text-xl font-bold mb-1">{STEPS[currentStepIndex].description}</h2>
        <p className="text-gray-500 text-sm mb-6">Step {currentStepIndex + 1} of {STEPS.length}</p>

        {state.currentStep === "upload_logo" && (
          <StepUploadLogo
            logoPreviewUrl={state.logoPreviewUrl}
            extractedColours={state.extractedColours}
            isExtracting={isExtracting}
            onUpload={handleLogoUpload}
          />
        )}

        {state.currentStep === "choose_palette" && (
          <StepChoosePalette
            paletteOptions={state.paletteOptions}
            selectedIndex={state.selectedPaletteIndex}
            onSelect={(i) => setState((prev) => ({ ...prev, selectedPaletteIndex: i }))}
          />
        )}

        {state.currentStep === "choose_preset" && (
          <StepChoosePreset
            phase={schoolPhase}
            selectedId={state.selectedPresetId}
            onSelect={(id) => setState((prev) => ({ ...prev, selectedPresetId: id }))}
          />
        )}

        {state.currentStep === "choose_font" && (
          <StepChooseFont
            selectedId={state.selectedFontPairingId}
            onSelect={(id) => setState((prev) => ({ ...prev, selectedFontPairingId: id }))}
          />
        )}

        {state.currentStep === "choose_hero" && (
          <StepChooseHero
            heroPreviewUrl={state.heroPreviewUrl}
            selectedMaskId={state.selectedHeroMaskId}
            motto={state.motto}
            onHeroUpload={(file) => {
              const url = URL.createObjectURL(file);
              setState((prev) => ({ ...prev, heroFile: file, heroPreviewUrl: url }));
            }}
            onMaskSelect={(id) => setState((prev) => ({ ...prev, selectedHeroMaskId: id }))}
            onMottoChange={(motto) => setState((prev) => ({ ...prev, motto }))}
            schoolName={schoolName}
          />
        )}

        {state.currentStep === "preview" && (
          <StepPreview
            state={state}
            schoolName={schoolName}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={currentStepIndex === 0 ? onCancel : goBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {currentStepIndex === 0 ? "Cancel" : "Back"}
        </button>
        {state.currentStep === "preview" ? (
          <button
            onClick={handleComplete}
            className="flex items-center gap-2 px-6 py-2.5 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 transition-colors font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Create My Website
          </button>
        ) : (
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 transition-colors font-medium"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Step sub-components
// ============================================================

function StepUploadLogo({
  logoPreviewUrl,
  extractedColours,
  isExtracting,
  onUpload,
}: {
  logoPreviewUrl: string | null;
  extractedColours: ExtractedColour[];
  isExtracting: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-fuchsia-400 transition-colors cursor-pointer"
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-fuchsia-400", "bg-fuchsia-50"); }}
        onDragLeave={(e) => { e.currentTarget.classList.remove("border-fuchsia-400", "bg-fuchsia-50"); }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("border-fuchsia-400", "bg-fuchsia-50");
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith("image/")) onUpload(file);
        }}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) onUpload(file);
          };
          input.click();
        }}
      >
        {logoPreviewUrl ? (
          <div className="flex flex-col items-center gap-4">
            <img src={logoPreviewUrl} alt="Logo preview" className="max-h-32 object-contain" />
            <p className="text-sm text-gray-500">Click or drag to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-gray-400" />
            <p className="font-medium text-gray-700">Drop your school logo here</p>
            <p className="text-sm text-gray-500">PNG, JPG, or SVG — we&apos;ll extract your brand colours automatically</p>
          </div>
        )}
      </div>

      {isExtracting && (
        <div className="flex items-center gap-3 text-fuchsia-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Extracting brand colours from your logo...</span>
        </div>
      )}

      {extractedColours.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-700 mb-3">Extracted colours</h3>
          <div className="flex gap-3 flex-wrap">
            {extractedColours.map((colour, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <div
                  className="w-8 h-8 rounded-lg border border-gray-200"
                  style={{ backgroundColor: colour.hex }}
                />
                <div>
                  <div className="text-sm font-medium">{colour.name}</div>
                  <div className="text-xs text-gray-400">{colour.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepChoosePalette({
  paletteOptions,
  selectedIndex,
  onSelect,
}: {
  paletteOptions: PaletteOption[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}) {
  if (paletteOptions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Palette className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Upload your logo first to generate palette options</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {paletteOptions.map((option, i) => (
        <button
          key={option.palette.id}
          onClick={() => onSelect(i)}
          className={`text-left p-4 rounded-xl border-2 transition-all ${
            selectedIndex === i
              ? "border-fuchsia-500 bg-fuchsia-50 ring-2 ring-fuchsia-200"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="font-medium mb-1">{option.palette.name}</div>
          <p className="text-sm text-gray-500 mb-3">{option.palette.description}</p>
          <div className="flex gap-1">
            {[
              option.palette.primary[500],
              option.palette.primary[300],
              option.palette.secondary[500],
              option.palette.secondary[300],
              option.palette.accent,
              option.palette.neutral[500],
            ].map((hex, j) => (
              <div
                key={j}
                className="w-8 h-8 rounded-md first:rounded-l-lg last:rounded-r-lg"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

function StepChoosePreset({
  phase,
  selectedId,
  onSelect,
}: {
  phase: "primary" | "secondary" | "all_through";
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const presets = getPresetsForPhase(phase);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelect(preset.id)}
          className={`text-left p-4 rounded-xl border-2 transition-all ${
            selectedId === preset.id
              ? "border-fuchsia-500 bg-fuchsia-50 ring-2 ring-fuchsia-200"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{preset.name}</span>
            {preset.phase !== "any" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{preset.phase}</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-3">{preset.description}</p>
          <div className="flex gap-2 text-xs text-gray-400">
            <span>Nav: {preset.layout.navStyle.replace("_", " ")}</span>
            <span>·</span>
            <span>Cards: {preset.shape.cardStyle}</span>
            <span>·</span>
            <span>Motion: {preset.motion.level}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function StepChooseFont({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const pairings = getAllFontPairings();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {pairings.map((pairing) => (
        <button
          key={pairing.id}
          onClick={() => onSelect(pairing.id)}
          className={`text-left p-4 rounded-xl border-2 transition-all ${
            selectedId === pairing.id
              ? "border-fuchsia-500 bg-fuchsia-50 ring-2 ring-fuchsia-200"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="font-medium mb-1">{pairing.name}</div>
          <p className="text-sm text-gray-500 mb-3">{pairing.description}</p>
          <div className="space-y-1">
            <div className="text-lg font-bold" style={{ fontFamily: `'${pairing.heading.name}', sans-serif` }}>
              {pairing.heading.name}
            </div>
            <div className="text-sm text-gray-600" style={{ fontFamily: `'${pairing.body.name}', sans-serif` }}>
              Body text in {pairing.body.name} — The quick brown fox jumps over the lazy dog.
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function StepChooseHero({
  heroPreviewUrl,
  selectedMaskId,
  motto,
  onHeroUpload,
  onMaskSelect,
  onMottoChange,
  schoolName,
}: {
  heroPreviewUrl: string | null;
  selectedMaskId: HeroMaskId | null;
  motto: string;
  onHeroUpload: (file: File) => void;
  onMaskSelect: (id: HeroMaskId) => void;
  onMottoChange: (motto: string) => void;
  schoolName: string;
}) {
  const masks = Object.values(HERO_MASKS);

  return (
    <div className="space-y-6">
      {/* Motto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">School motto or tagline</label>
        <input
          type="text"
          value={motto}
          onChange={(e) => onMottoChange(e.target.value)}
          placeholder="e.g. &quot;Learning together, growing together&quot;"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400 outline-none"
        />
      </div>

      {/* Hero image upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Hero image</label>
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-fuchsia-400 transition-colors"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) onHeroUpload(file);
            };
            input.click();
          }}
        >
          {heroPreviewUrl ? (
            <img src={heroPreviewUrl} alt="Hero preview" className="max-h-40 mx-auto rounded-lg" />
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Upload a hero photo of your school</p>
            </>
          )}
        </div>
      </div>

      {/* Mask selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Hero shape</label>
        <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
          {masks.slice(0, 10).map((mask) => (
            <button
              key={mask.id}
              onClick={() => onMaskSelect(mask.id)}
              className={`aspect-video rounded-lg border-2 flex items-center justify-center text-xs text-gray-500 transition-all ${
                selectedMaskId === mask.id
                  ? "border-fuchsia-500 bg-fuchsia-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              title={mask.name}
            >
              <span className="truncate px-1">{mask.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepPreview({
  state,
  schoolName,
}: {
  state: SetupWizardState;
  schoolName: string;
}) {
  const palette = state.selectedPaletteIndex !== null
    ? state.paletteOptions[state.selectedPaletteIndex]?.palette
    : null;
  const primaryColour = palette?.primary?.[500] || "#6366f1";

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-xl overflow-hidden">
        {/* Mini preview */}
        <div className="relative" style={{ minHeight: 200, background: primaryColour }}>
          {state.heroPreviewUrl && (
            <img
              src={state.heroPreviewUrl}
              alt="Hero"
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          )}
          <div className="relative z-10 flex flex-col items-center justify-center text-white p-8 text-center">
            {state.logoPreviewUrl && (
              <img src={state.logoPreviewUrl} alt="Logo" className="h-16 mb-3" />
            )}
            <h2 className="text-2xl font-bold">{schoolName}</h2>
            {state.motto && <p className="text-sm opacity-80 mt-1">{state.motto}</p>}
          </div>
        </div>

        {/* Summary */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Style:</span>{" "}
              <span className="font-medium capitalize">{state.selectedPresetId || "Friendly"}</span>
            </div>
            <div>
              <span className="text-gray-500">Fonts:</span>{" "}
              <span className="font-medium capitalize">{state.selectedFontPairingId || "Nunito"}</span>
            </div>
            <div>
              <span className="text-gray-500">Hero shape:</span>{" "}
              <span className="font-medium capitalize">{(state.selectedHeroMaskId || "wave_bottom").replace(/_/g, " ")}</span>
            </div>
            <div>
              <span className="text-gray-500">Colours:</span>{" "}
              <span className="font-medium">{palette?.name || "Default"}</span>
            </div>
          </div>

          {palette && (
            <div className="flex gap-1 mt-3">
              {[palette.primary[500], palette.secondary[500], palette.accent, palette.neutral[500]].map((hex, i) => (
                <div key={i} className="w-8 h-8 rounded-md" style={{ backgroundColor: hex }} />
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500 text-center">
        You can customise everything after setup — this is just the starting point.
      </p>
    </div>
  );
}
