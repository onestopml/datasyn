import React, { useState } from "react";
import {
  Button,
  Modal,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../utils/constants";
import { ObjectKeyframeData } from "../../api/renex";
const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  maxWidth: "100vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: "0.5rem",
  "@media (min-width: 1063px)": {
    width: "64rem",
  },
};
interface PointDataToServer {
  object_id: string;
  object_class: string;
  gallery_id: string;
  data: ObjectKeyframeData;
}
interface IComponentProps {
  open: boolean;
  handleClose: () => void;
  frameId: number;
  datasetId: string;
  sampleId: string;
  data: { points: Array<PointDataToServer> };
}
const PreviewFrame = ({
  open,
  handleClose,
  frameId,
  datasetId,
  sampleId,
  data,
}: IComponentProps) => {
  const [isFisheye, setIsFisheye] = useState(false);
  const params = new URLSearchParams({
    did: datasetId,
    sid: sampleId,
    output_fisheye: isFisheye ? "true" : "false",
    data: Buffer.from(JSON.stringify(data)).toString("base64"),
  });
  const imageUrl = `${http}/model/cutpaste/image/${frameId}?${params.toString()}`;
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Frame {frameId}
        </Typography>
        <img
          src={imageUrl}
          alt="frame:"
          style={{
            minWidth: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            marginTop: "0.5rem",
          }}
          crossOrigin="anonymous"
        />
        <Box
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "1rem",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                title="Fisheye?"
                checked={isFisheye}
                onChange={(e, checked) => {
                  setIsFisheye(checked);
                }}
              ></Switch>
            }
            label="Fisheye?"
          ></FormControlLabel>

          <Button variant="outlined" color="error" onClick={handleClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default PreviewFrame;
