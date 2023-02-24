import { tasks } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { insertTask, markReadTask, updatetask } from "../api/backendClient";

export const useTaskDataMutation = (callback?: () => void) => {
  return useMutation(
    async (
      params:
        | {
            type: "insert" | "update";
            data: tasks;
          }
        | {
            type: "mark_read";
            data: {
              dag_id: string;
              run_id: string;
            };
          }
    ) => {
      switch (params.type) {
        case "insert": {
          return insertTask(params.data);
        }
        case "update": {
          return updatetask(params.data);
        }
        case "mark_read": {
          return markReadTask(params.data);
        }
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
};
