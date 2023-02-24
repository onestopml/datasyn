export const basePath = "/datasyn";
// const host = process.env.NODE_ENV == "development" ? basePath + "/api" : "/api";

export const http = basePath + "/api";

export const filePathPrefix = "/filepath";

export enum TaskStatusEnum {
  "Queued" = "Queued",
  "Running" = "Running",
  "Success" = "Success",
  "Failed" = "Failed",
}

export enum ColorTransferEnum {
  "none" = "none",
  "color_alt" = "color_alt",
  "stats_norm" = "stats_norm",
  "stats_standz" = "stats_standz",
  "color_paint" = "color_paint",
}
