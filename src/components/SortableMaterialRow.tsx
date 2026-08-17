import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ClearIcon from "@mui/icons-material/Clear";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { mergeDuplicateMaterial } from "../mergeDuplicateMaterial";
import {
  formatNumericInput,
  parseNumericInput,
  sanitizeNumericInput,
} from "../numericInput";
import { parseMaterialLine } from "../parseMaterials";
import { MaterialsType } from "../types";
import { visuallyHidden } from "./visuallyHidden";

/**
 * Wide layout: one row per material. The fixed columns total ~298px, which
 * leaves the name roughly 150px inside the 480px sidebar. Below `sm` the row
 * reflows into the two-line card built by `CompactLayout`, because those same
 * fixed columns left the name only ~36px on a phone.
 */
export const rowGridSx = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr) 52px 80px 72px 36px",
  columnGap: 0.75,
  alignItems: "center",
} as const;

/** Secondary controls: above the 24px WCAG floor, tighter than the 44px default. */
const reorderButtonSx = {
  minWidth: 36,
  minHeight: 36,
  width: 36,
  height: 36,
} as const;

const numberInputSx = { fontVariantNumeric: "tabular-nums" } as const;

function lineTotal(price: number, units: number): string {
  return `£${(price * units).toFixed(2)}`;
}

