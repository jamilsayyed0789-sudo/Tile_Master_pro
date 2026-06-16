"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface HotspotDef {
  id: string;
  position: [number, number, number];
  label: string;
}

interface Props {
  hotspots: HotspotDef[];
}

function HotspotDot({ hotspot }: { hotspot: HotspotDef }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const pulseRef = useRef(0);

  useFrame((_, delta) => {
    pulseRef.current += delta * 2;
    const phase = Math.sin(pulseRef.current);
    if (ringRef.current) {
      const scale = 1 + phase * 0.2;
      ringRef.current.scale.setScalar(hovered ? scale * 1.3 : scale);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = hovered ? 0.85 : 0.3 + (phase * 0.5 + 0.5) * 0.2;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + phase * 0.15);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = hovered ? 0.3 : 0.08 + (phase * 0.5 + 0.5) * 0.08;
    }
  });

  return (
    <group position={hotspot.position}>
      <mesh
        ref={glowRef}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <ringGeometry args={[0.1, 0.14, 32]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function HotspotSystem({ hotspots }: Props) {
  return (
    <group>
      {hotspots.map((h) => (
        <HotspotDot key={h.id} hotspot={h} />
      ))}
    </group>
  );
}
