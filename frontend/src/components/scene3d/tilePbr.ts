/** Shared PBR tuning for tile surfaces — visual only, does not affect UV/repeat logic. */

// Upgraded to use physical properties for hyper-realism
export const TILE_FLOOR_PBR = {
  roughness: 0.85,       // Matte — no shine
  metalness: 0.0,
  envMapIntensity: 0.0,  // No environment reflection
  clearcoat: 0.0,        // No clearcoat gloss
  clearcoatRoughness: 1.0,
} as const;

export const TILE_WALL_PBR = {
  roughness: 0.18, 
  metalness: 0.02,
  envMapIntensity: 0.5,
  clearcoat: 0.3,
  clearcoatRoughness: 0.1,
} as const;

export const TILE_MATTE_PBR = {
  roughness: 0.85,
  metalness: 0.0,
  envMapIntensity: 0.4,
  clearcoat: 0.0,
} as const;

export const INTERIOR_PAINT_PBR = {
  roughness: 0.8,
  metalness: 0,
  envMapIntensity: 0.3,
} as const;

export const COUNTERTOP_PBR = {
  roughness: 0.1,
  metalness: 0.1,
  envMapIntensity: 2.5,
  clearcoat: 1.0,
  clearcoatRoughness: 0.02,
} as const;
