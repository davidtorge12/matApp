import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
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
  InputAdornment,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { buildCopyText } from "./CopyButton";
import { parseMaterialLine } from "../parseMaterials";
import { MaterialsType } from "../types";

const rowGridSx = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 52px 76px 72px 32px",
  columnGap: 0.75,
  alignItems: "center",
} as const;

function MaterialsListSkeleton({ rows }: { rows: number }) {
  return (
    <Box aria-busy="true" aria-label="Loading materials">
      {Array.from({ length: rows }, (_, i) => (
        <Box key={i} sx={{ ...rowGridSx, mb: 0.75 }}>
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
  const [copied, setCopied] = useState(false);

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
    setCopied(true);
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
          <Stack spacing={0.5}>
            <Box sx={rowGridSx}>
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
                <Box key={id} sx={rowGridSx}>
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
                        setAllMaterials(allMaterials.filter((m) => m.id !== id))
                      }
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ),
            )}
          </Stack>
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
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Copied"
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </Card>
  );
}
