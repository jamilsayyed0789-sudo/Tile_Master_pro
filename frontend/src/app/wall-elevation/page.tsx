"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useWallElevationStore } from "@/store3d";
import { Ruler, Layers, Check, Rotate3d, Upload, ImageIcon, Search } from "lucide-react";

import { applyImageAdjustments, AdjustmentSettings, DEFAULT_ADJUSTMENTS } from "../../utils/imageFilters";

type Unit = "inches" | "feet";

const TILE_SIZES = [
  { id: "12x18", label: "12 × 18 inch", wallW: 12, wallL: 18, unit: "inches" as Unit },
  { id: "2x1",   label: "2 × 1 feet",   wallW: 1,  wallL: 2,  unit: "feet" as Unit   },
  { id: "2x4",   label: "2 × 4 feet",   wallW: 4,  wallL: 2,  unit: "feet" as Unit   },
];

/* ─── Wall Plane ──────────────────────────────────────────────────── */
function WallElevation({ wallW, wallH, tex, tileW, tileH }: {
  wallW: number; wallH: number; tex: THREE.Texture | null;
  tileW?: number; tileH?: number;
}) {
  const texture = useMemo(() => {
    if (!tex) return null;
    const t = tex.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 16;
    if (tileW && tileH) {
      t.repeat.set(wallW / tileW, wallH / tileH);
    } else {
      t.repeat.set(wallW, wallH);
    }
    t.needsUpdate = true;
    return t;
  }, [tex, wallW, wallH, tileW, tileH]);

  return (
    <group>
      {/* Wall plane */}
      <mesh position={[0, 0, -0.25]}>
        <boxGeometry args={[wallW, wallH, 0.5]} />
        <meshStandardMaterial
          key={texture ? texture.uuid : "plain"}
          map={texture}
          color={texture ? undefined : "#e9ebed"}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

/* ─── Slider helper ───────────────────────────────────────────────── */
function Slider({ label, value, min, max, step = 0.5, unit = "ft", onChange }: {
  label: string; value: number; min: number; max: number;
  step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neutral-400">{label}</span>
        <span className="text-blue-400">{value} {unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}

/* ─── Toggle helper ───────────────────────────────────────────────── */
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
        checked
          ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
          : "bg-neutral-900 border-neutral-800 text-neutral-500"
      }`}
    >
      <span>{label}</span>
      <span className={`w-8 h-4 rounded-full flex items-center transition-all px-0.5 ${checked ? "bg-blue-500 justify-end" : "bg-neutral-700 justify-start"}`}>
        <span className="w-3 h-3 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function WallElevationPage() {
  // Wall dims (persisted)
  const wallWidth = useWallElevationStore((s) => s.wallWidth);
  const setWallWidth = useWallElevationStore((s) => s.setWallWidth);
  const wallHeight = useWallElevationStore((s) => s.wallHeight);
  const setWallHeight = useWallElevationStore((s) => s.setWallHeight);

  // Tile
  const tileSize = useWallElevationStore((s) => s.tileSize);
  const setTileSize = useWallElevationStore((s) => s.setTileSize);
  const [originalTileImg, setOriginalTileImg] = useState<string | null>(null);
  const [tileImg,  setTileImg]  = useState<string | null>(null);
  const [tileTex,  setTileTex]  = useState<THREE.Texture | null>(null);
  const [adjustments, setAdjustments] = useState<AdjustmentSettings>(DEFAULT_ADJUSTMENTS);

  // Read pending texture from storage
  useEffect(() => {
    import('@/utils/textureBridge').then(({ getPendingTexture, clearPendingTexture, buildTileUrl }) => {
      const pending = getPendingTexture('elevation_wall');
      if (pending) {
        const url = buildTileUrl(pending.url);
        setOriginalTileImg(url);
        clearPendingTexture('elevation_wall');
      }
    });
  }, []);

  useEffect(() => {
    if (!originalTileImg) { setTileImg(null); return; }
    let active = true;
    applyImageAdjustments(originalTileImg, adjustments).then(url => {
      if (active) {
        if (tileImg && tileImg !== originalTileImg) URL.revokeObjectURL(tileImg);
        setTileImg(url);
      }
    });
    return () => { active = false; };
  }, [originalTileImg, adjustments]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (originalTileImg && originalTileImg.startsWith("blob:")) URL.revokeObjectURL(originalTileImg);
      if (tileImg && tileImg.startsWith("blob:") && tileImg !== originalTileImg) URL.revokeObjectURL(tileImg);
    };
  }, [originalTileImg, tileImg]);

  useEffect(() => {
    if (!tileImg) { setTileTex(null); return; }
    new THREE.TextureLoader().load(tileImg, (t) => {
      t.colorSpace  = THREE.SRGBColorSpace;
      t.minFilter   = THREE.LinearFilter;
      t.magFilter   = THREE.LinearFilter;
      t.anisotropy  = 16;
      t.needsUpdate = true;
      setTileTex(t);
    });
  }, [tileImg]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (originalTileImg) URL.revokeObjectURL(originalTileImg);
      if (tileImg) URL.revokeObjectURL(tileImg);
      const url = URL.createObjectURL(file);
      setOriginalTileImg(url);
      setTileImg(url);
      setAdjustments(DEFAULT_ADJUSTMENTS);
    }
  };

  const selected  = TILE_SIZES.find(s => s.id === tileSize);
  const tileWRaw  = selected ? selected.wallW : 12;
  const tileLRaw  = selected ? selected.wallL : 12;
  const tileUnit  = selected ? selected.unit  : "inches";
  const toFeet    = (val: number, unit: Unit) => unit === "inches" ? val / 12 : val;
  const wtf = toFeet(tileWRaw, tileUnit);
  const wtl = toFeet(tileLRaw, tileUnit);
  const tileW = Math.max(wtf, wtl);
  const tileH = Math.min(wtf, wtl);

  return (
    <div className="min-h-screen bg-neutral-600 text-neutral-100 aurora-bg relative overflow-x-hidden py-8 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 radial-glow-amber opacity-30 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 radial-glow-blue opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5">
              <Rotate3d className="w-3.5 h-3.5" /> 3D Wall Elevation
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient mb-2">3D Wall Elevation</h1>
          <p className="text-neutral-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Upload a tile image and see it applied to your wall in 3D.
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ─── LEFT PANEL ──────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">


          {/* Wall Dimensions */}
          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <Ruler className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-sm">Wall Dimensions</h3>
            </div>
            <div className="space-y-3 text-sm">
              <Slider label="Width"  value={wallWidth}  min={4} max={50} onChange={setWallWidth} />
              <Slider label="Height" value={wallHeight} min={4} max={30} step={0.5} onChange={setWallHeight} />
            </div>
          </div>

          {/* Tile Size */}
          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <Layers className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-sm">Tile Size</h3>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {TILE_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setTileSize(s.id)}
                  className={`p-2 rounded-lg border text-[9px] font-bold transition-all ${
                    tileSize === s.id
                      ? "border-blue-500 ring-1 ring-blue-500/50 bg-blue-500/10"
                      : "border-white/5 hover:border-white/20"
                  }`}
                >
                  {tileSize === s.id && <Check className="w-2.5 h-2.5 mx-auto mb-0.5" />}
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tile Image */}
          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <ImageIcon className="w-4 h-4 text-green-400" />
              <h3 className="font-bold text-white text-sm">Tile Image</h3>
            </div>
            {originalTileImg ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-neutral-900 rounded-lg border border-neutral-700 p-1">
                  <img src={tileImg || undefined} alt="Tile" className="w-12 h-12 rounded object-cover" />
                  <span className="text-[10px] font-semibold text-neutral-300 flex-1">Tile Image</span>
                  <button onClick={() => {
                    if (originalTileImg && originalTileImg.startsWith("blob:")) URL.revokeObjectURL(originalTileImg);
                    if (tileImg && tileImg.startsWith("blob:") && tileImg !== originalTileImg) URL.revokeObjectURL(tileImg);
                    setOriginalTileImg(null);
                    setTileImg(null);
                    setAdjustments(DEFAULT_ADJUSTMENTS);
                  }} className="text-[10px] text-red-400 hover:text-red-300 font-bold">Remove</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1 w-full">
                <label className="flex items-center gap-2 bg-neutral-900 border border-dashed border-neutral-700 rounded-lg px-3 py-3 cursor-pointer hover:border-blue-500/50 transition-colors">
                  <Upload className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs text-neutral-500">Upload tile image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>

              </div>
            )}
          </div>

        </div>

        {/* ─── 3D CANVAS ───────────────────────────────────────────── */}
        <div className="lg:col-span-9">
          <div className="glass-card rounded-[2rem] border border-white/5 p-3 shadow-2xl" style={{ height: "700px" }}>
            <Canvas
              camera={{ position: [0, 0, 20], fov: 40, near: 0.1, far: 200 }}
              gl={{ antialias: true }}
              style={{ width: "100%", height: "100%" }}
            >
              <ambientLight intensity={0.7} />
              <directionalLight position={[6, 10, 8]}  intensity={0.9} castShadow />
              <directionalLight position={[-6, -4, -6]} intensity={0.3} />
              <pointLight position={[0, 0, 12]} intensity={0.4} color="#fffaf0" />

              <WallElevation
                wallW={wallWidth}
                wallH={wallHeight}
                tex={tileTex}
                tileW={tileW}
                tileH={tileH}
              />

              <OrbitControls
                enableDamping
                dampingFactor={0.1}
                minDistance={3}
                maxDistance={60}
                target={[0, 0, 0]}
              />
            </Canvas>
          </div>

          {/* Legend */}
          <div className="mt-4 flex gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-neutral-900/60 border border-white/5 rounded-xl px-4 py-2.5">
              <span className="w-3 h-3 rounded-sm bg-neutral-600" />
              <span className="text-xs text-neutral-400 font-medium">Wall — Tiled Surface</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
