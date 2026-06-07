"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Image as ImageIcon, Ruler, Hash, ArrowLeft,
  Layers, Bath, UtensilsCrossed, Home, Building2, ChevronRight, X, Check, ExternalLink,   Trash2, Loader2, AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/auth";
import { setPendingTexture } from "@/utils/textureBridge";

function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none" />
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
            variant === "danger" ? "from-red-500 via-rose-500 to-orange-500" : "from-indigo-500 via-purple-500 to-pink-500"
          }`} />

          <div className="relative p-6">
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${
                  variant === "danger"
                    ? "bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30"
                    : "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30"
                }`}
              >
                <div className={`absolute w-16 h-16 rounded-2xl ${
                  variant === "danger" ? "bg-red-500/10" : "bg-indigo-500/10"
                } blur-xl animate-pulse`} />
                <AlertTriangle className={`w-8 h-8 relative ${
                  variant === "danger" ? "text-red-400" : "text-indigo-400"
                }`} />
              </motion.div>

              <h3 className="text-xl font-extrabold text-white mb-2">{title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-7 max-w-sm">{message}</p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 px-5 py-3 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                    variant === "danger"
                      ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white shadow-[0_4px_20px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_25px_rgba(239,68,68,0.5)]"
                      : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.5)]"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Working...
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AlertDialog({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
          <div className="relative p-6">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5, delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mb-5"
              >
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </motion.div>
              <h3 className="text-xl font-extrabold text-white mb-2">{title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6">{message}</p>
              <button
                onClick={onClose}
                className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-sm transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
              >
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface Tile {
  id?: number;
  tile_name: string;
  tile_number: string;
  tile_size: string | null;
  image_url: string | null;
  catalog_name?: string | null;
  page_number?: number | null;
}

const SCENES = [
  {
    id: "bathroom",
    label: "3D Bathroom",
    icon: Bath,
    route: "/bathroom-3d",
    color: "indigo",
    surfaces: [
      { slot: "bathroom_dark",        label: "Dark Wall Tile" },
      { slot: "bathroom_light",       label: "Light Wall Tile" },
      { slot: "bathroom_highlighter", label: "Highlighter Tile" },
      { slot: "bathroom_floor",       label: "Floor Tile" },
    ],
  },
  {
    id: "kitchen",
    label: "3D Kitchen",
    icon: UtensilsCrossed,
    route: "/kitchen-3d",
    color: "amber",
    surfaces: [
      { slot: "kitchen_backsplash",  label: "Backsplash / Wall" },
      { slot: "kitchen_floor",       label: "Floor Tile" },
      { slot: "kitchen_countertop",  label: "Countertop" },
    ],
  },
  {
    id: "room",
    label: "3D Room",
    icon: Home,
    route: "/room-previewer",
    color: "emerald",
    surfaces: [
      { slot: "room_wall",  label: "Wall Tile" },
      { slot: "room_floor", label: "Floor Tile" },
    ],
  },
  {
    id: "elevation",
    label: "3D Elevation",
    icon: Building2,
    route: "/wall-elevation",
    color: "sky",
    surfaces: [
      { slot: "elevation_wall", label: "Wall / Elevation" },
    ],
  },
];

const COLOR_CLASSES: Record<string, { badge: string; check: string; open: string }> = {
  indigo: { badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20", check: "bg-indigo-500", open: "bg-indigo-500 hover:bg-indigo-400" },
  amber:  { badge: "bg-amber-500/10  text-amber-300  border-amber-500/20",  check: "bg-amber-500",  open: "bg-amber-500  hover:bg-amber-400"  },
  emerald:{ badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", check: "bg-emerald-500", open: "bg-emerald-500 hover:bg-emerald-400" },
  sky:    { badge: "bg-sky-500/10    text-sky-300    border-sky-500/20",    check: "bg-sky-500",    open: "bg-sky-500    hover:bg-sky-400"    },
};

// ── Per-tile Apply Panel ─────────────────────────────────────────────────────
function Apply3DPanel({
  tile,
  appliedSlots,
  onApply,
  onClose,
}: {
  tile: Tile;
  appliedSlots: Set<string>;
  onApply: (slot: string, route: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"scene" | "surface">("scene");
  const [chosenScene, setChosenScene] = useState<(typeof SCENES)[0] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleSurfaceClick = (slot: string) => {
    if (!tile.image_url) return;
    onApply(slot, chosenScene!.route);
  };

  // Count how many slots of the current scene are applied
  const appliedCountForScene = (scene: typeof SCENES[0]) =>
    scene.surfaces.filter(s => appliedSlots.has(s.slot)).length;

  return (
    <div ref={ref} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72">
      {/* Arrow tip */}
      <div className="flex justify-center">
        <div className="w-3 h-3 rotate-45 bg-neutral-800 border-r border-b border-white/10 -mb-1.5 relative z-10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="bg-neutral-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            {step === "surface" && (
              <button onClick={() => setStep("scene")} className="text-neutral-400 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white">
              {step === "scene" ? "Apply to 3D Scene" : chosenScene?.label}
            </span>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tile preview strip */}
        <div className="flex items-center gap-3 px-4 py-2 bg-neutral-900/60 border-b border-white/5">
          {tile.image_url ? (
            <img src={tile.image_url} alt={tile.tile_name}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-4 h-4 text-neutral-600" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{tile.tile_name}</p>
            <p className="text-[10px] text-neutral-500 font-mono">#{tile.tile_number}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <AnimatePresence mode="wait">
            {step === "scene" ? (
              <motion.div key="scenes" className="space-y-1.5">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold px-1 mb-2">
                  Choose a 3D scene
                </p>
                {SCENES.map((scene) => {
                  const Icon = scene.icon;
                  const cls = COLOR_CLASSES[scene.color];
                  const appliedCount = appliedCountForScene(scene);
                  return (
                    <button
                      key={scene.id}
                      onClick={() => {
                        setChosenScene(scene);
                        // If only one surface, apply immediately without going to surface step
                        if (scene.surfaces.length === 1) {
                          onApply(scene.surfaces[0].slot, scene.route);
                        } else {
                          setStep("surface");
                        }
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all group"
                    >
                      <span className={`flex items-center justify-center w-8 h-8 rounded-lg border text-sm ${cls.badge}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-semibold text-white flex-1 text-left">{scene.label}</span>
                      {appliedCount > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${cls.check}`}>
                          {appliedCount}/{scene.surfaces.length}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
                    </button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="surfaces" className="space-y-1">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold px-1 mb-2">
                  Select a surface
                </p>
                {chosenScene?.surfaces.map((surface) => {
                  const cls = COLOR_CLASSES[chosenScene.color];
                  const isApplied = appliedSlots.has(surface.slot);
                  return (
                    <button
                      key={surface.slot}
                      onClick={() => handleSurfaceClick(surface.slot)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all
                        ${isApplied
                          ? "border-emerald-500/30 bg-emerald-500/10"
                          : "border-transparent hover:border-white/10 hover:bg-white/5"
                        }`}
                    >
                      {isApplied ? (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </span>
                      ) : (
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cls.check}`} />
                      )}
                      <span className={`text-sm font-semibold flex-1 text-left ${isApplied ? "text-emerald-300" : "text-white"}`}>
                        {surface.label}
                      </span>
                      {isApplied && (
                        <span className="text-[10px] text-emerald-400 font-bold">Applied ✓</span>
                      )}
                    </button>
                  );
                })}

                {/* Open in 3D button — shown once at least one surface is applied */}
                {chosenScene && appliedCountForScene(chosenScene) > 0 && (
                  <div className="pt-2 mt-1 border-t border-white/5">
                    <button
                      onClick={() => { onClose(); router.push(chosenScene.route); }}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all ${COLOR_CLASSES[chosenScene.color].open}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in {chosenScene.label}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function CatalogSearchPage() {
  const [query, setQuery]               = useState("");
  const [tiles, setTiles]               = useState<Tile[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activePanelId, setActivePanelId]   = useState<string | null>(null);
  const [appliedSlots, setAppliedSlots] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [confirmDeleteTile, setConfirmDeleteTile] = useState<Tile | null>(null);
  const [alertInfo, setAlertInfo]               = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchTiles = async () => {
      setIsLoading(true);
      try {
        const token = getToken();
        const url = debouncedQuery.trim()
          ? `/api/catalog/search?q=${encodeURIComponent(debouncedQuery)}`
          : `/api/catalog/tiles`;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const ct = res.headers.get("content-type");
          if (ct?.includes("application/json")) setTiles(await res.json());
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTiles();
  }, [debouncedQuery]);

  const handleApply = (tile: Tile, slot: string) => {
    if (!tile.image_url) return;
    setPendingTexture(slot, {
      url: tile.image_url,
      name: tile.tile_name,
      tileCode: tile.tile_number,
    });
    setAppliedSlots(prev => new Set([...prev, slot]));
  };

  const performDelete = async (tileNumber: string) => {
    setDeletingId(tileNumber);
    try {
      const token = getToken();
      const res = await fetch(`/api/catalog/tiles/${encodeURIComponent(tileNumber)}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setTiles(prev => prev.filter(t => t.tile_number !== tileNumber));
        setConfirmDeleteTile(null);
      } else {
        const error = await res.json();
        setConfirmDeleteTile(null);
        setAlertInfo({ title: "Delete Failed", message: error.detail || "Failed to delete tile" });
      }
    } catch (err) {
      console.error(err);
      setConfirmDeleteTile(null);
      setAlertInfo({ title: "Network Error", message: "Error deleting tile. Please check your connection." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (tile: Tile) => {
    setConfirmDeleteTile(tile);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 relative">
      <div className="fixed top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 pt-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <Link href="/catalog/upload" className="inline-flex items-center text-neutral-400 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Upload
            </Link>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Tile Database</h1>
          </div>

          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className={`w-5 h-5 ${isLoading ? "text-indigo-400 animate-pulse" : "text-neutral-500"}`} />
            </div>
            <input
              type="text"
              placeholder="Search by name or number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-neutral-900/80 border border-white/10 rounded-full py-4 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Applied banner */}
        {appliedSlots.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3"
          >
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-emerald-300 font-semibold">
              {appliedSlots.size} surface{appliedSlots.size > 1 ? "s" : ""} queued:
            </span>
            {SCENES.map(scene => {
              const count = scene.surfaces.filter(s => appliedSlots.has(s.slot)).length;
              if (!count) return null;
              const cls = COLOR_CLASSES[scene.color];
              return (
                <span key={scene.id} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${cls.badge}`}>
                  {scene.label} ({count})
                </span>
              );
            })}
          </motion.div>
        )}

        {/* Grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {tiles.map((tile, i) => {
              const panelKey   = tile.tile_number + "-" + i;
              const isOpen     = activePanelId === panelKey;

              // Count how many surfaces from this tile have been applied (approximation by any slot)
              const sceneAppliedCount = SCENES.reduce(
                (acc, s) => acc + s.surfaces.filter(sf => appliedSlots.has(sf.slot)).length, 0
              );

              return (
                <motion.div
                  key={panelKey}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="group relative bg-neutral-900/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-visible hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-neutral-950 rounded-t-2xl overflow-hidden flex items-center justify-center">
                    {tile.image_url ? (
                      <img src={tile.image_url} alt={tile.tile_name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-neutral-800" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 border-t border-white/5 relative">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-base text-white truncate flex-1">{tile.tile_name}</h3>
                      <button
                        onClick={() => handleDelete(tile)}
                        disabled={deletingId === tile.tile_number}
                        className="text-neutral-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-500/10 disabled:opacity-50"
                        title="Delete Tile"
                      >
                        {deletingId === tile.tile_number ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-2">
                      <div className="flex items-center text-sm text-neutral-400">
                        <Hash className="w-3.5 h-3.5 mr-1.5 text-indigo-400 flex-shrink-0" />
                        <span className="font-mono truncate">{tile.tile_number}</span>
                      </div>
                      {tile.tile_size && (
                        <div className="flex items-center text-sm text-neutral-400">
                          <Ruler className="w-3.5 h-3.5 mr-1.5 text-emerald-400 flex-shrink-0" />
                          <span>{tile.tile_size}</span>
                        </div>
                      )}
                    </div>

                    {/* Apply to 3D button */}
                    {tile.image_url && (
                      <div className="relative mt-3">
                        <button
                          onClick={() => setActivePanelId(isOpen ? null : panelKey)}
                          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-200 border
                            ${isOpen
                              ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400"
                            }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Apply to 3D Scene
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <Apply3DPanel
                              tile={tile}
                              appliedSlots={appliedSlots}
                              onApply={(slot, route) => handleApply(tile, slot)}
                              onClose={() => setActivePanelId(null)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {!isLoading && tiles.length === 0 && (
          <div className="text-center py-20 text-neutral-400">
            {query.trim() !== ""
              ? `No tiles found matching "${query}"`
              : "No tiles in database. Upload a catalog to get started!"}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteTile}
        title="Delete this tile?"
        message={`This will permanently remove "${confirmDeleteTile?.tile_name}" from your catalog and delete the image from Cloudinary. This action cannot be undone.`}
        confirmText="Delete Tile"
        cancelText="Keep It"
        variant="danger"
        loading={deletingId === confirmDeleteTile?.tile_number}
        onConfirm={() => confirmDeleteTile && performDelete(confirmDeleteTile.tile_number)}
        onCancel={() => setConfirmDeleteTile(null)}
      />

      <AlertDialog
        open={!!alertInfo}
        title={alertInfo?.title || ""}
        message={alertInfo?.message || ""}
        onClose={() => setAlertInfo(null)}
      />
    </div>
  );
}
