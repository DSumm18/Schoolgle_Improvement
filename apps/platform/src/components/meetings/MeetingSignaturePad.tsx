"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PenTool, Check, RotateCcw, Shield } from "lucide-react";

interface SignatureSlot {
  name: string;
  role: "leader" | "attendee" | "witness";
  signed?: boolean;
  signatureData?: string;
  signedAt?: string;
}

interface Props {
  leaderName: string;
  attendeeName: string;
  onSign: (role: "leader" | "attendee", signatureData: string) => void;
  existingSignatures?: SignatureSlot[];
  disabled?: boolean;
}

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 150;
const STROKE_WIDTH = 2;
const STROKE_COLOR = "#1e293b";
const SIGN_LINE_Y = 110;

function SignatureCanvas({
  slot,
  onSign,
  disabled,
}: {
  slot: SignatureSlot;
  onSign: (signatureData: string) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const roleLabels: Record<string, string> = {
    leader: "Meeting Leader",
    attendee: "Attendee",
    witness: "Witness",
  };

  const drawPlaceholder = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Dotted sign-here line
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.moveTo(24, SIGN_LINE_Y);
    ctx.lineTo(CANVAS_WIDTH - 24, SIGN_LINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Placeholder text
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Sign here", CANVAS_WIDTH / 2, SIGN_LINE_Y + 28);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || slot.signed) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up high-DPI canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    drawPlaceholder(ctx);
  }, [slot.signed, drawPlaceholder]);

  const getCanvasPoint = (
    e: React.MouseEvent<HTMLCanvasElement>,
  ): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || slot.signed) return;
    setIsDrawing(true);
    const point = getCanvasPoint(e);
    lastPoint.current = point;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    // On first stroke, clear the placeholder
    if (!hasDrawn) {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, CANVAS_WIDTH * dpr, CANVAS_HEIGHT * dpr);
      // Redraw the sign line only
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.moveTo(24, SIGN_LINE_Y);
      ctx.lineTo(CANVAS_WIDTH - 24, SIGN_LINE_Y);
      ctx.stroke();
      ctx.setLineDash([]);
      setHasDrawn(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || slot.signed) return;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !lastPoint.current) return;

    const point = getCanvasPoint(e);

    ctx.beginPath();
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPoint.current = point;
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const handleClear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setHasDrawn(false);
    drawPlaceholder(ctx);
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSign(dataUrl);
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex-1 min-w-[280px]">
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">{slot.name}</p>
            <p className="text-xs text-slate-500">{roleLabels[slot.role]}</p>
          </div>
          {slot.signed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <Check className="h-3 w-3" />
              Signed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
              <PenTool className="h-3 w-3" />
              Awaiting
            </span>
          )}
        </div>

        {/* Canvas / Signed Image */}
        <div className="p-4">
          {slot.signed && slot.signatureData ? (
            <div className="relative">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-2 flex items-center justify-center">
                <img
                  src={slot.signatureData}
                  alt={`Signature of ${slot.name}`}
                  className="max-w-full h-auto"
                  style={{ maxHeight: CANVAS_HEIGHT }}
                />
              </div>
              <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className={`w-full rounded-xl border ${
                disabled
                  ? "border-slate-200 bg-slate-50 cursor-not-allowed"
                  : "border-slate-200 bg-slate-50/50 cursor-crosshair hover:border-slate-300"
              } transition-colors`}
              style={{
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                touchAction: "none",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          {slot.signed && slot.signedAt ? (
            <p className="text-xs text-slate-400 text-center">
              Signed {formatTimestamp(slot.signedAt)}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled || !hasDrawn}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </button>
              <button
                type="button"
                onClick={handleSign}
                disabled={disabled || !hasDrawn}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Sign
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MeetingSignaturePad({
  leaderName,
  attendeeName,
  onSign,
  existingSignatures,
  disabled,
}: Props) {
  const buildSlot = (
    name: string,
    role: "leader" | "attendee",
  ): SignatureSlot => {
    const existing = existingSignatures?.find((s) => s.role === role);
    if (existing) return existing;
    return { name, role };
  };

  const [leaderSlot, setLeaderSlot] = useState<SignatureSlot>(() =>
    buildSlot(leaderName, "leader"),
  );
  const [attendeeSlot, setAttendeeSlot] = useState<SignatureSlot>(() =>
    buildSlot(attendeeName, "attendee"),
  );

  const handleSign = (role: "leader" | "attendee", signatureData: string) => {
    const now = new Date().toISOString();
    if (role === "leader") {
      setLeaderSlot((prev) => ({
        ...prev,
        signed: true,
        signatureData,
        signedAt: now,
      }));
    } else {
      setAttendeeSlot((prev) => ({
        ...prev,
        signed: true,
        signatureData,
        signedAt: now,
      }));
    }
    onSign(role, signatureData);
  };

  const bothSigned = leaderSlot.signed && attendeeSlot.signed;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <Shield className="h-4.5 w-4.5 text-slate-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Meeting Signatures
          </h3>
          <p className="text-xs text-slate-500">
            Both parties must sign to confirm the minutes
          </p>
        </div>
      </div>

      {/* Signature boxes side by side */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SignatureCanvas
          slot={leaderSlot}
          onSign={(data) => handleSign("leader", data)}
          disabled={disabled}
        />
        <SignatureCanvas
          slot={attendeeSlot}
          onSign={(data) => handleSign("attendee", data)}
          disabled={disabled}
        />
      </div>

      {/* Confirmation banner */}
      {bothSigned && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Check className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Minutes confirmed
            </p>
            <p className="text-xs text-emerald-600">
              Both signatures have been captured and recorded.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
