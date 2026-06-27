"use client";

import {
  woodMat,
  marbleMat,
  chromeMat,
  glassMat,
  paintMat,
  emissiveMat,
  fabricMat,
  mirrorMat,
  flutedGlassMat,
} from "./materials";
import React from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import PremiumModel from "./PremiumModel";

type Props = { 
  roomW: number; 
  roomL: number; 
  roomH: number;
  showerWidth?: number;
  showerDepth?: number;
  showerHeight?: number;
  toiletScale?: number;
  toiletXOffset?: number;
  toiletZOffset?: number;
  toiletRotY?: number;
};

function ProceduralVanity() {
  const cabinet = woodMat("wood-oak", [1.5, 1]);
  const top = marbleMat("marble-white", [1.2, 1.2]);
  const basin = marbleMat("marble-cream", [0.8, 0.8]);
  const mirrorFrame = chromeMat();
  const mirrorGlass = mirrorMat();
  const led = emissiveMat("#e8f4ff", 3);
  const handle = chromeMat();
  return (
    <group>
      <mesh position={[0, 0.42, 0.2]} material={cabinet} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.84, 0.5]} />
      </mesh>
      {[-0.35, 0.35].map((ox, i) => (
        <mesh key={i} position={[ox, 0.42, 0.45]} material={handle} castShadow>
          <boxGeometry args={[0.12, 0.02, 0.02]} />
        </mesh>
      ))}
      <mesh position={[0, 0.88, 0.22]} material={top} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.06, 0.55]} />
      </mesh>
      <mesh position={[0, 0.92, 0.25]} material={basin} castShadow>
        <boxGeometry args={[0.55, 0.12, 0.4]} />
      </mesh>
      <mesh position={[0, 1.05, 0.15]} material={chromeMat()} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.18, 8]} />
      </mesh>
      <mesh position={[0, 1.12, 0.08]} material={chromeMat()} castShadow rotation={[Math.PI / 3, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
      </mesh>
      <mesh position={[-0.55, 1.0, 0.28]} material={chromeMat()} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.08, 8]} />
      </mesh>

    </group>
  );
}

function Vanity({ x, z, rotY }: { x: number; z: number; rotY: number }) {
  return (
    <PremiumModel 
      url="/models/bathroom/vanity.glb" 
      position={[x, 0, z]} 
      rotation={[0, rotY, 0]}
      fallback={<ProceduralVanity />}
    />
  );
}

function ProceduralShowerEnclosure() {
  const frame = chromeMat();
  const glass = flutedGlassMat(0.45);
  const drain = chromeMat();
  const w = 1.6;
  const d = 1.6;
  const h = 7;
  return (
    <group>
      <mesh position={[w / 2, 0.06, d / 2]} material={marbleMat("marble-cream")} castShadow receiveShadow>
        <boxGeometry args={[w, 0.12, d]} />
      </mesh>
      <mesh position={[w / 2, 0.02, d / 2]} material={drain}>
        <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0.02]} material={glass} castShadow>
        <boxGeometry args={[w, h, 0.02]} />
      </mesh>
      <mesh position={[0.02, h / 2, d / 2]} material={glass} castShadow rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[d, h, 0.02]} />
      </mesh>
      <mesh position={[w - 0.02, h / 2, d / 2]} material={glass} castShadow rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[d, h, 0.02]} />
      </mesh>
      <mesh position={[w / 2, h - 0.02, d / 2]} material={frame} castShadow>
        <boxGeometry args={[w, 0.04, d]} />
      </mesh>
      <mesh position={[w / 2, 0.04, d / 2]} material={frame} castShadow>
        <boxGeometry args={[w, 0.02, d]} />
      </mesh>
      <mesh position={[w / 2, h - 0.3, 0.15]} material={frame} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.03, 16]} />
      </mesh>
      <mesh position={[w / 2, h - 0.5, 0.15]} material={frame}>
        <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
      </mesh>
      <mesh position={[0.2, 0.5, 0.12]} material={chromeMat()} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.25, 8]} />
      </mesh>
    </group>
  );
}

function ShowerEnclosure({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <PremiumModel 
      url="/models/bathroom/shower.glb" 
      position={[x, 0, z]} 
      scale={scale}
      fallback={<ProceduralShowerEnclosure />}
    />
  );
}

