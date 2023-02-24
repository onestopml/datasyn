import Konva from "konva";
import { Filter } from "konva/lib/Node";
import pica from "pica";
import { createInterpolator } from "range-interpolator";
import { Fragment, useEffect, useRef, useState } from "react";
import { Image as KonvaImage, Transformer } from "react-konva";
const picaRenderer = pica();
export const KonvaImageWithParams = (params: {
  image: HTMLImageElement;
  width: number;
  height: number;
  offset: {
    x: number;
    y: number;
  };
  filters: Array<Filter>;
  brightness: number;
  position: {
    x: number;
    y: number;
  };
  visible: boolean;
  pixelSize: number;
  contrast: number;
  rotation: number;
  updateRotationHandler(val: number): void;
  isSelected: boolean;
  isAtKeyframe: boolean;
  isEditable: boolean;
  onMouseOver?(): void;
  onMouseOut?(): void;
  onClick?(): void;
  flip: boolean;
  red: number;
  green: number;
  blue: number;
  alpha: number;
}) => {
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  useEffect(() => {
    if (imageRef.current && trRef.current && params.isSelected) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [params.isSelected]);

  const interpolatedToKonvaValueBrightness = createInterpolator({
    inputRange: [0, 10, 50, 100, 255, 510],
    outputRange: [-1, -0.8, -0.5, -0.4, 0, 1],
  });
  const [innerImage, setInnerImage] = useState<ImageBitmap>();
  useEffect(() => {
    const resizeFunction = async () => {
      if (params.image.width > 0 && params.image.height > 0) {
        const canvas = document.createElement("canvas");
        const fullCanvas = document.createElement("canvas");
        fullCanvas.width = params.image.width;
        fullCanvas.height = params.image.height;
        const scaleRatio = 100 / params.pixelSize;
        const newImageWidth = Math.floor(params.image.width / scaleRatio);
        const newImageHeight = Math.floor(params.image.height / scaleRatio);
        canvas.width = newImageWidth;
        canvas.height = newImageHeight;
        await picaRenderer.resize(params.image, canvas, { filter: "lanczos2" });
        await picaRenderer.resize(canvas, fullCanvas, { filter: "lanczos2" });
        const data = await createImageBitmap(fullCanvas, {});
        setInnerImage(data);
      }
    };
    resizeFunction();
    return () => {
      //
    };
  }, [params.height, params.image, params.pixelSize, params.width]);
  useEffect(() => {
    if (params.brightness || params.image || innerImage || params.visible) {
      // you many need to reapply cache on some props changes like shadow, stroke, etc.
      imageRef.current?.cache();
    }
  }, [innerImage, params.brightness, params.image, params.visible]);

  return (
    <Fragment>
      <KonvaImage
        ref={imageRef}
        image={innerImage}
        x={params.position.x}
        y={params.position.y}
        width={params.width}
        height={params.height}
        offset={params.offset}
        filters={params.filters}
        red={params.red}
        green={params.green}
        blue={params.blue}
        alpha={params.alpha}
        brightness={interpolatedToKonvaValueBrightness(params.brightness)}
        visible={params.visible}
        contrast={params.contrast}
        rotation={params.rotation}
        scaleX={params.flip ? -1 : 1}
        onTransformEnd={(e) => {
          const node = imageRef.current;
          if (node) {
            node.x(params.position.x);
            node.y(params.position.y);
            params.updateRotationHandler(Math.abs(360 + node.rotation()) % 360);
          }
        }}
        onClick={params.onClick}
        onMouseOver={params.onMouseOver}
        onMouseOut={params.onMouseOut}
      ></KonvaImage>

      <Transformer
        ref={trRef}
        visible={
          params.isEditable &&
          params.isSelected &&
          params.isAtKeyframe &&
          params.visible
        }
        resizeEnabled={false}
      ></Transformer>
    </Fragment>
  );
};
