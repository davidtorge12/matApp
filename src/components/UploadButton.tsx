import { Button, IconButton } from "@mui/material";
import { InputHTMLAttributes, useEffect, useRef, useState } from "react";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ClearIcon from "@mui/icons-material/Clear";
import readFile from "read-excel-file";
import { CodeType, env } from "./../App";

const UploadButton = ({ setData }: { setData: any }) => {
  const [fileName, setFileName] = useState("");
  const [codesArr, setCodesArr] = useState<string[]>([]);
  const jobData = useRef<Array<{ code: string; description: string; comments: string }>>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const jobType = useRef(1);

  const dataFetch = async () => {
    const jsonArr = JSON.stringify(codesArr);
    const response = await fetch(`${env.VITE_SERVER_URL}/codes`, {
      method: "POST",
      body: jsonArr,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    let data = await response.json();

    data = data.map((serverCode: CodeType) => {
      let comments = "";
      let description = "";
      jobData.current.forEach((jobRow) => {
        if (jobRow.code === serverCode.code) {
          comments = jobRow.comments;
          description = jobRow.description;
        }
      });
      return { ...serverCode, description: description ? description : serverCode.description, comments };
    });

    setData(data);
  };

  useEffect(() => {
    if (codesArr.length) {
      dataFetch();
    }
  }, [codesArr.length]);

  const onChange = async (e: any) => {
    const file = e.target?.files[0];

    if (file) {
      let arr: string[] = [];
      const data = await readFile(file);

      data.map((row) => {
        if (row[0] === "Code") {
          if (row[7].toString().toLowerCase() === "Specification Comments".toLowerCase()) {
            jobType.current = 2;
          } else {
            jobType.current = 1;
          }
        }

        if (row[0] && parseInt(row[0].toString())) {
          const code = row[0].toString();
          arr.push(code);

          if (jobType.current === 1) {
            jobData.current = [
              ...jobData.current,
              { code, description: row[1]?.toString() || "", comments: row[8]?.toString() || "" },
            ];
          } else {
            jobData.current = [
              ...jobData.current,
              { code, description: row[1]?.toString() || "", comments: row[7]?.toString() || "" },
            ];
          }
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
