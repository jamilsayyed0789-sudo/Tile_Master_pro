"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, CheckCircle, FileText, Loader2, FileDown, Info, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function CatalogUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [useTemplate, setUseTemplate] = useState(false);
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        setFile(null);
      } else if (selected.size > 100 * 1024 * 1024) {
        setError("File exceeds 100 MB limit.");
        setFile(null);
      } else {
        setFile(selected);
        setError("");
        setIsSuccess(false);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("use_template", useTemplate ? "true" : "false");

    try {
      const response = await fetch(`${baseUrl}/catalog/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        let errorDetail = "Failed to upload catalog";
        try {
          const parsed = JSON.parse(text);
          errorDetail = parsed.detail || errorDetail;
        } catch (e) {
          errorDetail = `Server error (${response.status}). Check that the backend is running.`;
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      const modeLabel: Record<string, string> = {
        "template": "Template (Fixed Coordinates)",
        "template-auto": "Template (Auto-Detected)",
        "digital": "Digital PDF (AI + Grid Detection)",
        "scanned-ocr": "Scanned PDF (OCR)",
      };
      setUploadMessage(`${data.message} (${modeLabel[data.extraction_mode] || data.extraction_mode})`);
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">
            Upload Tile Catalog
          </h1>
          <p className="text-neutral-400 text-lg">
            Automatically extract tiles, clean images, and make them searchable.
          </p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          {!isSuccess ? (
            <>
              {/* Template toggle */}
              <div className="mb-6 p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useTemplate}
                    onChange={e => setUseTemplate(e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-600 bg-neutral-700 text-indigo-500 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-neutral-200">
                      Use TileMaster Standard Template
                    </span>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      For 100% accurate extraction from our fixed-layout template
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTemplateInfo(!showTemplateInfo)}
                    className="p-1.5 rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    <Info className="w-4 h-4 text-neutral-500" />
                  </button>
                </label>

                {showTemplateInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 pt-4 border-t border-neutral-700/50 space-y-3"
                  >
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-xs text-neutral-300 leading-relaxed">
                      <p className="font-semibold text-indigo-300 mb-1">How it works:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Download the template PDF below</li>
                        <li>Place each tile image in its grid cell</li>
                        <li>Fill SKU, Size, Brand, Finish, Model fields</li>
                        <li>Upload the filled PDF with this checkbox ON</li>
                        <li>The system extracts from exact coordinates — guaranteed accuracy</li>
                      </ol>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`${baseUrl}/catalog/template/download`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-medium transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Download PDF Template
                      </a>
                      <a
                        href="https://www.canva.com/design/DAGe8DF_J70/8OSjJPqgnUkDOrsE5IqgCQ/edit"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-xs font-medium transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Copy Canva Design
                      </a>
                    </div>
                    <p className="text-[10px] text-neutral-600">
                      Template specs: A4, 3×4 grid (12 tiles/page). Fields: SKU, Size, Brand, Finish, Model.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Drop zone */}
              <div className="relative group">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                />
                <div
                  className={`
                    border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center text-center
                    ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-neutral-700 hover:border-indigo-500/50 hover:bg-indigo-500/5'}
                    ${isUploading ? 'opacity-50' : 'opacity-100'}
                  `}
                >
                  {file ? (
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                      <FileText className="w-16 h-16 text-emerald-400 mb-4" />
                      <p className="font-semibold text-lg">{file.name}</p>
                      <p className="text-neutral-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      {useTemplate && (
                        <span className="mt-2 px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded-full font-medium">
                          Template Mode
                        </span>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="w-16 h-16 text-neutral-500 mb-4 group-hover:text-indigo-400 transition-colors" />
                      <p className="font-semibold text-lg text-neutral-300">Drag & drop your PDF catalog</p>
                      <p className="text-neutral-500 text-sm mt-2">Up to 100 MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="mt-8 flex justify-between items-center">
                <Link href="/catalog/search" className="text-neutral-400 hover:text-white transition-colors text-sm">
                  Go to Search →
                </Link>
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="bg-white text-black px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    useTemplate ? "Extract from Template" : "Extract Tiles"
                  )}
                </button>
              </div>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Upload Started!</h2>
              <p className="text-neutral-400 mb-8 max-w-md">
                {uploadMessage}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsSuccess(false)}
                  className="px-6 py-3 border border-white/10 rounded-full hover:bg-white/5 transition-colors"
                >
                  Upload Another
                </button>
                <Link
                  href="/catalog/search"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                >
                  View Catalog
                </Link>
                <Link
                  href="/catalog/review"
                  className="px-6 py-3 border border-amber-500/30 text-amber-300 rounded-full hover:bg-amber-500/10 transition-colors"
                >
                  Review
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
