"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Trash2, Download, CheckSquare, Square, X, FileDown, Check,
} from "lucide-react";
import type { Tile } from "@/types/tile";
import {
  getAllTilesAsync,
  deleteTilesAsync,
  searchTiles,
  migrateFromLocalStorage,
} from "@/utils/tileStorage";
import { exportTilesAsZip } from "@/utils/zipExport";

interface Props {
  tiles?: Tile[];
  onTilesChange?: () => void;
  compact?: boolean;
}

export default function TileLibrary({ tiles: externalTiles, onTilesChange, compact }: Props) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [localTiles, setLocalTiles] = useState<Tile[]>([]);
  const [notify, setNotify] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tiles = externalTiles ?? localTiles;
  const isExternal = !!externalTiles;

  const loadTiles = async () => {
    if (isExternal) return;
    setLoading(true);
    try {
      // One-time migration of old localStorage tiles into IndexedDB
      await migrateFromLocalStorage();
      const all = await getAllTilesAsync();
      setLocalTiles(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTiles();
  }, [isExternal]);

  const filtered = useMemo(
    () => searchTiles(query, tiles),
    [query, tiles]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)));
    }
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    await deleteTilesAsync(ids);
    setSelectedIds(new Set());
    setNotify(`Deleted ${ids.length} tile(s)`);
    if (!isExternal) {
      const all = await getAllTilesAsync();
      setLocalTiles(all);
    }
    onTilesChange?.();
    setTimeout(() => setNotify(null), 3000);
  };

  const handleExport = () => {
    const toExport = selectedIds.size > 0
      ? tiles.filter((t) => selectedIds.has(t.id))
      : tiles;
    if (!toExport.length) return;

    const defaultName = `Tile_Collection_${new Date().toISOString().split('T')[0]}`;
    const customName = window.prompt("Enter a name for your export (e.g., Project_Name):", defaultName);
    
    if (customName === null) return; // User cancelled the prompt

    exportTilesAsZip(toExport, customName);
    setNotify(`Exporting ${toExport.length} tile(s)...`);
    setTimeout(() => setNotify(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Search + bulk bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, number, size, finish, or color..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 transition"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition"
              >
                <FileDown className="w-3 h-3" /> Export ZIP
              </button>
            </>
          )}
          {tiles.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition"
            >
              <Download className="w-3 h-3" /> Export All
            </button>
          )}
        </div>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>
          {filtered.length} / {tiles.length} tiles
          {selectedIds.size > 0 && (
            <span className="text-blue-400 font-bold ml-2">({selectedIds.size} selected)</span>
          )}
        </span>
        {filtered.length > 0 && (
          <button
            onClick={selectAll}
            className="flex items-center gap-1 text-neutral-400 hover:text-white transition font-medium"
          >
            {selectedIds.size === filtered.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            {selectedIds.size === filtered.length ? "Deselect All" : "Select All"}
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
            <Search className="w-6 h-6 text-neutral-600" />
          </div>
          <p className="text-neutral-400 text-sm font-bold">No tiles found</p>
          <p className="text-neutral-600 text-xs mt-1">{query ? "Try a different search term" : "Extract tiles from a PDF to get started"}</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${compact ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'}`}>
          {filtered.map((tile) => {
            // Filter placeholders
            const isPlaceholderName = (n: string | null | undefined) => {
              if (!n) return true;
              const l = n.trim().toLowerCase();
              return l === "" || l === "unknown" || l === "untitled" || l === "n/a" ||
                l.startsWith("untitled page") || l.startsWith("tile page") || l.startsWith("untitled tile");
            };
            const isPlaceholderNumber = (n: string | null | undefined) => {
              if (!n) return true;
              const l = n.trim().toLowerCase();
              return l === "" || l === "unknown" || l === "n/a" || /^p\d+(-\d+)?$/.test(l);
            };

            const displayName = isPlaceholderName(tile.tileName) ? null : tile.tileName;
            const displayNumber = isPlaceholderNumber(tile.tileNumber) ? null : tile.tileNumber;

            return (
            <motion.div
              key={tile.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all ${
                selectedIds.has(tile.id)
                  ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5'
                  : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900'
              }`}
              onClick={() => toggleSelect(tile.id)}
            >
              {/* Checkbox overlay */}
              <div className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                selectedIds.has(tile.id)
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-neutral-900/80 border-neutral-600 group-hover:border-neutral-400'
              }`}>
                {selectedIds.has(tile.id) && <Check className="w-3 h-3 text-black" />}
              </div>

              <div className="aspect-square bg-neutral-950 overflow-hidden">
                <img
                  src={tile.imageDataUrl}
                  alt={tile.tileName}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-2.5 space-y-0.5">
                {/* Heading: real name > real number > grey placeholder */}
                {displayName ? (
                  <p className="text-[11px] font-bold text-white truncate">{displayName}</p>
                ) : displayNumber ? (
                  <p className="text-[11px] font-bold text-white truncate font-mono">{displayNumber}</p>
                ) : (
                  <p className="text-[11px] font-bold text-neutral-500 italic truncate">No label</p>
                )}
                
                {/* Only show number row if both name and number are present */}
                {displayName && displayNumber && (
                  <p className="text-[9px] font-mono text-neutral-500 truncate"># {displayNumber}</p>
                )}

                <div className="flex items-center gap-2 text-[9px] text-neutral-500">
                  <span>{tile.tileSize}</span>
                  {tile.finish !== "N/A" && <span className="text-neutral-700">|</span>}
                  {tile.finish !== "N/A" && <span>{tile.finish}</span>}
                </div>
              </div>
            </motion.div>
          )})}
        </div>
      )}

      {/* Notification */}
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
