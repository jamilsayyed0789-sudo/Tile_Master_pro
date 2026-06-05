import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface RoomPreviewerState {
  roomLength: number;
  setRoomLength: (v: number) => void;
  roomWidth: number;
  setRoomWidth: (v: number) => void;
  is3DMode: boolean;
  setIs3DMode: (v: boolean) => void;
  isTheaterMode: boolean;
  setIsTheaterMode: (v: boolean) => void;
  groutWidth: number;
  setGroutWidth: (v: number) => void;
  groutColor: string;
  setGroutColor: (v: string) => void;
  selectedPattern: 'grid' | 'brick';
  setSelectedPattern: (v: 'grid' | 'brick') => void;
  skirtingColor: string;
  setSkirtingColor: (v: string) => void;
  skirtingHeight: number;
  setSkirtingHeight: (v: number) => void;
  skirtingUseTexture: boolean;
  setSkirtingUseTexture: (v: boolean) => void;
  sizeUnit: 'inches' | 'feet' | 'mm';
  setSizeUnit: (v: 'inches' | 'feet' | 'mm') => void;
  tileWidthInput: string;
  setTileWidthInput: (v: string) => void;
  tileLengthInput: string;
  setTileLengthInput: (v: string) => void;
  bookmatchEnabled: boolean;
  setBookmatchEnabled: (v: boolean) => void;
  uploadedFileName: string;
  setUploadedFileName: (v: string) => void;
  selectedStyleId: string;
  setSelectedStyleId: (v: string) => void;
  wastagePercent: number;
  setWastagePercent: (v: number) => void;
  tilesPerBoxInput: string;
  setTilesPerBoxInput: (v: string) => void;
  pricePerBox: number;
  setPricePerBox: (v: number) => void;
  clientName: string;
  setClientName: (v: string) => void;
  shopName: string;
  setShopName: (v: string) => void;
  laborCost: number;
  setLaborCost: (v: number) => void;
  reset: () => void;
}

interface Bathroom3DState {
  runningFeet: number;
  setRunningFeet: (v: number) => void;
  wallHeight: number;
  setWallHeight: (v: number) => void;
  roomLength: number;
  setRoomLength: (v: number) => void;
  roomWidth: number;
  setRoomWidth: (v: number) => void;
  tileSize: string | null;
  setTileSize: (v: string | null) => void;
  groutWidth: number;
  setGroutWidth: (v: number) => void;
  groutColor: string;
  setGroutColor: (v: string) => void;
  wastagePercent: number;
  setWastagePercent: (v: number) => void;
  pricePerBox: number;
  setPricePerBox: (v: number) => void;
  showerSplitMode: boolean;
  setShowerSplitMode: (v: boolean) => void;
  isTheaterMode: boolean;
  setIsTheaterMode: (v: boolean) => void;
  stripEnabled: boolean;
  setStripEnabled: (v: boolean) => void;
  stripColor: string;
  setStripColor: (v: string) => void;
  stripWidthMm: number;
  setStripWidthMm: (v: number) => void;
  stripInterval: number;
  setStripInterval: (v: number) => void;
  bookmatchEnabled: boolean;
  setBookmatchEnabled: (v: boolean) => void;
  shower1OffsetY: number;
  setShower1OffsetY: (v: number) => void;
  shower2OffsetY: number;
  setShower2OffsetY: (v: number) => void;
  slotOrder: string[];
  setSlotOrder: (v: string[]) => void;
  slotRows: Record<string, number>;
  setSlotRows: (v: Record<string, number>) => void;
  reset: () => void;
}

interface Kitchen3DState {
  roomWidth: number;
  setRoomWidth: (v: number) => void;
  roomLength: number;
  setRoomLength: (v: number) => void;
  roomHeight: number;
  setRoomHeight: (v: number) => void;
  counterDepth: number;
  setCounterDepth: (v: number) => void;
  tileSize: string;
  setTileSize: (v: string) => void;
  tileRotation: number;
  setTileRotation: (v: number) => void;
  countertopColor: string;
  setCountertopColor: (v: string) => void;
  isTheaterMode: boolean;
  setIsTheaterMode: (v: boolean) => void;
  slabMode: boolean;
  setSlabMode: (v: boolean) => void;
  highlighterRows: number;
  setHighlighterRows: (v: number) => void;
  floorTileSize: string;
  setFloorTileSize: (v: string) => void;
  stripEnabled: boolean;
  setStripEnabled: (v: boolean) => void;
  stripColor: string;
  setStripColor: (v: string) => void;
  stripWidthMm: number;
  setStripWidthMm: (v: number) => void;
  stripInterval: number;
  setStripInterval: (v: number) => void;
  reset: () => void;
}

interface WallElevationState {
  wallWidth: number;
  setWallWidth: (v: number) => void;
  wallHeight: number;
  setWallHeight: (v: number) => void;
  tileSize: string | null;
  setTileSize: (v: string | null) => void;
  showDoor: boolean;
  setShowDoor: (v: boolean) => void;
  doorW: number;
  setDoorW: (v: number) => void;
  doorH: number;
  setDoorH: (v: number) => void;
  doorPosX: number;
  setDoorPosX: (v: number) => void;
  showWindow: boolean;
  setShowWindow: (v: boolean) => void;
  winW: number;
  setWinW: (v: number) => void;
  winH: number;
  setWinH: (v: number) => void;
  winPosX: number;
  setWinPosX: (v: number) => void;
  winPosY: number;
  setWinPosY: (v: number) => void;
  reset: () => void;
}

