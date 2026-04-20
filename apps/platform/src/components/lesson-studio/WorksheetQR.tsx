"use client";

import React, { useEffect, useRef, useState } from "react";

interface WorksheetQRProps {
  planId: string;
  pupilId: string;
  pupilName: string;
  host?: string;
}

export function WorksheetQR({ planId, pupilId, pupilName, host }: WorksheetQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  const scanUrl =
    `${host ?? ""}/dashboard/teaching-learning/lesson-studio/scan?plan=${encodeURIComponent(planId)}&pupil=${encodeURIComponent(pupilId)}`;

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        // Dynamic import keeps qrcode out of the SSR bundle
        const QRCode = (await import("qrcode")).default;
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        await QRCode.toCanvas(canvas, scanUrl, {
          width: 80,
          margin: 1,
          color: { dark: "#1e293b", light: "#ffffff" },
        });
      } catch {
        if (!cancelled) setFallback(true);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [scanUrl]);

  const shortRef = pupilId.replace(/-/g, "").slice(0, 8).toUpperCase();

  return (
    <div
      className="inline-flex items-center gap-2 border border-slate-300 rounded-lg p-2 bg-white print:border-black"
      title={`Scan to assess ${pupilName}`}
      data-scan-url={scanUrl}
    >
      {fallback ? (
        /* Fallback: patterned grid when canvas unavailable */
        <div className="w-[80px] h-[80px] bg-white border border-slate-400 rounded flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-[72px] h-[72px]">
            {Array.from({ length: 25 }, (_, i) => {
              const x = (i % 5) * 20;
              const y = Math.floor(i / 5) * 20;
              const hash =
                (pupilId.charCodeAt(i % pupilId.length) +
                  planId.charCodeAt(i % planId.length)) %
                3;
              return hash > 0 ? (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width="18"
                  height="18"
                  rx="2"
                  fill={hash === 1 ? "#0d9488" : "#1e293b"}
                />
              ) : null;
            })}
            {/* Corner finder patterns */}
            <rect x="0" y="0" width="30" height="30" rx="4" fill="none" stroke="#1e293b" strokeWidth="4" />
            <rect x="70" y="0" width="30" height="30" rx="4" fill="none" stroke="#1e293b" strokeWidth="4" />
            <rect x="0" y="70" width="30" height="30" rx="4" fill="none" stroke="#1e293b" strokeWidth="4" />
            <rect x="8" y="8" width="14" height="14" rx="2" fill="#1e293b" />
            <rect x="78" y="8" width="14" height="14" rx="2" fill="#1e293b" />
            <rect x="8" y="78" width="14" height="14" rx="2" fill="#1e293b" />
          </svg>
        </div>
      ) : (
        <canvas ref={canvasRef} width={80} height={80} className="rounded" />
      )}

      <div className="text-[8px] text-slate-500 leading-tight max-w-[64px]">
        <div className="font-semibold text-slate-700 truncate">{pupilName}</div>
        <div className="font-mono text-[7px] mt-0.5">{shortRef}</div>
        <div className="mt-1 text-[7px] text-slate-400">Scan to assess</div>
      </div>
    </div>
  );
}
