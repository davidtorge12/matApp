import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import AppBarActions from "../components/AppBarActions";
import CodesTable from "../components/CodesTable";
import MaterialsList from "../components/MaterialsList";
import SavedJobsMenu from "../components/SavedJobsMenu";
import UploadButton from "../components/UploadButton";
import {
  getLatestCodes,
  getMaterialNames,
  getMaterialPrices,
  setMaterialPrice,
} from "../api";
import { newId } from "../id";
import { materialsTotal } from "../money";
import { aggregateMaterials } from "../parseMaterials";
import {
  readSavedJobs,
  upsertSavedJob,
  writeSavedJobs,
  type SavedJob,
} from "../savedJob";
import { catalogueNames } from "../suggestMaterials";
import { CodeType, MaterialsType } from "../types";

/** Rows of skeleton to show before the real material count is known. */
const DEFAULT_SKELETON_ROWS = 8;

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function MaterialsPage() {
  const [initial] = useState(() => readSavedJobs()[0] ?? null);
  const [data, setData] = useState<CodeType[]>(initial?.codes ?? []);
  const [allMaterials, setAllMaterials] = useState<MaterialsType[]>(
    initial?.materials ?? [],
  );
  const [address, setAddress] = useState(initial?.address ?? "");
  const [fileName, setFileName] = useState(initial?.fileName ?? "");
  const [jobId, setJobId] = useState<string | null>(initial?.id ?? null);
  const [codesLoading, setCodesLoading] = useState(!initial);
  const [materialsLoading, setMaterialsLoading] = useState(!initial);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [codesTotal, setCodesTotal] = useState(initial?.codes.length ?? 0);
  const [source, setSource] = useState<"latest" | "upload">(
    initial ? "upload" : "latest",
  );
  const [catalogue, setCatalogue] = useState<string[]>([]);
  const [materialsOrigin, setMaterialsOrigin] = useState<"recipe" | "job">(
    initial ? "job" : "recipe",
  );

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

  const materialNames = useMemo(
    () =>
      catalogueNames([
        catalogue,
        Object.keys(aggregated),
        allMaterials.map((row) => row.material),
      ]),
    [catalogue, aggregated, allMaterials],
  );

  useEffect(() => {
    const controller = new AbortController();
    getMaterialNames(controller.signal)
      .then((res) => {
        setCatalogue(Array.isArray(res.items) ? res.items : []);
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        // An older API without this route must not block typing on the job.
        setCatalogue([]);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (materialsOrigin === "job") {
      return;
    }

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
  }, [aggregated, materialsOrigin]);

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

  const applyJob = useCallback((job: SavedJob) => {
    setMaterialsOrigin("job");
    setJobId(job.id);
    setFileName(job.fileName);
    setAddress(job.address);
    setData(job.codes);
    setAllMaterials(job.materials);
    setPage(0);
    setSource("upload");
    setCodesTotal(job.codes.length);
    setCodesLoading(false);
    setMaterialsLoading(false);
    setError("");
  }, []);

  useEffect(() => {
    if (source !== "upload" || !fileName || codesLoading || materialsLoading) {
      return;
    }

    const job: SavedJob = {
      id: jobId ?? newId(),
      fileName,
      address,
      savedAt: new Date().toISOString(),
      codes: data,
      materials: allMaterials,
    };
    const next = upsertSavedJob(readSavedJobs(), job);
    writeSavedJobs(next);
  }, [
    source,
    fileName,
    address,
    data,
    allMaterials,
    codesLoading,
    materialsLoading,
    jobId,
  ]);

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
      setMaterialsOrigin("recipe");
      setJobId(newId());
      setSource("upload");
      setCodesTotal(next.length);
    } else {
      setMaterialsOrigin("recipe");
      setJobId(null);
      setFileName("");
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
        <SavedJobsMenu currentId={jobId} onSelect={applyJob} />
        <UploadButton
          fileName={fileName}
          onFileName={setFileName}
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
              materialNames={materialNames}
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
              materialNames={materialNames}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
