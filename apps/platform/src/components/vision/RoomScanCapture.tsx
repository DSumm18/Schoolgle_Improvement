"use client";

/**
 * Room Scan Capture
 *
 * Camera interface for capturing a room scan. Takes a photo or short video,
 * sends to Vision AI, displays results, and logs the room check.
 */

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  RotateCw,
  Send,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";

interface ScanResult {
  summary: string;
  itemsDetected: number;
  issuesFound: number;
  complianceScore: number;
  dispatches: Array<{
    module: string;
    action: string;
    detail: string;
  }>;
}

interface RoomScanCaptureProps {
  organizationId: string;
  assetId: string;
  roomName: string;
  checkType:
    | "am_open"
    | "pm_close"
    | "ad_hoc"
    | "holiday_progress"
    | "contractor_snagging";
  userId: string;
  onComplete?: (result: ScanResult) => void;
  onCancel?: () => void;
}

export function RoomScanCapture({
  organizationId,
  assetId,
  roomName,
  checkType,
  userId,
  onComplete,
  onCancel,
}: RoomScanCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<
    "capture" | "preview" | "analyzing" | "result"
  >("capture");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  // Start camera
  useEffect(() => {
    if (mode === "capture") {
      startCamera();
    }
    return () => stopCamera();
  }, [mode, facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setCameraError("Camera not available. Use the upload button instead.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    setMode("preview");
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setMode("preview");
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setCapturedImage(null);
    setScanResult(null);
    setMode("capture");
  };

  const analyzeAndSubmit = async () => {
    if (!capturedImage) return;

    setMode("analyzing");
    setAnalyzing(true);

    try {
      // 1. Run vision analysis
      const analysisRes = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contextType: "room-assessment",
          organizationId,
          mediaType: "image",
          media: capturedImage,
          mimeType: "image/jpeg",
          metadata: {
            assetId,
            capturedAt: new Date().toISOString(),
            checkType,
            userId,
          },
        }),
      });

      const analysisData = await analysisRes.json();

      if (!analysisRes.ok) {
        throw new Error(analysisData.error || "Vision analysis failed");
      }

      const result: ScanResult = {
        summary: analysisData.result.summary,
        itemsDetected: analysisData.result.items?.length ?? 0,
        issuesFound: analysisData.result.compliance?.issues?.length ?? 0,
        complianceScore: analysisData.result.confidence ?? 0,
        dispatches: analysisData.result.dispatches ?? [],
      };

      // 2. Log the room check
      await fetch("/api/room-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          assetId,
          checkedBy: userId,
          checkType,
          mediaType: "image",
          mediaHash: analysisData.evidence?.mediaHash,
          captureTimestamp: new Date().toISOString(),
          aiSummary: result.summary,
          itemsDetected: result.itemsDetected,
          issuesFound: result.issuesFound,
          complianceScore: result.complianceScore,
          dispatchedTo: result.dispatches,
          workNotes: notes || null,
        }),
      });

      setScanResult(result);
      setMode("result");
    } catch (err) {
      console.error("Analysis failed:", err);
      setCameraError(err instanceof Error ? err.message : "Analysis failed");
      setMode("preview");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{roomName}</CardTitle>
          <Badge variant="outline">
            {checkType === "am_open"
              ? "AM Opening"
              : checkType === "pm_close"
                ? "PM Closing"
                : checkType === "holiday_progress"
                  ? "Holiday Check"
                  : checkType === "contractor_snagging"
                    ? "Snagging"
                    : "Ad-hoc"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Camera / Preview / Results */}
        {mode === "capture" && (
          <>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-sm p-4 text-center">
                  {cameraError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-1" /> Upload
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setFacingMode((f) =>
                      f === "environment" ? "user" : "environment",
                    )
                  }
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button onClick={capturePhoto} className="bg-primary">
                  <Camera className="h-4 w-4 mr-1" /> Capture
                </Button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </>
        )}

        {mode === "preview" && capturedImage && (
          <>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-contain"
              />
            </div>
            <Textarea
              placeholder="Add notes (optional) -- e.g., 'Contractor finished painting'"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
            {cameraError && (
              <p className="text-sm text-red-600">{cameraError}</p>
            )}
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" onClick={retake}>
                <Camera className="h-4 w-4 mr-1" /> Retake
              </Button>
              <Button onClick={analyzeAndSubmit} className="bg-primary">
                <Send className="h-4 w-4 mr-1" /> Analyse & Submit
              </Button>
            </div>
          </>
        )}

        {mode === "analyzing" && (
          <div className="flex flex-col items-center justify-center p-8 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Ed is analysing the room...
            </p>
          </div>
        )}

        {mode === "result" && scanResult && (
          <>
            <div
              className={`rounded-lg p-4 ${
                scanResult.issuesFound > 0
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResult.issuesFound > 0 ? (
                  <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {scanResult.issuesFound > 0
                      ? `${scanResult.issuesFound} issue(s) found`
                      : "All clear"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {scanResult.summary}
                  </p>
                </div>
              </div>
            </div>

            {scanResult.dispatches.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Modules Updated
                </p>
                {scanResult.dispatches.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">
                      {d.module.replace("_", " ")}
                    </Badge>
                    <span className="text-muted-foreground">{d.detail}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={retake}>
                Scan Another Room
              </Button>
              <Button onClick={() => onComplete?.(scanResult)}>Done</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
