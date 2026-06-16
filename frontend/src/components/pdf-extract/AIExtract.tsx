"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Check, X, Lightbulb } from "lucide-react";
import { extractTileInfo, generateTileNameSuggestions } from "@/utils/aiDetection";

interface Props {
  ocrText: string;
  onApply: (info: {
    tileName: string;
    tileNumber: string;
    tileSize: string;
    finish: string;
    color: string;
  }) => void;
  onClose: () => void;
}

export default function AIExtract({ ocrText, onApply, onClose }: Props) {
  const [customText, setCustomText] = useState(ocrText);
  const [applied, setApplied] = useState(false);

  const result = useMemo(() => extractTileInfo(customText), [customText]);
  const suggestions = useMemo(() => generateTileNameSuggestions(customText), [customText]);

  const handleApply = () => {
    onApply({
      tileName: result.tileName,
      tileNumber: result.tileNumber,
      tileSize: result.tileSize,
      finish: result.finish,
      color: result.color,
    });
    setApplied(true);
    setTimeout(onClose, 600);
  };

  const fields = [
    { label: "Tile Name", value: result.tileName, icon: "🏷" },
    { label: "Tile Number", value: result.tileNumber, icon: "#" },
    { label: "Tile Size", value: result.tileSize, icon: "📐" },
    { label: "Finish", value: result.finish, icon: "✨" },
    { label: "Color", value: result.color, icon: "🎨" },
  ];

  const filledCount = fields.filter((f) => f.value).length;

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
          className="bg-neutral-900 rounded-2xl border border-neutral-800 w-full max-w-lg overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-white">AI Auto-Detection</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Source text */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Source Text (edit to re-detect)
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono resize-none focus:outline-none focus:border-amber-500/50 transition placeholder:text-neutral-600"
                placeholder="Paste tile text here or type manually..."
              />
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence}%` }}
                  className={`h-full rounded-full ${
                    result.confidence >= 70 ? "bg-green-500" : result.confidence >= 40 ? "bg-amber-500" : "bg-red-500"
                  }`}
                />
              </div>
              <span className="text-xs font-mono text-neutral-400">{result.confidence}%</span>
            </div>

            {/* Detected fields */}
            <div className="space-y-2">
              {fields.map((field) => (
                <div key={field.label} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-neutral-800/50 border border-neutral-800">
                  <span className="text-sm w-5 text-center">{field.icon}</span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider w-20 shrink-0">{field.label}</span>
                  <span className={`text-sm font-medium flex-1 ${field.value ? "text-white" : "text-neutral-600 italic"}`}>
                    {field.value || "Not detected"}
                  </span>
                  {field.value && <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                </div>
              ))}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Name Suggestions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setCustomText((prev) => `${prev}\n${s}`)}
                        className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-800">
            <span className="text-xs text-neutral-500">
              {filledCount}/5 fields detected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applied || filledCount === 0}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Applied!
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Apply Detection
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
