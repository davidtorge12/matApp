import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ClearIcon from "@mui/icons-material/Clear";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
} from "@mui/material";
import { mergeDuplicateMaterial } from "../mergeDuplicateMaterial";
import { parseMaterialLine } from "../parseMaterials";
import { MaterialsType } from "../types";

export const rowGridSx = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr) 52px 76px 72px 32px",
  columnGap: 0.75,
  alignItems: "center",
} as const;

export default function SortableMaterialRow({
  id,
  material,
  price,
  units,
  setAllMaterials,
  onSavePrice,
  onMerged,
}: {
  id: string;
  material: string;
  price: number;
  units: number;
  setAllMaterials: (
    value: MaterialsType[] | ((prev: MaterialsType[]) => MaterialsType[]),
  ) => void;
  onSavePrice: (material: string, price: string) => void;
  onMerged: (name: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        ...rowGridSx,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 1 : 0,
        position: "relative",
      }}
    >
      <Tooltip title="Reorder">
        <Box
          component="button"
          type="button"
          aria-label="Reorder material"
          {...attributes}
          {...listeners}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            p: 0,
            border: 0,
            borderRadius: 1,
            background: "none",
            color: "text.secondary",
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>
      </Tooltip>
      <TextField
        value={material}
        variant="standard"
        onChange={(e) => {
          const mat = e.target.value;
          const parsed = parseMaterialLine(mat);
          setAllMaterials((prev) =>
            prev.map((m: MaterialsType) =>
              m.id === id
                ? {
                    ...m,
                    material: mat,
                    units: parsed?.units || 1,
                  }
                : m,
            ),
          );
        }}
        onBlur={() => {
          let mergedName: string | undefined;
          setAllMaterials((prev) => {
            const result = mergeDuplicateMaterial(prev, id);
            if (!result.merged) {
              return prev;
            }
            mergedName = result.name;
            return result.materials;
          });
          if (mergedName) {
            onMerged(mergedName);
          }
        }}
        size="small"
      />
      <TextField
        value={units}
        variant="standard"
        type="number"
        size="small"
        inputProps={{
          min: 0,
          step: 1,
          style: { textAlign: "right" },
        }}
        onChange={(e) => {
          setAllMaterials((prev) =>
            prev.map((m: MaterialsType) =>
              m.id === id
                ? { ...m, units: parseFloat(e.target.value) || 0 }
                : m,
            ),
          );
        }}
        onFocus={(e) => e.target.select()}
      />
      <TextField
        value={price}
        variant="standard"
        disabled={!material}
        type="number"
        size="small"
        inputProps={{
          min: 0,
          step: 0.1,
          style: { textAlign: "right" },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">£</InputAdornment>
          ),
        }}
        onChange={(e) => {
          setAllMaterials((prev) =>
            prev.map((m: MaterialsType) =>
              m.id === id
                ? { ...m, price: parseFloat(e.target.value) || 0 }
                : m,
            ),
          );
        }}
        onBlur={() => {
          const parsed = parseMaterialLine(material);
          onSavePrice(parsed?.name || material, price.toString());
        }}
        onFocus={(e) => e.target.select()}
      />
      <TextField
        value={`£${(price * units).toFixed(2)}`}
        variant="standard"
        size="small"
        InputProps={{ readOnly: true }}
        inputProps={{ style: { textAlign: "right" } }}
      />
      <Tooltip title="Remove">
        <IconButton
          aria-label="Remove material"
          onClick={() =>
            setAllMaterials((prev) => prev.filter((m) => m.id !== id))
          }
        >
          <ClearIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
