import { LinearProgress, Typography } from "@mui/material";
import { Container } from "@mui/system";
import { useKeycloak } from "@react-keycloak/ssr";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { basePath, filePathPrefix } from "../../utils/constants";

export const ProjectCreateScreen = () => {
  const { keycloak } = useKeycloak();
  const router = useRouter();
  const projectParams = router.query.data as string;
  console.log("router.query", router.query);
  const handleVideoChanged = useCallback(
    async (params: {
      datasetId: string;
      sampleId: string;
      videoPath: string;
      token: string;
      userId: string;
    }) => {
      try {
        const resp = await fetch(`${basePath}/api/create`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        }).then((resp) => resp.json());
        console.log("resp", resp);
        if (resp?.data?.id) {
          router.push(`/projects/${resp.data.id}`);
        } else {
          toast.error("create project error!");
        }
      } catch (e) {
        toast.error("create project error!");
      }
    },
    [router]
  );
  const fetchVideo = useCallback(async () => {
    const myAbortController = new AbortController();
    if (projectParams) {
      const parsedParams = JSON.parse(
        Buffer.from(projectParams, "base64").toString("utf-8")
      );
      if (parsedParams["videoPath"]) {
        //fetch the video then call generate frame
        handleVideoChanged({
          datasetId: parsedParams["datasetId"],
          sampleId: parsedParams["sampleId"],
          videoPath: parsedParams["videoPath"],
          token: keycloak.token,
          userId: keycloak.idTokenParsed.sub,
        });
      }
    }
    return () => {
      myAbortController.abort();
    };
  }, [
    handleVideoChanged,
    keycloak.idTokenParsed.sub,
    keycloak.token,
    projectParams,
  ]);
  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);
  return (
    <Container sx={{ textAlign: "center", paddingTop: 24 }}>
      <Typography variant="h4">{`We're creating your project...`} </Typography>
      <br />
      <LinearProgress variant="indeterminate"></LinearProgress>
    </Container>
  );
};
