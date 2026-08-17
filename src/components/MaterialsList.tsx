import { useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import SwapVertIcon from "@mui/icons-material/SwapVert";
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
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TableSortLabel,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { buildCopyText } from "./CopyButton";
import SortableMaterialRow, { rowGridSx } from "./SortableMaterialRow";
import { moveMaterial } from "../moveMaterial";
import { reorderMaterials } from "../reorderMaterials";
import {
  MaterialSort,
  MaterialSortKey,
  nextMaterialSort,
  sortMaterials,
} from "../sortMaterials";
import { MaterialsType } from "../types";

const sortLabelSx = {
  fontSize: "0.8125rem",
  color: "text.secondary",
  "&.Mui-active": { color: "text.primary" },
  "& .MuiTableSortLabel-icon": { fontSize: 14 },
} as const;

const SORT_OPTIONS: { key: MaterialSortKey; label: string }[] = [
  { key: "material", label: "Material" },
  { key: "units", label: "Quantity" },
  { key: "price", label: "Unit price" },
];

function directionLabel(direction: MaterialSort["direction"]): string {
  return direction === "asc" ? "ascending" : "descending";
}

function SortHeader({
  label,
  column,
  sort,
  onSort,
  name,
}: {
  label: string;
  column: MaterialSortKey;
  sort: MaterialSort | null;
  onSort: (key: MaterialSortKey) => void;
  name: string;
}) {
  const active = sort?.key === column;
  return (
    <TableSortLabel
      active={active}
      direction={active ? sort.direction : "asc"}
      onClick={() => onSort(column)}
      // The list is a CSS grid rather than a table, so there is no
      // `aria-sort` to carry the state; it goes in the name instead.
      aria-label={
        active
          ? `Sort by ${name}, currently ${directionLabel(sort.direction)}`
          : `Sort by ${name}`
      }
      sx={sortLabelSx}
    >
      {label}
    </TableSortLabel>
  );
}

function MaterialsListSkeleton({
  rows,
  compact,
}: {
  rows: number;
  compact: boolean;
}) {
  return (
    <Box aria-busy="true" aria-label="Loading materials">
      {Array.from({ length: rows }, (_, i) =>
        compact ? (
          <Skeleton
            key={i}
            variant="rectangular"
            height={96}
            sx={{ borderRadius: 2, mb: 1 }}
          />
        ) : (
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
        ),
      )}
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
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const [toast, setToast] = useState("");
  const [sort, setSort] = useState<MaterialSort | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // MouseSensor and TouchSensor rather than PointerSensor: touch needs a short
  // press before a drag starts, otherwise the gesture competes with scrolling.
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeMaterial = allMaterials.find((m) => m.id === activeId) ?? null;

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

  const handleMove = (id: string, offset: number) => {
    setSort(null);
    setAllMaterials((prev) => moveMaterial(prev, id, offset));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeDragId = String(active.id);
    const overId = String(over.id);
    if (activeDragId === overId) {
      return;
    }
    setSort(null);
    setAllMaterials((prev) => reorderMaterials(prev, activeDragId, overId));
  };

  const addMaterial = () => {
    setSort(null);
    setAllMaterials([
      ...allMaterials,
      { id: uuidv4(), material: "", price: 0, units: 0 },
    ]);
  };

  const totalLabel = `Total £${total.toFixed(2)}`;

  const copyButtons = (
    <ButtonGroup
      variant="outlined"
      // The wide layout shares a 480px sidebar with the total, so it keeps the
      // denser buttons; the phone bar has the full width to itself.
      size={compact ? "medium" : "small"}
      fullWidth={compact}
      disabled={!allMaterials.length}
      sx={{ "& .MuiButton-root": { whiteSpace: "nowrap" } }}
    >
      <Button onClick={() => copy(false)}>Copy list</Button>
      <Button onClick={() => copy(true)}>Copy with price</Button>
    </ButtonGroup>
  );

  // Labelled on touch, where a tooltip never shows; icon-only on the wide
  // layout, where the label would not fit next to the total.
  const addButton = compact ? (
    <Button
      startIcon={<AddIcon />}
      onClick={addMaterial}
      sx={{ whiteSpace: "nowrap" }}
    >
      Add material
    </Button>
  ) : (
    <Tooltip title="Add material">
      <IconButton aria-label="Add material" onClick={addMaterial}>
        <AddIcon color="primary" />
      </IconButton>
    </Tooltip>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        height: { md: "100%" },
        display: "flex",
        flexDirection: "column",
        // Card clips by default, which would stop the actions bar sticking to
        // the bottom of the viewport on a phone.
        overflow: { xs: "visible", md: "hidden" },
      }}
    >
      <CardHeader
        title="Materials"
        subheader={address.trim() || undefined}
        titleTypographyProps={{ variant: "h6", component: "h1" }}
        subheaderTypographyProps={{ sx: { whiteSpace: "pre-line" } }}
        action={
          compact && allMaterials.length ? (
            <Button
              startIcon={<SwapVertIcon />}
              onClick={(e) => setSortAnchor(e.currentTarget)}
              aria-haspopup="true"
              aria-expanded={Boolean(sortAnchor)}
            >
              Sort
            </Button>
          ) : null
        }
      />
      <CardContent
        sx={{
          pt: 0,
          px: { xs: 1, sm: 2 },
          flex: 1,
          overflow: { md: "auto" },
          // Stops a scroll gesture inside the list from chaining to the page.
          overscrollBehavior: "contain",
        }}
      >
        {loading && !allMaterials.length ? (
          <MaterialsListSkeleton rows={skeletonCount} compact={compact} />
        ) : !allMaterials.length ? (
          <Typography color="text.secondary">
            No materials on this page. Upload a job file or add one below.
          </Typography>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext
              items={allMaterials.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack spacing={compact ? 1 : 0.5}>
                {compact ? null : (
                  <Box sx={rowGridSx}>
                    <span />
                    <SortHeader
                      label="Material"
                      column="material"
                      sort={sort}
                      onSort={handleSort}
                      name="material"
                    />
                    <SortHeader
                      label="Qty"
                      column="units"
                      sort={sort}
                      onSort={handleSort}
                      name="quantity"
                    />
                    <SortHeader
                      label="Unit £"
                      column="price"
                      sort={sort}
                      onSort={handleSort}
                      name="unit price"
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textAlign: "right", pr: 0.5 }}
                    >
                      Line
                    </Typography>
                    <span />
                  </Box>
                )}
                {allMaterials.map(
                  ({ id, material, price, units }: MaterialsType, index) => (
                    <SortableMaterialRow
                      key={id}
                      id={id}
                      material={material}
                      price={price}
                      units={units}
                      compact={compact}
                      canMoveUp={index > 0}
                      canMoveDown={index < allMaterials.length - 1}
                      setAllMaterials={setAllMaterials}
                      onSavePrice={onSavePrice}
                      onMove={handleMove}
                      onMerged={(name) =>
                        setToast(`${name} already exists. Quantity increased.`)
                      }
                    />
                  ),
                )}
              </Stack>
            </SortableContext>
            {/* Without an overlay the dragged row only fades, which is hard to
                track when a finger is covering it. */}
            <DragOverlay>
              {activeMaterial ? (
                <Paper
                  elevation={8}
                  sx={{
                    px: 1.5,
                    py: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography noWrap sx={{ flex: 1, fontWeight: 600 }}>
                    {activeMaterial.material || "New material"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {`${activeMaterial.units} × £${activeMaterial.price}`}
                  </Typography>
                </Paper>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </CardContent>
      <CardActions
        disableSpacing
        sx={{
          px: 2,
          pt: 1,
          flexShrink: 0,
          gap: 1,
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          // The running total and the copy actions are the point of the screen,
          // so on a phone they stay pinned instead of scrolling away.
          position: { xs: "sticky", md: "static" },
          bottom: 0,
          zIndex: 2,
          bgcolor: "background.paper",
          borderTop: { xs: 1, md: 0 },
          borderColor: "divider",
          pb: {
            xs: "calc(16px + env(safe-area-inset-bottom))",
            md: 2,
          },
        }}
      >
        {compact ? (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
              >
                {totalLabel}
              </Typography>
              {addButton}
            </Box>
            {copyButtons}
          </>
        ) : (
          <>
            <Stack direction="row" spacing={1} alignItems="center">
              {addButton}
              {copyButtons}
            </Stack>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
            >
              {totalLabel}
            </Typography>
          </>
        )}
      </CardActions>
      <Menu
        anchorEl={sortAnchor}
        open={Boolean(sortAnchor)}
        onClose={() => setSortAnchor(null)}
      >
        {SORT_OPTIONS.map(({ key, label }) => {
          const active = sort?.key === key;
          return (
            <MenuItem
              key={key}
              selected={active}
              onClick={() => {
                handleSort(key);
                setSortAnchor(null);
              }}
            >
              {/* The icon slot is always present so the labels do not shift
                  when the active option changes. */}
              <ListItemIcon sx={{ minWidth: 36 }}>
                {active ? <CheckIcon fontSize="small" /> : null}
              </ListItemIcon>
              <ListItemText
                primary={label}
                secondary={active ? directionLabel(sort.direction) : undefined}
              />
            </MenuItem>
          );
        })}
      </Menu>
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
        // Bottom centre: clear of the sticky app bar and nearer the thumb.
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: "env(safe-area-inset-bottom)" }}
      />
    </Card>
  );
}
