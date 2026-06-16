"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Color } from "three";

type Preset = "apartment" | "studio" | "city";

/**
 * HDR image-based lighting via drei Environment presets.
 * Provides photorealistic ambient reflections for PBR tile and furniture materials.
 */
export default function RoomEnvironmentSetup({
  intensity = 0.6,
  preset = "apartment",
}: {
  intensity?: number;
  preset?: Preset;
}) {
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    scene.background = new Color("#0e0e14");
    scene.environmentIntensity = intensity;
    return () => {
      scene.background = null;
      scene.environmentIntensity = 1;
    };
  }, [scene, intensity]);

  return (
    <Environment
      preset={preset}
      background={false}
      environmentIntensity={intensity}
      blur={0.35}
    />
  );
}
