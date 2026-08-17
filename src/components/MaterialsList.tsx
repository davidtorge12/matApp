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
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import { buildCopyText } from "./CopyButton";
import SortableMaterialRow, { rowGridSx } from "./SortableMaterialRow";
import { reorderMaterials } from "../reorderMaterials";
import {
  MaterialSort,
  MaterialSortKey,
  nextMaterialSort,
  sortMaterials,
} from "../sortMaterials";
import { MaterialsType } from "../types";

const sortLabelSx = {
  fontSize: "0.75rem",
  color: "text.secondary",
  "&.Mui-active": { color: "text.primary" },
  "& .MuiTableSortLabel-icon": { fontSize: 14 },
} as const;

function SortHeader({
  label,
  column,
  sort,
  onSort,
  ariaLabel,
}: {
  label: string;
  column: MaterialSortKey;
  sort: MaterialSort | null;
  onSort: (key: MaterialSortKey) => void;
  ariaLabel: string;
}) {
  const active = sort?.key === column;
  return (
    <TableSortLabel
      active={active}
      direction={active ? sort.direction : "asc"}
      onClick={() => onSort(column)}
      aria-label={ariaLabel}
      sx={sortLabelSx}
    >
      {label}
    </TableSortLabel>
  );
}

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
  const [sort, setSort] = useState<MaterialSort | null>(null);
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

  const handleSort = (key: MaterialSortKey) => {
    const next = nextMaterialSort(sort, key);
    setSort(next);
    setAllMaterials((prev) => sortMaterials(prev, next.key, next.direction));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) {
      return;
    }
    setSort(null);
    setAllMaterials((prev) => reorderMaterials(prev, activeId, overId));
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
                  <SortHeader
                    label="Material"
                    column="material"
                    sort={sort}
                    onSort={handleSort}
                    ariaLabel="Sort by material"
                  />
                  <SortHeader
                    label="Qty"
                    column="units"
                    sort={sort}
                    onSort={handleSort}
                    ariaLabel="Sort by quantity"
                  />
                  <SortHeader
                    label="Unit £"
                    column="price"
                    sort={sort}
                    onSort={handleSort}
                    ariaLabel="Sort by unit price"
                  />
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
              onClick={() => {
                setSort(null);
                setAllMaterials([
                  ...allMaterials,
                  {
                    id: uuidv4(),
                    material: "",
                    price: 0,
                    units: 0,
                  },
                ]);
              }}
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
