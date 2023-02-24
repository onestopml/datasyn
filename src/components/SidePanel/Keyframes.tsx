import { useCallback, useEffect, useMemo, useState } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";

import {
  AddPhotoAlternateOutlined,
  RemoveCircleOutlineTwoTone,
} from "@mui/icons-material";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import sortBy from "lodash/fp/sortBy";
import { useProjectStore } from "../../stores/project";
import {
  getColorTransferOfPoint,
  getFlipOfPoint,
  getGrayscaleOfPoint,
  getLayerOfPoint,
  getMotionBlurIntensityOfPoint,
  getPixelSizeOfPoint,
  getReverseWheelOfPoint,
  getRotationOfPoint,
  getWheelSpeedOfPoint,
  interpolatedBrightnessOfPoint,
  interpolatedPositionOfPoint,
  interpolatedScaleOfPoint,
} from "../../utils/generatePointFrames";
import { useKeyframeDataMutation } from "../../utils/useKeyframeDataMutation";
import { ProjectPointKeyframe } from "../../api/backendClient";
const Keyframes = () => {
  const queryClient = useQueryClient();
  const selectedPoint = useProjectStore(
    (state) => state.computed.selectedPoint
  );
  const currentFrameIndex = useProjectStore((state) => state.currentFrameIndex);
  const [newKeyframeIndex, setNewKeyframeIndex] = useState(0);
  const frameDataMutator = useKeyframeDataMutation();

  const isActiveCurrentFrame = useCallback(
    (mark: ProjectPointKeyframe, sequence_id: number) => {
      return mark.sequence_id == sequence_id;
    },
    []
  );
  const setCurrentFrameIndex = useProjectStore(
    (state) => state.setCurrentFrameIndex
  );
  useEffect(() => {
    //we update the index when frame index change
    setNewKeyframeIndex(currentFrameIndex);
  }, [currentFrameIndex]);
  const addKeyframeHandler = useCallback(
    (point_id: number, sequence_id: number) => {
      if (!selectedPoint) {
        return "";
      }

      frameDataMutator.mutate(
        {
          type: "insert",
          data: {
            point_id: point_id,
            sequence_id: sequence_id,
            data: {
              start_position: interpolatedPositionOfPoint(
                selectedPoint,
                sequence_id,
                "start"
              ),
              end_position: interpolatedPositionOfPoint(
                selectedPoint,
                sequence_id,
                "end"
              ),
              parameters: {
                scale: interpolatedScaleOfPoint(selectedPoint, sequence_id),
                brightness: interpolatedBrightnessOfPoint(
                  selectedPoint,
                  sequence_id
                ),
                wheel_speed: getWheelSpeedOfPoint(selectedPoint),
                pixel_size: getPixelSizeOfPoint(selectedPoint),
                contrast: 0,
                grayscale: getGrayscaleOfPoint(selectedPoint),
                flip: getFlipOfPoint(selectedPoint),
                reverse_wheel: getReverseWheelOfPoint(selectedPoint),
                layer: getLayerOfPoint(selectedPoint),
                rotation: getRotationOfPoint(selectedPoint),
                motion_blur_intensity:
                  getMotionBlurIntensityOfPoint(selectedPoint),
                color_transfer: getColorTransferOfPoint(selectedPoint),
              },
            },
          },
        },
        {
          onSuccess() {
            //invalidate the points
            queryClient.invalidateQueries(["/project/points"]);
          },
        }
      );
    },
    [frameDataMutator, queryClient, selectedPoint]
  );
  const removeKeyframeHandler = useCallback(
    (keyframe_id: number) => {
      frameDataMutator.mutate(
        { type: "remove", data: { id: keyframe_id } },
        {
          onSuccess() {
            queryClient.invalidateQueries(["/project/points"]);
          },
        }
      );
    },
    [frameDataMutator, queryClient]
  );
  const isAtKeyframe = useMemo(() => {
    return selectedPoint?.keyframes.some(
      (kf) => kf.sequence_id == newKeyframeIndex
    );
  }, [newKeyframeIndex, selectedPoint?.keyframes]);
  const sortedKeyframes = useMemo(() => {
    if (selectedPoint) {
      return sortBy((el) => el.sequence_id, selectedPoint?.keyframes ?? []);
    } else {
      return [];
    }
  }, [selectedPoint]);

  if (!selectedPoint) {
    return (
      <Box style={{ padding: 24 }}>
        <Accordion defaultExpanded={true}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography variant="h6">Keyframes</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>Please select a point first</Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  }
  return (
    <Box style={{ padding: 24 }}>
      <Accordion defaultExpanded={true}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography variant="h6">Keyframes</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            style={{
              display: "flex",
              flexDirection: "row",
              paddingLeft: 12,
              paddingRight: 12,
            }}
          >
            <FormControl
              sx={{
                width: "100%",
              }}
            >
              <InputLabel>New Keyframe Number</InputLabel>
              <OutlinedInput
                type="number"
                label="New Keyframe Number"
                value={newKeyframeIndex}
                onChange={(e) =>
                  setNewKeyframeIndex(parseInt(e.target.value, 10))
                }
                endAdornment={
                  <InputAdornment position="start">
                    <IconButton
                      edge="end"
                      color="success"
                      onClick={() => {
                        addKeyframeHandler(selectedPoint.id, newKeyframeIndex);
                      }}
                      disabled={isAtKeyframe}
                    >
                      <AddPhotoAlternateOutlined />
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
          </Box>

          <List>
            {sortedKeyframes.map((mark, index) => {
              return (
                <ListItem key={mark.id}>
                  <Box style={{ display: "flex", gap: 4, width: "100%" }}>
                    <Button
                      variant={
                        isActiveCurrentFrame(mark, currentFrameIndex)
                          ? "contained"
                          : "outlined"
                      }
                      color="success"
                      onClick={() => {
                        setCurrentFrameIndex(mark.sequence_id);
                      }}
                    >
                      {mark.sequence_id}
                    </Button>
                    <div style={{ flex: 1 }}></div>
                    <IconButton
                      color="error"
                      // style={{ marginLeft: "1rem", backgroundColor: "#ecf0f1" }}

                      onClick={() => removeKeyframeHandler(mark.id)}
                    >
                      <RemoveCircleOutlineTwoTone />
                    </IconButton>
                  </Box>
                </ListItem>
              );
            })}
            <ListItem>
              {sortedKeyframes.length == 0 && (
                <Typography>Please add a keyframe first</Typography>
              )}
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default Keyframes;
