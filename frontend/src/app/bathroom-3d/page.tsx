"use client";

import { useState, Suspense, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, BakeShadows, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import { useBathroom3DStore } from "@/store3d";
import { TILE_FLOOR_PBR, TILE_WALL_PBR } from "@/components/scene3d/tilePbr";
import {
  Ruler, Layers, Check, Rotate3d, Grid, Upload, ImageIcon, GripVertical, ArrowUpDown, Maximize2, Minimize2, Search, Eye, EyeOff
} from "lucide-react";
import SceneLighting from "@/components/scene3d/SceneLighting";
import BathroomFurnishings from "@/components/scene3d/BathroomFurnishings";
import CameraController, { CameraPreset } from "@/components/scene3d/CameraController";
import HotspotSystem, { HotspotDef } from "@/components/scene3d/HotspotSystem";


type Unit = "inches" | "feet";

const TILE_SIZES = [
  { id: "12x18", label: "12 × 18 inch", wallW: 12, wallL: 18, unit: "inches" as Unit },
  { id: "2x1",   label: "2 × 1 feet",   wallW: 1,  wallL: 2,  unit: "feet"   as Unit },
  { id: "2x4",   label: "2 × 4 feet",   wallW: 4,  wallL: 2,  unit: "feet"   as Unit },
];

// Default colors shown when no image is uploaded
const SLOT_COLORS: Record<string, string> = {
  dark:        "#f0f0f0",
  light:       "#f8f8f8",
  highlighter: "#d4a017",
};

// ─── Surface ────────────────────────────────────────────────────────────────
function Surface({
  tex, color, args, position, rotation, isGlass, tileW, tileH, offsetY, stripColor, stripWidthMm, stripInterval, bookmatchEnabled, groutWidthMm, groutColor, isFloor,
}: {
  tex: THREE.Texture | null;
  color: string;
  args: [number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  isGlass?: boolean;
  tileW?: number;
  tileH?: number;
  offsetY?: number;
  stripColor?: string | null;
  stripWidthMm?: number;
  stripInterval?: number;
  bookmatchEnabled?: boolean;
  groutWidthMm?: number;
  groutColor?: string;
  isFloor?: boolean;
}) {
  const stripOverlay = useMemo(() => {
    if (!stripColor || !stripWidthMm || !tileW || !tileH) return null;
    const interval = stripInterval || 1;
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

    const hexMap: Record<string, string> = {
      black: "#111111",
      white: "#FFFFFF",
    };
    const hex = hexMap[stripColor] || stripColor;

    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, wPx, stripPx);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.repeat.set(args[0] / tileW, args[1] / (tileH * interval));
    tex.needsUpdate = true;
    return tex;
  }, [stripColor, stripWidthMm, tileW, tileH, stripInterval, args[0], args[1]]);


  const groutOverlay = useMemo(() => {
    if (!groutWidthMm || !tileW || !tileH) return null;
    const base = 1024;
    const maxDim = Math.max(tileW, tileH);
    const wPx = Math.round((tileW / maxDim) * base);
    const hPx = Math.round((tileH / maxDim) * base);
    // groutWidthMm in mm; tileW/tileH in feet (1ft = 304.8mm)
    // Multiplied by 2 for visual clarity in 3D scale
    const groutPxW = Math.max(5, Math.round(groutWidthMm * 2 / (tileW * 304.8) * wPx));
    const groutPxH = Math.max(5, Math.round(groutWidthMm * 2 / (tileH * 304.8) * hPx));
    const c = document.createElement("canvas");
    c.width = wPx;
    c.height = hPx;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, wPx, hPx);
    ctx.fillStyle = groutColor || "#aaaaaa";
    ctx.fillRect(0, 0, wPx, groutPxH);
    ctx.fillRect(0, hPx - groutPxH, wPx, groutPxH);
    ctx.fillRect(0, 0, groutPxW, hPx);
    ctx.fillRect(wPx - groutPxW, 0, groutPxW, hPx);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 16;
    t.generateMipmaps = true;
    t.repeat.set(args[0] / tileW, args[1] / tileH);
    t.needsUpdate = true;
    return t;
  }, [groutWidthMm, groutColor, tileW, tileH, args[0], args[1]]);

  const texture = useMemo(() => {
    if (!tex) return null;
    const t = tex.clone();
    t.wrapS = bookmatchEnabled ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
    t.wrapT = bookmatchEnabled ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 16;
    t.colorSpace = tex.colorSpace;
    if (tileW && tileH) {
      t.repeat.set(args[0] / tileW, args[1] / tileH);
    } else {
      t.repeat.set(args[0], args[1]);
    }
    if (offsetY) t.offset.y = offsetY;
    t.needsUpdate = true;
    return t;
  }, [tex, args[0], args[1], tileW, tileH, offsetY, bookmatchEnabled]);

  const pbrSettings = isFloor ? TILE_FLOOR_PBR : TILE_WALL_PBR;

  if (isGlass) {
    return (
      <mesh position={position} rotation={rotation}>
        <planeGeometry args={args} />
        <meshStandardMaterial color="#88ccff" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    );
  }
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={args} />
        <meshPhysicalMaterial
          key={texture ? texture.uuid : "plain"}
          map={texture}
          color={texture ? "#ffffff" : color}
          side={THREE.FrontSide}
          {...pbrSettings}
        />
      </mesh>
      {groutOverlay && (
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={args} />
          <meshBasicMaterial map={groutOverlay} transparent opacity={1} depthWrite={false} side={THREE.FrontSide} />
        </mesh>
      )}
      {stripOverlay && (
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={args} />
          <meshBasicMaterial map={stripOverlay} transparent opacity={1} depthWrite={false} side={THREE.FrontSide} />
        </mesh>
      )}
    </group>
  );
}

