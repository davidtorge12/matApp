import { useCallback, useEffect, useState } from "react";
import "./App.css";
import AppBar from "./components/AppBar";
import UploadButton from "./components/UploadButton";
import CodesTable from "./components/CodesTable";
import CopyButton from "./components/CopyButton";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { Button, IconButton, debounce } from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import BasicTabs from "./components/Tabs";
import { Textarea } from "@mui/joy";

export const env = import.meta.env;

type VOType = {
  code: string;
  info: string;
};

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
  info?: string;
};

export type MaterialsType = {
  id: string;
  material: string;
  price: number;
  units: number;
};

export const REG_EXP_MATERIAL = /\d{1,3}(\.\d)?\s?(x|X)\s/;

function App() {
  const [data, setData] = useState<CodeType[]>([]);

  const [allMaterials, setAllMaterials] = useState<MaterialsType[]>([]);

  const [address, setAddress] = useState<string>("");

  const [total, setTotal] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);

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
  }, []);

  const getData = async () => {
    setLoading(true);
    const response = await fetch(`${env.VITE_SERVER_URL}/latest`);
    const res = await response.json();
    setData([...res]);
    setLoading(false);
  };

  const setPrice = async (material: string, price: string) => {
    await fetch(`${env.VITE_SERVER_URL}/set-price`, {
      method: "POST",
      body: JSON.stringify({ material, price }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  };

  const getPrices = async (obj: object) => {
    const response = await fetch(`${env.VITE_SERVER_URL}/get-prices`, {
      method: "POST",
      body: JSON.stringify({ obj }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.json();
  };

  const getVOCodes = async (voString: String) => {
    const response = await fetch(`${env.VITE_SERVER_URL}/vo`, {
      method: "POST",
      body: JSON.stringify({ vo: voString }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    const { vo: voWithCodes } = await response.json();

    if (voWithCodes) {
      setVo(voWithCodes);
    }
  };

  const setAndParseMaterials = async () => {
    let matObj: any = {};

    const newMat = [
      ...data
        .map((d) => d.materials)
        .join("\n")
        .split("\n")
        .map((m, i) => {
          let unit = 1;
          let mat = m.trim();
          if (
            mat[0] &&
            parseInt(mat[0]) &&
            mat[1] &&
            mat[1].toLowerCase() === "x"
          ) {
            unit = parseInt(mat[0]);
          }

          const matWithoutQuantity = m.split(REG_EXP_MATERIAL).at(-1) || "";
          if (matWithoutQuantity && matObj[matWithoutQuantity]) {
            const newQuantity = unit + matObj[matWithoutQuantity];
            matObj = {
              ...matObj,
              [matWithoutQuantity.toString()]: newQuantity,
            };
          } else if (matWithoutQuantity) {
            matObj = { ...matObj, [matWithoutQuantity.toString()]: unit };
          }

          return {
            id: uuidv4(),
            material: m.trim(),
            price: 0,
            units: unit,
          };
        })
        .filter(({ material }) => material !== ""),
    ];

    const res = await getPrices(matObj);

    let finalArr = [];
    for (let [m, q] of Object.entries(matObj)) {
      finalArr.push({
        id: uuidv4(),
        material: m.trim(),
        price: res[m] ? res[m] : 0,
        units: (q as number) || 1,
      });
    }

    setAllMaterials(finalArr);
  };

  useEffect(() => {
    if (data.length) {
      setAndParseMaterials();
    }
  }, [data]);

  useEffect(() => {
    const newTotal = allMaterials.reduce(
      (acc, val) => acc + val.price * val.units,
      0
    );
    setTotal(Math.round(newTotal * 100) / 100);
  }, allMaterials);

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
        address={address}
        setAddress={setAddress}
      />
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
                    width: width < 700 ? `${width - 50}px` : "700px",
                  }}
                >
                  <h5>{address}</h5>
                  {allMaterials.map(
                    (
                      { id, material, price, units }: MaterialsType,
                      i: number
                    ) => {
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
                            style={{
                              width: "60%",
                              borderTop: "none",
                              borderLeft: "none",
                              borderRight: "none",
                            }}
                            onChange={(e) => {
                              const mat = e.target.value;
                              setAllMaterials((prev) =>
                                prev.map((m: MaterialsType) =>
                                  m.id === id
                                    ? {
                                        ...m,
                                        material: mat,
                                        units:
                                          mat[0] &&
                                          parseInt(mat[0]) &&
                                          mat[1] &&
                                          mat[1].toLowerCase() === "x"
                                            ? parseInt(mat[0])
                                            : 1,
                                      }
                                    : m
                                )
                              );
                            }}
                          />

                          <input
                            value={price}
                            disabled={!material}
                            type="number"
                            min={0}
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
                                  return m.id === id
                                    ? {
                                        ...m,
                                        price: parseFloat(e.target.value),
                                      }
                                    : m;
                                })
                              );
                            }}
                            onBlur={() => {
                              const arrSplit = material.split(REG_EXP_MATERIAL);

                              setPrice(
                                arrSplit.at(-1) as string,
                                price.toString()
                              );
                            }}
                            onFocus={(e) => e.target.select()}
                          />
                          {/* <p
                              style={{
                                textAlign: "right",
                                width: "20%",
                                borderTop: "none",
                                borderLeft: "none",
                                borderRight: "none",
                                fontSize: "12px",
                              }}
                            >
                              {units * price}
                            </p> */}
                          <input
                            value={`x ${units} =           ${price * units} £`}
                            style={{
                              textAlign: "right",
                              width: "20%",
                              borderTop: "none",
                              borderLeft: "none",
                              borderRight: "none",
                            }}
                          />
                          <IconButton
                            sx={{ width: "36px" }}
                            onClick={() =>
                              setAllMaterials([
                                ...allMaterials.filter((m) => m.id !== id),
                              ])
                            }
                          >
                            <ClearIcon color="primary" />
                          </IconButton>
                        </div>
                      );
                    }
                  )}
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

                      <CopyButton
                        address={address}
                        materials={[...allMaterials.map((m) => m.material)]}
                        units={[...allMaterials.map((m) => m.units)]}
                        txt="list"
                        key={uuidv4()}
                      />

                      <CopyButton
                        address={address}
                        materials={[...allMaterials.map((m) => m.material)]}
                        prices={[...allMaterials.map((m) => m.price)]}
                        units={[...allMaterials.map((m) => m.units)]}
                        total={total}
                        txt="with price"
                        key={uuidv4()}
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
  );

  const tab2 = (
    <div className="App">
      <Textarea
        placeholder={`Paste here the VO with form like:
    x renew Bath panel
    x Bonding coat in patch 
    x Bonding coat & Skimming 
`}
        value={vo}
        onChange={(e) => setVo(e.target.value)}
        sx={{
          width: "50vw",
          minWidth: "300px",
          maxWidth: "600px",
          fontSize: "15px",
          fontWeight: "500",
        }}
        minRows={10}
        maxRows={30}
        size="lg"
      />
      <div
        style={{
          width: "50vw",
          minWidth: "300px",
          maxWidth: "600px",
          display: "flex",
          justifyContent: "space-between",
          gap: "15px",
          padding: "15px",
        }}
      >
        <Button
          onClick={() => getVOCodes(vo)}
          variant="contained"
          disabled={!vo.trim()}
        >
          Get Codes from Vo
        </Button>
        <CopyButton str={vo} key={uuidv4()} />
      </div>
    </div>
  );

  return (
    <div className="container">
      <AppBar />

      <BasicTabs tab1={tab1} tab2={tab2} />
    </div>
  );
}

export default App;
