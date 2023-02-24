import { Box, Container, Grid } from "@mui/material";
import { useRouter } from "next/router";
import { ToastContainer } from "react-toastify";
import Header from "../../components/Header";
import { ObjectBankModal } from "../../components/ObjectBankModal";
import SidePanel from "../../components/SidePanel";
import { Tasks } from "../../components/Tasks";
import VideoPreview from "../../components/VideoPreview";
import { useProjectStore } from "../../stores/project";

export const ProjectScreen = () => {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const modalName = useProjectStore((state) => state.modal);
  if (!projectId) {
    return <div>error</div>;
  }
  return (
    <Container
      maxWidth={false}
      disableGutters
      key={`videoPreview-${projectId}`}
    >
      <Box>
        <Header />
      </Box>
      <Container maxWidth={"xl"} disableGutters>
        <Grid container style={{}}>
          <VideoPreview projectId={projectId} />
          <SidePanel />
        </Grid>
      </Container>
      <ObjectBankModal key={modalName} />
      <Tasks />
      <ToastContainer />
    </Container>
  );
};
