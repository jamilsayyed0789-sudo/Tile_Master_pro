"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useRoomPreviewerStore } from "@/store3d";
import { 
  Upload, 
  Trash2, 
  Box, 
  Rotate3d, 
  Grid, 
  Ruler, 
  Layers, 
  ChevronRight, 
  Download, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  Printer, 
  Plus, 
  Minus, 
  X,
  Maximize2,
  Minimize2,
  Search,
} from 'lucide-react';
import ImageCropperModal from '@/components/ImageCropperModal';

import { motion, AnimatePresence } from 'framer-motion';


type Unit = 'feet' | 'inches' | 'mm';

// High-fidelity standard tile styles definitions
const TILE_STYLES = [
  {
    id: "italian-marble",
    name: "Luxury Statuario Marble",
    background: "radial-gradient(circle at 10% 10%, #ffffff 0%, #fcfbf9 60%, #f5f4f0 100%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cpath d='M0 30 Q30 50 60 70 T120 90' stroke='%23d4d4d8' stroke-width='0.8' fill='none' opacity='0.45'/%3E%3Cpath d='M20 10 Q50 30 80 80 T120 120' stroke='%23e5e5e5' stroke-width='1.2' fill='none' opacity='0.35'/%3E%3Cpath d='M90 0 Q60 40 30 80 T0 110' stroke='%23d4af37' stroke-width='0.4' fill='none' opacity='0.3'/%3E%3C/svg%3E\")",
  },
  {
    id: "carrara-gold",
    name: "Carrara Gold Marble",
    background: "radial-gradient(circle at 30% 20%, #ffffff 0%, #f4f3ee 70%, #eae7df 100%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cpath d='M10 -20 Q70 50 130 160' stroke='%23b45309' stroke-width='0.5' fill='none' opacity='0.25'/%3E%3Cpath d='M-20 40 Q40 80 160 120' stroke='%2378716c' stroke-width='0.8' fill='none' opacity='0.2'/%3E%3C/svg%3E\")",
  },
  {
    id: "slate",
    name: "Ebony Nero Slate",
    background: "linear-gradient(135deg, #23252a 0%, #17181c 50%, #0e0f11 100%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cline x1='0' y1='0' x2='80' y2='0' stroke='white' stroke-width='0.5' opacity='0.03'/%3E%3Cpath d='M0 40 Q40 45 80 40' stroke='white' stroke-width='0.5' fill='none' opacity='0.02'/%3E%3C/svg%3E\")",
  },
  {
    id: "wood",
    name: "Royal Oak Wood Planks",
    background: "linear-gradient(90deg, #85532a 0%, #70411a 50%, #5d3412 100%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cline x1='10' y1='0' x2='10' y2='100' stroke='%23451a03' stroke-width='1.5' opacity='0.4'/%3E%3Cline x1='35' y1='0' x2='35' y2='100' stroke='%23451a03' stroke-width='0.8' opacity='0.3'/%3E%3Cline x1='70' y1='0' x2='70' y2='100' stroke='%23451a03' stroke-width='1.2' opacity='0.35'/%3E%3C/svg%3E\")",
  },
  {
    id: "terrazzo",
    name: "Venetian Terrazzo",
    background: "#e3ded5 url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect x='10' y='15' width='4' height='4' rx='1' fill='%23262626' opacity='0.8' transform='rotate(12 12 17)'/%3E%3Crect x='65' y='25' width='6' height='3' rx='1' fill='%23b45309' opacity='0.9' transform='rotate(45 68 26)'/%3E%3Crect x='30' y='40' width='3' height='5' fill='%23737373' opacity='0.7' transform='rotate(-12 31 42)'/%3E%3Crect x='80' y='60' width='5' height='4' fill='%23b45309' opacity='0.8' transform='rotate(30 82 62)'/%3E%3Crect x='20' y='75' width='6' height='6' rx='1' fill='%23404040' opacity='0.9'/%3E%3Crect x='50' y='80' width='3' height='4' fill='%23f59e0b' opacity='0.8' transform='rotate(12 51 82)'/%3E%3Ccircle cx='45' cy='15' r='3' fill='white' opacity='0.9'/%3E%3Ccircle cx='10' cy='50' r='2' fill='white' opacity='0.9'/%3E%3Crect x='85' y='90' width='5' height='3' fill='%23262626' opacity='0.8'/%3E%3Crect x='40' y='65' width='7' height='5' fill='%23525252' opacity='0.65'/%3E%3C/svg%3E\")",
  },
  {
    id: "ceramic",
    name: "Azure Gloss Ceramic",
    background: "linear-gradient(135deg, #154c70 0%, #1e6492 50%, #2f83bb 100%), linear-gradient(45deg, transparent 45%, rgba(255, 255, 255, 0.1) 50%, transparent 55%)",
  }
];

const ROOM_HEIGHT_3D = 10;

