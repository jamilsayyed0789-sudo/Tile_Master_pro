"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import {
  woodMat,
  paintMat,
  glassMat,
  emissiveMat,
  chromeMat,
} from "./materials";
import PremiumModel from "./PremiumModel";

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

type Props = {
  roomW: number;
  roomL: number;
  roomH: number;
  counterDepth: number;
};

const COUNTER_H = 3;
const CABIN_Z = 1.8;

function ProceduralRefrigerator() {
  const bodyMat = paintMat("#2a2a2a", 0.35);
  const doorMat = paintMat("#c0c0c0", 0.15);
  const handleMat = chromeMat();
  
  return (
    <group>
      <mesh position={[0, 1.804 / 2, 0]} material={bodyMat} castShadow>
        <boxGeometry args={[0.833, 1.804, 0.918]} />
      </mesh>
      <mesh position={[0, 1.804 / 2 + 0.45, 0.465]} material={doorMat} castShadow>
        <boxGeometry args={[0.82, 0.85, 0.02]} />
      </mesh>
      <mesh position={[0, 1.804 / 2 - 0.45, 0.465]} material={doorMat} castShadow>
        <boxGeometry args={[0.82, 0.85, 0.02]} />
      </mesh>
      <mesh position={[0.38, 1.804 / 2 + 0.45, 0.485]} material={handleMat} castShadow>
        <boxGeometry args={[0.02, 0.4, 0.02]} />
      </mesh>
      <mesh position={[0.38, 1.804 / 2 - 0.45, 0.485]} material={handleMat} castShadow>
        <boxGeometry args={[0.02, 0.4, 0.02]} />
      </mesh>
    </group>
  );
}

function Refrigerator({ roomL }: { roomL: number }) {
  const fridgeDepth = 1.918 * 3.28;
  const fridgeWidth = 2.833 * 3.28;
  const lDepth = roomL * 0.55;
  
  const x = fridgeDepth / 2 + 0.02;
  const z = 12;
  
  return (
    <PremiumModel
      url="/models/kitchen/haier_refrigerator.glb"
      position={[0.8, 5.9, z]}
      rotation={[0, -Math.PI / 2 , 0]}
      scale={3.28}
      center={true}
      receiveShadows={false}
      fallback={<ProceduralRefrigerator />}
    />
  );
}

function ProceduralSink() {
  const faucet = chromeMat();
  const top = paintMat("#c0c0c0", 0.15); // metallic chrome/silver rim
  const basinMat = paintMat("#1a1a1a", 0.5); // dark grey basin interior
  
  return (
    <group>
      <mesh material={top} castShadow>
        <boxGeometry args={[0.862, 0.03, 0.5]} />
      </mesh>
      <mesh position={[0, -0.1, 0]} material={basinMat} castShadow>
        <boxGeometry args={[0.78, 0.2, 0.42]} />
      </mesh>
      <mesh position={[0, 0.15, -0.18]} material={faucet} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
      </mesh>
      <mesh position={[0, 0.3, -0.1]} material={faucet} castShadow rotation={[Math.PI / 3, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.18, 8]} />
      </mesh>
    </group>
  );
}

function Sink({ roomW, counterDepth }: { roomW: number; counterDepth: number }) {
  const x_sink = roomW * 0.85;
  const y = 4.3; // countertop surface height
  const z = counterDepth / 2;
  
  return (
    <PremiumModel
      url="/models/kitchen/kitchen_sink.glb"
      position={[x_sink, y, z]}
      rotation={[0, 0, 0]}
      scale={3.28}
      center={true}
      receiveShadows={false}
      fallback={<ProceduralSink />}
    />
  );
}

function CeilingLights({ roomW, roomL, roomH }: { roomW: number; roomL: number; roomH: number }) {
  const housing = paintMat("#f5f0e8", 0.45);
  const glow = emissiveMat("#fff8ee", 3);
  const positions: [number, number][] = [
    [roomW * 0.25, roomL * 0.3],
    [roomW * 0.75, roomL * 0.3],
    [roomW * 0.5, roomL * 0.65],
  ];
  return (
    <group>
      {positions.map(([x, z], i) => (
        <group key={i} position={[x, roomH - 0.15, z]}>
          <mesh material={housing} castShadow>
            <cylinderGeometry args={[0.22, 0.26, 0.06, 16]} />
          </mesh>
          <mesh position={[0, -0.05, 0]} material={glow}>
            <cylinderGeometry args={[0.16, 0.16, 0.02, 16]} />
          </mesh>
          <pointLight position={[0, -0.12, 0]} intensity={0.8} color="#fff5e0" distance={12} decay={2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0001} />
        </group>
      ))}
    </group>
  );
}

