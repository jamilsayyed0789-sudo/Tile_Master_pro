"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { useTexture, useGLTF } from "@react-three/drei";
import {
  woodMat,
  fabricMat,
  leatherMat,
  marbleMat,
  carpetMat,
  chromeMat,
  paintMat,
  glassMat,
  emissiveMat,
} from "./materials";
import PremiumModel from "./PremiumModel";

type Props = { roomW: number; roomL: number; roomH: number };

function Curtain({ x, y, z, rotY = 0, scale = 1.0 }: { x: number, y: number, z: number, rotY?: number, scale?: number | [number, number, number] }) {
  const { scene } = useGLTF("/models/hall/Curtain.glb");
  const s = Array.isArray(scale) ? scale : [scale, scale, scale];
  const clone = useMemo(() => {
    const c = scene.clone();
    c.traverse((node: any) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        // Apply light brown material
        if (node.material) {
          node.material = node.material.clone();
          node.material.color = new THREE.Color("#A88E75"); // Light brown
          node.material.roughness = 0.8;
          node.material.metalness = 0.1;
          node.material.side = THREE.DoubleSide;
        }
      }
    });
    return c;
  }, [scene]);

  return <primitive object={clone} position={[x, y, z]} rotation={[0, rotY, 0]} scale={s} />;
}

function WindowWall({
  x,
  z,
  rotY,
  w,
  h,
}: {
  x: number;
  z: number;
  rotY: number;
  w: number;
  h: number;
}) {
  const frame = woodMat("wood-ebony", [1, 1], 0.4);
  const curtain = fabricMat("fabric-cream", [2, 4]);
  const sill = marbleMat("marble-white", [1, 1]);
  const fw = w * 0.08;
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, h * 0.55, 0.04]} material={frame} castShadow>
        <boxGeometry args={[w, h * 0.65, 0.12]} />
      </mesh>
      <mesh position={[0, h * 0.55, 0.05]} material={glassMat(0.22)}>
        <planeGeometry args={[w - fw * 2, h * 0.65 - fw * 2]} />
      </mesh>
      <mesh position={[0, h * 0.55, 0.06]} material={frame} castShadow>
        <boxGeometry args={[fw, h * 0.65 - fw, 0.04]} />
      </mesh>
      <mesh position={[0, h * 0.55, 0.06]} material={frame} castShadow>
        <boxGeometry args={[w - fw, fw, 0.04]} />
      </mesh>
      <mesh position={[0, h * 0.2, 0.08]} material={sill} castShadow receiveShadow>
        <boxGeometry args={[w + 0.2, 0.08, 0.25]} />
      </mesh>
      <mesh position={[-w * 0.42, h * 0.45, 0.15]} material={curtain} castShadow>
        <boxGeometry args={[w * 0.12, h * 0.55, 0.04]} />
      </mesh>
      <mesh position={[w * 0.42, h * 0.45, 0.15]} material={curtain} castShadow>
        <boxGeometry args={[w * 0.12, h * 0.55, 0.04]} />
      </mesh>
      <mesh position={[0, h * 0.88, 0.12]} material={chromeMat()} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, w * 0.9, 8]} />
      </mesh>
      {/* Sunlight spill on floor near window */}
      <mesh position={[0, 0.012, 0.35]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w * 0.85, 1.8]} />
        <meshPhysicalMaterial
          color="#fff8e8"
          transparent
          opacity={0.14}
          roughness={0.9}
          depthWrite={false}
        />
      </mesh>
      <pointLight position={[0, h * 0.5, 0.25]} intensity={0.5} color="#fff6e8" distance={8} decay={2} />
    </group>
  );
}

