export interface AdjustmentSettings {
  rotation: number; // 0, 90, 180, 270
  brightness: number; // 50 to 150
  contrast: number; // 50 to 150
  saturation: number; // 0 to 200
  hueRotate: number; // -180 to 180
  scaleX: number; // 0.5 to 3
  scaleY: number; // 0.5 to 3
  offsetX: number; // -1 to 1
  offsetY: number; // -1 to 1
}

export const DEFAULT_ADJUSTMENTS: AdjustmentSettings = {
  rotation: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
  scaleX: 1.0,
  scaleY: 1.0,
  offsetX: 0,
  offsetY: 0,
};

/**
 * Apply canvas-based image modifications (rotation, scale, color filters) to an image URL.
 * Returns a Promise that resolves to a new object URL (or data URL as fallback).
 */
export function applyImageAdjustments(
  originalUrl: string,
  settings: AdjustmentSettings
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!originalUrl) {
      reject(new Error("No original image URL provided"));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let srcW = img.naturalWidth || img.width;
      let srcH = img.naturalHeight || img.height;

      // Downscale if too large to ensure fast updates (1024px limit)
      const maxDim = 1024;
      if (srcW > maxDim || srcH > maxDim) {
        const ratio = Math.min(maxDim / srcW, maxDim / srcH);
        srcW = Math.round(srcW * ratio);
        srcH = Math.round(srcH * ratio);
      }

      const canvas = document.createElement("canvas");

      // Determine size after rotation (90 and 270 swap dimensions)
      const is90or270 = settings.rotation === 90 || settings.rotation === 270;
      const canvasW = is90or270 ? srcH : srcW;
      const canvasH = is90or270 ? srcW : srcH;

      canvas.width = canvasW;
      canvas.height = canvasH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas 2d context"));
        return;
      }

      // 1. Set filters
      ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%) hue-rotate(${settings.hueRotate}deg)`;

      ctx.clearRect(0, 0, canvasW, canvasH);
      ctx.save();

      // 2. Translate to center of canvas
      ctx.translate(canvasW / 2, canvasH / 2);

      // 3. Apply rotation
      const rad = (settings.rotation * Math.PI) / 180;
      ctx.rotate(rad);

      // 4. Apply scale and offset
      const drawW = srcW * settings.scaleX;
      const drawH = srcH * settings.scaleY;
      const shiftX = settings.offsetX * drawW;
      const shiftY = settings.offsetY * drawH;

      // 5. Draw
      ctx.drawImage(img, -drawW / 2 + shiftX, -drawH / 2 + shiftY, drawW, drawH);

      ctx.restore();

      // 6. Convert to blob URL or data URL fallback
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          }
        },
        "image/jpeg",
        0.85
      );
    };

    img.onerror = (err) => {
      reject(err);
    };

    img.src = originalUrl;
  });
}
