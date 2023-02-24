import { RestoreOutlined } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  FormControl,
  IconButton,
  Slider,
  Typography,
  TextField,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import produce from "immer";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useProjectStore } from "../../stores/project";
import { useKeyframeDataMutation } from "../../utils/useKeyframeDataMutation";
import { ToastContainer, toast } from "react-toastify";
import omit from "lodash/fp/omit";

const Adjust = () => {
  const queryClient = useQueryClient();
  const selectedPoint = useProjectStore(
    (state) => state.computed.selectedPoint
  );
  const currentFrameIndex = useProjectStore((state) => state.currentFrameIndex);
  const selectedKeyframe = useMemo(() => {
    const theKeyframe = selectedPoint?.keyframes.find(
      (el) => el.sequence_id == currentFrameIndex
    );
    return theKeyframe;
  }, [currentFrameIndex, selectedPoint?.keyframes]);
  const [scaleValue, setScaleValue] = useState(1);
  const [mainScaleValue, setMainScaleValue] = useState(1);
  const [brightnessValue, setBrightnessValue] = useState(200);
  const [mainBrightnessValue, setMainBrightnessValue] = useState(200);
  const [speedOfWheelValue, setSpeedOfWheelValue] = useState(100);
  const [mainSpeedOfWheelValue, setMainSpeedOfWheelValue] = useState(100);
  useEffect(() => {
    setScaleValue(selectedKeyframe?.data.parameters.scale ?? 1);
    setMainScaleValue(selectedKeyframe?.data.parameters.scale ?? 1);
  }, [selectedKeyframe?.data.parameters.scale]);
  useEffect(() => {
    setBrightnessValue(selectedKeyframe?.data.parameters.brightness ?? 200);
    setMainBrightnessValue(selectedKeyframe?.data.parameters.brightness ?? 200);
  }, [selectedKeyframe?.data.parameters.brightness]);
  useEffect(() => {
    setSpeedOfWheelValue(selectedKeyframe?.data.parameters.wheel_speed ?? 100);
    setMainSpeedOfWheelValue(
      selectedKeyframe?.data.parameters.wheel_speed ?? 100
    );
  }, [selectedKeyframe?.data.parameters.wheel_speed]);
  const changeKeyframeData = useKeyframeDataMutation();
  const updateScaleOfKeyframeHandler = useCallback(
    (val: number) => {
      if (!selectedKeyframe) {
        return;
      }
      const newData = produce(selectedKeyframe, (draft) => {
        draft.data.parameters.scale = val;
      });
      changeKeyframeData.mutate(
        {
          type: "update",
          data: newData,
        },
        {
          onSuccess() {
            queryClient.invalidateQueries(["/project/points"]);
          },
        }
      );
    },
    [changeKeyframeData, queryClient, selectedKeyframe]
  );
  const updateBrightnessOfKeyframeHandler = useCallback(
    (val: number) => {
      if (!selectedKeyframe) {
        return;
      }
      const newData = produce(selectedKeyframe, (draft) => {
        draft.data.parameters.brightness = val;
      });
      changeKeyframeData.mutate(
        {
          type: "update",
          data: newData,
        },
        {
          onSuccess() {
            queryClient.invalidateQueries(["/project/points"]);
          },
        }
      );
    },
    [changeKeyframeData, queryClient, selectedKeyframe]
  );
  const updateSpeedOfWheelHandler = useCallback(
    (val: number) => {
      // must update all keyframes!
      if (selectedPoint) {
        const allPointUpdates = selectedPoint.keyframes.map(
          (keyframeOfPoint) => {
            const newData = produce(keyframeOfPoint, (draft) => {
              draft.data.parameters.wheel_speed = val;
            });
            return changeKeyframeData.mutate({
              type: "update",
              data: newData,
            });
          }
        );
        return Promise.all(allPointUpdates).then(() => {
          queryClient.invalidateQueries(["/project/points"]);
        });
      }
    },
    [changeKeyframeData, queryClient, selectedPoint]
  );
  const updatePixelSizeHandler = useCallback(
    (val: number) => {
      // must update all keyframes!
      if (selectedPoint) {
        const allPointUpdates = selectedPoint.keyframes.map(
          (keyframeOfPoint) => {
            const newData = produce(keyframeOfPoint, (draft) => {
              draft.data.parameters.pixel_size = val;
            });
            return changeKeyframeData.mutate({
              type: "update",
              data: newData,
            });
          }
        );
        return Promise.all(allPointUpdates).then(() => {
          queryClient.invalidateQueries(["/project/points"]);
        });
      }
    },
    [changeKeyframeData, queryClient, selectedPoint]
  );
  const updateGrayscaleHandler = useCallback(
    (val: boolean) => {
      // must update all keyframes!
      if (selectedPoint) {
        const allPointUpdates = selectedPoint.keyframes.map(
          (keyframeOfPoint) => {
            const newData = produce(keyframeOfPoint, (draft) => {
              draft.data.parameters.grayscale = val;
            });
            return changeKeyframeData.mutate({
              type: "update",
              data: newData,
            });
          }
        );
        return Promise.all(allPointUpdates).then(() => {
          queryClient.invalidateQueries(["/project/points"]);
        });
      }
    },
    [changeKeyframeData, queryClient, selectedPoint]
  );
  const handleBrightnessInputChange = (e: any) => {
    setBrightnessValue(e.target.value);
  };

  const handleScaleInputChange = (e: any) => {
    setScaleValue(e.target.value);
  };
  const handleSpeedOfWheelChange = (e: any) => {
    setSpeedOfWheelValue(e.target.value);
  };

  const handleBrightnessInputSave = (e: any) => {
    const convertedType = Number(e.target.value);
    switch (e.key) {
      case "Enter":
        if (convertedType >= 0 && convertedType <= 510) {
          setMainBrightnessValue(e.target.value);
          updateBrightnessOfKeyframeHandler(convertedType);
        } else {
          toast.error("Not valid value. Please try again!!", {
            autoClose: 2000,
          });
          setBrightnessValue(mainBrightnessValue);
          updateBrightnessOfKeyframeHandler(mainBrightnessValue);
        }
        break;
      case "Escape":
        setBrightnessValue(mainBrightnessValue);
        break;
      case "e":
      case "E":
      case "+":
      case ".":
      case "-":
        e.preventDefault();
        break;
      default:
        break;
    }
  };
  const handleSpeedOfWheelInputSave = (e: any) => {
    const convertedType = Number(e.target.value);
    switch (e.key) {
      case "Enter":
        if (convertedType >= 0 && convertedType <= 360) {
          setMainSpeedOfWheelValue(e.target.value);
          updateSpeedOfWheelHandler(convertedType);
        } else {
          toast.error("Not valid value. Please try again!!", {
            autoClose: 2000,
          });
          setSpeedOfWheelValue(mainSpeedOfWheelValue);
          updateSpeedOfWheelHandler(mainSpeedOfWheelValue);
        }
        break;
      case "Escape":
        setSpeedOfWheelValue(mainSpeedOfWheelValue);
        break;
      case "e":
      case "E":
      case "+":
      case "-":
      case ".":
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  const handleScaleInputSave = (e: any) => {
    const convertedType = Number(e.target.value);
    switch (e.key) {
      case "Enter":
        if (convertedType >= 0.1 && convertedType <= 5) {
          setMainScaleValue(e.target.value);
          updateScaleOfKeyframeHandler(convertedType);
        } else {
          toast.error("Not valid value. Please try again!!", {
            autoClose: 2000,
          });
          setScaleValue(mainScaleValue);
          updateScaleOfKeyframeHandler(mainScaleValue);
        }
        break;
      case "Escape":
        setScaleValue(mainScaleValue);
        break;
      case "e":
      case "E":
      case "+":
      case "-":
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  if (!selectedKeyframe) {
    return (
      <Box style={{ padding: 24 }}>
        <Accordion defaultExpanded={true}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography variant="h6">Object Parameters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>Select a keyframe first</Typography>
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
          <Typography variant="h6">Object Parameters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Container disableGutters>
            <Box style={{ display: "flex", justifyContent: "space-between" }}>
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Typography>Scale</Typography>
                <TextField
                  value={scaleValue}
                  type="number"
                  name="scale"
                  onChange={handleScaleInputChange}
                  onKeyDown={handleScaleInputSave}
                  size="small"
                  style={{ width: "10ch" }}
                  inputProps={{ min: "0.1", max: "5" }}
                />
              </Box>
            </Box>
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "0.5rem",
              }}
            >
              <Slider
                size="small"
                value={scaleValue}
                aria-label="Small"
                valueLabelDisplay="off"
                min={0.01}
                max={5}
                step={0.01}
                onChange={(e, val) => {
                  setScaleValue(val as number);
                }}
                onChangeCommitted={(e, val) => {
                  updateScaleOfKeyframeHandler(val as number);
                }}
                // marks={[{ label: "Default", value: 1 }]}
              />
              <IconButton
                onClick={() => {
                  setScaleValue(1);
                  updateScaleOfKeyframeHandler(1);
                }}
                color={scaleValue != 1 ? "info" : "default"}
              >
                <RestoreOutlined />
              </IconButton>
            </Box>
            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "1rem",
              }}
            >
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Typography>Brightness</Typography>
                <TextField
                  value={brightnessValue}
                  type="number"
                  name="brightness"
                  onChange={handleBrightnessInputChange}
                  onKeyDown={handleBrightnessInputSave}
                  size="small"
                  style={{ width: "10ch" }}
                  inputProps={{ min: "0", max: "510" }}
                />
              </Box>
            </Box>
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "0.5rem",
              }}
            >
              <Slider
                size="small"
                value={brightnessValue}
                aria-label="Small"
                valueLabelDisplay="off"
                min={0}
                max={510}
                step={1}
                onChange={(e, val) => {
                  setBrightnessValue(val as number);
                }}
                onChangeCommitted={(e, val) => {
                  updateBrightnessOfKeyframeHandler(val as number);
                }}
                // marks={[{ label: "Default", value: 255 }]}
              />
              <IconButton
                onClick={() => {
                  setBrightnessValue(200);
                  updateBrightnessOfKeyframeHandler(200);
                }}
                color={brightnessValue != 200 ? "info" : "default"}
              >
                <RestoreOutlined />
              </IconButton>
            </Box>
            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "1rem",
              }}
            >
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Typography>Wheel speed</Typography>
                <Typography
                  style={{
                    marginLeft: "0.5rem",
                    color: "#4503FF",
                    fontWeight: 600,
                  }}
                ></Typography>
                <TextField
                  value={speedOfWheelValue}
                  type="number"
                  name="speedwheel"
                  onChange={handleSpeedOfWheelChange}
                  onKeyDown={handleSpeedOfWheelInputSave}
                  size="small"
                  style={{ width: "10ch" }}
                  inputProps={{ min: "0", max: "360" }}
                />
              </Box>
            </Box>
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "0.5rem",
              }}
            >
              <Slider
                size="small"
                value={speedOfWheelValue}
                valueLabelFormat={Number(speedOfWheelValue).toFixed(0)}
                aria-label="Small"
                valueLabelDisplay="off"
                min={0}
                max={360}
                step={1}
                onChange={(e, val) => {
                  setSpeedOfWheelValue(val as number);
                }}
                onChangeCommitted={(e, val) => {
                  updateSpeedOfWheelHandler(val as number);
                }}
                // marks={[{ label: "Default", value: 255 }]}
              />
              <IconButton
                onClick={() => {
                  setSpeedOfWheelValue(100);
                  updateSpeedOfWheelHandler(100);
                }}
                color={speedOfWheelValue != 100 ? "info" : "default"}
              >
                <RestoreOutlined />
              </IconButton>
            </Box>
          </Container>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
export default Adjust;
