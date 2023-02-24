import { useEffect, useState } from "react";
import "./App.css";
import AppBar from "./components/AppBar";
import UploadButton from "./components/UploadButton";
import CodesTable from "./components/CodesTable";
import { Textarea } from "@mui/joy";
import CopyButton from "./components/CopyButton";
export const env = import.meta.env;

export type CodeType = {
  _id: string;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  unit?: string;
  price?: string;
  materials: string;
  comments?: string;
};

function App() {
  const [data, setData] = useState<CodeType[]>([]);

  const [allMaterials, setAllMaterials] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  const getData = async () => {
    setLoading(true);
    const response = await fetch(`${env.VITE_SERVER_URL}/latest`);
    const res = await response.json();
    setData([...res]);
    setLoading(false);
  };

  useEffect(() => {
    if (data.length) {
      setAllMaterials(
        data
          .map((d) => d.materials)
          .filter((material) => material !== "")
          .join("\n")
          .slice(0, -2)
      );
    }
  }, [data]);

  useEffect(() => {
    if (!data?.length) {
      getData();
    }
  }, [data]);

  return (
    <div className="container">
      <AppBar />
      <div className="App">
        <UploadButton setData={setData} setLoading={setLoading} />
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
              <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "15px" }}>
                <Textarea
                  placeholder="you don't have materials yet"
                  onChange={(e) => setAllMaterials(e.target.value)}
                  value={allMaterials}
                  sx={{
                    width: "30vw",
                    minWidth: "300px",
                    maxWidth: "600px",
                    fontSize: "12px",
                  }}
                  minRows={5}
                  maxRows={10}
                  size="sm"
                />
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <CopyButton materials={allMaterials} />
                </div>
              </div>
            </div>

            <div className="tableWrapper">
              <CodesTable data={data} setData={setData} />
            </div>
          </>
        ) : (
          <h1>No Data loaded</h1>
        )}
      </div>
    </div>
  );
}

export default App;
