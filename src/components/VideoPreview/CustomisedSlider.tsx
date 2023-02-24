import styled from "@emotion/styled";
import { Tooltip } from "@mui/material";
import useMouse from "@react-hook/mouse-position";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ProjectPointKeyframe } from "../../api/backendClient";
import { useKeyframeDataMutation } from "../../utils/useKeyframeDataMutation";
interface IComponentProps {
  "aria-label": string;
  value: number;
  step: number;
  marks?: ProjectPointKeyframe[];
  valueLabelDisplay: string;
  min: number;
  max: number;
  onChange(val1: any, val: number): void;
}
const RootSlider = styled.div`
  background-color: #b9faf8;
  height: 16px;
  margin-top: 12px;
  margin-bottom: 24px;
  overflow: visible;
  position: relative;
  cursor: pointer;
`;
const InnerSlider = styled(motion.div)`
  background-color: #b8d0eb;
  height: 16px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 5;
`;

const HoveringInnerSlider = styled(motion.div)`
  background-color: #b298dc;
  height: 16px;
  position: absolute;
  top: 0;
  left: 0;
  // filter: invert(1);
  z-index: 10;
`;
const MarkTrack = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 20;
`;
const MarkKeyframe = styled(motion.span)`
  position: absolute;
  top: 0;
  left: 0;
  border: none;
  background: #a663cc;
  height: 100%;
  width: 8px;
  z-index: 11;
  cursor: pointer;
  padding: 0;
  opacity: 0.5;
  transform: translateX(-50%);
`;
const CurrentIndexPointer = styled(motion.span)`
  position: absolute;
  right: 0;
  top: 0;
  width: 1px;
  height: 150%;
  transform: translateY(-15%);
  background: #6f2dbd;
`;
const InnerRightIndicator = styled.span`
  position: absolute;
  right: 0;
  top: 0;
`;
const MarkKeyframeComponent = (props: {
  mark: ProjectPointKeyframe;
  otherSeq: number[];
  max: number;
  min: number;
}) => {
  const anchorEl = useRef<HTMLSpanElement | null>(null);
  const [openPopover, setOpenPopover] = useState(false);
  const theMarkPosition = useMemo(() => {
    return props.mark.sequence_id / (props.max - props.min);
  }, [props.mark.sequence_id, props.max, props.min]);
  const changeKeyframeDataMutator = useKeyframeDataMutation();
  const queryClient = useQueryClient();
  const updateKeyframeNewPoisition = useCallback(
    (mark: ProjectPointKeyframe, new_sequence_id: number) => {
      //check if a frame with that sequence id exists first
      const existKeyframeWithThatNewSeqId =
        props.otherSeq.includes(new_sequence_id);
      if (existKeyframeWithThatNewSeqId) {
        toast.error("Unable to move to that location!");
        return;
      }
      changeKeyframeDataMutator.mutate(
        {
          type: "update",
          data: {
            ...mark,
            sequence_id: new_sequence_id,
          },
        },
        {
          onSuccess() {
            queryClient.invalidateQueries(["/project/points"]);
          },
        }
      );
    },
    [changeKeyframeDataMutator, props.otherSeq, queryClient]
  );
  return (
    <MarkKeyframe
      style={{
        left: `${theMarkPosition * 100}%`,
      }}
      ref={anchorEl}
    >
      <Tooltip title={props.mark.sequence_id}>
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
          onClick={() => {
            setOpenPopover(true);
          }}
        ></span>
      </Tooltip>
    </MarkKeyframe>
  );
};
export const CustomisedSlider = (props: IComponentProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const mouse = useMouse(sliderRef);
  const [isHovering, setIsHovering] = useState(false);
  const onClickPctHandler = useCallback(() => {
    if (!mouse.x || !mouse.elementWidth) {
      return 0;
    }
    return Math.round((mouse.x / mouse.elementWidth) * (props.max - props.min));
  }, [mouse, props.max, props.min]);
  const hoveringMousePosition = useMemo(() => {
    if (!mouse.x || !mouse.elementWidth) {
      return 0;
    }
    return Math.round((mouse.x / mouse.elementWidth) * (props.max - props.min));
  }, [mouse.elementWidth, mouse.x, props.max, props.min]);
  const hoveringMousePositionProgress = useMemo(() => {
    if (!mouse.x || !mouse.elementWidth) {
      return 0;
    }
    return Math.round(
      ((mouse.x / mouse.elementWidth) * (props.max - props.min) * 100) /
        props.max
    );
  }, [mouse.elementWidth, mouse.x, props.max, props.min]);
  return (
    <RootSlider
      onMouseUp={(e) => {
        // onClickPctHandler();
        props.onChange(null, onClickPctHandler());
      }}
      ref={sliderRef}
      onMouseOver={() => {
        setIsHovering(true);
      }}
      onMouseOut={() => {
        setIsHovering(false);
      }}
    >
      <HoveringInnerSlider
        animate={{
          width: `${hoveringMousePositionProgress}%`,
        }}
        transition={{
          duration: 0,
        }}
      >
        <Tooltip
          open={isHovering}
          title={hoveringMousePosition}
          placement="top"
        >
          <InnerRightIndicator></InnerRightIndicator>
        </Tooltip>
      </HoveringInnerSlider>
      <InnerSlider
        animate={{
          width: `${(props.value * 100) / (props.max ?? 1)}%`,
        }}
        transition={{
          duration: 0,
        }}
      >
        <CurrentIndexPointer></CurrentIndexPointer>
      </InnerSlider>
      <MarkTrack
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {props.marks?.map((mark) => {
          return (
            <MarkKeyframeComponent
              key={mark.id}
              mark={mark}
              otherSeq={props.marks?.map((el) => el.sequence_id) ?? []}
              max={props.max}
              min={props.min}
            ></MarkKeyframeComponent>
          );
        })}
      </MarkTrack>
    </RootSlider>
  );
};
