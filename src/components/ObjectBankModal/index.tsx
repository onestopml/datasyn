import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  ImageList,
  ImageListItem,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { useKeycloak } from "@react-keycloak/ssr";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  fetchObjectBankItems,
  fetchObjectBankList,
  fetchObjectBankSummaryById,
} from "../../api/renex";
import { useObjectBankStore } from "../../stores/objectBank";
import { useProjectStore } from "../../stores/project";
import { basePath, filePathPrefix, http } from "../../utils/constants";
import { toDataURL } from "../../utils/toDataUrl";
import { usePointDataMutation } from "../../utils/usePointDataMutation";
interface IObjectBank {
  id: string;
  name: string;
}
interface IObjectBankClasses {
  class_id: string;
  class_name: string;
}
interface IObjectClassItem {
  object_id: string;
  object_filepath: string;
  class_name: string;
}
export const ObjectBankModal = () => {
  const queryClient = useQueryClient();
  const modalName = useProjectStore((state) => state.modal);
  const selectedPoint = useProjectStore(
    (state) => state.computed.selectedPoint
  );

  const selectedGalleryId = useObjectBankStore(
    (state) => state.selectedGalleryId
  );
  const setSelectedGalleryId = useObjectBankStore(
    (state) => state.setSelectedGalleryId
  );
  const { keycloak } = useKeycloak();
  const token = keycloak.token;
  const open = modalName == "object-bank";
  const setModal = useProjectStore((state) => state.setModal);
  const [selectedObjectId, setSelectedObjectId] = useState(
    selectedPoint?.object_id ?? ""
  );
  const [objectClass, setObjectClass] = useState(
    selectedPoint?.object_class ?? "cat"
  );
  const objectBankClasses = useQuery(
    [`/objects/${selectedGalleryId}/summary`],
    () => fetchObjectBankSummaryById(selectedGalleryId, token),
    {
      enabled: selectedGalleryId != "",
    }
  );
  const objectClassItems = useQuery(
    [`/objects/${selectedGalleryId}/list`, objectClass, selectedGalleryId],
    () => fetchObjectBankItems(objectClass, selectedGalleryId, token),
    {
      enabled: selectedGalleryId != "",
    }
  );

  const ObjectBankLists = useQuery(["/objects"], () =>
    fetchObjectBankList(token)
  );
  const handleChange = (event: SelectChangeEvent) => {
    setObjectClass(event.target.value as string);
  };
  const handleObjectBankChange = (event: SelectChangeEvent) => {
    setSelectedGalleryId(event.target.value as string);
  };

  const changePointData = usePointDataMutation();
  const handleItemSelect = (object_id: string) => {
    setSelectedObjectId(object_id);
  };
  const onSave = async (
    gallery_id: string,
    object_class: string,
    object_id: string
  ) => {
    //call api and update the point data
    if (!selectedPoint) {
      return false;
    }
    const theItemFromObjectBank = objectClassItems.data?.find(
      (el) => el.object_id == object_id
    );
    if (!theItemFromObjectBank) {
      return false;
    }
    const dataImageThumbnail = await toDataURL(
      `${http}${filePathPrefix}${theItemFromObjectBank.object_filepath}`
    );
    //use jimp here to merge the mask
    return changePointData.mutate(
      {
        type: "update",
        data: {
          id: selectedPoint.id,
          object_class,
          object_id,
          gallery_id,
          thumbnail_blob: dataImageThumbnail,
        },
      },
      {
        async onSuccess() {
          await queryClient.invalidateQueries(["/project/points"]);
          handleClose();
        },
      }
    );
  };
  const handleClose = useCallback(() => {
    setModal("");
  }, [setModal]);
  // if (!objectBankClasses.data || !Array.isArray(objectBankClasses.data)) {
  //   return <div></div>;
  // }
  // if (!objectBankClasses.isSuccess) {
  //   return <div></div>;
  // }
  const objectBankOpen = selectedGalleryId != "";
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
    >
      <DialogTitle id="alert-dialog-title">
        {"Object Configuration: "} {selectedPoint?.label}
      </DialogTitle>
      <DialogContent>
        <Box>
          <Typography fontSize={18} fontWeight={500}>
            Gallery
          </Typography>
          <Box sx={{ minWidth: 120 }} style={{ marginTop: "1rem" }}>
            <FormControl fullWidth>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                input={<OutlinedInput />}
                label="Class"
                onChange={handleObjectBankChange}
                displayEmpty={true}
                value={selectedGalleryId}
              >
                <MenuItem disabled value="">
                  <em>Please choose a gallery</em>
                </MenuItem>
                {ObjectBankLists.isFetching ? (
                  <Box style={{ display: "flex", marginTop: "1rem" }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  ObjectBankLists.data?.map((obj: IObjectBank) => (
                    <MenuItem key={obj?.id} value={obj.id}>
                      {obj?.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>
        </Box>
        {objectBankOpen ? (
          <>
            <Box style={{ marginTop: "1rem" }}>
              <Typography fontSize={18} fontWeight={500}>
                Choose class
              </Typography>
              <Box sx={{ minWidth: 120 }} style={{ marginTop: "1rem" }}>
                <FormControl fullWidth>
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    label="Class"
                    input={<OutlinedInput />}
                    value={objectClass}
                    onChange={handleChange}
                  >
                    {objectBankClasses.data?.map(
                      (cate: IObjectBankClasses, index: number) => (
                        <MenuItem value={cate.class_id} key={index}>
                          {cate.class_name}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box style={{ marginTop: "1rem" }}>
              <Box>
                <Typography fontSize={18} fontWeight={500}>
                  Select avatar
                </Typography>
                <Typography fontSize={12}>
                  Select 1 image to set avatar
                </Typography>
              </Box>
              {objectClassItems.isFetching ? (
                <Box style={{ display: "flex", marginTop: "1rem" }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ImageList
                  sx={{ width: "100%", height: "100%", maxHeight: "40rem" }}
                  cols={3}
                  // style={{ overflowY: "auto", overflowX: "hidden" }}
                >
                  {objectClassItems.data
                    ?.filter((el) => el.class_name == objectClass)
                    .map((item: IObjectClassItem) => (
                      <ImageListItem
                        key={item.object_id}
                        style={{
                          border:
                            item.object_id == selectedObjectId
                              ? "2px solid #f00"
                              : "2px solid transparent",
                        }}
                      >
                        <img
                          src={`${http}${filePathPrefix}${item.object_filepath}`}
                          alt={item.class_name}
                          onClick={() => handleItemSelect(item.object_id)}
                          loading="lazy"
                          style={{ objectFit: "contain" }}
                        />
                      </ImageListItem>
                    )) ?? []}
                </ImageList>
              )}
            </Box>
          </>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="error">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onSave(selectedGalleryId, objectClass, selectedObjectId);
          }}
          autoFocus
        >
          {!changePointData.isLoading ? "OK" : "Saving..."}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
