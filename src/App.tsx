import { useCallback, useEffect, useState } from "react";
import "./App.css";
import AppBar from "./components/AppBar";
import UploadButton from "./components/UploadButton";
import CodesTable from "./components/CodesTable";
import MaterialsList from "./components/MaterialsList";
import VoTab from "./components/VoTab";
import { debounce } from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import BasicTabs from "./components/Tabs";
import {
  getLatestCodes,
  getMaterialPrices,
  getVOCodes,
  setMaterialPrice,
} from "./api";
import { aggregateMaterials } from "./parseMaterials";
import { CodeType, MaterialsType } from "./types";

export type { CodeType, MaterialsType } from "./types";
export { REG_EXP_MATERIAL } from "./parseMaterials";
export { env } from "./api";

function App() {
  const [data, setData] = useState<CodeType[]>([]);
  const [allMaterials, setAllMaterials] = useState<MaterialsType[]>([]);
  const [address, setAddress] = useState<string>("");
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [width, setWidth] = useState(window.innerWidth);
  const [vo, setVo] = useState<string>("");

  const listener = useCallback(
    debounce(() => {
      setWidth(window.innerWidth);
    }, 500),
    []
  );

  useEffect(() => {
    window.addEventListener("resize", listener);

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, [listener]);

  const getData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getLatestCodes();
      setData([...res]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load codes");
    } finally {
      setLoading(false);
    }
  };

  const setPrice = async (material: string, price: string) => {
    try {
      await setMaterialPrice(material, price);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save price");
    }
  };

  const fetchVOCodes = async (voString: string) => {
    setError("");
    try {
      const { vo: voWithCodes } = await getVOCodes(voString);
      if (voWithCodes) {
        setVo(voWithCodes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to match VO codes");
    }
  };

  useEffect(() => {
    if (!data.length) {
      return;
    }

    const lines = data
      .map((d) => d.materials)
      .join("\n")
      .split("\n");
    const matObj = aggregateMaterials(lines);

    getMaterialPrices(matObj)
      .then((res) => {
        const finalArr: MaterialsType[] = Object.entries(matObj).map(
          ([name, units]) => ({
            id: uuidv4(),
            material: name.trim(),
            price: res[name] ? Number(res[name]) : 0,
            units: units || 1,
          })
        );
        setAllMaterials(finalArr);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load prices");
      });
  }, [data]);

  useEffect(() => {
    const newTotal = allMaterials.reduce(
      (acc, val) => acc + val.price * val.units,
      0
    );
    setTotal(Math.round(newTotal * 100) / 100);
  }, [allMaterials]);

  useEffect(() => {
    if (!data?.length) {
      getData();
    }
  }, [data]);

  const tab1 = (
    <div className="App">
      <UploadButton
        setData={setData}
        setLoading={setLoading}
        setError={setError}
        setAddress={setAddress}
      />
      {error ? <p style={{ color: "#860000" }}>{error}</p> : null}
      {loading ? (
        <h1>Loading Data ...</h1>
      ) : data?.length ? (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <h4>All Materials list</h4>
            <MaterialsList
              address={address}
              width={width}
              allMaterials={allMaterials}
              setAllMaterials={setAllMaterials}
              total={total}
              onSavePrice={setPrice}
            />
          </div>

          <div className="tableWrapper">
            <CodesTable data={data} setData={setData} width={width} />
          </div>
        </>
      ) : (
        <h1>No Data loaded</h1>
      )}
    </div>
  );

  return (
    <div className="container">
      <AppBar />
      <BasicTabs
        tab1={tab1}
        tab2={
          <VoTab
            vo={vo}
            error={error}
            onChange={setVo}
            onGetCodes={() => fetchVOCodes(vo)}
          />
        }
      />
    </div>
  );
}

export default App;
