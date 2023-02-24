import { immer } from "zustand/middleware/immer";
import create from "zustand";

interface ZoomStore {
  zoomLevel: number;
  setZoomLevel(newValue: number): void;
  zoomPosition: [number, number];
  setZoomPosition(newValue: [number, number]): void;
  panelDimensions: [number, number];
  setPanelDimensions(newValue: [number, number]): void;
  computed: {
    fullZoomedPosition: [number, number];
  };
}
export const useZoomStore = create<ZoomStore>()(
  immer((set, get) => ({
    zoomLevel: 1,
    setZoomLevel: (newValue) =>
      set((state) => {
        state.zoomLevel = newValue;
      }),
    zoomPosition: [0, 0],
    setZoomPosition: (newValue) =>
      set((state) => {
        state.zoomPosition = newValue;
      }),
    panelDimensions: [1, 1],
    setPanelDimensions: (newValue) =>
      set((state) => {
        state.panelDimensions = newValue;
      }),
    computed: {
      get fullZoomedPosition() {
        const zoomPos = get().zoomPosition;
        const panelDiz = get().panelDimensions;
        return [zoomPos[0] / panelDiz[0], zoomPos[1] / panelDiz[1]] as [
          number,
          number
        ];
      },
    },
  }))
);