const defaultRoomPreviewer: Omit<RoomPreviewerState, 'setRoomLength' | 'setRoomWidth' | 'setIs3DMode' | 'setIsTheaterMode' | 'setGroutWidth' | 'setGroutColor' | 'setSelectedPattern' | 'setSkirtingColor' | 'setSkirtingHeight' | 'setSkirtingUseTexture' | 'setSizeUnit' | 'setTileWidthInput' | 'setTileLengthInput' | 'setBookmatchEnabled' | 'setUploadedFileName' | 'setSelectedStyleId' | 'setWastagePercent' | 'setTilesPerBoxInput' | 'setPricePerBox' | 'setClientName' | 'setShopName' | 'setLaborCost' | 'reset'> = {
  roomLength: 14,
  roomWidth: 12,
  is3DMode: true,
  isTheaterMode: false,
  groutWidth: 3,
  groutColor: '#c5c2bc',
  selectedPattern: 'grid',
  skirtingColor: '#111111',
  skirtingHeight: 0.4,
  skirtingUseTexture: false,
  sizeUnit: 'inches',
  tileWidthInput: '24',
  tileLengthInput: '24',
  bookmatchEnabled: false,
  uploadedFileName: '',
  selectedStyleId: 'italian-marble',
  wastagePercent: 8,
  tilesPerBoxInput: '4',
  pricePerBox: 650,
  clientName: '',
  shopName: 'Marble Palace & Tiles',
  laborCost: 15,
};

const defaultBathroom3D: Omit<Bathroom3DState, 'setRunningFeet' | 'setWallHeight' | 'setRoomLength' | 'setRoomWidth' | 'setTileSize' | 'setGroutWidth' | 'setGroutColor' | 'setWastagePercent' | 'setPricePerBox' | 'setShowerSplitMode' | 'setIsTheaterMode' | 'setStripEnabled' | 'setStripColor' | 'setStripWidthMm' | 'setStripInterval' | 'setBookmatchEnabled' | 'setShower1OffsetY' | 'setShower2OffsetY' | 'setSlotOrder' | 'setSlotRows' | 'reset'> = {
  runningFeet: 20,
  wallHeight: 8,
  roomLength: 8,
  roomWidth: 6,
  tileSize: '12x18',
  groutWidth: 3,
  groutColor: '#cccccc',
  wastagePercent: 10,
  pricePerBox: 650,
  showerSplitMode: false,
  isTheaterMode: false,
  stripEnabled: false,
  stripColor: 'golden',
  stripWidthMm: 2,
  stripInterval: 2,
  bookmatchEnabled: false,
  shower1OffsetY: 0,
  shower2OffsetY: 0,
  slotOrder: ['dark', 'light', 'highlighter'],
  slotRows: { dark: 2, light: 2, highlighter: 1 },
};

const defaultKitchen3D: Omit<Kitchen3DState, 'setRoomWidth' | 'setRoomLength' | 'setRoomHeight' | 'setCounterDepth' | 'setTileSize' | 'setTileRotation' | 'setCountertopColor' | 'setIsTheaterMode' | 'setSlabMode' | 'setHighlighterRows' | 'setFloorTileSize' | 'setStripEnabled' | 'setStripColor' | 'setStripWidthMm' | 'setStripInterval' | 'reset'> = {
  roomWidth: 10,
  roomLength: 12,
  roomHeight: 8,
  counterDepth: 2.5,
  tileSize: '12x18',
  tileRotation: 0,
  countertopColor: '#8b7355',
  isTheaterMode: false,
  slabMode: true,
  highlighterRows: 2,
  floorTileSize: '2x4',
  stripEnabled: false,
  stripColor: 'golden',
  stripWidthMm: 2,
  stripInterval: 2,
};

const defaultWallElevation: Omit<WallElevationState, 'setWallWidth' | 'setWallHeight' | 'setTileSize' | 'setShowDoor' | 'setDoorW' | 'setDoorH' | 'setDoorPosX' | 'setShowWindow' | 'setWinW' | 'setWinH' | 'setWinPosX' | 'setWinPosY' | 'reset'> = {
  wallWidth: 10,
  wallHeight: 9,
  tileSize: '12x18',
  showDoor: true,
  doorW: 3,
  doorH: 7,
  doorPosX: 25,
  showWindow: true,
  winW: 3,
  winH: 3,
  winPosX: 70,
  winPosY: 65,
};

