import { useMutation } from "@tanstack/react-query";
import {
  insertPointKeyframe,
  PointKeyframeData,
  removePointKeyframe,
  updatePointKeyframe,
} from "../api/backendClient";

export const useKeyframeDataMutation = (callback?: () => void) => {
  const changeKeyframeData = useMutation(
    async (
      params:
        | {
            type: "insert";
            data: {
              point_id: number;
              sequence_id: number;
              data: PointKeyframeData;
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
            data: {
              id: number;
              point_id: number;
              sequence_id: number;
              data: PointKeyframeData;
              created_at: Date;
            };
          }
    ) => {
      const { type, data } = params;
      switch (type) {
        case "insert": {
          return insertPointKeyframe({
            point_id: data.point_id,
            sequence_id: data.sequence_id,
            data: data.data,
          });
        }
        case "remove": {
          return removePointKeyframe({ id: data.id });
        }
        case "update": {
          return updatePointKeyframe(data);
        }
        default:
          throw new Error("unsupported operation");
      }
    },
    {
      onSuccess: () => {
        if (callback) {
          callback();
        }
      },
    }
  );
  return changeKeyframeData;
};
