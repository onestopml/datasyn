import ffmpeg from "fluent-ffmpeg";
import path from "path";
import os from "os";
import fs from "fs";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { v4 as uuidv4 } from "uuid";
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const fileNameToSeqIdRegex = /frames_(\d+).jpg/;

export const generateFrames = async (
  videoPath: string
): Promise<
  Array<{
    sequence_id: number;
    blob: Buffer;
  }>
> => {
  return new Promise((ff, rj) => {
    const framesDir = path.join(os.tmpdir(), `/frames-${uuidv4()}/`);

    fs.mkdirSync(framesDir, {});

    // run the FFmpeg command-line tool, converting the AVI into an MP4
    ffmpeg(videoPath, {})
      .output(`${framesDir}/frames_%d.jpg`)
      .on("end", function () {
        const openFramesDir = fs.readdirSync(framesDir);
        const videoFramesData = openFramesDir
          .filter((fileName) => fileName.includes(".jpg"))
          .map((file, fileIndex) => {
            const fileBuffer = fs.readFileSync(path.join(framesDir, file));
            let sequence_id = "";
            let matcher;

            if ((matcher = fileNameToSeqIdRegex.exec(file)) !== null) {
              // The result can be accessed through the `m`-variable.
              matcher.forEach((match, groupIndex) => {
                // console.log(`Found match, group ${groupIndex}: ${match}`);
                sequence_id = match;
              });
            } else {
              rj(false);
            }
            return {
              sequence_id: parseInt(sequence_id, 10),
              blob: fileBuffer,
            };
          });
        ff(videoFramesData);
      })
      .run();
  });
};
