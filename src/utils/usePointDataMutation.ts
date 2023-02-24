import { project_points } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import {
  deleteProjectPoint,
  insertProjectPoint,
  updateProjectPoint,
} from "../api/backendClient";

export const usePointDataMutation = (callback?: () => void) => {
  const changePointData = useMutation(
    async (
      params:
        | {
            type: "insert";
            data: {
              id?: number;
              multi: boolean;
              label: string;
              project_id?: number;
              sequence_id?: number; //this is to add a point at that frame
            };
          }
        | {
            type: "remove";
            data: {
              id: number;
            };
          }
        | {
            type: "update";
            data: Partial<project_points>;
          }
    ) => {
      const { type, data } = params;
      switch (type) {
        case "insert": {
          return insertProjectPoint({
            project_id: data.project_id,
            multi: data.multi,
            label: data.label,
          });
        }
        case "remove": {
          return deleteProjectPoint(data);
        }
        case "update": {
          return updateProjectPoint(data);
        }
        default:
          throw new Error("unsupported operation");
      }
    },
    {
      onSuccess() {
        if (callback) {
          callback();
        }
      },
    }
  );
  return changePointData;
};
