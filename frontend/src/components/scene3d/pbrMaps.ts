"use client";

import * as THREE from "three";

const normalCache = new Map<string, THREE.CanvasTexture>();
const roughnessCache = new Map<string, THREE.CanvasTexture>();

function luminance(r: number, g: number, b: number) {
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
}

/** Sobel-style normal map from a colour/albedo canvas (cached). */
export function normalMapFromCanvas(
  source: HTMLCanvasElement,
  key: string,
  strength = 2.5,
  repeat: [number, number] = [1, 1]
): THREE.CanvasTexture {
  const cacheKey = `${key}-n-${strength}-${repeat.join()}`;
  const hit = normalCache.get(cacheKey);
  if (hit) return hit;

  const w = source.width;
  const h = source.height;
  const src = source.getContext("2d")!.getImageData(0, 0, w, h).data;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const nCtx = out.getContext("2d")!;
  const normalData = nCtx.createImageData(w, h);

  const heightAt = (x: number, y: number) => {
    const ix = Math.min(w - 1, Math.max(0, x));
    const iy = Math.min(h - 1, Math.max(0, y));
    const i = (iy * w + ix) * 4;
    return luminance(src[i], src[i + 1], src[i + 2]);
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = heightAt(x + 1, y) - heightAt(x - 1, y);
      const dy = heightAt(x, y + 1) - heightAt(x, y - 1);
      const nx = -dx * strength;
      const ny = -dy * strength;
      const nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      const i = (y * w + x) * 4;
      normalData.data[i] = Math.round((nx / len) * 0.5 * 255 + 128);
      normalData.data[i + 1] = Math.round((ny / len) * 0.5 * 255 + 128);
      normalData.data[i + 2] = Math.round((nz / len) * 0.5 * 255 + 128);
      normalData.data[i + 3] = 255;
    }
  }
  nCtx.putImageData(normalData, 0, 0);

  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.needsUpdate = true;
  normalCache.set(cacheKey, tex);
  return tex;
}

/** Procedural roughness map — darker = smoother, lighter = rougher. */
export function roughnessMapFromCanvas(
  source: HTMLCanvasElement,
  key: string,
  baseRoughness: number,
  variation: number,
  repeat: [number, number] = [1, 1]
): THREE.CanvasTexture {
  const cacheKey = `${key}-r-${baseRoughness}-${variation}-${repeat.join()}`;
  const hit = roughnessCache.get(cacheKey);
  if (hit) return hit;

  const w = source.width;
  const h = source.height;
  const src = source.getContext("2d")!.getImageData(0, 0, w, h).data;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const rCtx = out.getContext("2d")!;
  const img = rCtx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = luminance(src[i], src[i + 1], src[i + 2]);
      const noise = ((x * 17 + y * 31) % 97) / 97;
      const r = Math.min(255, Math.max(0, (baseRoughness + (lum - 0.5) * variation + (noise - 0.5) * 0.08) * 255));
      img.data[i] = r;
      img.data[i + 1] = r;
      img.data[i + 2] = r;
      img.data[i + 3] = 255;
    }
  }
  rCtx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.needsUpdate = true;
  roughnessCache.set(cacheKey, tex);
  return tex;
}
