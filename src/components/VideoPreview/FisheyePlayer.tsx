import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  FormGroup,
  FormLabel,
  Slider,
  Typography,
} from "@mui/material";
import Konva from "konva";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { useCreateRealtimePreview } from "../../api/convertFisheye";
import { useProjectStore } from "../../stores/project";

interface IComponentProps {
  konvaStageRef: RefObject<Konva.Stage>;
}
const FisheyeCanvas = (
  props: IComponentProps & {
    showPreview: boolean;
  }
) => {
  const thenTime = useRef(window.performance.now());
  const frame_rate = useProjectStore(
    (state) => state.computed.data.project.frame_rate
  );
  const interval = 1000 / (frame_rate ?? 24);
  const currentRaf = useRef<number>(0);
  const fisheyeCanvasRef = useRef<HTMLCanvasElement>(null);
  const {
    drawFunctionFisheye,
    effectPower,
    setEffectPower,
    zoom,
    setZoom,
    setCanvasEle,
  } = useCreateRealtimePreview();

  const drawFunction = useCallback(async () => {
    return drawFunctionFisheye(props.konvaStageRef.current!);
  }, [drawFunctionFisheye, props.konvaStageRef]);
  useEffect(() => {
    if (props.showPreview) {
      setCanvasEle(fisheyeCanvasRef.current);
    }
  }, [props.showPreview, setCanvasEle]);
  useEffect(() => {
    const drawLoop = (performanceNow: number) => {
      if (props.showPreview) {
        currentRaf.current = requestAnimationFrame(drawLoop);
      }
      const delta = performanceNow - thenTime.current;
      if (delta > interval) {
        thenTime.current = performanceNow;
        drawFunction();
      }
    };
    if (props.showPreview) {
      drawLoop(performance.now());
    }
    return () => {
      cancelAnimationFrame(currentRaf.current);
    };
  }, [drawFunction, interval, props.showPreview]);
  if (!props.showPreview) {
    return null;
  }
  return (
    <Box>
      <canvas ref={fisheyeCanvasRef}></canvas>
      <FormGroup>
        <FormLabel>Effect Power</FormLabel>
        <Slider
          min={100}
          max={1000}
          value={effectPower}
          step={1}
          onChange={(e, val) => {
            setEffectPower(val as number);
          }}
          valueLabelDisplay="auto"
        ></Slider>
      </FormGroup>
      <FormGroup>
        <FormLabel>Zoom</FormLabel>
        <Slider
          min={100}
          max={1000}
          value={zoom}
          step={1}
          onChange={(e, val) => {
            setZoom(val as number);
          }}
          valueLabelDisplay="auto"
        ></Slider>
      </FormGroup>
    </Box>
  );
};
export const FisheyePlayer = (props: IComponentProps) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <Container disableGutters>
      <hr />
      <Box
        style={{
          display: "flex",
          flexDirection: "row",
          marginBottom: 10,
          gap: 10,
        }}
      >
        <Typography variant="h5">Fisheye/Anti-fisheye</Typography>

        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setShowPreview((v) => !v);
          }}
          startIcon={
            showPreview ? (
              <Visibility></Visibility>
            ) : (
              <VisibilityOff></VisibilityOff>
            )
          }
        >
          {showPreview ? "Click to hide" : "Click to show"}
        </Button>
      </Box>

      <FisheyeCanvas
        konvaStageRef={props.konvaStageRef}
        showPreview={showPreview}
      ></FisheyeCanvas>
    </Container>
  );
};
