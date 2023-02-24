import { http } from "../utils/constants";

// interface ObjectBankSummary {
//   class_id: string;
//   class_name: string;
//   number_objects: number;
// }
// export const fetchObjectBankSummary = async (
//   token: any
// ): Promise<Array<ObjectBankSummary>> => {
//   console.log(token);
//   const resp = await fetch(`${http}/objects/default/summary`, {
//     headers: new Headers({
//       Authorization: `Bearer ${token}`,
//     }),
//   });
//   return resp.json();
// };

export const fetchObjectBankList = async (token: string | undefined) => {
  const resp = await fetch(`${http}/objects`, {
    headers: new Headers({
      Authorization: `Bearer ${token}`,
    }),
  });
  return resp.json();
};
export const fetchObjectBankSummaryById = async (
  gid: string,
  token: string | undefined
) => {
  const resp = await fetch(`${http}/objects/${gid}/summary`, {
    headers: new Headers({
      Authorization: `Bearer ${token}`,
    }),
  });
  return resp.json();
};
export const fetchObjectBankInfoInGallery = async (
  gid: string,
  oid: string,
  token: string | undefined
) => {
  const resp = await fetch(`${http}/objects/${gid}/${oid}`, {
    headers: new Headers({
      Authorization: `Bearer ${token}`,
    }),
  });
  return resp.json();
};
interface ObjectBankItem {
  object_id: string;
  class_name: string;
  image_filepath: string;
  mask_filepath: string;
  keypoints_filepath: string;
  object_filepath: string;
}
export const fetchObjectBankItems = async (
  class_id: string,
  gid: string,
  token: string | undefined
): Promise<Array<ObjectBankItem>> => {
  const resp = await fetch(
    `${http}/objects/${gid}/list?` + new URLSearchParams({ class_id }),
    {
      headers: new Headers({
        Authorization: `Bearer ${token}`,
      }),
    }
  );
  return resp.json();
};
export interface ObjectKeyframeData {
  position: [number, number];
  parameters: {
    scale: number;
    brightness: number;
    wheel_speed: number;
    pixel_size: number;
    contrast: number;
    grayscale: boolean;
    layer: number;
    rotation: number;
    motion_blur_intensity: number;
    flip: boolean;
    color_transfer: {
      name: string;
      r: number;
      g: number;
      b: number;
      a: number;
    };
    // reverse_wheel: boolean;
  };
}
export interface ObjectKeyframeProps {
  frame_id: number;
  data: ObjectKeyframeData;
}
interface ICreatePreviewVideoParams {
  dataset_id?: string;
  sample_id?: string;
  output_fisheye?: boolean;
  data:
    | {
        multiple_video: false;
        points: Array<{
          object_id: string;
          object_class: string;
          gallery_id: string;
          keyframes: Array<ObjectKeyframeProps>;
        }>;
      }
    | {
        multiple_video: true;
        no_gen_videos: number;
        points: Array<{
          object_class: string;
          object_id: string;
          gallery_id: string;
          keyframes: Array<ObjectKeyframeProps>;
        }>;
      };
  token?: string;
}
export const createPreviewVideo = async (
  params: ICreatePreviewVideoParams
): Promise<{ dag_id: string; run_id: string }> => {
  const api_url =
    `${http}/model/cutpaste/video/${params.sample_id}?` +
    new URLSearchParams({
      did: params.dataset_id ?? "",
      output_fisheye: params.output_fisheye ? "true" : "false",
    });
  return fetch(api_url, {
    method: "POST",
    headers: new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.token}`,
    }),
    body: JSON.stringify(params.data),
  }).then((resp) => resp.json());
};
