import React from "react";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Typography,
  Box,
  FormControl,
  OutlinedInput,
  Grid,
} from "@mui/material";

const PositionCropping = () => {
  return (
    <Box style={{ padding: 24 }}>
      <Accordion defaultExpanded={true}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography variant="h6">Position and Cropping</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container rowSpacing={2}>
            <Grid item xs={6} style={{ display: "flex", alignItems: "center" }}>
              <Typography>X</Typography>
              <FormControl
                sx={{ width: "10ch" }}
                style={{ marginLeft: "2.8rem" }}
              >
                <OutlinedInput placeholder="X value" type="number" />
              </FormControl>
            </Grid>
            <Grid item xs={6} style={{ display: "flex", alignItems: "center" }}>
              <Typography>Y</Typography>
              <FormControl
                sx={{ width: "10ch" }}
                style={{ marginLeft: "2.9rem" }}
              >
                <OutlinedInput placeholder="Y value" type="number" />
              </FormControl>
            </Grid>
            <Grid item xs={6} style={{ display: "flex", alignItems: "center" }}>
              <Typography>Scale</Typography>
              <FormControl
                sx={{ width: "10ch" }}
                style={{ marginLeft: "1rem" }}
              >
                <OutlinedInput placeholder="scale value" />
              </FormControl>
            </Grid>
            <Grid item xs={6} style={{ display: "flex", alignItems: "center" }}>
              <Typography>Angle</Typography>
              <FormControl
                sx={{ width: "10ch" }}
                style={{ marginLeft: "1rem" }}
              >
                <OutlinedInput placeholder="angle value" />
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default PositionCropping;
