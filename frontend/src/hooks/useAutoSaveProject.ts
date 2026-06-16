"use client";

import { useEffect, useRef } from "react";
import { useProjectStore, ProjectItem } from "@/store/projectStore";

/**
 * Auto-saves a calculator result to the project store whenever it changes.
 * Call this hook from each calculator page with the result data.
 */
export function useAutoSaveProject(
  type: ProjectItem["type"],
  result: { area: number; tilesRequired: number; boxesRequired: number; price: number } | null,
  meta: {
    tileName: string;
    tileNumber: string;
    tileSize: string;
    tileImageFilename: string | null;
    length: number;
    width: number;
    height: number;
    rate: number;
    finish: string;
  },
) {
  const { items, addItem, removeItem } = useProjectStore();
  const idRef = useRef<string>("");
  const prevResultRef = useRef<string>("");

  // Generate a stable ID for this calculator instance
  if (!idRef.current) {
    const stored = sessionStorage.getItem(`${type}-calc-id`);
    if (stored) {
      idRef.current = stored;
    } else {
      idRef.current = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(`${type}-calc-id`, idRef.current);
    }
  }

  const id = idRef.current;

  useEffect(() => {
    if (!result || result.area <= 0) return;

    const key = `${result.area}-${result.tilesRequired}-${result.boxesRequired}-${result.price}`;
    if (key === prevResultRef.current) return;
    prevResultRef.current = key;

    const existingSameType = items.filter((i) => i.type === type);
    const existingCount = existingSameType.length;

    addItem({
      id,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${existingCount + 1}`,
      tileName: meta.tileName,
      tileNumber: meta.tileNumber,
      tileSize: meta.tileSize,
      tileImageFilename: meta.tileImageFilename,
      area: result.area,
      tilesRequired: result.tilesRequired,
      boxesRequired: result.boxesRequired,
      price: result.price,
      length: meta.length,
      width: meta.width,
      height: meta.height,
      rate: meta.rate,
      finish: meta.finish,
    });
  }, [result, meta, type, addItem, items, id]);
}
