"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useWallElevationStore } from "@/store3d";
import { Ruler, Layers, Check, Rotate3d, Upload, ImageIcon, DoorOpen, AppWindow, Search } from "lucide-react";

import { applyImageAdjustments, AdjustmentSettings, DEFAULT_ADJUSTMENTS } from "../../utils/imageFilters";

type Unit = "inches" | "feet";

const TILE_SIZES = [
  { id: "12x18", label: "12 × 18 inch", wallW: 12, wallL: 18, unit: "inches" as Unit },
  { id: "2x1",   label: "2 × 1 feet",   wallW: 1,  wallL: 2,  unit: "feet" as Unit   },
  { id: "2x4",   label: "2 × 4 feet",   wallW: 4,  wallL: 2,  unit: "feet" as Unit   },
];

/* ─── Door 3D ─────────────────────────────────────────────────────── */
function Door3D({ doorW, doorH, wallW, wallH, posX }: {
  doorW: number; doorH: number;
  wallW: number; wallH: number;
  posX: number;
}) {
  const frameT = 0.12; // frame thickness in feet
  const depth  = 0.08; // z extrusion
  const cx = (posX / 100) * (wallW - doorW) - (wallW / 2 - doorW / 2);
  const cy = -wallH / 2 + doorH / 2;

  return (
    <>
      {/* ── Backing panel — covers tile texture behind door ── */}
      <mesh position={[cx, cy, 0.008]}>
        <planeGeometry args={[doorW, doorH]} />
        <meshStandardMaterial color="#e8e4d9" roughness={0.9} />
      </mesh>
      <group position={[cx, cy, 0.05]}>
      {/* ── Timber Panel (dark walnut) ── */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[doorW - frameT * 2, doorH - frameT * 2, depth]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.8} metalness={0.05} />
      </mesh>

      {/* ── Panel inset highlight ── */}
      <mesh position={[0, doorH * 0.15, depth * 0.5 + 0.001]}>
        <boxGeometry args={[doorW * 0.55, doorH * 0.32, 0.01]} />
        <meshStandardMaterial color="#4a3018" roughness={0.9} />
      </mesh>
      <mesh position={[0, -doorH * 0.2, depth * 0.5 + 0.001]}>
        <boxGeometry args={[doorW * 0.55, doorH * 0.42, 0.01]} />
        <meshStandardMaterial color="#4a3018" roughness={0.9} />
      </mesh>

      {/* ── Left frame ── */}
      <mesh position={[-(doorW / 2 - frameT / 2), 0, depth * 0.5]}>
        <boxGeometry args={[frameT, doorH, depth + 0.04]} />
        <meshStandardMaterial color="#2c1a0e" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* ── Right frame ── */}
      <mesh position={[doorW / 2 - frameT / 2, 0, depth * 0.5]}>
        <boxGeometry args={[frameT, doorH, depth + 0.04]} />
        <meshStandardMaterial color="#2c1a0e" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* ── Top frame ── */}
      <mesh position={[0, doorH / 2 - frameT / 2, depth * 0.5]}>
        <boxGeometry args={[doorW, frameT, depth + 0.04]} />
        <meshStandardMaterial color="#2c1a0e" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* ── Gold handle ── */}
      <mesh position={[doorW * 0.3, 0, depth + 0.06]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#d4a017" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[doorW * 0.3, 0, depth + 0.035]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.12, 10]} />
        <meshStandardMaterial color="#b8860b" metalness={0.85} roughness={0.2} />
      </mesh>
    </group>
    </>
  );
}

