"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  File,
  X,
  Check,
  AlertCircle,
  Building2,
  Sparkles,
  Eye,
  Loader2,
  ChevronRight,
  Download,
  Wand2,
} from "lucide-react";
import { Building3DViewer, Building3DData } from "@/components/estates-compliance/building-3d-viewer";

// ─── Types ─────────────────────────────────────────────────────────────────

interface UploadStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  error?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  buildingData?: Building3DData;
}

// ─── Demo Data for Preview ─────────────────────────────────────────────────

const DEMO_BUILDING_DATA: Building3DData = {
  id: "demo-building",
  name: "Grove House School",
  buildings: [
    {
      id: "building-2001",
      name: "2001 Building",
      position: [-15, 0, 0],
      floors: [
        {
          id: "ground-2001",
          label: "Ground Floor",
          level: 0,
          height: 3.5,
          rooms: [
            {
              id: "rm-hall-2001",
              name: "Main Hall",
              type: "hall",
              position: [-8, 0, -3],
              size: [8, 2.8, 10],
              color: "#fed7aa",
              hasFireExit: true,
              assets: [
                {
                  id: "ext-1",
                  type: "fire_extinguisher",
                  position: [3, 0, 4],
                  status: "ok",
                  label: "FE-001",
                },
              ],
            },
            {
              id: "rm-class-1",
              name: "Classroom 1A",
              type: "classroom",
              position: [-15, 0, 3],
              size: [6, 2.8, 5],
              color: "#bfdbfe",
            },
            {
              id: "rm-class-2",
              name: "Classroom 1B",
              type: "classroom",
              position: [-15, 0, -5],
              size: [6, 2.8, 5],
              color: "#bfdbfe",
            },
            {
              id: "rm-office",
              name: "School Office",
              type: "office",
              position: [-5, 0, 6],
              size: [4, 2.8, 4],
              color: "#ddd6fe",
            },
          ],
        },
      ],
    },
    {
      id: "building-2017",
      name: "2017 Extension",
      position: [8, 0, 0],
      floors: [
        {
          id: "ground-2017",
          label: "Ground Floor",
          level: 0,
          height: 3.5,
          rooms: [
            {
              id: "rm-library",
              name: "Library",
              type: "library",
              position: [5, 0, 3],
              size: [6, 2.8, 6],
              color: "#bbf7d0",
            },
            {
              id: "rm-ict",
              name: "ICT Suite",
              type: "ict_suite",
              position: [13, 0, 3],
              size: [6, 2.8, 6],
              color: "#99f6e4",
            },
            {
              id: "rm-kitchen",
              name: "Kitchen",
              type: "kitchen",
              position: [5, 0, -5],
              size: [5, 2.8, 4],
              color: "#fecaca",
              assets: [
                {
                  id: "boiler-1",
                  type: "boiler",
                  position: [2, 0, 1],
                  status: "ok",
                  label: "Main Boiler",
                },
              ],
            },
            {
              id: "rm-dining",
              name: "Dining Hall",
              type: "dining",
              position: [12, 0, -5],
              size: [7, 2.8, 4],
              color: "#fde68a",
            },
          ],
        },
      ],
    },
  ],
  groundPlane: { width: 60, depth: 40 },
};

// ─── File Upload Zone Component ─────────────────────────────────────────────

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  acceptedTypes: string[];
}

