"use client";
import React, { useState } from "react";
import { UploadCloud, Sparkles, SlidersHorizontal, Image as ImageIcon, CheckCircle2, Download, Play } from "lucide-react";
import BeforeAfterSlider from "@/components/AiBathroom/BeforeAfterSlider";

export default function AIBathroomPage() {
  const [bathroomImage, setBathroomImage] = useState<string | null>(null);
  const [tileImage, setTileImage] = useState<string | null>(null);
  const [tileSize, setTileSize] = useState("600x1200");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [options, setOptions] = useState({
    keepLayout: true,
    autoPerspective: true,
    hdRender: true,
    shadowMatching: true,
    reflectionMatching: true,
  });

  const tileSizes = [
    "300×450 mm",
    "300×600 mm",
    "600×600 mm",
    "600×1200 mm",
    "800×1600 mm",
    "1200×1800 mm",
    "1200×2400 mm"
  ];

  const [bathroomFile, setBathroomFile] = useState<File | null>(null);
  const [tileFile, setTileFile] = useState<File | null>(null);

  const handleBathroomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBathroomFile(file);
      setBathroomImage(URL.createObjectURL(file));
      setGeneratedImage(null); // Reset generated image when new source is uploaded
    }
  };

  const handleTileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTileFile(file);
      setTileImage(URL.createObjectURL(file));
    }
  };

  const uploadFileToAPI = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
    const res = await fetch(`${API_URL}/api/ai/bathroom/upload`, {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const handleGenerate = async () => {
    if (!bathroomFile || !tileFile) return;
    
    setIsGenerating(true);
    
    try {
      // 1. Upload both files
      const bathroomUrl = await uploadFileToAPI(bathroomFile);
      const tileUrl = await uploadFileToAPI(tileFile);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      
      // 2. Start Generation Task
      const generateRes = await fetch(`${API_URL}/api/ai/bathroom/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bathroom_image_url: bathroomUrl,
          tile_image_url: tileUrl,
          tile_size: tileSize,
          options,
        }),
      });
      
      if (!generateRes.ok) throw new Error("Generation failed to start");
      const { task_id } = await generateRes.json();
      
      // 3. Poll for status
      const pollStatus = async () => {
        const statusRes = await fetch(`${API_URL}/api/ai/bathroom/status/${task_id}`);
        if (!statusRes.ok) throw new Error("Failed to check status");
        
        const statusData = await statusRes.json();
        
        if (statusData.status === "completed") {
          // Add API_URL prefix because result_url from mock is just a relative path or the uploaded image path
          setGeneratedImage(statusData.result_url.startsWith('http') ? statusData.result_url : `${API_URL}${statusData.result_url}`);
          setIsGenerating(false);
        } else if (statusData.status === "failed") {
          console.error("AI Generation failed:", statusData.error);
          setIsGenerating(false);
          alert("Generation failed!");
        } else {
          // Keep polling
          setTimeout(pollStatus, 2000);
        }
      };
      
      pollStatus();
      
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-semibold mb-4">
          <Sparkles className="w-4 h-4" />
          Powered by Advanced AI
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white font-space-grotesk tracking-tight mb-4">
          AI Bathroom <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Recreation</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Upload any bathroom inspiration image and see it instantly recreated with your selected tiles. 
          Perfect perspective, lighting, and reflections.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Step 1: Upload Bathroom */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">1</span>
              Bathroom Image
            </h3>
            
            <label className={`relative flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${bathroomImage ? 'border-blue-500 bg-blue-500/5' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800'}`}>
              {bathroomImage ? (
                <div className="absolute inset-0 p-2">
                  <img src={bathroomImage} alt="Uploaded Bathroom" className="w-full h-full object-cover rounded-lg" />
                  <div className="absolute top-4 right-4 bg-slate-900/80 p-1.5 rounded-lg text-white">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 text-slate-400 mb-3" />
                  <p className="mb-1 text-sm text-slate-300 font-medium">Click to upload image</p>
                  <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                </div>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleBathroomUpload} />
            </label>
          </div>

          {/* Step 2: Select Tile */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">2</span>
              Tile Texture
            </h3>
            
            <label className={`relative flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${tileImage ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800'}`}>
              {tileImage ? (
                <div className="absolute inset-0 p-2">
                  <img src={tileImage} alt="Uploaded Tile" className="w-full h-full object-cover rounded-lg" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-300 font-medium">Upload Tile Image</p>
                </div>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleTileUpload} />
            </label>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">Tile Size</label>
              <select 
                value={tileSize}
                onChange={(e) => setTileSize(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              >
                {tileSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 3: AI Settings */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-400" />
              AI Options
            </h3>
            <div className="space-y-3">
              {Object.entries(options).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={value}
                      onChange={() => setOptions({...options, [key]: !value})}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button 
            onClick={handleGenerate}
            disabled={!bathroomImage || !tileImage || isGenerating}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
              ${(!bathroomImage || !tileImage) ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
              : isGenerating ? 'bg-indigo-600 text-white cursor-wait animate-pulse' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25 hover:-translate-y-0.5'}`}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                Generating Bathroom...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Generate Bathroom
              </>
            )}
          </button>
        </div>

        {/* Right Column: Result/Preview */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-2 flex-grow flex items-center justify-center min-h-[500px] overflow-hidden relative shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]">
            
            {!bathroomImage && !generatedImage && (
              <div className="text-center text-slate-500">
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Upload an image to start</p>
              </div>
            )}

            {bathroomImage && !generatedImage && !isGenerating && (
              <img src={bathroomImage} alt="Original Bathroom" className="w-full h-full object-contain rounded-2xl" />
            )}

            {isGenerating && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-2xl">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-white mb-2">AI is working its magic...</h3>
                <p className="text-slate-400">Analyzing perspective, mapping tiles, calculating lighting.</p>
              </div>
            )}

            {generatedImage && !isGenerating && bathroomImage && (
              <div className="w-full h-full rounded-2xl overflow-hidden">
                <BeforeAfterSlider 
                  beforeImage={bathroomImage} 
                  afterImage={generatedImage} 
                  beforeLabel="Original"
                  afterLabel="AI Recreated"
                />
              </div>
            )}
          </div>

          {/* Action Bar (Only shows when result is ready) */}
          {generatedImage && !isGenerating && (
            <div className="mt-4 flex justify-end">
              <button className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Render
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
