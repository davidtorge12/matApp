import { useState } from "react";
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
  Typography,
} from "@mui/material";
import type { ColumnVisibility, MaterialColumnId } from "../materialColumns";
import { formatMoney, lineTotal } from "../money";
import {
  formatNumericInput,
  parseNumericInput,
  sanitizeNumericInput,
} from "../numericInput";
import { parseMaterialLine, parseQuantityPrefix } from "../parseMaterials";
import { MaterialsType } from "../types";
import { visuallyHidden } from "./visuallyHidden";

const COLUMN_WIDTHS: Record<MaterialColumnId, string> = {
  sorting: "28px",
  quantity: "52px",
  price: "80px",
  lineTotal: "72px",
  delete: "36px",
};

/**
 * One row per material. Optional columns drop out of the template so the name
 * field receives the leftover width — the same grid on phone and desktop.
 */
export function rowGridSx(visibility: ColumnVisibility) {
  const columns = [
    visibility.sorting ? COLUMN_WIDTHS.sorting : null,
    "minmax(0, 1fr)",
    visibility.quantity ? COLUMN_WIDTHS.quantity : null,
    visibility.price ? COLUMN_WIDTHS.price : null,
    visibility.lineTotal ? COLUMN_WIDTHS.lineTotal : null,
    visibility.delete ? COLUMN_WIDTHS.delete : null,
  ].filter((column): column is string => column !== null);

  return {
    display: "grid",
    gridTemplateColumns: columns.join(" "),
    columnGap: 0.75,
    alignItems: "center",
  } as const;
}

const numberInputSx = { fontVariantNumeric: "tabular-nums" } as const;

export default function SortableMaterialRow({
  id,
  material,
  price,
  units,
  visibility,
  setAllMaterials,
  onSavePrice,
  onMaterialBlur,
}: {
  id: string;
  material: string;
  price: number;
  units: number;
  visibility: ColumnVisibility;
  setAllMaterials: (
    value: MaterialsType[] | ((prev: MaterialsType[]) => MaterialsType[]),
  ) => void;
  onSavePrice: (material: string, price: number) => void;
  /**
   * Called when the name field loses focus. The duplicate check lives in the
   * parent because it needs the whole list, and doing it here — inside a state
   * updater, reading the result back afterwards — meant the "already exists"
   * message was read before the updater had run, so it never appeared.
   */
  onMaterialBlur: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

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
    // Only an explicit "12x " prefix sets the quantity. Reading a bare name as
    // one unit meant that editing the name of a row whose quantity had been set
    // to 6 silently reset it to 1 on the next keystroke.
    const quantity = parseQuantityPrefix(value);
    updateRow(
      quantity ? { material: value, units: quantity.units } : { material: value },
    );
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
    // A null draft means the field was never typed into, so tabbing through the
    // list no longer posts an unchanged price for every row it passes.
    const edited = priceDraft !== null;
    setPriceDraft(null);
    if (edited) {
      onSavePrice(parseMaterialLine(material)?.name || material, price);
    }
  };

  const materialFieldProps = {
    value: material,
    onChange: (e: { target: { value: string } }) =>
      onMaterialChange(e.target.value),
    onBlur: () => onMaterialBlur(id),
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
      // A text input with a decimal hint gives the numeric keypad and, unlike
      // type="number", reports partially typed decimals back verbatim.
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

  return (
    <Box
      ref={setNodeRef}
      sx={{
        ...rowGridSx(visibility),
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1 : 0,
        position: "relative",
      }}
    >
      {visibility.sorting ? (
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
      ) : null}
      <TextField {...materialFieldProps} variant="standard" />
      {visibility.quantity ? (
        <TextField
          {...unitsFieldProps}
          variant="standard"
          onFocus={(e) => e.target.select()}
          sx={{ "& input": numberInputSx }}
        />
      ) : null}
      {visibility.price ? (
        <TextField
          {...priceFieldProps}
          variant="standard"
          onFocus={(e) => e.target.select()}
          InputProps={{
            startAdornment: <InputAdornment position="start">£</InputAdornment>,
          }}
          sx={{ "& input": numberInputSx }}
        />
      ) : null}
      {visibility.lineTotal ? (
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
          {formatMoney(lineTotal(price, units))}
        </Typography>
      ) : null}
      {visibility.delete ? (
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
      ) : null}
    </Box>
  );
}