function FileUploadZone({
  onFileSelect,
  isUploading,
  acceptedTypes,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && acceptedTypes.includes(file.type)) {
        onFileSelect(file);
      }
    },
    [acceptedTypes, onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all
        ${
          isDragging
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-slate-300 hover:border-slate-400"
        }
        ${isUploading ? "pointer-events-none opacity-60" : "cursor-pointer"}
      `}
    >
      <input
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />

      <div className="flex flex-col items-center gap-3">
        {isUploading ? (
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        ) : (
          <>
            <div className="p-4 bg-blue-100 rounded-full">
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-slate-700">
                Drop your floor plan here
              </p>
              <p className="text-sm text-slate-500 mt-1">
                or click to browse • PDF, PNG, JPG
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <File className="w-3.5 h-3.5" />
              <span>Max 10MB • Auto-detects rooms using AI</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Upload Progress Item ───────────────────────────────────────────────────

interface UploadProgressItemProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
  onView?: (file: UploadedFile) => void;
}

function UploadProgressItem({ file, onRemove, onView }: UploadProgressItemProps) {
  const statusIcons = {
    uploading: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
    processing: <Wand2 className="w-4 h-4 text-purple-500 animate-pulse" />,
    complete: <Check className="w-4 h-4 text-green-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
  };

  const statusLabels = {
    uploading: "Uploading...",
    processing: "Detecting rooms...",
    complete: "Complete",
    error: "Failed",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200"
    >
      <div className="p-2 bg-slate-100 rounded-lg">
        <File className="w-5 h-5 text-slate-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {file.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {statusIcons[file.buildingData ? "complete" : "uploading"]}
          <span className="text-xs text-slate-500">
            {file.buildingData
              ? `${Math.round(file.size / 1024)}KB • Rooms detected`
              : `${Math.round(file.size / 1024)}KB`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {file.buildingData && onView && (
          <button
            onClick={() => onView(file)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="View 3D model"
          >
            <Eye className="w-4 h-4 text-blue-500" />
          </button>
        )}
        <button
          onClick={() => onRemove(file.id)}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove"
        >
          <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── 3D Preview Modal ───────────────────────────────────────────────────────

interface PreviewModalProps {
  buildingData: Building3DData | null;
  onClose: () => void;
}

function PreviewModal({ buildingData, onClose }: PreviewModalProps) {
  return (
    <AnimatePresence>
      {buildingData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl h-[600px] bg-white rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {buildingData.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Interactive 3D preview • Drag to rotate • Scroll to zoom
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* 3D Viewer */}
            <div className="h-[calc(100%-60px)]">
              <Building3DViewer data={buildingData} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Onboarding Component ──────────────────────────────────────────────

export default function BuildingOnboardingUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewBuilding, setPreviewBuilding] = useState<Building3DData | null>(null);
  const [currentStep, setCurrentStep] = useState<"upload" | "preview">("upload");

  const acceptedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
  ];

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setIsUploading(true);

    try {
      // Create a local URL for preview (in production, upload to storage)
      const url = URL.createObjectURL(file);

      // Simulate AI detection (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demo, use the demo data with the file's name
      const newFile: UploadedFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        url,
        size: file.size,
        type: file.type,
        buildingData: DEMO_BUILDING_DATA, // In production, this comes from the API
      };

      setUploadedFiles((prev) => [...prev, newFile]);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file removal
  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.url) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  // Handle preview
  const handleViewPreview = (file: UploadedFile) => {
    if (file.buildingData) {
      setPreviewBuilding(file.buildingData);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4"
        >
          <Building2 className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Upload Your School Floor Plan
        </h1>
        <p className="text-slate-600 max-w-lg mx-auto">
          Our AI will automatically detect rooms, corridors, and key features to
          create an interactive 3D model of your building
        </p>
      </div>

      {/* Upload Zone */}
      <div className="mb-6">
        <FileUploadZone
          onFileSelect={handleFileSelect}
          isUploading={isUploading}
          acceptedTypes={acceptedTypes}
        />
      </div>

      {/* Uploaded Files List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2 mb-6"
          >
            <h3 className="text-sm font-semibold text-slate-700">
              Detected Floor Plans
            </h3>
            {uploadedFiles.map((file) => (
              <UploadProgressItem
                key={file.id}
                file={file}
                onRemove={handleRemoveFile}
                onView={handleViewPreview}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Preview Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">See It In Action</h3>
            <p className="text-sm text-white/80 mb-3">
              Preview the stunning 3D visualization with interactive rooms,
              asset overlays, and animated evacuation routes
            </p>
            <button
              onClick={() => setPreviewBuilding(DEMO_BUILDING_DATA)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Demo
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 grid sm:grid-cols-3 gap-4"
      >
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Upload className="w-4 h-4 text-blue-600" />
            </div>
            <h4 className="font-medium text-slate-900">Any Format</h4>
          </div>
          <p className="text-xs text-slate-600">
            Upload PDF, PNG, or JPG floor plans. Works with CAD exports and
            scanned drawings.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Wand2 className="w-4 h-4 text-purple-600" />
            </div>
            <h4 className="font-medium text-slate-900">AI Detection</h4>
          </div>
          <p className="text-xs text-slate-600">
            Our AI automatically identifies rooms, corridors, and key features.
            Just review and confirm.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <Eye className="w-4 h-4 text-green-600" />
            </div>
            <h4 className="font-medium text-slate-900">Interactive 3D</h4>
          </div>
          <p className="text-xs text-slate-600">
            Explore your building in stunning 3D with overlays for fire
            safety, assets, and evacuation routes.
          </p>
        </div>
      </motion.div>

      {/* Preview Modal */}
      <PreviewModal
        buildingData={previewBuilding}
        onClose={() => setPreviewBuilding(null)}
      />
    </div>
  );
}
