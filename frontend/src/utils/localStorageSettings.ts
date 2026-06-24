// ─── Local Storage Settings Utility ──────────────────────────────────────────
// Communicates with the backend settings API to read/write the local tile folder path.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface StorageStatus {
  configured: boolean;
  path: string;
  exists?: boolean;
  writable?: boolean;
}

/** Helper to safely parse JSON or throw a descriptive error if HTML is returned */
async function safeParseJson(res: Response): Promise<any> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Backend API URL is invalid or misconfigured (Expected JSON, but received HTML). Please make sure NEXT_PUBLIC_API_URL is set correctly in Vercel to your Railway backend URL.`
    );
  }
  return res.json();
}

/** Fetch current storage status from backend */
export async function getStorageStatus(): Promise<StorageStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/local/status`);
    if (!res.ok) return { configured: false, path: "" };
    return await safeParseJson(res);
  } catch {
    return { configured: false, path: "" };
  }
}

/** Read the raw settings from backend */
export async function getStorageSettings(): Promise<{ local_storage_path: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/settings/storage`);
    if (!res.ok) return { local_storage_path: "" };
    return await safeParseJson(res);
  } catch {
    return { local_storage_path: "" };
  }
}

/** Update the storage folder path */
export async function setStoragePath(path: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/settings/storage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ local_storage_path: path }),
    });
    
    let data;
    try {
      data = await safeParseJson(res);
    } catch (err: any) {
      return { ok: false, message: err.message };
    }

    if (!res.ok) return { ok: false, message: data.detail || "Failed to update settings" };
    return { ok: true, message: "Storage folder updated successfully" };
  } catch (e: any) {
    return { ok: false, message: e.message || "Network error" };
  }
}

export interface LocalTilePayload {
  tile_name: string;
  tile_number: string;
  tile_size?: string;
  finish?: string;
  color?: string;
  catalog_name?: string;
  page_number?: number;
  image_data_url: string; // base64 data URL
  has_name?: boolean;
  has_number?: boolean;
}

/** Save a tile image to local disk via backend. Returns true if succeeded. */
export async function saveTileToLocalStorage(payload: LocalTilePayload): Promise<{ ok: boolean; data?: any; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/local/save-tile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    let data;
    try {
      data = await safeParseJson(res);
    } catch (err: any) {
      return { ok: false, message: err.message };
    }

    if (!res.ok) return { ok: false, message: data.detail || "Failed to save tile" };
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, message: e.message || "Network error" };
  }
}

// ─── File System Access API (Direct Local Save from Browser) ───────────────────

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("tile-storage-db", 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("handles")) {
        request.result.createObjectStore("handles");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function setStoredHandle(key: string, val: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles", "readwrite");
    const store = tx.objectStore("handles");
    const req = store.put(val, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getStoredHandle(key: string): Promise<any> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles", "readonly");
    const store = tx.objectStore("handles");
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function verifyDirectoryPermission(handle: any, readWrite: boolean = true): Promise<boolean> {
  if (!handle) return false;
  const options = { mode: readWrite ? "readwrite" as const : "read" as const };
  try {
    if ((await handle.queryPermission(options)) === "granted") {
      return true;
    }
    if ((await handle.requestPermission(options)) === "granted") {
      return true;
    }
    return false;
  } catch (err) {
    console.error("Failed to query/request permission on folder:", err);
    return false;
  }
}

export function buildFilename(tileName: string, tileNumber: string, hasName?: boolean, hasNumber?: boolean): string {
  let cleanName = (tileName || "").trim();
  let cleanNumber = (tileNumber || "").trim();
  
  const nameIsPlaceholder = !cleanName || 
    /untitled/i.test(cleanName) || 
    /page/i.test(cleanName);
    
  const numIsPlaceholder = !cleanNumber || 
    /^[pP]\d+$/.test(cleanNumber) || 
    /untitled/i.test(cleanNumber);
    
  const useName = hasName !== undefined ? hasName : !nameIsPlaceholder;
  const useNumber = hasNumber !== undefined ? hasNumber : !numIsPlaceholder;
  
  let baseName = "";
  if (useName && useNumber) {
    baseName = `${cleanName}__${cleanNumber}`;
  } else if (useNumber) {
    baseName = cleanNumber;
  } else if (useName) {
    baseName = cleanName;
  } else {
    baseName = `tile_${Math.random().toString(36).substring(2, 10)}`;
  }
  
  let safeBase = baseName.replace(/\s+/g, "_");
  safeBase = safeBase.replace(/[^a-zA-Z0-9-_]/g, "");
  if (!safeBase) {
    safeBase = `tile_${Math.random().toString(36).substring(2, 10)}`;
  }
  
  return `${safeBase}.jpg`;
}

export async function saveBase64ToDirectoryHandle(
  dirHandle: any,
  base64Data: string,
  filename: string
): Promise<void> {
  const res = await fetch(base64Data);
  const blob = await res.blob();

  // Organize in YYYY/MM subfolders
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  
  const yearHandle = await dirHandle.getDirectoryHandle(year, { create: true });
  const monthHandle = await yearHandle.getDirectoryHandle(month, { create: true });
  
  let finalFilename = filename;
  let fileHandle;
  let counter = 1;
  
  // Extract base name and extension
  const match = filename.match(/^(.*)\.([^\.]+)$/);
  const baseName = match ? match[1] : filename;
  const ext = match ? `.${match[2]}` : "";

  while (true) {
    try {
      // Try to get the file handle *without* creating it to check if it exists
      await monthHandle.getFileHandle(finalFilename, { create: false });
      // If it succeeds, the file exists. We need a new name.
      finalFilename = `${baseName}_${counter}${ext}`;
      counter++;
    } catch (e: any) {
      // If it throws NotFoundError, the file doesn't exist, which is what we want!
      if (e.name === "NotFoundError") {
        break;
      }
      // If it throws something else (e.g. permission error), we should stop
      throw e;
    }
  }

  fileHandle = await monthHandle.getFileHandle(finalFilename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

/** 
 * Recursively search the browser-output-directory for a tile image matching the name/number.
 * Returns a Blob URL if found, or null if not found or no permission.
 */
export async function findLocalTileImage(tileName: string | null, tileNumber: string | null): Promise<string | null> {
  try {
    const dirHandle = await getStoredHandle("browser-output-directory");
    if (!dirHandle) return null;
    
    // Check permission without prompting (don't annoy the user if they didn't explicitly click something)
    const options = { mode: "read" as const };
    const perm = await dirHandle.queryPermission(options);
    if (perm !== "granted") {
      // If not granted, we could try to request, but it requires a user gesture.
      // Let's just return null if we don't already have permission.
      return null;
    }

    const baseName = buildFilename(tileName || "", tileNumber || "", undefined, undefined).replace(".jpg", "");

    async function searchDir(dir: any, depth: number): Promise<string | null> {
      if (depth > 2) return null; // Only search YYYY/MM folders
      for await (const entry of dir.values()) {
        if (entry.kind === 'file') {
          if (entry.name.startsWith(baseName) && entry.name.endsWith(".jpg")) {
             const file = await entry.getFile();
             return URL.createObjectURL(file);
          }
        } else if (entry.kind === 'directory') {
           const found = await searchDir(entry, depth + 1);
           if (found) return found;
        }
      }
      return null;
    }
    return await searchDir(dirHandle, 0);
  } catch (e) {
    console.error("Error searching local tile image:", e);
    return null;
  }
}
