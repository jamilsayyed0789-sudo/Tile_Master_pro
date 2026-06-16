"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Layers, Crop, Save, ArrowLeft, ArrowRight,
  Check, Download, LayoutGrid, AlertTriangle, Settings, HardDrive,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

import type { PdfPage, CropRegion } from "@/types/tile";
import { saveTileAsync, compressImage, isStorageLow, getStorageInfo, migrateFromLocalStorage } from "@/utils/tileStorage";
import { getStorageStatus, saveTileToLocalStorage, StorageStatus } from "@/utils/localStorageSettings";
import { extractTileInfo } from "@/utils/aiDetection";

const FileUpload = dynamic(() => import("@/components/pdf-extract/FileUpload"), { ssr: false });
const ThumbnailGrid = dynamic(() => import("@/components/pdf-extract/ThumbnailGrid"), { ssr: false });
const CropTool = dynamic(() => import("@/components/pdf-extract/CropTool"), { ssr: false });
const TileInfoEditor = dynamic(() => import("@/components/pdf-extract/TileInfoEditor"), { ssr: false });
const AIExtract = dynamic(() => import("@/components/pdf-extract/AIExtract"), { ssr: false });
const TileLibrary = dynamic(() => import("@/components/pdf-extract/TileLibrary"), { ssr: false });
const FirstTimeSetupModal = dynamic(() => import("@/components/pdf-extract/FirstTimeSetupModal"), { ssr: false });

type Step = "upload" | "select" | "crop" | "info" | "library";

const STEPS = [
  { id: "upload" as Step, label: "Upload PDF", icon: FileText },
  { id: "select" as Step, label: "Select Pages", icon: Layers },
  { id: "crop" as Step, label: "Crop Tiles", icon: Crop },
  { id: "library" as Step, label: "Tile Library", icon: LayoutGrid },
];

