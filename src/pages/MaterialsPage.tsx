import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import AppBarActions from "../components/AppBarActions";
import CodesTable from "../components/CodesTable";
import MaterialsList from "../components/MaterialsList";
import UploadButton from "../components/UploadButton";
import { getLatestCodes, getMaterialPrices, setMaterialPrice } from "../api";
import { aggregateMaterials } from "../parseMaterials";
import { CodeType, MaterialsType } from "../types";

export default function MaterialsPage() {
  const [data, setData] = useState<CodeType[]>([]);
  const [allMaterials, setAllMaterials] = useState<MaterialsType[]>([]);
  const [address, setAddress] = useState<string>("");
  const [total, setTotal] = useState<number>(0);
  const [codesLoading, setCodesLoading] = useState<boolean>(true);
  const [materialsLoading, setMaterialsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(0);
  const [codesTotal, setCodesTotal] = useState(0);
  const [source, setSource] = useState<"latest" | "upload">("latest");
  const materialsFetchId = useRef(0);

  const setPrice = async (material: string, price: string) => {
    try {
      await setMaterialPrice(material, price);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save price");
    }
  };

  const setLoading = (next: boolean) => {
    setCodesLoading(next);
    if (next) {
      materialsFetchId.current += 1;
      setMaterialsLoading(true);
      setAllMaterials([]);
    }
  };

  const materialsSkeletonCount = useMemo(() => {
    if (!data.length) {
      return 8;
    }

    const lines = data
      .map((d) => d.materials)
      .join("\n")
      .split("\n");
    return Math.max(Object.keys(aggregateMaterials(lines)).length, 3);
  }, [data]);

  useEffect(() => {
    if (!data.length) {
      setAllMaterials([]);
      return;
    }

    let cancelled = false;
    const fetchId = materialsFetchId.current;
    setMaterialsLoading(true);

    const lines = data
      .map((d) => d.materials)
      .join("\n")
      .split("\n");
    const matObj = aggregateMaterials(lines);

    getMaterialPrices(matObj)
      .then((res) => {
        if (cancelled || fetchId !== materialsFetchId.current) {
          return;
        }
        const finalArr: MaterialsType[] = Object.entries(matObj).map(
          ([name, units]) => ({
            id: uuidv4(),
            material: name.trim(),
            price: res[name] ? Number(res[name]) : 0,
            units: units || 1,
          }),
        );
        setAllMaterials(finalArr);
      })
      .catch((err) => {
        if (cancelled || fetchId !== materialsFetchId.current) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load prices");
      })
      .finally(() => {
        if (!cancelled && fetchId === materialsFetchId.current) {
          setMaterialsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [data]);

  useEffect(() => {
    const newTotal = allMaterials.reduce(
      (acc, val) => acc + val.price * val.units,
      0,
    );
    setTotal(Math.round(newTotal * 100) / 100);
  }, [allMaterials]);

  useEffect(() => {
    if (source !== "latest") {
      return;
    }

    let cancelled = false;
    setError("");
    materialsFetchId.current += 1;
    setCodesLoading(true);
    setMaterialsLoading(true);
    setAllMaterials([]);

    getLatestCodes(page + 1)
      .then((res) => {
        if (cancelled) {
          return;
        }
        setData(res.items);
        setCodesTotal(res.total);
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load codes");
      })
      .finally(() => {
        if (!cancelled) {
          setCodesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source, page]);

  const onUploadData = (next: CodeType[]) => {
    setData(next);
    setPage(0);
    if (next.length) {
      setSource("upload");
      setCodesTotal(next.length);
    } else {
      setLoading(true);
      setSource("latest");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <AppBarActions>
        <UploadButton
          setData={onUploadData}
          setLoading={setLoading}
          setError={setError}
          setAddress={setAddress}
        />
      </AppBarActions>
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
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
              maxHeight: { md: "calc(100vh - 96px)" },
              height: { md: "calc(100vh - 96px)" },
              display: "flex",
            }}
          >
            <MaterialsList
              address={address}
              allMaterials={allMaterials}
              setAllMaterials={setAllMaterials}
              total={total}
              onSavePrice={setPrice}
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
              loading={codesLoading}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
