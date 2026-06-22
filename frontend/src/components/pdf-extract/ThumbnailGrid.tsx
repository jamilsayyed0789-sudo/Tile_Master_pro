"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, Square, Trash2, RotateCw, RotateCcw, Crop, Download,
  Check, X, ChevronDown, Loader2,
} from "lucide-react";
import type { PdfPage } from "@/types/tile";

interface Props {
  pages: PdfPage[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  onDeletePages: (ids: number[]) => void;
  onRotatePages: (ids: number[], degrees: number) => void;
  onCropPage: (page: PdfPage) => void;
  onDownloadPages: (ids: number[]) => void;
}

export default function ThumbnailGrid({
  pages,
  selectedIds,
  onSelectionChange,
  onDeletePages,
  onRotatePages,
  onCropPage,
  onDownloadPages,
}: Props) {
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const bulkMenuRef = useRef<HTMLDivElement>(null);

  // Close bulk menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
        setShowBulkMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allVisibleSelected = useMemo(
    () => pages.length > 0 && pages.every((p) => selectedIds.has(p.index)),
    [pages, selectedIds]
  );

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIds);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (allVisibleSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(pages.map((p) => p.index)));
    }
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    onDeletePages(ids);
    setShowBulkMenu(false);
  };

  const handleBulkRotate = (degrees: number) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    onRotatePages(ids, degrees);
    setShowBulkMenu(false);
  };

  const handleBulkDownload = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    onDownloadPages(ids);
    setShowBulkMenu(false);
  };

  return (
    <div className="space-y-3">
      {/* Bulk action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAll}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition"
          >
            {allVisibleSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {allVisibleSelected ? "Deselect All" : "Select All"}
          </button>
          {selectedIds.size > 0 && (
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
              {selectedIds.size} selected
            </span>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="relative" ref={bulkMenuRef}>
            <button
              onClick={() => setShowBulkMenu(!showBulkMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-600 transition"
            >
              Bulk Actions <ChevronDown className="w-3 h-3" />
            </button>

            <AnimatePresence>
              {showBulkMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-30"
                >
                  <button
                    onClick={handleBulkDownload}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Selected
                  </button>
                  <button
                    onClick={() => handleBulkRotate(90)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Rotate Right 90°
                  </button>
                  <button
                    onClick={() => handleBulkRotate(-90)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Rotate Left 90°
                  </button>
                  <div className="border-t border-neutral-800" />
                  <button
                    onClick={handleBulkDelete}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Thumbnail grid */}
      <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {pages.map((page) => {
          const isSelected = selectedIds.has(page.index);
          return (
            <motion.div
              key={page.index}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5"
                  : "border-neutral-800 hover:border-neutral-700 bg-neutral-900"
              }`}
              onClick={() => toggleSelect(page.index)}
            >
              {/* Checkbox */}
              <div
                className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                  isSelected
                    ? "bg-blue-500 border-blue-500"
                    : "bg-neutral-900/80 border-neutral-600 group-hover:border-neutral-400"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-black" />}
              </div>

              {/* Page number */}
              <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-md bg-neutral-900/80 text-[9px] font-mono text-neutral-400 border border-neutral-700">
                {page.index + 1}
              </div>

              {/* Image */}
              <div className="aspect-[3/4] bg-neutral-950 overflow-hidden">
                <img
                  src={page.dataUrl}
                  alt={`Page ${page.index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); onCropPage(page); }}
                  className="p-1.5 rounded-lg bg-blue-500/90 text-black hover:bg-blue-400 transition"
                  title="Crop"
                >
                  <Crop className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onRotatePages([page.index], 90); }}
                  className="p-1.5 rounded-lg bg-neutral-800/90 text-white hover:bg-neutral-700 transition"
                  title="Rotate"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}

      </div>
    </div>
  );
}
