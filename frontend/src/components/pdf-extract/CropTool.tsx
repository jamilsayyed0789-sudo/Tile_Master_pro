"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crop, ZoomIn, ZoomOut, RotateCw, RotateCcw, Undo2, Check, X, Maximize2, Plus, Trash2 } from "lucide-react";
import type { CropRegion } from "@/types/tile";

interface Props {
  imageUrl: string;
  onSave: (croppedDataUrl: string) => void;
  onApplyToAll?: (regions: CropRegion[], rotation: number, removeBg: boolean) => void;
  selectedCount?: number;
  onClose: () => void;
}

type Handle = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top" | "bottom" | "left" | "right" | "move" | null;

const MIN_SIZE = 20;

export default function CropTool({ imageUrl, onSave, onApplyToAll, selectedCount, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [removeBg, setRemoveBg] = useState(false);
  const [crops, setCrops] = useState<CropRegion[]>([{ x: 10, y: 10, width: 400, height: 300 }]);
  const [activeCropIndex, setActiveCropIndex] = useState(0);
  const [dragging, setDragging] = useState<Handle>(null);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, crop: { x: 0, y: 0, width: 0, height: 0 } });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");

  const activeCrop = crops[activeCropIndex] || crops[0];

  const updateActiveCrop = useCallback((updater: (prev: CropRegion) => CropRegion) => {
    setCrops((prev) => {
      const next = [...prev];
      if (next[activeCropIndex]) {
        next[activeCropIndex] = updater(next[activeCropIndex]);
      }
      return next;
    });
  }, [activeCropIndex]);

  const initCrop = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    const w = img.clientWidth;
    const h = img.clientHeight;
    const margin = Math.round(Math.min(w, h) * 0.05);
    setCrops([{ x: margin, y: margin, width: w - margin * 2, height: h - margin * 2 }]);
    setActiveCropIndex(0);
    setImageLoaded(true);
  }, []);

  const fitToImage = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    const w = img.clientWidth;
    const h = img.clientHeight;
    const margin = Math.round(Math.min(w, h) * 0.05);
    updateActiveCrop(() => ({ x: margin, y: margin, width: w - margin * 2, height: h - margin * 2 }));
  }, [updateActiveCrop]);

  const resetCrop = useCallback(() => {
    fitToImage();
    setZoom(1);
    setRotation(0);
  }, [fitToImage]);

  const addCrop = () => {
    const img = imageRef.current;
    if (!img) return;
    const w = img.clientWidth;
    const h = img.clientHeight;
    const newCrop = { x: w * 0.25, y: h * 0.25, width: w * 0.5, height: h * 0.5 };
    setCrops((prev) => [...prev, newCrop]);
    setActiveCropIndex(crops.length);
  };

  const removeActiveCrop = () => {
    if (crops.length <= 1) return;
    setCrops((prev) => prev.filter((_, i) => i !== activeCropIndex));
    setActiveCropIndex((prev) => Math.max(0, prev - 1));
  };

  const handleMouseDown = (e: React.MouseEvent, handle: Handle, cropIndex: number) => {
    e.preventDefault();
    if (cropIndex !== activeCropIndex) {
      setActiveCropIndex(cropIndex);
    }
    setDragging(handle);
    setDragStart({ mx: e.clientX, my: e.clientY, crop: { ...crops[cropIndex] } });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStart.mx;
      const dy = e.clientY - dragStart.my;
      const c = dragStart.crop;

      updateActiveCrop(() => {
        let { x, y, width, height } = c;

        if (dragging === "move") {
          x = c.x + dx;
          y = c.y + dy;
        } else {
          if (dragging.includes("right")) width = Math.max(MIN_SIZE, c.width + dx);
          if (dragging.includes("left")) {
            width = Math.max(MIN_SIZE, c.width - dx);
            x = c.x + dx;
          }
          if (dragging.includes("bottom")) height = Math.max(MIN_SIZE, c.height + dy);
          if (dragging.includes("top")) {
            height = Math.max(MIN_SIZE, c.height - dy);
            y = c.y + dy;
          }
        }
        return { x, y, width, height };
      });
    },
    [dragging, dragStart, updateActiveCrop]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const cropToCanvas = useCallback((img: HTMLImageElement, cr: CropRegion, rot: number): string => {
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    const sx = cr.x * scaleX;
    const sy = cr.y * scaleY;
    const sw = cr.width * scaleX;
    const sh = cr.height * scaleY;
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d")!;
    if (rot !== 0) {
      const temp = document.createElement("canvas");
      temp.width = img.naturalWidth;
      temp.height = img.naturalHeight;
      const tCtx = temp.getContext("2d")!;
      tCtx.translate(img.naturalWidth / 2, img.naturalHeight / 2);
      tCtx.rotate((rot * Math.PI) / 180);
      tCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.drawImage(temp, sx, sy, sw, sh, 0, 0, sw, sh);
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    }
    return canvas.toDataURL("image/jpeg", 0.92);
  }, []);

  const applyCrop = async () => {
    const img = imageRef.current;
    if (!img) return;
    setIsProcessing(true);
    let dataUrl = cropToCanvas(img, activeCrop, rotation);
    
    if (removeBg) {
      try {
        setProgressText("Loading AI models...");
        const { removeBackground } = await import("@imgly/background-removal");
        const blob = await (await fetch(dataUrl)).blob();
        const bgRemovedBlob = await removeBackground(blob, {
          publicPath: "/assets/background-removal/",
          progress: (key, current, total) => {
            if (key.includes("fetch") && total) {
              const percent = Math.round((current / total) * 100);
              setProgressText(`Downloading AI... ${percent}%`);
            } else if (key.includes("compute")) {
              setProgressText("Removing background...");
            }
          }
        });
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(bgRemovedBlob);
        });
      } catch (err) {
        console.error("Background removal failed", err);
      } finally {
        setProgressText("");
      }
    }
    
    setIsProcessing(false);
    onSave(dataUrl);
  };

  const nudge = (dx: number, dy: number) => {
    updateActiveCrop((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const handles: { key: Handle; cx: number; cy: number; cursor: string }[] = [
    { key: "top-left", cx: 0, cy: 0, cursor: "nw-resize" },
    { key: "top-right", cx: 1, cy: 0, cursor: "ne-resize" },
    { key: "bottom-left", cx: 0, cy: 1, cursor: "sw-resize" },
    { key: "bottom-right", cx: 1, cy: 1, cursor: "se-resize" },
    { key: "top", cx: 0.5, cy: 0, cursor: "n-resize" },
    { key: "bottom", cx: 0.5, cy: 1, cursor: "s-resize" },
    { key: "left", cx: 0, cy: 0.5, cursor: "w-resize" },
    { key: "right", cx: 1, cy: 0.5, cursor: "e-resize" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-neutral-900 rounded-2xl border border-neutral-800 w-full max-w-5xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Crop className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-white">Multi-Crop Tile Image</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={addCrop} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition text-xs font-bold" title="Add another crop box">
                <Plus className="w-3.5 h-3.5" /> Add Crop
              </button>
              {crops.length > 1 && (
                <button onClick={removeActiveCrop} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition text-xs font-bold" title="Remove active crop box">
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
              <div className="w-px h-5 bg-neutral-800 mx-1" />
              <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.15))} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition" title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-neutral-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(3, z + 0.15))} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition" title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-neutral-800 mx-1" />
              <button onClick={fitToImage} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition" title="Fit to Image">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button onClick={() => setRotation((r) => r - 90)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition" title="Rotate Left">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => setRotation((r) => r + 90)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition" title="Rotate Right">
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image area + live preview side by side */}
          <div className="flex flex-col lg:flex-row">
            {/* Main crop area */}
            <div
              ref={containerRef}
              className="relative overflow-hidden bg-neutral-950 flex items-center justify-center flex-1"
              style={{ height: "500px", minHeight: "300px" }}
              tabIndex={0}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 10 : 1;
                switch (e.key) {
                  case "ArrowUp": nudge(0, -step); e.preventDefault(); break;
                  case "ArrowDown": nudge(0, step); e.preventDefault(); break;
                  case "ArrowLeft": nudge(-step, 0); e.preventDefault(); break;
                  case "ArrowRight": nudge(step, 0); e.preventDefault(); break;
                }
              }}
            >
              <div
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.15s ease-out",
                  position: "relative",
                }}
              >
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Crop target"
                  className="max-w-none shadow-lg"
                  style={{ maxHeight: "460px", maxWidth: "85vw" }}
                  draggable={false}
                  onLoad={initCrop}
                />
                {/* Crop overlays */}
                <div className="absolute inset-0">
                  <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
                    <defs>
                      <mask id="cropMask">
                        <rect width="100%" height="100%" fill="white" />
                        {crops.map((c, i) => (
                          <rect key={i} x={c.x} y={c.y} width={c.width} height={c.height} fill="black" />
                        ))}
                      </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#cropMask)" />
                  </svg>
                  
                  {crops.map((c, i) => {
                    const isActive = i === activeCropIndex;
                    return (
                      <div
                        key={i}
                        className={`absolute border-2 shadow-inner cursor-move ${isActive ? 'border-amber-400 z-20' : 'border-neutral-500 z-10 opacity-70 hover:opacity-100 hover:border-amber-200'}`}
                        style={{
                          left: c.x,
                          top: c.y,
                          width: c.width,
                          height: c.height,
                          pointerEvents: "auto",
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (e.target === e.currentTarget) handleMouseDown(e, "move", i);
                        }}
                      >
                        {isActive && handles.map((h) => (
                          <div
                            key={h.key}
                            className="absolute w-5 h-5 bg-amber-400 border-2 border-black rounded-sm shadow-lg hover:scale-125 transition-transform z-10"
                            style={{
                              left: `calc(${h.cx * 100}% - 10px)`,
                              top: `calc(${h.cy * 100}% - 10px)`,
                              cursor: h.cursor,
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(e, h.key, i);
                            }}
                          />
                        ))}
                        {/* Box label */}
                        <div className={`absolute top-0 left-0 px-1.5 py-0.5 text-[9px] font-bold ${isActive ? 'bg-amber-400 text-black' : 'bg-neutral-600 text-white'}`}>
                          {i + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Keyboard hint */}
              <div className="absolute bottom-3 left-3 text-[9px] text-neutral-600 bg-black/60 px-2 py-1 rounded-md">
                Arrow keys to nudge · Shift+Arrow for 10px jump
              </div>
            </div>

            {/* Live preview */}
            {imageLoaded && (
              <div className="w-full lg:w-56 border-t lg:border-t-0 lg:border-l border-neutral-800 p-4 flex flex-col items-center justify-center bg-neutral-950/50">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-3">Preview (Box {activeCropIndex + 1})</span>
                <div className="w-full aspect-square rounded-lg overflow-hidden border border-neutral-700 bg-neutral-900 shadow-inner">
                  <img
                    src={cropToCanvas(imageRef.current!, activeCrop, rotation)}
                    alt="Crop preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="mt-2 text-xs font-mono text-neutral-500 text-center">
                  {Math.round(activeCrop.width)} × {Math.round(activeCrop.height)}px
                </div>
                <div className="mt-3 text-[10px] text-neutral-600 text-center leading-relaxed">
                  <span className="block">Add multiple crops with +</span>
                  <span className="block">Click a crop to select it</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-800">
            <span className="text-xs text-neutral-500">
              {crops.length} crop regions defined
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              {/* Bg remove toggle */}
              <button
                onClick={() => setRemoveBg(v => !v)}
                title="Remove background from each cropped tile using AI"
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition ${
                  removeBg
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/10'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                }`}
              >
                <span className="text-sm">✨</span>
                {removeBg ? 'BG Remove ON' : 'BG Remove'}
              </button>
              {onApplyToAll && selectedCount && selectedCount > 0 && (
                <button
                  onClick={() => {
                    const img = imageRef.current;
                    if (!img) return;
                    
                    const displayW = img.clientWidth;
                    const displayH = img.clientHeight;
                    const nw = img.naturalWidth;
                    const nh = img.naturalHeight;
                    
                    const normalizedRegions = crops.map(c => ({
                      x: (c.x / displayW) * nw,
                      y: (c.y / displayH) * nh,
                      width: (c.width / displayW) * nw,
                      height: (c.height / displayH) * nh,
                      xRatio: c.x / displayW,
                      yRatio: c.y / displayH,
                      wRatio: c.width / displayW,
                      hRatio: c.height / displayH,
                    })) as any;
                    
                    onApplyToAll(normalizedRegions, rotation, removeBg);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-500 hover:bg-blue-400 text-white transition shadow-lg shadow-blue-500/20"
                >
                  <Check className="w-3.5 h-3.5" /> Apply All ({crops.length}) to Pages ({selectedCount})
                </button>
              )}
              <button
                onClick={applyCrop}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" /> {progressText || "Processing..."}
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Save Selected Tile
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
