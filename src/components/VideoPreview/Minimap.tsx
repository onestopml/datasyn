import { ZoomIn, ZoomOut } from "@mui/icons-material";
import {
  Box,
  Container,
  IconButton,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Konva from "konva";
import { useEffect, useMemo } from "react";
import {
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
} from "react-konva";
import { useElementSize } from "usehooks-ts";
import { fetchProjectPointsData } from ".";
import { useProjectStore } from "../../stores/project";
import { useZoomStore } from "../../stores/zoom";
import {
  getColorTransferOfPoint,
  getFlipOfPoint,
  getGrayscaleOfPoint,
  getPixelSizeOfPoint,
  getRotationOfPoint,
  interpolatedBrightnessOfPoint,
  interpolatedContrastOfPoint,
  interpolatedPositionOfPoint,
  interpolatedScaleOfPoint,
  isPointVisibleAtFrame,
  progressOfPoint,
} from "../../utils/generatePointFrames";
import { KonvaImageWithParams } from "./KonvaImageWithParams";
export const Minimap = () => {
  const [boxRef, boxSize] = useElementSize();
  const projectData = useProjectStore((state) => state.computed.data.project);
  const currentFrameIndex = useProjectStore((state) => state.currentFrameIndex);

  const images = useMemo(() => {
    return projectData.frames.map((frameData) => {
      const imageEle = new Image();
      imageEle.src = `data:image/jpeg;base64,${frameData.blob}`;
      return imageEle;
    });
  }, [projectData.frames]);
  const { data: projectPointsData } = useQuery(
    [`/project/points`, projectData?.id],
    () => {
      if (projectData) return fetchProjectPointsData(projectData?.id);
      return Promise.reject();
    },
    {
      enabled: projectData ? projectData?.id > 0 : false,
      refetchOnWindowFocus: false,
    }
  );
  const videoAspectRatio = useMemo(() => {
    return (projectData?.frame_width ?? 1) / (projectData?.frame_height ?? 1);
  }, [projectData.frame_height, projectData.frame_width]);
  const stageSizing = useMemo(() => {
    return { width: boxSize.width, height: boxSize.width / videoAspectRatio };
  }, [boxSize.width, videoAspectRatio]);
  const zoomLevel = useZoomStore((state) => state.zoomLevel);
  const setZoomLevel = useZoomStore((state) => state.setZoomLevel);
  const zoomBoxSizing = useMemo(() => {
    return {
      width: stageSizing.width / zoomLevel,
      height: stageSizing.height / zoomLevel,
    };
  }, [stageSizing.height, stageSizing.width, zoomLevel]);
  const zoomBoxPosition = useZoomStore((state) => state.zoomPosition);
  const setZoomBoxPosition = useZoomStore((state) => state.setZoomPosition);
  const setPanelDimensions = useZoomStore((state) => state.setPanelDimensions);
  useEffect(() => {
    setPanelDimensions([stageSizing.width, stageSizing.height]);
  }, [setPanelDimensions, stageSizing.height, stageSizing.width]);
  useEffect(() => {
    if (zoomLevel == 1) {
      setZoomBoxPosition([0, 0]);
    }
  }, [setZoomBoxPosition, zoomLevel]);

  const pointImages = useMemo(
    () =>
      (projectPointsData?.projectPoints ?? []).reduce((prev, pointData) => {
        const imageEle = new Image();
        imageEle.src = pointData.thumbnail_blob ?? "";
        return { ...prev, [pointData.id]: imageEle };
      }, {} as { [key: number]: HTMLImageElement }),

    [projectPointsData?.projectPoints]
  );
  const currentPointsToRender = useMemo(() => {
    return projectData.points.filter((el) =>
      isPointVisibleAtFrame(el, currentFrameIndex)
    );
  }, [currentFrameIndex, projectData.points]);

  return (
    <Box style={{ padding: 24, paddingTop: 0 }}>
      <Container
        ref={boxRef}
        disableGutters
        sx={{
          background: "#fff",
          paddingBottom: 2,
          border: "1px solid #ccc",
          borderRadius: 1,
        }}
      >
        <Typography variant="h6" sx={{ padding: 2 }}>
          Minimap
        </Typography>
        <Stage
          width={stageSizing.width}
          height={stageSizing.height}
          style={{ background: "blue" }}
        >
          <Layer>
            <KonvaImage
              x={0}
              y={0}
              width={stageSizing.width}
              height={stageSizing.height}
              image={images[currentFrameIndex]}
            ></KonvaImage>
          </Layer>
          <Layer>
            {[...currentPointsToRender].map((point) => {
              if (!point) {
                return null;
              }
              const pointPos = interpolatedPositionOfPoint(
                point,
                currentFrameIndex,
                "start"
              );
              let endPointPos = [...pointPos];
              if (point.multi) {
                endPointPos = interpolatedPositionOfPoint(
                  point,
                  currentFrameIndex,
                  "end"
                );
              }
              if (!pointPos) {
                return null;
              }
              const startPointLocation = [
                pointPos[0] * stageSizing.width,
                pointPos[1] * stageSizing.height,
              ];
              const endPointLocation = [
                endPointPos[0] * stageSizing.width,
                endPointPos[1] * stageSizing.height,
              ];
              // what left is the picture location...
              //we must know the "progress of the point lifetime"
              // that's the progress since the first till the last frame
              const progressOfPointAtCurrentFrame = progressOfPoint(
                point,
                currentFrameIndex
              );
              const imagePos = [
                (endPointLocation[0] - startPointLocation[0]) *
                  progressOfPointAtCurrentFrame +
                  startPointLocation[0],
                (endPointLocation[1] - startPointLocation[1]) *
                  progressOfPointAtCurrentFrame +
                  startPointLocation[1],
              ];

              const currentFrameScale = interpolatedScaleOfPoint(
                point,
                currentFrameIndex
              );

              const imageThumbnailBase64 = pointImages[point.id];
              if (!imageThumbnailBase64) {
                return null;
              }

              const currentFrameBrightness = interpolatedBrightnessOfPoint(
                point,
                currentFrameIndex
              );
              const currentFrameResolution = getPixelSizeOfPoint(point);
              const currentFrameContrast = interpolatedContrastOfPoint(
                point,
                currentFrameIndex
              );
              const currentFrameRotation = getRotationOfPoint(point);
              const minimapScale =
                images.length > 0 ? stageSizing.width / images[0].width : 1;

              const imageSizeScaled = {
                width:
                  currentFrameScale * imageThumbnailBase64.width * minimapScale,
                height:
                  currentFrameScale *
                  imageThumbnailBase64.height *
                  minimapScale,
              };
              const colorTransfer = getColorTransferOfPoint(point);
              return (
                <Group key={`p${point.id}`}>
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
                    brightness={currentFrameBrightness}
                    visible={point.visible}
                    pixelSize={currentFrameResolution}
                    contrast={currentFrameContrast}
                    rotation={currentFrameRotation}
                    isSelected={false}
                    updateRotationHandler={(val: number) => {
                      //
                    }}
                    isAtKeyframe={false}
                    onClick={() => {
                      //
                    }}
                    isEditable={false}
                    flip={getFlipOfPoint(point)}
                    red={colorTransfer.r}
                    green={colorTransfer.g}
                    blue={colorTransfer.b}
                    alpha={colorTransfer.a}
                  ></KonvaImageWithParams>
                  <Rect
                    x={startPointLocation[0] ?? 0}
                    y={startPointLocation[1] ?? 0}
                    width={8}
                    height={8}
                    offset={{
                      x: 4,
                      y: 4,
                    }}
                    stroke="#0081a7"
                    strokeWidth={2}
                    shadowBlur={10}
                    visible={false}
                  />
                  {point.multi && (
                    <Rect
                      x={endPointLocation[0] ?? 0}
                      y={endPointLocation[1] ?? 0}
                      width={8}
                      height={8}
                      offset={{
                        x: 4,
                        y: 4,
                      }}
                      stroke="#f07167"
                      strokeWidth={2}
                      shadowBlur={10}
                      visible={false}
                    />
                  )}
                  {point.multi && (
                    <Line
                      points={[
                        startPointLocation[0],
                        startPointLocation[1],
                        endPointLocation[0],
                        endPointLocation[1],
                      ]}
                      // offset={{ x: -8, y: -8 }}
                      stroke="#ccc"
                      strokeWidth={1}
                      visible={false}
                    ></Line>
                  )}
                </Group>
              );
            })}
          </Layer>
          <Layer>
            {zoomLevel > 1 && (
              <Rect
                draggable
                dragBoundFunc={(pos) => {
                  let newX = pos.x;
                  let newY = pos.y;
                  if (newX > stageSizing.width - zoomBoxSizing.width) {
                    newX = stageSizing.width - zoomBoxSizing.width;
                  }
                  if (newY > stageSizing.height - zoomBoxSizing.height) {
                    newY = stageSizing.height - zoomBoxSizing.height;
                  }
                  if (newX < 0) {
                    newX = 0;
                  }
                  if (newY < 0) {
                    newY = 0;
                  }
                  return { x: newX, y: newY };
                }}
                width={zoomBoxSizing.width}
                height={zoomBoxSizing.height}
                x={zoomBoxPosition[0]}
                y={zoomBoxPosition[1]}
                stroke="#eeeeee6f"
                strokeWidth={5}
                fill="#cccccc6f"
                onDragMove={(event) => {
                  requestAnimationFrame(() => {
                    setZoomBoxPosition([
                      event.target.attrs.x,
                      event.target.attrs.y,
                    ]);
                  });
                }}
              ></Rect>
            )}
          </Layer>
        </Stage>
        <br />
        <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
          <IconButton
            onClick={() => {
              setZoomLevel(Math.max(zoomLevel - 1, 1));
            }}
          >
            <ZoomOut></ZoomOut>
          </IconButton>
          <Slider
            step={0.1}
            min={1}
            max={5}
            marks
            value={zoomLevel}
            onChange={(e, nvalue) => {
              setZoomLevel(nvalue as number);
            }}
            valueLabelDisplay="auto"
          ></Slider>
          <IconButton
            onClick={() => {
              setZoomLevel(Math.min(zoomLevel + 1, 5));
            }}
          >
            <ZoomIn></ZoomIn>
          </IconButton>
        </Stack>
      </Container>
    </Box>
  );
};
