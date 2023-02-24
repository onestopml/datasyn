import { PrismaClient } from "@prisma/client";
import { rateLimiter } from "clerx";
import ffprobe from "ffprobe";
import ffprobeStatic from "ffprobe-static";
import fs from "fs";
import Jimp from "jimp";
import type { NextApiRequest, NextApiResponse } from "next";

import os from "os";
import path from "path";
import { from } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import { generateFrames } from "../../src/api/generate-frames";
import { filePathPrefix } from "../../src/utils/constants";
import getConfig from "../../src/utils/runtime-config";
const { serverRuntimeConfig } = getConfig();
const prismaClient = new PrismaClient({
  datasources: {
    db: { url: serverRuntimeConfig.DATABASE_URL },
  },
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(404).json({ message: "Method not supported!" });
  }
  try {
    const newProjectUUID = uuidv4();
    const params = req.body;
    if (!params.videoPath) {
      return res.status(422).json({ message: "Input problem!" });
    }
    const constructedVideoUrl = `${serverRuntimeConfig.ENVIRONMENT_URL}${filePathPrefix}${params.videoPath}`;

    const videoContent = await fetch(constructedVideoUrl, {})
      .then((resp) => resp.arrayBuffer())
      .then((arrayBuffer) => Buffer.from(arrayBuffer));

    const newFilePath = path.join(os.tmpdir(), `${newProjectUUID}.mp4`);
    fs.writeFileSync(newFilePath, videoContent);

    const fileInfo = await ffprobe(newFilePath, { path: ffprobeStatic.path });

    const videoStream = fileInfo.streams.find(
      (stream) => stream.codec_type == "video"
    );
    if (typeof videoStream === "undefined") {
      return res.status(422).json({ message: "Input problem!" });
    }
    const number_of_frames = +videoStream.nb_frames;
    const frameRateBits = videoStream.r_frame_rate.split("/");
    const frame_rate =
      parseInt(frameRateBits[0], 10) / parseInt(frameRateBits[1], 10);
    const frameData = await generateFrames(newFilePath);
    const firstImage = await Jimp.read(frameData[0].blob);

    const frame_width = firstImage.getWidth();
    const frame_height = firstImage.getHeight();

    const newProjectRecord = await prismaClient.projects.create({
      data: {
        project_uuid: newProjectUUID,
        name: "New Project",
        frame_rate: frame_rate,
        frame_width,
        frame_height,
        total_frames: number_of_frames,
        thumbnail_blob: frameData[0].blob.toString("base64"),
        dataset_id: params.datasetId,
        sample_id: params.sampleId,
        user_uuid: params.userId,
      },
    });

    //upload process
    return new Promise((ff, rj) => {
      from(frameData)
        .pipe(rateLimiter(10, 2000))
        .subscribe({
          next: async (item) => {
            console.log("uploading...", item.sequence_id);
            await prismaClient.project_frames.create({
              data: {
                blob: item.blob.toString("base64"),
                sequence_id: item.sequence_id,
                project_id: newProjectRecord.id,
              },
            });
          },
          complete() {
            console.log("done!");
            ff(
              res.status(200).json({
                message: "success",
                data: {
                  id: newProjectUUID,
                },
              })
            );
          },
          error(err) {
            rj(res.status(422).json({ message: "Cannot create project!" }));
          },
        });
    });
  } catch (e) {
    console.log("what error", e);
    return res.status(500).json({ message: "Error processing input!" });
  } finally {
    //
  }
};

export default handler;
