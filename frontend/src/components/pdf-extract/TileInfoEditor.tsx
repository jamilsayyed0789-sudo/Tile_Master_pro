"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, X, Sparkles } from "lucide-react";
import type { Tile } from "@/types/tile";

interface Props {
  imageDataUrl: string;
  detectedInfo?: { tileName: string; tileNumber: string; tileSize: string; finish: string; color: string };
  onSave: (tile: Omit<Tile, "id" | "createdAt">) => void;
  onAIDetect?: () => void;
  onClose: () => void;
}

export default function TileInfoEditor({ imageDataUrl, detectedInfo, onSave, onAIDetect, onClose }: Props) {
  const [tileName, setTileName] = useState(detectedInfo?.tileName || "");
  const [tileNumber, setTileNumber] = useState(detectedInfo?.tileNumber || "");
  const [tileSize, setTileSize] = useState(detectedInfo?.tileSize || "");
  const [finish, setFinish] = useState(detectedInfo?.finish || "");
  const [color, setColor] = useState(detectedInfo?.color || "");
  const [usingDetected, setUsingDetected] = useState(!!detectedInfo?.tileName);

  useEffect(() => {
    if (detectedInfo) {
      setTileName(detectedInfo.tileName || "");
      setTileNumber(detectedInfo.tileNumber || "");
      setTileSize(detectedInfo.tileSize || "");
      setFinish(detectedInfo.finish || "");
      setColor(detectedInfo.color || "");
      setUsingDetected(true);
    }
  }, [detectedInfo]);

  const handleSave = () => {
    onSave({
      tileName: tileName.trim() || "Untitled",
      tileNumber: tileNumber.trim() || "N/A",
      tileSize: tileSize.trim() || "N/A",
      finish: finish.trim() || "N/A",
      color: color.trim() || "N/A",
      imageDataUrl,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-neutral-900 rounded-2xl border border-neutral-800 w-full max-w-2xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
            <span className="text-sm font-bold text-white">Tile Information</span>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-5 gap-5">
            {/* Image preview */}
            <div className="md:col-span-2">
              <div className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                <img src={imageDataUrl} alt="Cropped tile" className="w-full object-contain" />
              </div>
              {onAIDetect && (
                <button
                  onClick={onAIDetect}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition"
                >
                  <Sparkles className="w-3 h-3" /> AI Auto-Detect
                </button>
              )}
              {usingDetected && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-green-400 font-bold bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                  <Sparkles className="w-3 h-3" /> AI detection applied — edit if needed
                </div>
              )}
            </div>

            {/* Form */}
            <div className="md:col-span-3 space-y-4">
              {([
                { label: "Tile Name", value: tileName, set: setTileName, placeholder: "e.g. Statuario Marble" },
                { label: "Tile Number", value: tileNumber, set: setTileNumber, placeholder: "e.g. SM-2401" },
                { label: "Tile Size", value: tileSize, set: setTileSize, placeholder: "e.g. 600x600 mm" },
                { label: "Finish", value: finish, set: setFinish, placeholder: "e.g. Glossy, Matt, Satin" },
                { label: "Color", value: color, set: setColor, placeholder: "e.g. White, Grey, Beige" },
              ] as const).map((field) => (
                <div key={field.label}>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => { field.set(e.target.value); setUsingDetected(false); }}
                    placeholder={field.placeholder}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition placeholder:text-neutral-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition shadow-lg shadow-amber-500/20"
            >
              <Save className="w-3.5 h-3.5" /> Save Tile
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
