export interface Tile {
  id: string;
  tileName: string;
  tileNumber: string;
  tileSize: string;
  finish: string;
  color: string;
  imageDataUrl: string;
  catalogName?: string;
  pageNumber?: number;
  createdAt: string;
}

export interface PdfPage {
  index: number;
  dataUrl: string;
  width: number;
  height: number;
}

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AIExtractionResult {
  tileName: string;
  tileNumber: string;
  tileSize: string;
  finish: string;
  color: string;
  confidence: number;
  rawText: string;
}
