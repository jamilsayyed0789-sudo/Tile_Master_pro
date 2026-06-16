"use client";

import * as THREE from "three";

type GlassWallProps = {
  width: number;
  height: number;
  position: [number, number, number];
  rotation?: [number, number, number];
};

/** Physically-based glass partition — visual upgrade for showroom front walls. */
export default function GlassWall({ width, height, position, rotation = [0, 0, 0] }: GlassWallProps) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshPhysicalMaterial
        color="#c8e8ff"
        transparent
        opacity={0.18}
        roughness={0.04}
        metalness={0}
        transmission={0.88}
        thickness={0.04}
        ior={1.52}
        envMapIntensity={1.3}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
