import {
  FastForward,
  FastRewind,
  FirstPage,
  LastPage,
  Pause,
  PlayArrow,
  Wallpaper,
} from "@mui/icons-material";
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  Menu,
  OutlinedInput,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import produce from "immer";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import maxBy from "lodash/fp/maxBy";
import minBy from "lodash/fp/minBy";
import sortBy from "lodash/fp/sortBy";
import { createInterpolator } from "range-interpolator";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
} from "react-konva";
import { useBoolean, useElementSize } from "usehooks-ts";

import {
  getPointKeyframes,
  getProjectByUUID,
  getProjectFrames,
  getProjectPoints,
} from "../../api/backendClient";
import {
  ProjectPointWithKeyframes,
  useProjectStore,
} from "../../stores/project";
import { useZoomStore } from "../../stores/zoom";
import {
  biggestKeyframeOfPoint,
  getFlipOfPoint,
  getGrayscaleOfPoint,
  getLayerOfPoint,
  getMotionBlurIntensityOfPoint,
  getPixelSizeOfPoint,
  getReverseWheelOfPoint,
  getRotationOfPoint,
  getWheelSpeedOfPoint,
  interpolatedFinalPositionOfPoint,
  isPointVisibleAtFrame,
  smallestKeyframeOfPoint,
  getColorTransferOfPoint,
} from "../../utils/generatePointFrames";
import { useKeyframeDataMutation } from "../../utils/useKeyframeDataMutation";
import { usePointDataMutation } from "../../utils/usePointDataMutation";
import AdjustContextMenu from "../SidePanel/AdjustContextMenu";
import { CustomisedSlider } from "./CustomisedSlider";
import { FisheyePlayer } from "./FisheyePlayer";
import { KonvaImageWithParams } from "./KonvaImageWithParams";
import PreviewFrame from "./PreviewFrame";