export default function SortableMaterialRow({
  id,
  material,
  price,
  units,
  compact = false,
  canMoveUp = false,
  canMoveDown = false,
  setAllMaterials,
  onSavePrice,
  onMerged,
  onMove,
}: {
  id: string;
  material: string;
  price: number;
  units: number;
  /** Renders the two-line phone layout instead of the wide grid row. */
  compact?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  setAllMaterials: (
    value: MaterialsType[] | ((prev: MaterialsType[]) => MaterialsType[]),
  ) => void;
  onSavePrice: (material: string, price: string) => void;
  onMerged: (name: string) => void;
  onMove?: (id: string, offset: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Numeric fields keep the raw typed text while focused. Committing straight
  // to a number would drop a trailing decimal point and snap the field to 0
  // before the fraction digits could be typed.
  const [unitsDraft, setUnitsDraft] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<string | null>(null);

  const name = material.trim();
  const rowName = name || "new material";

  const updateRow = (patch: Partial<MaterialsType>) => {
    setAllMaterials((prev) =>
      prev.map((m: MaterialsType) => (m.id === id ? { ...m, ...patch } : m)),
    );
  };

  const onMaterialChange = (value: string) => {
    const parsed = parseMaterialLine(value);
    updateRow({ material: value, units: parsed?.units || 1 });
  };

  const onMaterialBlur = () => {
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
  };

  const onUnitsChange = (raw: string) => {
    const draft = sanitizeNumericInput(raw);
    setUnitsDraft(draft);
    updateRow({ units: parseNumericInput(draft) });
  };

  const onPriceChange = (raw: string) => {
    const draft = sanitizeNumericInput(raw);
    setPriceDraft(draft);
    updateRow({ price: parseNumericInput(draft) });
  };

  const onPriceBlur = () => {
    setPriceDraft(null);
    const parsed = parseMaterialLine(material);
    onSavePrice(parsed?.name || material, price.toString());
  };

  // Shared field props, so the wide and compact layouts cannot drift apart.
  const materialFieldProps = {
    value: material,
    onChange: (e: { target: { value: string } }) =>
      onMaterialChange(e.target.value),
    onBlur: onMaterialBlur,
    inputProps: {
      "aria-label": "Material name",
      // Autocorrect mangles trade terms and sizes such as "PTFE" or "25kg".
      autoCorrect: "off",
      spellCheck: false,
    },
  };

  const unitsFieldProps = {
    value: unitsDraft ?? formatNumericInput(units),
    onChange: (e: { target: { value: string } }) => onUnitsChange(e.target.value),
    onBlur: () => setUnitsDraft(null),
    inputProps: {
      "aria-label": `Quantity for ${rowName}`,
      // A text input with a decimal hint gives the compact numeric keypad and,
      // unlike type="number", reports partially typed decimals back verbatim.
      inputMode: "decimal" as const,
      style: { textAlign: "right" as const },
    },
  };

  const priceFieldProps = {
    value: priceDraft ?? formatNumericInput(price),
    disabled: !material,
    onChange: (e: { target: { value: string } }) => onPriceChange(e.target.value),
    onBlur: onPriceBlur,
    inputProps: {
      "aria-label": `Unit price for ${rowName}`,
      inputMode: "decimal" as const,
      style: { textAlign: "right" as const },
    },
  };

  const removeButton = (
    <Tooltip title="Remove">
      <IconButton
        aria-label={`Remove ${rowName}`}
        onClick={() =>
          setAllMaterials((prev) => prev.filter((m) => m.id !== id))
        }
      >
        <ClearIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  if (compact) {
    return (
      <Box
        ref={setNodeRef}
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gridTemplateAreas: `"name actions" "fields fields"`,
          columnGap: 0.5,
          rowGap: 1,
          alignItems: "center",
          p: 1,
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <TextField
          {...materialFieldProps}
          placeholder="Material"
          fullWidth
          sx={{ gridArea: "name" }}
        />
        <Box
          sx={{ gridArea: "actions", display: "flex", alignItems: "center" }}
        >
          {/* Up/down replace drag on the phone: dragging inside a scrolling
              list is unreliable by touch and unreachable for screen readers. */}
          <IconButton
            aria-label={`Move ${rowName} up`}
            disabled={!canMoveUp}
            onClick={() => onMove?.(id, -1)}
            sx={reorderButtonSx}
          >
            <ArrowUpwardIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={`Move ${rowName} down`}
            disabled={!canMoveDown}
            onClick={() => onMove?.(id, 1)}
            sx={reorderButtonSx}
          >
            <ArrowDownwardIcon fontSize="small" />
          </IconButton>
          {removeButton}
        </Box>
        <Box
          sx={{
            gridArea: "fields",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <TextField
            {...unitsFieldProps}
            label="Qty"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 72, "& input": numberInputSx }}
          />
          <TextField
            {...priceFieldProps}
            label="Unit £"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: <InputAdornment position="start">£</InputAdornment>,
            }}
            sx={{ width: 108, "& input": numberInputSx }}
          />
          <Typography
            sx={{
              flex: 1,
              minWidth: 64,
              textAlign: "right",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <Box component="span" sx={visuallyHidden}>
              {`Line total for ${rowName}: `}
            </Box>
            {lineTotal(price, units)}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      ref={setNodeRef}
      sx={{
        ...rowGridSx,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1 : 0,
        position: "relative",
      }}
    >
      <Tooltip title="Drag to reorder">
        <Box
          component="button"
          type="button"
          aria-label={`Reorder ${rowName}`}
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
      <TextField {...materialFieldProps} variant="standard" />
      <TextField
        {...unitsFieldProps}
        variant="standard"
        onFocus={(e) => e.target.select()}
        sx={{ "& input": numberInputSx }}
      />
      <TextField
        {...priceFieldProps}
        variant="standard"
        onFocus={(e) => e.target.select()}
        InputProps={{
          startAdornment: <InputAdornment position="start">£</InputAdornment>,
        }}
        sx={{ "& input": numberInputSx }}
      />
      {/* Plain text, not a read-only input: an input here looked editable and
          added a dead tab stop. */}
      <Typography
        variant="body2"
        sx={{
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          pr: 0.5,
        }}
      >
        <Box component="span" sx={visuallyHidden}>
          {`Line total for ${rowName}: `}
        </Box>
        {lineTotal(price, units)}
      </Typography>
      {removeButton}
    </Box>
  );
}
