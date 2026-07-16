"use client";

import * as THREE from "three";
import {
  getWoodTexture,
  getWoodNormalMap,
  getWoodRoughnessMap,
  getMarbleTexture,
  getMarbleNormalMap,
  getMarbleRoughnessMap,
  getFabricTexture,
  getFabricNormalMap,
  getLeatherTexture,
  getBrushedMetalTexture,
  getConcreteTexture,
  getCarpetTexture,
} from "@/components/proceduralTextures";

const matCache = new Map<string, THREE.Material>();

function cached<T extends THREE.Material>(key: string, factory: () => T): T {
  const hit = matCache.get(key);
  if (hit) return hit as T;
  const m = factory();
  matCache.set(key, m);
  return m;
}

// Upgraded to MeshPhysicalMaterial for advanced PBR features (clearcoat, iridescence, etc.)

export function woodMat(key = "wood-walnut", repeat: [number, number] = [2, 2], roughness = 0.55) {
  return cached(`wood-v2-${key}-${repeat.join()}-${roughness}`, () => {
    return new THREE.MeshPhysicalMaterial({
      map: getWoodTexture(key, repeat),
      normalMap: getWoodNormalMap(key, repeat),
      roughnessMap: getWoodRoughnessMap(key, repeat),
      roughness: roughness,
      metalness: 0.05,
      clearcoat: 0.1, // Slight varnish
      clearcoatRoughness: 0.3,
      envMapIntensity: 1.5,
    });
  });
}

export function marbleMat(key = "marble-cream", repeat: [number, number] = [1.5, 1.5]) {
  return cached(`marble-v2-${key}-${repeat.join()}`, () =>
    new THREE.MeshPhysicalMaterial({
      map: getMarbleTexture(key, repeat),
      normalMap: getMarbleNormalMap(key, repeat),
      roughnessMap: getMarbleRoughnessMap(key, repeat),
      roughness: 0.05, // Very polished marble
      metalness: 0.02,
      clearcoat: 1.0,  // High polish clearcoat
      clearcoatRoughness: 0.02,
      envMapIntensity: 2.0, // High reflection from HDRI
    })
  );
}

export function fabricMat(key = "fabric-charcoal", repeat: [number, number] = [3, 3]) {
  return cached(`fabric-v2-${key}-${repeat.join()}`, () =>
    new THREE.MeshStandardMaterial({
      map: getFabricTexture(key, repeat),
      normalMap: getFabricNormalMap(key, repeat),
      roughness: 0.98,
      metalness: 0,
      envMapIntensity: 0.2, // Low reflection
    })
  );
}

export function leatherMat(key = "leather-brown") {
  return cached(`leather-v2-${key}`, () =>
    new THREE.MeshPhysicalMaterial({
      map: getLeatherTexture(key),
      roughness: 0.5,
      metalness: 0.1,
      clearcoat: 0.2,
      clearcoatRoughness: 0.5,
      envMapIntensity: 1.0,
    })
  );
}

export function chromeMat() {
  return cached("chrome-v2", () =>
    new THREE.MeshPhysicalMaterial({
      map: getBrushedMetalTexture("metal-chrome"),
      roughness: 0.05,
      metalness: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 2.5, // Strong reflections
    })
  );
}

export function goldMat() {
  return cached("gold-v2", () =>
    new THREE.MeshPhysicalMaterial({
      map: getBrushedMetalTexture("metal-gold"),
      roughness: 0.15,
      metalness: 1.0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      envMapIntensity: 2.0,
      color: "#ffd700",
    })
  );
}

export function concreteMat() {
  return cached("concrete-v2", () =>
    new THREE.MeshStandardMaterial({
      map: getConcreteTexture([2, 2]),
      roughness: 0.9,
      metalness: 0,
      envMapIntensity: 0.5,
    })
  );
}

export function carpetMat() {
  return cached("carpet-v2", () =>
    new THREE.MeshStandardMaterial({
      map: getCarpetTexture([4, 4]),
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.1,
    })
  );
}

export function glassMat(opacity = 0.22) {
  return cached(`glass-v2-${opacity}`, () =>
    new THREE.MeshPhysicalMaterial({
      color: "#f0f8ff", // Alice blue (much lighter tint)
      transparent: true,
      opacity: Math.max(0.1, opacity - 0.05), // Slightly more transparent
      roughness: 0.02, // Clearer glass
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      envMapIntensity: 0.8, // Drastically reduce glare so tiles behind are visible
    })
  );
}

