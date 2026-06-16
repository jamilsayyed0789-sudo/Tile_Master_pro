"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type CameraPreset = "front" | "top" | "corner" | "entrance" | "360" | "reset";

interface Props {
  preset: CameraPreset | null;
  onPresetComplete?: () => void;
  roomWidth: number;
  roomLength: number;
  roomHeight: number;
}

export default function CameraController({ preset, onPresetComplete, roomWidth, roomLength, roomHeight }: Props) {
  const { camera, controls } = useThree();
  const animating = useRef(false);
  const animData = useRef({
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    t: 0,
  });

  useEffect(() => {
    if (!preset || !controls) return;

    const cx = roomWidth / 2;
    const cy = roomHeight / 2;
    const cz = roomLength / 2;
    const maxDim = Math.max(roomWidth, roomLength, roomHeight);

    const presets: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
      front: { position: [cx, cy * 0.6, cz + maxDim * 1.6], target: [cx, cy * 0.7, cz] },
      top: { position: [cx, cy + maxDim * 1.2, cz], target: [cx, 0, cz] },
      corner: { position: [cx + roomWidth * 0.9, cy * 0.6, cz + roomLength * 0.9], target: [cx, cy * 0.6, cz] },
      entrance: { position: [cx, cy * 0.5, cz + roomLength * 1.8], target: [cx, cy * 0.7, cz] },
      "360": { position: [cx + roomWidth * 0.6, cy * 0.3, cz + roomLength * 1.2], target: [cx, cy * 0.6, cz] },
      reset: { position: [cx + 2, cy * 0.6, cz + roomLength * 0.3], target: [cx, cy * 0.7, cz] },
    };

    const p = presets[preset];
    if (!p) return;

    const ctrl = controls as unknown as THREE.EventDispatcher & { target: THREE.Vector3; update: () => void };

    animData.current = {
      startPos: camera.position.clone(),
      endPos: new THREE.Vector3(...p.position),
      startTarget: ctrl.target.clone(),
      endTarget: new THREE.Vector3(...p.target),
      t: 0,
    };
    animating.current = true;
  }, [preset, camera, controls, roomWidth, roomLength, roomHeight]);

  useFrame((_, delta) => {
    if (!animating.current || !controls) return;
    animData.current.t += delta * (animData.current.t < 0.5 ? 1.2 : 0.8);
    if (animData.current.t >= 1) {
      animData.current.t = 1;
      animating.current = false;
      onPresetComplete?.();
    }
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const t = ease(Math.min(1, animData.current.t));
    const ctrl = controls as unknown as THREE.EventDispatcher & { target: THREE.Vector3; update: () => void };
    camera.position.lerpVectors(animData.current.startPos, animData.current.endPos, t);
    ctrl.target.lerpVectors(animData.current.startTarget, animData.current.endTarget, t);
    ctrl.update();
  });

  return null;
}
