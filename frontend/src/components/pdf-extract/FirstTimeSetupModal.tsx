"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HardDrive, FolderOpen, CheckCircle, XCircle, RefreshCw, ArrowRight, X } from "lucide-react";
import { setStoragePath, getStorageStatus } from "@/utils/localStorageSettings";

interface Props {
  onConfigured: (path: string) => void;
  onSkip: () => void;
}

export default function FirstTimeSetupModal({ onConfigured, onSkip }: Props) {
  const [path, setPath] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const trimmed = path.trim();
    if (!trimmed) { setError("Please enter a folder path"); return; }
    setSaving(true);
    setError("");
    const result = await setStoragePath(trimmed);
    setSaving(false);
    if (result.ok) {
      onConfigured(trimmed);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
        className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500" />

        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-5">
            <HardDrive className="w-7 h-7 text-blue-400" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Set Up Local Storage</h2>
          <p className="text-sm text-neutral-400 leading-relaxed mb-6">
            Choose a folder on your computer where extracted tile images will be saved.
            This avoids cloud storage costs and keeps your tiles on your machine.
          </p>

          {/* Path input */}
          <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
            Storage Folder Path
          </label>
          <input
            type="text"
            value={path}
            onChange={(e) => { setPath(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="e.g. D:\TileMasterPro\Tiles"
            className="w-full bg-neutral-800 border border-neutral-700 focus:border-blue-500/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none transition mb-2"
          />

          <p className="text-[10px] text-neutral-600 mb-1 leading-relaxed">
            Use an <strong className="text-neutral-400">absolute path</strong> accessible to the server.
            Subfolders <code className="text-blue-400/80">YYYY/MM/</code> will be created automatically.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs mt-2 mb-1 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Example paths */}
          <div className="mt-4 mb-6 grid grid-cols-2 gap-2">
            {["D:\\TileMasterPro\\Tiles", "E:\\My Tiles", "C:\\Users\\Public\\Tiles", "./local_tiles"].map((ex) => (
              <button
                key={ex}
                onClick={() => setPath(ex)}
                className="text-left px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[10px] font-mono text-neutral-400 hover:text-white transition truncate"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !path.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-black font-bold text-sm transition shadow-lg shadow-blue-500/20"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
              {saving ? "Configuring..." : "Use This Folder"}
            </button>
            <button
              onClick={onSkip}
              className="px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white font-bold text-sm transition border border-neutral-700"
            >
              Skip for now
            </button>
          </div>

          <p className="text-[10px] text-neutral-600 text-center mt-4">
            Skipping will save tiles to browser storage (IndexedDB) as before.
            You can configure this anytime in <strong className="text-neutral-400">Settings</strong>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
