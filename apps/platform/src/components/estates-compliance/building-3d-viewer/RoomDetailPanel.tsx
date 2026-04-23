"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Package,
  Flame,
  AlertTriangle,
  Users,
  Ruler,
  Lightbulb,
  Thermometer,
  Wrench,
  FileText,
  Image as ImageIcon,
  Video,
  ClipboardCheck,
  Heart,
  Navigation,
} from "lucide-react";
import { Room3D, AssetOverlay, EvacuationRoute3D } from "./Building3DViewer";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface RoomMedia {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  caption?: string;
  timestamp?: string;
}

export interface RoomAssetDetail extends AssetOverlay {
  name: string;
  lastInspected?: string;
  nextDue?: string;
  certificateUrl?: string;
  notes?: string;
}

export interface RoomIssue {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  assignedTo?: string;
}

interface RoomDetailPanelProps {
  room: Room3D;
  onClose: () => void;
  media?: RoomMedia[];
  assets?: RoomAssetDetail[];
  issues?: RoomIssue[];
  evacuationRoute?: EvacuationRoute3D;
  onEditAssets?: () => void;
  onReportIssue?: () => void;
}

// ─── Media Gallery Component ─────────────────────────────────────────────────

interface MediaGalleryProps {
  media: RoomMedia[];
  onClose?: () => void;
}

