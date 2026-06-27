"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QrCode, Download, Upload, CheckCircle, AlertTriangle, Loader2, Copy } from "lucide-react";
import Link from "next/link";

export default function QRGeneratorPage() {
  const [tileName, setTileName] = useState("");
  const [tileNumber, setTileNumber] = useState("");
  const [tileSize, setTileSize] = useState("600x600");
  const [finish, setFinish] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [downloadSize, setDownloadSize] = useState(3);
  const [pricePerSqft, setPricePerSqft] = useState("");

  // Always use the Next.js proxy — avoids CORS issues in all environments
  const apiBase = "/api";

  const SIZE_OPTIONS = [
    "300x300", "300x450", "300x600", "300x900", "300x1200",
    "400x400", "450x450", "600x600", "600x1200",
    "800x800", "800x1200", "800x1600", "800x2400", "800x3000",
    "1000x1000", "1200x1200", "1200x1800", "1200x2400", "1600x3200"
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const generateQR = async () => {
    if (!tileName.trim() || !tileNumber.trim()) {
      setError("Tile Name and Tile Number are required");
      return;
    }
    setIsGenerating(true);
    setError("");

    const fd = new FormData();
    fd.append("tile_name", tileName.trim());
    fd.append("tile_number", tileNumber.trim());
    fd.append("tile_size", tileSize);
    if (finish.trim()) fd.append("finish", finish.trim());
    if (pricePerSqft.trim()) fd.append("price_per_sqft", pricePerSqft.trim());
    if (imageFile) fd.append("tile_image", imageFile);

    try {
      const res = await fetch(`${apiBase}/tile/generate-qr`, { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-3xl mx-auto pt-10">
        <div className="flex items-center gap-4 mb-8">
          <QrCode className="w-8 h-8 text-indigo-400" />
          <div>
            <h1 className="text-3xl font-bold">Generate QR Code for Tile</h1>
            <p className="text-neutral-400 text-sm mt-1">Create a scannable QR code that customers can use to visualize this tile in 3D</p>
          </div>
        </div>

        {!result ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-900/50 border border-white/5 rounded-2xl p-8 space-y-6"
          >
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-lg flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Tile Name *</label>
                  <input value={tileName} onChange={e => setTileName(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Endless Glossy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Tile Number / SKU *</label>
                  <input value={tileNumber} onChange={e => setTileNumber(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. 38223" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Tile Size</label>
                  <select value={tileSize} onChange={e => setTileSize(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s} mm</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Finish (optional)</label>
                  <input value={finish} onChange={e => setFinish(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Glossy, Matte, Textured" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Price per sq.ft (₹) <span className="text-neutral-500 font-normal">(optional)</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={pricePerSqft}
                      onChange={e => setPricePerSqft(e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-7 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. 120"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Tile Image</label>
                <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors cursor-pointer relative">
                  <input type="file" accept="image/*" onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                  ) : (
                    <div className="flex flex-col items-center py-4">
                      <Upload className="w-10 h-10 text-neutral-500 mb-2" />
                      <p className="text-sm text-neutral-400">Upload tile image</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button onClick={generateQR} disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><QrCode className="w-5 h-5" /> Generate QR Code</>}
            </button>

            <p className="text-xs text-neutral-500 text-center">
              Your tile will get a unique QR code. Print and stick it on the physical sample in your showroom.
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-2xl p-6 mb-6 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="text-emerald-300 font-semibold">QR Code Generated Successfully!</p>
                <p className="text-emerald-400/70 text-sm mt-0.5">Tile URL: {result.tile_url}</p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(result.tile_url); }}
                className="ml-auto p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                title="Copy tile URL"
              >
                <Copy className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
                {result.qr_code_url && (
                  <div className="flex flex-col items-center mb-4">
                    <img src={result.qr_code_url} alt="QR Code" className="w-48 h-48 mb-3 bg-white p-2 rounded-xl" />
                    <a href={`${apiBase}/tile/${result.tile_id}/qr-code?format=png`}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-xs font-medium rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Image (PNG)
                    </a>
                  </div>
                )}
                <p className="font-semibold">{result.tile.tile_name}</p>
                <p className="text-sm text-neutral-400">SKU: {result.tile.tile_number} | {result.tile.tile_size}</p>
                {result.tile.finish && <p className="text-xs text-neutral-500 mt-1">Finish: {result.tile.finish}</p>}
                {result.tile.price_per_sqft != null && (
                  <p className="text-sm font-semibold text-emerald-400 mt-2">₹{result.tile.price_per_sqft.toFixed(0)} / sq.ft</p>
                )}
              </div>

              <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Download Printable QR Label</h3>
                <div className="space-y-3">
                  {[2, 3, 4].map(size => (
                    <a key={size}
                      href={`${apiBase}/tile/${result.tile_id}/qr-code?size=${size}`}
                      className="flex items-center justify-between p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors group"
                    >
                      <div>
                        <p className="font-medium text-sm">{size}×{size} inches</p>
                        <p className="text-xs text-neutral-500">
                          {size === 2 ? "Small (for tile samples)" : size === 3 ? "Standard" : "Large (for floor displays)"}
                        </p>
                      </div>
                      <Download className="w-5 h-5 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => { setResult(null); setImageFile(null); setImagePreview(""); }}
                className="flex-1 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors font-medium"
              >
                Generate Another
              </button>
              <Link href="/catalog/search"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium text-center transition-colors"
              >
                View All Tiles
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