export const useRoomPreviewerStore = create<RoomPreviewerState>()(
  persist(
    (set) => ({
      ...defaultRoomPreviewer,
      setRoomLength: (v) => set({ roomLength: v }),
      setRoomWidth: (v) => set({ roomWidth: v }),
      setIs3DMode: (v) => set({ is3DMode: v }),
      setIsTheaterMode: (v) => set({ isTheaterMode: v }),
      setGroutWidth: (v) => set({ groutWidth: v }),
      setGroutColor: (v) => set({ groutColor: v }),
      setSelectedPattern: (v) => set({ selectedPattern: v }),
      setSkirtingColor: (v) => set({ skirtingColor: v }),
      setSkirtingHeight: (v) => set({ skirtingHeight: v }),
      setSkirtingUseTexture: (v) => set({ skirtingUseTexture: v }),
      setSizeUnit: (v) => set({ sizeUnit: v }),
      setTileWidthInput: (v) => set({ tileWidthInput: v }),
      setTileLengthInput: (v) => set({ tileLengthInput: v }),
      setBookmatchEnabled: (v) => set({ bookmatchEnabled: v }),
      setUploadedFileName: (v) => set({ uploadedFileName: v }),
      setSelectedStyleId: (v) => set({ selectedStyleId: v }),
      setWastagePercent: (v) => set({ wastagePercent: v }),
      setTilesPerBoxInput: (v) => set({ tilesPerBoxInput: v }),
      setPricePerBox: (v) => set({ pricePerBox: v }),
      setClientName: (v) => set({ clientName: v }),
      setShopName: (v) => set({ shopName: v }),
      setLaborCost: (v) => set({ laborCost: v }),
      reset: () => set(defaultRoomPreviewer),
    }),
    {
      name: '3d-room-previewer',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export const useBathroom3DStore = create<Bathroom3DState>()(
  persist(
    (set) => ({
      ...defaultBathroom3D,
      setRunningFeet: (v) => set({ runningFeet: v }),
      setWallHeight: (v) => set({ wallHeight: v }),
      setRoomLength: (v) => set({ roomLength: v }),
      setRoomWidth: (v) => set({ roomWidth: v }),
      setTileSize: (v) => set({ tileSize: v }),
      setGroutWidth: (v) => set({ groutWidth: v }),
      setGroutColor: (v) => set({ groutColor: v }),
      setWastagePercent: (v) => set({ wastagePercent: v }),
      setPricePerBox: (v) => set({ pricePerBox: v }),
      setShowerSplitMode: (v) => set({ showerSplitMode: v }),
      setIsTheaterMode: (v) => set({ isTheaterMode: v }),
      setStripEnabled: (v) => set({ stripEnabled: v }),
      setStripColor: (v) => set({ stripColor: v }),
      setStripWidthMm: (v) => set({ stripWidthMm: v }),
      setStripInterval: (v) => set({ stripInterval: v }),
      setBookmatchEnabled: (v) => set({ bookmatchEnabled: v }),
      setShower1OffsetY: (v) => set({ shower1OffsetY: v }),
      setShower2OffsetY: (v) => set({ shower2OffsetY: v }),
      setSlotOrder: (v) => set({ slotOrder: v }),
      setSlotRows: (v) => set({ slotRows: v }),
      reset: () => set(defaultBathroom3D),
    }),
    {
      name: '3d-bathroom',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export const useKitchen3DStore = create<Kitchen3DState>()(
  persist(
    (set) => ({
      ...defaultKitchen3D,
      setRoomWidth: (v) => set({ roomWidth: v }),
      setRoomLength: (v) => set({ roomLength: v }),
      setRoomHeight: (v) => set({ roomHeight: v }),
      setCounterDepth: (v) => set({ counterDepth: v }),
      setTileSize: (v) => set({ tileSize: v }),
      setTileRotation: (v) => set({ tileRotation: v }),
      setCountertopColor: (v) => set({ countertopColor: v }),
      setIsTheaterMode: (v) => set({ isTheaterMode: v }),
      setSlabMode: (v) => set({ slabMode: v }),
      setHighlighterRows: (v) => set({ highlighterRows: v }),
      setFloorTileSize: (v) => set({ floorTileSize: v }),
      setStripEnabled: (v) => set({ stripEnabled: v }),
      setStripColor: (v) => set({ stripColor: v }),
      setStripWidthMm: (v) => set({ stripWidthMm: v }),
      setStripInterval: (v) => set({ stripInterval: v }),
      reset: () => set(defaultKitchen3D),
    }),
    {
      name: '3d-kitchen',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export const useWallElevationStore = create<WallElevationState>()(
  persist(
    (set) => ({
      ...defaultWallElevation,
      setWallWidth: (v) => set({ wallWidth: v }),
      setWallHeight: (v) => set({ wallHeight: v }),
      setTileSize: (v) => set({ tileSize: v }),
      setShowDoor: (v) => set({ showDoor: v }),
      setDoorW: (v) => set({ doorW: v }),
      setDoorH: (v) => set({ doorH: v }),
      setDoorPosX: (v) => set({ doorPosX: v }),
      setShowWindow: (v) => set({ showWindow: v }),
      setWinW: (v) => set({ winW: v }),
      setWinH: (v) => set({ winH: v }),
      setWinPosX: (v) => set({ winPosX: v }),
      setWinPosY: (v) => set({ winPosY: v }),
      reset: () => set(defaultWallElevation),
    }),
    {
      name: '3d-wall-elevation',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
