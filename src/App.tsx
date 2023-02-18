import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import AppBar from "./components/AppBar";
import UploadButton from "./components/UploadButton";
import CodesTable from "./components/CodesTable";
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

  const [loading, setLoading] = useState<boolean>(false);

  const getData = async () => {
    setLoading(true);
    const response = await fetch(`${env.VITE_SERVER_URL}/latest`);
    const res = await response.json();
    setData([...res]);
    setLoading(false);
  };

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
        ) : (
          <div className="tableWrapper">
            {data?.length ? <CodesTable data={data} setData={setData} /> : <h1>No Data loaded</h1>}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
