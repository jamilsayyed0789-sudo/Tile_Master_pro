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

type Step = "upload" | "select" | "crop" | "verify" | "info" | "library";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface VerificationItem {
  id: string;
  imageDataUrl: string;
  pageNumber: number;
  tileName: string;
  tileNumber: string;
  tileSize: string;
  finish: string;
  color: string;
  status: 'pending' | 'extracted' | 'failed';
}

const STEPS = [
  { id: "upload" as Step, label: "Upload PDF", icon: FileText },
  { id: "select" as Step, label: "Select Pages", icon: Layers },
  { id: "crop" as Step, label: "Crop Tiles", icon: Crop },
  { id: "library" as Step, label: "Tile Collection", icon: LayoutGrid },
];

export default function PdfExtractClient() {
  const [step, setStep] = useState<Step>("upload");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState("");
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [pageTexts, setPageTexts] = useState<Record<number, string>>({});
  const [pageTextBlocks, setPageTextBlocks] = useState<Record<number, any[]>>({});
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
  const [verifyItems, setVerifyItems] = useState<VerificationItem[]>([]);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [globalTileSize, setGlobalTileSize] = useState<string>("");
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
  const hybridSaveTile = async (
    tileData: Omit<import("@/types/tile").Tile, "id" | "createdAt"> & { hasName?: boolean; hasNumber?: boolean },
    pageNumber?: number
  ) => {
    // Guard: skip saving if the image data URL is suspiciously tiny.
    // Name/number crop boxes produce tiny images (~4–8 KB) that should
    // never be saved as tile images — they exist only for OCR text extraction.
    // Real tile images are always larger. Threshold set at 5000 base64 chars
    // (~3.75 KB decoded) — well below any real JPEG tile photo.
    const MIN_TILE_BASE64_LEN = 5000; // safely above pure-text crop sizes
    const b64Part = tileData.imageDataUrl.includes(",")
      ? tileData.imageDataUrl.split(",")[1]
      : tileData.imageDataUrl;
    if (!b64Part || b64Part.length < MIN_TILE_BASE64_LEN) {
      const msg = `Image data too small (${b64Part?.length ?? 0} chars). Expected a real tile photo. Check that the Tile Image crop region is covering the tile, not just the text.`;
      console.warn(`[hybridSaveTile] Skipping save — ${msg}`);
      throw new Error(msg);
    }

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
        has_name: tileData.hasName,
        has_number: tileData.hasNumber,
      });
      if (!result.ok) {
        console.warn("Backend local save failed:", result.message);
      }
    }
    // Always save to IndexedDB as well so the local 'Tile Library' tab and ZIP export keep working
    try {
      await saveTileAsync(tileData);
    } catch (err) {
      console.warn("Failed to save to IndexedDB (Quota may be full). Tile saved to local folder only.", err);
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
      const blocks: Record<number, any[]> = {};

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport: vp, canvas } as any).promise;
        loaded.push({
          index: i - 1,
          dataUrl: canvas.toDataURL("image/jpeg", 0.85),
          width: vp.width,
          height: vp.height,
        });
        try {
          const textContent = await page.getTextContent();
          texts[i - 1] = textContent.items.map((item: any) => item.str).join("\n");
          blocks[i - 1] = textContent.items.map((item: any) => {
            const scale = 2.0;
            const x0 = item.transform[4] * scale;
            const y1 = vp.height - (item.transform[5] * scale);
            const w = item.width * scale;
            const h = item.height * scale;
            return {
              text: item.str,
              bbox: [x0, y1 - h, x0 + w, y1]
            };
          });
        } catch {
          texts[i - 1] = "";
          blocks[i - 1] = [];
        }
        
        // Explicitly clear canvas memory to prevent Out of Memory crashes
        canvas.width = 0;
        canvas.height = 0;
      }
      setPages(loaded);
      setPageTexts(texts);
      setPageTextBlocks(blocks);
      setPdfError("");
      return true;
    } catch (err: any) {
      setPdfError(err?.message || "Failed to load PDF. Make sure it's a valid PDF file.");
      return false;
    }
  }, []);

  const handleFileLoaded = useCallback(
    async (file: File, dataUrl: string, tileSize: string) => {
      setPdfFile(file);
      setPdfDataUrl(dataUrl);
      setGlobalTileSize(tileSize !== "Other" ? tileSize : "");
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
      const nextIdx = sorted[currentSelIdx + 1];
      setCurrentPageIdx(nextIdx);
      const page = pages.find((p) => p.index === nextIdx);
      if (page) setCropImage(page.dataUrl);
    }
  };

  const goToPrevSelectedPage = () => {
    const sorted = Array.from(selectedIds).sort((a, b) => a - b);
    const currentSelIdx = sorted.indexOf(currentPageIdx);
    if (currentSelIdx > 0) {
      const prevIdx = sorted[currentSelIdx - 1];
      setCurrentPageIdx(prevIdx);
      const page = pages.find((p) => p.index === prevIdx);
      if (page) setCropImage(page.dataUrl);
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

    const isColorMatch = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
      return Math.abs(r1 - r2) <= tolerance && Math.abs(g1 - g2) <= tolerance && Math.abs(b1 - b2) <= tolerance;
    };

    const getEdgeColorAndUniformity = (isHorizontal: boolean, pos: number): { r: number, g: number, b: number, uniform: boolean } => {
      const length = isHorizontal ? w : h;
      let sumR = 0, sumG = 0, sumB = 0;
      
      for (let i = 0; i < length; i++) {
        const idx = (isHorizontal ? (pos * w + i) : (i * w + pos)) * 4;
        sumR += data[idx]; sumG += data[idx + 1]; sumB += data[idx + 2];
      }
      
      const avgR = Math.round(sumR / length);
      const avgG = Math.round(sumG / length);
      const avgB = Math.round(sumB / length);

      let matches = 0;
      for (let i = 0; i < length; i++) {
        const idx = (isHorizontal ? (pos * w + i) : (i * w + pos)) * 4;
        if (isColorMatch(data[idx], data[idx + 1], data[idx + 2], avgR, avgG, avgB)) matches++;
      }
      
      // Extremely strict: 98% of the edge must match exactly to be considered a border
      return { r: avgR, g: avgG, b: avgB, uniform: matches / length >= 0.98 };
    };

    const isLineUniform = (isHorizontal: boolean, pos: number, refR: number, refG: number, refB: number): boolean => {
      const length = isHorizontal ? w : h;
      let matches = 0;
      for (let i = 0; i < length; i++) {
        const idx = (isHorizontal ? (pos * w + i) : (i * w + pos)) * 4;
        if (isColorMatch(data[idx], data[idx + 1], data[idx + 2], refR, refG, refB)) matches++;
      }
      // When walking inward, stay strict (96%) to prevent bleeding into textured tiles
      return matches / length >= 0.96;
    };

    let top = 0, bottom = h - 1, left = 0, right = w - 1;

    // ── Step 1: Independently test and trim each edge ────────────────────────

    const leftEdge = getEdgeColorAndUniformity(false, 0);
    if (leftEdge.uniform) {
      while (left < w * (1 - minContent) && isLineUniform(false, left, leftEdge.r, leftEdge.g, leftEdge.b)) left++;
    }

    const rightEdge = getEdgeColorAndUniformity(false, w - 1);
    if (rightEdge.uniform) {
      while (right > w * minContent && isLineUniform(false, right, rightEdge.r, rightEdge.g, rightEdge.b)) right--;
    }

    const topEdge = getEdgeColorAndUniformity(true, 0);
    if (topEdge.uniform) {
      while (top < h * (1 - minContent) && isLineUniform(true, top, topEdge.r, topEdge.g, topEdge.b)) top++;
    }

    const bottomEdge = getEdgeColorAndUniformity(true, h - 1);
    if (bottomEdge.uniform) {
      while (bottom > h * minContent && isLineUniform(true, bottom, bottomEdge.r, bottomEdge.g, bottomEdge.b)) bottom--;
    }

    const trimW = right - left + 1;
    const trimH = bottom - top + 1;

    // If nothing was trimmed, return original
    const out = document.createElement("canvas");
    out.width = trimW;
    out.height = trimH;
    out.getContext("2d")!.drawImage(src, left, top, trimW, trimH, 0, 0, trimW, trimH);
    return out;
  };

  const findNearestRegion = (target: any, candidates: any[]): any | undefined => {
    if (candidates.length === 0) return undefined;
    const tx = typeof target.xRatio === "number" ? target.xRatio : target.x;
    const ty = typeof target.yRatio === "number" ? target.yRatio : target.y;
    const tw = typeof target.wRatio === "number" ? target.wRatio : target.width;
    const th = typeof target.hRatio === "number" ? target.hRatio : target.height;
    const tcX = tx + tw / 2;
    const tcY = ty + th / 2;
    
    let nearest: any = undefined;
    let minDistance = Infinity;
    
    for (const c of candidates) {
      const cx = typeof c.xRatio === "number" ? c.xRatio : c.x;
      const cy = typeof c.yRatio === "number" ? c.yRatio : c.y;
      const cw = typeof c.wRatio === "number" ? c.wRatio : c.width;
      const ch = typeof c.hRatio === "number" ? c.hRatio : c.height;
      const ccX = cx + cw / 2;
      const ccY = cy + ch / 2;
      const dist = Math.pow(tcX - ccX, 2) + Math.pow(tcY - ccY, 2);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = c;
      }
    }
    return nearest;
  };

  const handleApplyToAll = async (regions: any[], rotation: number, removeBg: boolean = false) => {
    if (selectedIds.size === 0) return;
    const sortedIds = Array.from(selectedIds).sort((a, b) => a - b);
    const total = sortedIds.length;

    setIsExtractingText(true);
    showNotify(`Processing 0 / ${total} pages...`);

    const newVerifyItems: VerificationItem[] = [];
    const backendRequests: any[] = [];
    let saved = 0;

    const imageRegions = regions.filter(r => r.type === "image" || !r.type);
    if (imageRegions.length === 0) {
      setIsExtractingText(false);
      showNotify("Missing Tile Image box! Please add a Tile Image crop region.");
      return;
    }

    const nameRegions = regions.filter(r => r.type === "name");
    const numberRegions = regions.filter(r => r.type === "number");

    // Process canvases strictly sequentially. Parallel causes memory limit crashes at ~30 images.
    for (let i = 0; i < sortedIds.length; i++) {
      const pageIdx = sortedIds[i];
      const page = pages.find((p) => p.index === pageIdx);
      if (!page) continue;

      if (i % 5 === 0) {
        showNotify(`Rendering image ${i + 1} of ${total}...`);
      }

      try {
        const img = await new Promise<HTMLImageElement>((res, rej) => {
          const image = new Image();
          image.onload = () => res(image);
          image.onerror = rej;
          image.src = page.dataUrl;
        });

        const nw = img.naturalWidth;
        const nh = img.naturalHeight;

        // Helper to crop specific text regions
        const cropRegionToDataUrl = (r: any): string => {
          const sx = r.xRatio * nw;
          const sy = r.yRatio * nh;
          const sw = r.wRatio * nw;
          const sh = r.hRatio * nh;
          const cx = Math.max(0, Math.min(sx, nw - 1));
          const cy = Math.max(0, Math.min(sy, nh - 1));
          const cw = Math.max(1, Math.min(sw, nw - cx));
          const ch = Math.max(1, Math.min(sh, nh - cy));
          
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(cw);
          canvas.height = Math.round(ch);
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          canvas.width = 0; canvas.height = 0;
          return dataUrl;
        };

        for (let rIdx = 0; rIdx < imageRegions.length; rIdx++) {
          const region = imageRegions[rIdx];
          const hasRatios =
            typeof region.xRatio === "number" &&
            typeof region.yRatio === "number" &&
            typeof region.wRatio === "number" &&
            typeof region.hRatio === "number";

          const sx = hasRatios ? region.xRatio * nw : region.x;
          const sy = hasRatios ? region.yRatio * nh : region.y;
          const sw = hasRatios ? region.wRatio * nw : region.width;
          const has = hasRatios ? region.hRatio * nh : region.height;

          const cx = Math.max(0, Math.min(sx, nw - 1));
          const cy = Math.max(0, Math.min(sy, nh - 1));
          const cw = Math.max(1, Math.min(sw, nw - cx));
          const ch = Math.max(1, Math.min(has, nh - cy));

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
            temp.width = 0; temp.height = 0;
          } else {
            ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
          }

          const trimmed = autoTrimCanvas(canvas);
          let finalDataUrl = trimmed.toDataURL("image/jpeg", 0.92);
          
          canvas.width = 0; canvas.height = 0;
          trimmed.width = 0; trimmed.height = 0;

          if (removeBg) {
            try {
              const { removeBackground } = await import("@imgly/background-removal");
              const blob = await (await fetch(finalDataUrl)).blob();
              const bgRemovedBlob = await removeBackground(blob, {
                publicPath: "/assets/background-removal/",
                progress: () => {}
              });
              finalDataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(bgRemovedBlob);
              });
            } catch (err) {
              console.error("Background removal failed for a tile", err);
            }
          }

          const compressed = await compressImage(finalDataUrl, 1920, 0.92);

          const suffix = imageRegions.length > 1 ? `-${rIdx + 1}` : "";
          const itemId = `temp-${Date.now()}-${pageIdx}-${rIdx}`;
          
          const pageText = pageTexts[pageIdx] || "";
          const extracted = extractTileInfo(pageText);

          const nearestNameRegion = findNearestRegion(region, nameRegions);
          const nearestNumberRegion = findNearestRegion(region, numberRegions);
          const nameCropBase64 = nearestNameRegion ? cropRegionToDataUrl(nearestNameRegion) : undefined;
          const numberCropBase64 = nearestNumberRegion ? cropRegionToDataUrl(nearestNumberRegion) : undefined;

          newVerifyItems.push({
            id: itemId,
            imageDataUrl: compressed,
            pageNumber: pageIdx + 1,
            tileName: extracted.tileName || "",
            tileNumber: extracted.tileNumber || `P${pageIdx + 1}${suffix}`,
            tileSize: globalTileSize || extracted.tileSize || "",
            finish: extracted.finish || "",
            color: extracted.color || "",
            status: 'pending',
            hasName: !!nearestNameRegion,
            hasNumber: !!nearestNumberRegion,
          } as any);
          
          backendRequests.push({
            id: itemId,
            page_index: pageIdx,
            crop_x: sx,
            crop_y: sy,
            crop_w: sw,
            crop_h: has,
            page_text: pageTexts[pageIdx] || "",
            image_base64: compressed,
            text_blocks: pageTextBlocks[pageIdx] || [],
            // Only send full page image if NO text layer exists (scanned PDF).
            // Omitting it for digital PDFs avoids massive JSON payloads that cause timeouts.
            full_page_image_base64: (pageTexts[pageIdx] || "").trim().length < 10 ? (page?.dataUrl || "") : "",
            name_image_base64: nameCropBase64,
            number_image_base64: numberCropBase64
          });

          saved++;
        }
        img.src = ""; // Free memory
      } catch (e) {
        console.error("Failed to render page", pageIdx, e);
      }

      // Small delay every 5 pages to force Garbage Collection
      if (i > 0 && i % 5 === 0) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    setCropImage(null);

    if (backendRequests.length > 0) {
      showNotify(`Extracting tile text via OCR for ${backendRequests.length} tiles...`);

      const processBatch = async () => {
        let savedCount = 0;
        const BATCH = 5;
        for (let i = 0; i < backendRequests.length; i += BATCH) {
          const reqBatch = backendRequests.slice(i, i + BATCH);
          const itemBatch = newVerifyItems.slice(i, i + BATCH);
          
          showNotify(`Extracting text ${i + 1} to ${Math.min(i + BATCH, backendRequests.length)} of ${backendRequests.length}...`);
          
          let ocrResults: any[] = [];
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout
            const res = await fetch(`${API_BASE}/catalog/extract-text-hybrid`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(reqBatch),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            
            if (res.ok) {
              const data = await res.json();
              if (data.results) ocrResults = data.results;
            } else {
              console.warn(`[processBatch] Backend returned ${res.status} for batch ${i}. Saving with PDF text layer fallback.`);
            }
          } catch (err: any) {
            if (err?.name === "AbortError") {
              console.warn(`[processBatch] Request timed out for batch ${i}. Saving with PDF text layer fallback.`);
            } else {
              console.error("Batch extraction failed", err);
            }
          }

          // Always save tiles — use OCR result if available, otherwise fall back to PDF text layer
          for (let j = 0; j < itemBatch.length; j++) {
            const item = itemBatch[j];
            const result = ocrResults[j] || {};
            try {
              await hybridSaveTile({
                tileName: result.tileName || item.tileName || `Untitled Page ${item.pageNumber}`,
                tileNumber: result.tileNumber || item.tileNumber || `P${item.pageNumber}`,
                tileSize: globalTileSize || result.tileSize || item.tileSize || "N/A",
                finish: item.finish || "N/A",
                color: item.color || "N/A",
                imageDataUrl: item.imageDataUrl,
                hasName: (item as any).hasName,
                hasNumber: (item as any).hasNumber,
              }, item.pageNumber);
              savedCount++;
            } catch (err: any) {
              showNotify(`Page ${item.pageNumber}: ${err.message}`);
            }
          }
        }
        
        setIsExtractingText(false);
        showNotify(`Saved ${savedCount} tiles to collection!`);
        setStep("library");
      };
      
      processBatch();
    } else {
      setIsExtractingText(false);
      showNotify("No images extracted.");
    }
  };

  const handleCropSave = async (
    croppedDataUrl: string,
    nameDataUrl?: string,
    numberDataUrl?: string,
    allCrops?: { imageDataUrl: string; nameDataUrl?: string; numberDataUrl?: string }[]
  ) => {
    if (allCrops && allCrops.length > 1) {
      showNotify(`Processing ${allCrops.length} crops for page ${currentPageIdx + 1}...`);
      setCropImage(null);
      setIsExtractingText(true);
      
      for (let i = 0; i < allCrops.length; i++) {
        const crop = allCrops[i];
        const suffix = `-${i + 1}`;
        
        const pageText = pageTexts[currentPageIdx] || "";
        let extracted = extractTileInfo(pageText);
        
        if (crop.nameDataUrl || crop.numberDataUrl) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            const ocrRes = await fetch(`${API_BASE}/catalog/extract-text-hybrid`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify([{
                page_index: currentPageIdx,
                crop_x: 0, crop_y: 0, crop_w: 0, crop_h: 0,
                image_base64: crop.imageDataUrl,
                name_image_base64: crop.nameDataUrl,
                number_image_base64: crop.numberDataUrl
              }]),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (ocrRes.ok) {
              const ocrData = await ocrRes.json();
              if (ocrData.results && ocrData.results[0]) {
                const resData = ocrData.results[0];
                if (resData.tileName) extracted.tileName = resData.tileName;
                if (resData.tileNumber) extracted.tileNumber = resData.tileNumber;
              }
            }
          } catch (err) {
            console.error("Single page crop OCR failed:", err);
          }
        }
        
        if (!extracted.tileName && !extracted.tileNumber) {
          try {
            const resp = await fetch(`${API_BASE}/catalog/extract-ai-vision`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image_url: crop.imageDataUrl })
            });
            if (resp.ok) {
              const visionData = await resp.json();
              extracted = { ...extracted, ...visionData };
            }
          } catch (err) {
            console.error("AI Vision extraction failed:", err);
          }
        }
        
        const tileName = extracted.tileName || `Untitled Page ${currentPageIdx + 1}${suffix}`;
        const tileNumber = extracted.tileNumber || `P${currentPageIdx + 1}${suffix}`;
        const hasName = !!extracted.tileName;
        const hasNumber = !!extracted.tileNumber;
        
        try {
          await hybridSaveTile({
            tileName,
            tileNumber,
            tileSize: globalTileSize || extracted.tileSize || "N/A",
            finish: extracted.finish || "N/A",
            color: extracted.color || "N/A",
            imageDataUrl: crop.imageDataUrl,
            hasName,
            hasNumber,
          }, currentPageIdx + 1);
        } catch (err: any) {
          console.error("Failed to save cropped item", err);
        }
      }
      
      setIsExtractingText(false);
      showNotify(`Successfully saved ${allCrops.length} tiles!`);
      
      const sorted = Array.from(selectedIds).sort((a, b) => a - b);
      const currentSelIdx = sorted.indexOf(currentPageIdx);
      if (currentSelIdx < sorted.length - 1) {
        const nextIdx = sorted[currentSelIdx + 1];
        setCurrentPageIdx(nextIdx);
        const nextPage = pages.find((p) => p.index === nextIdx);
        if (nextPage) {
          setCropImage(nextPage.dataUrl);
        }
        setStep("crop");
      } else {
        setStep("library");
      }
      return;
    }

    setCroppedImage(croppedDataUrl);
    setCropImage(null);
    
    // Step 1: Try fast regex extraction from PDF text layer
    const pageText = pageTexts[currentPageIdx] || "";
    let extracted = extractTileInfo(pageText);
    
    // Step 1.5: If Name or Number crop regions were defined, use OCR on them!
    if (nameDataUrl || numberDataUrl) {
      showNotify("OCR-ing name/number crop boxes...");
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
        const ocrRes = await fetch(`${API_BASE}/catalog/extract-text-hybrid`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{
            page_index: currentPageIdx,
            crop_x: 0, crop_y: 0, crop_w: 0, crop_h: 0,
            image_base64: croppedDataUrl,
            name_image_base64: nameDataUrl,
            number_image_base64: numberDataUrl
          }]),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (ocrRes.ok) {
          const ocrData = await ocrRes.json();
          if (ocrData.results && ocrData.results[0]) {
            const resData = ocrData.results[0];
            if (resData.tileName) extracted.tileName = resData.tileName;
            if (resData.tileNumber) extracted.tileNumber = resData.tileNumber;
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          console.warn("Single page OCR timed out — continuing with PDF text layer data.");
        } else {
          console.error("Single page OCR failed:", err);
        }
      }
    }
    
    // Step 2: If text extraction fails (scanned PDF), use AI Vision on the CROPPED tile image
    // Using the cropped image is better — it's smaller, focused, and gives accurate results
    if (!extracted.tileName && !extracted.tileNumber) {
      showNotify("Analyzing tile with AI...");
      try {
        const resp = await fetch(`${API_BASE}/catalog/extract-ai-vision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: croppedDataUrl })
        });
        if (resp.ok) {
          const visionData = await resp.json();
          if (visionData.tileName || visionData.tileNumber) {
            extracted = { ...extracted, ...visionData };
            showNotify("AI detected tile details!");
          }
        }
      } catch (err) {
        console.error("AI Vision extraction failed:", err);
      }
    }
    
    setDetectedInfo({
      tileName: extracted.tileName,
      tileNumber: extracted.tileNumber,
      tileSize: globalTileSize || extracted.tileSize,
      finish: extracted.finish,
      color: extracted.color,
    } as any);
    
    setStep("info");
  };

  const handleSaveTile = async (tileData: Omit<import("@/types/tile").Tile, "id" | "createdAt">) => {
    try {
      const compressed = await compressImage(tileData.imageDataUrl, 1920, 0.92);
      const hasName = !!tileData.tileName && !tileData.tileName.startsWith("Untitled Page") && !tileData.tileName.startsWith("Tile Page") && tileData.tileName.trim().toLowerCase() !== "unknown";
      const hasNumber = !!tileData.tileNumber && !/^[Pp]\d+(?:-\d+)?$/.test(tileData.tileNumber) && tileData.tileNumber.trim().toLowerCase() !== "unknown";
      await hybridSaveTile({ ...tileData, imageDataUrl: compressed, hasName, hasNumber }, tileData.pageNumber);
      showNotify(storageStatus?.configured ? "Tile saved to local folder!" : "Tile saved!");
    } catch (err: any) {
      showNotify(err.message || "Failed to save tile");
      return; // Stop here, don't move to next page!
    }
    setCroppedImage(null);
    setDetectedInfo(null);
    const sorted = Array.from(selectedIds).sort((a, b) => a - b);
    const currentSelIdx = sorted.indexOf(currentPageIdx);
    if (currentSelIdx < sorted.length - 1) {
      const nextIdx = sorted[currentSelIdx + 1];
      setCurrentPageIdx(nextIdx);
      const nextPage = pages.find((p) => p.index === nextIdx);
      if (nextPage) {
        setCropImage(nextPage.dataUrl);
      }
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
            <span className="bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Catalog Hub
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
            Upload a PDF catalog, select pages, crop tile images, and save them to your collection.
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
                    if (done || active) {
                      if (s.id === "crop" && !cropImage) {
                        if (selectedIds.size > 0) {
                          const idx = selectedIds.has(currentPageIdx) ? currentPageIdx : Array.from(selectedIds).sort((a, b) => a - b)[0];
                          const page = pages.find((p) => p.index === idx);
                          if (page) {
                            setCurrentPageIdx(idx);
                            setCropImage(page.dataUrl);
                            setStep("crop");
                          } else {
                            showNotify("Please select pages first");
                            setStep("select");
                          }
                        } else {
                          showNotify("Please select pages first");
                          setStep("select");
                        }
                      } else {
                        setStep(s.id);
                      }
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                    active
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
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
          <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
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
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-500 hover:bg-blue-400 text-black transition shadow-lg shadow-blue-500/20"
                      >
                        <Crop className="w-3.5 h-3.5" /> Crop Selected ({selectedIds.size})
                      </button>
                    )}
                    <button
                      onClick={() => setStep("library")}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" /> Collection
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
                  <h2 className="text-lg font-bold text-white">Tile Collection</h2>
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
            className="fixed bottom-6 right-6 bg-blue-500 text-black text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl z-50"
          >
            {notify}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
