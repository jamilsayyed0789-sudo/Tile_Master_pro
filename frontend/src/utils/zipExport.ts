import JSZip from "jszip";
import type { Tile } from "@/types/tile";

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase()
    .slice(0, 60) || "TILE";
}

export async function exportTilesAsZip(tiles: Tile[], zipName: string = "Tiles"): Promise<void> {
  const zip = new JSZip();

  const csvRows = [
    ["Tile Number", "Tile Name", "Tile Size", "Finish", "Color", "Image Filename"],
  ];

  for (const tile of tiles) {
    const baseName = sanitizeFilename(`${tile.tileNumber}_${tile.tileName}`);
    const filename = `${baseName}.jpg`;

    const dataUrl = tile.imageDataUrl;
    const blob = dataUrl.startsWith("data:")
      ? await (await fetch(dataUrl)).blob()
      : new Blob([dataUrl], { type: "image/jpeg" });

    zip.file(filename, blob);
    csvRows.push([tile.tileNumber, tile.tileName, tile.tileSize, tile.finish, tile.color, filename]);
  }

  const csvContent = csvRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  zip.file("tiles.csv", csvContent);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  
  // Clean up the name for safe downloading
  const safeName = zipName.trim() || "Tiles";
  a.download = `${safeName}.zip`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
