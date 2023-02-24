import {
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { Container } from "@mui/system";
import { useKeycloak } from "@react-keycloak/ssr";
import { useQuery } from "@tanstack/react-query";
import sortBy from "lodash/fp/sortBy";
import Link from "next/link";
import { useMemo } from "react";
import { getProjects } from "../../api/backendClient";
export const HomeScreen = () => {
  const { keycloak } = useKeycloak();
  const userUUID = keycloak.idTokenParsed?.sub;
  const projects = useQuery(["/projects"], async () => {
    return getProjects(userUUID);
  });
  const sortedProjects = useMemo(() => {
    return sortBy((el) => el.id, projects.data?.data ?? []);
  }, [projects.data]);
  return (
    <Container
      sx={{
        padding: 8,
      }}
    >
      <Typography variant="h1">DataSynth Demo</Typography>
      <Typography variant="h5">Projects list:</Typography>
      {projects.isLoading && <CircularProgress></CircularProgress>}
      <List>
        {sortedProjects?.map((project) => {
          return (
            <ListItem key={project.id} disablePadding>
              <Link
                href={`/projects/${project.project_uuid}`}
                style={{ textDecoration: "none", color: "#06f" }}
              >
                <ListItemButton>
                  <ListItemIcon style={{ marginRight: 8 }}>
                    <img
                      src={`data:image/jpeg;base64,${project.thumbnail_blob}`}
                      width={72}
                      height={72}
                      alt={"project thumbnail"}
                    ></img>
                  </ListItemIcon>
                  <ListItemText>
                    {project.id}. {project.name?.toUpperCase()}
                  </ListItemText>
                </ListItemButton>
              </Link>
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
};
