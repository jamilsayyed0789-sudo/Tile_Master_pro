/**
 * Type extensions for File System Access API.
 *
 * TS 5.9's lib.dom.d.ts ships a partial FSA declaration. Methods that
 * are still flagged as "experimental" in the spec (`entries`, async
 * iteration, `queryPermission`, `requestPermission`) are missing — even
 * though every Chromium-based browser has shipped them for years.
 *
 * These augmentations bring the type up to parity with MDN so the
 * `lib/tilesFolder.ts` module type-checks without `as any` everywhere.
 */

interface FileSystemHandlePermissionDescriptor {
  mode?: "read" | "readwrite";
}

interface FileSystemHandle {
  queryPermission?(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission?(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

interface FileSystemDirectoryHandle {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  values(): AsyncIterableIterator<FileSystemHandle>;
  keys(): AsyncIterableIterator<string>;
}

interface Window {
  showDirectoryPicker?: (options?: { mode?: "read" | "readwrite"; startIn?: FileSystemHandle | string }) => Promise<FileSystemDirectoryHandle>;
}
