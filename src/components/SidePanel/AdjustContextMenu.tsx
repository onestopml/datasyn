import { RestoreOutlined, Close, Replay, Info } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { SketchPicker } from "react-color";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  IconButton,
  Slider,
  Switch,
  TextField,
  Typography,
  FormControlLabel,
  RadioGroup,
  Radio,
  Button,
  Menu,
  FormControl,
  Select,
  OutlinedInput,
  MenuItem,
} from "@mui/material";
import Icon from "@mui/material/Icon";
import { useQueryClient } from "@tanstack/react-query";
import produce from "immer";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useProjectStore } from "../../stores/project";
import { useKeyframeDataMutation } from "../../utils/useKeyframeDataMutation";
import { basePath, ColorTransferEnum } from "../../utils/constants";
const AdjustContextMenu = ({ handleClose }: any) => {
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

  const [pixelValue, setPixelValue] = useState(100);

  const [contrastValue, setContrastValue] = useState(0);
  const [mainContrastValue, setMainContrastValue] = useState(0);
  const [red, setRed] = useState(0);
  const [blue, setBlue] = useState(0);
  const [green, setGreen] = useState(0);
  const [alpha, setAlpha] = useState(1);
  const [colorTrans, setColorTrans] = useState<ColorTransferEnum>(
    ColorTransferEnum.none
  );
  const colorTransferArr: Array<{
    id: number;
    name: ColorTransferEnum;
    displayName: string;
    hiddenName: string;
  }> = [
    {
      id: 0,
      name: ColorTransferEnum.color_alt,
      displayName: "Color Alternation",
      hiddenName: "lab",
    },
    {
      id: 1,
      name: ColorTransferEnum.stats_norm,
      displayName: "Stats Normalization",
      hiddenName: "mean std",
    },
    {
      id: 2,
      name: ColorTransferEnum.stats_standz,
      displayName: "Stats Standardization",
      hiddenName: "pdf",
    },
    {
      id: 3,
      name: ColorTransferEnum.color_paint,
      displayName: "Color Painting",
      hiddenName: "konva",
    },
  ];
  const [rotateValue, setRotateValue] = useState(0);
  const [mainRotateValue, setMainRotateValue] = useState(0);

  const [motionBlurIntensityValue, setMotionBlurIntensityValue] = useState(0);
  const [mainMotionBlurIntensityValue, setMainMotionBlurIntensityValue] =
    useState(0);

  useEffect(() => {
    setScaleValue(selectedKeyframe?.data.parameters.scale ?? 1);
    setMainScaleValue(selectedKeyframe?.data.parameters.scale ?? 1);
  }, [selectedKeyframe?.data.parameters.scale]);
  useEffect(() => {
    setRotateValue(selectedKeyframe?.data.parameters.rotation ?? 0);
    setMainRotateValue(selectedKeyframe?.data.parameters.rotation ?? 0);
  }, [selectedKeyframe?.data.parameters.rotation]);
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
  useEffect(() => {
    setPixelValue(selectedKeyframe?.data.parameters.pixel_size ?? 100);
  }, [selectedKeyframe?.data.parameters.pixel_size]);
  useEffect(() => {
    setContrastValue(selectedKeyframe?.data.parameters.contrast ?? 0);
    setMainContrastValue(selectedKeyframe?.data.parameters.contrast ?? 0);
  }, [selectedKeyframe?.data.parameters.contrast]);
  useEffect(() => {
    setMotionBlurIntensityValue(
      selectedKeyframe?.data.parameters.motion_blur_intensity ?? 0
    );
    setMainMotionBlurIntensityValue(
      selectedKeyframe?.data.parameters.motion_blur_intensity ?? 0
    );
  }, [selectedKeyframe?.data.parameters.motion_blur_intensity]);
  useEffect(() => {
    setColorTrans(
      selectedKeyframe?.data.parameters.color_transfer.name ??
        ColorTransferEnum.none
    );
    setRed(selectedKeyframe?.data.parameters.color_transfer.r ?? 255);
    setBlue(selectedKeyframe?.data.parameters.color_transfer.b ?? 255);
    setGreen(selectedKeyframe?.data.parameters.color_transfer.g ?? 255);
    setAlpha(selectedKeyframe?.data.parameters.color_transfer.a ?? 0);
  }, [
    selectedKeyframe?.data.parameters.color_transfer.name,
    selectedKeyframe?.data.parameters.color_transfer.a,
    selectedKeyframe?.data.parameters.color_transfer.b,
    selectedKeyframe?.data.parameters.color_transfer.g,
    selectedKeyframe?.data.parameters.color_transfer.r,
  ]);
  const grayScaleEnable = useMemo(
    () => selectedKeyframe?.data.parameters.grayscale ?? false,
    [selectedKeyframe?.data.parameters.grayscale]
  );
  const [anchorPicker, setAnchorPicker] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handlePickerOpen = (e: any) => {
    setAnchorPicker(
      anchorPicker === null
        ? {
            mouseX: e.clientX + 2,
            mouseY: e.clientY - 6,
          }
        : null
    );
  };
  const handlePickerClose = () => {
    setAnchorPicker(null);
  };
  const flipEnable = useMemo(
    () => selectedKeyframe?.data.parameters.flip ?? false,
    [selectedKeyframe?.data.parameters.flip]
  );
  const reverseWheelChecked = useMemo(
    () => selectedKeyframe?.data.parameters.reverse_wheel ?? false,
    [selectedKeyframe?.data.parameters.reverse_wheel]
  );
  const changeKeyframeData = useKeyframeDataMutation(() => {
    queryClient.invalidateQueries(["/project/points"]);
  });
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
        return Promise.all(allPointUpdates);
      }
    },
    [changeKeyframeData, selectedPoint]
  );

  const updateContrastHandler = useCallback(
    (val: number) => {
      if (!selectedKeyframe) {
        return;
      }
      const newData = produce(selectedKeyframe, (draft) => {
        draft.data.parameters.contrast = val;
      });
      changeKeyframeData.mutate(
        {
          type: "update",
          data: newData,
        },
        {
          onSuccess() {
            // queryClient.invalidateQueries(["/project/points"]);
          },
        }
      );
    },
    [changeKeyframeData, selectedKeyframe]
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
        return Promise.all(allPointUpdates);
      }
    },
    [changeKeyframeData, selectedPoint]
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
        return Promise.all(allPointUpdates);
      }
    },
    [changeKeyframeData, selectedPoint]
  );

  const updateRotationHandler = useCallback(
    (val: number) => {
      // must update all keyframes!
      if (selectedPoint) {
        const allPointUpdates = selectedPoint.keyframes.map(
          (keyframeOfPoint) => {
            const newData = produce(keyframeOfPoint, (draft) => {
              draft.data.parameters.rotation = val;
            });
            return changeKeyframeData.mutate({
              type: "update",
              data: newData,
            });
          }
        );
        return Promise.all(allPointUpdates);
      }
    },
    [changeKeyframeData, selectedPoint]
  );
  const updateMotionBlurIntensityHandler = useCallback(
    (val: number) => {
      // must update all keyframes!
      if (selectedPoint) {
        const allPointUpdates = selectedPoint.keyframes.map(
          (keyframeOfPoint) => {
            const newData = produce(keyframeOfPoint, (draft) => {
              draft.data.parameters.motion_blur_intensity = val;
            });
            return changeKeyframeData.mutate({
              type: "update",
              data: newData,
            });
          }
        );
        return Promise.all(allPointUpdates);
      }
    },
    [changeKeyframeData, selectedPoint]
  );
  const updateFlipHandler = useCallback(
    (val: boolean) => {
      // must update all keyframes!
      if (selectedPoint) {
        const allPointUpdates = selectedPoint.keyframes.map(
          (keyframeOfPoint) => {
            const newData = produce(keyframeOfPoint, (draft) => {
              draft.data.parameters.flip = val;
            });
            return changeKeyframeData.mutate({
              type: "update",
              data: newData,
            });
          }
        );
        return Promise.all(allPointUpdates);
      }
    },
    [changeKeyframeData, selectedPoint]
  );
  const updateReverseWheelHandler = useCallback(
    (val: "clockwise" | "anticlockwise" | string) => {
      // must update all keyframes!
      if (selectedPoint) {
        const allPointUpdates = selectedPoint.keyframes.map(
          (keyframeOfPoint) => {
            const newData = produce(keyframeOfPoint, (draft) => {
              draft.data.parameters.reverse_wheel = val == "anticlockwise";
            });
            return changeKeyframeData.mutate({
              type: "update",
              data: newData,
            });
          }
        );
        return Promise.all(allPointUpdates);
      }
    },
    [changeKeyframeData, selectedPoint]
  );
  const updateColorHandler = useCallback(
    (color: any) => {
      if (selectedPoint) {
        const allPointUpdates = selectedPoint.keyframes.map(
          (keyframeOfPoint) => {
            const newData = produce(keyframeOfPoint, (draft) => {
              draft.data.parameters.color_transfer.r = color.rgb.r;
              draft.data.parameters.color_transfer.b = color.rgb.b;
              draft.data.parameters.color_transfer.g = color.rgb.g;
              draft.data.parameters.color_transfer.a = color.rgb.a;
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
  const updateColorTransferHandler = useCallback(
    (color: ColorTransferEnum) => {
      if (selectedPoint) {
        const allPointUpdates = selectedPoint.keyframes.map(
          (keyframeOfPoint) => {
            const newData = produce(keyframeOfPoint, (draft) => {
              draft.data.parameters.color_transfer.name = color;
              if (color !== "color_paint") {
                draft.data.parameters.color_transfer.r = 255;
                draft.data.parameters.color_transfer.b = 255;
                draft.data.parameters.color_transfer.g = 255;
                draft.data.parameters.color_transfer.a = 0;
              }
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
  const handleContrastChange = (e: any) => {
    setContrastValue(e.target.value);
  };
  const handleRotationChange = (e: any) => {
    setRotateValue(e.target.value);
  };
  const handleMotionBlurIntensityChange = (e: any) => {
    setMotionBlurIntensityValue(e.target.value);
  };
  const handleColorTransChange = (e: any) => {
    setColorTrans(e.target.value);
    updateColorTransferHandler(e.target.value);
  };
  const handleColorChange = (color: any) => {
    setRed(color.rgb.r);
    setBlue(color.rgb.b);
    setGreen(color.rgb.g);
    setAlpha(color.rgb.a);
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

  const handleRotationInputSave = (e: any) => {
    const convertedType = Number(e.target.value);
    switch (e.key) {
      case "Enter":
        if (convertedType >= 0 && convertedType <= 360) {
          setMainRotateValue(e.target.value);
          updateRotationHandler(convertedType);
        } else {
          toast.error("Not valid value. Please try again!!", {
            autoClose: 2000,
          });
          setRotateValue(mainRotateValue);
          updateRotationHandler(mainRotateValue);
        }
        break;
      case "Escape":
        setRotateValue(mainRotateValue);
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
        if (convertedType >= 0.01 && convertedType <= 5) {
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
  const handleContrastInputSave = (e: any) => {
    const convertedType = Number(e.target.value);
    switch (e.key) {
      case "Enter":
        if (convertedType >= 0 && convertedType <= 100) {
          setMainContrastValue(e.target.value);
          updateContrastHandler(convertedType);
        } else {
          toast.error("Not valid value. Please try again!!", {
            autoClose: 2000,
          });
          setContrastValue(mainContrastValue);
          updateContrastHandler(mainContrastValue);
        }
        break;
      case "Escape":
        setContrastValue(mainContrastValue);
        break;
      default:
        break;
    }
  };
  const handleMotionBlurIntensityInputSave = (e: any) => {
    const convertedType = Number(e.target.value);
    switch (e.key) {
      case "Enter":
        if (convertedType >= 0 && convertedType <= 100) {
          setMainMotionBlurIntensityValue(e.target.value);
          updateMotionBlurIntensityHandler(convertedType);
        } else {
          toast.error("Not valid value. Please try again!!", {
            autoClose: 2000,
          });
          setMainMotionBlurIntensityValue(mainMotionBlurIntensityValue);
          updateMotionBlurIntensityHandler(mainMotionBlurIntensityValue);
        }
        break;
      case "Escape":
        setMotionBlurIntensityValue(mainMotionBlurIntensityValue);
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
    <Box style={{ padding: 18 }} width={600}>
      <div
        style={{
          position: "fixed",
          top: -12,
          right: -12,
          backgroundColor: "#2c3e50",
          borderRadius: "1rem",
          width: "1.5rem",
          height: "1.5rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity: 0.8,
          cursor: "pointer",
        }}
        onClick={handleClose}
      >
        <Close fontSize="small" color="secondary" />
      </div>
      <Typography variant="h6" style={{ marginTop: "0.5rem" }}>
        Object Parameters
      </Typography>
      <Container
        disableGutters
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 5,
          alignItems: "flex-start",
          justifyContent: "space-evenly",
        }}
      >
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
              <Box>
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
          <Box
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <RadioGroup
              name="clockwise-radio-group"
              onChange={(e, newValue) => updateReverseWheelHandler(newValue)}
            >
              <FormControlLabel
                value="clockwise"
                control={<Radio checked={!reverseWheelChecked} />}
                label="Clockwise"
              />
              <FormControlLabel
                value="anticlockwise"
                control={<Radio checked={reverseWheelChecked} />}
                label="Anti-clockwise"
              />
            </RadioGroup>
            {reverseWheelChecked ? (
              <Icon
                style={{
                  width: "5rem",
                  height: "4rem",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  animation: `reverseWheelSpin infinite ${
                    100 / speedOfWheelValue
                  }s linear`,
                }}
              >
                <img
                  src={`${basePath}/wheel.svg`}
                  style={{ width: "3rem" }}
                  alt=""
                />
              </Icon>
            ) : (
              <Icon
                style={{
                  width: "5rem",
                  height: "4rem",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  animation: `defaultWheelSpin infinite ${
                    100 / speedOfWheelValue
                  }s linear`,
                }}
              >
                <img
                  src={`${basePath}/wheel.svg`}
                  style={{ width: "3rem" }}
                  alt=""
                />
              </Icon>
            )}
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
              <Typography>Image Quality</Typography>
              <Typography
                style={{
                  marginLeft: "0.5rem",
                  color: "#4503FF",
                  fontWeight: 600,
                }}
              ></Typography>
              <TextField
                value={pixelValue}
                type="number"
                name="pixel"
                disabled
                size="small"
                style={{ width: "10ch" }}
                inputProps={{ min: "0", max: "100" }}
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
              value={pixelValue}
              valueLabelFormat={Number(pixelValue).toFixed(0)}
              aria-label="Small"
              valueLabelDisplay="off"
              step={1}
              min={1}
              max={100}
              onChange={(e, val) => {
                setPixelValue(val as number);
              }}
              onChangeCommitted={(e, val) => {
                updatePixelSizeHandler(val as number);
              }}
            />
            <IconButton
              onClick={() => {
                setPixelValue(100);
                updatePixelSizeHandler(100);
              }}
              color={pixelValue != 0 ? "info" : "default"}
            >
              <RestoreOutlined />
            </IconButton>
          </Box>
        </Container>
        <Container disableGutters>
          <Box
            style={{
              display: "flex",
              justifyContent: "space-between",
              // marginTop: "1rem",
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
              <Typography>Contrast</Typography>
              <Typography
                style={{
                  marginLeft: "0.5rem",
                  color: "#4503FF",
                  fontWeight: 600,
                }}
              ></Typography>
              <TextField
                value={contrastValue}
                type="number"
                name="pixel"
                onChange={handleContrastChange}
                onKeyDown={handleContrastInputSave}
                size="small"
                style={{ width: "10ch" }}
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
              value={contrastValue}
              valueLabelFormat={Number(contrastValue).toFixed(0)}
              aria-label="Small"
              valueLabelDisplay="off"
              min={-100}
              max={100}
              step={1}
              onChange={(e, val) => {
                setContrastValue(val as number);
              }}
              onChangeCommitted={(e, val) => {
                updateContrastHandler(val as number);
              }}
            />
            <IconButton
              onClick={() => {
                setContrastValue(0);
                updateContrastHandler(0);
              }}
              color={contrastValue != 0 ? "info" : "default"}
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
              <Typography>Rotate Degree</Typography>
              <Typography
                style={{
                  marginLeft: "0.5rem",
                  color: "#4503FF",
                  fontWeight: 600,
                }}
              ></Typography>
              <TextField
                value={rotateValue}
                type="number"
                name="pixel"
                onChange={handleRotationChange}
                onKeyDown={handleRotationInputSave}
                size="small"
                style={{ width: "10ch" }}
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
              value={rotateValue}
              valueLabelFormat={Number(rotateValue).toFixed(0)}
              aria-label="Small"
              valueLabelDisplay="off"
              min={0}
              max={360}
              step={1}
              onChange={(e, val) => {
                setRotateValue(val as number);
              }}
              onChangeCommitted={(e, val) => {
                updateRotationHandler(val as number);
              }}
            />
            <IconButton
              onClick={() => {
                setRotateValue(0);
                updateRotationHandler(0);
              }}
              color={rotateValue != 0 ? "info" : "default"}
            >
              <RestoreOutlined />
            </IconButton>
          </Box>
          {/* motion blur  */}
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
              <Typography>Motion Blur</Typography>
              <Typography
                style={{
                  marginLeft: "0.5rem",
                  color: "#4503FF",
                  fontWeight: 600,
                }}
              ></Typography>
              <TextField
                value={motionBlurIntensityValue}
                type="number"
                name="pixel"
                onChange={handleMotionBlurIntensityChange}
                onKeyDown={handleMotionBlurIntensityInputSave}
                size="small"
                style={{ width: "10ch" }}
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
              value={motionBlurIntensityValue}
              valueLabelFormat={Number(motionBlurIntensityValue).toFixed(0)}
              aria-label="Small"
              valueLabelDisplay="off"
              min={0}
              max={100}
              step={1}
              onChange={(e, val) => {
                setMotionBlurIntensityValue(val as number);
              }}
              onChangeCommitted={(e, val) => {
                updateMotionBlurIntensityHandler(val as number);
              }}
            />
            <IconButton
              onClick={() => {
                setMotionBlurIntensityValue(0);
                updateMotionBlurIntensityHandler(0);
              }}
              color={motionBlurIntensityValue != 0 ? "info" : "default"}
            >
              <RestoreOutlined />
            </IconButton>
          </Box>
          {/* end motion blur */}
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography>Grayscale</Typography>
            <Switch
              onChange={(e, newValue) => {
                updateGrayscaleHandler(newValue);
              }}
              checked={grayScaleEnable}
            />
          </Box>
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography>Flip object</Typography>
            <Switch
              onChange={(e, newValue) => {
                updateFlipHandler(newValue);
              }}
              checked={flipEnable}
            />
          </Box>
          <Box
            style={{
              marginTop: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography>Color transfer</Typography>
            <FormControl fullWidth>
              <Select
                id="color-trans-select"
                input={<OutlinedInput />}
                onChange={handleColorTransChange}
                displayEmpty={true}
                value={colorTrans}
              >
                <MenuItem value={ColorTransferEnum.none}>None</MenuItem>
                {colorTransferArr.map((color, index) => (
                  <MenuItem key={color.id} value={color.name}>
                    {color.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {colorTrans == "color_paint" && (
            <Box
              style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography>Color</Typography>
              <Button onClick={handlePickerOpen}>Pick a color</Button>
              <Menu
                open={anchorPicker !== null}
                onClose={handlePickerClose}
                anchorReference="anchorPosition"
                anchorPosition={
                  anchorPicker !== null
                    ? {
                        top: anchorPicker.mouseY - 100,
                        left: anchorPicker.mouseX + 50,
                      }
                    : undefined
                }
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: "visible",
                    filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                    mt: 1,
                    "& .MuiAvatar-root": {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    "&:before": {
                      content: '""',
                      display: "block",
                      position: "absolute",
                      top: "50%",
                      left: -5,
                      width: 10,
                      height: 10,
                      bgcolor: "background.paper",
                      transform: "translateY(-120%) rotate(-45deg)",
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: "left", vertical: "center" }}
                anchorOrigin={{ horizontal: "left", vertical: "center" }}
              >
                <SketchPicker
                  color={{ r: red, g: green, b: blue, a: alpha }}
                  onChange={handleColorChange}
                  onChangeComplete={updateColorHandler}
                />
              </Menu>
            </Box>
          )}
        </Container>
      </Container>
    </Box>
  );
};
export default AdjustContextMenu;
