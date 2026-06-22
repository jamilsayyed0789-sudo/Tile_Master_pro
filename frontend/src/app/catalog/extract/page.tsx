"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  UploadCloud, CheckCircle, FileText, Loader2, Settings2,
  AlertTriangle, ChevronRight, Info, FileDown
} from "lucide-react";
import Link from "next/link";

type PageState = "upload" | "settings" | "processing" | "done";

interface Settings {
  tile_size_preset: string;
  tile_size_custom_width: number;
  tile_size_custom_height: number;
  page_start: number;
  page_end: number;
  tiles_per_page: string;
  min_width: number;
  min_height: number;
}

const SIZE_PRESETS = ["300x450", "300x600", "600x600", "600x1200", "800x1600", "1200x1800"];

const TILE_SIZE_OPTIONS = [
  { value: "", label: "Auto Detect (from PDF)" },
  ...SIZE_PRESETS.map(s => ({ value: s, label: `${s} mm` })),
  { value: "custom", label: "Custom" },
];

const TILES_PER_PAGE_OPTIONS = [
  { value: "", label: "Auto Detect" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "6", label: "6" },
];

function isValidPDF(file: File): string | null {
  if (file.type !== "application/pdf") return "Only PDF files are allowed.";
  if (file.size > 100 * 1024 * 1024) return "File exceeds 100 MB limit.";
  return null;
}

