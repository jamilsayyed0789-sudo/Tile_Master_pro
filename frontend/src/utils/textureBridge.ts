const STORAGE_PREFIX = 'tilebox_pending_';

export const TEXTURE_SLOTS = {
  roomFloor: 'room_floor',
  roomWall: 'room_wall',
  kitchenFloor: 'kitchen_floor',
  kitchenBacksplash: 'kitchen_backsplash',
  kitchenCountertop: 'kitchen_countertop',
  bathroomFloor: 'bathroom_floor',
  bathroomWall: 'bathroom_wall', // legacy
  bathroomDark: 'bathroom_dark',
  bathroomLight: 'bathroom_light',
  bathroomHighlighter: 'bathroom_highlighter',
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
  
  let resultUrl = path;

  // If it's not already an absolute URL, build it
  if (!path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('data:')) {
    const configured = process.env.NEXT_PUBLIC_API_URL;
    if (configured) {
      resultUrl = `${configured}${path.startsWith('/') ? path : '/' + path}`;
    } else {
      const base = typeof window !== 'undefined'
        ? window.location.origin
        : 'http://127.0.0.1:8001';
      resultUrl = `${base}${path.startsWith('/') ? path : '/' + path}`;
    }
  }

  // Upgrade http to https if we are on an https site (and not localhost)
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (resultUrl.startsWith('http://') && !resultUrl.includes('localhost') && !resultUrl.includes('127.0.0.1')) {
      resultUrl = resultUrl.replace('http://', 'https://');
    }
  }

  return resultUrl;
}
