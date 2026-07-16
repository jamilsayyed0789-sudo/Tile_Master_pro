"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, BakeShadows, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import { useKitchen3DStore } from "@/store3d";
import { useVolatileStore } from "@/volatileStore";
import { Upload, ImageIcon, CookingPot, LayoutGrid, Paintbrush, Rotate3d, Maximize2, Minimize2, Search, Ruler, Eye, EyeOff } from "lucide-react";
import SceneLighting from "@/components/scene3d/SceneLighting";
import KitchenFurnishings from "@/components/scene3d/KitchenFurnishings";
import GlassWall from "@/components/scene3d/GlassWall";
import { TILE_FLOOR_PBR, TILE_WALL_PBR, INTERIOR_PAINT_PBR, COUNTERTOP_PBR } from "@/components/scene3d/tilePbr";
import CameraController, { CameraPreset } from "@/components/scene3d/CameraController";
import ClickToFocus from "@/components/scene3d/ClickToFocus";
import HotspotSystem, { HotspotDef } from "@/components/scene3d/HotspotSystem";
import { woodMat } from "@/components/scene3d/materials";


function Kitchen3D({ roomW, roomL, roomH, backsplashTex, tileSize, countertopColor, countertopTex, tileRotation, counterDepth, slabMode, highlighterTex, highlighterRows, floorTex, floorTileSize, stripColor, stripWidthMm, stripInterval, showInterior = true }: {
  roomW: number; roomL: number; roomH: number; backsplashTex: THREE.Texture | null; tileSize: string; countertopColor: string; countertopTex: THREE.Texture | null; tileRotation: number; counterDepth: number; slabMode: boolean; highlighterTex: THREE.Texture | null; highlighterRows: number; floorTex: THREE.Texture | null; floorTileSize: string; stripColor?: string | null; stripWidthMm?: number; stripInterval?: number; showInterior?: boolean;
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
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    tex.generateMipmaps = true;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    tex.needsUpdate = true;
    return tex;
  };
  const stripTex = useMemo(() => getStripTex(kTileW, kTileH, stripInterval || 1), [stripColor, stripWidthMm, stripInterval, kTileW, kTileH]);

  const getGroutTex = (tileW: number, tileH: number, groutWidthMm: number, groutColor: string) => {
    if (!groutWidthMm) return null;
    const base = 2048;
    const maxDim = Math.max(tileW, tileH);
    const wPx = Math.round((tileW / maxDim) * base);
    const hPx = Math.round((tileH / maxDim) * base);
    const c = document.createElement("canvas");
    c.width = wPx;
    c.height = hPx;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, wPx, hPx);
    const hm = Math.max(1, Math.round(wPx * (groutWidthMm / 2) / (tileW * 304.8)));
    const vm = Math.max(1, Math.round(hPx * (groutWidthMm / 2) / (tileH * 304.8)));
    ctx.fillStyle = groutColor;
    ctx.fillRect(0, 0, wPx, vm);
    ctx.fillRect(0, hPx - vm, wPx, vm);
    ctx.fillRect(0, 0, hm, hPx);
    ctx.fillRect(wPx - hm, 0, hm, hPx);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    tex.generateMipmaps = true;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  };

  const wallGroutBase = useMemo(() => getGroutTex(kTileW, kTileH, 0.7, "#e5e7eb"), [kTileW, kTileH]);
  const floorGroutBase = useMemo(() => getGroutTex(fTileW, fTileH, 0.7, "#e5e7eb"), [fTileW, fTileH]);

  const getGroutOverlay = (w: number, h: number, isFloor: boolean = false) => {
    const base = isFloor ? floorGroutBase : wallGroutBase;
    if (!base) return null;
    const t = base.clone();
    t.repeat.set(w / (isFloor ? fTileW : kTileW), h / (isFloor ? fTileH : kTileH));
    if (!isFloor) {
      t.center.set(0.5, 0.5);
      t.rotation = tileRotation * (Math.PI / 180);
    }
    t.needsUpdate = true;
    return t;
  };

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
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
  };

  const makeStripOverlay = (w: number, h: number) => {
    if (!stripTex || !stripWidthMm) return null;
    const interval = stripInterval || 1;
    const t = stripTex.clone();
    t.repeat.set(w / kTileW, h / (kTileH * interval));
    t.center.set(0.5, 0.5);
    t.rotation = tileRotation * (Math.PI / 180);
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
          <meshBasicMaterial map={t} transparent opacity={1} depthWrite={false} side={THREE.FrontSide} />
        </mesh>
      ) : null;
    };
    return (
      <group>
        <mesh position={[roomW / 2, counterH / 2, 0]}>
          <planeGeometry args={[roomW, counterH]} />
          <meshPhysicalMaterial color="#e8e0d0" {...INTERIOR_PAINT_PBR} />
        </mesh>
        {highlighterTex ? (
          <>
            {lowerH > 0 && (
              <group position={[roomW / 2, counterH + lowerH / 2, 0]}>
                <mesh receiveShadow>
                  <planeGeometry args={[roomW, lowerH]} />
                  <meshPhysicalMaterial map={tex} color={tex ? undefined : "#f5f0e8"} {...TILE_WALL_PBR} />
                </mesh>
                {stripOverlay(roomW, lowerH)}
                {wallGroutBase && (
                  <mesh position={[0, 0, 0.002]}>
                    <planeGeometry args={[roomW, lowerH]} />
                    <meshBasicMaterial map={getGroutOverlay(roomW, lowerH, false) || undefined} transparent depthWrite={false} side={THREE.FrontSide} />
                  </mesh>
                )}
              </group>
            )}
            <group position={[roomW / 2, hlY + hlHeight / 2, 0.002]}>
              <mesh receiveShadow>
                <planeGeometry args={[roomW, hlHeight]} />
                <meshPhysicalMaterial map={hlTex} color={hlTex ? undefined : "#d4a017"} {...TILE_WALL_PBR} />
              </mesh>
              {wallGroutBase && (
                <mesh position={[0, 0, 0.002]}>
                  <planeGeometry args={[roomW, hlHeight]} />
                  <meshBasicMaterial map={getGroutOverlay(roomW, hlHeight, false) || undefined} transparent depthWrite={false} side={THREE.FrontSide} />
                </mesh>
              )}
            </group>
            {upperH > 0 && (
              <group position={[roomW / 2, hlY + hlHeight + upperH / 2, 0]}>
                <mesh receiveShadow>
                  <planeGeometry args={[roomW, upperH]} />
                  <meshPhysicalMaterial map={tex} color={tex ? undefined : "#f5f0e8"} {...TILE_WALL_PBR} />
                </mesh>
                {stripOverlay(roomW, upperH)}
                {wallGroutBase && (
                  <mesh position={[0, 0, 0.002]}>
                    <planeGeometry args={[roomW, upperH]} />
                    <meshBasicMaterial map={getGroutOverlay(roomW, upperH, false) || undefined} transparent depthWrite={false} side={THREE.FrontSide} />
                  </mesh>
                )}
              </group>
            )}
          </>
        ) : (
            <group position={[roomW / 2, counterH + bsHeight / 2, 0]}>
            <mesh receiveShadow>
              <planeGeometry args={[roomW, bsHeight]} />
              <meshPhysicalMaterial map={tex} color={tex ? undefined : "#f5f0e8"} {...TILE_WALL_PBR} />
            </mesh>
            {stripOverlay(roomW, bsHeight)}
            {wallGroutBase && (
              <mesh position={[0, 0, 0.002]}>
                <planeGeometry args={[roomW, bsHeight]} />
                <meshBasicMaterial map={getGroutOverlay(roomW, roomH - counterH, false) || undefined} transparent depthWrite={false} side={THREE.FrontSide} />
              </mesh>
            )}
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
          <meshBasicMaterial map={t} transparent opacity={1} depthWrite={false} side={THREE.FrontSide} />
        </mesh>
      ) : null;
    };
    return (
      <group>
        <mesh position={[0, counterH / 2, lDepth / 2 + 0.02]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[lDepth, counterH]} />
          <meshPhysicalMaterial color="#e8e0d0" {...INTERIOR_PAINT_PBR} />
        </mesh>
        {highlighterTex ? (
          <>
            {lowerH > 0 && (
              <group position={[0, counterH + lowerH / 2, lDepth / 2 + 0.02]} rotation={[0, Math.PI / 2, 0]}>
                <mesh receiveShadow>
                  <planeGeometry args={[lDepth, lowerH]} />
                  <meshPhysicalMaterial map={tex} color={tex ? undefined : "#e8e0d0"} {...TILE_WALL_PBR} />
                </mesh>
                {stripOverlay(lDepth, lowerH, 0.001)}
                {wallGroutBase && (
                  <mesh position={[0, 0, 0.002]}>
                    <planeGeometry args={[lDepth, lowerH]} />
                    <meshBasicMaterial map={getGroutOverlay(lDepth, lowerH, false) || undefined} transparent depthWrite={false} side={THREE.FrontSide} />
                  </mesh>
                )}
              </group>
            )}
            <group position={[0, hlY + hlHeight / 2, lDepth / 2 + 0.022]} rotation={[0, Math.PI / 2, 0]}>
              <mesh receiveShadow>
                <planeGeometry args={[lDepth, hlHeight]} />
                <meshPhysicalMaterial map={hlTex} color={hlTex ? undefined : "#d4a017"} {...TILE_WALL_PBR} />
              </mesh>
              {wallGroutBase && (
                <mesh position={[0, 0, 0.002]}>
                  <planeGeometry args={[lDepth, hlHeight]} />
                  <meshBasicMaterial map={getGroutOverlay(lDepth, hlHeight, false) || undefined} transparent depthWrite={false} side={THREE.FrontSide} />
                </mesh>
              )}
            </group>
            {upperH > 0 && (
              <group position={[0, hlY + hlHeight + upperH / 2, lDepth / 2 + 0.02]} rotation={[0, Math.PI / 2, 0]}>
                <mesh receiveShadow>
                  <planeGeometry args={[lDepth, upperH]} />
                  <meshPhysicalMaterial map={tex} color={tex ? undefined : "#e8e0d0"} {...TILE_WALL_PBR} />
                </mesh>
                {stripOverlay(lDepth, upperH, 0.001)}
                {wallGroutBase && (
                  <mesh position={[0, 0, 0.002]}>
                    <planeGeometry args={[lDepth, upperH]} />
                    <meshBasicMaterial map={getGroutOverlay(lDepth, upperH, false) || undefined} transparent depthWrite={false} side={THREE.FrontSide} />
                  </mesh>
                )}
              </group>
            )}
          </>
        ) : (
          <group position={[0, counterH + bsHeight / 2, lDepth / 2 + 0.02]} rotation={[0, Math.PI / 2, 0]}>
            <mesh receiveShadow>
              <planeGeometry args={[lDepth, bsHeight]} />
              <meshPhysicalMaterial map={tex} color={tex ? undefined : "#e8e0d0"} {...TILE_WALL_PBR} />
            </mesh>
            {stripOverlay(lDepth, bsHeight, 0.001)}
            {wallGroutBase && (
              <mesh position={[0, 0, 0.002]}>
                <planeGeometry args={[lDepth, bsHeight]} />
                <meshBasicMaterial map={getGroutOverlay(lDepth, roomH - counterH, false) || undefined} transparent depthWrite={false} side={THREE.FrontSide} />
              </mesh>
            )}
          </group>
        )}
      </group>
    );
  };

  // Helper for drawing cabinet doors and drawers on a flat surface
  const ProceduralCabinetFronts = ({ width, height, isDrawer = false }: { width: number; height: number; isDrawer?: boolean }) => {
    // Determine how many cabinet sections to divide this width into
    const sectionWidth = 2.0; // target width for one cabinet
    const sections = Math.max(1, Math.round(width / sectionWidth));
    const actualW = width / sections;

    const gap = 0.05;
    const doorW = actualW - gap;
    const panelH = height - gap * 2;

    const bodyMat = woodMat("wood-oak", [1, 1], 0.65);
    const handleMat = new THREE.MeshStandardMaterial({ color: "#aaaaaa", metalness: 0.8, roughness: 0.2 });

    const fronts = [];
    for (let i = 0; i < sections; i++) {
      const cx = -width / 2 + actualW * i + actualW / 2;
      
      if (isDrawer) {
        // 3 drawers
        const h1 = panelH * 0.2;
        const h2 = panelH * 0.4;
        const h3 = panelH * 0.4;
        
        fronts.push(
          <group key={i} position={[cx, 0, 0]}>
            {/* Top Drawer */}
            <mesh position={[0, height/2 - gap - h1/2, 0]} material={bodyMat} castShadow receiveShadow>
              <boxGeometry args={[doorW, h1 - gap, 0.04]} />
            </mesh>
            <mesh position={[0, height/2 - gap - h1/2, 0.03]} material={handleMat} castShadow>
              <boxGeometry args={[doorW * 0.4, 0.04, 0.02]} />
            </mesh>
            
            {/* Middle Drawer */}
            <mesh position={[0, height/2 - gap - h1 - h2/2, 0]} material={bodyMat} castShadow receiveShadow>
              <boxGeometry args={[doorW, h2 - gap, 0.04]} />
            </mesh>
            <mesh position={[0, height/2 - gap - h1 - h2/2, 0.03]} material={handleMat} castShadow>
              <boxGeometry args={[doorW * 0.4, 0.04, 0.02]} />
            </mesh>
            
            {/* Bottom Drawer */}
            <mesh position={[0, -height/2 + gap + h3/2, 0]} material={bodyMat} castShadow receiveShadow>
              <boxGeometry args={[doorW, h3 - gap, 0.04]} />
            </mesh>
            <mesh position={[0, -height/2 + gap + h3/2, 0.03]} material={handleMat} castShadow>
              <boxGeometry args={[doorW * 0.4, 0.04, 0.02]} />
            </mesh>
          </group>
        );
      } else {
        // Normal split door
        fronts.push(
          <group key={i} position={[cx, 0, 0]}>
            <mesh position={[-doorW/4 - gap/4, 0, 0]} material={bodyMat} castShadow receiveShadow>
              <boxGeometry args={[doorW/2 - gap/2, panelH, 0.04]} />
            </mesh>
            <mesh position={[-0.05, 0.8, 0.03]} material={handleMat} castShadow>
              <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
            </mesh>

            <mesh position={[doorW/4 + gap/4, 0, 0]} material={bodyMat} castShadow receiveShadow>
              <boxGeometry args={[doorW/2 - gap/2, panelH, 0.04]} />
            </mesh>
            <mesh position={[0.05, 0.8, 0.03]} material={handleMat} castShadow>
              <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
            </mesh>
          </group>
        );
      }
    }
    return <group>{fronts}</group>;
  };

  // Lower cabinets (L-shape)
  const cabinZ = 2.0;
  const counterZ = counterDepth;
  const LowerCabinets = () => {
    const x_sink = roomW * 0.75;
    const sinkW = 3.83;
    const sinkD = 1.64;
    const x1 = x_sink - sinkW / 2;
    const x2 = x_sink + sinkW / 2;
    const d_front = Math.max(0.01, cabinZ - sinkD);
    const z_front = cabinZ - d_front / 2;

    return (
      <group>
        {/* Back wall run (split around the sink hole) */}
        {x1 > cabinZ && (
          <group position={[(cabinZ + x1) / 2, counterH / 2, cabinZ / 2]}>
            <mesh material={woodMat("wood-oak", [2, 1], 0.55)} castShadow receiveShadow>
              <boxGeometry args={[x1 - cabinZ, counterH, cabinZ]} />
            </mesh>
            <group position={[0, 0, cabinZ/2 + 0.01]}>
               <ProceduralCabinetFronts width={x1 - cabinZ} height={counterH} isDrawer={true} />
            </group>
          </group>
        )}
        {x2 < roomW && (
          <group position={[(x2 + roomW) / 2, counterH / 2, cabinZ / 2]}>
            <mesh material={woodMat("wood-oak", [2, 1], 0.55)} castShadow receiveShadow>
              <boxGeometry args={[roomW - x2, counterH, cabinZ]} />
            </mesh>
            <group position={[0, 0, cabinZ/2 + 0.01]}>
               <ProceduralCabinetFronts width={roomW - x2} height={counterH} isDrawer={false} />
            </group>
          </group>
        )}
        {/* Front cabinet panel under the sink */}
        <group position={[x_sink, counterH / 2, z_front]}>
          <mesh material={woodMat("wood-oak", [2, 1], 0.55)} castShadow receiveShadow>
            <boxGeometry args={[sinkW, counterH, d_front]} />
          </mesh>
          <group position={[0, 0, d_front/2 + 0.01]}>
             <ProceduralCabinetFronts width={sinkW} height={counterH} isDrawer={false} />
          </group>
        </group>

        {/* Left wall run */}
        <group position={[cabinZ / 2, counterH / 2, (lDepth + cabinZ) / 2]}>
          <mesh material={woodMat("wood-oak", [2, 1], 0.55)} castShadow receiveShadow>
            <boxGeometry args={[cabinZ, counterH, lDepth - cabinZ]} />
          </mesh>
          <group position={[cabinZ/2 + 0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
             <ProceduralCabinetFronts width={lDepth - cabinZ} height={counterH} isDrawer={true} />
          </group>
        </group>
      </group>
    );
  };

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
        <mesh position={[roomW / 2, 0, roomL / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[roomW, roomL]} />
          <meshPhysicalMaterial color="#c8b8a8" {...TILE_FLOOR_PBR} />
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
      <group position={[roomW / 2, 0, roomL / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh receiveShadow>
          <planeGeometry args={[roomW, roomL]} />
          <meshPhysicalMaterial map={ft} color="#ffffff" {...TILE_FLOOR_PBR} />
        </mesh>
        {floorGroutBase && (
          <mesh position={[0, 0, 0.002]}>
            <planeGeometry args={[roomW, roomL]} />
            <meshBasicMaterial map={getGroutOverlay(roomW, roomL, true) || undefined} transparent depthWrite={false} side={THREE.FrontSide} />
          </mesh>
        )}
      </group>
    );
  };

  const Countertop = () => {
    let leftTex: THREE.Texture | null;
    if (slabMode) {
      leftTex = slabCT?.leftTex ?? null;
    } else {
      leftTex = countertopTex ? countertopTex.clone() : null;
      if (leftTex) {
        leftTex.wrapS = leftTex.wrapT = THREE.RepeatWrapping;
        leftTex.repeat.set(counterZ / counterTileFeet, lDepth / counterTileFeet);
        leftTex.needsUpdate = true;
      }
    }

    const x_sink = roomW * 0.85;
    const sinkW = 2.83;
    const sinkD = 1.64;
    const x1 = x_sink - sinkW / 2;
    const x2 = x_sink + sinkW / 2;
    const z1 = Math.max(0.01, counterZ / 2 - sinkD / 2);
    const z2 = Math.min(counterZ - 0.01, counterZ / 2 + sinkD / 2);

    const getPieceTex = (w: number, d: number, xStart: number, zStart: number) => {
      if (!countertopTex) return null;
      const t = countertopTex.clone();
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(w / counterTileFeet, d / counterTileFeet);
      t.offset.set(xStart / counterTileFeet, zStart / counterTileFeet);
      t.needsUpdate = true;
      return t;
    };

    return (
      <group>
        {/* Back countertop (split around the sink hole) */}
        {x1 > counterZ && (
          <mesh position={[(counterZ + x1) / 2, counterH + 0.02, counterZ / 2]}>
            <boxGeometry args={[x1 - counterZ, 0.06, counterZ]} />
            <meshPhysicalMaterial map={getPieceTex(x1 - counterZ, counterZ, counterZ, 0) ?? undefined} color={countertopTex ? "#ffffff" : countertopColor} {...COUNTERTOP_PBR} />
          </mesh>
        )}
        {x2 < roomW && (
          <mesh position={[(x2 + roomW) / 2, counterH + 0.02, counterZ / 2]}>
            <boxGeometry args={[roomW - x2, 0.06, counterZ]} />
            <meshPhysicalMaterial map={getPieceTex(roomW - x2, counterZ, x2, 0) ?? undefined} color={countertopTex ? "#ffffff" : countertopColor} {...COUNTERTOP_PBR} />
          </mesh>
        )}
        {z1 > 0.02 && (
          <mesh position={[x_sink, counterH + 0.02, z1 / 2]}>
            <boxGeometry args={[sinkW, 0.06, z1]} />
            <meshPhysicalMaterial map={getPieceTex(sinkW, z1, x1, 0) ?? undefined} color={countertopTex ? "#ffffff" : countertopColor} {...COUNTERTOP_PBR} />
          </mesh>
        )}
        {counterZ > z2 + 0.02 && (
          <mesh position={[x_sink, counterH + 0.02, z2 + (counterZ - z2) / 2]}>
            <boxGeometry args={[sinkW, 0.06, counterZ - z2]} />
            <meshPhysicalMaterial map={getPieceTex(sinkW, counterZ - z2, x1, z2) ?? undefined} color={countertopTex ? "#ffffff" : countertopColor} {...COUNTERTOP_PBR} />
          </mesh>
        )}

        {/* Left countertop */}
        <mesh position={[counterZ / 2, counterH + 0.02, lDepth / 2]} receiveShadow>
          <boxGeometry args={[counterZ, 0.06, lDepth]} />
          <meshPhysicalMaterial map={leftTex ?? undefined} color={countertopTex ? "#ffffff" : countertopColor} {...COUNTERTOP_PBR} />
        </mesh>
      </group>
    );
  };











  return (
    <group>
      <BackWall />
      <LeftWallTile />
      {/* Right wall */}
      <mesh position={[roomW, roomH / 2, roomL / 2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[roomL, roomH]} />
        <meshPhysicalMaterial color="#e8e0d0" {...INTERIOR_PAINT_PBR} />
      </mesh>
      {/* Left wall plain part (non-kitchen area) */}
      <mesh position={[0, roomH / 2, lDepth + (roomL - lDepth) / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[roomL - lDepth, roomH]} />
        <meshPhysicalMaterial color="#e8e0d0" {...INTERIOR_PAINT_PBR} />
      </mesh>
      {/* Floor */}
      <FloorTile />
      {/* Ceiling */}
      <mesh position={[roomW / 2, roomH, roomL / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomW, roomL]} />
        <meshPhysicalMaterial color="#f5f0e8" roughness={0.55} envMapIntensity={0.35} />
      </mesh>
      {/* Glass front wall removed to prevent foggy camera reflections and allow clear zoom-in view */}
      {/* <GlassWall width={roomW} height={roomH} position={[roomW / 2, roomH / 2, roomL]} rotation={[0, Math.PI, 0]} /> */}
      {showInterior && <LowerCabinets />}
      {showInterior && <Countertop />}
      <SceneLighting roomW={roomW} roomL={roomL} sceneKind="kitchen" />
      {showInterior && <KitchenFurnishings roomW={roomW} roomL={roomL} roomH={roomH} counterDepth={counterDepth} />}
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
  const floorImg = useVolatileStore(s => s.globalTileImage);
  const setFloorImg = useVolatileStore(s => s.setGlobalTileImage);
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
  

  // ── Enhancement state ───────────────────────────────────────────────────
  const [cameraPreset, setCameraPreset] = useState<CameraPreset | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showInterior, setShowInterior] = useState(true);
  const interactionTimer = useRef<any>(undefined);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);

  const toggleShowroomView = async () => {
    try {
      if (!isTheaterMode) {
        if (visualizerRef.current) {
          await visualizerRef.current.requestFullscreen();
        }
        setIsTheaterMode(true);
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        setIsTheaterMode(false);
      }
    } catch (err) {
      console.error("Fullscreen err:", err);
      setIsTheaterMode(!isTheaterMode);
    }
  };

  const hotspots: HotspotDef[] = useMemo(() => [
    { id: 'floor', position: [roomWidth / 2, 0.02, roomLength / 2], label: 'Floor' },
    { id: 'backsplash', position: [roomWidth / 2, 4.5, 0.05], label: 'Backsplash' },
    { id: 'countertop', position: [roomWidth * 0.55, 3.1, counterDepth * 0.4], label: 'Countertop' },
    { id: 'cabinets', position: [counterDepth * 0.5, 2, roomLength * 0.5], label: 'Cabinets' },
  ], [roomWidth, roomLength, counterDepth]);

  useEffect(() => {
    if (!autoRotate) return;
    const handleInteraction = () => {
      setAutoRotate(false);
      clearTimeout(interactionTimer.current);
      interactionTimer.current = setTimeout(() => setAutoRotate(true), 4000);
    };
    const el = canvasRef.current;
    el?.addEventListener('pointerdown', handleInteraction);
    return () => {
      el?.removeEventListener('pointerdown', handleInteraction);
      clearTimeout(interactionTimer.current);
    };
  }, [autoRotate]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setIsTheaterMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [setIsTheaterMode]);

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
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.anisotropy = 16;
        t.generateMipmaps = true;
        setBacksplashTex(t);
      });
    }
  }, [backsplashImg]);

  useEffect(() => {
    if (!countertopImg) { setCountertopTex(null); }
    else {
      new THREE.TextureLoader().load(countertopImg, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.anisotropy = 16;
        t.generateMipmaps = true;
        setCountertopTex(t);
      });
    }
  }, [countertopImg]);

  useEffect(() => {
    if (!highlighterImg) { setHighlighterTex(null); }
    else {
      new THREE.TextureLoader().load(highlighterImg, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.anisotropy = 16;
        t.generateMipmaps = true;
        setHighlighterTex(t);
      });
    }
  }, [highlighterImg]);

  useEffect(() => {
    if (!floorImg) { setFloorTex(null); }
    else {
      new THREE.TextureLoader().load(floorImg, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.anisotropy = 16;
        t.generateMipmaps = true;
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
            <span className="bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5">
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
                <div className="flex justify-between text-xs"><span className="text-neutral-500">Width</span><span className="text-blue-400">{roomWidth} ft</span></div>
                <input type="range" min="6" max="24" step="0.5" value={roomWidth} onChange={e => setRoomWidth(+e.target.value)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-1" />
              </div>
              <div>
                <div className="flex justify-between text-xs"><span className="text-neutral-500">Length</span><span className="text-blue-400">{roomLength} ft</span></div>
                <input type="range" min="8" max="30" step="0.5" value={roomLength} onChange={e => setRoomLength(+e.target.value)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-1" />
              </div>
              <div>
                <div className="flex justify-between text-xs"><span className="text-neutral-500">Height</span><span className="text-blue-400">{roomHeight} ft</span></div>
                <input type="range" min="7" max="14" step="0.5" value={roomHeight} onChange={e => setRoomHeight(+e.target.value)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-1" />
              </div>
              <div>
                <div className="flex justify-between text-xs"><span className="text-neutral-500">Counter Depth</span><span className="text-blue-400">{counterDepth} ft</span></div>
                <input type="range" min="1.5" max="4" step="0.1" value={counterDepth} onChange={e => setCounterDepth(+e.target.value)} className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-1" />
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
                <label className="flex items-center gap-2 bg-neutral-900 border border-dashed border-neutral-700 rounded-lg px-3 py-3 cursor-pointer hover:border-blue-500/50 transition-colors">
                  <Upload className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs text-neutral-500">Upload floor tile</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setFloorImg(url);
                    }
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
              <Paintbrush className="w-4 h-4 text-blue-400" />
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
                <label className="flex items-center gap-2 bg-neutral-900 border border-dashed border-neutral-700 rounded-lg px-3 py-3 cursor-pointer hover:border-blue-500/50 transition-colors">
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
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm text-neutral-200 outline-none focus:border-blue-500"
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
                <label className="flex items-center gap-2 bg-neutral-900 border border-dashed border-neutral-700 rounded-lg px-3 py-3 cursor-pointer hover:border-blue-500/50 transition-colors">
                  <Upload className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs text-neutral-500">Upload tile image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>

              </div>
            )}
            
            <div className="flex items-center gap-2 mt-4 mb-2">
              <LayoutGrid className="w-4 h-4 text-blue-400" />
              <h4 className="font-semibold text-white text-xs">Tile Size</h4>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {["12x18", "2x1", "2x4"].map((size) => (
                <button
                  key={size}
                  onClick={() => setTileSize(size)}
                  className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${tileSize === size ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"}`}
                >
                  {size === "12x18" ? "12x18\"" : size === "2x1" ? "2x1'" : "2x4'"}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg border border-neutral-800">
              <span className="text-xs text-neutral-400 flex items-center gap-1"><Rotate3d className="w-3 h-3"/> Rotate Tile</span>
              <button 
                onClick={() => setTileRotation(tileRotation === 0 ? 90 : 0)} 
                className={`px-3 py-1 border rounded text-xs font-bold transition-colors ${tileRotation === 90 ? "bg-blue-500/10 border-blue-500 text-blue-400" : "bg-neutral-800 border-neutral-700 text-neutral-400"}`}
              >
                {tileRotation}°
              </button>
            </div>

            <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg border border-neutral-800 mt-2">
              <span className="text-xs text-neutral-400">Display Mode</span>
              <button 
                onClick={() => setSlabMode(!slabMode)} 
                className={`px-3 py-1 border rounded text-xs font-bold transition-colors ${slabMode ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-neutral-700 bg-neutral-800 text-neutral-400"}`}
              >
                {slabMode ? "Slab" : "Tiled"}
              </button>
            </div>

            {/* Border Strip */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2"><Paintbrush className="w-4 h-4 text-blue-400" />Border Strip</h3>
                <button
                  onClick={() => setStripEnabled(!stripEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${stripEnabled ? "bg-blue-500" : "bg-neutral-700"}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${stripEnabled ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </div>
              {stripEnabled && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {["golden", "silver", "black"].map((c) => (
                      <button key={c} onClick={() => setStripColor(c)}
                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all capitalize ${stripColor === c ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-neutral-800 bg-neutral-900 hover:border-neutral-600 text-neutral-400"}`}>
                        {c}
                      </button>
                    ))}
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
        </div>

        <div className={`transition-all duration-500 ${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-9'}`}>
          <div ref={visualizerRef} className="glass-card rounded-[2rem] border border-white/5 p-4 shadow-2xl overflow-hidden flex flex-col" style={{ height: isTheaterMode ? '750px' : '600px' }}>
            {/* Viewport Header Controls */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  3D Viewport {isTheaterMode && <span className="text-blue-400 font-bold ml-1.5">(Showroom Mode)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* View Preset Buttons */}
                <div className="hidden md:flex items-center gap-1 bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                  {(['front', 'corner', 'top', 'entrance', '360', 'reset'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCameraPreset(p)}
                      className={`px-2 py-1 text-[9px] font-bold rounded-md transition capitalize ${
                        cameraPreset === p
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Auto-rotate Toggle */}
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition ${
                    autoRotate
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-neutral-600 text-neutral-400 border-neutral-900 hover:text-white'
                  }`}
                  title={autoRotate ? 'Auto-rotate On' : 'Auto-rotate Off'}
                >
                  <Rotate3d className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
                  <span>360°</span>
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg border border-neutral-900 bg-neutral-600 text-neutral-400 hover:text-white hover:border-neutral-850 transition"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                </button>

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
                  onClick={toggleShowroomView}
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
            <div ref={canvasRef} className="w-full h-full">
            <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 1.25]} performance={{ min: 0.5 }} camera={{ position: [roomWidth * 0.8, roomHeight * 0.5, roomLength * 0.8], fov: 45, near: 0.1, far: 100 }} gl={{ antialias: true, powerPreference: "high-performance" }} style={{ width: "100%", height: "100%", touchAction: "none" }} onCreated={() => setTimeout(() => setIsLoading(false), 600)}>
              <SceneLighting sceneKind="kitchen" roomW={roomWidth} roomL={roomLength} sunPosition={[roomWidth + 6, 12, roomLength + 2]} />
              <ClickToFocus>
                <Kitchen3D roomW={roomWidth} roomL={roomLength} roomH={roomHeight} backsplashTex={backsplashTex} tileSize={tileSize} countertopColor={countertopColor} countertopTex={countertopTex} tileRotation={tileRotation} counterDepth={counterDepth} slabMode={slabMode} highlighterTex={highlighterTex} highlighterRows={highlighterRows} floorTex={floorTex} floorTileSize={floorTileSize} stripColor={stripEnabled ? stripColor : null} stripWidthMm={stripWidthMm} stripInterval={stripInterval} showInterior={showInterior} />
                {showInterior && <KitchenFurnishings roomW={roomWidth} roomL={roomLength} roomH={roomHeight} counterDepth={counterDepth} />}
              </ClickToFocus>
              <OrbitControls makeDefault enableDamping dampingFactor={0.1} minDistance={0.5} maxDistance={40} autoRotate={autoRotate} autoRotateSpeed={0.8} target={[roomWidth / 2, roomHeight / 2, roomLength / 2]} />
              <BakeShadows />
              <AdaptiveDpr pixelated />
              <CameraController preset={cameraPreset} onPresetComplete={() => setCameraPreset(null)} roomWidth={roomWidth} roomLength={roomLength} roomHeight={roomHeight} />
              <HotspotSystem hotspots={hotspots} />
            </Canvas>
            </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
