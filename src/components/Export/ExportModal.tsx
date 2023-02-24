import {
  Button,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import { useKeycloak } from "@react-keycloak/ssr";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { createPreviewVideo } from "../../api/renex";
import { useProjectStore } from "../../stores/project";
import { TaskStatusEnum } from "../../utils/constants";
import { generatePointFullFramesSequence } from "../../utils/generatePointFrames";
import { useTaskDataMutation } from "../../utils/useTaskDataMutation";
interface IComponentProps {
  open: boolean;
  handleClose(): void;
}
const ExportModal = ({ open, handleClose }: IComponentProps) => {
  const queryClient = useQueryClient();
  const { keycloak } = useKeycloak();
  const [no_gen_videos, setNoGenVideos] = useState(10);
  const [isStarting, setIsStarting] = useState(false);
  const [isFisheye, setIsFisheye] = useState(false);
  const projectData = useProjectStore((state) => state.computed.data.project);
  const taskDataMutator = useTaskDataMutation();
  const handleExportClicked = useCallback(async () => {
    try {
      setIsStarting(true);
      const data = await createPreviewVideo({
        dataset_id: projectData.dataset_id,
        sample_id: projectData.sample_id,
        output_fisheye: isFisheye,
        data: {
          multiple_video: true,
          no_gen_videos: +no_gen_videos,
          points: projectData.points.map((point) => ({
            object_class: point.object_class ?? "",
            gallery_id: point.gallery_id ?? "",
            object_id: point.object_id ?? "",
            keyframes: generatePointFullFramesSequence(point),
          })),
        },
        token: keycloak.token,
      });
      if (data.dag_id) {
        toast.success("Video generation task started");
        //add to task table
        taskDataMutator.mutate(
          {
            type: "insert",
            data: {
              dag_id: data.dag_id,
              run_id: data.run_id,
              type: "generate_multiple_videos",
              is_read: false,
              result: {},
              status: TaskStatusEnum.Queued,
              project_id: projectData.id,
              created_at: new Date(),
            },
          },
          {
            onSuccess() {
              queryClient.invalidateQueries(["/tasks", projectData.id]);
            },
          }
        );
      } else {
        toast.error("Cannot start video generation task!");
      }
    } catch (e) {
      toast.error("Cannot start video generation task!");
    } finally {
      setIsStarting(false);
      handleClose();
    }
  }, [
    handleClose,
    isFisheye,
    keycloak.token,
    no_gen_videos,
    projectData.dataset_id,
    projectData.id,
    projectData.points,
    projectData.sample_id,
    queryClient,
    taskDataMutator,
  ]);
  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Generate Videos"}</DialogTitle>
        <DialogContent>
          <DialogContentText>How many videos to generate?</DialogContentText>
          <br />
          <Container
            style={{ padding: 12, display: "flex", flexDirection: "column" }}
          >
            <TextField
              label="Number of videos"
              value={no_gen_videos}
              onChange={(e) => {
                setNoGenVideos(e.target.value as unknown as number);
              }}
            ></TextField>
            <br />
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
          </Container>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            color="error"
            variant="outlined"
            disabled={isStarting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExportClicked}
            autoFocus
            color="info"
            variant="contained"
            disabled={isStarting}
          >
            {!isStarting ? "Export" : "Submitting..."}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExportModal;
