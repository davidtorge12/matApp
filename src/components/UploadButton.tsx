import { Button, IconButton } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ClearIcon from "@mui/icons-material/Clear";
import readFile from "read-excel-file";
import { CodeType, env } from "./../App";

const UploadButton = ({
  setData,
  setLoading,
  address,
  setAddress,
}: {
  setData: (data: CodeType[]) => void;
  setLoading: (type: boolean) => void;
  address: string;
  setAddress: (adress: string) => void;
}) => {
  const [fileName, setFileName] = useState("");
  const [codesArr, setCodesArr] = useState<string[]>([]);
  const jobData = useRef<
    Array<{ code: string; description: string; comments: string }>
  >([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const jobType = useRef(1);

  const dataFetch = async () => {
    const codesObj = JSON.stringify(jobData.current);

    let data: any = [];

    const chunkSize = 50;
    for (let i = 0; i < jobData.current.length; i += chunkSize) {
      const chunk = jobData.current.slice(i, i + chunkSize);

      const response = await fetch(`${env.VITE_SERVER_URL}/codes`, {
        method: "POST",
        body: JSON.stringify(chunk),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      data = [...data, await response.json()].flat();
    }

    data = data.map((serverCode: CodeType) => {
      let comments = "";
      let description = "";
      jobData.current.forEach((jobRow) => {
        if (jobRow.code === serverCode.code) {
          comments = jobRow.comments;
          description = jobRow.description;
        }
      });
      return {
        ...serverCode,
        description: description ? description : serverCode.description,
        comments,
      };
    });

    setLoading(false);

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

      console.log(data);

      let address = "";
      let after = false;
      data.map((row, i, array) => {
        // set address
        if (
          !address &&
          row[0] &&
          row[0].toString().toLowerCase().includes("address")
        ) {
          if (row[0] && row[2]) {
            address = row[2].toString();
          } else if (row[0] && !row[2]) {
            address = row[1].toString();
          }
        }

        // decide job type
        if (row[0] === "Code") {
          after = true;
          if (
            row[7].toString().toLowerCase() ===
            "Specification Comments".toLowerCase()
          ) {
            jobType.current = 2;
          } else {
            jobType.current = 1;
          }
        } else if (row[0] === "SoR Code") {
          after = true;
          jobType.current = 3;
        }

        if (after && row[0] !== "Code") {
          const reg = new RegExp(/\w/gi);

          if (row[0] && reg.test(row[0].toString())) {
            const code = row[0].toString();
            arr.push(code);

            if (jobType.current === 1) {
              jobData.current = [
                ...jobData.current,
                {
                  code,
                  description: row[1]?.toString() || "",
                  comments: row[8]?.toString() || "",
                },
              ];
            } else if (jobType.current === 2) {
              jobData.current = [
                ...jobData.current,
                {
                  code,
                  description: row[1]?.toString() || "",
                  comments: row[7]?.toString() || "",
                },
              ];
            } else if (jobType.current === 3 && row[1]) {
              jobData.current = [
                ...jobData.current,
                {
                  code,
                  description: row[1]?.toString() || "",
                  comments: row[11]?.toString() || "",
                },
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

            jobData.current = [
              ...jobData.current,
              { code, description, comments },
            ];
          }
        }
      });

      setFileName(file.name);
      setCodesArr([...arr]);

      setAddress(`Address: \n${address}\n\n`);
    }
  };

  const onClearClick = () => {
    setFileName("");
    setCodesArr([]);
    setData([]);
    jobType.current = 1;
    jobData.current = [];

    setAddress("");
  };

  return (
    <div className="uploadButtonContainer">
      {fileName ? (
        <div className="inputFile">
          <h5>{fileName}</h5>
          <IconButton
            onClick={onClearClick}
            aria-label="delete"
            size="small"
            sx={{ margin: "10px" }}
          >
            <ClearIcon />
          </IconButton>
        </div>
      ) : (
        <Button
          variant="contained"
          size="large"
          color="primary"
          component="label"
        >
          Upload Job File
          <UploadFileIcon sx={{ marginLeft: "15px" }} />
          <input
            ref={inputRef}
            onChange={onChange}
            hidden
            accept=".xlsx"
            type="file"
          />
        </Button>
      )}
    </div>
  );
};

export default UploadButton;