function MediaGallery({ media, onClose }: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentItem = media[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "Escape") onClose?.();
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, onClose]);

  // Auto-play videos when navigating
  useEffect(() => {
    if (currentItem?.type === "video" && videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isPlaying) videoRef.current.play();
    }
  }, [currentIndex, isPlaying]);

  const navigate = (direction: number) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < media.length) {
      setCurrentIndex(newIndex);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (currentItem.type === "video" && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black flex flex-col"
    >
      {/* Media Content */}
      <div className="flex-1 relative flex items-center justify-center">
        {currentItem.type === "image" ? (
          <img
            src={currentItem.url}
            alt={currentItem.caption || "Room view"}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            src={currentItem.url}
            className="max-w-full max-h-full object-contain"
            muted={isMuted}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={() => navigate(-1)}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => navigate(1)}
              disabled={currentIndex === media.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Video Controls */}
        {currentItem.type === "video" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-full px-4 py-2">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </div>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Caption and Counter */}
      <div className="bg-gradient-to-t from-black/80 to-transparent p-4">
        <p className="text-white text-sm mb-1">{currentItem.caption || ""}</p>
        {media.length > 1 && (
          <div className="flex items-center gap-2 text-white/70 text-xs">
            <span>
              {currentIndex + 1} of {media.length}
            </span>
            <div className="flex gap-1">
              {media.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === currentIndex ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Asset List Component ───────────────────────────────────────────────────

interface AssetListProps {
  assets: RoomAssetDetail[];
}

function AssetList({ assets }: AssetListProps) {
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  const getAssetIcon = (type: RoomAssetDetail["type"]) => {
    switch (type) {
      case "fire_extinguisher":
        return <Flame className="w-4 h-4 text-red-500" />;
      case "fire_alarm":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "first_aid_kit":
        return <Package className="w-4 h-4 text-green-500" />;
      case "defibrillator":
        return <Heart className="w-4 h-4 text-red-600" />;
      case "boiler":
        return <Thermometer className="w-4 h-4 text-orange-500" />;
      case "electrical_panel":
        return <Zap className="w-4 h-4 text-yellow-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: RoomAssetDetail["status"]) => {
    switch (status) {
      case "ok":
        return (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
            OK
          </span>
        );
      case "warning":
        return (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            Due Soon
          </span>
        );
      case "expired":
        return (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
            Overdue
          </span>
        );
    }
  };

  return (
    <div className="space-y-2">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="bg-slate-50 rounded-lg overflow-hidden"
        >
          <button
            onClick={() =>
              setExpandedAsset(expandedAsset === asset.id ? null : asset.id)
            }
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              {getAssetIcon(asset.type)}
              <span className="text-sm font-medium text-slate-700">
                {asset.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(asset.status)}
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  expandedAsset === asset.id ? "rotate-90" : ""
                }`}
              />
            </div>
          </button>

          {expandedAsset === asset.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-3 pb-3 space-y-2"
            >
              {asset.lastInspected && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Last inspected</span>
                  <span className="text-slate-700">{asset.lastInspected}</span>
                </div>
              )}
              {asset.nextDue && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Next due</span>
                  <span className="text-slate-700">{asset.nextDue}</span>
                </div>
              )}
              {asset.notes && (
                <div className="text-xs text-slate-600 bg-white p-2 rounded border">
                  {asset.notes}
                </div>
              )}
              {asset.certificateUrl && (
                <a
                  href={asset.certificateUrl}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <FileText className="w-3 h-3" />
                  View certificate
                </a>
              )}
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Issues List Component ──────────────────────────────────────────────────

interface IssuesListProps {
  issues: RoomIssue[];
}

function IssuesList({ issues }: IssuesListProps) {
  const getPriorityColor = (priority: RoomIssue["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="bg-slate-50 rounded-lg p-3 border border-slate-200"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-700">{issue.title}</h4>
            <span className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(issue.priority)}`}>
              {issue.priority}
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-2">{issue.description}</p>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
            {issue.assignedTo && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {issue.assignedTo}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Evacuation Card Component ───────────────────────────────────────────────

interface EvacuationCardProps {
  route: EvacuationRoute3D;
  onVisualize?: () => void;
}

function EvacuationCard({ route, onVisualize }: EvacuationCardProps) {
  return (
    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="w-4 h-4 text-emerald-600" />
        <h4 className="text-sm font-semibold text-emerald-900">Evacuation Route</h4>
      </div>
      <div className="space-y-1 text-xs text-emerald-800 mb-3">
        <div className="flex justify-between">
          <span>Distance to exit:</span>
          <span className="font-medium">{route.distanceMetres}m</span>
        </div>
        <div className="flex justify-between">
          <span>Muster point:</span>
          <span className="font-medium">Main Assembly Point</span>
        </div>
      </div>
      <button
        onClick={onVisualize}
        className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
      >
        <Navigation className="w-4 h-4" />
        Visualize Route
      </button>
    </div>
  );
}

// ─── Main Panel Component ───────────────────────────────────────────────────

export default function RoomDetailPanel({
  room,
  onClose,
  media = [],
  assets = [],
  issues = [],
  evacuationRoute,
  onEditAssets,
  onReportIssue,
}: RoomDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "media" | "assets" | "issues"
  >("overview");

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Package },
    { id: "media" as const, label: "Media", icon: ImageIcon, count: media.length },
    { id: "assets" as const, label: "Assets", icon: Package, count: assets.length },
    { id: "issues" as const, label: "Issues", icon: AlertTriangle, count: issues.length },
  ];

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{room.name}</h2>
          <p className="text-xs text-slate-500 capitalize">
            {room.type.replace(/_/g, " ")}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-slate-100 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* Room Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <Ruler className="w-4 h-4 text-blue-600 mb-1" />
                  <p className="text-xs text-blue-600">Dimensions</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {room.size[0]}m × {room.size[2]}m
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <Users className="w-4 h-4 text-green-600 mb-1" />
                  <p className="text-xs text-green-600">Capacity</p>
                  <p className="text-sm font-semibold text-green-900">
                    {Math.floor(room.size[0] * room.size[2] / 2)} pupils
                  </p>
                </div>
              </div>

              {/* Room Features */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {room.hasFireExit && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200">
                      <Flame className="w-3 h-3" />
                      Fire Exit
                    </span>
                  )}
                  {room.type === "classroom" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">
                      <Lightbulb className="w-3 h-3" />
                      Interactive Whiteboard
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                    <Thermometer className="w-3 h-3" />
                    Heating
                  </span>
                </div>
              </div>

              {/* Evacuation Route */}
              {evacuationRoute && (
                <EvacuationCard
                  route={evacuationRoute}
                  onVisualize={() => {/* Switch to 3D view with evacuation mode */}}
                />
              )}

              {/* Quick Actions */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onEditAssets}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Edit Assets
                  </button>
                  <button
                    onClick={onReportIssue}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Report Issue
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <ClipboardCheck className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-slate-700">Daily inspection completed</p>
                      <p className="text-xs text-slate-500">Today, 8:30 AM</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "media" && (
            <motion.div
              key="media"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              {media.length > 0 ? (
                <MediaGallery media={media} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                  <ImageIcon className="w-12 h-12 text-slate-300 mb-3" />
                  <h3 className="font-medium text-slate-700 mb-1">No Media Yet</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Add photos or videos of this room to see them here
                  </p>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                    Add Media
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "assets" && (
            <motion.div
              key="assets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4"
            >
              {assets.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Assets ({assets.length})
                    </h3>
                    <button
                      onClick={onEditAssets}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Asset
                    </button>
                  </div>
                  <AssetList assets={assets} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="w-12 h-12 text-slate-300 mb-3" />
                  <h3 className="font-medium text-slate-700 mb-1">No Assets Recorded</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Track fire extinguishers, boilers, and other equipment
                  </p>
                  <button
                    onClick={onEditAssets}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Add First Asset
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "issues" && (
            <motion.div
              key="issues"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4"
            >
              {issues.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Open Issues ({issues.length})
                    </h3>
                    <button
                      onClick={onReportIssue}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Report Issue
                    </button>
                  </div>
                  <IssuesList issues={issues} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardCheck className="w-12 h-12 text-green-300 mb-3" />
                  <h3 className="font-medium text-slate-700 mb-1">All Clear!</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    No open issues for this room
                  </p>
                  <button
                    onClick={onReportIssue}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Report an Issue
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

