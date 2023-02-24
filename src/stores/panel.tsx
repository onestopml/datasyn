import create from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
interface Section {
  id: string;
  name: string;
}
interface PanelStore {
  sections: Section[];
  setSection(items: Section): void;
}
export const usePanelStore = create<PanelStore>()(
  persist(
    immer((set, get) => ({
      sections: [
        {
          id: "1",
          name: "information",
        },
        {
          id: "2",
          name: "points",
        },
        {
          id: "3",
          name: "keyframes",
        },
        {
          id: "4",
          name: "adjust",
        },
      ],
      setSection: (items: Section) =>
        set((state: any) => {
          state.sections = items;
        }),
    })),
    {
      name: "panel-storage",
    }
  )
);