function createStyleTexture(styleId: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  switch (styleId) {
    case "italian-marble":
      ctx.fillStyle = "#f5f4f0"; ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = "rgba(200,200,200,0.3)"; ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(Math.random() * 256, 0); ctx.quadraticCurveTo(Math.random() * 256, 128, Math.random() * 256, 256); ctx.stroke(); }
      ctx.strokeStyle = "rgba(212,175,55,0.15)"; ctx.lineWidth = 0.5;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(Math.random() * 256, 0); ctx.quadraticCurveTo(Math.random() * 256, 128, Math.random() * 256, 256); ctx.stroke(); }
      break;
    case "carrara-gold":
      ctx.fillStyle = "#f4f3ee"; ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = "rgba(180,83,9,0.2)"; ctx.lineWidth = 0.8;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(Math.random() * 256, 0); ctx.quadraticCurveTo(Math.random() * 256, 128, Math.random() * 256, 256); ctx.stroke(); }
      ctx.strokeStyle = "rgba(120,113,108,0.15)"; ctx.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(Math.random() * 256, 0); ctx.quadraticCurveTo(Math.random() * 128, 128, Math.random() * 256, 256); ctx.stroke(); }
      break;
    case "slate":
      ctx.fillStyle = "#1a1b1e"; ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      for (let i = 0; i < 30; i++) { ctx.fillRect(Math.random() * 256, Math.random() * 256, Math.random() * 4 + 1, Math.random() * 2 + 0.5); }
      ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(0, 128); ctx.quadraticCurveTo(64, 132, 128, 128); ctx.quadraticCurveTo(192, 124, 256, 128); ctx.stroke();
      break;
    case "wood":
      const woodColors = ["#85532a", "#70411a", "#5d3412"];
      for (let y = 0; y < 4; y++) { ctx.fillStyle = woodColors[y % 3]; ctx.fillRect(0, y * 64, 256, 64); }
      ctx.strokeStyle = "rgba(69,26,3,0.3)"; ctx.lineWidth = 1.2;
      for (let x = 0; x < 6; x++) { ctx.beginPath(); ctx.moveTo(x * 50 + 10, 0); ctx.lineTo(x * 50 + 10, 256); ctx.stroke(); }
      ctx.strokeStyle = "rgba(69,26,3,0.15)"; ctx.lineWidth = 0.6;
      for (let x = 0; x < 8; x++) { ctx.beginPath(); ctx.moveTo(x * 35 + 5, 0); ctx.lineTo(x * 35 + 5, 256); ctx.stroke(); }
      break;
    case "travertine":
      ctx.fillStyle = "#e8e0d0"; ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "rgba(180,160,140,0.2)";
      for (let i = 0; i < 40; i++) { const r = Math.random() * 6 + 2; ctx.beginPath(); ctx.ellipse(Math.random() * 256, Math.random() * 256, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = "rgba(200,190,175,0.15)";
      for (let i = 0; i < 20; i++) { const r = Math.random() * 3 + 1; ctx.beginPath(); ctx.arc(Math.random() * 256, Math.random() * 256, r, 0, Math.PI * 2); ctx.fill(); }
      break;
    case "terrazzo":
      ctx.fillStyle = "#e3ded5"; ctx.fillRect(0, 0, 256, 256);
      const terrazzoColors = ["#262626", "#b45309", "#737373", "#404040", "#f59e0b"];
      for (let i = 0; i < 25; i++) { ctx.fillStyle = terrazzoColors[Math.floor(Math.random() * terrazzoColors.length)] + "cc"; ctx.save(); ctx.translate(Math.random() * 256, Math.random() * 256); ctx.rotate(Math.random() * Math.PI * 2); ctx.fillRect(-2, -1.5, 4 + Math.random() * 3, 2 + Math.random() * 2); ctx.restore(); }
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 2 + 1, 0, Math.PI * 2); ctx.fill(); }
      break;
    case "ceramic":
      const grad = ctx.createLinearGradient(0, 0, 256, 256);
      grad.addColorStop(0, "#154c70"); grad.addColorStop(0.5, "#1e6492"); grad.addColorStop(1, "#2f83bb");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.save(); ctx.translate(0, 0); ctx.rotate(Math.PI / 4);
      for (let x = -100; x < 400; x += 40) { ctx.fillRect(x, -50, 8, 350); }
      ctx.restore();
      break;
    default:
      ctx.fillStyle = "#c8b8a8"; ctx.fillRect(0, 0, 256, 256);
  }
  return c;
}

