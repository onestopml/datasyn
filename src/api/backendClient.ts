import {
  point_keyframes,
  projects,
  project_frames,
  project_points,
  tasks,
} from "@prisma/client";
import axios from "axios";
import { ColorTransferEnum, http, TaskStatusEnum } from "../utils/constants";
export type PositionTuple = [number, number];
export type Project = projects;
export type ProjectFrame = project_frames;
export type ProjectPoint = project_points;
export type PointKeyframeData = {
  start_position: PositionTuple;
  end_position: PositionTuple;
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
    reverse_wheel: boolean;
    color_transfer: {
      name: ColorTransferEnum;
      r: number;
      g: number;
      b: number;
      a: number;
    };
  };
};
export type ProjectPointKeyframe = point_keyframes & {
  data: PointKeyframeData;
};

const backendClient = axios.create({
  baseURL: http,
});

export const getTasks = (project_id: number) => {
  return backendClient.get<Array<tasks>>("/local_tasks", {
    params: new URLSearchParams({
      orderBy: JSON.stringify({ created_at: "$desc" }),
      where: JSON.stringify({
        project_id: project_id,
        is_read: false,
        status: { $in: [TaskStatusEnum.Queued, TaskStatusEnum.Running] },
      }),
    }),
  });
};
export const getTasksUnread = (project_id: number) => {
  return backendClient.get<Array<tasks>>("/local_tasks", {
    params: new URLSearchParams({
      orderBy: JSON.stringify({ created_at: "$desc" }),
      where: JSON.stringify({
        project_id: project_id,
        is_read: false,
        // status: { $in: [TaskStatusEnum.Queued, TaskStatusEnum.Running] },
      }),
    }),
  });
};
export const getProjects = (user_uuid: string) => {
  return backendClient.get<Array<projects>>("/projects", {
    params: {
      user_uuid: user_uuid,
    },
  });
};

export const getProjectByUUID = (project_uuid: string) => {
  return backendClient.get<Array<projects>>(`/projects`, {
    params: new URLSearchParams({
      where: JSON.stringify({
        project_uuid: { $eq: project_uuid },
      }),
    }),
  });
};
export const updateProjectName = (project_id: number, name: string) => {
  return backendClient.patch(`/projects/${project_id}`, {
    name,
  });
};
export const getProjectFrames = (project_id: number) => {
  return backendClient.get<Array<project_frames>>("/project_frames", {
    params: new URLSearchParams({
      where: JSON.stringify({ project_id: { $eq: project_id } }),
      orderBy: JSON.stringify({ sequence_id: "$asc" }),
    }),
  });
};

export const getProjectPoints = (project_id: number) => {
  return backendClient.get<Array<project_points>>("/project_points", {
    params: new URLSearchParams({
      where: JSON.stringify({ project_id: { $eq: project_id } }),
    }),
  });
};
export const getPointKeyframes = (point_ids: number[]) => {
  return backendClient.get<Array<ProjectPointKeyframe>>("/point_keyframes", {
    params: new URLSearchParams({
      where: JSON.stringify({ point_id: { $in: point_ids } }),
    }),
  });
};

export const insertPointKeyframe = (data: {
  point_id: number;
  sequence_id: number;
  data: PointKeyframeData;
}) => {
  return backendClient.post<ProjectPointKeyframe>("/point_keyframes", data);
};
export const removePointKeyframe = (data: { id: number }) => {
  return backendClient.delete(`/point_keyframes/${data.id}`);
};
export const updatePointKeyframe = (keyframeObject: ProjectPointKeyframe) => {
  return backendClient.put<ProjectPointKeyframe>(
    `/point_keyframes/${keyframeObject.id}`,
    keyframeObject
  );
};
export const insertTask = (data: tasks) => {
  return backendClient.post(`/local_tasks`, data);
};
export const updatetask = (data: tasks) => {
  return backendClient.put(`/local_tasks/put`, data);
};
export const markReadTask = (data: { dag_id: string; run_id: string }) => {
  return backendClient.patch(`/local_tasks/patch`, {
    dag_id: data.dag_id,
    run_id: data.run_id,
    is_read: true,
  });
};
export const insertProjectPoint = (data: {
  project_id: number;
  multi: boolean;
  label: string;
}) => {
  return backendClient.post<project_points>("/project_points", data);
};
export const deleteProjectPoint = (data: { id: number }) => {
  return backendClient.delete(`/project_points/${data.id}`);
};
export const updateProjectPoint = (data: Partial<project_points>) => {
  return backendClient.patch<project_points>(
    `/project_points/${data.id}`,
    data
  );
};
