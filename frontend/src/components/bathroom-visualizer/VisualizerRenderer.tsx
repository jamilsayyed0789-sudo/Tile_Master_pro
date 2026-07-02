"use client";
import React, { useEffect, useRef, useState } from 'react';
import { TemplateMetadata } from '@/types/visualizer';
import { drawPerspectiveCanvas } from '@/lib/perspective';

interface VisualizerRendererProps {
  template: TemplateMetadata | null;
  wallTileUrl: string | null;
  floorTileUrl: string | null;
  accentTileUrl: string | null;
  triggerRender: number; // Increment to force a render
  onRenderComplete: (dataUrl: string) => void;
}

export default function VisualizerRenderer({ template, wallTileUrl, floorTileUrl, accentTileUrl, triggerRender, onRenderComplete }: VisualizerRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (!template || !triggerRender) return;
    
    const render = async () => {
      setIsRendering(true);
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Load Background (use a cache-busting timestamp to avoid caching the dummy)
        const bgImg = await loadImage(`/templates/bathrooms/${template.id}/background.jpg?v=${Date.now()}`);
        canvas.width = bgImg.width;
        canvas.height = bgImg.height;
        
        // Draw background
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(bgImg, 0, 0);

        // If no tile selected at all, just output background
        if (!wallTileUrl && !floorTileUrl && !accentTileUrl) {
          onRenderComplete(canvas.toDataURL('image/jpeg', 0.9));
          setIsRendering(false);
          return;
        }

        // 2. Render Wall
        if (template.wall && wallTileUrl) {
          try {
            const wallImg = await loadImage(wallTileUrl, true);
            await applySurface(ctx, canvas.width, canvas.height, wallImg, template.wall.corners, `/templates/bathrooms/${template.id}/wall_mask.png`);
          } catch (e) {
            console.error("Failed to render wall tile", e);
          }
        }

        // 3. Render Floor
        if (template.floor && floorTileUrl) {
          try {
            const floorImg = await loadImage(floorTileUrl, true);
            await applySurface(ctx, canvas.width, canvas.height, floorImg, template.floor.corners, `/templates/bathrooms/${template.id}/floor_mask.png`);
          } catch (e) {
            console.error("Failed to render floor tile", e);
          }
        }

        // 4. Render Accent
        if (template.accent && accentTileUrl) {
          try {
            const accentImg = await loadImage(accentTileUrl, true);
            await applySurface(ctx, canvas.width, canvas.height, accentImg, template.accent.corners, `/templates/bathrooms/${template.id}/accent_mask.png`);
          } catch (e) {
            console.error("Failed to render accent tile", e);
          }
        }

        // Output final image
        ctx.globalCompositeOperation = 'source-over';
        onRenderComplete(canvas.toDataURL('image/jpeg', 0.9));
      } catch (error) {
        console.error("Rendering failed:", error);
      } finally {
        setIsRendering(false);
      }
    };

    render();
  }, [triggerRender]); // Run when triggerRender changes

  const applySurface = async (ctx: CanvasRenderingContext2D, w: number, h: number, tileImg: HTMLImageElement, corners: [number, number][], maskUrl: string) => {
    // A) Create a tiled texture canvas
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = 1600; 
    tileCanvas.height = 1600;
    const tileCtx = tileCanvas.getContext('2d');
    if (!tileCtx) return;
    
    const pattern = tileCtx.createPattern(tileImg, 'repeat');
    if (pattern) {
      tileCtx.fillStyle = pattern;
      tileCtx.fillRect(0, 0, tileCanvas.width, tileCanvas.height);
    }

    // B) Apply Perspective Warp onto a temporary canvas
    const warpedCanvas = document.createElement('canvas');
    warpedCanvas.width = w;
    warpedCanvas.height = h;
    const warpedCtx = warpedCanvas.getContext('2d');
    if (!warpedCtx) return;

    drawPerspectiveCanvas(tileCanvas, warpedCtx, corners);

    // C) Load and apply Mask
    try {
      const maskImg = await loadImage(maskUrl);
      
      // Draw mask first on a mask layer
      const layerCanvas = document.createElement('canvas');
      layerCanvas.width = w;
      layerCanvas.height = h;
      const layerCtx = layerCanvas.getContext('2d');
      if (!layerCtx) return;

      layerCtx.drawImage(maskImg, 0, 0, w, h);
      layerCtx.globalCompositeOperation = 'source-in'; // only keep intersection
      layerCtx.drawImage(warpedCanvas, 0, 0);

      // D) Blend back to main context
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(layerCanvas, 0, 0);
    } catch (e) {
      console.error(`Failed to load mask: ${maskUrl}`, e);
    }
  };

  const loadImage = (src: string, crossOrigin: boolean = false): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      if (crossOrigin) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-neutral-950 rounded-2xl overflow-hidden border border-white/10">
      <canvas ref={canvasRef} className="hidden" />
      {isRendering && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold animate-pulse">Rendering Template...</p>
        </div>
      )}
      {!template && (
        <div className="text-neutral-500">Select a template to begin</div>
      )}
    </div>
  );
}
