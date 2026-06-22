// ─── Local Storage Settings Utility ──────────────────────────────────────────
// Communicates with the backend settings API to read/write the local tile folder path.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface StorageStatus {
  configured: boolean;
  path: string;
  exists?: boolean;
  writable?: boolean;
}

/** Fetch current storage status from backend */
export async function getStorageStatus(): Promise<StorageStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/local/status`);
    if (!res.ok) return { configured: false, path: "" };
    return await res.json();
  } catch {
    return { configured: false, path: "" };
  }
}

/** Read the raw settings from backend */
export async function getStorageSettings(): Promise<{ local_storage_path: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/settings/storage`);
    if (!res.ok) return { local_storage_path: "" };
    return await res.json();
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
    const data = await res.json();
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
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.detail || "Failed to save tile" };
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, message: e.message || "Network error" };
  }
}
