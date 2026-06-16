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
