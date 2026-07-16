"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useState, ReactNode } from "react";

export default function ClickToFocus({ children }: { children: ReactNode }) {
  const { controls, camera } = useThree();
  const [targetPoint, setTargetPoint] = useState<THREE.Vector3 | null>(null);

  const handleClick = (e: any) => {
    // e.delta is the distance the pointer moved. If it's > 2, the user was probably dragging/orbiting.
    if (e.delta <= 2) {
      e.stopPropagation();
      setTargetPoint(e.point.clone());
    }
  };

  useFrame((_, delta) => {
    if (targetPoint && controls) {
      const ctrl = controls as any;
      
      // Smoothly animate the target
      ctrl.target.lerp(targetPoint, 5 * delta);
      ctrl.update();

      // Stop animating when we get close enough
      if (ctrl.target.distanceTo(targetPoint) < 0.01) {
        setTargetPoint(null);
      }
    }
  });

  return (
    <group onClick={handleClick} onDoubleClick={handleClick}>
      {children}
    </group>
  );
}
