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
  // Already an absolute URL or data URI — return as-is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;

  // If NEXT_PUBLIC_API_URL is explicitly configured, use it
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) {
    return `${configured}${path.startsWith('/') ? path : '/' + path}`;
  }

  // In the browser, use the current page origin so relative /api/... paths
  // always hit the same server (works on both production and localhost)
  const base = typeof window !== 'undefined'
    ? window.location.origin   // e.g. https://tile-master-pro.up.railway.app
    : 'http://127.0.0.1:8001'; // SSR fallback only

  return `${base}${path.startsWith('/') ? path : '/' + path}`;
}
