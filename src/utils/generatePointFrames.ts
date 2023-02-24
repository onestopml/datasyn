import max from "lodash/fp/max";
import maxBy from "lodash/fp/maxBy";
import min from "lodash/fp/min";
import minBy from "lodash/fp/minBy";
import { createInterpolator } from "range-interpolator";
import { ObjectKeyframeProps } from "../api/renex";
import { ProjectPointWithKeyframes } from "../stores/project";
import { ColorTransferEnum } from "./constants";

const isPointAtKeyframe = (
  point: ProjectPointWithKeyframes,
  sequence_id: number
) => {
  return point.keyframes.find((el) => el.sequence_id == sequence_id);
};
const previousKeyframeOfPoint = (
  point: ProjectPointWithKeyframes,
  sequence_id: number
) => {
  return maxBy(
    (el) => el.sequence_id,
    point.keyframes.filter((keyframe) => keyframe.sequence_id <= sequence_id) ??
      []
  );
};
const nextKeyframeOfPoint = (
  point: ProjectPointWithKeyframes,
  sequence_id: number
) => {
  return minBy(
    (el) => el.sequence_id,
    point.keyframes.filter((keyframe) => keyframe.sequence_id > sequence_id) ??
      []
  );
};
export const interpolatedPositionOfPoint = (
  point: ProjectPointWithKeyframes,
  sequence_id: number,
  pointLocation: "start" | "end" = "start"
): [number, number] => {
  const previousKeyframe = previousKeyframeOfPoint(point, sequence_id);
  const nextKeyframe = nextKeyframeOfPoint(point, sequence_id);

  if (!previousKeyframe) {
    if (pointLocation == "start") {
      return [
        nextKeyframe?.data.start_position[0] || 0.25,
        nextKeyframe?.data.start_position[1] || 0.5,
      ];
    } else {
      return [
        nextKeyframe?.data.start_position[0] || 0.75,
        nextKeyframe?.data.start_position[1] || 0.5,
      ];
    }
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

  if (!nextKeyframe) {
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
};

export const progressOfPoint = (
  point: ProjectPointWithKeyframes,
  sequence_id: number
) => {
  // output to [0,1] number to show progress

  const firstKeyframe = smallestKeyframeOfPoint(point);
  const lastKeyframe = biggestKeyframeOfPoint(point);
  if (firstKeyframe >= lastKeyframe) {
    return 1;
  }
  return (sequence_id - firstKeyframe) / (lastKeyframe - firstKeyframe);
};
export const interpolatedFinalPositionOfPoint = (
  point: ProjectPointWithKeyframes,
  sequence_id: number
) => {
  const startPointPos = interpolatedPositionOfPoint(
    point,
    sequence_id,
    "start"
  );
  let endPointPos = [...startPointPos];
  if (point.multi) {
    endPointPos = interpolatedPositionOfPoint(point, sequence_id, "end");
  }
  const startPointLocation = [startPointPos[0], startPointPos[1]];
  const endPointLocation = [endPointPos[0], endPointPos[1]];
  // what left is the picture location...
  //we must know the "progress of the point lifetime"
  // that's the progress since the first till the last frame
  const progressOfPointAtCurrentFrame = progressOfPoint(point, sequence_id);
  const imagePos: [number, number] = [
    (endPointLocation[0] - startPointLocation[0]) *
      progressOfPointAtCurrentFrame +
      startPointLocation[0],
    (endPointLocation[1] - startPointLocation[1]) *
      progressOfPointAtCurrentFrame +
      startPointLocation[1],
  ];
  return imagePos;
};
export const interpolatedScaleOfPoint = (
  point: ProjectPointWithKeyframes,
  sequence_id: number
) => {
  const previousKeyframe = previousKeyframeOfPoint(point, sequence_id);
  const nextKeyframe = nextKeyframeOfPoint(point, sequence_id);

  if (!previousKeyframe) {
    return nextKeyframe?.data.parameters.scale || 1;
  }
  if (previousKeyframe.sequence_id == sequence_id) {
    return previousKeyframe.data.parameters.scale;
  }

  if (!nextKeyframe) {
    return previousKeyframe.data.parameters.scale;
  }
  //interpolate

  const interpolatedScale = createInterpolator({
    inputRange: [previousKeyframe.sequence_id, nextKeyframe.sequence_id],
    outputRange: [
      previousKeyframe.data.parameters.scale,
      nextKeyframe.data.parameters.scale,
    ],
  });

  return interpolatedScale(sequence_id);
};
export const interpolatedBrightnessOfPoint = (
  point: ProjectPointWithKeyframes,
  sequence_id: number
) => {
  const previousKeyframe = previousKeyframeOfPoint(point, sequence_id);
  const nextKeyframe = nextKeyframeOfPoint(point, sequence_id);

  if (!previousKeyframe) {
    return nextKeyframe?.data.parameters.brightness || 200;
  }
  if (previousKeyframe.sequence_id == sequence_id) {
    return previousKeyframe.data.parameters.brightness;
  }

  if (!nextKeyframe) {
    return previousKeyframe.data.parameters.brightness;
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
};
export const interpolatedContrastOfPoint = (
  point: ProjectPointWithKeyframes,
  sequence_id: number
) => {
  const previousKeyframe = previousKeyframeOfPoint(point, sequence_id);
  const nextKeyframe = nextKeyframeOfPoint(point, sequence_id);

  if (!previousKeyframe) {
    return nextKeyframe?.data.parameters.contrast || 0;
  }
  if (previousKeyframe.sequence_id == sequence_id) {
    return previousKeyframe.data.parameters.contrast;
  }

  if (!nextKeyframe) {
    return previousKeyframe.data.parameters.brightness;
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
};

export const getLayerOfPoint = (
  point: ProjectPointWithKeyframes
  // sequence_id: number
) => {
  return point?.keyframes?.[0]?.data.parameters.layer ?? 0;
};

export const getPixelSizeOfPoint = (
  point: ProjectPointWithKeyframes
  // sequence_id: number
) => {
  return point?.keyframes?.[0]?.data.parameters.pixel_size ?? 100;
};
export const getGrayscaleOfPoint = (
  point: ProjectPointWithKeyframes
  // sequence_id: number
) => {
  return point?.keyframes?.[0]?.data?.parameters?.grayscale ?? false;
};
export const getFlipOfPoint = (
  point: ProjectPointWithKeyframes
  // sequence_id: number
) => {
  return point?.keyframes?.[0]?.data?.parameters?.flip ?? false;
};
export const getWheelSpeedOfPoint = (
  point: ProjectPointWithKeyframes
  // sequence_id: number
) => {
  return point?.keyframes?.[0]?.data?.parameters?.wheel_speed ?? 30;
};
export const getReverseWheelOfPoint = (
  point: ProjectPointWithKeyframes
  // sequence_id: number
) => {
  return point?.keyframes?.[0]?.data?.parameters?.reverse_wheel ?? false;
};
export const getRotationOfPoint = (point: ProjectPointWithKeyframes) => {
  return point?.keyframes?.[0]?.data?.parameters?.rotation ?? 0;
};
export const getMotionBlurIntensityOfPoint = (
  point: ProjectPointWithKeyframes
) => {
  return point?.keyframes?.[0]?.data?.parameters?.motion_blur_intensity ?? 0;
};
export const getColorTransferOfPoint = (
  point: ProjectPointWithKeyframes,
  allowNone = true
) => {
  if (
    !allowNone &&
    point?.keyframes?.some(
      (kf) => kf.data?.parameters?.color_transfer.name == ColorTransferEnum.none
    )
  ) {
    return undefined;
  }
  return (
    point?.keyframes?.[0]?.data?.parameters?.color_transfer ?? {
      name: ColorTransferEnum.none,
      r: -1,
      g: -1,
      b: -1,
      a: 0,
    }
  );
};
export const smallestKeyframeOfPoint = (point: ProjectPointWithKeyframes) =>
  min(point.keyframes.map((kf) => kf.sequence_id)) ?? Number.MIN_SAFE_INTEGER;
export const biggestKeyframeOfPoint = (point: ProjectPointWithKeyframes) =>
  max(point.keyframes.map((kf) => kf.sequence_id)) ?? Number.MAX_SAFE_INTEGER;

export const isPointVisibleAtFrame = (
  point: ProjectPointWithKeyframes,
  frameIndex: number
) => {
  const smallestFrameAppearance = smallestKeyframeOfPoint(point);
  const biggestFrameAppearance = biggestKeyframeOfPoint(point);
  // dont let it appear if there's not 2 frame
  if (
    smallestFrameAppearance == Number.MIN_SAFE_INTEGER ||
    biggestFrameAppearance == Number.MAX_SAFE_INTEGER
  ) {
    return false;
  }
  return (
    smallestFrameAppearance <= frameIndex &&
    biggestFrameAppearance >= frameIndex
  );
};
//final
export const generatePointFullFramesSequence = (
  point: ProjectPointWithKeyframes
) => {
  const smallestFrameAppearance = smallestKeyframeOfPoint(point);
  const biggestFrameAppearance = biggestKeyframeOfPoint(point);
  let frames: ObjectKeyframeProps[] = [];
  for (let i = smallestFrameAppearance; i <= biggestFrameAppearance; i++) {
    frames = frames.concat({
      frame_id: i,
      data: {
        parameters: {
          scale: interpolatedScaleOfPoint(point, i),
          brightness: interpolatedBrightnessOfPoint(point, i),
          contrast: point?.keyframes?.[0]?.data?.parameters?.contrast ?? 0,
          pixel_size: getPixelSizeOfPoint(point),
          grayscale: getGrayscaleOfPoint(point),
          wheel_speed: getWheelSpeedOfPoint(point),
          layer: getLayerOfPoint(point),
          rotation: getRotationOfPoint(point),
          motion_blur_intensity: getMotionBlurIntensityOfPoint(point),
          flip: getFlipOfPoint(point),
          color_transfer: getColorTransferOfPoint(point, false),
        },
        position: interpolatedFinalPositionOfPoint(point, i),
      },
    });
  }
  return frames;
};
