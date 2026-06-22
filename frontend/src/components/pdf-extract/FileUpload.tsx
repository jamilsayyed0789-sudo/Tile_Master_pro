"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, X, AlertTriangle } from "lucide-react";

interface Props {
  onFileLoaded: (file: File, dataUrl: string, tileSize: string) => void;
}

const MAX_SIZE_MB = 100;
const ACCEPTED = "application/pdf";

export default function FileUpload({ onFileLoaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; file: File; dataUrl: string } | null>(null);
  const [tileSize, setTileSize] = useState("");

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
          setFileInfo({
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            file: file,
            dataUrl: reader.result as string,
          });
          setLoading(false);
        };
        reader.onerror = () => {
          setError("Failed to read file.");
          setLoading(false);
        };
        reader.readAsDataURL(file);
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
    setTileSize("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleContinue = () => {
    if (!tileSize) {
      setError("Please select a tile size in mm before continuing.");
      return;
    }
    if (fileInfo) {
      setLoading(true);
      setTimeout(() => {
        onFileLoaded(fileInfo.file, fileInfo.dataUrl, tileSize);
      }, 50);
    }
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
            ? "border-blue-500/60 bg-blue-500/5"
            : "border-neutral-700 hover:border-blue-500/40 hover:bg-blue-500/5"
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
              <div className="w-12 h-12 mx-auto mb-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-neutral-400">Processing PDF pages...</p>
            </motion.div>
          ) : fileInfo ? (
            <motion.div key="loaded" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <p className="text-sm font-semibold text-white">{fileInfo.name}</p>
              <p className="text-xs text-neutral-500 mt-1">{fileInfo.size}</p>
              
              <div className="mt-4 w-full max-w-xs text-left" onClick={(e) => e.stopPropagation()}>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Select Tile Size (mm) <span className="text-red-400">*</span></label>
                <select
                  value={tileSize}
                  onChange={(e) => { setTileSize(e.target.value); setError(""); }}
                  className="w-full bg-neutral-800 border border-neutral-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="">-- Select Size --</option>
                  <option value="600x600 mm">600x600 mm</option>
                  <option value="600x1200 mm">600x1200 mm</option>
                  <option value="800x800 mm">800x800 mm</option>
                  <option value="800x1600 mm">800x1600 mm</option>
                  <option value="200x1200 mm">200x1200 mm</option>
                  <option value="300x600 mm">300x600 mm</option>
                  <option value="1200x1200 mm">1200x1200 mm</option>
                  <option value="1200x2400 mm">1200x2400 mm</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="mt-5 flex gap-3 w-full max-w-xs justify-center">
                <button
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="flex-1 inline-flex justify-center items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition border border-neutral-700"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleContinue(); }}
                  className="flex-1 inline-flex justify-center items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg bg-blue-500 text-black hover:bg-blue-400 transition"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UploadCloud className={`w-12 h-12 mx-auto mb-3 transition-colors ${dragOver ? "text-blue-400" : "text-neutral-600"}`} />
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
