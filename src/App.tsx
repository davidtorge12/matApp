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
};

function App() {
  const [data, setData] = useState<CodeType[]>([]);

  const getData = async () => {
    await fetch(`https://mat-app-server.vercel.app/latest`)
      .then((response) => response.json())
      .then((res) => setData([...res]));
  };

  useEffect(() => {
    if (!data?.length) {
      getData();
    }
  }, []);

  return (
    <div className="container">
      <AppBar />
      <div className="App">
        <UploadButton setData={setData} />

        <div className="tableWrapper">{data?.length ? <CodesTable data={data} /> : <h1>No Data loaded</h1>}</div>
      </div>
    </div>
  );
}

export default App;
