import { useEffect, useState } from "react";
import "./App.css";
import AppBar from "./components/AppBar";
import UploadButton from "./components/UploadButton";
import CodesTable from "./components/CodesTable";
import { Input, Textarea } from "@mui/joy";
import CopyButton from "./components/CopyButton";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { IconButton } from "@mui/material";
import { v4 as uuidv4 } from "uuid";

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

export type MaterialsType = {
  id: string;
  material: string;
  price: number;
};

function App() {
  const [data, setData] = useState<CodeType[]>([]);

  const [allMaterials, setAllMaterials] = useState<MaterialsType[]>([]);

  const [address, setAddress] = useState<string>("");

  const [total, setTotal] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);

  const [width, setWidth] = useState(window.innerWidth);

  const listener = () => {
    setWidth(window.innerWidth);
  };

  useEffect(() => {
    window.addEventListener("resize", listener);

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  const getData = async () => {
    setLoading(true);
    const response = await fetch(`${env.VITE_SERVER_URL}/latest`);
    const res = await response.json();
    setData([...res]);
    setLoading(false);
  };

  useEffect(() => {
    if (data.length) {
      setAllMaterials([
        ...data
          .map((d) => d.materials)
          .join("\n")
          .split("\n")
          .map((m, i) => {
            return { id: uuidv4(), material: m.trim(), price: 0 };
          })
          .filter(({ material }) => material !== ""),
      ]);
    }
  }, [data]);

  useEffect(() => {
    const newTotal = allMaterials.reduce((acc, val) => acc + val.price, 0);
    setTotal(Math.round(newTotal * 100) / 100);
  }, allMaterials);

  useEffect(() => {
    if (!data?.length) {
      getData();
    }
  }, [data]);

  return (
    <div className="container">
      <AppBar />
      <div className="App">
        <UploadButton setData={setData} setLoading={setLoading} address={address} setAddress={setAddress} />
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexDirection: "row",
                  gap: "15px",
                }}
              >
                <h4>All Materials list</h4>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "3px",
                  marginBottom: "15px",
                }}
              >
                {/* <Textarea
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
                /> */}

                {/* <MaterialsList materials={allMaterials} prices={allPrices} setPrices={setAllPrices} /> */}

                {allMaterials.length ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "3px",
                      marginBottom: "15px",
                      flexDirection: "column",
                      width: "500px",
                    }}
                  >
                    <h5>{address}</h5>
                    {allMaterials.map(({ id, material, price }: MaterialsType, i: number) => {
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "3px",
                            marginBottom: "5px",
                          }}
                        >
                          <input
                            value={material}
                            style={{ width: "60%", borderTop: "none", borderLeft: "none", borderRight: "none" }}
                            onBlur={(e) => {
                              setAllMaterials((prev) =>
                                prev.map((m: MaterialsType) => (m.id === id ? { ...m, material: e.target.value } : m))
                              );
                            }}
                          />

                          <input
                            value={price}
                            disabled={!material}
                            type="number"
                            step={0.1}
                            style={{
                              textAlign: "right",
                              width: "40%",
                              borderTop: "none",
                              borderLeft: "none",
                              borderRight: "none",
                            }}
                            onChange={(e) => {
                              setAllMaterials((prev) =>
                                prev.map((m: MaterialsType) => {
                                  return m.id === id ? { ...m, price: parseFloat(e.target.value) } : m;
                                })
                              );
                            }}
                            onBlur={(e) => {
                              setAllMaterials((prev) => [
                                ...prev.map((m: MaterialsType) => {
                                  let quantity = 0;
                                  if (m.id === id && parseFloat(m.material.trim()[0])) {
                                    quantity = parseFloat(m.material.trim()[0]);
                                  }

                                  return m.id === id ? { ...m, price: quantity * parseFloat(e.target.value) } : m;
                                }),
                              ]);
                            }}
                            onFocus={(e) => e.target.select()}
                          />
                          <div style={{ fontSize: "12px", position: "relative", bottom: "-10px" }}>£</div>
                          <IconButton
                            sx={{ width: "36px" }}
                            onClick={() => setAllMaterials([...allMaterials.filter((m) => m.id !== id)])}
                          >
                            <ClearIcon color="primary" />
                          </IconButton>
                        </div>
                      );
                    })}
                    {
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-around",
                          alignItems: "center",
                        }}
                      >
                        <IconButton
                          sx={{ width: "36px" }}
                          onClick={() => setAllMaterials([...allMaterials, { id: uuidv4(), material: "", price: 0 }])}
                        >
                          <AddIcon color="primary" />
                        </IconButton>

                        <CopyButton address={address} materials={[...allMaterials.map((m) => m.material)]} txt="list" />

                        <CopyButton
                          address={address}
                          materials={[...allMaterials.map((m) => m.material)]}
                          prices={[...allMaterials.map((m) => m.price)]}
                          total={total}
                          txt="with price"
                        />

                        <h4>Total: {total}</h4>
                      </div>
                    }
                  </div>
                ) : null}

                {/* <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <CopyButton materials={allMaterials} />
                </div> */}
              </div>
            </div>

            <div className="tableWrapper">
              <CodesTable data={data} setData={setData} width={width} />
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