/* ─── Window 3D ───────────────────────────────────────────────────── */
function Window3D({ winW, winH, wallW, wallH, posX, posY }: {
  winW: number; winH: number;
  wallW: number; wallH: number;
  posX: number; posY: number;
}) {
  const frameT = 0.1;
  const depth  = 0.07;
  const cx = (posX / 100) * (wallW - winW) - (wallW / 2 - winW / 2);
  // posY 0 = bottom area, 100 = top area, clamped so window stays inside
  const cyRange = wallH - winH;
  const cy = -wallH / 2 + winH / 2 + (posY / 100) * cyRange;

  return (
    // Covers tile texture behind the window opening
    <>
    <mesh position={[cx, cy, 0.008]}>
        <planeGeometry args={[winW, winH]} />
        <meshStandardMaterial color="#e8e4d9" roughness={0.9} />
      </mesh>
      <group position={[cx, cy, 0.06]}>
      {/* ── Glass pane (semi-transparent) ── */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[winW - frameT * 2, winH - frameT * 2, 0.02]} />
        <meshStandardMaterial
          color="#88ccff"
          transparent
          opacity={0.35}
          metalness={0.1}
          roughness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Horizontal divider ── */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[winW - frameT * 2, 0.04, 0.03]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* ── Vertical divider ── */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[0.04, winH - frameT * 2, 0.03]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* ── Left frame ── */}
      <mesh position={[-(winW / 2 - frameT / 2), 0, depth * 0.5]}>
        <boxGeometry args={[frameT, winH, depth + 0.04]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* ── Right frame ── */}
      <mesh position={[winW / 2 - frameT / 2, 0, depth * 0.5]}>
        <boxGeometry args={[frameT, winH, depth + 0.04]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* ── Top frame ── */}
      <mesh position={[0, winH / 2 - frameT / 2, depth * 0.5]}>
        <boxGeometry args={[winW, frameT, depth + 0.04]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* ── Bottom frame ── */}
      <mesh position={[0, -(winH / 2 - frameT / 2), depth * 0.5]}>
        <boxGeometry args={[winW, frameT, depth + 0.04]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* ── Window sill ledge ── */}
      <mesh position={[0, -(winH / 2) - 0.04, depth]}>
        <boxGeometry args={[winW + 0.2, 0.08, 0.14]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
    </>
  );
}

