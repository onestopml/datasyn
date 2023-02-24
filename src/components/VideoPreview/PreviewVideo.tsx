import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Modal,
  Switch,
  Typography,
} from "@mui/material";
import { useKeycloak } from "@react-keycloak/ssr";
import { useQuery } from "@tanstack/react-query";
import Plyr from "plyr-react";
import "plyr-react/plyr.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { createPreviewVideo } from "../../api/renex";
import { useProjectStore } from "../../stores/project";
import { filePathPrefix, http, TaskStatusEnum } from "../../utils/constants";
import { generatePointFullFramesSequence } from "../../utils/generatePointFrames";
import { useTaskDataMutation } from "../../utils/useTaskDataMutation";
const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  minWidth: "500px",
  maxWidth: "80vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: "0.5rem",
  "@media (min-width: 1063px)": {
    width: "64rem",
  },
};

const PreviewVideo = ({
  open,
  handleClose,
}: {
  open: boolean;
  handleClose: () => void;
}) => {
  const { keycloak } = useKeycloak();
  const projectData = useProjectStore((state) => state.computed.data.project);
  const taskDataMutator = useTaskDataMutation();
  const [isFisheye, setIsFisheye] = useState(false);
  const [currentVideoTask, setCurrentVideoTask] = useState<{
    dag_id: string;
    run_id: string;
    status: TaskStatusEnum;
    video_url: string;
    progress: {
      percent: number;
      message: string;
    };
  }>({
    dag_id: "",
    run_id: "",
    status: TaskStatusEnum.Queued,
    video_url: "",
    progress: { percent: 0, message: "" },
  });
  useEffect(() => {
    if (!open) {
      setCurrentVideoTask((v) => ({
        dag_id: "",
        run_id: "",
        status: TaskStatusEnum.Queued,
        video_url: "",
        progress: { percent: 0, message: "" },
      }));
    }
  }, [open]);
  const videoSrc: Plyr.SourceInfo = useMemo(
    () => ({
      type: "video",
      title: "preview",
      sources: [
        {
          src:
            currentVideoTask.video_url ??
            "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        },
      ],
    }),
    [currentVideoTask.video_url]
  );
  const taskData = useQuery(
    ["/tasks/", currentVideoTask.dag_id, currentVideoTask.run_id],
    () => {
      return fetch(
        `${http}/tasks/${currentVideoTask.dag_id}/${currentVideoTask.run_id}`,
        {
          headers: new Headers({
            Authorization: `Bearer ${keycloak.token}`,
          }),
        }
      ).then((resp) => resp.json());
    },
    {
      refetchInterval: 4000,
      enabled:
        currentVideoTask.status != TaskStatusEnum.Success &&
        currentVideoTask.status != TaskStatusEnum.Failed &&
        currentVideoTask.dag_id != "" &&
        currentVideoTask.run_id != "",
      onSuccess(eventData) {
        if (eventData.status == TaskStatusEnum.Running) {
          setCurrentVideoTask((v) => ({
            ...v,
            status: TaskStatusEnum.Running,
            progress: {
              percent: eventData.progress.percent,
              message: eventData.progress.message,
            },
          }));
        }
        if (eventData.status == TaskStatusEnum.Success) {
          setCurrentVideoTask((v) => ({
            ...v,
            status: TaskStatusEnum.Success,
            video_url: `${filePathPrefix}/${
              eventData?.result?.sample?.filepath ?? eventData?.result?.filepath
            }`,
          }));
        }
        if (eventData.status == TaskStatusEnum.Failed) {
          setCurrentVideoTask((v) => ({
            ...v,
            status: TaskStatusEnum.Failed,
            progress: {
              percent: 100,
              message: eventData?.error?.message ?? "Error! Try again later!",
            },
          }));
        }
      },
    }
  );
  // console.log(taskData);
  const createVideoTaskHandler = useCallback(async () => {
    try {
      const data = await createPreviewVideo({
        dataset_id: projectData.dataset_id,
        sample_id: projectData.sample_id,
        output_fisheye: isFisheye,
        data: {
          multiple_video: false,
          points: projectData.points.map((point) => ({
            object_id: point.object_id ?? "",
            object_class: point.object_class ?? "",
            gallery_id: point.gallery_id ?? "",
            keyframes: generatePointFullFramesSequence(point),
          })),
        },
        token: keycloak.token,
      });
      if (data.dag_id) {
        setCurrentVideoTask((v) => ({
          ...v,
          status: TaskStatusEnum.Running,
          dag_id: data.dag_id,
          run_id: data.run_id,
        }));
        //add to task table
        taskDataMutator.mutate({
          type: "insert",
          data: {
            dag_id: data.dag_id,
            run_id: data.run_id,
            type: "preview_video",
            is_read: false,
            result: {},
            status: TaskStatusEnum.Queued,
            project_id: projectData.id,
            created_at: new Date(),
          },
        });
      } else {
        toast.error("Cannot generate preview video!");
      }
    } catch (e) {
      toast.error("Cannot generate preview video!");
    }
  }, [
    isFisheye,
    keycloak.token,
    projectData.dataset_id,
    projectData.id,
    projectData.points,
    projectData.sample_id,
    taskDataMutator,
  ]);
  return (
    <Modal
      open={open}
      // onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <>
        {currentVideoTask.status == TaskStatusEnum.Queued && (
          <Box
            sx={{
              ...style,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 12,
              paddingBottom: 12,
              gap: 2,
            }}
          >
            <Typography variant="h6">
              Render a single video before batch processing
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  title="Fisheye?"
                  checked={isFisheye}
                  onChange={(e, checked) => {
                    setIsFisheye(checked);
                  }}
                ></Switch>
              }
              label="Fisheye?"
            ></FormControlLabel>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                onClick={createVideoTaskHandler}
                color="info"
                variant="contained"
              >
                Render Video
              </Button>
              <Button variant="outlined" color="error" onClick={handleClose}>
                Cancel
              </Button>
            </Box>
          </Box>
        )}
        {currentVideoTask.status == TaskStatusEnum.Running && (
          <Box
            sx={{
              ...style,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            <Typography variant="h6">Rendering...</Typography>{" "}
            <CircularProgress
              variant="determinate"
              value={currentVideoTask.progress.percent}
            ></CircularProgress>
            <br />
            <Typography variant="h6">
              {currentVideoTask.progress.message}
            </Typography>
            <br />
            <Button variant="outlined" color="error" onClick={handleClose}>
              Cancel
            </Button>
          </Box>
        )}
        {currentVideoTask.status == TaskStatusEnum.Success && (
          <Box sx={style}>
            <Typography
              id="modal-modal-title"
              variant="h6"
              component="h2"
              style={{ marginBottom: "1rem" }}
            >
              Video preview:
            </Typography>
            <Plyr source={videoSrc} crossOrigin="true" />
            <Box
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "1rem",
              }}
            >
              <Button variant="outlined" color="error" onClick={handleClose}>
                Close
              </Button>
            </Box>
          </Box>
        )}
        {currentVideoTask.status == TaskStatusEnum.Failed && (
          <Box
            sx={{
              ...style,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            <Typography
              id="modal-modal-title"
              variant="h6"
              component="h2"
              style={{ marginBottom: "1rem" }}
            >
              {currentVideoTask.progress.message}
            </Typography>
            <Button variant="outlined" color="error" onClick={handleClose}>
              Close
            </Button>
          </Box>
        )}
      </>
    </Modal>
  );
};

export default PreviewVideo;
