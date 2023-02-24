import { useState } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  OutlinedInput,
  Typography,
} from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import { toast } from "react-toastify";

const PointInformation = () => {
  const [open, setOpen] = useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    toast.success("Clear successfully!");
  };

  return (
    <Box style={{ padding: 24 }}>
      <Accordion defaultExpanded={true}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography variant="h6">Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box style={{ display: "flex", alignItems: "center" }}>
            <Typography>Image name:</Typography>
            <Box
              component="form"
              noValidate
              autoComplete="off"
              style={{ marginLeft: "0.5rem" }}
            >
              <FormControl sx={{ width: "25ch" }} disabled>
                <OutlinedInput placeholder="Please enter text" />
              </FormControl>
            </Box>
          </Box>
          <Box style={{ marginTop: "1rem" }}>
            <Typography>Size: 30MB</Typography>
          </Box>
          <Box style={{ marginTop: "1rem" }}>
            <Button color="primary" component="label">
              Replace image
              <input hidden accept="video/*" multiple type="file" />
            </Button>
            <Button
              variant="contained"
              color="error"
              style={{ marginLeft: "1rem" }}
              onClick={handleClickOpen}
            >
              Clear image
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Are you sure to clear this image?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Once deleted, it cant be undo.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="error">
            Cancel
          </Button>
          <Button onClick={handleClose} autoFocus color="success">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PointInformation;
