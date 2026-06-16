import * as pdfjsLib from "pdfjs-dist";
import type { PdfPage } from "@/types/tile";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function loadPdf(file: File): Promise<{ doc: pdfjsLib.PDFDocumentProxy; numPages: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  return { doc, numPages: doc.numPages };
}

export async function renderPageToCanvas(
  doc: pdfjsLib.PDFDocumentProxy,
  pageIndex: number,
  scale = 1.5
): Promise<PdfPage> {
  const page = await doc.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvas, viewport }).promise;
  page.cleanup();
  return {
    index: pageIndex,
    dataUrl: canvas.toDataURL("image/jpeg", 0.85),
    width: viewport.width,
    height: viewport.height,
  };
}

export async function renderAllPages(
  doc: pdfjsLib.PDFDocumentProxy,
  onPage: (page: PdfPage) => void,
  scale = 1.5
): Promise<void> {
  for (let i = 0; i < doc.numPages; i++) {
    const page = await renderPageToCanvas(doc, i, scale);
    onPage(page);
  }
}

export async function detectTileInfo(
  doc: pdfjsLib.PDFDocumentProxy,
  pageIndex: number,
  cropRegion: { x: number; y: number; width: number; height: number }
): Promise<{ tileName: string; tileNumber: string; tileSize: string; finish: string; color: string }> {
  const page = await doc.getPage(pageIndex + 1);
  const textContent = await page.getTextContent();
  page.cleanup();

  const pageHeight = (await doc.getPage(pageIndex + 1).then((p) => {
    const vp = p.getViewport({ scale: 1 });
    p.cleanup();
    return vp.height;
  }));

  const items = textContent.items.filter((item: any) => {
    if (!item.transform) return false;
    const tx = item.transform[4];
    const ty = pageHeight - item.transform[5];
    return (
      tx >= cropRegion.x &&
      tx <= cropRegion.x + cropRegion.width &&
      ty >= cropRegion.y &&
      ty <= cropRegion.y + cropRegion.height
    );
  }) as any[];

  const text = items.map((i) => i.str).join(" ");

  return {
    tileName: extractByPattern(text, [/[A-Z\s]{3,}[A-Z]+/]),
    tileNumber: extractByPattern(text, [/\b[A-Z]{2,6}\d{2,6}\b/, /\b\d{4,8}\b/]),
    tileSize: extractByPattern(text, [/\d{2,4}\s?[xX×]\s?\d{2,4}\s?(mm|cm|M)?/i, /\d{2,4}x\d{2,4}/]),
    finish: extractByPattern(text, [/(Glossy|Matt|Matte|Satin|Polished|Natural|Textured|Lappato)/i]),
    color: extractByPattern(text, [/(White|Black|Grey|Beige|Brown|Cream|Gold|Silver|Blue|Green)\s?\w*/i]),
  };
}

function extractByPattern(text: string, patterns: RegExp[]): string {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0].trim();
  }
  return "";
}
