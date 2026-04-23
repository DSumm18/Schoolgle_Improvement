"use client";

interface LayerTogglesProps {
  activeLayers: {
    rooms: boolean;
    fireEscape: boolean;
    fireEquipment: boolean;
    emergencyLighting: boolean;
    detectors: boolean;
  };
  onToggle: (layer: keyof typeof activeLayers) => void;
}

const LAYER_INFO = {
  rooms: { icon: "🏠", label: "Rooms", color: "bg-slate-100 hover:bg-slate-200" },
  fireEscape: { icon: "🚪", label: "Fire Escape", color: "bg-orange-100 hover:bg-orange-200" },
  fireEquipment: { icon: "🧯", label: "Fire Equipment", color: "bg-red-100 hover:bg-red-200" },
  emergencyLighting: { icon: "💡", label: "Emergency Lighting", color: "bg-yellow-100 hover:bg-yellow-200" },
  detectors: { icon: "🔍", label: "Detectors", color: "bg-blue-100 hover:bg-blue-200" },
};

export default function LayerToggles({ activeLayers, onToggle }: LayerTogglesProps) {
  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2">
      <div className="flex flex-col gap-1">
        {(Object.keys(LAYER_INFO) as Array<keyof typeof LAYER_INFO>).map((layer) => {
          const info = LAYER_INFO[layer];
          const isActive = activeLayers[layer];
          return (
            <button
              key={layer}
              onClick={() => onToggle(layer)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? info.color : "bg-gray-50 hover:bg-gray-100 text-gray-600"
              }`}
              title={isActive ? `Hide ${info.label}` : `Show ${info.label}`}
            >
              <span className="text-base">{info.icon}</span>
              <span>{info.label}</span>
              <span className={`ml-1 w-2 h-2 rounded-full ${
                isActive ? "bg-current" : "bg-gray-300"
              }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
