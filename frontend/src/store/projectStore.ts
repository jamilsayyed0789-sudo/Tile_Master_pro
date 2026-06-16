"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ProjectItem {
  id: string;
  type: "hall" | "kitchen" | "bathroom" | "elevation" | "wall";
  name: string;
  tileName: string;
  tileNumber: string;
  tileSize: string;
  tileImageFilename: string | null;
  area: number;
  tilesRequired: number;
  boxesRequired: number;
  price: number;
  length: number;
  width: number;
  height: number;
  rate: number;
  finish: string;
}

interface ProjectState {
  items: ProjectItem[];
  addItem: (item: ProjectItem) => void;
  updateItem: (id: string, data: Partial<ProjectItem>) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const idx = state.items.findIndex((i) => i.id === item.id);
          if (idx >= 0) {
            const items = [...state.items];
            items[idx] = item;
            return { items };
          }
          return { items: [...state.items, item] };
        }),
      updateItem: (id, data) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      clearAll: () => set({ items: [] }),
    }),
    {
      name: "tilemaster-project",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