function KitchenWindow({ roomW, roomL, roomH }: Props) {
  const frame = woodMat("wood-ebony", [1, 1], 0.38);
  const glass = glassMat(0.18);
  return (
    <group position={[roomW / 2, roomH * 0.55, roomL - 0.05]}>
      <mesh material={frame} castShadow>
        <boxGeometry args={[3, roomH * 0.5, 0.1]} />
      </mesh>
      <mesh position={[0, 0, 0.02]} material={glass}>
        <planeGeometry args={[2.8, roomH * 0.48]} />
      </mesh>
      <pointLight position={[0, 0, 0.3]} intensity={0.5} color="#fff6e8" distance={8} decay={2} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.0001} />
    </group>
  );
}

function ProceduralDiningTable() {
  const wood = woodMat("wood-mahogany", [1, 1], 0.45);
  const chairMat = paintMat("#333333", 0.6);
  
  return (
    <group>
      {/* Table Top */}
      <mesh position={[0, 2.5, 0]} material={wood} castShadow receiveShadow>
        <boxGeometry args={[4.5, 0.15, 3.0]} />
      </mesh>
      {/* Table Legs */}
      <mesh position={[-2.1, 1.25, -1.3]} material={wood} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2.5, 8]} />
      </mesh>
      <mesh position={[2.1, 1.25, -1.3]} material={wood} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2.5, 8]} />
      </mesh>
      <mesh position={[-2.1, 1.25, 1.3]} material={wood} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2.5, 8]} />
      </mesh>
      <mesh position={[2.1, 1.25, 1.3]} material={wood} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2.5, 8]} />
      </mesh>
      
      {/* Simple Chairs */}
      {/* Chair 1 (Left) */}
      <group position={[-2.8, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 1.3, 0]} material={chairMat} castShadow>
          <boxGeometry args={[1.2, 0.1, 1.2]} />
        </mesh>
        <mesh position={[0.55, 2.6, 0]} material={chairMat} castShadow>
          <boxGeometry args={[0.1, 1.3, 1.2]} />
        </mesh>
      </group>
      {/* Chair 2 (Right) */}
      <group position={[2.8, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 1.3, 0]} material={chairMat} castShadow>
          <boxGeometry args={[1.2, 0.1, 1.2]} />
        </mesh>
        <mesh position={[0.55, 2.6, 0]} material={chairMat} castShadow>
          <boxGeometry args={[0.1, 1.3, 1.2]} />
        </mesh>
      </group>
    </group>
  );
}

function DiningTable({ roomW, roomL }: { roomW: number; roomL: number }) {
  const x = 12.5;
  const z = 13.5;
  
  return (
    <PremiumModel
      url="/models/kitchen/simple_dining_table-v1.glb"
      position={[x, 4, z]}
      rotation={[0, 0, 0]}
      scale={0.00328} // millimeter to feet scale conversion
      center={true}
      receiveShadows={false}
      fallback={<ProceduralDiningTable />}
    />
  );
}

function Flower() {
  const x = 14.5; // Right side of the table
  const y = 2.0; // On top of the table
  const z = 18; // Corner
  
  return (
    <PremiumModel
      url="/models/kitchen/flowers_in_pink_vase.glb"
      position={[x, y, z]}
      rotation={[0, 0, 0]}
      scale={0.004}
      center={true}
      receiveShadows={false}
    />
  );
}

export default function KitchenFurnishings({ roomW, roomL, roomH, counterDepth }: Props) {
  const lDepth = roomL * 0.55;
  return (
    <group>
      <CeilingLights roomW={roomW} roomL={roomL} roomH={roomH} />
      <KitchenWindow roomW={roomW} roomL={roomL} roomH={roomH} counterDepth={counterDepth} />
      <Refrigerator roomL={roomL} />
      <Sink roomW={roomW} counterDepth={counterDepth} />
      <DiningTable roomW={roomW} roomL={roomL} />
      <Flower />
      
      {/* Decorative painting on the left plain wall */}
      <Painting 
        x={0.08} 
        y={roomH * 0.55} 
        z={((lDepth + 2.73) + roomL) / 2} 
        rotY={Math.PI / 2} 
        w={2.0} 
        h={2.5} 
        url="/models/kitchen/kitchen_painting.jpg" 
      />
    </group>
  );
}