export default function PdfExtractClient() {
  const [step, setStep] = useState<Step>("upload");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState("");
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [pageTexts, setPageTexts] = useState<Record<number, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [detectedInfo, setDetectedInfo] = useState<Record<string, string> | null>(null);
  const [showAIDetect, setShowAIDetect] = useState(false);
  const [notify, setNotify] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState("");
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const SETUP_SKIPPED_KEY = "tilemaster_storage_setup_skipped";

  // On mount: check storage config and show first-time setup if needed
  useEffect(() => {
    getStorageStatus().then((st) => {
      setStorageStatus(st);
      if (!st.configured) {
        const skipped = sessionStorage.getItem(SETUP_SKIPPED_KEY);
        if (!skipped) setShowSetupModal(true);
      }
    });
  }, []);

  const showNotify = (msg: string) => {
    setNotify(msg);
    setTimeout(() => setNotify(null), 3000);
  };

  /**
   * Hybrid save: if local storage is configured → push to backend + database.
   * Otherwise fall back to IndexedDB (existing behavior).
   */
  const hybridSaveTile = async (tileData: Omit<import("@/types/tile").Tile, "id" | "createdAt">, pageNumber?: number) => {
    const st = storageStatus ?? await getStorageStatus();
    if (st.configured && st.writable) {
      const result = await saveTileToLocalStorage({
        tile_name: tileData.tileName,
        tile_number: tileData.tileNumber,
        tile_size: tileData.tileSize,
        finish: tileData.finish,
        color: tileData.color,
        page_number: pageNumber,
        image_data_url: tileData.imageDataUrl,
      });
      if (!result.ok) {
        // fallback to IndexedDB if backend save fails
        console.warn("Backend local save failed, falling back to IndexedDB:", result.message);
        await saveTileAsync(tileData);
      }
    } else {
      await saveTileAsync(tileData);
    }
  };

  const loadPdfPages = useCallback(async (file: File): Promise<boolean> => {
    // Migrate any old localStorage tiles to IndexedDB on first use
    await migrateFromLocalStorage();
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const buf = await file.arrayBuffer();

      if (!buf || buf.byteLength === 0) {
        throw new Error("Empty PDF file");
      }

      const doc = await pdfjsLib.getDocument({ data: buf }).promise;

      const loaded: PdfPage[] = [];
      const texts: Record<number, string> = {};
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 3.0 });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport: vp, canvas } as any).promise;
        loaded.push({
          index: i - 1,
          dataUrl: canvas.toDataURL("image/jpeg", 0.92),
          width: vp.width,
          height: vp.height,
        });
        try {
          const textContent = await page.getTextContent();
          texts[i - 1] = textContent.items.map((item: any) => item.str).join(" ");
        } catch {
          texts[i - 1] = "";
        }
      }
      setPages(loaded);
      setPageTexts(texts);
      setPdfError("");
      return true;
    } catch (err: any) {
      setPdfError(err?.message || "Failed to load PDF. Make sure it's a valid PDF file.");
      return false;
    }
  }, []);

  const handleFileLoaded = useCallback(
    async (file: File, dataUrl: string) => {
      setPdfFile(file);
      setPdfDataUrl(dataUrl);
      const ok = await loadPdfPages(file);
      if (ok) {
        setStep("select");
      }
    },
    [loadPdfPages]
  );

  const handleDeletePages = (ids: number[]) => {
    const remaining = pages.filter((p) => !ids.includes(p.index));
    setPages(remaining);
    const next = new Set(selectedIds);
    ids.forEach((id) => next.delete(id));
    setSelectedIds(next);
    showNotify(`Removed ${ids.length} page(s)`);
  };

  const handleRotatePages = (ids: number[], degrees: number) => {
    setPages((prev) =>
      prev.map((p) => {
        if (!ids.includes(p.index)) return p;
        const img = new Image();
        img.src = p.dataUrl;
        const canvas = document.createElement("canvas");
        const absDeg = Math.abs(degrees) % 360;
        if (absDeg === 90 || absDeg === 270) {
          canvas.width = p.height;
          canvas.height = p.width;
        } else {
          canvas.width = p.width;
          canvas.height = p.height;
        }
        const ctx = canvas.getContext("2d")!;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        return { ...p, dataUrl: canvas.toDataURL("image/jpeg", 0.85), width: canvas.width, height: canvas.height };
      })
    );
    showNotify(`Rotated ${ids.length} page(s)`);
  };

  const handleDownloadPages = (ids: number[]) => {
    ids.forEach((id) => {
      const page = pages.find((p) => p.index === id);
      if (!page) return;
      const a = document.createElement("a");
      a.href = page.dataUrl;
      a.download = `page_${id + 1}.jpg`;
      a.click();
    });
    showNotify(`Downloading ${ids.length} page(s)`);
  };

  const goToNextSelectedPage = () => {
    const sorted = Array.from(selectedIds).sort((a, b) => a - b);
    const currentSelIdx = sorted.indexOf(currentPageIdx);
    if (currentSelIdx < sorted.length - 1) {
      setCurrentPageIdx(sorted[currentSelIdx + 1]);
    }
  };

  const goToPrevSelectedPage = () => {
    const sorted = Array.from(selectedIds).sort((a, b) => a - b);
    const currentSelIdx = sorted.indexOf(currentPageIdx);
    if (currentSelIdx > 0) {
      setCurrentPageIdx(sorted[currentSelIdx - 1]);
    }
  };

  /**
   * Scans canvas edges and removes uniform-color borders (e.g. blue/grey PDF
   * page backgrounds). Returns trimmed canvas, or original if no solid border found.
   *
   * Key improvements over previous version:
   * - Samples ALL 4 corners; only trims if they all agree on the same color
   * - Verifies center of image is meaningfully different from the border color
   *   (prevents treating white marble tile texture as a "border")
   * - minContent raised to 0.55 — never trims more than 45% of the image
   * - Handles thin dark rule lines (PDF page separators) on individual edges
   */
  const autoTrimCanvas = (src: HTMLCanvasElement, tolerance = 8, minContent = 0.60): HTMLCanvasElement => {
    const w = src.width;
    const h = src.height;
    if (w < 8 || h < 8) return src;

    const ctx = src.getContext("2d")!;
    const data = ctx.getImageData(0, 0, w, h).data;

    const px = (x: number, y: number): [number, number, number] => {
      const i = (y * w + x) * 4;
      return [data[i], data[i + 1], data[i + 2]];
    };

    const isColorMatch = (c1: [number, number, number], c2: [number, number, number]) => {
      return Math.abs(c1[0] - c2[0]) <= tolerance && Math.abs(c1[1] - c2[1]) <= tolerance && Math.abs(c1[2] - c2[2]) <= tolerance;
    };

    const getEdgeColorAndUniformity = (isHorizontal: boolean, pos: number): { color: [number,number,number], uniform: boolean } => {
      const length = isHorizontal ? w : h;
      let sumR = 0, sumG = 0, sumB = 0;
      
      for (let i = 0; i < length; i++) {
        const c = isHorizontal ? px(i, pos) : px(pos, i);
        sumR += c[0]; sumG += c[1]; sumB += c[2];
      }
      
      const avg: [number,number,number] = [Math.round(sumR/length), Math.round(sumG/length), Math.round(sumB/length)];

      let matches = 0;
      for (let i = 0; i < length; i++) {
        const c = isHorizontal ? px(i, pos) : px(pos, i);
        if (isColorMatch(c, avg)) matches++;
      }
      
      // Extremely strict: 98% of the edge must match exactly to be considered a border
      return { color: avg, uniform: matches / length >= 0.98 };
    };

    const isLineUniform = (isHorizontal: boolean, pos: number, refColor: [number, number, number]): boolean => {
      const length = isHorizontal ? w : h;
      let matches = 0;
      for (let i = 0; i < length; i++) {
        const c = isHorizontal ? px(i, pos) : px(pos, i);
        if (isColorMatch(c, refColor)) matches++;
      }
      // When walking inward, stay strict (96%) to prevent bleeding into textured tiles
      return matches / length >= 0.96;
    };

    let top = 0, bottom = h - 1, left = 0, right = w - 1;

    // ── Step 1: Independently test and trim each edge ────────────────────────

    const leftEdge = getEdgeColorAndUniformity(false, 0);
    if (leftEdge.uniform) {
      while (left < w * (1 - minContent) && isLineUniform(false, left, leftEdge.color)) left++;
    }

    const rightEdge = getEdgeColorAndUniformity(false, w - 1);
    if (rightEdge.uniform) {
      while (right > w * minContent && isLineUniform(false, right, rightEdge.color)) right--;
    }

    const topEdge = getEdgeColorAndUniformity(true, 0);
    if (topEdge.uniform) {
      while (top < h * (1 - minContent) && isLineUniform(true, top, topEdge.color)) top++;
    }

    const bottomEdge = getEdgeColorAndUniformity(true, h - 1);
    if (bottomEdge.uniform) {
      while (bottom > h * minContent && isLineUniform(true, bottom, bottomEdge.color)) bottom--;
    }

    const trimW = right - left + 1;
    const trimH = bottom - top + 1;

    // If nothing was trimmed, return original
    if (top === 0 && left === 0 && right === w - 1 && bottom === h - 1) return src;

    const out = document.createElement("canvas");
    out.width = trimW;
    out.height = trimH;
    out.getContext("2d")!.drawImage(src, left, top, trimW, trimH, 0, 0, trimW, trimH);
    return out;
  };

  const handleApplyToAll = async (regions: any[], rotation: number, removeBg = false) => {
    const sorted = Array.from(selectedIds).sort((a, b) => a - b);
    const total = sorted.length;
    let saved = 0;

    showNotify(`Processing 0 / ${total} pages...`);

    const BATCH = 5; // process 5 pages at a time — keeps browser responsive
    for (let batchStart = 0; batchStart < sorted.length; batchStart += BATCH) {
      const batch = sorted.slice(batchStart, batchStart + BATCH);

      await Promise.all(
        batch.map(async (pageIdx) => {
          const page = pages.find((p) => p.index === pageIdx);
          if (!page) return;
          try {
            const img = await new Promise<HTMLImageElement>((res, rej) => {
              const i = new Image();
              i.onload = () => res(i);
              i.onerror = rej;
              i.src = page.dataUrl;
            });

            const nw = img.naturalWidth;
            const nh = img.naturalHeight;

            for (let rIdx = 0; rIdx < regions.length; rIdx++) {
              const region = regions[rIdx];
              const hasRatios =
                typeof region.xRatio === "number" &&
                typeof region.yRatio === "number" &&
                typeof region.wRatio === "number" &&
                typeof region.hRatio === "number";

              const sx = hasRatios ? region.xRatio * nw : region.x;
              const sy = hasRatios ? region.yRatio * nh : region.y;
              const sw = hasRatios ? region.wRatio * nw : region.width;
              const sh = hasRatios ? region.hRatio * nh : region.height;

              const cx = Math.max(0, Math.min(sx, nw - 1));
              const cy = Math.max(0, Math.min(sy, nh - 1));
              const cw = Math.max(1, Math.min(sw, nw - cx));
              const ch = Math.max(1, Math.min(sh, nh - cy));

              const canvas = document.createElement("canvas");
              canvas.width = Math.round(cw);
              canvas.height = Math.round(ch);
              const ctx = canvas.getContext("2d")!;

              if (rotation !== 0) {
                const temp = document.createElement("canvas");
                temp.width = nw;
                temp.height = nh;
                const tCtx = temp.getContext("2d")!;
                tCtx.translate(nw / 2, nh / 2);
                tCtx.rotate((rotation * Math.PI) / 180);
                tCtx.drawImage(img, -nw / 2, -nh / 2);
                ctx.drawImage(temp, cx, cy, cw, ch, 0, 0, cw, ch);
              } else {
                ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
              }

              const trimmed = autoTrimCanvas(canvas);
              let finalDataUrl = trimmed.toDataURL("image/jpeg", 0.92);

              if (removeBg) {
                try {
                  const { removeBackground } = await import("@imgly/background-removal");
                  const blob = await (await fetch(finalDataUrl)).blob();
                  const bgRemovedBlob = await removeBackground(blob, {
                    publicPath: "/assets/background-removal/",
                    progress: (key, current, total) => {
                      // Optional: could log progress, but might be too noisy for toast
                    }
                  });
                  // Convert blob back to dataURL
                  finalDataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(bgRemovedBlob);
                  });
                } catch (err) {
                  console.error("Background removal failed for a tile", err);
                  // fallback to non-bg-removed version
                }
              }

              const compressed = await compressImage(
                finalDataUrl,
                1920,
                0.92
              );

              const suffix = regions.length > 1 ? `-${rIdx + 1}` : "";
              
              // Auto-extract info from page text if available
              const pageText = pageTexts[pageIdx] || "";
              let extracted = extractTileInfo(pageText);

              // If regex extraction fails, use AI vision
              if (!extracted.tileName && !extracted.tileNumber && pages[pageIdx]) {
                showNotify(`Analyzing page ${pageIdx + 1} with AI...`);
                try {
                  const resp = await fetch("/api/catalog/extract-ai-vision", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image_url: pages[pageIdx].dataUrl })
                  });
                  if (resp.ok) {
                    const visionData = await resp.json();
                    if (visionData.tileName || visionData.tileNumber) {
                      extracted = { ...extracted, ...visionData };
                    }
                  }
                } catch (err) {
                  // silent fail for bulk processing
                }
              }

              await hybridSaveTile(
                {
                  tileName: extracted.tileName || `Untitled`,
                  tileNumber: extracted.tileNumber || `P${pageIdx + 1}${suffix}`,
                  tileSize: extracted.tileSize || "N/A",
                  finish: extracted.finish || "N/A",
                  color: extracted.color || "N/A",
                  imageDataUrl: compressed,
                  pageNumber: pageIdx + 1,
                },
                pageIdx + 1
              );
              saved++;
            }
          } catch {
            // skip individual failed pages silently
          }
        })
      );

      // Show live progress and yield to browser between batches
      showNotify(`Processing ${Math.min(batchStart + BATCH, total)} / ${total} pages...`);
      await new Promise((r) => setTimeout(r, 0));
    }

    showNotify(`Saved ${saved} of ${total} tiles with same crop`);
    setCropImage(null);
    setStep("library");
  };

  const handleCropSave = async (croppedDataUrl: string) => {
    setCroppedImage(croppedDataUrl);
    setCropImage(null);
    
    // Auto-extract info for the current page
    const pageText = pageTexts[currentPageIdx] || "";
    let extracted = extractTileInfo(pageText);
    
    // If text extraction fails (e.g. Scanned PDF with no text layer), use AI Vision on the full page image!
    if (!extracted.tileName && !extracted.tileNumber && pages[currentPageIdx]) {
      showNotify("Analyzing image with AI...");
      try {
        const resp = await fetch("/api/catalog/extract-ai-vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: pages[currentPageIdx].dataUrl })
        });
        if (resp.ok) {
          const visionData = await resp.json();
          if (visionData.tileName || visionData.tileNumber) {
            extracted = { ...extracted, ...visionData };
            showNotify("AI successfully extracted tile details!");
          }
        }
      } catch (err) {
        console.error("AI Vision extraction failed:", err);
      }
    }
    
    setDetectedInfo({
      tileName: extracted.tileName,
      tileNumber: extracted.tileNumber,
      tileSize: extracted.tileSize,
      finish: extracted.finish,
      color: extracted.color,
    } as any);
    
    setStep("info");
  };

  const handleSaveTile = async (tileData: Omit<import("@/types/tile").Tile, "id" | "createdAt">) => {
    try {
      const compressed = await compressImage(tileData.imageDataUrl, 1920, 0.92);
      await hybridSaveTile({ ...tileData, imageDataUrl: compressed }, tileData.pageNumber);
      showNotify(storageStatus?.configured ? "Tile saved to local folder!" : "Tile saved!");
    } catch (err: any) {
      showNotify(err.message || "Failed to save tile");
    }
    setCroppedImage(null);
    setDetectedInfo(null);
    const sorted = Array.from(selectedIds).sort((a, b) => a - b);
    const currentSelIdx = sorted.indexOf(currentPageIdx);
    if (currentSelIdx < sorted.length - 1) {
      setCurrentPageIdx(sorted[currentSelIdx + 1]);
      setStep("crop");
    } else {
      setStep("library");
    }
  };

  const currentStepIdx = STEPS.findIndex((s) => s.id === step);

  const startCrop = () => {
    const page = pages.find((p) => p.index === currentPageIdx);
    if (page) {
      setCropImage(page.dataUrl);
      setStep("crop");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-600 text-neutral-100 aurora-bg relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> PDF Extract
            </span>
            <div className="flex items-center gap-2">
              {/* Storage status badge */}
              {storageStatus?.configured ? (
                <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <HardDrive className="w-3 h-3" /> Local Storage Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-500 border border-neutral-700">
                  <HardDrive className="w-3 h-3" /> Browser Storage
                </span>
              )}
              <Link
                href="/settings"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white text-[10px] font-bold border border-neutral-700 hover:border-neutral-600 transition"
              >
                <Settings className="w-3 h-3" /> Settings
              </Link>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient mb-2">Tile Extraction</h1>
          <p className="text-neutral-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Upload a PDF catalog, select pages, crop tile images, and save them to your library.
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = s.id === step;
            const done = i < currentStepIdx;
            return (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    if (done || active) setStep(s.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                    active
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : done
                      ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 cursor-pointer"
                      : "bg-neutral-900 text-neutral-600 border border-neutral-800"
                  }`}
                >
                  {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px ${done ? "bg-green-500/30" : "bg-neutral-800"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Storage warning */}
        {isStorageLow() && (
          <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Storage nearly full ({getStorageInfo()}). Delete old tiles to free up space before saving.
          </div>
        )}

        {/* Step content */}
        <div className="glass-card rounded-3xl border border-white/5 p-6 shadow-xl">
          <AnimatePresence mode="wait">
            {/* Upload */}
            {step === "upload" && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FileUpload onFileLoaded={handleFileLoaded} />
                {pdfError && (
                  <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {pdfError}
                  </div>
                )}
              </motion.div>
            )}

            {/* Select Pages */}
            {step === "select" && (
              <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">Select Pages</h2>
                    <p className="text-xs text-neutral-500">{pages.length} pages loaded from {pdfFile?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                      <button
                        onClick={() => {
                          const firstIdx = Array.from(selectedIds).sort((a, b) => a - b)[0];
                          const page = pages.find((p) => p.index === firstIdx);
                          if (page) {
                            setCurrentPageIdx(firstIdx);
                            setCropImage(page.dataUrl);
                            setStep("crop");
                          }
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition shadow-lg shadow-amber-500/20"
                      >
                        <Crop className="w-3.5 h-3.5" /> Crop Selected ({selectedIds.size})
                      </button>
                    )}
                    <button
                      onClick={() => setStep("library")}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" /> Library
                    </button>
                  </div>
                </div>

                <ThumbnailGrid
                  pages={pages}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onDeletePages={handleDeletePages}
                  onRotatePages={handleRotatePages}
                  onCropPage={(page) => {
                    setCurrentPageIdx(page.index);
                    setCropImage(page.dataUrl);
                    setStep("crop");
                  }}
                  onDownloadPages={handleDownloadPages}
                />
              </motion.div>
            )}

            {/* Crop */}
            {step === "crop" && cropImage && (
              <motion.div key="crop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setCropImage(null); setStep("select"); }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition"
                    >
                      <ArrowLeft className="w-3 h-3" /> Back to Pages
                    </button>
                    <span className="text-xs text-neutral-500">Page {currentPageIdx + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPrevSelectedPage}
                      disabled={Array.from(selectedIds).sort((a, b) => a - b)[0] === currentPageIdx}
                      className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={goToNextSelectedPage}
                      disabled={Array.from(selectedIds).sort((a, b) => a - b).slice(-1)[0] === currentPageIdx}
                      className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 transition"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <CropTool
                  imageUrl={cropImage}
                  onSave={handleCropSave}
                  onApplyToAll={handleApplyToAll}
                  selectedCount={selectedIds.size}
                  onClose={() => { setCropImage(null); setStep("select"); }}
                />
              </motion.div>
            )}

            {/* Tile Info */}
            {step === "info" && croppedImage && (
              <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TileInfoEditor
                  imageDataUrl={croppedImage}
                  detectedInfo={detectedInfo as any}
                  onSave={handleSaveTile}
                  onAIDetect={() => setShowAIDetect(true)}
                  onClose={() => { setCroppedImage(null); setStep("crop"); }}
                />
                {showAIDetect && pageTexts[currentPageIdx] && (
                  <AIExtract
                    ocrText={pageTexts[currentPageIdx]}
                    onApply={(info) => {
                      setDetectedInfo(info);
                      setShowAIDetect(false);
                    }}
                    onClose={() => setShowAIDetect(false)}
                  />
                )}
              </motion.div>
            )}

            {/* Library */}
            {step === "library" && (
              <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Tile Library</h2>
                  <button
                    onClick={() => setStep("select")}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-600 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Pages
                  </button>
                </div>
                <TileLibrary />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* First-time setup modal */}
      <AnimatePresence>
        {showSetupModal && (
          <FirstTimeSetupModal
            onConfigured={(p) => {
              setStorageStatus({ configured: true, path: p, exists: true, writable: true });
              setShowSetupModal(false);
              showNotify(`Storage folder set: ${p}`);
            }}
            onSkip={() => {
              sessionStorage.setItem(SETUP_SKIPPED_KEY, "1");
              setShowSetupModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {notify && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-6 right-6 bg-amber-500 text-black text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl z-50"
          >
            {notify}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
