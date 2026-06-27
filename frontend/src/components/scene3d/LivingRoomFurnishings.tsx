"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
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
      url="/models/hall/sofa.glb?v=1.0.5" 
      position={[x, 0, z]} 
      rotation={[0, rotY, 0]}
      scale={scale}
      center={false}
      fallback={null}
    />
  );
}

function ProceduralTVUnit({ wallW }: { wallW: number }) {
  const cabinet = woodMat("wood-oak", [2, 1]);
  const panel = paintMat("#c8a97a", 0.4);
  const slat = woodMat("wood-oak", [3, 1], 0.5);
  const screen = emissiveMat("#0a1420", 0.9);
  const unitW = Math.min(3.5, wallW * 0.45);
  return (
    <group>
      <mesh position={[0, 2.2, -0.06]} material={panel} castShadow>
        <boxGeometry args={[unitW + 0.8, 3.5, 0.06]} />
      </mesh>
      {[-0.35, -0.12, 0.12, 0.35].map((ox, i) => (
        <mesh key={i} position={[ox * unitW, 2.5, -0.02]} material={slat} castShadow>
          <boxGeometry args={[0.04, 2.8, 0.02]} />
        </mesh>
      ))}
      <mesh position={[0, 0.3, -0.02]} material={emissiveMat("#ffd080", 2)}>
        <boxGeometry args={[unitW + 0.6, 0.03, 0.02]} />
      </mesh>
      <mesh position={[0, 0.35, 0.15]} material={cabinet} castShadow receiveShadow>
        <boxGeometry args={[unitW, 0.7, 0.45]} />
      </mesh>
      <mesh position={[-unitW * 0.3, 0.35, 0.38]} material={chromeMat()} castShadow>
        <boxGeometry args={[0.02, 0.6, 0.02]} />
      </mesh>
      <mesh position={[unitW * 0.25, 0.35, 0.38]} material={chromeMat()} castShadow>
        <boxGeometry args={[0.02, 0.6, 0.02]} />
      </mesh>
      <mesh position={[0, 1.55, 0.08]} material={panel} castShadow>
        <boxGeometry args={[unitW * 0.85, unitW * 0.48, 0.05]} />
      </mesh>
      <mesh position={[0, 1.55, 0.11]} material={screen}>
        <planeGeometry args={[unitW * 0.8, unitW * 0.45]} />
      </mesh>
      <mesh position={[0, 0.78, 0.12]} material={chromeMat()} castShadow>
        <boxGeometry args={[0.5, 0.04, 0.2]} />
      </mesh>
    </group>
  );
}

function TVUnit({ x, y = 0, z, rotX = 0, rotY, wallW, scale = 1.0 }: { x: number; y?: number; z: number; rotX?: number; rotY: number; wallW: number; scale?: number }) {
  return (
    <PremiumModel 
      url="/models/hall/solid_wood_tv_cabinet_1_wood_textures.glb" 
      position={[x, y, z]} 
      rotation={[rotX, rotY, 0]}
      scale={scale}
      center={true}
      modelScale={1.0}
      fallback={<ProceduralTVUnit wallW={wallW} />}
    />
  );
}

function TV({ x, y = 2.6, z = 1.1, scale = 1.0 }: { x: number; y?: number; z?: number; scale?: number }) {
  const texture = useTexture("/models/hall/tv.png");
  
  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [texture]);

  // tv.glb:
  // Height: 1.0, Width: 1.697, Depth: 0.151
  // Scaled by 3.0: Height: 3.0, Width: 5.09, Depth: 0.453
  // Placing a screen plane slightly in front of the TV's front face:
  // Y offset centers the plane vertically since model is centered around Y=0.5
  return (
    <group position={[x, y, z]} scale={scale}>
      <PremiumModel 
        url="/models/hall/tv.glb?v=1.0.2" 
        position={[0, 0, 0]} 
        rotation={[0, 0, 0]}
        scale={1.0}
        center={false}
        modelScale={1.0}
        fallback={null}
      />
      {texture && (
        <mesh position={[0, 0.45, 0.089]} castShadow>
          <planeGeometry args={[1.81, 1.27]} />
          <meshBasicMaterial map={texture} transparent={true} />
        </mesh>
      )}
    </group>
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

function CoffeeTable({ x, y = 0, z, rotY = 0, scale = 1.0 }: { x: number; y?: number; z: number; rotY?: number; scale?: number }) {
  return (
    <PremiumModel 
      url="/models/hall/vintage_coffee_table_70s_03_freebie.glb" 
      position={[x, y, z]} 
      rotation={[0, rotY, 0]}
      scale={scale}
      center={false}
      modelScale={1.0}
      fallback={null}
    />
  );
}

function Painting({ x, y, z, rotY, w, h, url }: { x: number; y: number; z: number; rotY: number; w: number; h: number; url: string }) {
  const texture = useTexture(url);
  
  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [texture]);

  const frame = woodMat("wood-mahogany", [1, 1], 0.45);
  
  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      <mesh material={frame} castShadow>
        <boxGeometry args={[w + 0.1, h + 0.1, 0.04]} />
      </mesh>
      <mesh position={[0, 0, 0.025]} castShadow>
        <planeGeometry args={[w, h]} />
        <meshPhysicalMaterial 
          map={texture} 
          roughness={0.2} 
          envMapIntensity={1.2} 
          clearcoat={0.3} 
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


      <PremiumModel 
        url="/models/hall/carpet.glb?v=1.0.0" 
        position={[cx, 0.008, cz]} 
        rotation={[0, 0, 0]}
        scale={0.5}
        center={false}
        modelScale={1.0}
        fallback={null}
      />

      {/* Loading your sofa.glb! */}
      <LShapedSofa x={cx} z={roomL - 2.5} rotY={Math.PI} scale={2.3} />

      {/* Loading abstract_book_shelf.glb to the right side of the sofa! */}
      <AbstractBookshelf x={14}
       y={3.70} 
       z={1.5} 
       rotY={-Math.PI / 4} 
       scale={1.95} />

      {/* Loading coffee table! */}
      <CoffeeTable x={cx} y={0.3} z={cz} rotY={0} scale={3.0} />

      {/* Loading your tvunit.glb! */}
      <TVUnit x={cx} 
      y={1.50} 
      z={0.6} 
      rotX={0} 
      rotY={0} 
      wallW={roomW} 
      scale={0.6} />

      {/* Loading your tv.glb! */}
      <TV x={cx}
       y={2.2} 
       z={0.1} 
       scale={3.0} />

      {/* Loading wall shelf to the left side of the TV! */}
      <WallShelf
       x={cx - 4.8} 
       y={4.5} 
       z={0.07} 
       rotY={0} 
       modelScale={2.5} />

      {/* Loading your lamp.glb to the left of TV unit! */}
      <Lamp x={0.6} y={0} z={1.3} scale={3.5} />

      {/* Loading indoor plant next to the sofa on its left side! */}
      <Plant x={cx - 3.9} y={0} z={roomL - 4.5} scale={0.003} />

      {/* Painting on the right wall */}
      <Painting x={roomW - 0.08} y={5.6} z={cz} rotY={-Math.PI / 2} w={2.9} h={6.2} url="/models/hall/art.png.jpg" />

      {/* Opposite painting on the left wall */}
      <Painting x={0.08} y={5.6} z={cz} rotY={Math.PI / 2} w={2.9} h={6.2} url="/models/hall/flower.jpg?v=1.0.0" />

      <CeilingLights roomW={roomW} roomL={roomL} roomH={roomH} />
    </group>
  );
}
