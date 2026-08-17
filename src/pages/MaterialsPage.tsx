import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import AppBarActions from "../components/AppBarActions";
import CodesTable from "../components/CodesTable";
import MaterialsList from "../components/MaterialsList";
import UploadButton from "../components/UploadButton";
import { getLatestCodes, getMaterialPrices, setMaterialPrice } from "../api";
import { newId } from "../id";
import { materialsTotal } from "../money";
import { aggregateMaterials } from "../parseMaterials";
import { CodeType, MaterialsType } from "../types";

/** Rows of skeleton to show before the real material count is known. */
const DEFAULT_SKELETON_ROWS = 8;

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function MaterialsPage() {
  const [data, setData] = useState<CodeType[]>([]);
  const [allMaterials, setAllMaterials] = useState<MaterialsType[]>([]);
  const [address, setAddress] = useState("");
  const [codesLoading, setCodesLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [codesTotal, setCodesTotal] = useState(0);
  const [source, setSource] = useState<"latest" | "upload">("latest");

  const savePrice = async (material: string, price: number) => {
    try {
      await setMaterialPrice(material, price);
    } catch (err) {
      setError(messageFrom(err, "Failed to save price"));
    }
  };

  /**
   * Every material on the page with its summed quantity. Computed once and shared
   * by the price lookup and the skeleton sizing, which each used to aggregate the
   * same rows independently.
   */
  const aggregated = useMemo(
    () => aggregateMaterials(data.map((d) => d.materials)),
    [data],
  );

  const materialsSkeletonCount = useMemo(() => {
    const count = Object.keys(aggregated).length;
    return count ? Math.max(count, 3) : DEFAULT_SKELETON_ROWS;
  }, [aggregated]);

  // Derived, not stored: keeping the total in state behind an effect meant every
  // keystroke in a price field rendered twice, once with a stale total.
  const total = useMemo(() => materialsTotal(allMaterials), [allMaterials]);

  useEffect(() => {
    const names = Object.keys(aggregated);
    if (!names.length) {
      setAllMaterials([]);
      setMaterialsLoading(false);
      return;
    }

    const controller = new AbortController();
    setMaterialsLoading(true);
    setAllMaterials([]);

    getMaterialPrices(aggregated, controller.signal)
      .then((prices) => {
        setAllMaterials(
          Object.entries(aggregated).map(([name, units]) => ({
            id: newId(),
            material: name.trim(),
            price: Number(prices[name]) || 0,
            units: units || 1,
          })),
        );
        setMaterialsLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(messageFrom(err, "Failed to load prices"));
        setMaterialsLoading(false);
      });

    // Aborting replaces the `cancelled` flag and the fetch-id counter the previous
    // version needed: a superseded request is cancelled outright rather than left
    // running so its answer can be ignored on arrival.
    return () => controller.abort();
  }, [aggregated]);

  useEffect(() => {
    if (source !== "latest") {
      return;
    }

    const controller = new AbortController();
    setError("");
    setCodesLoading(true);

    getLatestCodes(page + 1, controller.signal)
      .then((res) => {
        setData(res.items);
        setCodesTotal(res.total);
        setCodesLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(messageFrom(err, "Failed to load codes"));
        setCodesLoading(false);
      });

    return () => controller.abort();
  }, [source, page]);

  const onUploadStart = useCallback(() => {
    setError("");
    setCodesLoading(true);
    setMaterialsLoading(true);
    setAllMaterials([]);
  }, []);

  const onUploadData = useCallback((next: CodeType[]) => {
    setData(next);
    setPage(0);
    setCodesLoading(false);
    if (next.length) {
      setSource("upload");
      setCodesTotal(next.length);
    } else {
      // Cleared: fall back to the server's latest codes. Bumping `source` is what
      // re-runs the fetch effect.
      setSource("latest");
    }
  }, []);

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 3 },
        pb: { xs: "calc(12px + env(safe-area-inset-bottom))", md: 3 },
      }}
    >
      <AppBarActions>
        <UploadButton
          onData={onUploadData}
          onStart={onUploadStart}
          onError={setError}
          onAddress={setAddress}
        />
      </AppBarActions>
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        ) : null}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", md: 480 },
              flexShrink: 0,
              position: { md: "sticky" },
              top: { md: 80 },
              maxHeight: { md: "calc(100dvh - 96px)" },
              height: { md: "calc(100dvh - 96px)" },
              display: "flex",
            }}
          >
            <MaterialsList
              address={address}
              allMaterials={allMaterials}
              setAllMaterials={setAllMaterials}
              total={total}
              onSavePrice={savePrice}
              loading={materialsLoading}
              skeletonCount={materialsSkeletonCount}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, width: { xs: "100%" } }}>
            <CodesTable
              data={data}
              setData={setData}
              page={page}
              count={source === "upload" ? data.length : codesTotal}
              serverPaged={source === "latest"}
              onPageChange={setPage}
              onError={setError}
              loading={codesLoading}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
