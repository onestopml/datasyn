import * as pbm from "@thi.ng/pixel-io-netpbm";
export function toDataURL(src: string): Promise<string> {
  return new Promise((ff, rj) => {
    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = function () {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = image.naturalHeight;
      canvas.width = image.naturalWidth;
      context?.drawImage(image, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      ff(dataURL);
    };
    image.src = src;
  });
}
export const loadImageByPromise = (url: string): Promise<HTMLImageElement> =>
  new Promise((ff, rj) => {
    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = function () {
      console.log("ok", image.src);
      ff(image);
    };
    image.onerror = function () {
      console.log("why", image.src);
    };
    image.src = url;
  });

export async function toDataURLWithMasking(
  src: string,
  mask_src: string
): Promise<string> {
  const imageCanvas = document.createElement("canvas");
  const imageCtx = imageCanvas.getContext("2d");
  const maskCanvas = document.createElement("canvas");
  const maskCtx = maskCanvas.getContext("2d");

  if (!imageCtx || !maskCtx) {
    throw Error("operation not supported");
  }
  const mainImg = await loadImageByPromise(src);
  imageCanvas.width = mainImg.width;
  imageCanvas.height = mainImg.height;

  maskCanvas.width = mainImg.width;
  maskCanvas.height = mainImg.height;

  const pbmContent = await fetch(mask_src).then((resp) => resp.arrayBuffer());
  const maskImg = pbm.read(new Uint8Array(pbmContent));

  maskCtx.putImageData(maskImg.toImageData(), 0, 0);
  const data = maskCtx.getImageData(0, 0, maskImg.width, maskImg.height);
  let i = 0;
  while (i < data.data.length) {
    const rgb = data.data[i++] + data.data[i++] + data.data[i++];
    data.data[i++] = rgb / 3;
  }
  maskCtx.putImageData(data, 0, 0);
  imageCtx.drawImage(mainImg, 0, 0);
  imageCtx.globalCompositeOperation = "destination-in";
  imageCtx.drawImage(maskCanvas, 0, 0, maskImg.width, maskImg.height);
  imageCtx.globalCompositeOperation = "source-over";
  const dataURL = imageCanvas.toDataURL("image/png");
  return dataURL;
}
