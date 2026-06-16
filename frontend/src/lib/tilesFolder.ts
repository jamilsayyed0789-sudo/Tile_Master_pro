"use client";

/**
 * Local "Tiles folder" management backed by the File System Access API.
 *
 * Why this exists: TileMasterPro never stores customer tile images on the
 * server. The customer points us at a folder on their own computer and we
 * read the images directly from there. The folder handle is persisted in
 * IndexedDB so the user does not have to re-pick the folder on every
 * visit (the browser will, however, ask for read permission again after
 * a refresh — that's a File System Access API design choice we cannot
 * bypass).
 *
 * Supported image formats: jpg, jpeg, png, webp.
 */

const DB_NAME = "tilemaster-tiles-folder";
const DB_VERSION = 1;
const STORE_NAME = "handles";
const HANDLE_KEY = "tiles-folder";

const SUPPORTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

// ── IndexedDB plumbing ────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(value: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbGet(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as FileSystemDirectoryHandle | undefined) ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function idbDelete(): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

// ── Public API ───────────────────────────────────────────────────────────────

export type FolderSupport = "supported" | "unsupported";

export function isFolderAccessSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "showDirectoryPicker" in window;
}

/** Open the OS folder picker and persist the handle. */
export async function pickTilesFolder(): Promise<FileSystemDirectoryHandle> {
  if (!isFolderAccessSupported()) {
    throw new Error("Your browser does not support folder selection. Please use Chrome, Edge, or another Chromium-based browser.");
  }
  const handle = await window.showDirectoryPicker!({ mode: "read" });
  // Sanity-check the handle works.
  await handle.queryPermission!({ mode: "read" });
  await idbPut(handle);
  return handle;
}

/** Returns the persisted handle, or null if the user hasn't picked one yet. */
export async function loadPersistedHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return await idbGet();
  } catch (e) {
    console.warn("Failed to read tiles-folder handle from IndexedDB:", e);
    return null;
  }
}

/**
 * Ensures the persisted handle has read permission. Re-requests it from
 * the user if necessary. Returns the (granted) handle, or null if the
 * user denied.
 */
export async function ensureReadPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  const opts: FileSystemHandlePermissionDescriptor = { mode: "read" };
  const status = await handle.queryPermission!(opts);
  if (status === "granted") return true;
  const requested = await handle.requestPermission!(opts);
  return requested === "granted";
}

/** Forget the saved folder. The next visit will require re-picking. */
export async function clearPersistedFolder(): Promise<void> {
  await idbDelete();
}

export function isSupportedImageFile(name: string): boolean {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}

// ── File lookup helpers ───────────────────────────────────────────────────────

export interface LocalTileFile {
  name: string;
  file: File;
  blobUrl: string;
}

/**
 * Read all supported images from a folder handle, including one level of
 * subdirectories (so the user can pick the parent folder even when the
 * ZIP extraction created a `Tiles/` subfolder).
 *
 * Returns a Map keyed by the lowercase filename for O(1) lookup.
 * Each entry's `blobUrl` is a fresh `blob:` URL — callers are responsible
 * for `URL.revokeObjectURL` when they're done (typically on component
 * unmount).
 */
export async function readAllImagesFromFolder(
  handle: FileSystemDirectoryHandle
): Promise<Map<string, LocalTileFile>> {
  const out = new Map<string, LocalTileFile>();

  async function scan(dir: FileSystemDirectoryHandle, prefix = "") {
    for await (const [name, child] of dir.entries() as AsyncIterableIterator<[string, FileSystemHandle]>) {
      if (child.kind === "file") {
        if (!isSupportedImageFile(name)) continue;
        const file = await (child as FileSystemFileHandle).getFile();
        const key = name.toLowerCase();
        // Only add if not already seen (root files take priority)
        if (!out.has(key)) {
          out.set(key, { name, file, blobUrl: URL.createObjectURL(file) });
        }
      } else if (child.kind === "directory" && !prefix) {
        // Scan one level of subdirectories (e.g. a "Tiles" folder)
        await scan(child as FileSystemDirectoryHandle, name + "/");
      }
    }
  }

  await scan(handle);
  return out;
}

