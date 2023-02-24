import create from "zustand";
import { immer } from "zustand/middleware/immer";

interface ObjectBankStore {
  selectedGalleryId: string;
  setSelectedGalleryId(val: string): void;
}
export const useObjectBankStore = create<ObjectBankStore>()(
  immer((set, get) => ({
    selectedGalleryId: "",
    setSelectedGalleryId: (val: string) =>
      set((state) => {
        state.selectedGalleryId = val;
      }),
  }))
);
