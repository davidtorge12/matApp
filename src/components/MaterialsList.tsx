import { useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import AddIcon from "@mui/icons-material/Add";
import { v4 as uuidv4 } from "uuid";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  Skeleton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { buildCopyText } from "./CopyButton";
import SortableMaterialRow, { rowGridSx } from "./SortableMaterialRow";
import { reorderMaterials } from "../reorderMaterials";
import { MaterialsType } from "../types";

function MaterialsListSkeleton({ rows }: { rows: number }) {
  return (
    <Box aria-busy="true" aria-label="Loading materials">
      {Array.from({ length: rows }, (_, i) => (
        <Box key={i} sx={{ ...rowGridSx, mb: 0.75 }}>
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton
            variant="rectangular"
            height={28}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={28}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={28}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={28}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton variant="circular" width={28} height={28} />
        </Box>
      ))}
    </Box>
  );
}

export default function MaterialsList({
  address,
  allMaterials,
  setAllMaterials,
  total,
  onSavePrice,
  loading = false,
  skeletonCount = 8,
}: {
  address: string;
  allMaterials: MaterialsType[];
  setAllMaterials: (
    value: MaterialsType[] | ((prev: MaterialsType[]) => MaterialsType[]),
  ) => void;
  total: number;
  onSavePrice: (material: string, price: string) => void;
  loading?: boolean;
  skeletonCount?: number;
}) {
  const [toast, setToast] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const copy = (withPrice: boolean) => {
    void navigator.clipboard.writeText(
      buildCopyText({
        address,
        materials: allMaterials.map((m) => m.material),
        units: allMaterials.map((m) => m.units),
        ...(withPrice
          ? {
              prices: allMaterials.map((m) => m.price),
              total,
            }
          : {}),
      }),
    );
    setToast("Copied");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }
    setAllMaterials((prev) =>
      reorderMaterials(prev, String(active.id), String(over.id)),
    );
  };

  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        height: { md: "100%" },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardHeader
        title="Materials"
        subheader={address.trim() || undefined}
        titleTypographyProps={{ variant: "h6" }}
        subheaderTypographyProps={{ sx: { whiteSpace: "pre-line" } }}
      />
      <CardContent sx={{ pt: 0, flex: 1, overflow: "auto" }}>
        {loading && !allMaterials.length ? (
          <MaterialsListSkeleton rows={skeletonCount} />
        ) : !allMaterials.length ? (
          <Typography color="text.secondary">
            No materials on this page.
          </Typography>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={allMaterials.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack spacing={0.5}>
                <Box sx={rowGridSx}>
                  <span />
                  <Typography variant="caption" color="text.secondary">
                    Material
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Qty
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Unit £
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Line
                  </Typography>
                  <span />
                </Box>
                {allMaterials.map(
                  ({ id, material, price, units }: MaterialsType) => (
                    <SortableMaterialRow
                      key={id}
                      id={id}
                      material={material}
                      price={price}
                      units={units}
                      setAllMaterials={setAllMaterials}
                      onSavePrice={onSavePrice}
                      onMerged={(name) =>
                        setToast(
                          `${name} already exists. Quantity increased.`,
                        )
                      }
                    />
                  ),
                )}
              </Stack>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
      <CardActions
        sx={{ px: 2, pb: 2, justifyContent: "space-between", flexShrink: 0 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Add material">
            <IconButton
              aria-label="Add material"
              onClick={() =>
                setAllMaterials([
                  ...allMaterials,
                  {
                    id: uuidv4(),
                    material: "",
                    price: 0,
                    units: 0,
                  },
                ])
              }
            >
              <AddIcon color="primary" />
            </IconButton>
          </Tooltip>
          <ButtonGroup
            variant="outlined"
            size="small"
            disabled={!allMaterials.length}
          >
            <Button onClick={() => copy(false)}>Copy list</Button>
            <Button onClick={() => copy(true)}>Copy with price</Button>
          </ButtonGroup>
        </Stack>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
        >
          Total £{total.toFixed(2)}
        </Typography>
      </CardActions>
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </Card>
  );
}