function ThreeJSView({ roomWidth, roomLength, wFeet, lFeet, patternSpan, groutWidth, groutColor, floorTex, skirtTex3d, skirtingHeight, skirtingColor, wallColor, styleTex, bookmatchEnabled, selectedStyleId }: {
  roomWidth: number; roomLength: number; wFeet: number; lFeet: number; patternSpan: number; groutWidth: number; groutColor: string; floorTex: THREE.Texture | null; skirtTex3d: THREE.Texture | null; skirtingHeight: number; skirtingColor: string; wallColor: string; styleTex: THREE.Texture | null;
  bookmatchEnabled?: boolean;
  selectedStyleId?: string;
}) {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[roomWidth / 2, 0.005, roomLength / 2]}>
        <planeGeometry args={[roomWidth, roomLength]} />
        <meshStandardMaterial key={floorTex ? `floor-${floorTex.uuid}` : `style-${selectedStyleId ?? 'default'}`} map={floorTex || styleTex} color={(floorTex || styleTex) ? undefined : "#c8b8a8"} roughness={0.7} />
      </mesh>
      {wFeet > 0 && lFeet > 0 && groutWidth > 0 && (() => {
        const base = 2500;
        const maxDim = Math.max(wFeet, lFeet);
        const wPx = Math.round((wFeet / maxDim) * base);
        const hPx = Math.round((lFeet / maxDim) * base);
        const hm = Math.max(1, Math.round(wPx * groutWidth / (2 * wFeet * 304.8)));
        const c = document.createElement("canvas");
        c.width = wPx + 2 * hm;
        c.height = hPx + 2 * hm;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = groutColor;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(0, 0, c.width, hm);
        ctx.fillRect(0, c.height - hm, c.width, hm);
        ctx.fillRect(0, 0, hm, c.height);
        ctx.fillRect(c.width - hm, 0, hm, c.height);
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = bookmatchEnabled ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.repeat.set(roomWidth / wFeet, roomLength / lFeet);
        tex.needsUpdate = true;
        return (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[roomWidth / 2, 0.006, roomLength / 2]}>
            <planeGeometry args={[roomWidth, roomLength]} />
            <meshBasicMaterial map={tex} transparent depthWrite={false} />
          </mesh>
        );
      })()}

      {/* Back wall */}
      <mesh position={[roomWidth / 2, ROOM_HEIGHT_3D / 2, 0]}>
        <planeGeometry args={[roomWidth, ROOM_HEIGHT_3D]} />
        <meshStandardMaterial color={wallColor} roughness={0.6} />
      </mesh>
      <mesh position={[roomWidth / 2, Math.max(0.05, skirtingHeight) / 2, 0.02]}>
        <planeGeometry args={[roomWidth, Math.max(0.05, skirtingHeight)]} />
        <meshStandardMaterial key={skirtTex3d ? `skirt-${skirtTex3d.uuid}` : 'skirt-no-tex'} map={skirtTex3d} color={skirtTex3d ? "#ffffff" : skirtingColor} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Left wall */}
      <mesh position={[0, ROOM_HEIGHT_3D / 2, roomLength / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[roomLength, ROOM_HEIGHT_3D]} />
        <meshStandardMaterial color={wallColor} roughness={0.6} />
      </mesh>
      <mesh position={[0.02, Math.max(0.05, skirtingHeight) / 2, roomLength / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[roomLength, Math.max(0.05, skirtingHeight)]} />
        <meshStandardMaterial key={skirtTex3d ? `skirt-${skirtTex3d.uuid}` : 'skirt-no-tex'} map={skirtTex3d} color={skirtTex3d ? "#ffffff" : skirtingColor} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Right wall */}
      <mesh position={[roomWidth, ROOM_HEIGHT_3D / 2, roomLength / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[roomLength, ROOM_HEIGHT_3D]} />
        <meshStandardMaterial color={wallColor} roughness={0.6} />
      </mesh>
      <mesh position={[roomWidth - 0.02, Math.max(0.05, skirtingHeight) / 2, roomLength / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[roomLength, Math.max(0.05, skirtingHeight)]} />
        <meshStandardMaterial key={skirtTex3d ? `skirt-${skirtTex3d.uuid}` : 'skirt-no-tex'} map={skirtTex3d} color={skirtTex3d ? "#ffffff" : skirtingColor} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[roomWidth / 2, ROOM_HEIGHT_3D, roomLength / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomWidth, roomLength]} />
        <meshStandardMaterial color="#f0ece4" roughness={0.5} />
      </mesh>

      {/* Glass front wall */}
      <mesh position={[roomWidth / 2, ROOM_HEIGHT_3D / 2, roomLength]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[roomWidth, ROOM_HEIGHT_3D]} />
        <meshStandardMaterial color="#88ccff" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function RoomPreviewer() {
  // Room Slider Dimensions (in feet) - persisted
  const roomLength = useRoomPreviewerStore((s) => s.roomLength);
  const setRoomLength = useRoomPreviewerStore((s) => s.setRoomLength);
  const roomWidth = useRoomPreviewerStore((s) => s.roomWidth);
  const setRoomWidth = useRoomPreviewerStore((s) => s.setRoomWidth);
  const patternSpan = 1;

  // 2D vs 3D Mode - persisted
  const is3DMode = useRoomPreviewerStore((s) => s.is3DMode);
  const setIs3DMode = useRoomPreviewerStore((s) => s.setIs3DMode);

  // Theater / Showroom Mode - persisted
  const isTheaterMode = useRoomPreviewerStore((s) => s.isTheaterMode);
  const setIsTheaterMode = useRoomPreviewerStore((s) => s.setIsTheaterMode);

  // Grout options - persisted
  const groutWidth = useRoomPreviewerStore((s) => s.groutWidth);
  const setGroutWidth = useRoomPreviewerStore((s) => s.setGroutWidth);
  const groutColor = useRoomPreviewerStore((s) => s.groutColor);
  const setGroutColor = useRoomPreviewerStore((s) => s.setGroutColor);
  const [hexInput, setHexInput] = useState<string>("c5c2bc");
  const selectedPattern = useRoomPreviewerStore((s) => s.selectedPattern);
  const setSelectedPattern = useRoomPreviewerStore((s) => s.setSelectedPattern);

  // Skirting options - persisted
  const skirtingColor = useRoomPreviewerStore((s) => s.skirtingColor);
  const setSkirtingColor = useRoomPreviewerStore((s) => s.setSkirtingColor);
  const skirtingHeight = useRoomPreviewerStore((s) => s.skirtingHeight);
  const setSkirtingHeight = useRoomPreviewerStore((s) => s.setSkirtingHeight);
  const skirtingUseTexture = useRoomPreviewerStore((s) => s.skirtingUseTexture);
  const setSkirtingUseTexture = useRoomPreviewerStore((s) => s.setSkirtingUseTexture);

  useEffect(() => {
    setHexInput(groutColor.replace('#', ''));
  }, [groutColor]);

  // Tile custom dimensions - persisted
  const sizeUnit = useRoomPreviewerStore((s) => s.sizeUnit);
  const setSizeUnit = useRoomPreviewerStore((s) => s.setSizeUnit);
  const tileWidthInput = useRoomPreviewerStore((s) => s.tileWidthInput);
  const setTileWidthInput = useRoomPreviewerStore((s) => s.setTileWidthInput);
  const tileLengthInput = useRoomPreviewerStore((s) => s.tileLengthInput);
  const setTileLengthInput = useRoomPreviewerStore((s) => s.setTileLengthInput);

  // Custom Image Texture (blob URLs - not persisted, reset on refresh/navigation)
  const [originalCustomImage, setOriginalCustomImage] = useState<string | null>(null);
  const [customTileImage, setCustomTileImage] = useState<string | null>(null);
  const bookmatchEnabled = useRoomPreviewerStore((s) => s.bookmatchEnabled);
  const setBookmatchEnabled = useRoomPreviewerStore((s) => s.setBookmatchEnabled);
  const uploadedFileName = useRoomPreviewerStore((s) => s.uploadedFileName);
  const setUploadedFileName = useRoomPreviewerStore((s) => s.setUploadedFileName);
  const selectedStyleId = useRoomPreviewerStore((s) => s.selectedStyleId);
  const setSelectedStyleId = useRoomPreviewerStore((s) => s.setSelectedStyleId);

  // Crop & Process States
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);



  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (originalCustomImage) {
        URL.revokeObjectURL(originalCustomImage);
      }
      if (customTileImage) {
        URL.revokeObjectURL(customTileImage);
      }
    };
  }, [originalCustomImage, customTileImage]);

  // Calculations states - persisted
  const wastagePercent = useRoomPreviewerStore((s) => s.wastagePercent);
  const setWastagePercent = useRoomPreviewerStore((s) => s.setWastagePercent);
  const tilesPerBoxInput = useRoomPreviewerStore((s) => s.tilesPerBoxInput);
  const setTilesPerBoxInput = useRoomPreviewerStore((s) => s.setTilesPerBoxInput);
  const pricePerBox = useRoomPreviewerStore((s) => s.pricePerBox);
  const setPricePerBox = useRoomPreviewerStore((s) => s.setPricePerBox);

  // Quote Generation Modal
  const [showQuoteModal, setShowQuoteModal] = useState<boolean>(false);
  const clientName = useRoomPreviewerStore((s) => s.clientName);
  const setClientName = useRoomPreviewerStore((s) => s.setClientName);
  const shopName = useRoomPreviewerStore((s) => s.shopName);
  const setShopName = useRoomPreviewerStore((s) => s.setShopName);
  const laborCost = useRoomPreviewerStore((s) => s.laborCost);
  const setLaborCost = useRoomPreviewerStore((s) => s.setLaborCost);

  // References
  const visualizerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visualizerSize, setVisualizerSize] = useState({ width: 480, height: 360 });

  // Textures for Three.js 3D room (not persisted - derived from blob URLs)
  const [floorTex, setFloorTex] = useState<THREE.Texture | null>(null);
  const [skirtTex3d, setSkirtTex3d] = useState<THREE.Texture | null>(null);
  const [styleTex, setStyleTex] = useState<THREE.Texture | null>(null);

  // Read pending texture from storage
  useEffect(() => {
    import('@/utils/textureBridge').then(({ getPendingTexture, clearPendingTexture, buildTileUrl }) => {
      for (const slot of ['room_floor', 'room_wall']) {
        const pending = getPendingTexture(slot);
        if (pending) {
          // Send to cropper instead of directly setting
          setImageToCrop(buildTileUrl(pending.url));
          setUploadedFileName(pending.name);
          clearPendingTexture(slot);
        }
      }
    });
  }, []);

  // Auto-resize listener
  useEffect(() => {
    if (visualizerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          setVisualizerSize({ width: width || 480, height: height || 360 });
        }
      });
      resizeObserver.observe(visualizerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Dimension conversions helpers
  const getConversions = (wStr: string, lStr: string, unit: Unit) => {
    const w = parseFloat(wStr) || 1;
    const l = parseFloat(lStr) || 1;

    let wFeet = 0;
    let lFeet = 0;
    let wInches = 0;
    let lInches = 0;
    let wMm = 0;
    let lMm = 0;

    if (unit === 'feet') {
      wFeet = w;
      lFeet = l;
      wInches = w * 12;
      lInches = l * 12;
      wMm = w * 304.8;
      lMm = l * 304.8;
    } else if (unit === 'inches') {
      wFeet = w / 12;
      lFeet = l / 12;
      wInches = w;
      lInches = l;
      wMm = w * 25.4;
      lMm = l * 25.4;
    } else {
      wFeet = w / 304.8;
      lFeet = l / 304.8;
      wInches = w / 25.4;
      lInches = l / 25.4;
      wMm = w;
      lMm = l;
    }

    return {
      wFeet,
      lFeet,
      wInches,
      lInches,
      wMm,
      lMm
    };
  };

  const { wFeet, lFeet, wInches, lInches, wMm, lMm } = getConversions(tileWidthInput, tileLengthInput, sizeUnit);

  // Auto pack defaults based on tile dimensions
  useEffect(() => {
    const tileAreaInches = wInches * lInches;
    if (tileAreaInches < 150) {
      setTilesPerBoxInput('10'); // 12x12"
    } else if (tileAreaInches < 600) {
      setTilesPerBoxInput('4'); // 24x24"
    } else if (tileAreaInches < 1100) {
      setTilesPerBoxInput('3'); // 32x32"
    } else {
      setTilesPerBoxInput('2'); // 24x48" or 32x64" or larger
    }
  }, [wInches, lInches]);

  // Load floor texture for Three.js 3D room
  useEffect(() => {
    if (!customTileImage) { setFloorTex(null); return; }
    new THREE.TextureLoader().load(customTileImage, (t) => {
      t.wrapS = t.wrapT = bookmatchEnabled ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.anisotropy = 16;
      t.repeat.set(roomWidth / wFeet / patternSpan, roomLength / lFeet / patternSpan);
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      setFloorTex(t);
    });
  }, [customTileImage, roomWidth, roomLength, wFeet, lFeet, patternSpan, bookmatchEnabled]);

  // Load skirting texture separately
  useEffect(() => {
    if (!customTileImage || !skirtingUseTexture) { setSkirtTex3d(null); return; }
    new THREE.TextureLoader().load(
      customTileImage,
      (t) => {
        t.wrapS = t.wrapT = bookmatchEnabled ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.anisotropy = 16;
        // tile width repeats along wall; show full tile vertically so texture is clearly visible
        t.repeat.set(roomWidth / wFeet / patternSpan, Math.max(1, skirtingHeight / lFeet / patternSpan));
        t.colorSpace = THREE.SRGBColorSpace;
        t.needsUpdate = true;
        setSkirtTex3d(t);
      },
      undefined,
      () => { setSkirtTex3d(null); }
    );
  }, [customTileImage, skirtingUseTexture, roomWidth, wFeet, skirtingHeight, lFeet, patternSpan, bookmatchEnabled]);

  // Generate style texture for 3D when no custom image
  useEffect(() => {
    const canvas = createStyleTexture(selectedStyleId);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = bookmatchEnabled ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    tex.repeat.set(roomWidth / wFeet, roomLength / lFeet);
    tex.needsUpdate = true;
    setStyleTex(tex);
  }, [selectedStyleId, roomWidth, roomLength, wFeet, lFeet, bookmatchEnabled]);

  // Handle local image file uploads
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setProcessingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('seamless', 'true');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/tile-processor/process`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Processing failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setImageToCrop(url);
    } catch {
      const url = URL.createObjectURL(file);
      setImageToCrop(url);
    } finally {
      setProcessingImage(false);
    }
  };

  const handleCropComplete = (croppedUrl: string) => {
    if (originalCustomImage) URL.revokeObjectURL(originalCustomImage);
    if (customTileImage) URL.revokeObjectURL(customTileImage);
    
    setOriginalCustomImage(imageToCrop);
    setCustomTileImage(croppedUrl);
    setImageToCrop(null);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const clearCustomImage = () => {
    if (originalCustomImage) {
      URL.revokeObjectURL(originalCustomImage);
    }
    if (customTileImage) {
      URL.revokeObjectURL(customTileImage);
    }
    setOriginalCustomImage(null);
    setCustomTileImage(null);
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Preset sizes handler
  const applyPreset = (presetW: number, presetL: number, presetUnit: Unit) => {
    setSizeUnit(presetUnit);
    setTileWidthInput(presetW.toString());
    setTileLengthInput(presetL.toString());
  };

  // Preset room sizes handler
  const applyRoomPreset = (len: number, wid: number) => {
    setRoomLength(len);
    setRoomWidth(wid);
  };

  // Math calculations
  const totalFloorArea = roomLength * roomWidth;
  const singleTileArea = wFeet * lFeet;
  const rawTilesNeeded = singleTileArea > 0 ? totalFloorArea / singleTileArea : 0;
  const wastageTiles = rawTilesNeeded * (wastagePercent / 100);
  const totalTilesNeeded = Math.ceil(rawTilesNeeded + wastageTiles);
  const packCount = parseInt(tilesPerBoxInput) || 1;
  const boxesNeeded = Math.ceil(totalTilesNeeded / packCount);
  const looseTiles = totalTilesNeeded % packCount;
  const fullBoxesOnly = Math.floor(totalTilesNeeded / packCount);

  // Estimations
  const boxCost = boxesNeeded * pricePerBox;
  const laborCostTotal = totalFloorArea * laborCost;
  const gstCost = boxCost * 0.18; // 18% standard GST
  const netTotalCost = boxCost + gstCost + laborCostTotal;

  // Scale map factors for canvas drawing
  const padding = 60;
  const scaleX = (visualizerSize.width - padding) / roomWidth;
  const scaleY = (visualizerSize.height - padding) / roomLength;
  // Greatly increased scale limit — theater mode allows much larger tile rendering
  const scale = Math.min(scaleX, scaleY, isTheaterMode ? 120 : 95);

  const renderTiles = () => {
    if (singleTileArea <= 0) return null;

    const tileW = wFeet * scale;
    const tileH = lFeet * scale;
    const scaledGrout = (groutWidth / 304.8) * scale;

    const tileElements = [];
    const cols = Math.ceil((roomWidth * scale) / (tileW + scaledGrout)) + 2;
    const rows = Math.ceil((roomLength * scale) / (tileH + scaledGrout)) + 2;

    const activeStyle = TILE_STYLES.find(s => s.id === selectedStyleId) || TILE_STYLES[0];

    for (let r = -1; r <= rows; r++) {
      for (let c = -1; c <= cols; c++) {
        let xOffset = 0;
        if (selectedPattern === 'brick' && Math.abs(r) % 2 !== 0) {
          xOffset = tileW / 2;
        }

        const leftPos = c * (tileW + scaledGrout) + xOffset;
        const topPos = r * (tileH + scaledGrout);

        const tileStyle: React.CSSProperties = {
          left: `${leftPos}px`,
          top: `${topPos}px`,
          width: `${tileW}px`,
          height: `${tileH}px`,
          borderWidth: groutWidth > 0 ? `${Math.max(1, scaledGrout)}px` : '0px',
          borderStyle: 'solid',
          borderColor: groutColor,
          position: 'absolute',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        };

        if (customTileImage) {
          tileStyle.backgroundImage = `url(${customTileImage})`;
          tileStyle.backgroundSize = 'cover';
          tileStyle.backgroundPosition = 'center';
          tileStyle.backgroundRepeat = 'no-repeat';
          tileStyle.backgroundColor = 'transparent';
        } else {
          tileStyle.backgroundImage = activeStyle.background;
          tileStyle.backgroundSize = 'cover';
          tileStyle.backgroundRepeat = 'no-repeat';
        }

        if (bookmatchEnabled) {
          const flipX = Math.abs(c) % 2 === 1 ? -1 : 1;
          const flipY = Math.abs(r) % 2 === 1 ? -1 : 1;
          if (flipX === -1 || flipY === -1) {
             tileStyle.transform = `scale(${flipX}, ${flipY})`;
          }
        }

        tileElements.push(
          <div
            key={`${r}-${c}`}
            className="rounded-[1.5px] shadow-inner"
            style={tileStyle}
          />
        );
      }
    }

    return tileElements;
  };

  const activeStyle = TILE_STYLES.find(s => s.id === selectedStyleId) || TILE_STYLES[0];
  const tileBg = customTileImage
    ? `url(${customTileImage})`
    : activeStyle.background;
  const skirtBg = customTileImage && skirtingUseTexture ? `url(${customTileImage})` : skirtingColor;

  // ─── Three.js 3D Room ──────────────────────────────────────────────

  return (
    <div className={`min-h-screen bg-neutral-600 text-neutral-100 aurora-bg relative overflow-x-hidden py-8 transition-all duration-500 ${isTheaterMode ? 'px-4 sm:px-12' : 'px-4 sm:px-6 lg:px-8'}`}>
      {/* Dynamic Watermark Glows */}
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 radial-glow-amber opacity-30 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 radial-glow-blue opacity-20 pointer-events-none" />

      {/* Main Header Container */}
      <div className={`mx-auto mb-10 transition-all duration-500 ${isTheaterMode ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/20 shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Interactive 3D Visualizer
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient mb-2">
              3D Room Previewer Pro
            </h1>
            <p className="text-neutral-400 max-w-xl text-sm md:text-base leading-relaxed">
              Design your dream floor in real-time. Input custom tile sizes in feet, inches, or mm, upload your own slab image, and see your customized room render instantly in 3D perspective.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => applyPreset(24, 24, 'inches')}
              className="px-4 py-2 text-xs font-semibold bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-850 hover:border-neutral-700 transition"
            >
              Reset to 2x2&apos;
            </button>
          </div>
        </motion.div>
      </div>

      {/* Workspace Grid Split Layout */}
      <div className={`mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start transition-all duration-500 ${isTheaterMode ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
        
        {/* LEFT PANEL: Dynamic Controls Dashboard */}
        <div className={`space-y-6 transition-all duration-500 ${isTheaterMode ? 'hidden lg:hidden' : 'lg:col-span-4'}`}>

          {/* 1. Room Dimension Canvas Sliders */}
          <div className="glass-card rounded-3xl border border-white/5 p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Room Size</h3>
                <p className="text-neutral-400 text-xs">Adjust length and width in feet</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5 font-semibold">
                  <span className="text-neutral-300">Room Length (ft)</span>
                  <span className="text-amber-400">{roomLength} ft</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="4"
                    max="25"
                    value={roomLength}
                    onChange={(e) => setRoomLength(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setRoomLength(Math.max(4, roomLength - 1))}
                      className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setRoomLength(Math.min(25, roomLength + 1))}
                      className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5 font-semibold">
                  <span className="text-neutral-300">Room Width (ft)</span>
                  <span className="text-amber-400">{roomWidth} ft</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="4"
                    max="25"
                    value={roomWidth}
                    onChange={(e) => setRoomWidth(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setRoomWidth(Math.max(4, roomWidth - 1))}
                      className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setRoomWidth(Math.min(25, roomWidth + 1))}
                      className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Room presets */}
            <div className="mt-5 pt-4 border-t border-white/5">
              <span className="text-xs font-bold text-neutral-400 block mb-2">Indian Room Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyRoomPreset(6, 6)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 border border-neutral-800/80 hover:bg-neutral-850 hover:border-neutral-700 text-neutral-300 transition"
                >
                  Pooja Room (6x6)
                </button>
                <button
                  onClick={() => applyRoomPreset(8, 6)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 border border-neutral-800/80 hover:bg-neutral-850 hover:border-neutral-700 text-neutral-300 transition"
                >
                  Bath (8x6)
                </button>
                <button
                  onClick={() => applyRoomPreset(10, 8)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 border border-neutral-800/80 hover:bg-neutral-850 hover:border-neutral-700 text-neutral-300 transition"
                >
                  Kitchen (10x8)
                </button>
                <button
                  onClick={() => applyRoomPreset(14, 12)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 border border-neutral-800/80 hover:bg-neutral-850 hover:border-neutral-700 text-neutral-300 transition"
                >
                  Bedroom (14x12)
                </button>
                <button
                  onClick={() => applyRoomPreset(18, 16)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 border border-neutral-800/80 hover:bg-neutral-850 hover:border-neutral-700 text-neutral-300 transition"
                >
                  Hall (18x16)
                </button>
              </div>
            </div>
          </div>

          {/* 2. Custom Size Selector (Switcher for Feet, Inches, mm) */}
          <div className="glass-card rounded-3xl border border-white/5 p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Tile Dimensions</h3>
                  <p className="text-neutral-400 text-xs">Enter any size & select unit</p>
                </div>
              </div>

              {/* Unit Switcher Control */}
              <div className="flex bg-neutral-900 rounded-lg p-0.5 border border-neutral-800">
                {(['feet', 'inches', 'mm'] as Unit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setSizeUnit(u)}
                    className={`px-3 py-1 text-xs font-bold rounded-md capitalize transition-all ${
                      sizeUnit === u
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {u === 'mm' ? 'mm' : u}
                  </button>
                ))}
              </div>
            </div>

            {/* W x L Numerical Inputs */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Tile Width ({sizeUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={tileWidthInput}
                  onChange={(e) => setTileWidthInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 font-mono text-white focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition"
                  placeholder="Width"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Tile Length ({sizeUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={tileLengthInput}
                  onChange={(e) => setTileLengthInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 font-mono text-white focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition"
                  placeholder="Length"
                />
              </div>
            </div>

          </div>


                    {/* Bookmatch Toggle */}
          <div className="glass-card rounded-3xl border border-white/5 p-5 shadow-xl mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Bookmatch (Mirror)</h3>
              </div>
              <button
                onClick={() => setBookmatchEnabled(!bookmatchEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${bookmatchEnabled ? "bg-amber-500" : "bg-neutral-700"}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${bookmatchEnabled ? "translate-x-5" : "translate-x-1"}`} />
              </button>
            </div>
            <p className="text-xs text-neutral-400">Flips alternate tiles to create a seamless butterfly pattern.</p>
          </div>

          {/* 3. Tile Style Selector & Custom Image Texture Import */}
          <div className="glass-card rounded-3xl border border-white/5 p-6 shadow-xl relative">
            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Tile Texture</h3>
                <p className="text-neutral-400 text-xs">Import a custom image for the tile texture</p>
              </div>
            </div>

            {/* Custom File Upload Section */}
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Upload Custom Tile Image
                </label>
                {customTileImage && (
                  <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Custom Image Active
                  </span>
                )}
              </div>

              {/* Secret input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
              />

              {!customTileImage ? (
                <div className="flex flex-col gap-1 w-full">
                  {processingImage ? (
                    <div className="w-full border-2 border-dashed border-amber-500/30 bg-amber-500/5 rounded-2xl p-6 text-center">
                      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
                      <span className="block text-sm font-bold text-amber-400 mb-0.5">Processing image...</span>
                      <span className="text-xs text-neutral-500">Removing background & detecting tile</span>
                    </div>
                  ) : (
                    <button
                      onClick={triggerUpload}
                      className="w-full border-2 border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-600/40 rounded-2xl p-6 text-center group cursor-pointer transition"
                    >
                      <Upload className="w-8 h-8 text-neutral-500 group-hover:text-amber-400 mx-auto mb-2.5 transition" />
                      <span className="block text-sm font-bold text-neutral-300 mb-0.5">Select image file</span>
                      <span className="text-xs text-neutral-500">Supports PNG, JPG, JPEG, WEBP from your local disk</span>
                    </button>
                  )}

                </div>
              ) : (
                <>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-12 h-12 rounded-lg border border-neutral-700 bg-neutral-600 flex-shrink-0"
                      style={{
                        backgroundImage: `url(${customTileImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-white block truncate">
                        {uploadedFileName}
                      </span>
                      <span className="text-xs text-neutral-400 block">
                        Custom texture applied
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={triggerUpload}
                      className="p-2.5 rounded-xl bg-neutral-600 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition"
                      title="Replace file"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={clearCustomImage}
                      className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                </>
              )}
            </div>
          </div>

          {/* 4. Pattern & Grout Selection */}
          <div className="glass-card rounded-3xl border border-white/5 p-6 shadow-xl relative">
            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-3">
              <div className="p-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Layout & Grout</h3>
                <p className="text-neutral-400 text-xs">Set layout alignment and spacer lines</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Layout Pattern
                </label>
                <select
                  value={selectedPattern}
                  onChange={(e) => setSelectedPattern(e.target.value as 'grid' | 'brick')}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-white font-semibold focus:outline-none focus:border-amber-500/50 transition cursor-pointer"
                >
                  <option value="grid">Standard Stacked Grid</option>
                  <option value="brick">Brick Bond (50% Offset)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Grout Spacer (mm)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={groutWidth}
                    onChange={(e) => setGroutWidth(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="font-mono text-white text-sm font-semibold w-10 text-right">{groutWidth}mm</span>
                </div>
              </div>
            </div>

            {/* Grout Color selection */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2.5 uppercase tracking-wider">
                Grout Color
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-900/40 p-4 rounded-2xl border border-white/5">
                {/* Preset Shades */}
                <div className="space-y-2">
                  <span className="block text-[10px] text-neutral-500 uppercase tracking-widest font-black">
                    Preset Shades
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {['#ffffff', '#c5c2bc', '#737373', '#262626', '#b45309', '#1e4b6c'].map((c) => {
                      const isActive = groutColor.toLowerCase() === c.toLowerCase();
                      return (
                        <button
                          key={c}
                          onClick={() => setGroutColor(c)}
                          className={`w-7 h-7 rounded-full border transition-all cursor-pointer relative flex items-center justify-center ${
                            isActive
                              ? 'border-amber-500 scale-110 shadow-lg shadow-amber-500/10'
                              : 'border-neutral-800 hover:border-neutral-700 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c }}
                          title={c}
                        >
                          {isActive && (
                            <Check className={`w-3.5 h-3.5 ${c.toLowerCase() === '#ffffff' ? 'text-black' : 'text-white'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Input */}
                <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-neutral-850 pt-3 sm:pt-0 sm:pl-4">
                  <span className="block text-[10px] text-neutral-500 uppercase tracking-widest font-black">
                    Custom Hex Color
                  </span>
                  <div className="flex items-center gap-2.5">
                    {/* Native Color Picker styled as a premium round button */}
                    <div className="relative w-8 h-8 rounded-xl border border-neutral-750 overflow-hidden flex-shrink-0 cursor-pointer shadow-md hover:border-amber-500/50 transition">
                      <input
                        type="color"
                        value={groutColor}
                        onChange={(e) => setGroutColor(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer scale-150"
                      />
                      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: groutColor }} />
                    </div>

                    {/* Hex text input */}
                    <div className="relative flex-1 max-w-[120px]">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 text-xs font-mono font-bold">#</span>
                      <input
                        type="text"
                        maxLength={6}
                        value={hexInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                            setHexInput(val);
                            if (val.length === 3 || val.length === 6) {
                              setGroutColor(`#${val}`);
                            }
                          }
                        }}
                        className="w-full bg-neutral-600 border border-neutral-850 rounded-xl pl-6 pr-3 py-1.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-500/50 transition-all font-semibold"
                        placeholder="HEX"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Skirting Controls */}
          <div className="glass-card rounded-3xl border border-white/5 p-6 shadow-xl relative">
            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Skirting</h3>
                <p className="text-neutral-400 text-xs">Baseboard color & height</p>
              </div>
            </div>

            {/* Color selection */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">
                Skirting Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { color: "#111111", label: "Charcoal", bg: "bg-[#111111]" },
                  { color: "#f5f5f0", label: "Ivory", bg: "bg-[#f5f5f0]" },
                  { color: "#5c3d2e", label: "Walnut", bg: "bg-[#5c3d2e]" },
                  { color: "#c8a96e", label: "Champagne", bg: "bg-[#c8a96e]" },
                  { color: "#4a5568", label: "Slate", bg: "bg-[#4a5568]" },
                  { color: "#8b7355", label: "Sandstone", bg: "bg-[#8b7355]" },
                  { color: "#c9a96e", label: "Gold", bg: "bg-[#c9a96e]" },
                  { color: "#2d3748", label: "Graphite", bg: "bg-[#2d3748]" },
                ].map(({ color, label, bg }) => (
                  <button
                    key={color}
                    onClick={() => setSkirtingColor(color)}
                    title={label}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition ${
                      skirtingColor === color
                        ? 'border-amber-500 bg-neutral-800'
                        : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full ${bg} border border-white/10 shadow`} />
                    <span className="text-[9px] font-bold text-neutral-400">{label}</span>
                  </button>
                ))}
              </div>

              {/* Texture toggle (only shown when custom image is uploaded) */}
              {customTileImage && (
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skirtingUseTexture}
                    onChange={(e) => setSkirtingUseTexture(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs text-neutral-400 font-semibold">Apply custom texture to skirting</span>
                </label>
              )}
            </div>

            {/* Height slider */}
            <div>
              <div className="flex justify-between text-sm mb-1.5 font-semibold">
                <span className="text-neutral-300">Skirting Height (ft)</span>
                <span className="text-amber-400">{skirtingHeight.toFixed(1)} ft</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={skirtingHeight}
                  onChange={(e) => setSkirtingHeight(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex gap-1">
                  <button 
                    onClick={() => setSkirtingHeight(Math.max(0.1, +(skirtingHeight - 0.05).toFixed(2)))}
                    className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setSkirtingHeight(Math.min(1.0, +(skirtingHeight + 0.05).toFixed(2)))}
                    className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Dynamic Viewport & 3D Isometric Previewer */}
        <div className={`space-y-6 transition-all duration-500 ${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
          
          {/* Main Visualizer Board */}
          <div className="glass-card rounded-[2rem] border border-white/5 p-6 shadow-2xl relative overflow-hidden flex flex-col">
            
            {/* Viewport Header Controls */}
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  Live Viewport Preview {isTheaterMode && <span className="text-amber-400 font-bold ml-1.5">(Showroom Mode)</span>}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Showroom / Theater Mode Button */}
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
                    <>
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>Standard View</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Showroom View</span>
                    </>
                  )}
                </button>

                {/* 2D/3D Segmented Control pills */}
                <div className="flex bg-neutral-600 rounded-full p-1 border border-neutral-900 shadow-inner">
                  <button
                    onClick={() => setIs3DMode(false)}
                    className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                      !is3DMode
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    2D Grid
                  </button>
                  <button
                    onClick={() => setIs3DMode(true)}
                    className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                      is3DMode
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Rotate3d className="w-3.5 h-3.5" /> 3D Room
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas Area */}
            <div
              ref={visualizerRef}
              className={`w-full bg-gradient-to-b from-neutral-950 to-neutral-900 rounded-2xl border border-neutral-800/80 relative overflow-hidden flex items-center justify-center shadow-inner transition-all duration-500 ${
                isTheaterMode ? 'h-[750px] lg:h-[900px]' : 'h-[620px] lg:h-[780px]'
              }`}
            >
              {/* 2D Mode dimension overlays */}
              {!is3DMode && (
                <>
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-black text-amber-500 z-10 shadow">
                    {roomWidth} ft (Width)
                  </div>
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-black text-amber-500 z-10 rotate-90 shadow">
                    {roomLength} ft (Length)
                  </div>
                </>
              )}

              {is3DMode ? (
                <div className="w-full h-full">
                  <Canvas camera={{ position: [roomWidth * 0.7, ROOM_HEIGHT_3D * 0.5, roomLength * 1.2], fov: 40, near: 0.1, far: 100 }} gl={{ antialias: true }} style={{ width: "100%", height: "100%" }}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 10, 5]} intensity={0.8} />
                    <directionalLight position={[-3, 5, -3]} intensity={0.3} />
                    <ThreeJSView roomWidth={roomWidth} roomLength={roomLength} wFeet={wFeet} lFeet={lFeet} patternSpan={patternSpan} groutWidth={groutWidth} groutColor={groutColor} floorTex={floorTex} skirtTex3d={skirtTex3d} skirtingHeight={skirtingHeight} skirtingColor={skirtingColor} wallColor="#e5e7eb" styleTex={styleTex} bookmatchEnabled={bookmatchEnabled} selectedStyleId={selectedStyleId} />
                    <OrbitControls enableDamping dampingFactor={0.1} enableRotate enableZoom target={[roomWidth / 2, ROOM_HEIGHT_3D / 2, roomLength / 2]} />
                  </Canvas>
                </div>
              ) : (
                <>
                  {/* Main Tiled Floor plane */}
                  <div
                    className="relative bg-neutral-900 border-2 border-amber-500/30 shadow-2xl transition-all duration-300 overflow-hidden"
                    style={{
                      width: `${roomWidth * scale}px`,
                      height: `${roomLength * scale}px`,
                    }}
                  >
                    {renderTiles()}
                  </div>
                </>
              )}
            </div>

            {/* Interactive metadata footer */}
            <div className="mt-5 bg-neutral-600/60 rounded-2xl border border-white/5 p-4 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                {customTileImage ? (
                  <div 
                    className="w-10 h-10 rounded-lg border border-neutral-700 bg-neutral-600" 
                    style={{ backgroundImage: `url(${customTileImage})`, backgroundSize: 'cover' }}
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-lg border border-neutral-700 bg-neutral-600"
                    style={{ background: (TILE_STYLES.find(s => s.id === selectedStyleId) || TILE_STYLES[0]).background }}
                  />
                )}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block">Current Design</span>
                  <span className="text-sm font-bold text-white">
                    {customTileImage ? 'Custom Slab Texture' : (TILE_STYLES.find(s => s.id === selectedStyleId) || TILE_STYLES[0]).name}
                  </span>
                </div>
              </div>

              <div className="font-mono text-xs text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 text-right">
                Tile: {wInches.toFixed(1)}&quot; × {lInches.toFixed(1)}&quot; | Gap: {groutWidth}mm
              </div>
            </div>
          </div>

          {/* Quick Design advice panel */}
          <div className="glass-card rounded-3xl border border-white/5 p-6 shadow-lg">
            <div className="flex gap-4">
              <div className="mt-1 p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1.5">Indian Laying Tip for {wInches.toFixed(0)}x{lInches.toFixed(0)}&quot; Tiles</h4>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  For slabs larger than 24x48 inches, a minimum 3mm grout spacer is strictly advised by Kajaria and Somany dealers in India. Large vitrified slabs expand and contract with hot Indian weather. Laying them flush without spacers will trigger cracking or buckling within 1-2 seasons.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* RENDER MODAL: A4 Styled Print & Quotation Invoice Generator */}
      <AnimatePresence>
        {showQuoteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl relative"
            >
              
              {/* Modal close */}
              <button
                onClick={() => setShowQuoteModal(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-600 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 sm:p-8">
                <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Printer className="text-amber-500 w-6 h-6" /> Quotation Builder
                </h3>
                <p className="text-neutral-400 text-xs mb-6">
                  Input customer details below to generate a beautiful, formatted billing quote.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-neutral-600 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/50 transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">
                      Dealership Shop Name
                    </label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full bg-neutral-600 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/50 transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">
                      Labor Installation Cost (₹/sqft)
                    </label>
                    <input
                      type="number"
                      value={laborCost}
                      onChange={(e) => setLaborCost(parseInt(e.target.value) || 0)}
                      className="w-full bg-neutral-600 border border-neutral-800 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500/50 transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">
                      Active Grout Spacer
                    </label>
                    <div className="w-full bg-neutral-600 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-400 text-sm font-mono">
                      {groutWidth} mm spacer ({groutColor})
                    </div>
                  </div>
                </div>

                {/* Live Quotation preview */}
                <div id="print-quotation" className="bg-white text-neutral-950 p-6 rounded-2xl border border-neutral-300 font-sans shadow shadow-inner text-xs space-y-4">
                  
                  {/* Dealership Logo & Header */}
                  <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-3">
                    <div>
                      <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">{shopName}</h2>
                      <p className="text-neutral-500 font-semibold">Premium Ceramic, Vitrified & Marble Slabs</p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-extrabold uppercase text-neutral-800">Pro Estimate</h4>
                      <p className="text-neutral-500 font-mono">Date: {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="grid grid-cols-2 gap-4 pb-2 border-b border-neutral-200">
                    <div>
                      <span className="text-[10px] font-black text-neutral-400 uppercase block">Prepared For</span>
                      <span className="text-sm font-extrabold text-neutral-800">{clientName || 'Valued Customer'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-neutral-400 uppercase block">Area Dimensions</span>
                      <span className="text-sm font-bold text-neutral-800">{roomWidth} ft × {roomLength} ft ({totalFloorArea} sqft)</span>
                    </div>
                  </div>

                  {/* Invoice Table Items */}
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-300 text-[10px] font-black uppercase text-neutral-500">
                        <th className="py-1">Particulars</th>
                        <th className="py-1 text-center">Unit Size</th>
                        <th className="py-1 text-center">Qty Required</th>
                        <th className="py-1 text-right">Rate</th>
                        <th className="py-1 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-mono">
                      <tr>
                        <td className="py-2 text-neutral-900 font-sans">
                          <strong>Vitrified Floor Tiles</strong><br />
                          <span className="text-[10px] text-neutral-500">
                            {customTileImage ? 'Custom Uploaded Slab Texture' : (TILE_STYLES.find(s => s.id === selectedStyleId) || TILE_STYLES[0]).name}
                          </span>
                        </td>
                        <td className="py-2 text-center">{wInches.toFixed(0)}&quot;x{lInches.toFixed(0)}&quot;</td>
                        <td className="py-2 text-center">{boxesNeeded} Boxes <span className="text-[10px] text-neutral-500 font-sans">({totalTilesNeeded} tiles)</span></td>
                        <td className="py-2 text-right">₹{pricePerBox}/box</td>
                        <td className="py-2 text-right text-neutral-900 font-bold">₹{boxCost.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-neutral-900 font-sans">
                          <strong>Spacer Spacers & Grout spacer</strong><br />
                          <span className="text-[10px] text-neutral-500">{groutWidth}mm size ({groutColor})</span>
                        </td>
                        <td className="py-2 text-center">-</td>
                        <td className="py-2 text-center">1 Pack</td>
                        <td className="py-2 text-right">₹150</td>
                        <td className="py-2 text-right text-neutral-900 font-bold">₹150</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-neutral-900 font-sans">
                          <strong>Premium Installation Labor</strong><br />
                          <span className="text-[10px] text-neutral-500">Rate: ₹{laborCost}/sq.ft</span>
                        </td>
                        <td className="py-2 text-center">-</td>
                        <td className="py-2 text-center">{totalFloorArea} sqft</td>
                        <td className="py-2 text-right">₹{laborCost}/sqft</td>
                        <td className="py-2 text-right text-neutral-900 font-bold">₹{laborCostTotal.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Calculations Summary block */}
                  <div className="pt-2 border-t-2 border-neutral-300 flex justify-end">
                    <div className="w-64 space-y-1.5 text-right font-mono">
                      <div className="flex justify-between text-neutral-600">
                        <span>Subtotal:</span>
                        <span>₹{(boxCost + 150 + laborCostTotal).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600">
                        <span>CGST + SGST (18%):</span>
                        <span>₹{(gstCost).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-[13px] font-black text-neutral-900 border-t border-neutral-200 pt-1.5">
                        <span>Grand Total:</span>
                        <span>₹{netTotalCost.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Legal Terms disclaimer */}
                  <div className="pt-4 border-t border-neutral-200 text-[9px] text-neutral-500 space-y-1 font-sans">
                    <p className="font-bold uppercase text-neutral-700">Important Technical Specifications:</p>
                    <ul className="list-disc pl-3.5 space-y-0.5">
                      <li>Calculated tiles count includes a <strong>{wastagePercent}% wastage buffer</strong> to support cutting offsets.</li>
                      <li>Indian standard tile boxes must be ordered as integer box counts; loose tiles cannot be returned at Kajaria/Somany hubs.</li>
                      <li>This estimate is generated dynamically by TileMaster Pro calculator engine.</li>
                    </ul>
                  </div>
                </div>

                {/* Print button footer */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowQuoteModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition font-semibold text-sm cursor-pointer"
                  >
                    Close Modal
                  </button>
                  <button
                    onClick={() => {
                      const printContents = document.getElementById('print-quotation')?.innerHTML;
                      const originalContents = document.body.innerHTML;
                      if (printContents) {
                        const styleElement = document.createElement('style');
                        styleElement.innerHTML = `
                          @media print {
                            body {
                              background: white !important;
                              color: black !important;
                              padding: 2cm !important;
                            }
                            #print-quotation {
                              border: none !important;
                              box-shadow: none !important;
                              width: 100% !important;
                            }
                          }
                        `;
                        document.head.appendChild(styleElement);
                        window.print();
                        document.head.removeChild(styleElement);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm transition shadow flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Print Quotation Sheet
                  </button>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Cropper Modal */}
      {imageToCrop && (
        <ImageCropperModal
          imageUrl={imageToCrop}
          onClose={() => setImageToCrop(null)}
          onCropComplete={handleCropComplete}
        />
      )}

    </div>
  );
}
