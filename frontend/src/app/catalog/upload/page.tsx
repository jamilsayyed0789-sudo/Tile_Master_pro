"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, CheckCircle, FileText, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CatalogUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

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

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

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
      setIsSuccess(true);
      setUploadMessage(data.message);
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Background Gradients */}
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

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mt-4 text-center">
                  {error}
                </motion.p>
              )}

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
                    "Extract Tiles"
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
                {uploadMessage} The backend is now processing the PDF in the background. Images are being cleaned and uploaded.
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
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
