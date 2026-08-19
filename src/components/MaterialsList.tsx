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
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import SortableMaterialRow, { rowGridSx } from "./SortableMaterialRow";
import { buildCopyText } from "../copyText";
import { newId } from "../id";
import {
  MATERIAL_COLUMNS,
  readColumnVisibility,
  toggleColumn,
  writeColumnVisibility,
  type MaterialColumnId,
} from "../materialColumns";
import { mergeDuplicateMaterial } from "../mergeDuplicateMaterial";
import { formatMoney } from "../money";
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
  visibility,
}: {
  rows: number;
  visibility: ReturnType<typeof readColumnVisibility>;
}) {
  return (
    <Box aria-busy="true" aria-label="Loading materials">
      {Array.from({ length: rows }, (_, i) => (
        <Box key={i} sx={{ ...rowGridSx(visibility), mb: 0.75 }}>
          {visibility.sorting ? (
            <Skeleton variant="circular" width={28} height={28} />
          ) : null}
          <Skeleton variant="rectangular" height={28} sx={{ borderRadius: 1 }} />
          {visibility.quantity ? (
            <Skeleton variant="rectangular" height={28} sx={{ borderRadius: 1 }} />
          ) : null}
          {visibility.price ? (
            <Skeleton variant="rectangular" height={28} sx={{ borderRadius: 1 }} />
          ) : null}
          {visibility.lineTotal ? (
            <Skeleton variant="rectangular" height={28} sx={{ borderRadius: 1 }} />
          ) : null}
          {visibility.delete ? (
            <Skeleton variant="circular" width={28} height={28} />
          ) : null}
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
  materialNames = [],
}: {
  address: string;
  allMaterials: MaterialsType[];
  setAllMaterials: (
    value: MaterialsType[] | ((prev: MaterialsType[]) => MaterialsType[]),
  ) => void;
  total: number;
  onSavePrice: (material: string, price: number) => void;
  loading?: boolean;
  skeletonCount?: number;
  materialNames?: string[];
}) {
  const [toast, setToast] = useState("");
  const [sort, setSort] = useState<MaterialSort | null>(null);
  const [columnsAnchor, setColumnsAnchor] = useState<HTMLElement | null>(null);
  const [visibility, setVisibility] = useState(readColumnVisibility);
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
  const columnsOpen = Boolean(columnsAnchor);

  const copy = async (withPrices: boolean) => {
    try {
      await navigator.clipboard.writeText(
        buildCopyText(allMaterials, { address, withPrices }),
      );
      setToast("Copied");
    } catch {
      // Refused on a non-secure origin and in some in-app browsers; a button
      // that quietly does nothing is worse than saying so.
      setToast("Could not copy");
    }
  };

  const handleMaterialBlur = (rowId: string) => {
    const result = mergeDuplicateMaterial(allMaterials, rowId);
    if (result.merged) {
      setAllMaterials(result.materials);
      setToast(`${result.name} already exists. Quantity increased.`);
    }
  };

  const handleSort = (key: MaterialSortKey) => {
    const next = nextMaterialSort(sort, key);
    setSort(next);
    setAllMaterials((prev) => sortMaterials(prev, next.key, next.direction));
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
      { id: newId(), material: "", price: 0, units: 0 },
    ]);
  };

  const handleToggleColumn = (id: MaterialColumnId) => {
    const next = toggleColumn(visibility, id);
    setVisibility(next);
    writeColumnVisibility(next);
  };

  const totalLabel = `Total ${formatMoney(total)}`;

  const copyButtons = (
    <ButtonGroup
      variant="outlined"
      size="small"
      disabled={!allMaterials.length}
      sx={{
        "& .MuiButton-root": {
          whiteSpace: "nowrap",
          minHeight: "unset",
        },
      }}
    >
      <Button onClick={() => void copy(false)}>Copy list</Button>
      <Button onClick={() => void copy(true)}>Copy with price</Button>
    </ButtonGroup>
  );

  const addButton = (
    <Tooltip title="Add material">
      <IconButton
        aria-label="Add material"
        onClick={addMaterial}
        sx={{
          "&&": { minWidth: 40, minHeight: 40 },
        }}
      >
        <AddIcon color="primary" />
      </IconButton>
    </Tooltip>
  );

  const columnsMenu = (
    <>
      <Tooltip title="Columns">
        <IconButton
          aria-label="Columns"
          aria-haspopup="true"
          aria-expanded={columnsOpen ? true : undefined}
          onClick={(event) => setColumnsAnchor(event.currentTarget)}
          sx={{ "&&": { minWidth: 40, minHeight: 40 } }}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={columnsAnchor}
        open={columnsOpen}
        onClose={(_event, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            setColumnsAnchor(null);
          }
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <ListSubheader>Visible columns</ListSubheader>
        {MATERIAL_COLUMNS.map(({ id, label }) => (
          <MenuItem key={id} onClick={() => handleToggleColumn(id)}>
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={visibility[id]}
                tabIndex={-1}
                disableRipple
                inputProps={{ "aria-labelledby": `column-${id}` }}
              />
            </ListItemIcon>
            <ListItemText id={`column-${id}`}>{label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
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
        action={columnsMenu}
      />
      <CardContent
        sx={{
          pt: 0,
          px: 2,
          flex: 1,
          overflow: { md: "auto" },
          // Stops a scroll gesture inside the list from chaining to the page.
          overscrollBehavior: "contain",
        }}
      >
        {loading && !allMaterials.length ? (
          <MaterialsListSkeleton rows={skeletonCount} visibility={visibility} />
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
              <Stack spacing={0.5}>
                <Box sx={rowGridSx(visibility)}>
                  {visibility.sorting ? <span /> : null}
                  <SortHeader
                    label="Material"
                    column="material"
                    sort={sort}
                    onSort={handleSort}
                    name="material"
                  />
                  {visibility.quantity ? (
                    <SortHeader
                      label="Qty"
                      column="units"
                      sort={sort}
                      onSort={handleSort}
                      name="quantity"
                    />
                  ) : null}
                  {visibility.price ? (
                    <SortHeader
                      label="Unit £"
                      column="price"
                      sort={sort}
                      onSort={handleSort}
                      name="unit price"
                    />
                  ) : null}
                  {visibility.lineTotal ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textAlign: "right", pr: 0.5 }}
                    >
                      Line
                    </Typography>
                  ) : null}
                  {visibility.delete ? <span /> : null}
                </Box>
                {allMaterials.map(
                  ({ id, material, price, units }: MaterialsType) => (
                    <SortableMaterialRow
                      key={id}
                      id={id}
                      material={material}
                      price={price}
                      units={units}
                      visibility={visibility}
                      setAllMaterials={setAllMaterials}
                      onSavePrice={onSavePrice}
                      onMaterialBlur={handleMaterialBlur}
                      materialNames={materialNames}
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
                    {`${activeMaterial.units} × ${formatMoney(activeMaterial.price)}`}
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
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
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
        <Stack direction="row" spacing={1} alignItems="center">
          {addButton}
          {copyButtons}
        </Stack>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {totalLabel}
        </Typography>
      </CardActions>
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
