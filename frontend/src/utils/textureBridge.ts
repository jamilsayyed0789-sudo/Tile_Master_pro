const STORAGE_PREFIX = 'tilebox_pending_';

export const TEXTURE_SLOTS = {
  roomFloor: 'room_floor',
  roomWall: 'room_wall',
  kitchenFloor: 'kitchen_floor',
  kitchenBacksplash: 'kitchen_backsplash',
  kitchenCountertop: 'kitchen_countertop',
  bathroomFloor: 'bathroom_floor',
  bathroomWall: 'bathroom_wall',
  elevationWall: 'elevation_wall',
} as const;

export interface PendingTexture {
  url: string;
  name: string;
  tileCode?: string;
}

export function setPendingTexture(slot: string, data: PendingTexture) {
  localStorage.setItem(STORAGE_PREFIX + slot, JSON.stringify(data));
}

export function getPendingTexture(slot: string): PendingTexture | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + slot);
    return raw ? (JSON.parse(raw) as PendingTexture) : null;
  } catch {
    return null;
  }
}

export function clearPendingTexture(slot: string) {
  localStorage.removeItem(STORAGE_PREFIX + slot);
}

export function buildTileUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const base = typeof window !== 'undefined'
    ? `${window.location.protocol}//127.0.0.1:8000`
    : 'http://127.0.0.1:8000';
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
}
