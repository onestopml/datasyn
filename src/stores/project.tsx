import { immer } from "zustand/middleware/immer";
import create from "zustand";
import {
  Project,
  ProjectFrame,
  ProjectPoint,
  ProjectPointKeyframe,
} from "../api/backendClient";

interface ProjectState {
  project: Project;
  projectFrames: ProjectFrame[];
  projectPoints: ProjectPoint[];
  pointKeyframes: ProjectPointKeyframe[];
}
export type ProjectPointWithKeyframes = ProjectPoint & {
  keyframes: ProjectPointKeyframe[];
};
type ValidModalName = "object-bank" | "tasks" | "export" | "render" | "";
interface ProjectStore extends ProjectState {
  selectedPointId: number;
  currentFrameIndex: number;
  modal: ValidModalName;
  setModal(modalName: ValidModalName): void;
  setProjectAllData(newData: ProjectState): void;
  setSelectedPointId(pointId: number | { (val: number): number }): void;
  setCurrentFrameIndex(val: number | { (val: number): number }): void;
  computed: {
    selectedPoint: ProjectPointWithKeyframes | undefined;
    data: {
      project: Project & {
        frames: ProjectFrame[];
        points: Array<ProjectPointWithKeyframes>;
      };
    };
  };
}
export const useProjectStore = create<ProjectStore>()(
  immer((set, get) => ({
    project: {
      id: -1,
      project_uuid: "",
      name: "Unknown",
      frame_rate: 0,
      total_frames: 0,
      inserted_at: new Date(),
      updated_at: new Date(),
      thumbnail_blob: "",
      dataset_id: "",
      sample_id: "",
      user_uuid: "",
      frame_width: 0,
      frame_height: 0,
    },
    projectFrames: [],
    projectPoints: [],
    pointKeyframes: [],
    selectedPointId: 0,
    currentFrameIndex: 0,
    modal: "",
    setModal: (modalName: ValidModalName) =>
      set((state) => {
        state.modal = modalName;
      }),
    setProjectAllData: (newProjectData: ProjectState) =>
      set((state) => {
        state.project = newProjectData.project;
        state.projectFrames = newProjectData.projectFrames;
        state.projectPoints = newProjectData.projectPoints;
        state.pointKeyframes = newProjectData.pointKeyframes;
      }),
    setSelectedPointId: (newPointId: number | { (val: number): number }) =>
      set((state) => {
        if (typeof newPointId == "number") {
          state.selectedPointId = newPointId;
        } else {
          state.selectedPointId = newPointId(state.selectedPointId);
        }
      }),
    setCurrentFrameIndex: (newIndex: number | { (val: number): number }) =>
      set((state) => {
        if (typeof newIndex == "number") {
          state.currentFrameIndex = newIndex;
        } else {
          state.currentFrameIndex = newIndex(state.currentFrameIndex);
        }
      }),
    computed: {
      get selectedPoint() {
        const thePoint = get().projectPoints.find(
          (p) => p.id == get().selectedPointId
        );
        if (thePoint) {
          return {
            ...thePoint,
            keyframes: get().pointKeyframes.filter(
              (pkf) => pkf.point_id == thePoint.id
            ),
          };
        }
        return undefined;
      },
      get data() {
        return {
          project: {
            ...get().project,
            frames: get().projectFrames,
            points: get().projectPoints.map((point) => ({
              ...point,
              keyframes: get().pointKeyframes.filter(
                (pkf) => pkf.point_id == point.id
              ),
            })),
          },
        };
      },
    },
  }))
);
