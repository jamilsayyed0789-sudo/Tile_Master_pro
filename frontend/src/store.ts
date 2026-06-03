import { create } from 'zustand';

interface CalculatorState {
  bathroomData: any;
  setBathroomData: (data: any) => void;
  bathroomResult: any;
  setBathroomResult: (result: any) => void;
  floorData: any;
  setFloorData: (data: any) => void;
  floorResult: any;
  setFloorResult: (result: any) => void;
  designerData: any;
  setDesignerData: (data: any) => void;
  designerResult: any;
  setDesignerResult: (result: any) => void;
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
  bathroomData: null,
  setBathroomData: (data) => set({ bathroomData: data }),
  bathroomResult: null,
  setBathroomResult: (result) => set({ bathroomResult: result }),
  floorData: null,
  setFloorData: (data) => set({ floorData: data }),
  floorResult: null,
  setFloorResult: (result) => set({ floorResult: result }),
  designerData: null,
  setDesignerData: (data) => set({ designerData: data }),
  designerResult: null,
  setDesignerResult: (result) => set({ designerResult: result }),
}));