function ProceduralLShapedSofa() {
  const body = leatherMat("leather-tan");
  const cushion = fabricMat("fabric-cream", [3, 3]);
  const accent = fabricMat("fabric-rust", [2, 2]);
  const leg = chromeMat();
  const mainW = 3.8;
  const mainD = 1.2;
  const chaiseW = 1.8;
  const chaiseD = 1.6;
  const sH = 0.44;
  const bH = 0.68;
  const bOff = mainD * 0.5 - 0.12;
  const legPos: [number, number, number][] = [];
  for (const lx of [-mainW * 0.45, mainW * 0.45]) {
    for (const lz of [-mainD * 0.42, mainD * 0.42]) {
      legPos.push([lx, 0.08, lz]);
    }
  }
  for (const lx of [mainW * 0.5 + chaiseW * 0.35, mainW * 0.5 + chaiseW * 0.65]) {
    for (const lz of [-chaiseD * 0.42, chaiseD * 0.42]) {
      legPos.push([lx, 0.08, lz]);
    }
  }
  return (
    <group>
      <mesh position={[0, sH * 0.5, 0]} material={body} castShadow receiveShadow>
        <boxGeometry args={[mainW, sH, mainD]} />
      </mesh>
      <mesh position={[0, sH + bH * 0.5, -bOff]} material={body} castShadow>
        <boxGeometry args={[mainW, bH, 0.25]} />
      </mesh>
      <mesh position={[mainW * 0.5 + chaiseW * 0.5, sH * 0.5, -mainD * 0.5 + chaiseD * 0.5]} material={body} castShadow receiveShadow>
        <boxGeometry args={[chaiseW, sH, chaiseD]} />
      </mesh>
      <mesh position={[mainW * 0.5 + chaiseW * 0.5, sH + bH * 0.5, -mainD * 0.5 + 0.12]} material={body} castShadow>
        <boxGeometry args={[chaiseW, bH, 0.25]} />
      </mesh>
      <mesh position={[mainW * 0.5 + 0.02, sH + bH * 0.5, -mainD * 0.5 + chaiseD * 0.5]} material={body} castShadow>
        <boxGeometry args={[0.25, bH, chaiseD]} />
      </mesh>
      {[-0.9, 0, 0.9].map((ox) => (
        <mesh key={ox} position={[ox, sH + 0.09, 0.04]} material={cushion} castShadow>
          <boxGeometry args={[1.15, 0.2, mainD - 0.2]} />
        </mesh>
      ))}
      <mesh position={[mainW * 0.5 + chaiseW * 0.5, sH + 0.09, -mainD * 0.5 + chaiseD * 0.5]} material={cushion} castShadow>
        <boxGeometry args={[chaiseW - 0.2, 0.2, chaiseD - 0.3]} />
      </mesh>
      {[-0.65, 0, 0.65].map((ox) => (
        <mesh key={`bk${ox}`} position={[ox, sH + bH - 0.12, -bOff]} material={cushion} castShadow>
          <boxGeometry args={[1.1, 0.24, 0.08]} />
        </mesh>
      ))}
      <mesh position={[0.9, sH + 0.05, 0.35]} material={accent} castShadow>
        <boxGeometry args={[0.4, 0.14, 0.35]} />
      </mesh>
      <mesh position={[-0.7, sH + 0.05, 0.38]} material={accent} castShadow>
        <boxGeometry args={[0.35, 0.1, 0.3]} />
      </mesh>
      {legPos.map(([lx, ly, lz], i) => (
        <mesh key={i} position={[lx, ly, lz]} material={leg} castShadow>
          <cylinderGeometry args={[0.04, 0.055, 0.16, 10]} />
        </mesh>
      ))}
    </group>
  );
}

function LShapedSofa({ x, z, rotY, scale = 1.0 }: { x: number; z: number; rotY: number; scale?: number }) {
  return (
    <PremiumModel 
      url="/models/hall/base.glb" 
      position={[x, 0, z]} 
      rotation={[0, rotY, 0]}
      scale={scale}
      center={false}
      colorOverrides={{ '*': '#F3EEE4' }}
      fallback={null}
    />
  );
}