// ─── Wall band builder ───────────────────────────────────────────────────────
function getWallBands(
  roomH: number,
  tileH: number,
  textures: Record<string, THREE.Texture | null>,
  slotOrder: string[],
  slotRows: Record<string, number>
) {
  const patternDefs = slotOrder.map((id) => ({
    type:   id,
    rows:   slotRows[id] ?? 2,
    tex:    textures[id] ?? null,
    color:  SLOT_COLORS[id] ?? "#f0f0f0",
  }));

  const bands: { yStart: number; height: number; tex: THREE.Texture | null; color: string }[] = [];
  let currentY = 0;

  for (const def of patternDefs) {
    if (currentY >= roomH) break;
    const bandH = Math.min(def.rows * tileH, roomH - currentY);
    if (bandH > 0) {
      bands.push({ yStart: currentY, height: bandH, tex: def.tex, color: def.color });
      currentY += bandH;
    }
  }

  // Fill any remaining space with the last slot type
  if (currentY < roomH) {
    const lastId = slotOrder[slotOrder.length - 1];
    bands.push({
      yStart: currentY,
      height: roomH - currentY,
      tex:    textures[lastId] ?? null,
      color:  SLOT_COLORS[lastId] ?? "#f8f8f8",
    });
  }

  return bands;
}

