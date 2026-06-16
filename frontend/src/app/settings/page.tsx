"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, CheckCircle, XCircle, RefreshCw, Save,
  HardDrive, AlertTriangle, ArrowLeft, ExternalLink, Folder,
} from "lucide-react";
import Link from "next/link";
import { getStorageSettings, getStorageStatus, setStoragePath, StorageStatus } from "@/utils/localStorageSettings";

export default function SettingsPage() {
  const [path, setPath] = useState("");
  const [savedPath, setSavedPath] = useState("");
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadSettings = async () => {
    const [settings, statusData] = await Promise.all([getStorageSettings(), getStorageStatus()]);
    setPath(settings.local_storage_path || "");
    setSavedPath(settings.local_storage_path || "");
    setStatus(statusData);
  };

  useEffect(() => { loadSettings(); }, []);

  const handleSave = async () => {
    if (!path.trim()) {
      showMessage("error", "Please enter a folder path");
      return;
    }
    setSaving(true);
    const result = await setStoragePath(path.trim());
    setSaving(false);
    if (result.ok) {
      setSavedPath(path.trim());
      showMessage("success", result.message);
      // Refresh status
      const newStatus = await getStorageStatus();
      setStatus(newStatus);
    } else {
      showMessage("error", result.message);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    const newStatus = await getStorageStatus();
    setStatus(newStatus);
    setVerifying(false);
    if (newStatus.configured && newStatus.writable) {
      showMessage("success", "Folder is accessible and writable ✓");
    } else if (newStatus.configured && !newStatus.writable) {
      showMessage("error", "Folder exists but cannot be written to. Check permissions.");
    } else {
      showMessage("error", "No folder configured yet.");
    }
  };

  const isDirty = path !== savedPath;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Link
            href="/catalog/pdf-extract"
            className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white transition text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Extraction
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Settings</h1>
              <p className="text-neutral-500 text-sm">Tile Storage Configuration</p>
            </div>
          </div>
        </motion.div>

        {/* Storage Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-900/60 backdrop-blur border border-white/8 rounded-3xl p-6 mb-6 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Tile Storage Location</h2>
          </div>

          {/* Status badge */}
          {status && (
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 text-sm font-medium border ${
                status.configured && status.writable
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                  : status.configured && status.exists && !status.writable
                  ? "bg-red-500/10 border-red-500/25 text-red-400"
                  : !status.configured
                  ? "bg-neutral-800/60 border-neutral-700 text-neutral-400"
                  : "bg-amber-500/10 border-amber-500/25 text-amber-400"
              }`}
            >
              {status.configured && status.writable ? (
                <><CheckCircle className="w-4 h-4" /> Folder configured and writable</>
              ) : status.configured && !status.writable ? (
                <><XCircle className="w-4 h-4" /> Folder is not writable — check permissions</>
              ) : (
                <><AlertTriangle className="w-4 h-4" /> No local storage folder configured — tiles will save to browser IndexedDB</>
              )}
            </div>
          )}

          {/* Current path display */}
          {savedPath && (
            <div className="flex items-center gap-2 bg-neutral-800/50 border border-white/5 rounded-xl px-4 py-3 mb-5 text-sm">
              <Folder className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="font-mono text-neutral-300 truncate flex-1">{savedPath}</span>
            </div>
          )}

          {/* Path input */}
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
            Storage Folder Path
          </label>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="e.g. D:\TileMasterPro\Tiles or E:\My Tiles"
              className="flex-1 bg-neutral-800 border border-neutral-700 focus:border-amber-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none transition"
            />
          </div>

          <p className="text-[11px] text-neutral-600 mb-5 leading-relaxed">
            Enter the <strong className="text-neutral-400">absolute path</strong> to a folder on this computer where extracted tile images will be saved.
            Images will be organised into <code className="text-amber-400/80">YYYY/MM/</code> subfolders automatically.
            The path must be writable by the server process.
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-sm font-bold transition shadow-lg shadow-amber-500/20"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : isDirty ? "Save Changes" : "Saved"}
            </button>

            <button
              onClick={handleVerify}
              disabled={verifying || !savedPath}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 text-sm font-bold transition border border-neutral-700"
            >
              {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {verifying ? "Verifying..." : "Verify Folder"}
            </button>

            {savedPath && (
              <button
                onClick={async () => {
                  const result = await setStoragePath("");
                  if (result.ok) { setPath(""); setSavedPath(""); setStatus({ configured: false, path: "" }); showMessage("success", "Storage folder cleared"); }
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold transition border border-red-500/20"
              >
                <XCircle className="w-4 h-4" /> Clear Folder
              </button>
            )}
          </div>
        </motion.div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-indigo-500/5 border border-indigo-500/15 rounded-3xl p-6"
        >
          <h3 className="text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> How Local Storage Works
          </h3>
          <ul className="space-y-2 text-xs text-neutral-400 leading-relaxed">
            <li>• When a folder is configured, extracted tile images are <strong className="text-white">saved directly to your hard drive</strong> inside <code className="text-amber-400/80">YYYY/MM/</code> subfolders.</li>
            <li>• Only metadata (name, number, size) is stored in the database — <strong className="text-white">no images are uploaded to the cloud</strong>.</li>
            <li>• If no folder is configured, tiles continue to save in the <strong className="text-white">browser's IndexedDB</strong> as before.</li>
            <li>• Changing the folder path does <strong className="text-white">not move existing images</strong> — only newly extracted tiles use the new folder.</li>
            <li>• Use the <strong className="text-white">Verify Folder</strong> button to confirm the server can write to the selected path.</li>
          </ul>
        </motion.div>

        {/* Toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-bold z-50 ${
                message.type === "success"
                  ? "bg-emerald-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