function ProceduralBathtub() {
  const tub = marbleMat("marble-white", [2, 2]);
  const rim = marbleMat("marble-cream", [1.5, 1.5]);
  const faucet = chromeMat();
  return (
    <group>
      <mesh position={[0, 0.35, 0]} material={tub} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.5, 0.9]} />
      </mesh>
      <mesh position={[0, 0.62, 0]} material={rim} castShadow>
        <boxGeometry args={[2.3, 0.06, 1]} />
      </mesh>
      <mesh position={[0, 0.55, 0.02]} material={tub}>
        <boxGeometry args={[1.9, 0.2, 0.7]} />
      </mesh>
      <mesh position={[-0.9, 0.75, -0.35]} material={faucet} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.25, 8]} />
      </mesh>
      <mesh position={[-0.9, 0.88, -0.2]} material={faucet} castShadow rotation={[Math.PI / 4, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
      </mesh>
      <mesh position={[0.6, 0.58, 0.15]} material={fabricMat("fabric-cream", [1, 1])} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.35]} />
      </mesh>
    </group>
  );
}

function Bathtub({ x, z, rotY }: { x: number; z: number; rotY: number }) {
  return (
    <PremiumModel 
      url="/models/bathroom/bathtub.glb" 
      position={[x, 0, z]} 
      rotation={[0, rotY, 0]}
      fallback={<ProceduralBathtub />}
    />
  );
}

function ProceduralToilet() {
  const ceramic = paintMat("#f5f5f5", 0.05); // High gloss
  const seat = paintMat("#e8e8e8", 0.15);
  return (
    <group>
      <mesh position={[0, 0.2, 0]} material={ceramic} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.4, 0.65]} />
      </mesh>
      <mesh position={[0, 0.42, -0.1]} material={ceramic} castShadow>
        <boxGeometry args={[0.42, 0.35, 0.2]} />
      </mesh>
      <mesh position={[0, 0.48, 0.05]} material={seat} castShadow>
        <boxGeometry args={[0.38, 0.05, 0.45]} />
      </mesh>
      <mesh position={[0, 0.55, -0.25]} material={ceramic} castShadow>
        <boxGeometry args={[0.4, 0.15, 0.08]} />
      </mesh>
      <mesh position={[0.28, 0.65, -0.2]} material={chromeMat()} castShadow>
        <boxGeometry args={[0.08, 0.04, 0.12]} />
      </mesh>
      <mesh position={[0.32, 0.35, 0.35]} material={paintMat("#f0f0f0", 0.3)} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.12, 8]} />
      </mesh>
    </group>
  );
}

function Toilet({ x, z, rotY, modelScale = 1 }: { x: number; z: number; rotY: number; modelScale?: number }) {
  return (
    <PremiumModel 
      url="/models/bathroom/toilet.glb" 
      position={[x, 0, z]} 
      rotation={[0, rotY, 0]}
      modelScale={modelScale}
      fallback={<ProceduralToilet />}
    />
  );
}