/* ─── Wall Plane ──────────────────────────────────────────────────── */
function WallElevation({ wallW, wallH, tex, tileW, tileH, showDoor, doorW, doorH, doorPosX, showWindow, winW, winH, winPosX, winPosY }: {
  wallW: number; wallH: number; tex: THREE.Texture | null;
  tileW?: number; tileH?: number;
  showDoor: boolean; doorW: number; doorH: number; doorPosX: number;
  showWindow: boolean; winW: number; winH: number; winPosX: number; winPosY: number;
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
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[wallW, wallH]} />
        <meshStandardMaterial
          key={texture ? texture.uuid : "plain"}
          map={texture}
          color={texture ? undefined : "#94a3b8"}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      {/* Door */}
      {showDoor && (
        <Door3D
          doorW={doorW}
          doorH={doorH}
          wallW={wallW}
          wallH={wallH}
          posX={doorPosX}
        />
      )}

      {/* Window */}
      {showWindow && (
        <Window3D
          winW={winW}
          winH={winH}
          wallW={wallW}
          wallH={wallH}
          posX={winPosX}
          posY={winPosY}
        />
      )}
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
        <span className="text-amber-400">{value} {unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
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
          ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
          : "bg-neutral-900 border-neutral-800 text-neutral-500"
      }`}
    >
      <span>{label}</span>
      <span className={`w-8 h-4 rounded-full flex items-center transition-all px-0.5 ${checked ? "bg-amber-500 justify-end" : "bg-neutral-700 justify-start"}`}>
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

  // Door (persisted)
  const showDoor = useWallElevationStore((s) => s.showDoor);
  const setShowDoor = useWallElevationStore((s) => s.setShowDoor);
  const doorW = useWallElevationStore((s) => s.doorW);
  const setDoorW = useWallElevationStore((s) => s.setDoorW);
  const doorH = useWallElevationStore((s) => s.doorH);
  const setDoorH = useWallElevationStore((s) => s.setDoorH);
  const doorPosX = useWallElevationStore((s) => s.doorPosX);
  const setDoorPosX = useWallElevationStore((s) => s.setDoorPosX);

  // Window (persisted)
  const showWindow = useWallElevationStore((s) => s.showWindow);
  const setShowWindow = useWallElevationStore((s) => s.setShowWindow);
  const winW = useWallElevationStore((s) => s.winW);
  const setWinW = useWallElevationStore((s) => s.setWinW);
  const winH = useWallElevationStore((s) => s.winH);
  const setWinH = useWallElevationStore((s) => s.setWinH);
  const winPosX = useWallElevationStore((s) => s.winPosX);
  const setWinPosX = useWallElevationStore((s) => s.setWinPosX);
  const winPosY = useWallElevationStore((s) => s.winPosY);
  const setWinPosY = useWallElevationStore((s) => s.setWinPosY);


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

  // Clamp door height to wall height
  const clampedDoorH  = Math.min(doorH,  wallHeight - 0.5);
  const clampedDoorW  = Math.min(doorW,  wallWidth  - 0.5);
  const clampedWinH   = Math.min(winH,   wallHeight - 1);
  const clampedWinW   = Math.min(winW,   wallWidth  - 1);

  return (
    <div className="min-h-screen bg-neutral-600 text-neutral-100 aurora-bg relative overflow-x-hidden py-8 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 radial-glow-amber opacity-30 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 radial-glow-blue opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
              <Rotate3d className="w-3.5 h-3.5" /> 3D Wall Elevation
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient mb-2">3D Wall Elevation</h1>
          <p className="text-neutral-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Upload a tile image and see it applied to your wall in 3D — complete with a real door and window.
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ─── LEFT PANEL ──────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">


          {/* Wall Dimensions */}
          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <Ruler className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Wall Dimensions</h3>
            </div>
            <div className="space-y-3 text-sm">
              <Slider label="Width"  value={wallWidth}  min={4} max={20} onChange={setWallWidth} />
              <Slider label="Height" value={wallHeight} min={4} max={14} step={0.5} onChange={setWallHeight} />
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
                      ? "border-amber-500 ring-1 ring-amber-500/50 bg-amber-500/10"
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

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <h4 className="text-xs font-bold text-neutral-450 uppercase tracking-wider">
                    Adjust Custom Image
                  </h4>

                  {/* Rotation Selector */}
                  <div>
                    <span className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                      Rotation
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 bg-neutral-600 rounded-xl p-1 border border-neutral-900">
                      {[0, 90, 180, 270].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => setAdjustments(prev => ({ ...prev, rotation: deg }))}
                          className={`py-1 text-xs font-bold rounded-lg transition-all ${
                            adjustments.rotation === deg
                              ? 'bg-amber-500 text-black shadow'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brightness & Contrast */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400 mb-0.5">
                        <span>Brightness</span>
                        <span className="text-amber-400 font-mono">{adjustments.brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={adjustments.brightness}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setAdjustments(prev => ({ ...prev, brightness: val }));
                        }}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400 mb-0.5">
                        <span>Contrast</span>
                        <span className="text-amber-400 font-mono">{adjustments.contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={adjustments.contrast}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setAdjustments(prev => ({ ...prev, contrast: val }));
                        }}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>

                  {/* Saturation & Hue-Rotate */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400 mb-0.5">
                        <span>Saturation</span>
                        <span className="text-amber-400 font-mono">{adjustments.saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={adjustments.saturation}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setAdjustments(prev => ({ ...prev, saturation: val }));
                        }}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400 mb-0.5">
                        <span>Hue-Rotate</span>
                        <span className="text-amber-400 font-mono">{adjustments.hueRotate}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={adjustments.hueRotate}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setAdjustments(prev => ({ ...prev, hueRotate: val }));
                        }}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>

                  {/* Scale / Repeat */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400 mb-0.5">
                        <span>Scale X</span>
                        <span className="text-amber-400 font-mono">{adjustments.scaleX.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={adjustments.scaleX}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setAdjustments(prev => ({ ...prev, scaleX: val }));
                        }}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400 mb-0.5">
                        <span>Scale Y</span>
                        <span className="text-amber-400 font-mono">{adjustments.scaleY.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={adjustments.scaleY}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setAdjustments(prev => ({ ...prev, scaleY: val }));
                        }}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>

                  {/* Position Shift */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400 mb-0.5">
                        <span>Shift X</span>
                        <span className="text-amber-400 font-mono">{adjustments.offsetX.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.05"
                        value={adjustments.offsetX}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setAdjustments(prev => ({ ...prev, offsetX: val }));
                        }}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400 mb-0.5">
                        <span>Shift Y</span>
                        <span className="text-amber-400 font-mono">{adjustments.offsetY.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.05"
                        value={adjustments.offsetY}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setAdjustments(prev => ({ ...prev, offsetY: val }));
                        }}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>

                  {/* Reset Button */}
                  <button
                    type="button"
                    onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
                    className="w-full py-1.5 bg-neutral-600 border border-neutral-900 hover:border-neutral-850 hover:bg-neutral-900 rounded-xl text-neutral-400 hover:text-white transition text-[10px] font-bold flex items-center justify-center gap-1.5"
                  >
                    Reset Adjustments
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1 w-full">
                <label className="flex items-center gap-2 bg-neutral-900 border border-dashed border-neutral-700 rounded-lg px-3 py-3 cursor-pointer hover:border-amber-500/50 transition-colors">
                  <Upload className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs text-neutral-500">Upload tile image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>

              </div>
            )}
          </div>

          {/* Door Controls */}
          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <DoorOpen className="w-4 h-4 text-orange-400" />
              <h3 className="font-bold text-white text-sm">Door</h3>
            </div>
            <div className="space-y-3">
              <Toggle label="Show Door" checked={showDoor} onChange={setShowDoor} />
              {showDoor && (
                <div className="space-y-3 pt-1">
                  <Slider label="Width"    value={doorW}    min={1.5} max={Math.min(5, wallWidth - 1)}  step={0.5} onChange={setDoorW} />
                  <Slider label="Height"   value={doorH}    min={5}   max={Math.min(10, wallHeight - 0.5)} step={0.5} onChange={setDoorH} />
                  <Slider label="Position" value={doorPosX} min={0}   max={100} step={1} unit="%" onChange={setDoorPosX} />
                </div>
              )}
            </div>
          </div>

          {/* Window Controls */}
          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <AppWindow className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Window</h3>
            </div>
            <div className="space-y-3">
              <Toggle label="Show Window" checked={showWindow} onChange={setShowWindow} />
              {showWindow && (
                <div className="space-y-3 pt-1">
                  <Slider label="Width"      value={winW}    min={1}  max={Math.min(6, wallWidth - 1)}  step={0.5} onChange={setWinW} />
                  <Slider label="Height"     value={winH}    min={1}  max={Math.min(5, wallHeight - 2)} step={0.5} onChange={setWinH} />
                  <Slider label="Horiz. Pos" value={winPosX} min={0}  max={100} step={1} unit="%" onChange={setWinPosX} />
                  <Slider label="Vert. Pos"  value={winPosY} min={0}  max={100} step={1} unit="%" onChange={setWinPosY} />
                </div>
              )}
            </div>
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
                showDoor={showDoor}
                doorW={clampedDoorW}
                doorH={clampedDoorH}
                doorPosX={doorPosX}
                showWindow={showWindow}
                winW={clampedWinW}
                winH={clampedWinH}
                winPosX={winPosX}
                winPosY={winPosY}
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
              <span className="w-3 h-3 rounded-sm bg-[#5c3d1e] border border-[#2c1a0e]" />
              <span className="text-xs text-neutral-400 font-medium">Door — Timber Panel</span>
            </div>
            <div className="flex items-center gap-2 bg-neutral-900/60 border border-white/5 rounded-xl px-4 py-2.5">
              <span className="w-3 h-3 rounded-sm bg-[#88ccff]/60 border border-[#1e293b]" />
              <span className="text-xs text-neutral-400 font-medium">Window — Tinted Glass</span>
            </div>
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
