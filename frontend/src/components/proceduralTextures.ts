"use client";
import * as THREE from "three";
import { normalMapFromCanvas, roughnessMapFromCanvas } from "@/components/scene3d/pbrMaps";

const cache = new Map<string, THREE.CanvasTexture>();
const TEX_SIZE = 1024;

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function finish(canvas: HTMLCanvasElement, key: string, repeat: [number, number]): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 16;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

export function getWoodTexture(key = "wood-walnut", repeat: [number, number] = [1, 1]): THREE.CanvasTexture {
  const cacheKey = `wood-${key}-${repeat[0]}-${repeat[1]}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const w = TEX_SIZE;
  const h = TEX_SIZE;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const palettes: Record<string, { base: string; dark: string; light: string }> = {
    "wood-walnut": { base: "#3a2418", dark: "#1a0e08", light: "#5a3a22" },
    "wood-oak": { base: "#a07850", dark: "#6a4828", light: "#c89a70" },
    "wood-ebony": { base: "#1a1410", dark: "#0a0805", light: "#2a221c" },
    "wood-mahogany": { base: "#4a1a0a", dark: "#2a0a05", light: "#6a2a1a" },
  };
  const p = palettes[key] || palettes["wood-walnut"];
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 1) {
    const noise = Math.sin(y * 0.028) * 10 + Math.sin(y * 0.009) * 14;
    const grain = (Math.random() - 0.5) * 5;
    ctx.fillStyle = y % 5 < 2 ? p.dark : p.light;
    ctx.fillRect(0, y + noise + grain, w, 1.2);
  }
  for (let i = 0; i < 140; i++) {
    const y = Math.random() * h;
    ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? "20,10,5" : "120,80,50"},${0.1 + Math.random() * 0.22})`;
    ctx.lineWidth = 0.4 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < w; x += 12) {
      ctx.lineTo(x, y + (Math.random() - 0.5) * 5);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  return finish(c, cacheKey, repeat);
}

export function getWoodNormalMap(key = "wood-walnut", repeat: [number, number] = [1, 1]) {
  const albedo = getWoodTexture(key, repeat);
  const canvas = albedo.image as HTMLCanvasElement;
  return normalMapFromCanvas(canvas, `wood-${key}`, 3.2, repeat);
}

export function getWoodRoughnessMap(key = "wood-walnut", repeat: [number, number] = [1, 1]) {
  const albedo = getWoodTexture(key, repeat);
  return roughnessMapFromCanvas(albedo.image as HTMLCanvasElement, `wood-${key}`, 0.52, 0.28, repeat);
}

export function getMarbleTexture(key = "marble-cream", repeat: [number, number] = [1, 1]): THREE.CanvasTexture {
  const cacheKey = `marble-${key}-${repeat[0]}-${repeat[1]}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const w = TEX_SIZE;
  const h = TEX_SIZE;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const palettes: Record<string, { base: string; vein: string }> = {
    "marble-cream": { base: "#f0e8d8", vein: "#8a7a6a" },
    "marble-white": { base: "#f5f3f0", vein: "#5a5a5a" },
    "marble-black": { base: "#1a1a1a", vein: "#3a3a3a" },
    "marble-emperador": { base: "#3a2418", vein: "#a08060" },
    "epoxy-marble": { base: "#ffffff", vein: "#111111" },
  };
  const p = palettes[key] || palettes["marble-cream"];
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 18; i++) {
    const vr = parseInt(p.vein.slice(1, 3), 16);
    const vg = parseInt(p.vein.slice(3, 5), 16);
    const vb = parseInt(p.vein.slice(5, 7), 16);
    ctx.strokeStyle = `rgba(${vr},${vg},${vb},${key === "epoxy-marble" ? 0.6 : 0.18 + Math.random() * 0.28})`;
    ctx.lineWidth = key === "epoxy-marble" ? 2.0 + Math.random() * 4.0 : 0.6 + Math.random() * 2.5;
    ctx.beginPath();
    let x = Math.random() * w;
    let y = Math.random() * h;
    ctx.moveTo(x, y);
    for (let j = 0; j < 12; j++) {
      x += (Math.random() - 0.5) * 180;
      y += (Math.random() - 0.5) * 180;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 50; i++) {
    ctx.strokeStyle = `rgba(${parseInt(p.vein.slice(1, 3), 16)},${parseInt(p.vein.slice(3, 5), 16)},${parseInt(p.vein.slice(5, 7), 16)},${0.06 + Math.random() * 0.12})`;
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.lineTo(Math.random() * w, Math.random() * h);
    ctx.stroke();
  }
  for (let i = 0; i < 8000; i++) {
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},${Math.random() * 0.035})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  return finish(c, cacheKey, repeat);
}

export function getMarbleNormalMap(key = "marble-cream", repeat: [number, number] = [1, 1]) {
  const albedo = getMarbleTexture(key, repeat);
  return normalMapFromCanvas(albedo.image as HTMLCanvasElement, `marble-${key}`, 2.8, repeat);
}

export function getMarbleRoughnessMap(key = "marble-cream", repeat: [number, number] = [1, 1]) {
  const albedo = getMarbleTexture(key, repeat);
  return roughnessMapFromCanvas(albedo.image as HTMLCanvasElement, `marble-${key}`, 0.16, 0.2, repeat);
}

export function getFabricTexture(key = "fabric-charcoal", repeat: [number, number] = [4, 4]): THREE.CanvasTexture {
  const cacheKey = `fabric-${key}-${repeat[0]}-${repeat[1]}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const w = 512;
  const h = 512;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const palettes: Record<string, { base: string; tint: string }> = {
    "fabric-charcoal": { base: "#2a2a2a", tint: "#3a3a3a" },
    "fabric-cream": { base: "#d8d0c0", tint: "#c0b8a8" },
    "fabric-taupe": { base: "#8a7a6a", tint: "#6a5a4a" },
    "fabric-sage": { base: "#6a7a5a", tint: "#5a6a4a" },
  };
  const p = palettes[key] || palettes["fabric-charcoal"];
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, w, h);
  const step = 2;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const phase = (x + y) % (step * 2) === 0 ? 0.18 : -0.12;
      const tr = parseInt(p.tint.slice(1, 3), 16);
      const tg = parseInt(p.tint.slice(3, 5), 16);
      const tb = parseInt(p.tint.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${tr},${tg},${tb},${Math.abs(phase)})`;
      ctx.fillRect(x, y, step, step);
    }
  }
  for (let i = 0; i < 8000; i++) {
    const dark = Math.random() > 0.5;
    ctx.fillStyle = `rgba(${dark ? "0,0,0" : "255,255,255"},${Math.random() * 0.09})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  return finish(c, cacheKey, repeat);
}

