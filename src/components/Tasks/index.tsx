import {
  CheckTwoTone,
  CloseTwoTone,
  DeleteForever,
  FastForwardTwoTone,
  OpenInBrowser,
  PauseTwoTone,
  WorkRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  LinearProgress,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import { Prisma, tasks } from "@prisma/client";
import { useKeycloak } from "@react-keycloak/ssr";
import { useQuery } from "@tanstack/react-query";
import { formatRelative, parseISO } from "date-fns";
import Plyr from "plyr-react";
import "plyr-react/plyr.css";

import { useCallback, useMemo, useState } from "react";
import { getTasksUnread } from "../../api/backendClient";
import { useProjectStore } from "../../stores/project";
import { filePathPrefix, http, TaskStatusEnum } from "../../utils/constants";
import { useTaskDataMutation } from "../../utils/useTaskDataMutation";
const TaskItem = ({
  task,
  onOpenPreview,
  onRefetch,
}: {
  task: tasks;
  onOpenPreview(): void;
  onRefetch(): void;
}) => {
  const taskDataMutator = useTaskDataMutation();
  const { keycloak } = useKeycloak();
  // this get from renex, not from our own database
  const taskData = useQuery(
    ["/tasks/", task.dag_id, task.run_id],
    () => {
      return fetch(`${http}/tasks/${task.dag_id}/${task.run_id}`, {
        headers: new Headers({
          Authorization: `Bearer ${keycloak.token}`,
        }),
      }).then((resp) => resp.json());
    },
    {
      refetchInterval: 5000,
      enabled:
        task.status != TaskStatusEnum.Success &&
        task.status !== TaskStatusEnum.Failed &&
        task.dag_id != "" &&
        task.run_id != "",
      onSuccess(eventData) {
        //update the task back
        taskDataMutator.mutate(
          {
            type: "update",
            data: {
              dag_id: eventData.dag_id,
              run_id: eventData.run_id,
              result: eventData.result ? eventData.result : Prisma.DbNull,
              is_read: false,
              status: eventData.status ?? "checking",
              project_id: task.project_id,
              type: task.type,
              created_at: task.created_at,
            },
          },
          {
            onSuccess() {
              onRefetch();
            },
          }
        );
      },
    }
  );
  const indicatorIcon = useMemo(() => {
    switch (task.status) {
      case TaskStatusEnum.Queued:
        return <PauseTwoTone color="warning" fontSize="small"></PauseTwoTone>;
      case TaskStatusEnum.Failed:
        return <CloseTwoTone color="error" fontSize="small"></CloseTwoTone>;
      case TaskStatusEnum.Running:
        return (
          <FastForwardTwoTone
            color="info"
            fontSize="small"
          ></FastForwardTwoTone>
        );
      case TaskStatusEnum.Success:
        return <CheckTwoTone color="success" fontSize="small"></CheckTwoTone>;
      default:
        return <CloseTwoTone color="error" fontSize="small"></CloseTwoTone>;
    }
  }, [task]);
  return (
    <Box>
      {task.status == TaskStatusEnum.Running && (
        <LinearProgress
          variant="determinate"
          value={taskData?.data?.progress?.percent ?? 10}
        />
      )}
      <br />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 1,
        }}
      >
        <WorkRounded fontSize="small" />
        <Typography>{task.type}</Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 1,
        }}
      >
        {indicatorIcon}
        <Typography variant="caption" fontSize={"small"}>
          {task.status}{" "}
          {task.created_at
            ? formatRelative(
                parseISO(task.created_at as unknown as string),
                Date.now()
              )
            : "No date"}
        </Typography>
      </Box>
      <br />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Button
          onClick={onOpenPreview}
          disabled={task.status !== TaskStatusEnum.Success}
          startIcon={<OpenInBrowser />}
          variant="contained"
          size="small"
          color="info"
        >
          Open
        </Button>
        <Button
          onClick={() => {
            taskDataMutator.mutate(
              {
                type: "mark_read",
                data: {
                  dag_id: task.dag_id,
                  run_id: task.run_id,
                },
              },
              {
                onSuccess() {
                  onRefetch();
                },
              }
            );
          }}
          startIcon={<DeleteForever />}
          color="error"
          size="small"
        >
          Mark as Read
        </Button>
      </Box>
    </Box>
  );
};
export const Tasks = () => {
  const projectData = useProjectStore((state) => state.computed.data.project);
  const modalName = useProjectStore((state) => state.modal);
  const setModalName = useProjectStore((state) => state.setModal);
  const tasks = useQuery(
    ["/local_tasks/", projectData.id],
    async () => {
      return getTasksUnread(projectData.id);
    },
    {
      refetchInterval: 10000,
    }
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const handleTaskOpen = useCallback((task: tasks) => {
    if (task.type == "preview_video") {
      setCurrentVideoUrl(
        `${http}${filePathPrefix}/${(task.result as any).sample.filepath}`
      );
      setDialogOpen(true);
    }
    const openInNewTab = (url: string) => {
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (newWindow) newWindow.opener = null;
    };
    if (task.type == "generate_multiple_videos") {
      openInNewTab(`/#/dataset?id=${(task.result as any).dataset.id}`);
    }
  }, []);
  return (
    <Container>
      <Drawer
        anchor="right"
        open={modalName == "tasks"}
        onClose={() => {
          setModalName("");
        }}
      >
        <Box sx={{ padding: 4, minWidth: "300px" }}>
          <Typography variant="h4">Tasks</Typography>
          <Typography variant="subtitle1">
            Check your task queue here
          </Typography>
          <hr />
          <List>
            {tasks.data?.data?.map((el) => {
              return (
                <ListItem key={el.run_id}>
                  <TaskItem
                    task={el}
                    onOpenPreview={() => {
                      handleTaskOpen(el);
                    }}
                    onRefetch={() => {
                      tasks.refetch();
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle id="alert-dialog-title">{"Preview Video"}</DialogTitle>
        <DialogContent>
          <Plyr
            crossOrigin="true"
            source={{
              type: "video",
              title: "preview",
              sources: [
                {
                  src: currentVideoUrl,
                },
              ],
            }}
          ></Plyr>
        </DialogContent>
      </Dialog>
    </Container>
  );
};
