import { Button, IconButton } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ClearIcon from "@mui/icons-material/Clear";
import readFile, { readSheetNames } from "read-excel-file";
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
  const jobType = useRef(0);

  const dataFetch = async () => {
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

      const sheets = await readSheetNames(file);

      const data = await readFile(file, {
        sheet:
          sheets[2] === "Auto Pop SPEC"
            ? sheets[2]
            : sheets[0] === "COPY" && sheets[1].includes("Price")
            ? sheets[1]
            : sheets[0],
      });

      let address = "";
      let after = false;

      data.map((row, i, array) => {
        // set address
        if (!address) {
          if (row[0] && row[0].toString().toLowerCase().includes("address")) {
            if (row[0] && row[2]) {
              address = row[2].toString();
            } else if (row[0] && !row[2]) {
              address = row[1].toString();
            }
          }

          // hammersmith & fulham
          if (row[1] && row[1].toString() === "Property Address:") {
            address = row[3]?.toString();
          } else if (row[1] && row[1].toString().includes("Void Address:")) {
            address = row[1].toString().split("Void Address:")[1] || "";
          } else if (row[2] && row[2].toString().includes("ADDRESS:")) {
            address = row[2].toString().split("ADDRESS:")[1] || "";
          } else if (
            row[1] &&
            row[1].toString().toLowerCase().includes("address")
          ) {
            address = row[1].toString();
          }
        }

        // decide job type
        if (!jobType?.current) {
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
          } else if (sheets[2] === "Auto Pop SPEC" && row[2] === "Job Code") {
            after = true;
            jobType.current = 4;
          } else if (row[0] === "CODE") {
            after = true;
            jobType.current = 5;
          } else if (row[1] === "SOR No" && row[3] === "Description") {
            after = true;
            // hammersmith & fulham
            jobType.current = 6;
          } else if (row[2] === "Code") {
            after = true;
            // mears
            jobType.current = 7;
          }
        }

        if (
          after &&
          row[0]?.toString()?.toLowerCase() !== "code" &&
          row[2] !== "Job Code"
        ) {
          const reg = new RegExp(/^(?=.*\d)[A-Za-z\d]{4,7}$/gm);
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
            } else if (jobType.current === 5) {
              jobData.current = [
                ...jobData.current,
                {
                  code,
                  description: row[1]?.toString() || "",
                  comments: row[6]?.toString() || "",
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
          } else if (row[1] && reg.test(row[1].toString())) {
            const code = row[1].toString();
            arr.push(code);
            if (jobType.current === 6) {
              jobData.current = [
                ...jobData.current,
                {
                  code,
                  description: row[2]?.toString() || "",
                  comments: "",
                },
              ];
            }
          } else if (
            row[2] &&
            reg.test(row[2].toString()) &&
            row[2].toString() !== "Code" && // has multiple code cell
            jobType.current === 7
          ) {
            const code = row[2].toString();
            arr.push(code);
            jobData.current = [
              ...jobData.current,
              {
                code,
                description: row[1]?.toString() || "",
                comments: row[6]?.toString() || "",
              },
            ];
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
          } else if (
            row[2] &&
            jobType.current === 4 &&
            reg.test(row[2].toString())
          ) {
            const code = row[2].toString();
            const description = row[4].toString();
            const comments = row[9]?.toString() || "";
            arr.push(code);
            jobData.current = [
              ...jobData.current,
              { code, description, comments },
            ];
          } else if (
            // if ul asta e repetat inca o data dar nu inteleg de ce nu merge din prima
            jobType.current === 4 &&
            row[2] &&
            reg.test(row[2].toString())
          ) {
            const code = row[2].toString();
            const description = row[4].toString();
            const comments = row[9]?.toString() || "";
            arr.push(code);
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
            accept=".xlsx, .xlsm"
            type="file"
          />
        </Button>
      )}
    </div>
  );
};

export default UploadButton;
