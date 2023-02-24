import { GasMeterOutlined, Publish, Videocam } from "@mui/icons-material";
import { AppBar, Box, Button, createTheme, Toolbar } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getTasks } from "../api/backendClient";
import { useProjectStore } from "../stores/project";
import ExportModal from "./Export/ExportModal";
import PreviewVideo from "./VideoPreview/PreviewVideo";

const Header = () => {
  const projectData = useProjectStore((state) => state.computed.data.project);
  const modalName = useProjectStore((state) => state.modal);
  const setModalName = useProjectStore((state) => state.setModal);
  const tasks = useQuery(
    ["/tasks", projectData.id, "/running"],
    async () => {
      return getTasks(projectData.id);
    },
    {
      refetchInterval: 10000,
    }
  );
  return (
    <AppBar position="sticky" color="secondary">
      <Toolbar style={{ display: "flex", justifyContent: "space-between" }}>
        <Link href="/">
          <Box
            component="img"
            sx={{
              height: 70,
              width: 70,
            }}
            alt="logo"
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWnNs3hmT-Sm5XjH6hfkwZe730xb2wqx4bYStQy9pqfJX6QFRjhz-jqVbncztjuxo8NX4&usqp=CAU"
          />
        </Link>
        <Box>
          <Button
            color="primary"
            component="label"
            onClick={() => {
              setModalName("tasks");
            }}
            style={{ marginRight: "1rem" }}
            variant="outlined"
            startIcon={<GasMeterOutlined />}
          >
            Tasks ({tasks.data?.data?.length ?? 0})
          </Button>
          <Button
            color="info"
            component="label"
            onClick={() => {
              setModalName("render");
            }}
            style={{ marginRight: "1rem" }}
            variant="outlined"
            startIcon={<Videocam />}
          >
            Render
          </Button>
          <Button
            color="warning"
            component="label"
            onClick={() => {
              setModalName("export");
            }}
            style={{ marginRight: "1rem" }}
            variant="outlined"
            startIcon={<Publish />}
          >
            Generate
          </Button>
        </Box>
      </Toolbar>

      <ExportModal
        open={modalName == "export"}
        handleClose={() => {
          setModalName("");
        }}
      />
      <PreviewVideo
        open={modalName == "render"}
        handleClose={() => {
          setModalName("");
        }}
      />
    </AppBar>
  );
};
export default Header;
