// pages/api/[...nextcrud].ts
import NextCrud, { PrismaAdapter, RouteType } from "@premieroctet/next-crud";
import {
  point_keyframes,
  Prisma,
  PrismaClient,
  projects,
  project_frames,
  project_points,
  tasks,
} from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import httpProxyMiddleware from "next-http-proxy-middleware";
import getConfig from "../../src/utils/runtime-config";
const { serverRuntimeConfig } = getConfig();
const prismaClient = new PrismaClient({
  datasources: {
    db: { url: serverRuntimeConfig.DATABASE_URL },
  },
});
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (
    req.url.startsWith("/api/objects") ||
    req.url.startsWith("/api/model") ||
    req.url.startsWith("/api/info") ||
    req.url.startsWith("/api/filepath") ||
    req.url.startsWith("/api/tasks")
  ) {
    return httpProxyMiddleware(req, res, {
      target: serverRuntimeConfig.ENVIRONMENT_URL,
      pathRewrite: [{ patternStr: "^/api", replaceStr: "" }],
    });
  }
  const nextCrudHandler = await NextCrud({
    adapter: new PrismaAdapter<
      projects | project_points | point_keyframes | project_frames | tasks,
      Prisma.ModelName
    >({
      prismaClient: prismaClient,
    }),
    models: {
      [Prisma.ModelName.projects]: {
        name: "projects",
        only: [RouteType.READ_ALL, RouteType.READ_ONE, RouteType.UPDATE],
      },
      [Prisma.ModelName.project_frames]: {
        name: "project_frames",
        only: [RouteType.READ_ALL],
      },
      [Prisma.ModelName.project_points]: {
        name: "project_points",
      },
      [Prisma.ModelName.point_keyframes]: {
        name: "point_keyframes",
      },
      [Prisma.ModelName.tasks]: {
        name: "local_tasks",
        only: [RouteType.READ_ALL, RouteType.CREATE],
      },
    },
  });
  return nextCrudHandler(req, res);
};
export default handler;
export const config = {
  api: {
    responseLimit: false,
  },
};
