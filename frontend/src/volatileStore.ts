import { create } from 'zustand';

interface VolatileState {
  globalTileImage: string | null;
  setGlobalTileImage: (v: string | null) => void;
  bathroomFloor: string | null;
  setBathroomFloor: (v: string | null) => void;
  bathroomDark: string | null;
  setBathroomDark: (v: string | null) => void;
  bathroomLight: string | null;
  setBathroomLight: (v: string | null) => void;
  bathroomHighlighter: string | null;
  setBathroomHighlighter: (v: string | null) => void;
  bathroomShower1: string | null;
  setBathroomShower1: (v: string | null) => void;
  bathroomShower2: string | null;
  setBathroomShower2: (v: string | null) => void;
  kitchenFloor: string | null;
  setKitchenFloor: (v: string | null) => void;
  kitchenWall: string | null;
  setKitchenWall: (v: string | null) => void;
  kitchenCountertop: string | null;
  setKitchenCountertop: (v: string | null) => void;
  clearAll: () => void;
}

export const useVolatileStore = create<VolatileState>((set) => ({
  globalTileImage: null,
  setGlobalTileImage: (v) => set({ globalTileImage: v }),
  bathroomFloor: null,
  setBathroomFloor: (v) => set({ bathroomFloor: v }),
  bathroomDark: null,
  setBathroomDark: (v) => set({ bathroomDark: v }),
  bathroomLight: null,
  setBathroomLight: (v) => set({ bathroomLight: v }),
  bathroomHighlighter: null,
  setBathroomHighlighter: (v) => set({ bathroomHighlighter: v }),
  bathroomShower1: null,
  setBathroomShower1: (v) => set({ bathroomShower1: v }),
  bathroomShower2: null,
  setBathroomShower2: (v) => set({ bathroomShower2: v }),
  kitchenFloor: null,
  setKitchenFloor: (v) => set({ kitchenFloor: v }),
  kitchenWall: null,
  setKitchenWall: (v) => set({ kitchenWall: v }),
  kitchenCountertop: null,
  setKitchenCountertop: (v) => set({ kitchenCountertop: v }),
  clearAll: () => set({ 
    globalTileImage: null, bathroomFloor: null, bathroomDark: null, 
    bathroomLight: null, bathroomHighlighter: null, bathroomShower1: null, bathroomShower2: null,
    kitchenFloor: null, kitchenWall: null, kitchenCountertop: null 
  }),
}));
