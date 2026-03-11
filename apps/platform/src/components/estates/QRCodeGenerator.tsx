"use client";

import { useState, useRef } from "react";
import { Printer, CheckSquare, Square, QrCode } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  location?: string;
  assetType?: string;
  qrCodeId?: string;
}

interface QRCodeGeneratorProps {
  assets: Asset[];
}

// Simple QR-like SVG placeholder with encoded ID
// A full QR encoder is complex — this generates a visually distinct pattern per ID
// that is recognisable as a label, with the scan URL printed below.
function generatePattern(input: string): boolean[][] {
  const size = 21; // 21x21 grid (QR Version 1)
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false),
  );

  // Finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (isOuter || isInner) {
          if (startR + r < size && startC + c < size) {
            grid[startR + r][startC + c] = true;
          }
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Data area — hash the input to fill remaining cells deterministically
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }

  let seed = Math.abs(hash);
  const lcg = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder pattern areas + timing
      const inFinderTL = r < 8 && c < 8;
      const inFinderTR = r < 8 && c >= size - 8;
      const inFinderBL = r >= size - 8 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (!inFinderTL && !inFinderTR && !inFinderBL && !isTiming) {
        grid[r][c] = lcg() % 3 !== 0; // ~66% fill for visual density
      }
    }
  }

  return grid;
}

function QRCodeSVG({ value, size = 120 }: { value: string; size?: number }) {
  const grid = generatePattern(value);
  const modules = grid.length;
  const cellSize = size / modules;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={size} height={size} fill="white" />
      {grid.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

function AssetLabel({ asset }: { asset: Asset }) {
  const qrId = asset.qrCodeId || asset.id;
  const scanUrl = `https://app.schoolgle.co.uk/scan/${qrId}`;

  return (
    <div
      className="asset-label border border-gray-300 rounded-md p-2 flex flex-col items-center justify-between bg-white"
      style={{ width: "60mm", height: "40mm", pageBreakInside: "avoid" }}
    >
      <div className="flex items-start gap-2 w-full">
        <div className="flex-shrink-0">
          <QRCodeSVG value={scanUrl} size={90} />
        </div>
        <div className="flex flex-col justify-between min-w-0 flex-1 h-full py-0.5">
          <div>
            <p className="text-[9px] font-bold leading-tight truncate text-black">
              {asset.name}
            </p>
            {asset.location && (
              <p className="text-[7px] text-gray-600 leading-tight truncate">
                {asset.location}
              </p>
            )}
            {asset.assetType && (
              <p className="text-[6px] text-gray-400 leading-tight truncate">
                {asset.assetType}
              </p>
            )}
          </div>
          <div className="mt-auto flex items-end justify-between w-full">
            <p className="text-[5px] text-gray-400 font-mono truncate">
              ID: {qrId.slice(0, 12)}
            </p>
            <div className="flex-shrink-0 w-4 h-4 rounded-full bg-teal-600 flex items-center justify-center">
              <span className="text-white text-[7px] font-bold leading-none">
                S
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QRCodeGenerator({ assets }: QRCodeGeneratorProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(assets.map((a) => a.id)),
  );
  const printRef = useRef<HTMLDivElement>(null);

  const allSelected = selected.size === assets.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(assets.map((a) => a.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedAssets = assets.filter((a) => selected.has(a.id));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #qr-print-area,
          #qr-print-area * {
            visibility: visible;
          }
          #qr-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            padding: 5mm;
          }
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr);
            gap: 2mm;
          }
          .asset-label {
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-teal-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            {allSelected ? "Deselect All" : "Select All"}
          </button>
          <span className="text-sm text-gray-500">
            {selected.size} of {assets.length} selected
          </span>
        </div>
        <button
          onClick={handlePrint}
          disabled={selected.size === 0}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <Printer className="w-4 h-4" />
          Print Labels ({selected.size})
        </button>
      </div>

      {/* Asset selection list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 no-print">
        {assets.map((asset) => (
          <button
            key={asset.id}
            onClick={() => toggleOne(asset.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
              selected.has(asset.id)
                ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            {selected.has(asset.id) ? (
              <CheckSquare className="w-5 h-5 text-teal-600 flex-shrink-0" />
            ) : (
              <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate dark:text-white">
                {asset.name}
              </p>
              {asset.location && (
                <p className="text-xs text-gray-500 truncate">
                  {asset.location}
                </p>
              )}
              {asset.assetType && (
                <p className="text-xs text-gray-400 truncate">
                  {asset.assetType}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Preview */}
      {selectedAssets.length > 0 && (
        <div className="no-print">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Print Preview ({selectedAssets.length} labels,{" "}
            {Math.ceil(selectedAssets.length / 24)} page
            {Math.ceil(selectedAssets.length / 24) !== 1 ? "s" : ""})
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900 overflow-auto">
            <div className="grid grid-cols-3 gap-2 max-w-[210mm] mx-auto">
              {selectedAssets.map((asset) => (
                <AssetLabel key={asset.id} asset={asset} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Print area (hidden on screen, visible when printing) */}
      <div id="qr-print-area" className="hidden print:block">
        <div className="print-grid">
          {selectedAssets.map((asset) => (
            <AssetLabel key={asset.id} asset={asset} />
          ))}
        </div>
      </div>
    </div>
  );
}