function ProceduralToiletPaperHolder() {
  return (
    <group>
      {/* Mount plate on wall */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[0.15, 0.12, 0.02]} />
        <meshStandardMaterial color="#222222" roughness={0.4} />
      </mesh>
      {/* Metal bar */}
      <mesh position={[0, -0.04, 0.06]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.16, 8]} />
        <meshStandardMaterial color="#888888" roughness={0.1} metalness={0.9} />
      </mesh>
      {/* Paper roll */}
      <mesh position={[0, -0.04, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.12, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </mesh>
    </group>
  );
}

function ToiletPaperHolder({ x, y, z, rotY, scale = 1 }: { x: number; y: number; z: number; rotY: number; scale?: number }) {
  return (
    <PremiumModel 
      url="/models/bathroom/retro_lowpoly_toilet_paper.glb" 
      position={[x, y, z]} 
      rotation={[0, rotY, 0]}
      scale={scale}
      fallback={<ProceduralToiletPaperHolder />}
    />
  );
}

function ProceduralTowelStand() {
  const metal = chromeMat();
  const towel = fabricMat("fabric-cream", [1, 2]);
  return (
    <group>
      <mesh position={[0, 0.55, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.1, 8]} />
      </mesh>
      <mesh position={[-0.2, 1.05, 0]} material={metal} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
      </mesh>
      <mesh position={[0, 0.75, 0.08]} material={towel} castShadow>
        <boxGeometry args={[0.35, 0.6, 0.06]} />
      </mesh>
      <mesh position={[0, 0.45, -0.08]} material={towel} castShadow>
        <boxGeometry args={[0.32, 0.5, 0.05]} />
      </mesh>
    </group>
  );
}

function TowelStand({ x, z, rotY }: { x: number; z: number; rotY: number }) {
  return (
    <PremiumModel 
      url="/models/bathroom/towelstand.glb" 
      position={[x, 0, z]} 
      rotation={[0, rotY, 0]}
      fallback={<ProceduralTowelStand />}
    />
  );
}

function BathMat({ roomW, roomL }: { roomW: number; roomL: number }) {
  return (
    <PremiumModel 
      url="/models/bathroom/bathmat.glb" 
      position={[roomW * 0.55, 0.007, roomL - 0.7]} 
      rotation={[-Math.PI / 2, 0, 0]}
      fallback={
        <mesh receiveShadow>
          <planeGeometry args={[1.2, 0.7]} />
          <meshStandardMaterial color="#6a5a4a" roughness={0.95} metalness={0} envMapIntensity={0.15} />
        </mesh>
      }
    />
  );
}

function CeilingSpots({ roomW, roomL, roomH }: Props) {
  const housing = paintMat("#e8e4dc", 0.35);
  const bulb = emissiveMat("#fff8ee", 1.5);
  const spots: [number, number][] = [
    [roomW * 0.3, roomL * 0.35],
    [roomW * 0.7, roomL * 0.35],
    [roomW * 0.5, roomL * 0.7],
  ];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, roomH - 0.1, z]}>
          <mesh material={housing} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 0.06, 12]} />
          </mesh>
          <mesh position={[0, -0.05, 0]} material={bulb}>
            <cylinderGeometry args={[0.06, 0.06, 0.02, 12]} />
          </mesh>
          <spotLight
            position={[0, -0.1, 0]}
            angle={0.5}
            penumbra={0.6}
            intensity={0.35}
            color="#fff5e8"
            distance={12}
            decay={2}
            castShadow
            shadow-mapSize={[512, 512]}
            shadow-bias={-0.0001}
          />
        </group>
      ))}
    </group>
  );
}

