"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, X, AlertTriangle } from "lucide-react";

interface Props {
  onFileLoaded: (file: File, dataUrl: string) => void;
}

const MAX_SIZE_MB = 100;
const ACCEPTED = "application/pdf";

export default function FileUpload({ onFileLoaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError("");
      if (file.type !== ACCEPTED) {
        setError("Only PDF files are allowed.");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File exceeds ${MAX_SIZE_MB} MB limit.`);
        return;
      }
      setLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = () => {
          onFileLoaded(file, reader.result as string);
          setLoading(false);
        };
        reader.onerror = () => {
          setError("Failed to read file.");
          setLoading(false);
        };
        reader.readAsDataURL(file);
        setFileInfo({
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        });
      } catch {
        setError("Failed to read file.");
        setLoading(false);
      }
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const clearFile = () => {
    setFileInfo(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !fileInfo && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          fileInfo
            ? "border-green-500/40 bg-green-500/5"
            : dragOver
            ? "border-amber-500/60 bg-amber-500/5"
            : "border-neutral-700 hover:border-amber-500/40 hover:bg-amber-500/5"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleSelect}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-12 h-12 mx-auto mb-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-neutral-400">Reading PDF...</p>
            </motion.div>
          ) : fileInfo ? (
            <motion.div key="loaded" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <FileText className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <p className="text-sm font-semibold text-white">{fileInfo.name}</p>
              <p className="text-xs text-neutral-500 mt-1">{fileInfo.size}</p>
              <button
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UploadCloud className={`w-12 h-12 mx-auto mb-3 transition-colors ${dragOver ? "text-amber-400" : "text-neutral-600"}`} />
              <p className="text-sm font-semibold text-neutral-300">Drop your PDF here, or click to browse</p>
              <p className="text-xs text-neutral-600 mt-1">Max {MAX_SIZE_MB} MB</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
