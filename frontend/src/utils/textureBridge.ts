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

  // If the path contains our API endpoint, always return a relative URL.
  // This ensures Next.js proxy handles the request, avoiding WebGL CORS issues
  // in 3D rooms when TextureLoader attempts to fetch the image.
  if (resultUrl.includes('/api/local/image')) {
    try {
      const urlObj = new URL(resultUrl, 'http://dummy.com');
      return `/api/local/image${urlObj.search}`;
    } catch (e) {
      return resultUrl;
    }
  }

  // Fallback for non-local paths (e.g. external URLs)
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

  return resultUrl;
}
