import { Button, IconButton } from "@mui/material";
import { InputHTMLAttributes, useEffect, useRef, useState } from "react";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ClearIcon from "@mui/icons-material/Clear";
import readFile from "read-excel-file";
import { env } from "./../App";

const UploadButton = ({ setData }: { setData: any }) => {
  const [fileName, setFileName] = useState("");
  const [codesArr, setCodesArr] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const dataFetch = async () => {
    const jsonArr = JSON.stringify(codesArr);
    fetch(`https://mat-app-server.vercel.app/codes`, {
      method: "POST",
      body: jsonArr,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setData(data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    if (codesArr.length) {
      dataFetch();
    }
  }, [codesArr.length]);

  const onChange = async (e: any) => {
    const file = e.target?.files[0];

    if (file) {
      let arr: number[] = [];
      const data = await readFile(file);
      data.map((row) => {
        if (row[0] && parseInt(row[0].toString())) {
          arr.push(parseInt(row[0].toString()));
        }
      });

      setFileName(file.name);
      setCodesArr([...arr]);
    }
  };

  const onClearClick = () => {
    setFileName("");
    setCodesArr([]);
    setData([]);
  };

  return (
    <div className="uploadButtonContainer">
      {fileName ? (
        <div className="inputFile">
          <h5>{fileName}</h5>
          <IconButton onClick={onClearClick} aria-label="delete" size="small" sx={{ margin: "10px" }}>
            <ClearIcon />
          </IconButton>
        </div>
      ) : (
        <Button variant="contained" size="large" color="primary" component="label">
          Upload Job File
          <UploadFileIcon sx={{ marginLeft: "15px" }} />
          <input ref={inputRef} onChange={onChange} hidden accept=".xlsx" type="file" />
        </Button>
      )}
    </div>
  );
};

export default UploadButton;