export function flutedGlassMat(opacity = 0.3) {
  return cached(`fluted-glass-v2-${opacity}`, () => {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const ctx = c.getContext("2d")!;
    for (let x = 0; x < 256; x++) {
      const v = Math.sin((x / 256) * Math.PI * 60); // 30 ribs
      const intensity = Math.floor(((v + 1) / 2) * 255);
      ctx.fillStyle = `rgb(${intensity},${intensity},${intensity})`;
      ctx.fillRect(x, 0, 1, 256);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 1);
    tex.needsUpdate = true;

    return new THREE.MeshPhysicalMaterial({
      color: "#f8fdff",
      transparent: true,
      opacity: opacity,
      roughness: 0.15,
      metalness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      bumpMap: tex,
      bumpScale: 0.02,
      envMapIntensity: 1.5,
    });
  });
}

export function mirrorMat() {
  return cached("mirror-v2", () =>
    new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      roughness: 0.0,
      metalness: 1.0,
      envMapIntensity: 3.0,
      clearcoat: 1,
      clearcoatRoughness: 0.0,
    })
  );
}

export function emissiveMat(color: string, intensity = 5) {
  return cached(`emissive-v2-${color}-${intensity}`, () =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.2,
      envMapIntensity: 0.5,
    })
  );
}

export function paintMat(color: string, roughness = 0.5) {
  return cached(`paint-v2-${color}-${roughness}`, () =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness,
      metalness: 0.05,
      clearcoat: 0.2,
      clearcoatRoughness: 0.5,
      envMapIntensity: 0.8,
    })
  );
}

export function texturedPaintMat(color: string) {
  return cached(`textured-paint-${color}`, () => {
    // Generate a strong stucco/plaster bump map
    const c = document.createElement("canvas");
    c.width = 1024; c.height = 1024;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 40000; i++) {
      const v = Math.random();
      ctx.fillStyle = `rgba(${v>0.5?255:0},${v>0.5?255:0},${v>0.5?255:0},${Math.random()*0.15})`;
      ctx.beginPath();
      ctx.arc(Math.random()*1024, Math.random()*1024, Math.random()*4, 0, Math.PI*2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.needsUpdate = true;

    return new THREE.MeshPhysicalMaterial({
      color,
      bumpMap: tex,
      bumpScale: 0.02,
      roughness: 0.9,
      metalness: 0.0,
      clearcoat: 0.0,
      envMapIntensity: 0.4,
    });
  });
}

export function backlitGroovedMarbleMat() {
  return cached(`backlit-grooved-marble`, () => {
    // Generate the criss-crossing grooved pattern
    const c = document.createElement("canvas");
    c.width = 1024; c.height = 1024;
    const ctx = c.getContext("2d")!;
    
    // Fill background with black (no emission)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Draw the glowing grooves (white)
    ctx.fillStyle = "#ffffff";
    
    // Create an irregular grid pattern
    const lineCount = 12;
    for (let i = 0; i < lineCount; i++) {
      // Horizontal lines
      const y = (i / lineCount) * 1024 + (Math.random() * 40 - 20);
      ctx.fillRect(0, y, 1024, 4); // 4px thick glow
      
      // Vertical lines
      const x = (i / lineCount) * 1024 + (Math.random() * 40 - 20);
      ctx.fillRect(x, 0, 4, 1024);
    }
    
    // Add some random staggered lines to match the reference's broken grid look
    for (let i = 0; i < 20; i++) {
      if (Math.random() > 0.5) {
        // Short horizontal segment
        const y = Math.random() * 1024;
        const x = Math.random() * 1024;
        ctx.fillRect(x, y, Math.random() * 300 + 100, 4);
      } else {
        // Short vertical segment
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        ctx.fillRect(x, y, 4, Math.random() * 300 + 100);
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 2);
    tex.needsUpdate = true;

    return new THREE.MeshPhysicalMaterial({
      color: "#EAE3D8", // Warm beige travertine base
      roughness: 0.2, // Shiny like marble
      metalness: 0.05,
      clearcoat: 0.5,
      emissive: "#ffdfa0", // Warm golden glow
      emissiveMap: tex,
      emissiveIntensity: 2.5, // Bright glow
    });
  });
}
