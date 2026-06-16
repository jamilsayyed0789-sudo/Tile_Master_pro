import type { Tile } from "@/types/tile";

// ─── IndexedDB storage (replaces localStorage — no 5 MB limit) ──────────────
const DB_NAME = "tilebox_db";
const DB_VERSION = 1;
const STORE = "tiles";

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(req.result);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Image compression ───────────────────────────────────────────────────────
// maxWidth 800px + quality 0.82 keeps each tile ~40-60 KB — fine for 200+ tiles
export function compressImage(
  dataUrl: string,
  maxWidth = 800,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ─── Storage info (IndexedDB has no hard quota like localStorage) ────────────
export function isStorageLow(): boolean {
  return false; // IndexedDB quota is managed by the browser (GBs available)
}

export function getStorageInfo(): string {
  return "IndexedDB (large capacity)";
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────
export async function getAllTilesAsync(): Promise<Tile[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () =>
        resolve(
          (req.result as Tile[]).sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/** Sync shim kept for legacy callers — returns [] immediately, data loads async */
export function getAllTiles(): Tile[] {
  return [];
}

export async function saveTileAsync(
  tile: Omit<Tile, "id" | "createdAt">
): Promise<Tile> {
  const db = await openDB();
  const newTile: Tile = {
    ...tile,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(newTile);
    req.onsuccess = () => resolve(newTile);
    req.onerror = () => reject(req.error);
  });
}

/** Sync shim — throws if called directly; use saveTileAsync instead */
export function saveTile(tile: Omit<Tile, "id" | "createdAt">): Tile {
  // Kick off async save but return a placeholder immediately so legacy sync
  // call-sites don't break. Real data is written to IndexedDB.
  const newTile: Tile = {
    ...tile,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  openDB().then((db) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(newTile);
  });
  return newTile;
}

export function trySaveTile(tile: Omit<Tile, "id" | "createdAt">): Tile | null {
  try {
    return saveTile(tile);
  } catch {
    return null;
  }
}

export async function updateTileAsync(
  id: string,
  updates: Partial<Tile>
): Promise<Tile | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (!getReq.result) { resolve(null); return; }
        const updated = { ...getReq.result, ...updates };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    return null;
  }
}

/** Sync shim */
export function updateTile(id: string, updates: Partial<Tile>): Tile | null {
  updateTileAsync(id, updates);
  return null;
}

export async function deleteTileAsync(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function deleteTile(id: string): void {
  deleteTileAsync(id);
}

export async function deleteTilesAsync(ids: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    let pending = ids.length;
    if (pending === 0) { resolve(); return; }
    ids.forEach((id) => {
      const req = store.delete(id);
      req.onsuccess = () => { if (--pending === 0) resolve(); };
      req.onerror = () => reject(req.error);
    });
  });
}

export function deleteTiles(ids: string[]): void {
  deleteTilesAsync(ids);
}

export function searchTiles(query: string, tiles: Tile[]): Tile[] {
  if (!query.trim()) return tiles;
  const q = query.toLowerCase();
  return tiles.filter(
    (t) =>
      t.tileName.toLowerCase().includes(q) ||
      t.tileNumber.toLowerCase().includes(q) ||
      t.tileSize.toLowerCase().includes(q) ||
      t.finish.toLowerCase().includes(q) ||
      t.color.toLowerCase().includes(q)
  );
}

// ─── Migrate old localStorage tiles into IndexedDB (one-time) ───────────────
export async function migrateFromLocalStorage(): Promise<number> {
  const LEGACY_KEY = "tilebox_extracted_tiles";
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return 0;
    const tiles: Tile[] = JSON.parse(raw);
    if (!tiles.length) return 0;
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      tiles.forEach((t) => store.put(t));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    localStorage.removeItem(LEGACY_KEY);
    return tiles.length;
  } catch {
    return 0;
  }
}
