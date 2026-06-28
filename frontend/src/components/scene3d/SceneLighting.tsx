"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

type SceneKind = "living" | "bathroom" | "kitchen";

type SceneLightingProps = {
  roomW: number;
  roomL: number;
  sunPosition?: [number, number, number];
  envIntensity?: number;
  ambient?: number;
  sceneKind?: SceneKind;
};

const SCENE_PRESETS: Record<SceneKind, { preset: "apartment" | "studio" | "city"; env: number; ambient: number }> = {
  living: { preset: "studio", env: 0.35, ambient: 0.18 },
  bathroom: { preset: "studio", env: 0.25, ambient: 0.12 },
  kitchen: { preset: "studio", env: 0.35, ambient: 0.18 },
};

export function SceneRendererSetup() {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.8;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);

  return null;
}

export default function SceneLighting({
  roomW,
  roomL,
  sunPosition,
  envIntensity,
  ambient,
  sceneKind = "living",
}: SceneLightingProps) {
  const cx = roomW / 2;
  const cz = roomL / 2;
  const preset = SCENE_PRESETS[sceneKind];
  const sun = sunPosition ?? [roomW + 6, 12, roomL + 4];
  const env = envIntensity ?? preset.env;
  const amb = ambient ?? preset.ambient;

  return (
    <>
      <SceneRendererSetup />
      
      {/* High Quality HDRI Environment for realistic reflections and ambient light */}
      <Environment preset={preset.preset} environmentIntensity={env} />
      
      <ambientLight intensity={amb * 0.6} color="#f8f8f8" />
      <hemisphereLight args={["#e8e8e8", "#b0b0b0", 0.25]} />
      
      {/* Primary Directional Sunlight with Soft Shadows */}
      <directionalLight
        position={sun}
        intensity={0.55}
        color="#fff8f4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-roomW * 1.5}
        shadow-camera-right={roomW * 2.5}
        shadow-camera-top={roomL * 2.5}
        shadow-camera-bottom={-roomL * 1.5}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-bias={-0.001}
        shadow-radius={6}
      />
      
      {/* Fill Lights — slightly warm neutral */}
      <directionalLight position={[-roomW * 0.5, 8, -roomL * 0.5]} intensity={0.15} color="#f0f0f0" />
      <pointLight position={[cx, 8, cz]} intensity={0.12} color="#f5f5f0" distance={40} decay={2} />
      
      {sceneKind === "bathroom" && (
        <pointLight position={[roomW * 0.75, 5, roomL * 0.2]} intensity={0.15} color="#e8f4ff" distance={15} decay={2} />
      )}
      {sceneKind === "kitchen" && (
        <pointLight position={[roomW * 0.4, 5.5, roomL * 0.25]} intensity={0.5} color="#fff8e8" distance={20} decay={2} />
      )}
      
      {/* Contact Shadows for grounding objects naturally */}
      <ContactShadows
        position={[cx, 0.02, cz]}
        opacity={0.8}
        scale={Math.max(roomW, roomL) * 2.5}
        blur={2.5}
        far={10}
        resolution={1024}
        color="#0a0a0a"
      />

    </>
  );
}