function WetFloorSheen({ roomW, roomL }: { roomW: number; roomL: number }) {
  return (
    <>
      <mesh position={[roomW / 2, 0.004, roomL / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roomW * 0.4, roomL * 0.4]} />
        <meshPhysicalMaterial
          color="#e8eef5"
          transparent
          opacity={0.14}
          roughness={0.04}
          metalness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={2.0}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

function LuxuryShowerEnclosure({ 
  roomH,
  showerWidth = 4.2,
  showerDepth = 4.2,
  showerHeight = 9.0
}: { 
  roomH: number;
  showerWidth?: number;
  showerDepth?: number;
  showerHeight?: number;
}) {
  const glass = flutedGlassMat(0.45);
  const matteBlack = paintMat("#111111", 0.6);
  const stainless = chromeMat();
  const benchMat = marbleMat("marble-cream");
  const ledWarm = emissiveMat("#ffddaa", 2.0);

  const w = showerWidth;
  const d = showerDepth;
  const sh = Math.min(showerHeight, roomH);

  return (
    <group>
      {/* Frameless Glass Partitions */}
      {/* Side Glass */}
      <mesh position={[w, sh / 2, d / 2]} material={glass} castShadow>
        <boxGeometry args={[0.04, sh, d]} />
      </mesh>
      {/* Front Glass (Full width) */}
      <mesh position={[w / 2, sh / 2, d]} material={glass} castShadow>
        <boxGeometry args={[w, sh, 0.04]} />
      </mesh>

      {/* Door Handle on Front Glass */}
      <group position={[w * 0.2, sh / 2, d]}>
        {/* Outer Handle */}
        <mesh position={[0, 0, 0.04]} material={stainless}>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
        </mesh>
        <mesh position={[0, 0.2, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={stainless}>
          <cylinderGeometry args={[0.01, 0.01, 0.04, 8]} />
        </mesh>
        <mesh position={[0, -0.2, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={stainless}>
          <cylinderGeometry args={[0.01, 0.01, 0.04, 8]} />
        </mesh>
        {/* Inner Handle */}
        <mesh position={[0, 0, -0.04]} material={stainless}>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
        </mesh>
        <mesh position={[0, 0.2, -0.02]} rotation={[Math.PI / 2, 0, 0]} material={stainless}>
          <cylinderGeometry args={[0.01, 0.01, 0.04, 8]} />
        </mesh>
        <mesh position={[0, -0.2, -0.02]} rotation={[Math.PI / 2, 0, 0]} material={stainless}>
          <cylinderGeometry args={[0.01, 0.01, 0.04, 8]} />
        </mesh>
      </group>

      {/* Matte Black Hardware (Channels) */}
      <mesh position={[w, sh / 2, 0.02]} material={matteBlack}>
        <boxGeometry args={[0.06, sh, 0.06]} />
      </mesh>
      <mesh position={[w, 0.02, d / 2]} material={matteBlack}>
        <boxGeometry args={[0.06, 0.04, d]} />
      </mesh>
      {/* Front Glass Hardware (Full width) */}
      <mesh position={[w / 2, 0.02, d]} material={matteBlack}>
        <boxGeometry args={[w, 0.04, 0.06]} />
      </mesh>
      {/* Top stabilizing bar for Side */}
      <mesh position={[w, sh - 0.05, d / 2]} material={matteBlack}>
        <boxGeometry args={[0.04, 0.04, d]} />
      </mesh>
      {/* Top stabilizing bar for Front (Full width) */}
      <mesh position={[w / 2, sh - 0.05, d]} material={matteBlack}>
        <boxGeometry args={[w, 0.04, 0.04]} />
      </mesh>

      {/* Floating Marble Bench */}
      <mesh position={[w / 2, 1.5, 0.4]} material={benchMat} castShadow receiveShadow>
        <boxGeometry args={[w - 0.1, 0.15, 0.8]} />
      </mesh>

      {/* Built-in Wall Niche */}
      <group position={[0.2, 4.0, d / 2]}>
        {/* Niche cut-out illusion */}
        <mesh position={[0.05, 0, 0]} material={paintMat("#1a1a1a", 0.8)}>
          <boxGeometry args={[0.1, 1.2, 0.8]} />
        </mesh>
        {/* Niche Shelves */}
        <mesh position={[0.1, 0, 0]} material={benchMat}>
          <boxGeometry args={[0.12, 0.04, 0.8]} />
        </mesh>
        {/* Warm LED Strip in Niche */}
        <mesh position={[0.1, 0.58, 0]} material={ledWarm}>
          <boxGeometry args={[0.05, 0.02, 0.7]} />
        </mesh>
        <pointLight position={[0.2, 0.5, 0]} intensity={0.5} color="#ffddaa" distance={3} />
        
        {/* Shampoo Bottles */}
        <mesh position={[0.1, 0.15, -0.1]} material={paintMat("#333", 0.3)} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.3, 16]} />
        </mesh>
        <mesh position={[0.1, 0.12, 0.15]} material={paintMat("#eee", 0.3)} castShadow>
          <boxGeometry args={[0.15, 0.24, 0.1]} />
        </mesh>
      </group>

      {/* Rainfall Shower Head */}
      <group position={[w / 2, roomH - 0.1, d / 2]}>
        <mesh position={[0, -0.1, 0]} material={matteBlack} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
        </mesh>
        <mesh position={[0, -0.2, 0]} material={matteBlack} castShadow>
          <boxGeometry args={[1.0, 0.04, 1.0]} />
        </mesh>
      </group>

      {/* Thermostatic Mixer & Handheld */}
      <group position={[0.1, 3.5, d * 0.75]}>
        {/* Mixer plate */}
        <mesh position={[0.02, 0, 0]} material={matteBlack}>
          <boxGeometry args={[0.04, 0.4, 0.3]} />
        </mesh>
        {/* Knobs */}
        <mesh position={[0.06, 0.1, 0]} material={matteBlack} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
        </mesh>
        <mesh position={[0.06, -0.1, 0]} material={matteBlack} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.08, 16]} />
        </mesh>
        {/* Handheld Wand */}
        <mesh position={[0.06, 0.4, 0.3]} material={matteBlack} rotation={[Math.PI / 6, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.02, 0.4, 16]} />
        </mesh>
        {/* Hose (simplified) */}
        <mesh position={[0.06, 0.1, 0.15]} material={matteBlack} rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.6, 8]} />
        </mesh>
      </group>

      {/* Linear Floor Drain */}
      <mesh position={[w / 2, 0.01, d - 0.2]} material={stainless}>
        <boxGeometry args={[w - 0.4, 0.02, 0.1]} />
      </mesh>
      <mesh position={[w / 2, 0.012, d - 0.2]} material={paintMat("#111", 0.9)}>
        <boxGeometry args={[w - 0.42, 0.02, 0.08]} />
      </mesh>


    </group>
  );
}