function ProceduralBookshelfTVUnit({ wallW }: { wallW: number }) {
  const charcoalMat = paintMat("#3B3B3B", 0.6); 
  const walnutMat = woodMat("wood-oak", [2, 1], 0.3);
  walnutMat.color.set("#4a3018");
  const goldMat = chromeMat();
  goldMat.color.set("#d4af37");
  goldMat.roughness = 0.3;

  const unitW = wallW * 0.45; // Central TV area width
  const shelfW = 1.0; // Width of each side bookshelf
  const height = 0.5; // Base cabinet height
  const depth = 0.45;
  const overallScale = 1.25; 

  // Procedural books generator
  const renderBooks = (yPos: number) => {
    const bookColors = ["#8B0000", "#000080", "#2F4F4F", "#8B4513", "#F5F5DC", "#2E8B57"];
    const books = [];
    let currentX = -shelfW / 2 + 0.1;
    for (let i = 0; i < 6; i++) {
      const bWidth = 0.05 + Math.random() * 0.05;
      const bHeight = 0.2 + Math.random() * 0.15;
      const bDepth = 0.2 + Math.random() * 0.05;
      const color = bookColors[Math.floor(Math.random() * bookColors.length)];
      books.push(
        <mesh key={i} position={[currentX + bWidth / 2, yPos + bHeight / 2, 0.05]} material={paintMat(color, 0.4)} castShadow>
          <boxGeometry args={[bWidth, bHeight, bDepth]} />
        </mesh>
      );
      currentX += bWidth + 0.01;
    }
    return books;
  };

  return (
    <group position={[0, 0.4, 0]} scale={overallScale}>
      {/* Central TV Cabinet */}
      <mesh position={[0, height / 2, depth / 2]} material={charcoalMat} castShadow receiveShadow>
        <boxGeometry args={[unitW, height, depth]} />
      </mesh>
      <mesh position={[0, height + 0.01, depth / 2]} material={walnutMat} castShadow receiveShadow>
        <boxGeometry args={[unitW + 0.04, 0.02, depth + 0.02]} />
      </mesh>
      <mesh position={[0, height - 0.05, depth + 0.01]} material={goldMat} castShadow>
        <boxGeometry args={[unitW, 0.02, 0.01]} />
      </mesh>

      {/* Large Flat Screen TV in the center */}
      <mesh position={[0, height + 1.3, 0.1]} material={paintMat("#111111", 0.1)} castShadow>
        <boxGeometry args={[unitW * 0.8, unitW * 0.45, 0.05]} />
      </mesh>
      <mesh position={[0, height + 1.3, 0.13]} material={emissiveMat("#0a1420", 0.8)}>
        <boxGeometry args={[unitW * 0.78, unitW * 0.43, 0.01]} />
      </mesh>

      {/* Left and Right Bookshelves */}
      {[-1, 1].map((side, idx) => {
        const shelfCenterX = side * (unitW / 2 + shelfW / 2 + 0.1);
        const shelfLevels = [height + 0.4, height + 1.2, height + 2.0, height + 2.8];
        return (
          <group key={idx}>
            {/* Bookshelf Backing */}
            <mesh position={[shelfCenterX, height + 1.6, 0.02]} material={charcoalMat} castShadow>
              <boxGeometry args={[shelfW, 3.2, 0.04]} />
            </mesh>
            {/* Bookshelf Frame Sides */}
            <mesh position={[shelfCenterX - shelfW / 2, height + 1.6, depth / 2]} material={walnutMat} castShadow>
              <boxGeometry args={[0.04, 3.2, depth]} />
            </mesh>
            <mesh position={[shelfCenterX + shelfW / 2, height + 1.6, depth / 2]} material={walnutMat} castShadow>
              <boxGeometry args={[0.04, 3.2, depth]} />
            </mesh>
            
            {/* Bookshelf Levels & Books */}
            {shelfLevels.map((sy, i) => (
              <group key={i}>
                <mesh position={[shelfCenterX, sy, depth / 2]} material={walnutMat} castShadow>
                  <boxGeometry args={[shelfW, 0.04, depth]} />
                </mesh>
                {/* Add procedural books on each shelf level */}
                <group position={[shelfCenterX, sy + 0.02, 0]}>
                  {renderBooks(0)}
                </group>
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function TVUnit({ x, y = 0, z, rotX = 0, rotY, wallW, scale = 3.0 }: { x: number; y?: number; z: number; rotX?: number; rotY: number; wallW: number; scale?: number }) {
  const [marbleTex, setMarbleTex] = React.useState<any>(null);
  
  React.useEffect(() => {
    // Dynamically load the user's custom marble image, ONLY apply if it exists
    const loader = new THREE.TextureLoader();
    loader.load(
      '/models/hall/custom_marble_2.jpg', 
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        // Adjust the UV scaling in case the model's UVs are too large/small
        tex.repeat.set(2, 2);
        setMarbleTex(tex);
      },
      undefined,
      (err) => {
        console.warn("Custom marble image not found yet at /models/hall/custom_marble_2.jpg. Falling back to Charcoal solid color.");
      }
    );
  }, []);

  return (
    <group>
      <PremiumModel 
        url="/models/hall/uploads_files_3590708_tv+table.glb" 
        position={[x, 6, 1.5]} 
        rotation={[rotX, 11, 0]}
        scale={scale}
        center={true}
        modelScale={1.2}
        colorOverrides={{
          'wood': '#4a3018',         // American Walnut
          'wood 2': '#d4af37',       // Champagne Gold
          'material.001': '#3B3B3B', // Matte Charcoal Grey
          'material.002': '#3B3B3B',
          '*': '#3B3B3B'
        }}
        textureOverrides={marbleTex ? {
          'wood': null,
          'wood 2': null,
          'material.001': marbleTex,
          'material.002': marbleTex,
          '*': marbleTex // Apply to anything else that was supposed to be charcoal
        } : undefined}
        fallback={<ProceduralBookshelfTVUnit wallW={wallW} />}
      />

      {/* Warm LED Light Wash Behind TV Unit */}
      <group position={[x, 1.7, 0.15]}>
        {/* Top Wash */}
        <pointLight position={[-1.5, 1.2, 0]} color="#FFD1A4" intensity={4} distance={4} decay={1.5} />
        <pointLight position={[0, 1.2, 0]} color="#FFD1A4" intensity={4} distance={4} decay={1.5} />
        <pointLight position={[1.5, 1.2, 0]} color="#FFD1A4" intensity={4} distance={4} decay={1.5} />
        
        {/* Underglow Wash */}
        <pointLight position={[-1.5, -1.2, 0.3]} color="#FFD1A4" intensity={3} distance={3} decay={2} />
        <pointLight position={[0, -1.2, 0.3]} color="#FFD1A4" intensity={3} distance={3} decay={2} />
        <pointLight position={[1.5, -1.2, 0.3]} color="#FFD1A4" intensity={3} distance={3} decay={2} />
      </group>
    </group>
  );
}

function NewTVUnit({ x, y = 0, z, rotX = 0, rotY = 0, scale = 1.0 }: { x: number; y?: number; z: number; rotX?: number; rotY?: number; scale?: number }) {
  return (
    <PremiumModel 
      url="/models/hall/Today_5602661_TV-unit-1.glb" 
      position={[x, y, z]} 
      rotation={[rotX, rotY, 0]}
      scale={scale}
      center={true}
      modelScale={1.0}
    />
  );
}

function Lamp({ x, y = 0, z, scale = 1.0 }: { x: number; y?: number; z: number; scale?: number }) {
  return (
    <group position={[x, y, z]} scale={scale}>
      <PremiumModel 
        url="/models/hall/lamp.glb?v=1.0.0" 
        position={[0, 0, 0]} 
        rotation={[0, 0, 0]}
        scale={1.0}
        center={false}
        modelScale={1.0}
        fallback={
          <group>
            {/* Stand */}
            <mesh position={[0, 0.8, 0]} castShadow>
              <cylinderGeometry args={[0.015, 0.015, 1.6, 8]} />
              <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Base */}
            <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.15, 0.15, 0.04, 16]} />
              <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Shade */}
            <mesh position={[0, 1.5, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.22, 0.3, 16]} />
              <meshStandardMaterial color="#f5f0e8" roughness={0.6} />
            </mesh>
          </group>
        }
      />
      {/* Warm lamp light */}
      <pointLight 
        position={[0, 1.5, 0]} 
        intensity={0.8} 
        color="#ffdfa9" 
        distance={6} 
        decay={2} 
      />
    </group>
  );
}

function Plant({ x, y = 0, z, scale = 0.002 }: { x: number; y?: number; z: number; scale?: number }) {
  return (
    <PremiumModel 
      url="/models/hall/indoor_plant_02_fbx.glb?v=1.0.3" 
      position={[x, y, z]} 
      rotation={[0, 0, 0]}
      scale={scale}
      center={false}
      modelScale={1.0}
      fallback={null}
    />
  );
}

function CoffeeTable({ x, y = 0, z, rotY = 0, scale = 0.5 }: { x: number; y?: number; z: number; rotY?: number; scale?: number }) {
  return (
    <PremiumModel 
      url="/models/hall/Coffee_table.glb" 
      position={[x, y, z]} 
      rotation={[0, rotY, 0]}
      scale={scale}
      center={false}
      modelScale={1.0}
      fallback={null}
    />
  );
}

function Sofa2({ x, y = 0, z, rotY = 0, scale = 1.0 }: { x: number; y?: number; z: number; rotY?: number; scale?: number }) {
  return (
    <PremiumModel 
      url="/models/hall/sofa_2.glb" 
      position={[x, y, z]} 
      rotation={[0, rotY, 0]}
      scale={scale}
      center={true}
      modelScale={1.0}
      fallback={null}
    />
  );
}

function DecorativeTable({ x, y = 0, z, rotY = 0, scale = 1.0 }: { x: number; y?: number; z: number; rotY?: number; scale?: number }) {
  return (
    <PremiumModel 
      url="/models/hall/decorative_table.glb" 
      position={[x, y, z]} 
      rotation={[0, rotY, 0]}
      scale={scale}
      center={true}
      modelScale={1.0}
      fallback={null}
    />
  );
}

function Painting({ x, y, z, rotY, w, h }: { x: number; y: number; z: number; rotY: number; w: number; h: number; url: string }) {
  const frame = woodMat("wood-mahogany", [1, 1], 0.45);
  
  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      <mesh material={frame} castShadow>
        <boxGeometry args={[w + 0.1, h + 0.1, 0.04]} />
      </mesh>
      <mesh position={[0, 0, 0.025]} castShadow>
        <planeGeometry args={[w, h]} />
        <meshPhysicalMaterial 
          color="#eeeeee"
          roughness={0.8} 
          clearcoat={0.1} 
        />
      </mesh>
    </group>
  );
}

function ProceduralBookshelf() {
  const shelf = woodMat("wood-walnut", [2, 2], 0.5);
  const bookColors = ["#8a2a2a", "#2a4a6a", "#4a3a2a", "#2a5a4a", "#5a4a6a"];
  return (
    <group>
      <mesh position={[0, 1.1, 0]} material={shelf} castShadow receiveShadow>
        <boxGeometry args={[0.9, 2.2, 0.35]} />
      </mesh>
      {[0.5, 1.1, 1.7].map((sy, i) => (
        <mesh key={i} position={[0, sy, 0.02]} material={shelf} castShadow>
          <boxGeometry args={[0.85, 0.04, 0.32]} />
        </mesh>
      ))}
      {bookColors.map((col, i) => (
        <mesh key={i} position={[-0.3 + i * 0.15, 0.35 + (i % 2) * 0.55, 0.05]} material={paintMat(col, 0.3)} castShadow>
          <boxGeometry args={[0.1, 0.35 + (i % 3) * 0.08, 0.22]} />
        </mesh>
      ))}
    </group>
  );
}

function Bookshelf({ x, z, rotY }: { x: number; z: number; rotY: number }) {
  return (
    <PremiumModel 
      url="/models/hall/bookshelf.glb" 
      position={[x, 0, z]} 
      rotation={[0, rotY, 0]}
      fallback={<ProceduralBookshelf />}
    />
  );
}

function CeilingLights({ roomW, roomL, roomH }: Props) {
  const housing = paintMat("#f5f0e8", 0.45);
  const glow = emissiveMat("#fff8ee", 3);
  const positions: [number, number][] = [
    [roomW * 0.3, roomL * 0.35],
    [roomW * 0.7, roomL * 0.35],
    [roomW * 0.5, roomL * 0.65],
  ];
  return (
    <group>
      {/* Cove Light Glow Strip (Soft Backlight) */}
      <mesh position={[roomW / 2, roomH - 0.03, roomL / 2]} material={emissiveMat("#ffdca8", 0.35)}>
        <boxGeometry args={[roomW - 0.4, 0.01, roomL - 0.4]} />
      </mesh>
      {/* Non-emissive Ceiling Drop Panel (Plaster/Gypsum) */}
      <mesh position={[roomW / 2, roomH - 0.06, roomL / 2]} material={paintMat("#dcd8d0", 0.65)} castShadow receiveShadow>
        <boxGeometry args={[roomW - 0.6, 0.06, roomL - 0.6]} />
      </mesh>
      {positions.map(([x, z], i) => (
        <group key={i} position={[x, roomH - 0.15, z]}>
          <mesh material={housing} castShadow>
            <cylinderGeometry args={[0.25, 0.3, 0.08, 16]} />
          </mesh>
          <mesh position={[0, -0.06, 0]} material={glow}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
          </mesh>
          <spotLight
            position={[0, -0.15, 0]}
            angle={0.55}
            penumbra={0.65}
            intensity={0.4}
            color="#fff5e0"
            distance={12}
            decay={2}
          />
        </group>
      ))}
    </group>
  );
}

function Baseboards({ roomW, roomL }: { roomW: number; roomL: number }) {
  const mat = woodMat("wood-ebony", [4, 1], 0.48);
  const h = 0.12;
  return (
    <group>
      <mesh position={[roomW / 2, h / 2, 0.04]} material={mat} castShadow>
        <boxGeometry args={[roomW, h, 0.04]} />
      </mesh>
      <mesh position={[0.04, h / 2, roomL / 2]} material={mat} castShadow>
        <boxGeometry args={[0.04, h, roomL]} />
      </mesh>
      <mesh position={[roomW - 0.04, h / 2, roomL / 2]} material={mat} castShadow>
        <boxGeometry args={[0.04, h, roomL]} />
      </mesh>
    </group>
  );
}

function ProceduralWallShelf() {
  const wood = woodMat("wood-oak", [1.0, 1.0]);
  return (
    <group>
      {/* Back board */}
      <mesh position={[0, 0, -0.05]} material={wood} castShadow>
        <boxGeometry args={[2.5, 1.8, 0.05]} />
      </mesh>
      {/* Top shelf */}
      <mesh position={[0, 0.8, 0.3]} material={wood} castShadow>
        <boxGeometry args={[2.5, 0.05, 0.7]} />
      </mesh>
      {/* Bottom shelf */}
      <mesh position={[0, -0.8, 0.3]} material={wood} castShadow>
        <boxGeometry args={[2.5, 0.05, 0.7]} />
      </mesh>
      {/* Middle shelf */}
      <mesh position={[0, 0, 0.3]} material={wood} castShadow>
        <boxGeometry args={[1.8, 0.05, 0.7]} />
      </mesh>
    </group>
  );
}

function WallShelf({ x, y, z, rotY, modelScale = 3.0 }: { x: number; y: number; z: number; rotY: number; modelScale?: number }) {
  return (
    <PremiumModel
      url="/models/hall/Wall_Shelf_High_Poly.glb"
      position={[x, y, z]}
      rotation={[0, rotY, 0]}
      modelScale={modelScale}
      offset={[-0.02, 0.02, 0.10]}
      fallback={<ProceduralWallShelf />}
    />
  );
}

function AbstractBookshelf({ x, y = 0, z, rotY = 0, scale = 3.28 }: { x: number; y?: number; z: number; rotY?: number; scale?: number }) {
  return (
    <PremiumModel
      url="/models/hall/abstract_book_shelf.glb"
      position={[x, y, z]}
      rotation={[0, rotY, 0]}
      scale={scale}
      center={true}
      fallback={<ProceduralBookshelf />}
    />
  );
}

export default function LivingRoomFurnishings({ roomW, roomL, roomH }: Props) {
  const cx = roomW / 2;
  const cz = roomL / 2;
  const margin = 0.6;

  return (
    <group>


      {/* === COMMENTED OUT ORIGINAL HALL FURNITURE === */}
      {/* 
      <PremiumModel 
        url="/models/hall/carpet.glb?v=1.0.0" 
        position={[cx, 0.008, cz]} 
        rotation={[0, 0, 0]}
        scale={0.5}
        center={false}
        modelScale={1.0}
        fallback={null}
      />
      <LShapedSofa x={cx} z={roomL - 3.5} rotY={15} scale={2.3} />
      <Sofa2 x={cx + 3} y={0} z={cz} scale={2.0} rotY={-Math.PI / 2} />
      <CoffeeTable x={cx} y={0} z={cz - 1.5} scale={1.8} />
      <DecorativeTable x={cx - 3} y={0} z={cz - 2} scale={1.5} />
      <TVUnit x={cx} y={0} z={0.4} rotY={0} wallW={roomW} scale={3.0} />
      */}

      {/* ========================================================= */}
      {/* ADD YOUR CUSTOM LIVING ROOM GLB COMPONENT HERE           */}
      {/* Example:                                                 */}
      {/* <PremiumModel                                            */}
      {/*   url="/models/hall/room.glb"          */}
      {/*   position={[cx, 0, cz]}                                 */}
      {/*   scale={1.0}                                            */}
      {/* />                                                       */}
      {/* ========================================================= */}


      {/* === COMMENTED OUT CHANDELIER === */}
      {/* 
      <group position={[cx, roomH - 0.5, cz]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0.4]} castShadow>
          <torusGeometry args={[0.8, 0.02, 16, 100]} />
          <meshPhysicalMaterial color="#D4AF37" metalness={1.0} roughness={0.2} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0.4]}>
          <torusGeometry args={[0.8, 0.015, 16, 100]} />
          <meshBasicMaterial color="#FFEAC2" />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.4, -0.2, -0.2]} castShadow>
          <torusGeometry args={[0.8, 0.02, 16, 100]} />
          <meshPhysicalMaterial color="#D4AF37" metalness={1.0} roughness={0.2} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.4, -0.22, -0.2]}>
          <torusGeometry args={[0.8, 0.015, 16, 100]} />
          <meshBasicMaterial color="#FFEAC2" />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.4, -0.35, -0.2]} castShadow>
          <torusGeometry args={[0.8, 0.02, 16, 100]} />
          <meshPhysicalMaterial color="#D4AF37" metalness={1.0} roughness={0.2} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.4, -0.37, -0.2]}>
          <torusGeometry args={[0.8, 0.015, 16, 100]} />
          <meshBasicMaterial color="#FFEAC2" />
        </mesh>

        <mesh position={[0, 0.2, 0.4]}>
          <cylinderGeometry args={[0.005, 0.005, 0.5]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
        <mesh position={[-0.4, 0.12, -0.2]}>
          <cylinderGeometry args={[0.005, 0.005, 0.65]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
        <mesh position={[0.4, 0.05, -0.2]}>
          <cylinderGeometry args={[0.005, 0.005, 0.8]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
        
        <pointLight intensity={0.6} color="#FFEAC2" distance={8} decay={2} position={[0, -0.2, 0]} />
      </group>
      */}

      {/* === COMMENTED OUT REMAINING HALL FEATURES === */}
      {/* 
      <Curtain x={15.5} y={0} z={cz} scale={[0.044, 0.028, 0.02]} rotY={-Math.PI / 2} />
      <Painting x={0.08} y={5.6} z={cz} rotY={Math.PI / 2} w={2.9} h={6.2} url="/models/hall/art.png.jpg" />
      <CeilingLights roomW={roomW} roomL={roomL} roomH={roomH} />
      */}
    </group>
  );
}
