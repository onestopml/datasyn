import { PrismaClient, tasks } from "@prisma/client";
import { NotFoundError } from "@prisma/client/runtime";
import { NextApiRequest, NextApiResponse } from "next";
import getConfig from "../../../src/utils/runtime-config";

const { serverRuntimeConfig } = getConfig();
const prismaClient = new PrismaClient({
  datasources: {
    db: { url: serverRuntimeConfig.DATABASE_URL },
  },
});
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "PATCH") {
    return res.status(404).json({ message: "Method not supported!" });
  }
  const { dag_id, run_id } = req.body;

  // get the task by keys
  const task = await prismaClient.tasks.findUnique({
    where: {
      dag_id_run_id: { dag_id: dag_id as string, run_id: run_id as string },
    },
  });
  if (task) {
    const newTask = await prismaClient.tasks.update({
      where: {
        dag_id_run_id: { dag_id: task.dag_id, run_id: task.run_id },
      },
      data: {
        is_read: !!req.body.is_read,
      },
    });
    return res.send(newTask);
  } else {
    return res
      .status(404)
      .send(
        `Not Found: ${"tasks"} ${JSON.stringify({ dag_id, run_id })} not found`
      );
  }
};
export default handler;
