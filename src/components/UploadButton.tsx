import { Button, IconButton } from "@mui/material";
import { InputHTMLAttributes, useEffect, useRef, useState } from "react";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ClearIcon from "@mui/icons-material/Clear";
import readFile from "read-excel-file";
import { CodeType, env } from "./../App";

const UploadButton = ({
  setData,
  setLoading,
  allMaterials,
  setAllMaterials,
}: {
  setData: (data: CodeType[]) => void;
  setLoading: (type: boolean) => void;
  allMaterials: string;
  setAllMaterials: (type: string) => void;
}) => {
  const [fileName, setFileName] = useState("");
  const [codesArr, setCodesArr] = useState<string[]>([]);
  const jobData = useRef<Array<{ code: string; description: string; comments: string }>>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const jobType = useRef(1);

  const dataFetch = async () => {
    const codesObj = JSON.stringify(jobData.current);

    const response = await fetch(`${env.VITE_SERVER_URL}/codes`, {
      method: "POST",
      body: codesObj,
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

    setLoading(false);

    // data = [...data.sort((a: CodeType, b: CodeType) => codesArr.indexOf(a.code) - codesArr.indexOf(b.code))];

    setData(data);
  };

  useEffect(() => {
    if (codesArr.length) {
      setLoading(true);
      dataFetch();
    }
  }, [codesArr.length]);

  const onChange = async (e: any) => {
    const file = e.target?.files[0];

    if (file) {
      setLoading(true);
      let arr: string[] = [];

      const data = await readFile(file);

      let address = "";
      let after = false;
      data.map((row, i, array) => {
        // set address
        if (!address && row[0] && row[2] && row[0].toString().toLowerCase().includes("address")) {
          address = row[2].toString();
        }

        // decide job type
        if (row[0] === "Code") {
          after = true;
          if (row[7].toString().toLowerCase() === "Specification Comments".toLowerCase()) {
            jobType.current = 2;
          } else {
            jobType.current = 1;
          }
        }

        if (after && row[0] !== "Code") {
          const reg = new RegExp(/\w/gi);

          if (row[0] && reg.test(row[0].toString())) {
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
          } else if (
            jobType.current === 1 &&
            row[1] &&
            row[1]?.toString() === row[1]?.toString().toUpperCase() &&
            array[i - 1] &&
            array[i - 1][0] &&
            parseInt(array[i - 1][0].toString())
          ) {
            const code = array[i - 1][0].toString();
            const description = array[i - 1][1].toString();
            const comments = row[1].toString();

            jobData.current = [...jobData.current, { code, description, comments }];
          }
        }
      });

      setFileName(file.name);
      setCodesArr([...arr]);

      setAllMaterials(`Address: \n${address}\n---\n`);
    }
  };

  const onClearClick = () => {
    setFileName("");
    setCodesArr([]);
    setData([]);
    jobType.current = 1;
    jobData.current = [];

    if (allMaterials.includes("Address: \n")) {
      setAllMaterials(allMaterials.split("---\n")[1]);
    }
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