export function getFabricNormalMap(key = "fabric-charcoal", repeat: [number, number] = [4, 4]) {
  const albedo = getFabricTexture(key, repeat);
  return normalMapFromCanvas(albedo.image as HTMLCanvasElement, `fabric-${key}`, 1.8, repeat);
}

export function getLeatherTexture(key = "leather-brown", repeat: [number, number] = [3, 3]): THREE.CanvasTexture {
  const cacheKey = `leather-${key}-${repeat[0]}-${repeat[1]}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const w = 512;
  const h = 512;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const palettes: Record<string, { base: string; dark: string }> = {
    "leather-brown": { base: "#4a2a1a", dark: "#2a1a0a" },
    "leather-black": { base: "#1a1a1a", dark: "#0a0a0a" },
    "leather-tan": { base: "#a07050", dark: "#6a4828" },
  };
  const p = palettes[key] || palettes["leather-brown"];
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 1 + Math.random() * 3.5;
    const dr = parseInt(p.dark.slice(1, 3), 16);
    const dg = parseInt(p.dark.slice(3, 5), 16);
    const db = parseInt(p.dark.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${dr},${dg},${db},${0.28 + Math.random() * 0.42})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? "0,0,0" : "255,255,255"},${Math.random() * 0.07})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  return finish(c, cacheKey, repeat);
}

export function getBrushedMetalTexture(key = "metal-chrome", repeat: [number, number] = [2, 2]): THREE.CanvasTexture {
  const cacheKey = `metal-${key}-${repeat[0]}-${repeat[1]}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const w = 512;
  const h = 512;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const palettes: Record<string, string> = {
    "metal-chrome": "#cccccc",
    "metal-gold": "#c9a36a",
    "metal-rose-gold": "#b87a6a",
    "metal-black": "#1a1a1a",
  };
  const base = palettes[key] || palettes["metal-chrome"];
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y++) {
    const v = 0.82 + Math.random() * 0.18;
    ctx.fillStyle = `rgba(255,255,255,${(v - 0.82) * 2.5})`;
    ctx.fillRect(0, y, w, 1);
  }
  return finish(c, cacheKey, repeat);
}

export function getConcreteTexture(repeat: [number, number] = [2, 2]): THREE.CanvasTexture {
  const cacheKey = `concrete-${repeat[0]}-${repeat[1]}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const w = 512;
  const h = 512;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#a8a8a4";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 6000; i++) {
    const v = Math.random();
    ctx.fillStyle = `rgba(${v > 0.5 ? "255,255,255" : "0,0,0"},${Math.random() * 0.09})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  return finish(c, cacheKey, repeat);
}

export function getCarpetTexture(repeat: [number, number] = [3, 3]): THREE.CanvasTexture {
  const cacheKey = `carpet-${repeat[0]}-${repeat[1]}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const w = 512;
  const h = 512;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#5a4a3a";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 20000; i++) {
    const v = 0.65 + Math.random() * 0.35;
    ctx.fillStyle = `rgba(${Math.floor(80 * v)},${Math.floor(60 * v)},${Math.floor(40 * v)},${0.55})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  return finish(c, cacheKey, repeat);
}