/** Cache so multiple components don't reopen the folder for the same name. */
let _cache: { handle: FileSystemDirectoryHandle; files: Map<string, LocalTileFile> } | null = null;
let _cachePromise: Promise<{ handle: FileSystemDirectoryHandle; files: Map<string, LocalTileFile> } | null> | null = null;

export function clearFolderCache() {
  if (_cache) {
    for (const f of _cache.files.values()) URL.revokeObjectURL(f.blobUrl);
  }
  _cache = null;
  _cachePromise = null;
}

/**
 * Returns the persisted + permissioned folder, reading all images once
 * and caching them. Pass `force = true` to bypass the cache (e.g. after
 * the user adds new images to the folder and clicks "Refresh").
 */
export async function getTilesFolder(force = false): Promise<{
  handle: FileSystemDirectoryHandle;
  files: Map<string, LocalTileFile>;
} | null> {
  if (!force && _cache) return _cache;
  if (!force && _cachePromise) return _cachePromise;

  _cachePromise = (async () => {
    const handle = await loadPersistedHandle();
    if (!handle) return null;
    const granted = await ensureReadPermission(handle);
    if (!granted) return null;
    const files = await readAllImagesFromFolder(handle);
    _cache = { handle, files };
    return _cache;
  })();

  try {
    return await _cachePromise;
  } finally {
    _cachePromise = null;
  }
}

/**
 * Look up a single image by its filename (case-insensitive). Returns
 * null if the folder is not accessible or the file is missing.
 */
export async function getFileByFilename(filename: string): Promise<LocalTileFile | null> {
  const folder = await getTilesFolder();
  if (!folder) return null;
  return folder.files.get(filename.toLowerCase()) ?? null;
}

/** Total count of images in the cached folder (or null if not loaded). */
export function getCachedImageCount(): number | null {
  return _cache ? _cache.files.size : null;
}

/**
 * Delete a file from the user's local Tiles folder by filename.
 * Prompts for write permission on the file if not already granted.
 * Returns true if deleted, false if file not found or permission denied.
 */
export async function deleteFileByFilename(filename: string): Promise<boolean> {
  const results = await deleteFilesByFilenames([filename]);
  return results[0] ?? false;
}

/**
 * Delete multiple files from the user's local Tiles folder in one pass.
 * Scans the directory ONCE, finds all matching files, then deletes them.
 * Returns an array of booleans in the same order as the input filenames.
 */
export async function deleteFilesByFilenames(filenames: string[]): Promise<boolean[]> {
  if (filenames.length === 0) return [];
  const handle = await loadPersistedHandle();
  if (!handle) return filenames.map(() => false);

  // Build a set of lowercase names to find
  const lowerNames = new Set(filenames.map(f => f.toLowerCase()));
  const found: Map<string, FileSystemFileHandle> = new Map();

  try {
    // Single directory scan — find all matching files at once
    for await (const [name, child] of handle.entries() as AsyncIterableIterator<[string, FileSystemHandle]>) {
      if (child.kind === "file" && lowerNames.has(name.toLowerCase())) {
        found.set(name.toLowerCase(), child as FileSystemFileHandle);
      }
      if (child.kind === "directory") {
        for await (const [subName, subChild] of (child as FileSystemDirectoryHandle).entries() as AsyncIterableIterator<[string, FileSystemHandle]>) {
          if (subChild.kind === "file" && lowerNames.has(subName.toLowerCase())) {
            found.set(subName.toLowerCase(), subChild as FileSystemFileHandle);
          }
        }
      }
    }
  } catch (e) {
    console.warn("Failed to scan folder for bulk delete:", e);
    return filenames.map(() => false);
  }

  // Delete all found files
  const results: boolean[] = [];
  for (const name of filenames) {
    const fh = found.get(name.toLowerCase());
    if (!fh) {
      results.push(false);
      continue;
    }
    try {
      const anyFh = fh as any;
      if (typeof anyFh.requestPermission !== "function") { results.push(false); continue; }
      const perm = await anyFh.requestPermission({ mode: "readwrite" });
      if (perm !== "granted") { results.push(false); continue; }
      if (typeof anyFh.remove === "function") {
        await anyFh.remove();
        results.push(true);
      } else {
        results.push(false);
      }
    } catch (e) {
      console.warn("Failed to delete file:", name, e);
      results.push(false);
    }
  }

  clearFolderCache();
  return results;
}
