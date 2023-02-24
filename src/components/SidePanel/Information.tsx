import { useCallback, useEffect, useState } from "react";

import { Check, Close } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  IconButton,
  Input,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useProjectStore } from "../../stores/project";
import { updateProjectName } from "../../api/backendClient";

const Information = () => {
  const queryClient = useQueryClient();
  const projectData = useProjectStore((state) => state.project);
  const [projectName, setProjectName] = useState(projectData.name);

  useEffect(() => {
    setProjectName(projectData.name);
  }, [projectData.name]);
  const updateProjectNameHandler = useCallback(async () => {
    await updateProjectName(projectData.id, projectName);

    toast.success("Project Name Changed", {
      toastId: "update-name-toast",
    });
    queryClient.invalidateQueries(["/project/points"]);
  }, [projectData.id, projectName, queryClient]);
  return (
    <Box style={{ padding: 24 }}>
      <Accordion defaultExpanded={true}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography variant="h6">General Info</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell align="right">{projectData.id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">
                    <Input
                      value={projectName}
                      onChange={(e) => {
                        setProjectName(e.target.value);
                      }}
                      endAdornment={
                        <>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              updateProjectNameHandler();
                            }}
                          >
                            <Check></Check>
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setProjectName(projectData.name);
                            }}
                          >
                            <Close></Close>
                          </IconButton>
                        </>
                      }
                    ></Input>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Frame Count</TableCell>
                  <TableCell align="right">
                    {projectData.total_frames}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Frame Rate</TableCell>
                  <TableCell align="right">
                    {projectData.frame_rate?.toFixed(2)} fps
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default Information;
