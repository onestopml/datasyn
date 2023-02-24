import { Box, Grid } from "@mui/material";
import { useWindowSize } from "usehooks-ts";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useProjectStore } from "../../stores/project";
import { Minimap } from "../VideoPreview/Minimap";
import Adjust from "./Adjust";
import Information from "./Information";
import Keyframes from "./Keyframes";
import Points from "./Points";
import { usePanelStore } from "../../stores/panel";
import { useCallback } from "react";
const reorder = (list: any, startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};
const SidePanel = () => {
  const size = useWindowSize();
  const gridSize = size.height - 100;
  const projectData = useProjectStore((state) => state.project);
  const sections = usePanelStore((state) => state.sections);
  const setSection = usePanelStore((state) => state.setSection);

  const onDragEnd = useCallback(
    (result: any) => {
      if (!result.destination) {
        return;
      }
      const items: any = reorder(
        sections,
        result.source.index,
        result.destination.index
      );
      setSection(items);
    },
    [sections, setSection]
  );
  const renderSections = useCallback((name: string) => {
    if (name == "information") {
      return <Information />;
    } else if (name == "points") {
      return <Points />;
    } else if (name == "keyframes") {
      return <Keyframes />;
    } else if (name == "adjust") {
      return <Adjust />;
    } else {
      return "";
    }
  }, []);
  if (projectData.id == -1) {
    return null;
  }
  return (
    <Grid
      item
      xs={4}
      style={{
        height: `${gridSize}px`,
        overflowY: "scroll",
        marginTop: "1.5rem",
        borderLeftColor: "#ccc",
        borderLeftWidth: 1,
        borderLeftStyle: "solid",
      }}
    >
      <Minimap />
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided, snapshot) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {sections.map((section, index) => (
                <Draggable
                  draggableId={section.id}
                  index={index}
                  key={section.id}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      {renderSections(section.name)}
                    </div>
                  )}
                </Draggable>
              ))}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {/* <PositionCropping /> */}
      {/* <PointInformation /> */}
    </Grid>
  );
};

export default SidePanel;
