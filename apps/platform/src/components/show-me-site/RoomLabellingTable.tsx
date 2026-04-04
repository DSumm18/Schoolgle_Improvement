"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { ROOM_OUTLINES } from "./grove-house-3d-data";
import QRCode from "qrcode";

interface RoomLabellingTableProps {
  roomLabels: Record<string, string>;
  onLabelChange: (systemId: string, label: string) => void;
}

const PRODUCTION_DOMAIN = "https://schoolgle.co.uk";

function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname !== "schoolgle.co.uk") {
    return window.location.origin;
  }
  return PRODUCTION_DOMAIN;
}

function QRThumbnail({ systemId }: { systemId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = `${getBaseUrl()}/wayfinding/${systemId}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 50,
        margin: 1,
        color: { dark: "#e2e8f0", light: "#00000000" },
      });
    }
  }, [url]);

  return <canvas ref={canvasRef} width={50} height={50} className="rounded" />;
}

async function downloadQR(systemId: string, label: string) {
  const url = `${getBaseUrl()}/wayfinding/${systemId}`;
  const dataUrl = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: "#1e293b", light: "#ffffff" },
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `qr-${systemId}${label ? `-${label.replace(/\s+/g, "-")}` : ""}.png`;
  a.click();
}

async function printAllQRCodes(roomLabels: Record<string, string>) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const qrPromises = ROOM_OUTLINES.map(async (room) => {
    const url = `${getBaseUrl()}/wayfinding/${room.systemId}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: { dark: "#1e293b", light: "#ffffff" },
    });
    const label = roomLabels[room.systemId] || room.label;
    return { systemId: room.systemId, label, dataUrl, block: room.block };
  });

  const qrData = await Promise.all(qrPromises);

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>QR Codes - Room Wayfinding</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Poppins', Arial, sans-serif; padding: 10mm; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8mm; }
    .card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 4mm;
      text-align: center;
      page-break-inside: avoid;
    }
    .card img { width: 35mm; height: 35mm; }
    .system-id { font-size: 10px; color: #64748b; font-family: monospace; margin-top: 2mm; }
    .room-label { font-size: 11px; font-weight: 600; color: #1e293b; margin-top: 1mm; }
    .block { font-size: 9px; color: #94a3b8; }
    h1 { font-size: 16px; margin-bottom: 5mm; color: #1e293b; }
    @media print { body { padding: 5mm; } }
  </style>
</head>
<body>
  <h1>Room QR Codes - Wayfinding</h1>
  <div class="grid">
    ${qrData
      .map(
        (q) => `
      <div class="card">
        <img src="${q.dataUrl}" alt="QR ${q.systemId}" />
        <div class="system-id">${q.systemId}</div>
        <div class="room-label">${q.label}</div>
        <div class="block">${q.block}</div>
      </div>`
      )
      .join("")}
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`);
  printWindow.document.close();
}

export function RoomLabellingTable({
  roomLabels,
  onLabelChange,
}: RoomLabellingTableProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const handleChange = useCallback(
    (systemId: string, value: string) => {
      setDrafts((prev) => ({ ...prev, [systemId]: value }));
    },
    []
  );

  const handleCommit = useCallback(
    (systemId: string) => {
      const value = drafts[systemId];
      if (value !== undefined) {
        onLabelChange(systemId, value);
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[systemId];
          return next;
        });
      }
    },
    [drafts, onLabelChange]
  );

  const handleKeyDown = useCallback(
    (systemId: string, e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleCommit(systemId);
      }
    },
    [handleCommit]
  );

  return (
    <div className="overflow-auto max-h-full">
      <div className="flex justify-end px-3 py-2">
        <button
          onClick={() => printAllQRCodes(roomLabels)}
          className="text-xs px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print All QR Codes
        </button>
      </div>
      <table className="w-full text-xs text-left">
        <thead className="sticky top-0 bg-slate-800 z-10">
          <tr className="border-b border-slate-700">
            <th className="px-3 py-2 font-semibold text-slate-400 w-16">
              QR
            </th>
            <th className="px-3 py-2 font-semibold text-slate-400 w-20">
              System ID
            </th>
            <th className="px-3 py-2 font-semibold text-slate-400 w-16">
              PDF #
            </th>
            <th className="px-3 py-2 font-semibold text-slate-400 w-24">
              Block
            </th>
            <th className="px-3 py-2 font-semibold text-slate-400">
              Room Name
            </th>
            <th className="px-3 py-2 font-semibold text-slate-400 w-16">
            </th>
          </tr>
        </thead>
        <tbody>
          {ROOM_OUTLINES.map((room) => {
            const currentValue =
              drafts[room.systemId] !== undefined
                ? drafts[room.systemId]
                : roomLabels[room.systemId] || "";

            return (
              <tr
                key={room.systemId}
                className="border-b border-slate-800 hover:bg-slate-800/50"
              >
                <td className="px-3 py-1.5">
                  <QRThumbnail systemId={room.systemId} />
                </td>
                <td className="px-3 py-1.5 font-mono text-slate-300">
                  {room.systemId}
                </td>
                <td className="px-3 py-1.5 text-slate-500">
                  {room.pdfNumber || "\u2014"}
                </td>
                <td className="px-3 py-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: room.color }}
                  />
                  <span className="text-slate-400">{room.block}</span>
                </td>
                <td className="px-1 py-0.5">
                  <input
                    type="text"
                    value={currentValue}
                    placeholder={room.label}
                    onChange={(e) =>
                      handleChange(room.systemId, e.target.value)
                    }
                    onBlur={() => handleCommit(room.systemId)}
                    onKeyDown={(e) => handleKeyDown(room.systemId, e)}
                    className="w-full bg-transparent border border-transparent hover:border-slate-700 focus:border-amber-500 focus:bg-slate-800 rounded px-2 py-1 text-slate-200 placeholder:text-slate-600 outline-none transition-colors"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => downloadQR(room.systemId, currentValue || room.label)}
                    className="text-slate-500 hover:text-amber-400 transition-colors"
                    title="Download QR code"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