// ─── Room ───────────────────────────────────────────────────────────────────
function Room({
  roomW, roomL, roomH, tileSize,
  floorTex, showerTex1, showerTex2,
  tileW, tileH,
  textures, slotOrder, slotRows, isShower,
  shower1OffsetY, shower2OffsetY,
  stripColor, stripWidthMm, stripInterval,
  bookmatchEnabled,
  groutWidthMm, groutColor,
}: {
  roomW: number; roomL: number; roomH: number; tileSize: string | null;
  floorTex: THREE.Texture | null;
  showerTex1: THREE.Texture | null; showerTex2: THREE.Texture | null;
  tileW: number; tileH: number;
  textures: Record<string, THREE.Texture | null>;
  slotOrder: string[];
  slotRows: Record<string, number>;
  isShower?: boolean;
  shower1OffsetY?: number;
  shower2OffsetY?: number;
  stripColor?: string | null;
  stripWidthMm?: number;
  stripInterval?: number;
  bookmatchEnabled?: boolean;
  groutWidthMm?: number;
  groutColor?: string;
}) {
  const bands = useMemo(
    () => getWallBands(roomH, tileH, textures, slotOrder, slotRows),
    [roomH, tileH, textures, slotOrder, slotRows]
  );
  const darkTex = textures["dark"] ?? null;

  return (
    <group>
      {/* Floor (no strip) */}
      <Surface
        tex={floorTex} color="#e8e5e0"
        args={[roomW, roomL]} position={[roomW / 2, 0, roomL / 2]}
        rotation={[-Math.PI / 2, 0, 0]} tileW={tileW} tileH={tileH} bookmatchEnabled={bookmatchEnabled}
        isFloor
      />

      {/* Back Wall */}
      {isShower ? (
        <>
          <Surface tex={showerTex1 || darkTex} color="#f0f0f0" args={[roomW / 2, roomH]} position={[roomW * 0.25, roomH / 2, 0]} tileW={tileW} tileH={tileH} bookmatchEnabled={bookmatchEnabled} offsetY={shower1OffsetY} stripColor={stripColor} stripWidthMm={stripWidthMm} stripInterval={stripInterval} />
          <Surface tex={showerTex2 || darkTex} color="#f0f0f0" args={[roomW / 2, roomH]} position={[roomW * 0.75, roomH / 2, 0]} tileW={tileW} tileH={tileH} bookmatchEnabled={bookmatchEnabled} offsetY={shower2OffsetY} stripColor={stripColor} stripWidthMm={stripWidthMm} stripInterval={stripInterval} />
        </>
      ) : (
        bands.map((band, idx) => (
          <Surface key={`back-${idx}`} tex={band.tex} color={band.color} args={[roomW, band.height]} position={[roomW / 2, band.yStart + band.height / 2, 0]} tileW={tileW} tileH={tileH} bookmatchEnabled={bookmatchEnabled} stripColor={stripColor} stripWidthMm={stripWidthMm} stripInterval={stripInterval} />
        ))
      )}

      {/* Left Wall */}
      {bands.map((band, idx) => (
        <Surface key={`left-${idx}`} tex={band.tex} color={band.color} args={[roomL, band.height]} position={[0, band.yStart + band.height / 2, roomL / 2]} rotation={[0, Math.PI / 2, 0]} tileW={tileW} tileH={tileH} bookmatchEnabled={bookmatchEnabled} stripColor={stripColor} stripWidthMm={stripWidthMm} stripInterval={stripInterval} />
      ))}

      {/* Right Wall */}
      {bands.map((band, idx) => (
        <Surface key={`right-${idx}`} tex={band.tex} color={band.color} args={[roomL, band.height]} position={[roomW, band.yStart + band.height / 2, roomL / 2]} rotation={[0, -Math.PI / 2, 0]} tileW={tileW} tileH={tileH} bookmatchEnabled={bookmatchEnabled} stripColor={stripColor} stripWidthMm={stripWidthMm} stripInterval={stripInterval} />
      ))}

      {/* Glass Front & Ceiling */}
      {/* <Surface tex={null} color="#88ccff" args={[roomW, roomH]} position={[roomW / 2, roomH / 2, roomL]} rotation={[0, Math.PI, 0]} isGlass /> */}
      <Surface tex={null} color="#222"    args={[roomW, roomL]} position={[roomW / 2, roomH,      roomL / 2]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function Bathroom3DPage() {
  // ── Dimensions (persisted) ──────────────────────────────────────────────
  const runningFeet = useBathroom3DStore((s) => s.runningFeet);
  const setRunningFeet = useBathroom3DStore((s) => s.setRunningFeet);
  const wallHeight = useBathroom3DStore((s) => s.wallHeight);
  const setWallHeight = useBathroom3DStore((s) => s.setWallHeight);
  const roomLength = useBathroom3DStore((s) => s.roomLength);
  const setRoomLength = useBathroom3DStore((s) => s.setRoomLength);
  const roomWidth = useBathroom3DStore((s) => s.roomWidth);
  const setRoomWidth = useBathroom3DStore((s) => s.setRoomWidth);
  const tileSize = useBathroom3DStore((s) => s.tileSize);
  const setTileSize = useBathroom3DStore((s) => s.setTileSize);
  const groutWidth = useBathroom3DStore((s) => s.groutWidth);
  const setGroutWidth = useBathroom3DStore((s) => s.setGroutWidth);
  const groutColor = useBathroom3DStore((s) => s.groutColor);
  const setGroutColor = useBathroom3DStore((s) => s.setGroutColor);
  const wastagePercent = useBathroom3DStore((s) => s.wastagePercent);
  const setWastagePercent = useBathroom3DStore((s) => s.setWastagePercent);
  const pricePerBox = useBathroom3DStore((s) => s.pricePerBox);
  const setPricePerBox = useBathroom3DStore((s) => s.setPricePerBox);
  const showerSplitMode = useBathroom3DStore((s) => s.showerSplitMode);
  const setShowerSplitMode = useBathroom3DStore((s) => s.setShowerSplitMode);
  const isTheaterMode = useBathroom3DStore((s) => s.isTheaterMode);
  const setIsTheaterMode = useBathroom3DStore((s) => s.setIsTheaterMode);
  const stripEnabled = useBathroom3DStore((s) => s.stripEnabled);
  const setStripEnabled = useBathroom3DStore((s) => s.setStripEnabled);
  const stripColor = useBathroom3DStore((s) => s.stripColor);
  const setStripColor = useBathroom3DStore((s) => s.setStripColor);
  const stripWidthMm = useBathroom3DStore((s) => s.stripWidthMm);
  const setStripWidthMm = useBathroom3DStore((s) => s.setStripWidthMm);
  const stripInterval = useBathroom3DStore((s) => s.stripInterval);
  const setStripInterval = useBathroom3DStore((s) => s.setStripInterval);
  const bookmatchEnabled = useBathroom3DStore((s) => s.bookmatchEnabled);
  const setBookmatchEnabled = useBathroom3DStore((s) => s.setBookmatchEnabled);
  const showerWidth = useBathroom3DStore((s) => s.showerWidth);
  const setShowerWidth = useBathroom3DStore((s) => s.setShowerWidth);
  const showerDepth = useBathroom3DStore((s) => s.showerDepth);
  const setShowerDepth = useBathroom3DStore((s) => s.setShowerDepth);
  const showerHeight = useBathroom3DStore((s) => s.showerHeight);
  const setShowerHeight = useBathroom3DStore((s) => s.setShowerHeight);
  const toiletScale = useBathroom3DStore((s) => s.toiletScale);
  const setToiletScale = useBathroom3DStore((s) => s.setToiletScale);
  const toiletXOffset = useBathroom3DStore((s) => s.toiletXOffset);
  const setToiletXOffset = useBathroom3DStore((s) => s.setToiletXOffset);
  const toiletZOffset = useBathroom3DStore((s) => s.toiletZOffset);
  const setToiletZOffset = useBathroom3DStore((s) => s.setToiletZOffset);
  const toiletRotY = useBathroom3DStore((s) => s.toiletRotY);
  const setToiletRotY = useBathroom3DStore((s) => s.setToiletRotY);


  // ── Original (raw) uploads ───────────────────────────────────────────────
  const [origDark,        setOrigDark]        = useState<string | null>(null);
  const [origLight,       setOrigLight]       = useState<string | null>(null);
  const [origHighlighter, setOrigHighlighter] = useState<string | null>(null);
  const [origFloor,       setOrigFloor]       = useState<string | null>(null);
  const [origShower1,     setOrigShower1]     = useState<string | null>(null);
  const [origShower2,     setOrigShower2]     = useState<string | null>(null);

  // ── Processed images ─────────────────────────────────────────────────────
  const [darkImg,        setDarkImg]        = useState<string | null>(null);
  const [lightImg,       setLightImg]       = useState<string | null>(null);
  const [highlighterImg, setHighlighterImg] = useState<string | null>(null);
  const [floorImg,       setFloorImg]       = useState<string | null>(null);
  const [showerImg1,     setShowerImg1]     = useState<string | null>(null);
  const [showerImg2,     setShowerImg2]     = useState<string | null>(null);
  const shower1OffsetY = useBathroom3DStore((s) => s.shower1OffsetY);
  const setShower1OffsetY = useBathroom3DStore((s) => s.setShower1OffsetY);
  const shower2OffsetY = useBathroom3DStore((s) => s.shower2OffsetY);
  const setShower2OffsetY = useBathroom3DStore((s) => s.setShower2OffsetY);

  // Read pending texture from storage
  useEffect(() => {
    import('@/utils/textureBridge').then(({ getPendingTexture, clearPendingTexture, buildTileUrl }) => {
      const slots: [string, (v: string | null) => void, (v: string | null) => void][] = [
        ['bathroom_floor',       setOrigFloor,       setFloorImg],
        ['bathroom_wall',        setOrigDark,        setDarkImg],        // legacy
        ['bathroom_dark',        setOrigDark,        setDarkImg],
        ['bathroom_light',       setOrigLight,       setLightImg],
        ['bathroom_highlighter', setOrigHighlighter, setHighlighterImg],
      ];
      for (const [slot, setOrig, setProc] of slots) {
        const pending = getPendingTexture(slot);
        if (pending) {
          const url = buildTileUrl(pending.url);
          setOrig(url);
          setProc(url);
          clearPendingTexture(slot);
        }
      }
    });
  }, []);

  // ── Adjustment settings ──────────────────────────────────────────────────

  // ── Drag-to-reorder state (persisted) ────────────────────────────────────
  // slotOrder controls the vertical order of wall tile bands (bottom → top)
  const slotOrder = useBathroom3DStore((s) => s.slotOrder);
  const setSlotOrder = useBathroom3DStore((s) => s.setSlotOrder);
  const slotRows = useBathroom3DStore((s) => s.slotRows);
  const setSlotRows = useBathroom3DStore((s) => s.setSlotRows);
  const [draggedSlotId,  setDraggedSlotId]  = useState<string | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showInterior, setShowInterior] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const hotspots: HotspotDef[] = useMemo(() => [
    { id: 'floor', position: [roomLength / 2, 0.02, roomWidth / 2], label: 'Floor' },
    { id: 'dark', position: [roomLength * 0.35, wallHeight * 0.5, 0.08], label: 'Main Wall' },
    { id: 'light', position: [roomLength * 0.65, wallHeight * 0.5, 0.08], label: 'Accent Wall' },
    { id: 'highlighter', position: [roomLength * 0.5, wallHeight * 0.8, 0.08], label: 'Highlighter' },
    { id: 'shower1', position: [roomLength * 0.75, wallHeight * 0.5, roomWidth * 0.75], label: 'Shower 1' },
    { id: 'shower2', position: [roomLength * 0.75, wallHeight * 0.3, roomWidth * 0.75], label: 'Shower 2' },
  ], [roomLength, roomWidth, wallHeight]);

  // ── Upload helpers ───────────────────────────────────────────────────────
  const handleUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setterOrig: (u: string) => void,
    setterProc: (u: string) => void,
    slot: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setterOrig(url);
    setterProc(url);
  };

  const handleRemove = (
    setterOrig: (u: null) => void,
    setterProc: (u: null) => void,
    prevOrig: string | null,
    prevProc: string | null
  ) => {
    if (prevOrig?.startsWith("blob:")) URL.revokeObjectURL(prevOrig);
    if (prevProc?.startsWith("blob:") && prevProc !== prevOrig) URL.revokeObjectURL(prevProc);
    setterOrig(null);
    setterProc(null);
  };

  // ── Drag handlers ────────────────────────────────────────────────────────
  const handleDragStart = (id: string) => setDraggedSlotId(id);

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggedSlotId) setDragOverSlotId(id);
  };

  const handleDrop = (targetId: string) => {
    if (draggedSlotId && draggedSlotId !== targetId) {
      const next = [...slotOrder];
      const from = next.indexOf(draggedSlotId);
      const to   = next.indexOf(targetId);
      if (from !== -1 && to !== -1) {
        next.splice(from, 1);
        next.splice(to, 0, draggedSlotId);
      }
      setSlotOrder(next);
    }
    setDraggedSlotId(null);
    setDragOverSlotId(null);
  };

  const handleDragEnd = () => {
    setDraggedSlotId(null);
    setDragOverSlotId(null);
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      [origDark, darkImg, origLight, lightImg, origHighlighter, highlighterImg,
       origFloor, floorImg, origShower1, showerImg1, origShower2, showerImg2]
        .forEach(u => { if (u?.startsWith("blob:")) URL.revokeObjectURL(u); });
    };
  }, []);

  // ── THREE texture loaders ────────────────────────────────────────────────
  const [darkTex,        setDarkTex]        = useState<THREE.Texture | null>(null);
  const [lightTex,       setLightTex]       = useState<THREE.Texture | null>(null);
  const [highlighterTex, setHighlighterTex] = useState<THREE.Texture | null>(null);
  const [floorTex,       setFloorTex]       = useState<THREE.Texture | null>(null);
  const [showerTex1,     setShowerTex1]     = useState<THREE.Texture | null>(null);
  const [showerTex2,     setShowerTex2]     = useState<THREE.Texture | null>(null);

  const loadTex = (url: string | null, setter: (t: THREE.Texture | null) => void) => {
    if (!url) { setter(null); return; }
    new THREE.TextureLoader().load(url, (t) => {
      t.colorSpace  = THREE.SRGBColorSpace;
      t.minFilter   = THREE.LinearFilter;
      t.magFilter   = THREE.LinearFilter;
      t.anisotropy  = 16;
      t.needsUpdate = true;
      setter(t);
    });
  };

  useEffect(() => loadTex(darkImg,        setDarkTex),        [darkImg]);
  useEffect(() => loadTex(lightImg,       setLightTex),       [lightImg]);
  useEffect(() => loadTex(highlighterImg, setHighlighterTex), [highlighterImg]);
  useEffect(() => loadTex(floorImg,       setFloorTex),       [floorImg]);
  useEffect(() => loadTex(showerImg1,     setShowerTex1),     [showerImg1]);
  useEffect(() => loadTex(showerImg2,     setShowerTex2),     [showerImg2]);

  // ── Tile calculations ────────────────────────────────────────────────────
  const selected  = TILE_SIZES.find(s => s.id === tileSize);
  const wallW     = selected?.wallW ?? 12;
  const wallL     = selected?.wallL ?? 12;
  const tileUnit  = selected?.unit  ?? "inches";
  const toFeet    = (v: number, u: Unit) => u === "inches" ? v / 12 : v;
  const wtf       = toFeet(wallW, tileUnit);
  const wtl       = toFeet(wallL, tileUnit);
  const tileW     = Math.max(wtf, wtl);
  const tileH     = Math.min(wtf, wtl);

  // ── Wall textures map (memoised to avoid Room re-renders) ─────────────────
  const wallTextures = useMemo(() => ({
    dark: darkTex, light: lightTex, highlighter: highlighterTex,
  }), [darkTex, lightTex, highlighterTex]);

  // ── Per-slot metadata for the draggable list ──────────────────────────────
  type SlotMeta = {
    label: string;
    procImg: string | null;
    origImg: string | null;
    setOrig: React.Dispatch<React.SetStateAction<string | null>>;
    setProc: React.Dispatch<React.SetStateAction<string | null>>;
  };
  const WALL_SLOT_META: Record<string, SlotMeta> = {
    dark:        { label: "Dark Tile",    procImg: darkImg,        origImg: origDark,        setOrig: setOrigDark,        setProc: setDarkImg        },
    light:       { label: "Light Tile",   procImg: lightImg,       origImg: origLight,       setOrig: setOrigLight,       setProc: setLightImg       },
    highlighter: { label: "Highlighter",  procImg: highlighterImg, origImg: origHighlighter, setOrig: setOrigHighlighter, setProc: setHighlighterImg },
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen bg-neutral-600 text-neutral-100 aurora-bg relative overflow-x-hidden py-8 transition-all duration-500 ${isTheaterMode ? 'px-4 sm:px-12' : 'px-4 sm:px-6 lg:px-8'}`}>
      <div className="absolute top-[10%]    left-[-10%]  w-96 h-96 radial-glow-amber opacity-30 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 radial-glow-blue  opacity-20 pointer-events-none" />

      {/* Header */}
      <div className={`mx-auto mb-6 transition-all duration-500 ${isTheaterMode ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5">
              <Rotate3d className="w-3.5 h-3.5" /> Bathroom Pattern Designer
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient mb-2">Bathroom Pattern Designer</h1>
          <p className="text-neutral-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Upload tile images, then <span className="text-blue-400 font-semibold">drag tile rows up or down</span> to instantly reorder the wall band layout.
          </p>
        </motion.div>
      </div>

      <div className={`mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start transition-all duration-500 ${isTheaterMode ? 'max-w-[1600px]' : 'max-w-7xl'}`}>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className={`space-y-5 transition-all duration-500 ${isTheaterMode ? 'hidden lg:hidden' : 'lg:col-span-3'}`}>

          {/* Bathroom Size */}
          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <Ruler className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-sm">Bathroom Size</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">Perimeter</span>
                  <span className="text-blue-400">{(roomLength + roomWidth) * 2} ft</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs"><span className="text-neutral-400">Wall Height</span><span className="text-blue-400">{wallHeight} ft</span></div>
                <input type="range" min="4" max="14" step="0.5" value={wallHeight} onChange={e => setWallHeight(+e.target.value)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs"><span className="text-neutral-500">Length</span><span className="text-blue-400">{roomLength} ft</span></div>
                  <input type="range" min="3" max="15" value={roomLength} onChange={e => setRoomLength(+e.target.value)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-xs"><span className="text-neutral-500">Width</span><span className="text-blue-400">{roomWidth} ft</span></div>
                  <input type="range" min="3" max="12" value={roomWidth} onChange={e => setRoomWidth(+e.target.value)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Tile Size + Upload */}
          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <Layers className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-sm">Tile Size</h3>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {TILE_SIZES.map(s => (
                <button key={s.id} onClick={() => setTileSize(s.id)}
                  className={`p-2 rounded-lg border text-[9px] font-bold transition-all ${tileSize === s.id ? "border-blue-500 ring-1 ring-blue-500/50 bg-blue-500/10" : "border-white/5 hover:border-white/20"}`}>
                  {tileSize === s.id && <Check className="w-2.5 h-2.5 mx-auto mb-0.5" />}
                  {s.label}
                </button>
              ))}
            </div>


            {/* ── Standard tile upload (drag-to-reorder) ──── */}
            {tileSize && (
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3" /> Upload Tile Images
                  </h4>
                  <span className="flex items-center gap-1 text-[9px] text-blue-400/70 font-semibold">
                    <ArrowUpDown className="w-2.5 h-2.5" /> drag to reorder
                  </span>
                </div>

                {/* Draggable wall slots */}
                <div className="space-y-1.5">
                  {slotOrder.map((id, idx) => {
                    const slot = WALL_SLOT_META[id];
                    if (!slot) return null;
                    const isDragging  = draggedSlotId  === id;
                    const isDragOver  = dragOverSlotId === id;
                    return (
                      <div
                        key={id}
                        className="flex items-end gap-2"
                      >
                        {/* Draggable slot card */}
                        <div
                          draggable
                          onDragStart={()    => handleDragStart(id)}
                          onDragOver={(e)    => handleDragOver(e, id)}
                          onDrop={()         => handleDrop(id)}
                          onDragEnd={handleDragEnd}
                          className={`flex-1 rounded-lg transition-all duration-150 select-none
                            ${isDragging  ? "opacity-35 scale-[0.97]" : "opacity-100"}
                            ${isDragOver  ? "ring-2 ring-blue-500/70 ring-offset-1 ring-offset-neutral-950" : ""}
                          `}
                        >
                          {/* Position badge */}
                          <div className="flex items-center gap-0.5 mb-0.5 ml-1">
                            <span className="text-[8px] text-neutral-600 font-mono">{idx + 1}</span>
                          </div>

                          {slot.origImg ? (
                            <div className="flex items-center gap-2 bg-neutral-900 rounded-lg border border-neutral-700 p-1 cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
                              <img src={slot.procImg || undefined} alt={slot.label} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                              <span className="text-[10px] font-semibold text-neutral-300 flex-1 truncate">{slot.label}</span>
                              <button
                                onClick={() => handleRemove(slot.setOrig as any, slot.setProc as any, slot.origImg, slot.procImg)}
                                className="text-[10px] text-red-400 hover:text-red-300 font-bold flex-shrink-0"
                              >Remove</button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 w-full flex-1">
                              <label className="flex items-center gap-2 bg-neutral-900 border border-dashed border-neutral-700 rounded-lg px-2 py-2 cursor-pointer hover:border-blue-500/50 transition-colors w-full">
                                <GripVertical className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
                                <Upload className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                                <span className="text-[10px] text-neutral-500">Upload {slot.label}</span>
                                <input
                                  type="file" accept="image/*" className="hidden"
                                  onChange={e => handleUpload(e, slot.setOrig as any, slot.setProc as any, id)}
                                />
                              </label>

                            </div>
                          )}
                        </div>

                        {/* Row Multiplier Control */}
                        <div className="flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-xl p-1.5 min-w-[70px] mb-0.5">
                          <span className="text-[8px] text-neutral-500 font-black uppercase tracking-wider mb-0.5">Rows</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSlotRows({ ...slotRows, [id]: Math.max(0, (slotRows[id] ?? 2) - 1) });
                              }}
                              className="w-4 h-4 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center text-xs font-bold transition-colors select-none cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-blue-400 w-4 text-center select-none">
                              {slotRows[id] ?? 2}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSlotRows({ ...slotRows, [id]: Math.min(10, (slotRows[id] ?? 2) + 1) });
                              }}
                              className="w-4 h-4 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center text-xs font-bold transition-colors select-none cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Floor tile (fixed, not draggable) */}
                <div className="pt-1 border-t border-white/5">
                  <span className="text-[8px] text-neutral-600 font-mono ml-1">Floor</span>
                  {origFloor ? (
                    <div className="flex items-center gap-2 bg-neutral-900 rounded-lg border border-neutral-700 p-1 mt-0.5">
                      <img src={floorImg || undefined} alt="Floor Tile" className="w-10 h-10 rounded object-cover" />
                      <span className="text-[10px] font-semibold text-neutral-300 flex-1">Floor Tile</span>
                      <button
                        onClick={() => handleRemove(setOrigFloor as any, setFloorImg as any, origFloor, floorImg)}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                      >Remove</button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 bg-neutral-900 border border-dashed border-neutral-700 rounded-lg px-3 py-2 cursor-pointer hover:border-blue-500/50 transition-colors mt-0.5">
                      <Upload className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="text-[10px] text-neutral-500">Upload Floor Tile</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, setOrigFloor as any, setFloorImg as any, "floor")} />
                    </label>
                  )}
                </div>

                {/* ── Shower Split Mode Toggle ──────────────── */}
                <div className="pt-3 pb-1 border-t border-white/5 mt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3 text-blue-400" /> Shower Wall Split
                      </h4>
                      <p className="text-[9px] text-neutral-500 mt-0.5">Splits the back wall into Left/Right halves.</p>
                    </div>
                    <button
                      onClick={() => setShowerSplitMode(!showerSplitMode)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        showerSplitMode ? "bg-blue-500" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          showerSplitMode ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* ── Shower upload (Active when Split Mode ON) ─ */}
                {showerSplitMode && (
                  <div className="space-y-2 mt-2 bg-neutral-900/50 p-3 rounded-xl border border-blue-500/10">
                    {[
                      { label: "Left Half",  img: showerImg1, origImg: origShower1, setOrig: setOrigShower1, setProc: setShowerImg1, id: "shower1", offsetY: shower1OffsetY, setOffsetY: setShower1OffsetY },
                      { label: "Right Half", img: showerImg2, origImg: origShower2, setOrig: setOrigShower2, setProc: setShowerImg2, id: "shower2", offsetY: shower2OffsetY, setOffsetY: setShower2OffsetY },
                    ].map(({ label, img, origImg, setOrig, setProc, id, offsetY, setOffsetY }) => (
                      <div key={id}>
                        {origImg ? (
                          <div>
                            <div className="flex items-center gap-2 bg-neutral-900 rounded-lg border border-neutral-700 p-1">
                              <img src={img || undefined} alt={label} className="w-10 h-10 rounded object-cover" />
                              <span className="text-[10px] font-semibold text-neutral-300 flex-1">{label}</span>
                              <button onClick={() => handleRemove(setOrig as any, setProc as any, origImg, img)} className="text-[10px] text-red-400 hover:text-red-300 font-bold">Remove</button>
                            </div>
                            <div className="flex items-center gap-1 mt-1 ml-1">
                              <button onClick={() => setOffsetY(Math.max(-1, +(offsetY - 0.1).toFixed(2)))} className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition text-[10px] font-bold leading-none">▲</button>
                              <span className="text-[10px] font-mono text-neutral-400 w-10 text-center">{offsetY.toFixed(1)}</span>
                              <button onClick={() => setOffsetY(Math.min(1, +(offsetY + 0.1).toFixed(2)))} className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition text-[10px] font-bold leading-none">▼</button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 bg-neutral-900 border border-dashed border-neutral-700 rounded-lg px-3 py-2 cursor-pointer hover:border-blue-500/50 transition-colors">
                            <Upload className="w-3.5 h-3.5 text-neutral-500" />
                            <span className="text-[10px] text-neutral-500">Upload {label}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, setOrig as any, setProc as any, id)} />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Shower upload removed so 2x4 uses standard bands above */}
          </div>

          {/* Border Strip */}
          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-sm">Border Strip</h3>
              </div>
              <button
                onClick={() => setStripEnabled(!stripEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${stripEnabled ? "bg-blue-500" : "bg-neutral-700"}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${stripEnabled ? "translate-x-5" : "translate-x-1"}`} />
              </button>
            </div>
            {stripEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1.5">Color</label>
                  <div className="flex gap-2">
                    {["black", "white"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setStripColor(c)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                          stripColor === c
                            ? "border-blue-500 bg-blue-500/10 text-blue-400"
                            : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                        }`}
                      >
                        {c === "black" && <span className="inline-block w-3 h-3 rounded-full border border-white/20 bg-[#111] mr-1 align-middle" />}
                        {c === "white" && <span className="inline-block w-3 h-3 rounded-full border border-neutral-500 bg-[#fff] mr-1 align-middle" />}
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs"><span className="text-neutral-500">Width</span><span className="text-blue-400">{stripWidthMm} mm</span></div>
                  <input type="range" min="1" max="3" value={stripWidthMm} onChange={e => setStripWidthMm(+e.target.value)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-1" />
                </div>
                {(tileSize === "12x18" || tileSize === "2x1" || tileSize === "2x4") && (
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-neutral-500">Strip after every</span><span className="text-blue-400">{stripInterval} tiles</span></div>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((n) => (
                        <button key={n} onClick={() => setStripInterval(n)}
                          className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${stripInterval === n ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-neutral-800 bg-neutral-900 hover:border-neutral-600 text-neutral-400"}`}>
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

        {/* ── 3D Canvas ────────────────────────────────────────────────────── */}
        <div className={`space-y-5 transition-all duration-500 ${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-9'}`}>
          <div className="glass-card rounded-[2rem] border border-white/5 p-4 shadow-2xl overflow-hidden flex flex-col" style={{ height: isTheaterMode ? '750px' : '600px' }}>
            {/* Viewport Header Controls */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  3D Viewport {isTheaterMode && <span className="text-blue-400 font-bold ml-1.5">(Showroom Mode)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInterior(!showInterior)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all duration-300 ${
                    showInterior
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 shadow-md shadow-blue-500/5'
                      : 'bg-neutral-650 text-neutral-400 border-neutral-900 hover:text-white hover:border-neutral-850'
                  }`}
                  title={showInterior ? "Hide Furnishings / Interior" : "Show Furnishings / Interior"}
                >
                  {showInterior ? (
                    <><EyeOff className="w-3.5 h-3.5" /><span>Interior: On</span></>
                  ) : (
                    <><Eye className="w-3.5 h-3.5" /><span>Interior: Off</span></>
                  )}
                </button>
                <button
                  onClick={() => setIsTheaterMode(!isTheaterMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all duration-300 ${
                    isTheaterMode
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 shadow-md shadow-blue-500/5'
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
            </div>
            <div className="flex-1 min-h-0 relative">
            {isLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm transition-opacity duration-700">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-blue-400 text-sm font-bold tracking-wide">Loading 3D Scene…</p>
                  <p className="text-neutral-500 text-xs mt-1">Preparing your showroom</p>
                </div>
              </div>
            )}
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-blue-400 text-sm font-bold">Loading 3D Scene…</div>
              </div>
            }>
              <div ref={canvasRef} className="w-full h-full">
              <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 1.25]} performance={{ min: 0.5 }} camera={{ position: [3, 6.4, 20], fov: 25, near: 0.1, far: 100 }} gl={{ antialias: true, powerPreference: "high-performance" }} style={{ width: "100%", height: "100%", touchAction: "none" }} onCreated={() => setTimeout(() => setIsLoading(false), 600)}>
                <Suspense fallback={null}>
                <SceneLighting sceneKind="bathroom" roomW={roomLength} roomL={roomWidth} sunPosition={[roomLength + 4, 10, roomWidth + 2]} />
                <Room
                  roomW={roomLength} roomL={roomWidth} roomH={wallHeight}
                  tileSize={tileSize}
                  floorTex={floorTex}
                  showerTex1={showerTex1} showerTex2={showerTex2}
                  tileW={tileW} tileH={tileH} bookmatchEnabled={bookmatchEnabled}
                  textures={wallTextures}
                  slotOrder={slotOrder}
                  slotRows={slotRows}
                  isShower={showerSplitMode}
                  shower1OffsetY={shower1OffsetY} shower2OffsetY={shower2OffsetY}
                  stripColor={stripEnabled ? stripColor : null} stripWidthMm={stripWidthMm} stripInterval={stripInterval}
                  groutWidthMm={groutWidth} groutColor={groutColor}
                />
                {showInterior && (
                  <BathroomFurnishings 
                    roomW={roomLength} 
                    roomL={roomWidth} 
                    roomH={wallHeight} 
                    showerWidth={showerWidth} 
                    showerDepth={showerDepth} 
                    showerHeight={showerHeight} 
                    toiletScale={toiletScale}
                    toiletXOffset={toiletXOffset}
                    toiletZOffset={toiletZOffset}
                    toiletRotY={toiletRotY}
                  />
                )}
                <OrbitControls
                  makeDefault
                  enableDamping dampingFactor={0.1}
                  minDistance={3} maxDistance={30}
                  minPolarAngle={Math.PI / 4}
                  maxPolarAngle={Math.PI / 2.05}
                  autoRotate={autoRotate} autoRotateSpeed={0.8}
                  target={[roomLength / 2, wallHeight / 3, roomWidth / 2]}
                />
                <BakeShadows />
                <AdaptiveDpr pixelated />
                <CameraController preset={cameraPreset} onPresetComplete={() => setCameraPreset(null)} roomWidth={roomLength} roomLength={roomWidth} roomHeight={wallHeight} />
                <HotspotSystem hotspots={hotspots} />
                </Suspense>
              </Canvas>
              </div>
            </Suspense>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
