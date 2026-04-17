"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "@/context/SupabaseAuthContext";
import type { PathfinderExtractionResult } from "@/lib/pathfinder/prototype";

// pdfjs-dist is loaded lazily on the client only.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

async function getPdfjs() {
  if (typeof window === "undefined") {
    throw new Error("PDF rasterisation must run in the browser");
  }
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    // Use the bundled worker URL so the browser can spin up a worker thread.
    // pdfjs exposes a `workerSrc` string configuration; setting it to an
    // inline eval-via-importScripts fallback keeps this resilient to CSP.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs" as any);
      if (worker && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
          new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url),
          { type: "module" },
        );
      }
    } catch {
      // Fall back to fake-worker mode (slower but always works).
      pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    }
  }
  return pdfjsLib;
}

const TARGET_RASTER_WIDTH = 1800; // px — enough resolution for vision model, not too big for upload

interface PageThumbnail {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

interface UploadUrlResponse {
  bucket: string;
  path: string;
  modelId: string;
  token: string;
  signedUrl: string;
}

export interface PathfinderSourceIntakeResult {
  model: unknown;
  extractionResult: PathfinderExtractionResult;
}

interface PathfinderSourceIntakeProps {
  parentModelId?: string | null;
  onIntakeComplete: (result: PathfinderSourceIntakeResult) => void;
  onCancel?: () => void;
  compact?: boolean;
}

type IntakeStage =
  | "idle"
  | "loading-pdf"
  | "choose-page"
  | "rasterising"
  | "uploading"
  | "extracting"
  | "done"
  | "error";

function stageLabel(stage: IntakeStage): string {
  switch (stage) {
    case "loading-pdf":
      return "Reading the PDF...";
    case "choose-page":
      return "Pick the page you want to use.";
    case "rasterising":
      return "Preparing the site plan image...";
    case "uploading":
      return "Uploading to your school's private storage...";
    case "extracting":
      return "Detecting rooms and spaces...";
    case "done":
      return "Site plan ready. Review before approving.";
    case "error":
      return "Something went wrong. Try again.";
    default:
      return "Upload a PDF or image of your site plan.";
  }
}

async function renderPdfPageToCanvas(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  targetWidth: number,
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const viewport1 = page.getViewport({ scale: 1 });
  const scale = targetWidth / viewport1.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { canvas, width: canvas.width, height: canvas.height };
}

function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to rasterise canvas"));
    }, type);
  });
}

async function uploadBlobToSupabase(
  blob: Blob,
  response: UploadUrlResponse,
  contentType: string,
): Promise<void> {
  const uploadResponse = await fetch(response.signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: blob,
  });
  if (!uploadResponse.ok) {
    throw new Error(`Upload failed with HTTP ${uploadResponse.status}`);
  }
}

async function requestUploadUrl(
  accessToken: string | undefined,
  payload: { kind: "source" | "page"; ext: string; modelId?: string },
): Promise<UploadUrlResponse> {
  const response = await fetch("/api/estates/pathfinder/upload-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Could not create upload URL (HTTP ${response.status})`);
  }
  return (await response.json()) as UploadUrlResponse;
}

