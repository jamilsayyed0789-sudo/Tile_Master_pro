"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useKitchen3DStore } from "@/store3d";
import { Upload, ImageIcon, CookingPot, LayoutGrid, Paintbrush, Rotate3d, Maximize2, Minimize2, Search, Ruler } from "lucide-react";


function Kitchen3D({ roomW, roomL, roomH, backsplashTex, tileSize, countertopColor, countertopTex, tileRotation, counterDepth, slabMode, highlighterTex, highlighterRows, floorTex, floorTileSize, stripColor, stripWidthMm, stripInterval }: {
  roomW: number; roomL: number; roomH: number; backsplashTex: THREE.Texture | null; tileSize: string; countertopColor: string; countertopTex: THREE.Texture | null; tileRotation: number; counterDepth: number; slabMode: boolean; highlighterTex: THREE.Texture | null; highlighterRows: number; floorTex: THREE.Texture | null; floorTileSize: string; stripColor?: string | null; stripWidthMm?: number; stripInterval?: number;
}) {
  const counterH = 3;
  const cabinetH = 2.5;
  const lDepth = roomL * 0.55;
  const kTileW = tileSize === "12x18" ? 1.5 : tileSize === "2x1" ? 2 : 4;
  const kTileH = tileSize === "12x18" ? 1 : tileSize === "2x1" ? 1 : 2;
  const fTileW = floorTileSize === "2x2" ? 2 : floorTileSize === "2x4" ? 4 : 5;
  const fTileH = floorTileSize === "2x2" ? 2 : floorTileSize === "2x4" ? 2 : 2.5;

  const getTiledBacksplashTex = (width: number) => {
    if (!backsplashTex) return null;
    const tex = backsplashTex.clone();
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(width / kTileW, (roomH - counterH) / kTileH);
    tex.rotation = tileRotation * (Math.PI / 180);
    tex.center.set(0.5, 0.5);
    tex.needsUpdate = true;
    return tex;
  };

  const getStripTex = (tileW: number, tileH: number, interval: number) => {
    if (!stripColor || !stripWidthMm) return null;
    const base = 1024;
    const maxDim = Math.max(tileW, tileH);
    const wPx = Math.round((tileW / maxDim) * base);
    const hPx = Math.round((tileH / maxDim) * base);
    const stripPx = Math.max(4, Math.round(stripWidthMm * 10 / (tileH * 304.8) * hPx));
    const canvasH = hPx * interval;
    const c = document.createElement("canvas");
    c.width = wPx;
    c.height = canvasH;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, wPx, canvasH);
    const hexMap: Record<string, string> = { golden: "#D4AF37", silver: "#C0C0C0", black: "#111111" };
    const hex = hexMap[stripColor] || stripColor;
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, wPx, stripPx);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    tex.needsUpdate = true;
    return tex;
  };
  const stripTex = useMemo(() => getStripTex(kTileW, kTileH, stripInterval || 1), [stripColor, stripWidthMm, stripInterval, kTileW, kTileH]);

  const getHighlighterTex = (width: number) => {
    if (!highlighterTex) return null;
    const img = highlighterTex.image as HTMLImageElement;
    if (!img) return null;
    const base = 256;
    const maxDim = Math.max(kTileW, kTileH);
    const wPx = Math.round((kTileW / maxDim) * base);
    const hPx = Math.round((kTileH / maxDim) * base);
    const cellsX = Math.ceil(width / kTileW);
    const cellsY = highlighterRows;
    const c = document.createElement("canvas");
    c.width = wPx * cellsX;
    c.height = hPx * cellsY;
    const ctx = c.getContext("2d")!;
    for (let row = 0; row < cellsY; row++) {
      for (let col = 0; col < cellsX; col++) {
        ctx.drawImage(img, col * wPx, row * hPx, wPx, hPx);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    tex.needsUpdate = true;
    return tex;
  };

  const makeStripOverlay = (w: number, h: number) => {
    if (!stripTex) return null;
    const t = stripTex.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    const interval = stripInterval || 1;
    t.repeat.set(w / kTileW, h / (kTileH * interval));
    t.needsUpdate = true;
    return t;
  };

  const BackWall = () => {
    const tex = getTiledBacksplashTex(roomW);
    const hlTex = getHighlighterTex(roomW);
    const hlHeight = kTileH * highlighterRows;
    const bsHeight = roomH - counterH;
    const hlY = counterH + (bsHeight - hlHeight) / 2;
    const lowerH = hlY - counterH;
    const upperH = roomH - hlY - hlHeight;
    const stripOverlay = (w: number, h: number) => {
      const t = makeStripOverlay(w, h);
      return t ? (
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={t} transparent opacity={1} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ) : null;
    };
    return (
      <group>
        <mesh position={[roomW / 2, counterH / 2, 0]}>
          <planeGeometry args={[roomW, counterH]} />
          <meshStandardMaterial color="#e8e0d0" roughness={0.6} />
        </mesh>
        {highlighterTex ? (
          <>
            {lowerH > 0 && (
              <group position={[roomW / 2, counterH + lowerH / 2, 0]}>
                <mesh>
                  <planeGeometry args={[roomW, lowerH]} />
                  <meshStandardMaterial map={tex} color={tex ? undefined : "#f5f0e8"} roughness={0.6} />
                </mesh>
                {stripOverlay(roomW, lowerH)}
              </group>
            )}
            <group position={[roomW / 2, hlY + hlHeight / 2, 0.002]}>
              <mesh>
                <planeGeometry args={[roomW, hlHeight]} />
                <meshStandardMaterial map={hlTex} color={hlTex ? undefined : "#d4a017"} roughness={0.6} />
              </mesh>
            </group>
            {upperH > 0 && (
              <group position={[roomW / 2, hlY + hlHeight + upperH / 2, 0]}>
                <mesh>
                  <planeGeometry args={[roomW, upperH]} />
                  <meshStandardMaterial map={tex} color={tex ? undefined : "#f5f0e8"} roughness={0.6} />
                </mesh>
                {stripOverlay(roomW, upperH)}
              </group>
            )}
          </>
        ) : (
          <group position={[roomW / 2, counterH + bsHeight / 2, 0]}>
            <mesh>
              <planeGeometry args={[roomW, bsHeight]} />
              <meshStandardMaterial map={tex} color={tex ? undefined : "#f5f0e8"} roughness={0.6} />
            </mesh>
            {stripOverlay(roomW, bsHeight)}
          </group>
        )}
      </group>
    );
  };

  const LeftWallTile = () => {
    const tex = getTiledBacksplashTex(lDepth);
    const hlTex = getHighlighterTex(lDepth);
    const hlHeight = kTileH * highlighterRows;
    const bsHeight = roomH - counterH;
    const hlY = counterH + (bsHeight - hlHeight) / 2;
    const lowerH = hlY - counterH;
    const upperH = roomH - hlY - hlHeight;
    const stripOverlay = (w: number, h: number, zOff: number) => {
      const t = makeStripOverlay(w, h);
      return t ? (
        <mesh position={[0, 0, zOff]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={t} transparent opacity={1} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ) : null;
    };
    return (
      <group>
        <mesh position={[0, counterH / 2, lDepth / 2 + 0.02]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[lDepth, counterH]} />
          <meshStandardMaterial color="#e8e0d0" roughness={0.6} />
        </mesh>
        {highlighterTex ? (
          <>
            {lowerH > 0 && (
              <group position={[0, counterH + lowerH / 2, lDepth / 2 + 0.02]} rotation={[0, Math.PI / 2, 0]}>
                <mesh>
                  <planeGeometry args={[lDepth, lowerH]} />
                  <meshStandardMaterial map={tex} color={tex ? undefined : "#e8e0d0"} roughness={0.6} />
                </mesh>
                {stripOverlay(lDepth, lowerH, 0.001)}
              </group>
            )}
            <mesh position={[0, hlY + hlHeight / 2, lDepth / 2 + 0.022]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[lDepth, hlHeight]} />
              <meshStandardMaterial map={hlTex} color={hlTex ? undefined : "#d4a017"} roughness={0.6} />
            </mesh>
            {upperH > 0 && (
              <group position={[0, hlY + hlHeight + upperH / 2, lDepth / 2 + 0.02]} rotation={[0, Math.PI / 2, 0]}>
                <mesh>
                  <planeGeometry args={[lDepth, upperH]} />
                  <meshStandardMaterial map={tex} color={tex ? undefined : "#e8e0d0"} roughness={0.6} />
                </mesh>
                {stripOverlay(lDepth, upperH, 0.001)}
              </group>
            )}
          </>
        ) : (
          <group position={[0, counterH + bsHeight / 2, lDepth / 2 + 0.02]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <planeGeometry args={[lDepth, bsHeight]} />
              <meshStandardMaterial map={tex} color={tex ? undefined : "#e8e0d0"} roughness={0.6} />
            </mesh>
            {stripOverlay(lDepth, bsHeight, 0.001)}
          </group>
        )}
      </group>
    );
  };

  // Lower cabinets (L-shape)
  const cabinZ = 1.8;
  const counterZ = counterDepth;
  const LowerCabinets = () => (
    <group>
      {/* Back wall run (starts after left wall cabinet depth) */}
      <mesh position={[(cabinZ + roomW) / 2, counterH / 2, cabinZ / 2]}>
        <boxGeometry args={[roomW - cabinZ, counterH, cabinZ]} />
        <meshStandardMaterial color="#b8a898" roughness={0.6} />
      </mesh>
      {/* Left wall run */}
      <mesh position={[cabinZ / 2, counterH / 2, lDepth / 2]}>
        <boxGeometry args={[cabinZ, counterH, lDepth]} />
        <meshStandardMaterial color="#b8a898" roughness={0.6} />
      </mesh>
    </group>
  );

  // Countertop
  const counterTileFeet = 2;
  const getSlabCounterTex = () => {
    if (!countertopTex) return null;
    const backTex = countertopTex.clone();
    backTex.wrapS = backTex.wrapT = THREE.RepeatWrapping;
    backTex.repeat.set((roomW - counterZ) / counterTileFeet, counterZ / counterTileFeet);
    backTex.offset.set(0, 0);
    backTex.needsUpdate = true;
    const leftTex = countertopTex.clone();
    leftTex.wrapS = leftTex.wrapT = THREE.RepeatWrapping;
    leftTex.repeat.set(counterZ / counterTileFeet, lDepth / counterTileFeet);
    leftTex.offset.set(counterZ / counterTileFeet, 0);
    leftTex.needsUpdate = true;
    return { backTex, leftTex };
  };

  const slabCT = slabMode ? getSlabCounterTex() : null;

  const FloorTile = () => {
    if (!floorTex) {
      return (
        <mesh position={[roomW / 2, 0, roomL / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[roomW, roomL]} />
          <meshStandardMaterial color="#c8b8a8" roughness={0.7} />
        </mesh>
      );
    }
    const ft = new THREE.Texture(floorTex.image);
    ft.wrapS = ft.wrapT = THREE.RepeatWrapping;
    ft.repeat.set(roomW / fTileW, roomL / fTileH);
    ft.minFilter = THREE.LinearFilter;
    ft.magFilter = THREE.LinearFilter;
    ft.generateMipmaps = false;
    ft.colorSpace = THREE.SRGBColorSpace;
    ft.needsUpdate = true;
    return (
      <mesh position={[roomW / 2, 0, roomL / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomW, roomL]} />
        <meshStandardMaterial map={ft} color="#ffffff" roughness={0.7} />
      </mesh>
    );
  };

  const Countertop = () => {
    let backTex: THREE.Texture | null;
    let leftTex: THREE.Texture | null;
    if (slabMode) {
      backTex = slabCT?.backTex ?? null;
      leftTex = slabCT?.leftTex ?? null;
    } else {
      backTex = countertopTex ? countertopTex.clone() : null;
      leftTex = countertopTex ? countertopTex.clone() : null;
      if (backTex && leftTex) {
        backTex.wrapS = backTex.wrapT = THREE.RepeatWrapping;
        leftTex.wrapS = leftTex.wrapT = THREE.RepeatWrapping;
        backTex.repeat.set(roomW / counterTileFeet, counterZ / counterTileFeet);
        leftTex.repeat.set(counterZ / counterTileFeet, lDepth / counterTileFeet);
        backTex.needsUpdate = true;
        leftTex.needsUpdate = true;
      }
    }
    return (
      <group>
        {/* Back countertop (starts after left countertop width) */}
        <mesh position={[(counterZ + roomW) / 2, counterH + 0.02, counterZ / 2]}>
          <boxGeometry args={[roomW - counterZ, 0.06, counterZ]} />
          <meshStandardMaterial map={backTex} color={backTex ? undefined : countertopColor} roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Left countertop */}
        <mesh position={[counterZ / 2, counterH + 0.02, lDepth / 2]}>
          <boxGeometry args={[counterZ, 0.06, lDepth]} />
          <meshStandardMaterial map={leftTex} color={leftTex ? undefined : countertopColor} roughness={0.4} metalness={0.1} />
        </mesh>
      </group>
    );
  };











  return (
    <group>
      <BackWall />
      <LeftWallTile />
      {/* Right wall */}
      <mesh position={[roomW, roomH / 2, roomL / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[roomL, roomH]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.6} />
      </mesh>
      {/* Left wall plain part (non-kitchen area) */}
      <mesh position={[0, roomH / 2, lDepth + (roomL - lDepth) / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[roomL - lDepth, roomH]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.6} />
      </mesh>
      {/* Floor */}
      <FloorTile />
      {/* Ceiling */}
      <mesh position={[roomW / 2, roomH, roomL / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomW, roomL]} />
        <meshStandardMaterial color="#f0ece4" roughness={0.5} />
      </mesh>
      {/* Glass front wall */}
      <mesh position={[roomW / 2, roomH / 2, roomL]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[roomW, roomH]} />
        <meshStandardMaterial color="#88ccff" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      <LowerCabinets />
      <Countertop />
      </group>
    );
  };

export default function Kitchen3DPage() {
  // Persisted state
  const roomWidth = useKitchen3DStore((s) => s.roomWidth);
  const setRoomWidth = useKitchen3DStore((s) => s.setRoomWidth);
  const roomLength = useKitchen3DStore((s) => s.roomLength);
  const setRoomLength = useKitchen3DStore((s) => s.setRoomLength);
  const roomHeight = useKitchen3DStore((s) => s.roomHeight);
  const setRoomHeight = useKitchen3DStore((s) => s.setRoomHeight);
  const counterDepth = useKitchen3DStore((s) => s.counterDepth);
  const setCounterDepth = useKitchen3DStore((s) => s.setCounterDepth);
  const [backsplashImg, setBacksplashImg] = useState<string | null>(null);
  const [backsplashTex, setBacksplashTex] = useState<THREE.Texture | null>(null);
  const tileSize = useKitchen3DStore((s) => s.tileSize);
  const setTileSize = useKitchen3DStore((s) => s.setTileSize);
  const tileRotation = useKitchen3DStore((s) => s.tileRotation);
  const setTileRotation = useKitchen3DStore((s) => s.setTileRotation);
  const countertopColor = useKitchen3DStore((s) => s.countertopColor);
  const setCountertopColor = useKitchen3DStore((s) => s.setCountertopColor);
  const [countertopImg, setCountertopImg] = useState<string | null>(null);
  const [countertopTex, setCountertopTex] = useState<THREE.Texture | null>(null);
  const isTheaterMode = useKitchen3DStore((s) => s.isTheaterMode);
  const setIsTheaterMode = useKitchen3DStore((s) => s.setIsTheaterMode);
  const slabMode = useKitchen3DStore((s) => s.slabMode);
  const setSlabMode = useKitchen3DStore((s) => s.setSlabMode);
  const [highlighterImg, setHighlighterImg] = useState<string | null>(null);
  const [highlighterTex, setHighlighterTex] = useState<THREE.Texture | null>(null);
  const highlighterRows = useKitchen3DStore((s) => s.highlighterRows);
  const setHighlighterRows = useKitchen3DStore((s) => s.setHighlighterRows);
  const [floorImg, setFloorImg] = useState<string | null>(null);
  const [floorTex, setFloorTex] = useState<THREE.Texture | null>(null);
  const floorTileSize = useKitchen3DStore((s) => s.floorTileSize);
  const setFloorTileSize = useKitchen3DStore((s) => s.setFloorTileSize);
  const stripEnabled = useKitchen3DStore((s) => s.stripEnabled);
  const setStripEnabled = useKitchen3DStore((s) => s.setStripEnabled);
  const stripColor = useKitchen3DStore((s) => s.stripColor);
  const setStripColor = useKitchen3DStore((s) => s.setStripColor);
  const stripWidthMm = useKitchen3DStore((s) => s.stripWidthMm);
  const setStripWidthMm = useKitchen3DStore((s) => s.setStripWidthMm);
  const stripInterval = useKitchen3DStore((s) => s.stripInterval);
  const setStripInterval = useKitchen3DStore((s) => s.setStripInterval);
  

  // Read pending texture from storage
  useEffect(() => {
    import('@/utils/textureBridge').then(({ getPendingTexture, clearPendingTexture, buildTileUrl }) => {
      const slots: [string, (v: string | null) => void][] = [
        ['kitchen_floor', setFloorImg],
        ['kitchen_backsplash', setBacksplashImg],
        ['kitchen_countertop', setCountertopImg],
      ];
      for (const [slot, setter] of slots) {
        const pending = getPendingTexture(slot);
        if (pending) {
          setter(buildTileUrl(pending.url));
          clearPendingTexture(slot);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!backsplashImg) { setBacksplashTex(null); }
    else {
      new THREE.TextureLoader().load(backsplashImg, (t) => {
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.anisotropy = 16;
        t.generateMipmaps = false;
        setBacksplashTex(t);
      });
    }
  }, [backsplashImg]);

  useEffect(() => {
    if (!countertopImg) { setCountertopTex(null); }
    else {
      new THREE.TextureLoader().load(countertopImg, (t) => {
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.anisotropy = 16;
        t.generateMipmaps = false;
        setCountertopTex(t);
      });
    }
  }, [countertopImg]);

  useEffect(() => {
    if (!highlighterImg) { setHighlighterTex(null); }
    else {
      new THREE.TextureLoader().load(highlighterImg, (t) => {
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.anisotropy = 16;
        t.generateMipmaps = false;
        setHighlighterTex(t);
      });
    }
  }, [highlighterImg]);

  useEffect(() => {
    if (!floorImg) { setFloorTex(null); }
    else {
      new THREE.TextureLoader().load(floorImg, (t) => {
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.anisotropy = 16;
        t.generateMipmaps = false;
        setFloorTex(t);
      });
    }
  }, [floorImg]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBacksplashImg(URL.createObjectURL(file));
    }
  };

  return (
    <div className={`min-h-screen bg-neutral-600 text-neutral-100 aurora-bg relative overflow-x-hidden pt-8 pb-4 transition-all duration-500 ${isTheaterMode ? 'px-4 sm:px-12' : 'px-4 sm:px-6 lg:px-8'}`}>
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 radial-glow-amber opacity-30 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 radial-glow-blue opacity-20 pointer-events-none" />

      <div className={`mx-auto mb-6 transition-all duration-500 ${isTheaterMode ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
              <CookingPot className="w-3.5 h-3.5" /> 3D Kitchen
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient mb-2">3D Kitchen Designer</h1>
          <p className="text-neutral-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Visualise your kitchen backsplash in 3D. Upload tile images and see them applied.
          </p>
        </motion.div>
      </div>

      <div className={`mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start transition-all duration-500 ${isTheaterMode ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
        <div className={`space-y-5 transition-all duration-500 ${isTheaterMode ? 'hidden lg:hidden' : 'lg:col-span-3'}`}>

          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <Ruler className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm">Room Dimensions</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs"><span className="text-neutral-500">Width</span><span className="text-amber-400">{roomWidth} ft</span></div>
                <input type="range" min="6" max="24" step="0.5" value={roomWidth} onChange={e => setRoomWidth(+e.target.value)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-1" />
              </div>
              <div>
                <div className="flex justify-between text-xs"><span className="text-neutral-500">Length</span><span className="text-amber-400">{roomLength} ft</span></div>
                <input type="range" min="8" max="30" step="0.5" value={roomLength} onChange={e => setRoomLength(+e.target.value)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-1" />
              </div>
              <div>
                <div className="flex justify-between text-xs"><span className="text-neutral-500">Height</span><span className="text-amber-400">{roomHeight} ft</span></div>
                <input type="range" min="7" max="14" step="0.5" value={roomHeight} onChange={e => setRoomHeight(+e.target.value)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-1" />
              </div>
              <div>
                <div className="flex justify-between text-xs"><span className="text-neutral-500">Counter Depth</span><span className="text-amber-400">{counterDepth} ft</span></div>
                <input type="range" min="1.5" max="4" step="0.1" value={counterDepth} onChange={e => setCounterDepth(+e.target.value)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-1" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm">Floor Tiles</h3>
            </div>
            {floorImg ? (
              <div className="flex items-center gap-2 bg-neutral-900 rounded-lg border border-neutral-700 p-1 mb-3">
                <img src={floorImg} alt="Floor" className="w-12 h-12 rounded object-cover" />
                <span className="text-[10px] font-semibold text-neutral-300 flex-1">Floor Tile</span>
                <button onClick={() => setFloorImg(null)} className="text-[10px] text-red-400 hover:text-red-300 font-bold">Remove</button>
              </div>
            ) : (
              <div className="flex flex-col gap-1 mb-3">
                <label className="flex items-center gap-2 bg-neutral-900 border border-dashed border-neutral-700 rounded-lg px-3 py-3 cursor-pointer hover:border-amber-500/50 transition-colors">
                  <Upload className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs text-neutral-500">Upload floor tile</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setFloorImg(URL.createObjectURL(file));
                  }} />
                </label>

              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <LayoutGrid className="w-4 h-4 text-sky-400" />
              <h4 className="font-semibold text-white text-xs">Floor Tile Size</h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["2x2", "2x4", "2.5x5"].map((size) => (
                <button
                  key={size}
                  onClick={() => setFloorTileSize(size)}
                  className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${floorTileSize === size ? "border-sky-500 bg-sky-500/10 text-sky-400" : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"}`}
                >
                  {size}'
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <Paintbrush className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Countertop Material</h3>
            </div>

            {countertopImg ? (
              <div className="flex items-center gap-2 bg-neutral-900 rounded-lg border border-neutral-700 p-1 mb-3">
                <img src={countertopImg} alt="Countertop" className="w-12 h-12 rounded object-cover" />
                <span className="text-[10px] font-semibold text-neutral-300 flex-1">Custom Granite/Marble</span>
                <button onClick={() => setCountertopImg(null)} className="text-[10px] text-red-400 hover:text-red-300 font-bold">Remove</button>
              </div>
            ) : (
              <div className="flex flex-col gap-1 mb-3">
                <label className="flex items-center gap-2 bg-neutral-900 border border-dashed border-neutral-700 rounded-lg px-3 py-3 cursor-pointer hover:border-amber-500/50 transition-colors">
                  <Upload className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs text-neutral-500">Upload granite/marble</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCountertopImg(URL.createObjectURL(file));
                  }} />
                </label>

              </div>
            )}

            <div className="text-xs text-neutral-500 mb-2">Or select a color:</div>
            <select
              value={countertopColor}
              onChange={(e) => setCountertopColor(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm text-neutral-200 outline-none focus:border-amber-500"
            >
              <option value="#8b7355">Default Wood</option>
              <option value="#1a1a1a">Black Granite</option>
              <option value="#e6e6e6">White Marble</option>
              <option value="#737373">Grey Stone</option>
            </select>
          </div>

          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <ImageIcon className="w-4 h-4 text-green-400" />
              <h3 className="font-bold text-white text-sm">Wall Tile Image</h3>
            </div>
            {backsplashImg ? (
              <div className="flex items-center gap-2 bg-neutral-900 rounded-lg border border-neutral-700 p-1 mb-3">
                <img src={backsplashImg} alt="Backsplash" className="w-12 h-12 rounded object-cover" />
                <span className="text-[10px] font-semibold text-neutral-300 flex-1">Backsplash Tile</span>
                <button onClick={() => setBacksplashImg(null)} className="text-[10px] text-red-400 hover:text-red-300 font-bold">Remove</button>
              </div>
            ) : (
              <div className="flex flex-col gap-1 mb-3">
                <label className="flex items-center gap-2 bg-neutral-900 border border-dashed border-neutral-700 rounded-lg px-3 py-3 cursor-pointer hover:border-amber-500/50 transition-colors">
                  <Upload className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs text-neutral-500">Upload tile image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>

              </div>
            )}
            
            <div className="flex items-center gap-2 mt-4 mb-2">
              <LayoutGrid className="w-4 h-4 text-amber-400" />
              <h4 className="font-semibold text-white text-xs">Tile Size</h4>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {["12x18", "2x1", "2x4"].map((size) => (
                <button
                  key={size}
                  onClick={() => setTileSize(size)}
                  className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${tileSize === size ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"}`}
                >
                  {size === "12x18" ? "12x18\"" : size === "2x1" ? "2x1'" : "2x4'"}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg border border-neutral-800">
              <span className="text-xs text-neutral-400 flex items-center gap-1"><Rotate3d className="w-3 h-3"/> Rotate Tile</span>
              <button 
                onClick={() => setTileRotation(tileRotation === 0 ? 90 : 0)} 
                className={`px-3 py-1 border rounded text-xs font-bold transition-colors ${tileRotation === 90 ? "bg-amber-500/10 border-amber-500 text-amber-400" : "bg-neutral-800 border-neutral-700 text-neutral-400"}`}
              >
                {tileRotation}°
              </button>
            </div>

            <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg border border-neutral-800 mt-2">
              <span className="text-xs text-neutral-400">Display Mode</span>
              <button 
                onClick={() => setSlabMode(!slabMode)} 
                className={`px-3 py-1 border rounded text-xs font-bold transition-colors ${slabMode ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-neutral-700 bg-neutral-800 text-neutral-400"}`}
              >
                {slabMode ? "Slab" : "Tiled"}
              </button>
            </div>

            {/* Border Strip */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2"><Paintbrush className="w-4 h-4 text-amber-400" />Border Strip</h3>
                <button
                  onClick={() => setStripEnabled(!stripEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${stripEnabled ? "bg-amber-500" : "bg-neutral-700"}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${stripEnabled ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </div>
              {stripEnabled && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {["golden", "silver", "black"].map((c) => (
                      <button key={c} onClick={() => setStripColor(c)}
                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all capitalize ${stripColor === c ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-neutral-800 bg-neutral-900 hover:border-neutral-600 text-neutral-400"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs"><span className="text-neutral-500">Width</span><span className="text-amber-400">{stripWidthMm} mm</span></div>
                    <input type="range" min="1" max="3" value={stripWidthMm} onChange={e => setStripWidthMm(+e.target.value)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-1" />
                  </div>
                  {(tileSize === "12x18" || tileSize === "2x1" || tileSize === "2x4") && (
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-neutral-500">Strip after every</span><span className="text-amber-400">{stripInterval} tiles</span></div>
                      <div className="flex gap-2">
                        {[1, 2, 3].map((n) => (
                          <button key={n} onClick={() => setStripInterval(n)}
                            className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${stripInterval === n ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-neutral-800 bg-neutral-900 hover:border-neutral-600 text-neutral-400"}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`transition-all duration-500 ${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-9'}`}>
          <div className="glass-card rounded-[2rem] border border-white/5 p-4 shadow-2xl overflow-hidden flex flex-col" style={{ height: isTheaterMode ? '750px' : '600px' }}>
            {/* Viewport Header Controls */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  3D Viewport {isTheaterMode && <span className="text-amber-400 font-bold ml-1.5">(Showroom Mode)</span>}
                </span>
              </div>
              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all duration-300 ${
                  isTheaterMode
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 shadow-md shadow-amber-500/5'
                    : 'bg-neutral-600 text-neutral-400 border-neutral-900 hover:text-white hover:border-neutral-850'
                }`}
                title={isTheaterMode ? "Exit Fullscreen Showroom Mode" : "Enter Showroom Mode (Full Width)"}
              >
                {isTheaterMode ? (
                  <><Minimize2 className="w-3.5 h-3.5" /><span>Standard View</span></>
                ) : (
                  <><Maximize2 className="w-3.5 h-3.5" /><span>Showroom View</span></>
                )}
              </button>
            </div>
            <div className="flex-1 min-h-0">
            <Canvas camera={{ position: [roomWidth * 0.8, roomHeight * 0.5, roomLength * 0.8], fov: 45, near: 0.1, far: 100 }} gl={{ antialias: true }} style={{ width: "100%", height: "100%" }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={0.8} />
              <directionalLight position={[-5, -5, -5]} intensity={0.3} />
                <Kitchen3D roomW={roomWidth} roomL={roomLength} roomH={roomHeight} backsplashTex={backsplashTex} tileSize={tileSize} countertopColor={countertopColor} countertopTex={countertopTex} tileRotation={tileRotation} counterDepth={counterDepth} slabMode={slabMode} highlighterTex={highlighterTex} highlighterRows={highlighterRows} floorTex={floorTex} floorTileSize={floorTileSize} stripColor={stripEnabled ? stripColor : null} stripWidthMm={stripWidthMm} stripInterval={stripInterval} />
              <OrbitControls enableDamping dampingFactor={0.1} minDistance={3} maxDistance={40} target={[roomWidth / 2, roomHeight / 2, roomLength / 2]} />
            </Canvas>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
