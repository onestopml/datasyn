import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material";

function LinearProgressWithLabel(props: any & { value: number }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value
        )}%`}</Typography>
      </Box>
    </Box>
  );
}
const ExportProcess = ({ exportOpen, handleExportClose }: any) => {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) =>
        prevProgress >= 100 ? 10 : prevProgress + 10
      );
    }, 800);
    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Dialog
      open={exportOpen}
      onClose={handleExportClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title" align="center">
        {"Job started: Video generation"}
        <Typography fontSize={12}>
          Job ID: b8a4e356-8410-49fa-aaf0-76d31b9256c0
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Time remaining:
          <LinearProgressWithLabel value={progress} />
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleExportClose} color="error">
          Cancel
        </Button>
        <Button onClick={handleExportClose} autoFocus color="success">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportProcess;
