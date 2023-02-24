import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import { useCallback, useMemo, useState } from "react";

import {
  AddCircleOutlineTwoTone,
  ArrowDownward,
  ArrowUpward,
  ModeEditOutlineTwoTone,
  RemoveCircleOutlineTwoTone,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  OutlinedInput,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import produce from "immer";
import flatten from "lodash/fp/flatten";
import omit from "lodash/fp/omit";
import sortBy from "lodash/fp/sortBy";
import {
  ProjectPointWithKeyframes,
  useProjectStore,
} from "../../stores/project";
import { getLayerOfPoint } from "../../utils/generatePointFrames";
import { useKeyframeDataMutation } from "../../utils/useKeyframeDataMutation";
import { usePointDataMutation } from "../../utils/usePointDataMutation";

const Points = () => {
  const queryClient = useQueryClient();
  const projectPoints = useProjectStore(
    (state) => state.computed.data.project.points
  );
  const project = useProjectStore((state) => state.project);
  const currentFrameIndex = useProjectStore((state) => state.currentFrameIndex);
  const selectedPoint = useProjectStore(
    (state) => state.computed.selectedPoint
  );
  const setSelectedPointId = useProjectStore(
    (state) => state.setSelectedPointId
  );
  const [newPointName, setNewPointName] = useState("");
  const changePointData = usePointDataMutation();
  const changeKeyframeData = useKeyframeDataMutation();

  const setModal = useProjectStore((state) => state.setModal);

  //this mean the layer=2 will come before the layer=1
  //and generally the layer higher will overlap the lower layer
  const sortedPoints = useMemo(() => {
    return sortBy((el) => -getLayerOfPoint(el), projectPoints);
  }, [projectPoints]);
  const updateLayerForPoints = useCallback(
    (point?: ProjectPointWithKeyframes, direction?: "up" | "down") => {
      let newSortedPoints: ProjectPointWithKeyframes[] = [...sortedPoints];
      if (point && direction) {
        //now we have the point that need updating, check if it can change the position first
        const thePointIndexInArray = sortedPoints.findIndex(
          (el) => el.id == point.id
        );
        if (direction == "up") {
          //check if it can go up, that mean the index is currently greater than 0
          if (thePointIndexInArray == 0) {
            //
          } else {
            newSortedPoints = produce(sortedPoints, (draft) => {
              [draft[thePointIndexInArray], draft[thePointIndexInArray - 1]] = [
                draft[thePointIndexInArray - 1],
                draft[thePointIndexInArray],
              ];
            });
          }
        } else {
          //direction is down, check for lower number
          if (thePointIndexInArray == sortedPoints.length - 1) {
            //
          } else {
            newSortedPoints = produce(sortedPoints, (draft) => {
              [draft[thePointIndexInArray], draft[thePointIndexInArray + 1]] = [
                draft[thePointIndexInArray + 1],
                draft[thePointIndexInArray],
              ];
            });
          }
        }
      }
      //otherwise just update

      const allPointUpdates = newSortedPoints.map((thePoint, thePointIndex) => {
        const allPointKeyframeUpdates = thePoint.keyframes.map((keyframe) => {
          const newData = produce(keyframe, (draft) => {
            draft.data.parameters.layer =
              newSortedPoints.length - 1 - thePointIndex;
          });
          return changeKeyframeData.mutate({ type: "update", data: newData });
        });
        return allPointKeyframeUpdates;
      });

      return Promise.all(flatten(allPointUpdates)).then(() => {
        queryClient.invalidateQueries(["/project/points"]);
      });
    },
    [changeKeyframeData, queryClient, sortedPoints]
  );
  const addNewPointHandler = useCallback(
    (sequence_id: number, type: "single" | "multi" = "single") => {
      changePointData.mutate(
        {
          type: "insert",
          data: {
            label: newPointName,
            sequence_id,
            project_id: project.id,
            multi: type == "multi",
          },
        },
        {
          onSuccess(data) {
            queryClient.invalidateQueries(["/project/points"]);
            setNewPointName("");
            setSelectedPointId(data.data.id ?? -1);
            setModal("object-bank");
          },
        }
      );
    },
    [
      changePointData,
      newPointName,
      project.id,
      queryClient,
      setModal,
      setSelectedPointId,
    ]
  );
  const removePointHandler = useCallback(
    (point_id: number) => {
      changePointData.mutate(
        {
          type: "remove",
          data: {
            id: point_id,
          },
        },
        {
          onSuccess() {
            queryClient.invalidateQueries(["/project/points"]);
          },
        }
      );
    },
    [changePointData, queryClient]
  );

  const togglePointVisibility = useCallback(
    (point: ProjectPointWithKeyframes) => {
      changePointData.mutate(
        { type: "update", data: { id: point.id, visible: !point.visible } },
        {
          onSuccess() {
            queryClient.invalidateQueries(["/project/points"]);
          },
        }
      );
    },
    [changePointData, queryClient]
  );
  return (
    <Box style={{ padding: 24 }}>
      <Accordion defaultExpanded={true}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography variant="h6">Objects</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ padding: "12px" }}>
            <FormControl sx={{ width: "100%" }}>
              <InputLabel>New Object Name</InputLabel>
              <OutlinedInput
                type="text"
                label="New Point Name"
                value={newPointName}
                onChange={(e) => setNewPointName(e.target.value)}
                endAdornment={[
                  <InputAdornment position="end" key={"single"}>
                    <Tooltip title="Add a single-point object">
                      <span>
                        <IconButton
                          edge="end"
                          color="success"
                          disabled={newPointName.length == 0}
                          onClick={() => {
                            addNewPointHandler(currentFrameIndex, "single");
                          }}
                          size="small"
                        >
                          S<AddCircleOutlineTwoTone />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>,
                  <InputAdornment position="end" key={"multi"}>
                    <Tooltip title="Add a multi-point object">
                      <span>
                        <IconButton
                          edge="end"
                          color="success"
                          disabled={newPointName.length == 0}
                          onClick={() => {
                            addNewPointHandler(currentFrameIndex, "multi");
                          }}
                          size="small"
                        >
                          M<AddCircleOutlineTwoTone />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>,
                ]}
              />
            </FormControl>
          </Box>
          <List>
            {sortedPoints.map((point) => {
              return (
                <ListItem key={point.id}>
                  <Box
                    style={{
                      display: "flex",
                      gap: 4,
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <Button
                      variant={
                        point.id == selectedPoint?.id ? "contained" : "outlined"
                      }
                      color="success"
                      onClick={() => {
                        setSelectedPointId(point.id);
                      }}
                      size="small"
                    >
                      {getLayerOfPoint(point)}. {point.label}
                    </Button>
                    <ButtonGroup>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => updateLayerForPoints(point, "up")}
                        disabled={point.keyframes.length == 0}
                      >
                        <ArrowUpward></ArrowUpward>
                      </IconButton>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => updateLayerForPoints(point, "down")}
                        disabled={point.keyframes.length == 0}
                      >
                        <ArrowDownward></ArrowDownward>
                      </IconButton>
                    </ButtonGroup>
                    <div style={{ flex: 1 }}></div>
                    <ButtonGroup>
                      <IconButton
                        color={point.visible ? "success" : "error"}
                        onClick={() => togglePointVisibility(point)}
                      >
                        {point.visible ? (
                          <Visibility></Visibility>
                        ) : (
                          <VisibilityOff></VisibilityOff>
                        )}
                      </IconButton>
                      <IconButton
                        color="info"
                        onClick={() => {
                          setSelectedPointId(point.id);
                          //to open the modal
                          setModal("object-bank");
                        }}
                      >
                        <ModeEditOutlineTwoTone />
                      </IconButton>
                      {/* <Divider orientation="vertical" variant="middle" flexItem /> */}
                      <IconButton
                        color="error"
                        onClick={() => {
                          removePointHandler(point.id);
                        }}
                      >
                        <RemoveCircleOutlineTwoTone />
                      </IconButton>
                    </ButtonGroup>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
export default Points;