export default function PathfinderSourceIntake({
  parentModelId,
  onIntakeComplete,
  onCancel,
  compact = false,
}: PathfinderSourceIntakeProps) {
  const auth = useContext(AuthContext);
  const accessToken = auth?.session?.access_token;

  const [stage, setStage] = useState<IntakeStage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [rawImageFile, setRawImageFile] = useState<File | null>(null);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null);

  const reset = useCallback(() => {
    setStage("idle");
    setErrorMessage(null);
    setPdfFile(null);
    setRawImageFile(null);
    setThumbnails([]);
    setSelectedPage(null);
    pdfDocRef.current = null;
  }, []);

  const onFileSelected = useCallback(
    async (file: File) => {
      setErrorMessage(null);
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        setPdfFile(file);
        setRawImageFile(null);
        setStage("loading-pdf");
        try {
          const pdfjs = await getPdfjs();
          const buffer = await file.arrayBuffer();
          const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
          const pdf = await loadingTask.promise;
          pdfDocRef.current = pdf;

          const thumbsToGenerate = Math.min(pdf.numPages, 12);
          const generated: PageThumbnail[] = [];
          for (let pageNumber = 1; pageNumber <= thumbsToGenerate; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const { canvas, width, height } = await renderPdfPageToCanvas(page, 360);
            generated.push({
              pageNumber,
              dataUrl: canvas.toDataURL("image/png"),
              width,
              height,
            });
          }
          setThumbnails(generated);
          setSelectedPage(1);
          setStage("choose-page");
        } catch (err) {
          console.error("Failed to load PDF:", err);
          setErrorMessage(err instanceof Error ? err.message : "Could not read that PDF.");
          setStage("error");
        }
        return;
      }

      if (file.type.startsWith("image/")) {
        setPdfFile(null);
        setRawImageFile(file);
        setThumbnails([]);
        setSelectedPage(null);
        setStage("choose-page");
        return;
      }

      setErrorMessage("Please choose a PDF or image file (PNG, JPG, or WebP).");
      setStage("error");
    },
    [],
  );

  const runExtraction = useCallback(async () => {
    if (!accessToken) {
      setErrorMessage("Sign in again to use the Pathfinder intake.");
      setStage("error");
      return;
    }

    try {
      // Step 1 — prepare the page PNG
      setStage("rasterising");
      let pagePngBlob: Blob;
      let pageWidth: number;
      let pageHeight: number;

      if (pdfFile && pdfDocRef.current && selectedPage) {
        const page = await pdfDocRef.current.getPage(selectedPage);
        const { canvas, width, height } = await renderPdfPageToCanvas(page, TARGET_RASTER_WIDTH);
        pagePngBlob = await canvasToBlob(canvas, "image/png");
        pageWidth = width;
        pageHeight = height;
      } else if (rawImageFile) {
        pagePngBlob = rawImageFile;
        // Measure the image for sensible defaults before sending to extractor.
        const dims = await new Promise<{ width: number; height: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => resolve({ width: TARGET_RASTER_WIDTH, height: 1200 });
          img.src = URL.createObjectURL(rawImageFile);
        });
        pageWidth = dims.width;
        pageHeight = dims.height;
      } else {
        throw new Error("No source file selected.");
      }

      // Step 2 — upload source document (PDF or original image) + the PNG page
      setStage("uploading");

      let sourceDocumentPath: string | undefined;
      const sourceDocumentProvider = "upload";
      let sourceDocumentName = "Site plan";
      let sourceDocumentId: string | undefined;
      let modelId: string | undefined;

      if (pdfFile) {
        const sourceUpload = await requestUploadUrl(accessToken, { kind: "source", ext: "pdf" });
        modelId = sourceUpload.modelId;
        await uploadBlobToSupabase(pdfFile, sourceUpload, "application/pdf");
        sourceDocumentPath = sourceUpload.path;
        sourceDocumentName = pdfFile.name;
        sourceDocumentId = pdfFile.name;
      } else if (rawImageFile) {
        sourceDocumentName = rawImageFile.name;
        sourceDocumentId = rawImageFile.name;
      }

      const pageExt = rawImageFile?.type === "image/jpeg" ? "jpg" : "png";
      const pageUpload = await requestUploadUrl(accessToken, {
        kind: "page",
        ext: pageExt,
        modelId,
      });
      modelId = pageUpload.modelId;
      await uploadBlobToSupabase(
        pagePngBlob,
        pageUpload,
        rawImageFile?.type ?? "image/png",
      );

      // Step 3 — extract against the stored page image
      setStage("extracting");
      const extractResponse = await fetch("/api/estates/pathfinder/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sourceImagePath: pageUpload.path,
          sourceImageWidth: pageWidth,
          sourceImageHeight: pageHeight,
          sourceDocumentName,
          sourceDocumentProvider,
          sourceDocumentId,
          sourceDocumentPath,
          sourcePageNumber: pdfFile ? selectedPage : undefined,
          parentModelId: parentModelId ?? undefined,
          name: sourceDocumentName,
        }),
      });
      if (!extractResponse.ok) {
        throw new Error(`Extraction failed with HTTP ${extractResponse.status}`);
      }
      const result = (await extractResponse.json()) as PathfinderSourceIntakeResult;
      setStage("done");
      onIntakeComplete(result);
    } catch (err) {
      console.error("Pathfinder intake failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Extraction failed.");
      setStage("error");
    }
  }, [accessToken, pdfFile, rawImageFile, selectedPage, parentModelId, onIntakeComplete]);

  const isBusy = useMemo(
    () => ["loading-pdf", "rasterising", "uploading", "extracting"].includes(stage),
    [stage],
  );

  useEffect(() => {
    return () => {
      pdfDocRef.current = null;
    };
  }, []);

  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          : "rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {parentModelId ? "Upload a revised site plan" : "Connect your site plan"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {parentModelId
              ? "This creates a draft revision. Your current live site plan stays active until you approve the new one."
              : "Pathfinder uses your PDF once to build a clean, editable site plan. After you approve it, this PDF goes away — only your live Pathfinder model is used."}
          </p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Upload PDF or image
            </span>
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              disabled={isBusy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onFileSelected(file);
              }}
              className="text-sm text-slate-700 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-slate-700"
            />
          </label>
          <p className="text-xs text-slate-500">{stageLabel(stage)}</p>
          {errorMessage ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Or connect a source
          </span>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-400"
          >
            Connect from Google Drive (soon)
          </button>
        </div>
      </div>

      {thumbnails.length > 0 ? (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Choose a page
            </p>
            <p className="text-xs text-slate-500">
              Pick the page that shows the ground floor or site plan.
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {thumbnails.map((thumb) => {
              const active = selectedPage === thumb.pageNumber;
              return (
                <button
                  key={thumb.pageNumber}
                  type="button"
                  onClick={() => setSelectedPage(thumb.pageNumber)}
                  disabled={isBusy}
                  className={
                    "flex flex-col items-stretch gap-2 rounded-xl border p-2 text-left transition " +
                    (active
                      ? "border-slate-900 bg-slate-50 shadow-sm"
                      : "border-slate-200 hover:border-slate-400")
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumb.dataUrl}
                    alt={`Page ${thumb.pageNumber}`}
                    className="h-36 w-full rounded-md object-contain"
                  />
                  <span className="text-xs font-medium text-slate-700">Page {thumb.pageNumber}</span>
                </button>
              );
            })}
          </div>
          {pdfDocRef.current && pdfDocRef.current.numPages > thumbnails.length ? (
            <p className="mt-2 text-xs text-slate-400">
              Showing the first {thumbnails.length} of {pdfDocRef.current.numPages} pages.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={reset}
          disabled={isBusy || stage === "idle"}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 disabled:opacity-40"
        >
          Start over
        </button>

        <button
          type="button"
          onClick={() => void runExtraction()}
          disabled={
            isBusy ||
            (!pdfFile && !rawImageFile) ||
            (pdfFile !== null && selectedPage === null)
          }
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 disabled:bg-slate-400"
        >
          {isBusy ? stageLabel(stage) : "Run extraction"}
        </button>
      </div>
    </div>
  );
}
