import { Button, Chip } from "@mui/material";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import CancelIcon from "@mui/icons-material/Cancel";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import readFile, { readSheetNames } from "read-excel-file";
import { CodeType } from "../types";
import { upsertCodes } from "../api";
import { JobRow, parseJobSheet, pickSheetName } from "../parseJobFile";

const UploadButton = ({
  setData,
  setLoading,
  setError,
  setAddress,
}: {
  setData: (data: CodeType[]) => void;
  setLoading: (type: boolean) => void;
  setError?: (message: string) => void;
  setAddress: (adress: string) => void;
}) => {
  const [fileName, setFileName] = useState("");
  const [codesArr, setCodesArr] = useState<string[]>([]);
  const jobData = useRef<JobRow[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const dataFetch = async () => {
    let data: CodeType[] = [];

    try {
      const chunkSize = 50;
      for (let i = 0; i < jobData.current.length; i += chunkSize) {
        const chunk = jobData.current.slice(i, i + chunkSize);
        const chunkResult = await upsertCodes(chunk);
        data = [...data, ...chunkResult];
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

      setData(data);
    } catch (err) {
      setError?.(err instanceof Error ? err.message : "Failed to upload codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codesArr.length) {
      setLoading(true);
      dataFetch();
    }
  }, [codesArr.length]);

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setLoading(true);

      const sheets = await readSheetNames(file);
      const data = await readFile(file, {
        sheet: pickSheetName(sheets),
      });

      const { address, rows } = parseJobSheet(sheets, data as unknown[][]);
      jobData.current = rows;
      setFileName(file.name);
      setCodesArr(rows.map((row) => row.code));
      setAddress(`Address: \n${address}\n\n`);
    }
  };

  const onClearClick = () => {
    setFileName("");
    setCodesArr([]);
    setData([]);
    jobData.current = [];
    setAddress("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      {fileName ? (
        <Chip
          label={fileName}
          onDelete={onClearClick}
          deleteIcon={<CancelIcon titleAccess={`Clear ${fileName}`} />}
          sx={{ maxWidth: { xs: 132, sm: 220 } }}
        />
      ) : null}
      <Button
        variant="outlined"
        color="primary"
        component="label"
        startIcon={<UploadFileIcon />}
        sx={{ flexShrink: 0 }}
      >
        Upload
        <input
          ref={inputRef}
          onChange={onChange}
          hidden
          // The MIME types matter on iOS: with only the extensions listed, the
          // Files picker greys spreadsheets out.
          accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12"
          type="file"
        />
      </Button>
    </>
  );
};

export default UploadButton;