export async function fetchProjectFramesData(projectUUID: string) {
  const projectData = await getProjectByUUID(projectUUID);
  const project = projectData?.data?.[0];
  const projectFrames = await getProjectFrames(project.id);

  return {
    project,
    projectFrames: projectFrames.data ?? [],
  };
}
export async function fetchProjectPointsData(projectId: number) {
  const projectPoints = await getProjectPoints(projectId);
  const pointKeyframes = await getPointKeyframes(
    projectPoints.data.map((p) => p.id)
  );
  return {
    projectPoints: projectPoints.data,
    pointKeyframes: pointKeyframes.data,
  };
}
interface IComponentProps {
  projectId: string;
}
const VideoPreview = ({ projectId }: IComponentProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreviewOpen = () => {
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const queryClient = useQueryClient();
  const projectData = useProjectStore((state) => state.computed.data.project);

  const setProjectAllData = useProjectStore((state) => state.setProjectAllData);

  const selectedPointId = useProjectStore((state) => state.selectedPointId);
  const setSelectedPointId = useProjectStore(
    (state) => state.setSelectedPointId
  );
  const selectedPoint = useMemo(() => {
    return projectData.points.find((el) => el.id == selectedPointId);
  }, [projectData.points, selectedPointId]);
  const currentFrameIndex = useProjectStore((state) => state.currentFrameIndex);
  const setCurrentFrameIndex = useProjectStore(
    (state) => state.setCurrentFrameIndex
  );
  const [images, setImages] = useState<Array<HTMLImageElement>>([]);
  const [pointImages, setPointImages] = useState<{
    [key: string]: HTMLImageElement;
  }>({});

  const { data: projectFramesData } = useQuery(
    ["/project", projectId],
    () => fetchProjectFramesData(projectId),
    {
      refetchOnWindowFocus: false,
    }
  );
  const project = projectFramesData?.project;
  const {
    data: projectPointsData,
    isLoading: isLoadingPoints,
    isFetching: isFetchingPoints,
  } = useQuery(
    [`/project/points`, project?.id],
    () => {
      if (project) return fetchProjectPointsData(project?.id);
      return Promise.reject();
    },
    {
      enabled: project ? project?.id > 0 : false,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (!projectFramesData || !projectPointsData) {
      return;
    }
    //update the zustand store
    setProjectAllData({
      project: projectFramesData.project,
      projectFrames: projectFramesData.projectFrames,
      projectPoints: projectPointsData.projectPoints,
      pointKeyframes: projectPointsData.pointKeyframes,
    });
  }, [projectFramesData, projectPointsData, setProjectAllData]);
  const changeKeyframeData = useKeyframeDataMutation(() => {
    queryClient.invalidateQueries(["/project/points"]);
  });
  const changePointData = usePointDataMutation(() => {
    queryClient.invalidateQueries(["/project/points"]);
  });

  const frameRate = projectData.frame_rate;

  useEffect(() => {
    setImages(
      projectData.frames.map((frameData) => {
        const imageEle = new Image();
        imageEle.src = `data:image/jpeg;base64,${frameData.blob}`;
        return imageEle;
      })
    );
  }, [projectData.frames]);
  useEffect(() => {
    setPointImages(
      (projectPointsData?.projectPoints ?? []).reduce((prev, pointData) => {
        const imageEle = new Image();
        imageEle.src = pointData.thumbnail_blob ?? "";
        return { ...prev, [pointData.id]: imageEle };
      }, {})
    );
  }, [projectPointsData?.projectPoints]);
  const [boundingRef, canvasSizing] = useElementSize();
  const videoAspectRatio = useMemo(() => {
    return (projectData?.frame_width ?? 1) / (projectData?.frame_height ?? 1);
  }, [projectData.frame_height, projectData.frame_width]);
  const canvasRealSizing = useMemo(() => {
    return {
      width: canvasSizing.width - 48,
      height: (canvasSizing.width - 48) / videoAspectRatio,
    };
  }, [canvasSizing.width, videoAspectRatio]);
  const [canvasScale, setCanvasScale] = useState(1);
  useEffect(() => {
    if (images.length > 0 && images[0].width > 0 && images[0].height > 0) {
      setCanvasScale(canvasRealSizing.width / images[0].width);
    }
  }, [canvasRealSizing.width, images]);

  const numberOfFrames = useMemo(() => images.length, [images.length]);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalValue = useMemo(() => 1000 / (frameRate ?? 1000), [frameRate]);
  const rafRef = useRef<NodeJS.Timer>();
  const updateFrameIndexFn = useCallback(() => {
    setCurrentFrameIndex((v) => v + 1);
  }, [setCurrentFrameIndex]);
  useEffect(() => {
    if (isPlaying) {
      rafRef.current = setInterval(updateFrameIndexFn, intervalValue);
    } else {
      clearInterval(rafRef.current);
    }
    return () => {
      clearInterval(rafRef.current);
    };
  }, [intervalValue, isPlaying, updateFrameIndexFn]);
  useEffect(() => {
    if (isPlaying && currentFrameIndex + 1 >= numberOfFrames) {
      setIsPlaying(false);
      clearInterval(rafRef.current);
    }
  }, [currentFrameIndex, isPlaying, numberOfFrames]);
  useEffect(() => {
    setNewFrameIndex(currentFrameIndex);
  }, [currentFrameIndex]);

  const playToggleHandler = useCallback(() => {
    if (currentFrameIndex + 1 >= numberOfFrames) {
      setCurrentFrameIndex(0);
    }
    setIsPlaying((s) => !s);
  }, [currentFrameIndex, numberOfFrames, setCurrentFrameIndex]);

  const fastSeek = useCallback(
    (offset = -1) => {
      setIsPlaying(false);
      setCurrentFrameIndex((v) =>
        Math.min(Math.max(0, v + offset), numberOfFrames - 1)
      );
    },
    [numberOfFrames, setCurrentFrameIndex]
  );

  const [newFrameIndex, setNewFrameIndex] = useState(0);

  const currentPointMarks = useMemo(() => {
    return selectedPoint?.keyframes;
  }, [selectedPoint]);
  const isAtKeyframe = useCallback(
    (point_id: number, sequence_id: number) => {
      const thePoint = projectData.points.find((p) => p.id == point_id);
      return (
        thePoint?.keyframes.some((el) => el.sequence_id == sequence_id) ?? false
      );
    },
    [projectData.points]
  );
  const pointKeyframeById = useCallback(
    (point_id: number, sequence_id: number) => {
      const thePoint = projectData.points.find((p) => p.id == point_id);
      return thePoint?.keyframes.find((el) => el.sequence_id == sequence_id);
    },
    [projectData.points]
  );

  const currentPointsToRender = useMemo(() => {
    const visiblePoints = projectData.points.filter((el) =>
      isPointVisibleAtFrame(el, currentFrameIndex)
    );
    const sortedVisiblePoints = sortBy(
      (el) => getLayerOfPoint(el),
      visiblePoints
    );

    return sortedVisiblePoints;
  }, [currentFrameIndex, projectData.points]);
  const previousKeyframeOfPoint = useCallback(
    (pointId: number, isInclusive = true) => {
      const thePoint = projectData.points.find((p) => p.id == pointId);
      if (thePoint) {
        return maxBy(
          (el) => el.sequence_id,
          thePoint.keyframes.filter((keyframe) =>
            isInclusive
              ? keyframe.sequence_id <= currentFrameIndex
              : keyframe.sequence_id < currentFrameIndex
          ) ?? []
        );
      }
      return undefined;
    },
    [currentFrameIndex, projectData.points]
  );
  const nextKeyframeOfPoint = useCallback(
    (pointId: number, isInclusive = false) => {
      const thePoint = projectData.points.find((p) => p.id == pointId);
      if (thePoint) {
        return minBy(
          (el) => el.sequence_id,
          thePoint.keyframes.filter((keyframe) =>
            isInclusive
              ? keyframe.sequence_id >= currentFrameIndex
              : keyframe.sequence_id > currentFrameIndex
          ) ?? []
        );
      }
      return undefined;
    },
    [currentFrameIndex, projectData.points]
  );
  //now default to percentage
  const interpolatedPositionOfPoint = useCallback(
    (
      point_id: number,
      sequence_id: number,
      pointLocation: "start" | "end" = "start"
    ): [number, number] => {
      const thePoint = projectData.points.find((p) => p.id == point_id);

      if (!thePoint) {
        return [0, 0];
      }
      const previousKeyframe = previousKeyframeOfPoint(point_id);
      if (!previousKeyframe) {
        return [Number.MAX_VALUE, Number.MAX_VALUE];
      }
      if (previousKeyframe.sequence_id == sequence_id) {
        if (pointLocation == "start") {
          return [
            previousKeyframe.data.start_position[0],
            previousKeyframe.data.start_position[1],
          ];
        } else {
          return [
            previousKeyframe.data.end_position[0],
            previousKeyframe.data.end_position[1],
          ];
        }
      }

      const nextKeyframe = nextKeyframeOfPoint(point_id);
      if (!nextKeyframe) {
        return [Number.MAX_VALUE, Number.MAX_VALUE];
      }

      //interpolate the middle position based on current frame, last and next keyframes
      if (pointLocation == "start") {
        const interpolateX = createInterpolator({
          inputRange: [previousKeyframe.sequence_id, nextKeyframe.sequence_id],
          outputRange: [
            previousKeyframe.data.start_position[0],
            nextKeyframe.data.start_position[0],
          ],
        });
        const interpolateY = createInterpolator({
          inputRange: [previousKeyframe.sequence_id, nextKeyframe.sequence_id],
          outputRange: [
            previousKeyframe.data.start_position[1],
            nextKeyframe.data.start_position[1],
          ],
        });

        return [interpolateX(sequence_id), interpolateY(sequence_id)];
      } else {
        const interpolateX = createInterpolator({
          inputRange: [previousKeyframe.sequence_id, nextKeyframe.sequence_id],
          outputRange: [
            previousKeyframe.data.end_position[0],
            nextKeyframe.data.end_position[0],
          ],
        });
        const interpolateY = createInterpolator({
          inputRange: [previousKeyframe.sequence_id, nextKeyframe.sequence_id],
          outputRange: [
            previousKeyframe.data.end_position[1],
            nextKeyframe.data.end_position[1],
          ],
        });

        return [interpolateX(sequence_id), interpolateY(sequence_id)];
      }
    },
    [nextKeyframeOfPoint, previousKeyframeOfPoint, projectData.points]
  );
  const interpolatedScaleOfPoint = useCallback(
    (point_id: number, sequence_id: number) => {
      const thePoint = projectData.points.find((p) => p.id == point_id);

      if (!thePoint) {
        return 1;
      }
      const previousKeyframe = previousKeyframeOfPoint(point_id);
      if (!previousKeyframe) {
        return 1;
      }
      if (previousKeyframe.sequence_id == sequence_id) {
        return previousKeyframe.data.parameters.scale;
      }

      const nextKeyframe = nextKeyframeOfPoint(point_id);
      if (!nextKeyframe) {
        return 1;
      }

      //interpolate the middle position based on current frame, last and next keyframes

      const interpolatedScale = createInterpolator({
        inputRange: [previousKeyframe.sequence_id, nextKeyframe.sequence_id],
        outputRange: [
          previousKeyframe.data.parameters.scale,
          nextKeyframe.data.parameters.scale,
        ],
      });

      return interpolatedScale(sequence_id);
    },
    [nextKeyframeOfPoint, previousKeyframeOfPoint, projectData.points]
  );
  const interpolatedBrightnessOfPoint = useCallback(
    (point_id: number, sequence_id: number) => {
      const thePoint = projectData.points.find((p) => p.id == point_id);

      if (!thePoint) {
        return 255;
      }
      const previousKeyframe = previousKeyframeOfPoint(point_id);
      if (!previousKeyframe) {
        return 255;
      }
      if (previousKeyframe.sequence_id == sequence_id) {
        return previousKeyframe.data.parameters.brightness;
      }

      const nextKeyframe = nextKeyframeOfPoint(point_id);
      if (!nextKeyframe) {
        return 255;
      }

      //interpolate the middle position based on current frame, last and next keyframes

      const interpolatedBrightness = createInterpolator({
        inputRange: [previousKeyframe.sequence_id, nextKeyframe.sequence_id],
        outputRange: [
          previousKeyframe.data.parameters.brightness,
          nextKeyframe.data.parameters.brightness,
        ],
      });

      return interpolatedBrightness(sequence_id);
    },
    [nextKeyframeOfPoint, previousKeyframeOfPoint, projectData.points]
  );

  const interpolatedContrastOfPoint = useCallback(
    (point_id: number, sequence_id: number) => {
      const thePoint = projectData.points.find((p) => p.id == point_id);

      if (!thePoint) {
        return 255;
      }
      const previousKeyframe = previousKeyframeOfPoint(point_id);
      if (!previousKeyframe) {
        return 255;
      }
      if (previousKeyframe.sequence_id == sequence_id) {
        return previousKeyframe.data.parameters.contrast;
      }

      const nextKeyframe = nextKeyframeOfPoint(point_id);
      if (!nextKeyframe) {
        return 255;
      }

      //interpolate the middle position based on current frame, last and next keyframes

      const interpolatedContrast = createInterpolator({
        inputRange: [previousKeyframe.sequence_id, nextKeyframe.sequence_id],
        outputRange: [
          previousKeyframe.data.parameters.contrast,
          nextKeyframe.data.parameters.contrast,
        ],
      });

      return interpolatedContrast(sequence_id);
    },
    [nextKeyframeOfPoint, previousKeyframeOfPoint, projectData.points]
  );
  const progressOfPoint = useCallback(
    (point: ProjectPointWithKeyframes, sequence_id: number) => {
      // output to [0,1] number to show progress

      const firstKeyframe = smallestKeyframeOfPoint(point);
      const lastKeyframe = biggestKeyframeOfPoint(point);
      if (firstKeyframe >= lastKeyframe) {
        return 1;
      }
      return (sequence_id - firstKeyframe) / (lastKeyframe - firstKeyframe);
    },
    []
  );
  const dragEndUpdateHandler = useCallback(
    (data: any, point_id: number, pointLocation: "start" | "end" = "start") => {
      // update the point data
      const pointKeyframe = pointKeyframeById(point_id, currentFrameIndex);
      if (pointKeyframe) {
        const newData = produce(pointKeyframe, (draft) => {
          if (pointLocation == "start") {
            draft.data.start_position = [
              data.target.attrs.x / canvasRealSizing.width,
              data.target.attrs.y / canvasRealSizing.height,
            ];
          } else {
            draft.data.end_position = [
              data.target.attrs.x / canvasRealSizing.width,
              data.target.attrs.y / canvasRealSizing.height,
            ];
          }
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
      }
    },
    [
      canvasRealSizing.height,
      canvasRealSizing.width,
      changeKeyframeData,
      currentFrameIndex,
      pointKeyframeById,
      queryClient,
    ]
  );
  const isMutatingData = useMemo(() => {
    return (
      changeKeyframeData.isLoading ||
      changePointData.isLoading ||
      isFetchingPoints
    );
  }, [
    changeKeyframeData.isLoading,
    changePointData.isLoading,
    isFetchingPoints,
  ]);

  const handleContextMenu = (
    evt: KonvaEventObject<PointerEvent>,
    isAtKeyframeVal: boolean | undefined
  ) => {
    if (isAtKeyframeVal === true) {
      evt.evt.preventDefault();
      setContextMenu(
        contextMenu === null
          ? {
              mouseX: evt.evt.clientX + 2,
              mouseY: evt.evt.clientY - 6,
            }
          : null
      );
    } else {
      return "";
    }
  };
  const handleClose = () => {
    setContextMenu(null);
  };
  // const zoomBoxPosition = useZoomStore((state) => state.zoomPosition);
  const zoomLevel = useZoomStore((state) => state.zoomLevel);
  const fullZoomedPosition = useZoomStore(
    (state) => state.computed.fullZoomedPosition
  );
  const { value: pointerMouse, setValue: setPointerMouse } = useBoolean(false);
  const canvasRef = useRef<Konva.Stage>(null);
  const seekKeyframe = useCallback(
    (direction: "next" | "prev") => {
      if (direction == "next") {
        const nextKeyframe = nextKeyframeOfPoint(selectedPointId);
        if (nextKeyframe) {
          const delta = nextKeyframe.sequence_id - currentFrameIndex;
          fastSeek(delta);
        } else {
          fastSeek(9999);
        }
      }
      if (direction == "prev") {
        const previousKeyframe = previousKeyframeOfPoint(
          selectedPointId,
          false
        );
        if (previousKeyframe) {
          const delta = previousKeyframe.sequence_id - currentFrameIndex;
          fastSeek(delta);
        } else {
          fastSeek(-9999);
        }
      }
    },
    [
      currentFrameIndex,
      fastSeek,
      nextKeyframeOfPoint,
      previousKeyframeOfPoint,
      selectedPointId,
    ]
  );
  //
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
  useHotkeys(
    "ctrl+.",
    () => {
      fastSeek(1);
    },
    {
      enabled: projectData.id > 0,
    },
    [fastSeek]
  );
  useHotkeys(
    "ctrl+,",
    () => {
      fastSeek(-1);
    },
    {
      enabled: projectData.id > 0,
    },
    [fastSeek]
  );
  useHotkeys(
    "ctrl+'",
    () => {
      seekKeyframe("next");
    },
    {
      enabled: projectData.id > 0,
    },
    [seekKeyframe]
  );
  useHotkeys(
    "ctrl+;",
    () => {
      seekKeyframe("prev");
    },
    {
      enabled: projectData.id > 0,
    },
    [seekKeyframe]
  );
  const fastShortkey = (
    <div style={{ textAlign: "center" }}>
      <span style={{ fontWeight: "bold" }}>Fast forward</span> <br />
      <div></div>
      <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>CTRL + . </span>
    </div>
  );
  const rewindShortkey = (
    <div style={{ textAlign: "center" }}>
      <span style={{ fontWeight: "bold" }}>Rewind</span> <br />
      <div></div>
      <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>CTRL + , </span>
    </div>
  );
  const nextShortkey = (
    <div style={{ textAlign: "center" }}>
      <span style={{ fontWeight: "bold" }}>Next</span> <br />
      <div></div>
      <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>CTRL + {`'`}</span>
    </div>
  );
  const previousShortkey = (
    <div style={{ textAlign: "center" }}>
      <span style={{ fontWeight: "bold" }}>Previous</span> <br />
      <div></div>
      <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>CTRL + ;</span>
    </div>
  );
  const playShortkey = (
    <div style={{ textAlign: "center" }}>
      <span style={{ fontWeight: "bold" }}>Play/Pause</span> <br />
      <div></div>
      <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>Spacebar</span>
    </div>
  );
  //miss the keyframe remove fn
  if (!projectData.id || isLoadingPoints) {
    return (
      <Grid item xs>
        <Box
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 24,
          }}
        >
          <CircularProgress></CircularProgress>
          <br />
          <Typography>Loading...</Typography>
        </Box>
      </Grid>
    );
  }
  return (
    <Grid
      item
      xs={8}
      style={
        {
          // overflow: "hidden",
        }
      }
    >
      <Box
        style={{ padding: 24, paddingTop: 24 }}
        ref={boundingRef}
        className="box video"
      >
        <div>
          <Stage
            width={canvasRealSizing.width}
            height={canvasRealSizing.height}
            scale={{
              x: zoomLevel,
              y: zoomLevel,
            }}
            offsetX={fullZoomedPosition[0] * canvasRealSizing.width}
            offsetY={fullZoomedPosition[1] * canvasRealSizing.height}
            ref={canvasRef}
            style={{ cursor: pointerMouse ? "pointer" : "auto" }}
            onDblClick={() => {
              setSelectedPointId(0);
            }}
          >
            <Layer>
              <KonvaImage
                x={0}
                y={0}
                width={canvasRealSizing.width}
                height={canvasRealSizing.height}
                image={images[currentFrameIndex]}
              ></KonvaImage>
            </Layer>
            <Layer>
              {[...currentPointsToRender].map((point) => {
                if (!point) {
                  return null;
                }
                const pointPos = interpolatedPositionOfPoint(
                  point.id,
                  currentFrameIndex,
                  "start"
                );
                let endPointPos = [...pointPos];
                if (point.multi) {
                  endPointPos = interpolatedPositionOfPoint(
                    point.id,
                    currentFrameIndex,
                    "end"
                  );
                }
                if (!pointPos) {
                  return null;
                }
                const startPointLocation = [pointPos[0], pointPos[1]];
                const endPointLocation = [endPointPos[0], endPointPos[1]];
                // what left is the picture location...
                //we must know the "progress of the point lifetime"
                // that's the progress since the first till the last frame
                const progressOfPointAtCurrentFrame = progressOfPoint(
                  point,
                  currentFrameIndex
                );

                const imagePosRelative = [
                  (endPointLocation[0] - startPointLocation[0]) *
                    progressOfPointAtCurrentFrame +
                    startPointLocation[0],
                  (endPointLocation[1] - startPointLocation[1]) *
                    progressOfPointAtCurrentFrame +
                    startPointLocation[1],
                ];
                const imagePos = [
                  imagePosRelative[0] * canvasRealSizing.width,
                  imagePosRelative[1] * canvasRealSizing.height,
                ];
                const isAtKeyframeVal = isAtKeyframe(
                  point.id,
                  currentFrameIndex
                );
                const imageThumbnailBase64 = pointImages[point.id];
                if (!imageThumbnailBase64) {
                  return null;
                }
                //interpolated
                const currentFrameScale = interpolatedScaleOfPoint(
                  point.id,
                  currentFrameIndex
                );
                const currentFrameBrightness = interpolatedBrightnessOfPoint(
                  point.id,
                  currentFrameIndex
                );
                const currentFrameContrast = interpolatedContrastOfPoint(
                  point.id,
                  currentFrameIndex
                );

                const currentFrameResolution = getPixelSizeOfPoint(point);
                const currentFrameRotation = getRotationOfPoint(point);
                const currentFrameFlip = getFlipOfPoint(point);
                const colorTransfer = getColorTransferOfPoint(point);
                const imageSizeScaled = {
                  width:
                    currentFrameScale *
                    imageThumbnailBase64.width *
                    canvasScale,
                  height:
                    currentFrameScale *
                    imageThumbnailBase64.height *
                    canvasScale,
                };
                //if we deal with multi-point then we need to take the data from the start and end keyframes
                const firstKeyframe = minBy(
                  (el) => el.sequence_id,
                  point.keyframes
                );
                const startKeyframeImageSizeScaled = {
                  width: firstKeyframe?.data.parameters.scale
                    ? firstKeyframe?.data.parameters.scale *
                      imageThumbnailBase64.width *
                      canvasScale
                    : imageSizeScaled.width,
                  height: firstKeyframe?.data.parameters.scale
                    ? firstKeyframe?.data.parameters.scale *
                      imageThumbnailBase64.height *
                      canvasScale
                    : imageSizeScaled.height,
                };
                const lastKeyframe = maxBy(
                  (el) => el.sequence_id,
                  point.keyframes
                );
                const endKeyframeImageSizeScaled = {
                  width: lastKeyframe?.data.parameters.scale
                    ? lastKeyframe?.data.parameters.scale *
                      imageThumbnailBase64.width *
                      canvasScale
                    : imageSizeScaled.width,
                  height: lastKeyframe?.data.parameters.scale
                    ? lastKeyframe?.data.parameters.scale *
                      imageThumbnailBase64.height *
                      canvasScale
                    : imageSizeScaled.height,
                };
                return (
                  <Group
                    key={`p${point.id}`}
                    x={0}
                    y={0}
                    width={canvasRealSizing.width}
                    height={canvasRealSizing.height}
                    onContextMenu={(event) => {
                      handleContextMenu(event, isAtKeyframeVal);
                    }}
                    visible={point.visible}
                  >
                    <Text
                      text={`${point.label}`}
                      x={imagePos[0]}
                      y={imagePos[1]}
                      offset={{ x: 35, y: -20 }}
                      width={70}
                      height={20}
                      align="center"
                      fill={selectedPointId == point.id ? "#f00" : "#000"}
                      stroke={"#fff"}
                      strokeWidth={0.5}
                      fontSize={16}
                      visible={point.id == selectedPointId}
                    ></Text>
                    <Group
                      x={startPointLocation[0] * canvasRealSizing.width ?? 0}
                      y={startPointLocation[1] * canvasRealSizing.height ?? 0}
                      width={32}
                      height={32}
                      draggable={isAtKeyframeVal}
                      onDragEnd={(e) => {
                        dragEndUpdateHandler(e, point.id, "start");
                      }}
                      visible={point.id == selectedPointId}
                    >
                      <KonvaImageWithParams
                        image={imageThumbnailBase64}
                        width={
                          point.multi
                            ? startKeyframeImageSizeScaled.width
                            : imageSizeScaled.width
                        }
                        height={
                          point.multi
                            ? startKeyframeImageSizeScaled.height
                            : imageSizeScaled.height
                        }
                        position={{
                          x: 0,
                          y:
                            -(point.multi
                              ? startKeyframeImageSizeScaled.height
                              : imageSizeScaled.height) / 2,
                        }}
                        offset={{
                          x:
                            (point.multi
                              ? startKeyframeImageSizeScaled.width
                              : imageSizeScaled.width) / 2,
                          y:
                            (point.multi
                              ? startKeyframeImageSizeScaled.height
                              : imageSizeScaled.height) / 2,
                        }}
                        filters={
                          getGrayscaleOfPoint(point)
                            ? [
                                Konva.Filters.Brighten,
                                Konva.Filters.Contrast,
                                Konva.Filters.Grayscale,
                                Konva.Filters.RGBA,
                              ]
                            : [
                                Konva.Filters.Brighten,
                                Konva.Filters.Contrast,
                                Konva.Filters.RGBA,
                              ]
                        }
                        brightness={
                          firstKeyframe?.data.parameters.brightness ??
                          currentFrameBrightness
                        }
                        contrast={
                          firstKeyframe?.data.parameters.contrast ??
                          currentFrameContrast
                        }
                        visible={isAtKeyframeVal}
                        pixelSize={currentFrameResolution}
                        rotation={currentFrameRotation}
                        updateRotationHandler={updateRotationHandler}
                        isSelected={selectedPointId == point.id}
                        isAtKeyframe={isAtKeyframeVal}
                        isEditable={isAtKeyframeVal}
                        onClick={() => {
                          setSelectedPointId((val: number) => {
                            if (val == 0) {
                              return point.id;
                            } else {
                              if (val != point.id) {
                                //click another one
                                return point.id;
                              }
                            }
                            //no change
                            return val;
                          });
                        }}
                        flip={currentFrameFlip}
                        red={colorTransfer.r}
                        green={colorTransfer.g}
                        blue={colorTransfer.b}
                        alpha={colorTransfer.a}
                      ></KonvaImageWithParams>

                      <Rect
                        width={2}
                        height={2}
                        offset={{
                          x: 1,
                          y: 1,
                        }}
                        stroke="#0081a7"
                        strokeWidth={2}
                        scale={{
                          x: 2 / zoomLevel,
                          y: 2 / zoomLevel,
                        }}
                      />
                    </Group>
                    {point.multi && (
                      <Group
                        x={endPointLocation[0] * canvasRealSizing.width ?? 0}
                        y={endPointLocation[1] * canvasRealSizing.height ?? 0}
                        draggable={isAtKeyframeVal}
                        onDragEnd={(e) => {
                          dragEndUpdateHandler(e, point.id, "end");
                        }}
                        // onClick={() => {
                        //   setSelectedPointId(point.id);
                        // }}
                        visible={point.id == selectedPointId}
                      >
                        <KonvaImageWithParams
                          image={imageThumbnailBase64}
                          width={endKeyframeImageSizeScaled.width}
                          height={endKeyframeImageSizeScaled.height}
                          position={{
                            x: 0,
                            y: -endKeyframeImageSizeScaled.height / 2,
                          }}
                          offset={{
                            x: endKeyframeImageSizeScaled.width / 2,
                            y: endKeyframeImageSizeScaled.height / 2,
                          }}
                          filters={
                            getGrayscaleOfPoint(point)
                              ? [
                                  Konva.Filters.Brighten,
                                  Konva.Filters.Contrast,
                                  Konva.Filters.Grayscale,
                                  Konva.Filters.RGBA,
                                ]
                              : [
                                  Konva.Filters.Brighten,
                                  Konva.Filters.Contrast,
                                  Konva.Filters.RGBA,
                                ]
                          }
                          brightness={
                            lastKeyframe?.data.parameters.brightness ??
                            currentFrameBrightness
                          }
                          contrast={
                            lastKeyframe?.data.parameters.contrast ??
                            currentFrameContrast
                          }
                          visible={isAtKeyframeVal}
                          pixelSize={currentFrameResolution}
                          rotation={currentFrameRotation}
                          updateRotationHandler={updateRotationHandler}
                          isSelected={selectedPointId == point.id}
                          isAtKeyframe={isAtKeyframeVal}
                          isEditable={isAtKeyframeVal}
                          onClick={() => {
                            setSelectedPointId((val: number) => {
                              if (val == 0) {
                                return point.id;
                              } else {
                                if (val != point.id) {
                                  //click another one
                                  return point.id;
                                }
                              }
                              //no change
                              return val;
                            });
                          }}
                          flip={currentFrameFlip}
                          red={colorTransfer.r}
                          green={colorTransfer.g}
                          blue={colorTransfer.b}
                          alpha={colorTransfer.a}
                        ></KonvaImageWithParams>

                        <Rect
                          width={2}
                          height={2}
                          offset={{
                            x: 1,
                            y: 1,
                          }}
                          stroke="#f07167"
                          strokeWidth={2}
                          scale={{
                            x: 2 / zoomLevel,
                            y: 2 / zoomLevel,
                          }}
                        />
                      </Group>
                    )}
                    {point.multi && (
                      <Line
                        points={[
                          startPointLocation[0] * canvasRealSizing.width,
                          startPointLocation[1] * canvasRealSizing.height,
                          endPointLocation[0] * canvasRealSizing.width,
                          endPointLocation[1] * canvasRealSizing.height,
                        ]}
                        stroke="#ccc"
                        strokeWidth={1}
                        visible={point.id == selectedPointId}
                      ></Line>
                    )}
                    {/* must insert image */}

                    <KonvaImageWithParams
                      image={imageThumbnailBase64}
                      width={imageSizeScaled.width}
                      height={imageSizeScaled.height}
                      offset={{
                        x: imageSizeScaled.width / 2,
                        y: imageSizeScaled.height / 2,
                      }}
                      position={{
                        x: imagePos[0],
                        y: imagePos[1] - imageSizeScaled.height / 2,
                      }}
                      filters={
                        getGrayscaleOfPoint(point)
                          ? [
                              Konva.Filters.Brighten,
                              Konva.Filters.Contrast,
                              Konva.Filters.Grayscale,
                              Konva.Filters.RGBA,
                            ]
                          : [
                              Konva.Filters.Brighten,
                              Konva.Filters.Contrast,
                              Konva.Filters.RGBA,
                            ]
                      }
                      red={colorTransfer.r}
                      green={colorTransfer.g}
                      blue={colorTransfer.b}
                      alpha={colorTransfer.a}
                      brightness={currentFrameBrightness}
                      visible={
                        (point.multi &&
                          progressOfPointAtCurrentFrame != 0 &&
                          progressOfPointAtCurrentFrame != 1) || //multipoint always show except end or start
                        selectedPointId !== point.id || //if not selected always show
                        (!point.multi &&
                          !isAtKeyframeVal &&
                          point.id === selectedPointId) // if selected only show if not multi and not at keyframe
                      }
                      pixelSize={currentFrameResolution}
                      contrast={currentFrameContrast}
                      rotation={currentFrameRotation}
                      updateRotationHandler={updateRotationHandler}
                      isSelected={selectedPointId == point.id}
                      isAtKeyframe={isAtKeyframeVal}
                      onMouseOver={() => {
                        setPointerMouse(true);
                      }}
                      onMouseOut={() => {
                        setPointerMouse(false);
                      }}
                      onClick={() => {
                        setSelectedPointId((val: number) => {
                          if (val == 0) {
                            return point.id;
                          } else {
                            if (val != point.id) {
                              //click another one
                              return point.id;
                            }
                          }
                          //no change
                          return val;
                        });
                      }}
                      isEditable={false}
                      flip={currentFrameFlip}
                    ></KonvaImageWithParams>
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </div>
        <div>
          <CustomisedSlider
            aria-label="Always visible"
            value={currentFrameIndex}
            step={1}
            marks={currentPointMarks}
            valueLabelDisplay="on"
            min={0}
            max={numberOfFrames - 1}
            onChange={(_, value: any) => {
              setCurrentFrameIndex(value as number);
            }}
          ></CustomisedSlider>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "fit-content",
            }}
          >
            <ButtonGroup>
              <Tooltip title={previousShortkey} placement="top">
                <Button
                  onClick={() => {
                    seekKeyframe("prev");
                  }}
                >
                  <FirstPage></FirstPage>
                </Button>
              </Tooltip>

              <Tooltip title={rewindShortkey} placement="top">
                <Button
                  onClick={() => {
                    fastSeek(-1);
                  }}
                >
                  <FastRewind></FastRewind>
                </Button>
              </Tooltip>

              <Tooltip title={playShortkey} placement="top">
                <Button onClick={playToggleHandler}>
                  {!isPlaying ? <PlayArrow></PlayArrow> : <Pause></Pause>}
                </Button>
              </Tooltip>
              <Tooltip title={fastShortkey} placement="top">
                <Button
                  onClick={() => {
                    fastSeek(1);
                  }}
                >
                  <FastForward></FastForward>
                </Button>
              </Tooltip>
              <Tooltip title={nextShortkey} placement="top">
                <Button
                  onClick={() => {
                    seekKeyframe("next");
                  }}
                >
                  <LastPage></LastPage>
                </Button>
              </Tooltip>
            </ButtonGroup>
            <Divider variant="middle" flexItem />
            <ButtonGroup>
              <FormControl style={{ width: 110 }}>
                <InputLabel htmlFor="frame-jump-input">Jump to</InputLabel>
                <OutlinedInput
                  id="frame-jump-input"
                  size="small"
                  value={newFrameIndex}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value, 10);
                    if (isNaN(newValue) || newValue < 0) {
                      setNewFrameIndex(0);
                    } else {
                      setNewFrameIndex(newValue);
                    }
                  }}
                  onKeyUp={(e) => {
                    if (e.key == "Enter") {
                      setCurrentFrameIndex(
                        Math.max(Math.min(newFrameIndex, numberOfFrames - 1), 0)
                      );
                    }
                  }}
                  endAdornment={
                    <Typography
                      variant="subtitle1"
                      style={{
                        fontStyle: "italic",
                        color: "#666",
                      }}
                    >
                      /{numberOfFrames - 1}
                    </Typography>
                  }
                  label="Jump to"
                />
              </FormControl>
            </ButtonGroup>
            <Button
              variant="outlined"
              style={{ marginLeft: "1.5rem" }}
              onClick={handlePreviewOpen}
              startIcon={<Wallpaper />}
            >
              Preview frame
            </Button>
            <Divider variant="middle" flexItem />
            {isMutatingData && (
              <div style={{ display: "flex", gap: 8 }}>
                <CircularProgress size={20} />{" "}
                <Typography variant="caption">Processing...</Typography>
              </div>
            )}
          </Box>
          <Divider orientation="vertical" variant="middle" flexItem />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "fit-content",
            }}
          >
            <Typography>State: {isPlaying ? "Playing" : "Paused"}</Typography>
          </Box>
        </div>
        <FisheyePlayer konvaStageRef={canvasRef}></FisheyePlayer>
        <PreviewFrame
          open={previewOpen}
          handleClose={handlePreviewClose}
          frameId={currentFrameIndex + 1}
          datasetId={projectData.dataset_id ?? ""}
          sampleId={projectData.sample_id ?? ""}
          data={{
            points: currentPointsToRender.map((point) => {
              return {
                object_id: point.object_id ?? "",
                object_class: point.object_class ?? "",
                gallery_id: point.gallery_id ?? "",
                data: {
                  position: interpolatedFinalPositionOfPoint(
                    point,
                    currentFrameIndex
                  ),
                  parameters: {
                    scale: interpolatedScaleOfPoint(
                      point.id,
                      currentFrameIndex
                    ),
                    brightness: interpolatedBrightnessOfPoint(
                      point.id,
                      currentFrameIndex
                    ),
                    wheel_speed: getReverseWheelOfPoint(point)
                      ? -getWheelSpeedOfPoint(point)
                      : getWheelSpeedOfPoint(point),
                    contrast: interpolatedContrastOfPoint(
                      point.id,
                      currentFrameIndex
                    ),
                    pixel_size: getPixelSizeOfPoint(point),
                    grayscale: getGrayscaleOfPoint(point),
                    rotation: getRotationOfPoint(point),
                    layer: getLayerOfPoint(point),
                    motion_blur_intensity: getMotionBlurIntensityOfPoint(point),
                    flip: getFlipOfPoint(point),
                    color_transfer: getColorTransferOfPoint(point, false),
                  },
                },
              };
            }),
          }}
        />
        <Menu
          open={contextMenu !== null}
          onClose={handleClose}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX + 50 }
              : undefined
          }
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 0,
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
          <AdjustContextMenu handleClose={handleClose} />
        </Menu>
      </Box>
    </Grid>
  );
};

export default VideoPreview;