function BathroomUnit({ x, y = 0, z, rotY, scale = 1, modelScale }: { x: number; y?: number; z: number; rotY: number; scale?: number; modelScale?: number }) {
  return (
    <PremiumModel 
      url="/models/bathroom/uploads_files_4274264_cabinet+2.glb" 
      position={[x, y, z]} 
      rotation={[0, rotY, 0]}
      scale={scale}
      modelScale={modelScale}
      offset={[91.926, -9.340, 59.686]}
      fallback={<ProceduralVanity />}
    />
  );
}

function BacklitMirror({ x, y, z, rotY }: { x: number; y: number; z: number; rotY: number }) {
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);

  React.useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      "/models/bathroom/mirror.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.warn("Failed to load mirror texture", err);
      }
    );
  }, []);

  const mirrorMaterial = React.useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: texture,
      color: texture ? "#ffffff" : "#cccccc",
      roughness: 0.05,
      metalness: texture ? 0.1 : 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      envMapIntensity: 1.5,
    });
  }, [texture]);

  const rimColor = paintMat("#222222", 0.8);
  const ledWarm = emissiveMat("#ffeedd", 4.0);
  const mirrorRadius = 1.3;
  
  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      {/* LED Backlight Ring */}
      <mesh position={[0, 0, -0.015]} material={ledWarm}>
        <torusGeometry args={[mirrorRadius - 0.05, 0.01, 8, 48]} />
      </mesh>

      {/* Point Light behind mirror to illuminate the wall */}
      <pointLight 
        position={[0, 0, -0.03]} 
        intensity={1.0} 
        color="#ffeedd" 
        distance={4} 
        decay={2.0} 
      />

      {/* Mirror Frame / Backing */}
      <mesh position={[0, 0, -0.008]} rotation={[Math.PI / 2, 0, 0]} material={rimColor}>
        <cylinderGeometry args={[mirrorRadius + 0.005, mirrorRadius + 0.005, 0.008, 64]} />
      </mesh>

      {/* Mirror Glass */}
      <mesh position={[0, 0, 0.002]} rotation={[Math.PI / 2, 0, 0]} material={mirrorMaterial}>
        <cylinderGeometry args={[mirrorRadius, mirrorRadius, 0.004, 64]} />
      </mesh>
    </group>
  );
}

function TowelRack({ x, y, z, rotY, modelScale = 3.28 }: { x: number; y: number; z: number; rotY: number; modelScale?: number }) {
  return (
    <PremiumModel
      url="/models/bathroom/uploads_files_2562349_Towel+Rack.glb"
      position={[x, y, z]}
      rotation={[0, rotY, 0]}
      modelScale={modelScale}
      offset={[0.11, 0, 1.87]}
      hideNodes={["Plane_Plane"]}
      fallback={
        <group>
          {/* Procedural fallback towel rack: a simple chrome ring/bar */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[-0.1, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      }
    />
  );
}

function ProceduralWashingMachine() {
  const bodyMat = paintMat("#f5f5f5", 0.05); // High gloss white paint
  const panelMat = paintMat("#222222", 0.3); // Dark grey panel
  const chrome = chromeMat();
  const glass = glassMat(0.35); // Dark glass door
  const screenLed = emissiveMat("#00ff66", 2.0); // Green LED screen

  return (
    <group>
      {/* Main Machine Body: 2.0 ft wide, 2.0 ft deep, 2.8 ft high */}
      <mesh position={[0, 1.4, 0]} material={bodyMat} castShadow receiveShadow>
        <boxGeometry args={[2.0, 2.8, 2.0]} />
      </mesh>

      {/* Control Panel Header (front top) */}
      <mesh position={[0, 2.65, 0.96]} material={panelMat} castShadow>
        <boxGeometry args={[1.96, 0.25, 0.1]} />
      </mesh>

      {/* Detergent Drawer (top left) */}
      <mesh position={[-0.6, 2.65, 1.015]} material={bodyMat} castShadow>
        <boxGeometry args={[0.5, 0.18, 0.02]} />
      </mesh>

      {/* Control Dial Knob (center right) */}
      <mesh position={[0.2, 2.65, 1.02]} rotation={[Math.PI / 2, 0, 0]} material={chrome} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.03, 16]} />
      </mesh>

      {/* LED Display Screen (far right) */}
      <mesh position={[0.6, 2.65, 1.015]} material={paintMat("#111", 0.8)}>
        <boxGeometry args={[0.4, 0.12, 0.01]} />
      </mesh>
      <mesh position={[0.6, 2.65, 1.021]} material={screenLed}>
        <planeGeometry args={[0.3, 0.06]} />
      </mesh>

      {/* Front Door Frame (circular chrome rim) */}
      <mesh position={[0, 1.3, 1.01]} rotation={[Math.PI / 2, 0, 0]} material={chrome} castShadow>
        <torusGeometry args={[0.55, 0.06, 8, 48]} />
      </mesh>

      {/* Front Door Glass Window */}
      <mesh position={[0, 1.3, 1.01]} rotation={[Math.PI / 2, 0, 0]} material={glass} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.02, 32]} />
      </mesh>
      
      {/* Front Door Handle/Latch */}
      <mesh position={[0.48, 1.3, 1.05]} rotation={[0, 0, Math.PI / 6]} material={chrome} castShadow>
        <boxGeometry args={[0.03, 0.15, 0.02]} />
      </mesh>
    </group>
  );
}

