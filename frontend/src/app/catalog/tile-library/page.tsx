"use client";

import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import TileLibrary from "@/components/pdf-extract/TileLibrary";

export default function TileLibraryPage() {
  return (
    <div className="min-h-screen bg-neutral-600 text-neutral-100 aurora-bg relative overflow-x-hidden py-8 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 radial-glow-amber opacity-30 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 radial-glow-blue opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" /> Tile Library
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient mb-2">Searchable Tile Library</h1>
          <p className="text-neutral-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Browse, search, and export your extracted tiles. Select individual tiles for bulk operations or download everything as a ZIP archive.
          </p>
        </motion.div>

        <div className="glass-card rounded-3xl border border-white/5 p-6 shadow-xl">
          <TileLibrary />
        </div>
      </div>
    </div>
  );
}
