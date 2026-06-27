"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crop, ZoomIn, ZoomOut, RotateCw, RotateCcw, Undo2, Check, X, Maximize2, Plus, Trash2 } from "lucide-react";
import type { CropRegion } from "@/types/tile";

interface Props {
  imageUrl: string;
  onSave: (
    croppedDataUrl: string,
    nameDataUrl?: string,
    numberDataUrl?: string,
    allCrops?: { imageDataUrl: string; nameDataUrl?: string; numberDataUrl?: string }[]
  ) => void;
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
  const [crops, setCrops] = useState<CropRegion[]>([{ x: 10, y: 10, width: 400, height: 300, type: "image" }]);
  const [activeCropIndex, setActiveCropIndex] = useState(0);
  const [dragging, setDragging] = useState<Handle>(null);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, crop: { x: 0, y: 0, width: 0, height: 0 } });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");

  const activeCrop = crops[activeCropIndex] || crops[0];

  const updateActiveCrop = useCallback((updater: (prev: CropRegion) => Partial<CropRegion>) => {
    setCrops((prev) => {
      const next = [...prev];
      if (next[activeCropIndex]) {
        next[activeCropIndex] = { ...next[activeCropIndex], ...updater(next[activeCropIndex]) };
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
    setCrops([{ x: margin, y: margin, width: w - margin * 2, height: h - margin * 2, type: "image" }]);
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

  const addNameCrop = () => {
    const img = imageRef.current;
    if (!img) return;
    const w = img.clientWidth;
    const h = img.clientHeight;
    const newCrop: CropRegion = { x: w * 0.1, y: h * 0.75, width: w * 0.4, height: Math.min(50, h * 0.12), type: "name" };
    setCrops((prev) => [...prev, newCrop]);
    setTimeout(() => {
      setCrops((prev) => {
        setActiveCropIndex(prev.length - 1);
        return prev;
      });
    }, 50);
  };

  const addNumberCrop = () => {
    const img = imageRef.current;
    if (!img) return;
    const w = img.clientWidth;
    const h = img.clientHeight;
    const newCrop: CropRegion = { x: w * 0.55, y: h * 0.75, width: w * 0.35, height: Math.min(50, h * 0.12), type: "number" };
    setCrops((prev) => [...prev, newCrop]);
    setTimeout(() => {
      setCrops((prev) => {
        setActiveCropIndex(prev.length - 1);
        return prev;
      });
    }, 50);
  };

  const addImageCrop = () => {
    const img = imageRef.current;
    if (!img) return;
    const w = img.clientWidth;
    const h = img.clientHeight;
    const newCrop: CropRegion = { x: w * 0.25, y: h * 0.25, width: w * 0.5, height: h * 0.5, type: "image" };
    setCrops((prev) => [...prev, newCrop]);
    setTimeout(() => {
      setCrops((prev) => {
        setActiveCropIndex(prev.length - 1);
        return prev;
      });
    }, 50);
  };

  const removeActiveCrop = () => {
    const active = crops[activeCropIndex];
    if (!active) return;
    if (active.type === "image" && crops.filter(c => c.type === "image").length <= 1) {
      return;
    }
    setCrops((prev) => prev.filter((_, i) => i !== activeCropIndex));
    setActiveCropIndex(0);
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
    
    const imageCrops = crops.filter(c => c.type === "image" || !c.type);
    const nameCrops = crops.filter(c => c.type === "name");
    const numberCrops = crops.filter(c => c.type === "number");
    
    setIsProcessing(true);

    const findNearest = (target: CropRegion, candidates: CropRegion[]): CropRegion | undefined => {
      if (candidates.length === 0) return undefined;
      const tcX = target.x + target.width / 2;
      const tcY = target.y + target.height / 2;
      let nearest: CropRegion | undefined = undefined;
      let minDistance = Infinity;
      for (const c of candidates) {
        const ccX = c.x + c.width / 2;
        const ccY = c.y + c.height / 2;
        const dist = Math.pow(tcX - ccX, 2) + Math.pow(tcY - ccY, 2);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = c;
        }
      }
      return nearest;
    };
    
    try {
      const croppedItems = await Promise.all(
        imageCrops.map(async (imageCrop) => {
          let dataUrl = cropToCanvas(img, imageCrop, rotation);
          const nearestName = findNearest(imageCrop, nameCrops);
          const nearestNumber = findNearest(imageCrop, numberCrops);
          
          const nameDataUrl = nearestName ? cropToCanvas(img, nearestName, rotation) : undefined;
          const numberDataUrl = nearestNumber ? cropToCanvas(img, nearestNumber, rotation) : undefined;
          
          if (removeBg) {
            try {
              setProgressText("Removing background...");
              const { removeBackground } = await import("@imgly/background-removal");
              const blob = await (await fetch(dataUrl)).blob();
              const bgRemovedBlob = await removeBackground(blob, {
                publicPath: "/assets/background-removal/",
                progress: () => {}
              });
              dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(bgRemovedBlob);
              });
            } catch (err) {
              console.error("Background removal failed for crop item", err);
            }
          }
          
          return {
            imageDataUrl: dataUrl,
            nameDataUrl,
            numberDataUrl
          };
        })
      );
      
      setIsProcessing(false);
      if (croppedItems.length > 0) {
        onSave(croppedItems[0].imageDataUrl, croppedItems[0].nameDataUrl, croppedItems[0].numberDataUrl, croppedItems);
      }
    } catch (err) {
      console.error("Failed to apply crops", err);
      setIsProcessing(false);
    }
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
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-neutral-900 rounded-2xl border border-neutral-800 w-[95vw] max-w-[1600px] max-h-[95vh] flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex shrink-0 flex-wrap items-center justify-between px-5 py-3 border-b border-neutral-800 gap-2">
            <div className="flex items-center gap-2">
              <Crop className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-white">Multi-Crop Tile Image</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={addImageCrop} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 transition text-xs font-bold" title="Add another Tile Image crop box">
                <Plus className="w-3.5 h-3.5" /> Add Image Box
              </button>
              <button onClick={addNameCrop} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition text-xs font-bold" title="Add crop box for Tile Name — used for OCR text extraction only, not saved as an image">
                <Plus className="w-3.5 h-3.5" /> Add Name Box
              </button>
              <button onClick={addNumberCrop} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition text-xs font-bold" title="Add crop box for Tile Number — used for OCR text extraction only, not saved as an image">
                <Plus className="w-3.5 h-3.5" /> Add Number Box
              </button>
              {(crops.some(c => c.type === "name") || crops.some(c => c.type === "number")) && (
                <span className="text-[9px] text-neutral-500 italic px-1.5">
                  Name/Number boxes → OCR only, not saved as images
                </span>
              )}
              {(crops[activeCropIndex]?.type !== "image" || crops.filter(c => c.type === "image").length > 1) && (
                <button onClick={removeActiveCrop} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition text-xs font-bold" title="Remove selected crop box">
                  <Trash2 className="w-3.5 h-3.5" /> Remove Box
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
          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto">
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
                    const type = c.type || "image";
                    
                    let borderClass = "border-blue-500/60 z-10 hover:border-blue-400";
                    let bgLabelClass = "bg-blue-600 text-white";
                    let handleBgClass = "bg-blue-400";
                    let label = "Tile Image";
                    
                    if (type === "image") {
                      borderClass = isActive ? "border-blue-400 z-20" : "border-blue-500/60 z-10 hover:border-blue-400";
                      bgLabelClass = isActive ? "bg-blue-400 text-black" : "bg-blue-600 text-white";
                      handleBgClass = "bg-blue-400";
                      label = "Tile Image";
                    } else if (type === "name") {
                      borderClass = isActive ? "border-purple-400 z-20" : "border-purple-500/60 z-10 hover:border-purple-400";
                      bgLabelClass = isActive ? "bg-purple-400 text-black" : "bg-purple-600 text-white";
                      handleBgClass = "bg-purple-400";
                      label = "Tile Name";
                    } else if (type === "number") {
                      borderClass = isActive ? "border-emerald-400 z-20" : "border-emerald-500/60 z-10 hover:border-emerald-400";
                      bgLabelClass = isActive ? "bg-emerald-400 text-black" : "bg-emerald-600 text-white";
                      handleBgClass = "bg-emerald-400";
                      label = "Tile Number";
                    }
                    
                    return (
                      <div
                        key={i}
                        className={`absolute border-2 shadow-inner cursor-move ${borderClass}`}
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
                            className={`absolute w-4 h-4 ${handleBgClass} border border-black rounded-sm shadow-md hover:scale-125 transition-transform z-10`}
                            style={{
                              left: `calc(${h.cx * 100}% - 8px)`,
                              top: `calc(${h.cy * 100}% - 8px)`,
                              cursor: h.cursor,
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(e, h.key, i);
                            }}
                          />
                        ))}
                        {/* Box label */}
                        <div className={`absolute top-0 left-0 px-1.5 py-0.5 text-[9px] font-bold ${bgLabelClass}`}>
                          {label}
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
              <div className="w-full lg:w-[500px] border-t lg:border-t-0 lg:border-l border-neutral-800 p-4 flex flex-col items-center justify-center bg-neutral-950/50">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-3">Preview (Box {activeCropIndex + 1})</span>
                <div 
                  className="w-full aspect-square rounded-lg overflow-hidden border border-neutral-700 shadow-inner"
                  style={{
                    backgroundColor: '#e5e5e5',
                    backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px'
                  }}
                >
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
          <div className="flex shrink-0 items-center justify-between px-5 py-3 border-t border-neutral-800">
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
                    ? 'bg-blue-500/20 text-purple-300 border-blue-500/40 shadow-lg shadow-blue-500/10'
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
                      type: c.type || "image",
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
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-500 hover:bg-blue-400 text-black transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
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