export default function CatalogExtractPage() {
  const [pageState, setPageState] = useState<PageState>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [catalogName, setCatalogName] = useState("");
  const [extractionMode, setExtractionMode] = useState("");
  const [useTemplate, setUseTemplate] = useState(false);
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiBase = "/api";

  const [settings, setSettings] = useState<Settings>({
    tile_size_preset: "",
    tile_size_custom_width: 600,
    tile_size_custom_height: 600,
    page_start: 1,
    page_end: 9999,
    tiles_per_page: "",
    min_width: 500,
    min_height: 500,
  });

  const doUpload = useCallback(async (f: File) => {
    setFile(f);
    setFileError("");
    setPageState("processing");

    const fd = new FormData();
    fd.append("file", f);
    fd.append("use_template", "true");

    try {
      const res = await fetch(`${apiBase}/catalog/upload`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const text = await res.text();
        let detail = "Upload failed";
        try { detail = JSON.parse(text).detail || detail; } catch { detail = text || `HTTP ${res.status}`; }
        throw new Error(detail);
      }
      const data = await res.json();
      setCatalogName(data.catalog_name || "");
      setExtractionMode(data.extraction_mode || "");
      setPageState("done");
    } catch (err: any) {
      setError(err.message || "Extraction failed");
      setPageState("upload");
    }
  }, [apiBase]);

  const modeLabel: Record<string, string> = {
    "template": "Template (Fixed Coordinates)",
    "template-auto": "Template (Auto-Detected)",
    "digital": "Digital PDF (AI + Grid Detection)",
    "scanned-ocr": "Scanned PDF (OCR)",
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    const err = isValidPDF(f);
    if (err) { setFileError(err); return; }
    if (useTemplate) {
      doUpload(f);
    } else {
      setFile(f);
      setFileError("");
      setPageState("settings");
    }
  }, [useTemplate, doUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = isValidPDF(f);
    if (err) { setFileError(err); return; }
    if (useTemplate) {
      doUpload(f);
    } else {
      setFile(f);
      setFileError("");
      setPageState("settings");
    }
  }, [useTemplate, doUpload]);

  const handleStartExtraction = async () => {
    if (!file) return;
    setPageState("processing");
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    if (useTemplate) {
      formData.append("use_template", "true");
    } else {
      const tileSize = settings.tile_size_preset === "custom"
        ? `${settings.tile_size_custom_width}x${settings.tile_size_custom_height}`
        : settings.tile_size_preset || undefined;
      const settingsPayload: Record<string, any> = {
        page_start: settings.page_start,
        tiles_per_page: settings.tiles_per_page ? parseInt(settings.tiles_per_page) : undefined,
        min_width: settings.min_width,
        min_height: settings.min_height,
      };
      if (settings.page_end < 9999) settingsPayload.page_end = settings.page_end;
      if (tileSize) settingsPayload.tile_size = tileSize;
      formData.append("settings_json", JSON.stringify(settingsPayload));
    }

    try {
      const res = await fetch(`${apiBase}/catalog/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        let detail = "Upload failed";
        try { detail = JSON.parse(text).detail || detail; } catch { detail = text || `HTTP ${res.status}`; }
        throw new Error(detail);
      }

      const data = await res.json();
      setCatalogName(data.catalog_name || "");
      setExtractionMode(data.extraction_mode || "");
      setPageState("done");
    } catch (err: any) {
      setError(err.message || "Extraction failed");
      setPageState(useTemplate ? "upload" : "settings");
    }
  };

  const resetAll = () => {
    setPageState("upload");
    setFile(null);
    setError("");
  };

  // ── Upload step ──
  if (pageState === "upload") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
        <div className="max-w-xl mx-auto pt-16">
          <h1 className="text-3xl font-bold text-center mb-2">Extract Tiles from Catalog</h1>
          <p className="text-gray-400 text-center mb-8">Upload a PDF catalog to extract tile images with custom settings</p>

          {/* Template toggle */}
          <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useTemplate}
                onChange={e => {
                  setUseTemplate(e.target.checked);
                  setShowTemplateInfo(false);
                }}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-200">
                  Use TileMaster Standard Template
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  100% accurate extraction from fixed-layout PDF
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateInfo(!showTemplateInfo)}
                className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Info size={16} className="text-gray-500" />
              </button>
            </label>

            {showTemplateInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 pt-4 border-t border-gray-700/50 space-y-3"
              >
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-xs text-gray-300 leading-relaxed">
                  <p className="font-semibold text-indigo-300 mb-1">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Download the template (PDF or Canva)</li>
                    <li>Place each tile image in its grid cell</li>
                    <li>Fill SKU, Size, Brand, Finish, Model fields</li>
                    <li>Upload with this checkbox ON</li>
                    <li>Extraction uses exact coordinates — guaranteed accuracy</li>
                  </ol>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`${apiBase}/catalog/template/download`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    <FileDown size={14} />
                    Download PDF Template
                  </a>
                  <a
                    href="https://www.canva.com/design/DAGe8DF_J70/8OSjJPqgnUkDOrsE5IqgCQ/edit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    <FileDown size={14} />
                    Copy Canva Design
                  </a>
                </div>
                <p className="text-[10px] text-gray-600">
                  Specs: A4, 3x4 grid (12 tiles/page). Fields: SKU, Size, Brand, Finish, Model.
                </p>
              </motion.div>
            )}
          </div>

          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-600 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-800/50"
          >
            <UploadCloud className="mx-auto mb-4 text-blue-400" size={56} />
            <p className="text-lg font-medium">Drop your PDF here, or click to browse</p>
            <p className="text-sm text-gray-500 mt-2">Max 100 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {fileError && (
            <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-xl flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-400 shrink-0" />
              <p className="text-red-200 text-sm">{fileError}</p>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-gray-500">
            Looking for the simple upload?{" "}
            <Link href="/catalog/upload" className="text-blue-400 hover:underline">Go to Upload</Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Settings step ──
  if (pageState === "settings") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText size={24} className="text-blue-400" />
            <div>
              <h2 className="text-xl font-bold">{file?.name}</h2>
              <p className="text-sm text-gray-400">{((file?.size || 0) / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Settings2 size={24} className="text-blue-400" />
            Extraction Settings
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-xl flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-400 shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Tile Size */}
            <div className="bg-gray-800/50 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Tile Size</label>
              <select
                value={settings.tile_size_preset}
                onChange={e => setSettings(s => ({ ...s, tile_size_preset: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500"
              >
                {TILE_SIZE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {settings.tile_size_preset === "custom" && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Width (mm)</label>
                    <input
                      type="number" min={1} value={settings.tile_size_custom_width}
                      onChange={e => setSettings(s => ({ ...s, tile_size_custom_width: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Height (mm)</label>
                    <input
                      type="number" min={1} value={settings.tile_size_custom_height}
                      onChange={e => setSettings(s => ({ ...s, tile_size_custom_height: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Page Range */}
            <div className="bg-gray-800/50 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Page Range</label>
              <p className="text-xs text-gray-500 mb-3">Only process pages within this range.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Start Page</label>
                  <input
                    type="number" min={1} value={settings.page_start}
                    onChange={e => setSettings(s => ({ ...s, page_start: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">End Page</label>
                  <input
                    type="number" min={1} value={settings.page_end >= 9999 ? "" : settings.page_end}
                    placeholder="Last page"
                    onChange={e => setSettings(s => ({ ...s, page_end: e.target.value ? parseInt(e.target.value) : 9999 }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Tiles Per Page */}
            <div className="bg-gray-800/50 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Tiles Per Page</label>
              <select
                value={settings.tiles_per_page}
                onChange={e => setSettings(s => ({ ...s, tiles_per_page: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white"
              >
                {TILES_PER_PAGE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Min Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-5">
                <label className="block text-sm font-medium text-gray-300 mb-1">Min Tile Image Width (pixels)</label>
                <p className="text-xs text-gray-500 mb-2">Images smaller than this are rejected.</p>
                <input
                  type="number" min={100} step={50} value={settings.min_width}
                  onChange={e => setSettings(s => ({ ...s, min_width: parseInt(e.target.value) || 500 }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white"
                />
              </div>
              <div className="bg-gray-800/50 rounded-xl p-5">
                <label className="block text-sm font-medium text-gray-300 mb-1">Min Tile Image Height (pixels)</label>
                <p className="text-xs text-gray-500 mb-2">Images smaller than this are rejected.</p>
                <input
                  type="number" min={100} step={50} value={settings.min_height}
                  onChange={e => setSettings(s => ({ ...s, min_height: parseInt(e.target.value) || 500 }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => { setPageState("upload"); setFile(null); }}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleStartExtraction}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Loader2 size={18} />
              Upload & Extract
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Processing step ──
  if (pageState === "processing") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center w-full max-w-md">
          <Loader2 size={48} className="animate-spin text-blue-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Uploading & Extracting</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Your PDF is being processed in the background. Tiles will be extracted, uploaded, and saved automatically.
          </p>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-green-400 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            />
          </div>
        </div>
      </main>
    );
  }

  // ── Done step ──
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-lg mx-auto pt-20 text-center">
        <CheckCircle size={64} className="text-green-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-2">Upload Complete</h2>
        {extractionMode && (
          <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full font-medium mb-4">
            {modeLabel[extractionMode] || extractionMode}
          </span>
        )}
        <p className="text-gray-400 mb-8">
          {catalogName ? `${catalogName} — ` : ""}Your catalog is being processed. Extracted tiles will appear in the search page once the backend finishes.
        </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={resetAll}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
            >
              Extract Another
            </button>
            <Link
              href="/catalog/search"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
            >
              Open Catalog <ChevronRight size={16} />
            </Link>
            <Link
              href="/catalog/review"
              className="px-6 py-3 border border-blue-500/30 text-blue-300 hover:bg-blue-500/10 rounded-xl font-medium transition-colors"
            >
              Review
            </Link>
          </div>
      </div>
    </main>
  );
}