function WashingMachine({ x, y, z, rotY, modelScale = 0.004 }: { x: number; y: number; z: number; rotY: number; modelScale?: number }) {
  return (
    <PremiumModel
      url="/models/bathroom/washing_machine.glb"
      position={[x, y, z]}
      rotation={[0, rotY, 0]}
      modelScale={modelScale}
      center={true}
      fallback={<ProceduralWashingMachine />}
    />
  );
}

export default function BathroomFurnishings({ 
  roomW, roomL, roomH, 
  showerWidth = 4.2, 
  showerDepth = 4.2, 
  showerHeight = 9.0,
  toiletScale = 0.045,
  toiletXOffset = 0.8,
  toiletZOffset = 0.1,
  toiletRotY = 0
}: Props) {
  return (
    <group>
      <LuxuryShowerEnclosure 
        roomH={roomH} 
        showerWidth={showerWidth} 
        showerDepth={showerDepth} 
        showerHeight={showerHeight} 
      />
      <Toilet 
        x={roomW - 13.3} 
        z={7.7} 
        rotY={(toiletRotY * Math.PI) / 180} 
        modelScale={toiletScale} 
      />
      <ToiletPaperHolder 
        x={roomW - 15} 
        y={3} 
        z={5.5} 
        rotY={((toiletRotY+ 90) * Math.PI) / 180} 
        scale={4.5} 
      />
      {/* 
        BATHROOM VANITY CABINET PLACEMENT
        Renders the vanity cabinet (uploads_files_4274264_cabinet+2.glb) on the floor.
        - x: 0.8 (positions the cabinet center so that its 1.55 ft deep body sits flush against the left wall at x=0)
        - y: 0 (places the bottom of the vanity on the floor)
        - z: 1.9 (positions the unit next to the shower, extending Z from 1.9 to 7.9)
        - rotY: -Math.PI / 2 (rotates -90 degrees so the back is against the left wall and the front faces the room)
        - modelScale: 0.0328 (converts the centimeter-based model to feet)
      */}
      <BathroomUnit 
        x={14} 
        y={0} 
        z={4.9} 
        rotY={-Math.PI / 2} 
        modelScale={0.0333} 
      />
      {/* 
        BACKLIT CIRCULAR MIRROR PLACEMENT
        Renders the circular backlit mirror on the left wall above the vanity basin.
        - x: 0.05 (placed flush against the left wall)
        - y: 5.2 (centered at eye level, 5.2 ft high)
        - z: 6.2 (perfectly aligned centered with the vanity basin at Z = 6.2)
        - rotY: Math.PI / 2 (rotates 90 degrees to face outward into the room)
      */}
      <BacklitMirror 
        x={14.9} 
        y={5.2} 
        z={3.7} 
        rotY={ 300} 
      />
      {/* 
        HAND TOWEL RACK PLACEMENT
        Renders the hand towel rack (uploads_files_2562349_Towel+Rack.glb) next to the vanity.
        - x: 14.85 (mounted on the right wall)
        - y: 4.0 (placed at hand height)
        - z: 1.3 (positioned to the left of the vanity unit, next to the tall cabinet)
        - rotY: Math.PI (rotates 180 degrees so the back plate mounts flush to the right wall)
        - modelScale: 3.28 (scales from meters to feet)
      */}
      <TowelRack 
        x={15} 
        y={4.0} 
        z={2.0} 
        rotY={Math.PI} 
        modelScale={1.28}
      />
     
      <WashingMachine 
        x={13.9} 
        y={2.75} 
        z={9.7} 
        rotY={-Math.PI / 2} 
        modelScale={0.004} 
      />
      
      <CeilingSpots roomW={roomW} roomL={roomL} roomH={roomH} />
    </group>
  );
}
