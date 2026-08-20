import { ChangeEvent, useRef, useState } from "react";
import { Button, Chip, IconButton, Tooltip } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import readFile, { readSheetNames } from "read-excel-file";
import { JobCodeUpload, upsertCodes } from "../api";
import { JobRow, parseJobSheet, pickSheetName } from "../parseJobFile";
import { CodeType } from "../types";

/** Codes per request. The API accepts up to 500; 50 keeps each round trip small. */
const CHUNK_SIZE = 50;

/**
 * Pairs each saved code with the sheet row it came from.
 *
 * A Map, because the previous version scanned the whole job list for every saved
 * code — quadratic, and on a long sheet it also took the *last* matching row
 * rather than the first, so a code listed twice showed the wrong comments.
 */
export function withSheetDetail(saved: CodeType[], jobRows: JobRow[]): CodeType[] {
  const byCode = new Map<string, JobRow>();
  for (const row of jobRows) {
    if (!byCode.has(row.code)) {
      byCode.set(row.code, row);
    }
  }

  return saved.map((code) => {
    const row = byCode.get(code.code);
    return {
      ...code,
      description: row?.description || code.description,
      comments: row?.comments ?? "",
    };
  });
}

export function JobFileChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <Chip
      label={label}
      title={label}
      onDelete={onClear}
      deleteIcon={<CancelIcon titleAccess={`Clear ${label}`} />}
      sx={{ maxWidth: { xs: "100%", sm: 360 } }}
    />
  );
}

export default function UploadButton({
  onData,
  onStart,
  onError,
  onAddress,
  onFileName,
}: {
  onData: (data: CodeType[]) => void;
  onStart: () => void;
  onError: (message: string) => void;
  onAddress: (address: string) => void;
  onFileName?: (name: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const theme = useTheme();
  // Phone: icon only. From `sm` up there is room for the Upload label.
  const compact = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });

  const upload = async (rows: JobRow[]) => {
    const saved: CodeType[] = [];

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk: JobCodeUpload[] = rows.slice(i, i + CHUNK_SIZE);
      saved.push(...(await upsertCodes(chunk)));
    }

    return withSheetDetail(saved, rows);
  };

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setBusy(true);
    onStart();

    // Everything from here on is inside the try. Previously a spreadsheet the
    // parser could not read rejected outside any handler, which left the page
    // showing skeletons forever with no message and no way back.
    try {
      const sheets = await readSheetNames(file);
      const data = await readFile(file, { sheet: pickSheetName(sheets) });
      const { address, rows } = parseJobSheet(sheets, data as unknown[][]);

      onFileName?.(file.name);
      onAddress(address ? `Address: \n${address}\n\n` : "");

      if (!rows.length) {
        onError(
          "No job codes found in that file. Check it is the right sheet and try again.",
        );
        onData([]);
        return;
      }

      // Called directly rather than through an effect keyed on the number of
      // codes: two different files with the same code count left the effect
      // unfired, so the second upload never loaded.
      onData(await upload(rows));
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : "Could not read that file. Only .xlsx and .xlsm are supported.",
      );
      onData([]);
    } finally {
      setBusy(false);
      // Reset so re-picking the same file fires `change` again.
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const uploadLabel = busy ? "Reading…" : "Upload";
  const fileInput = (
    <input
      ref={inputRef}
      onChange={onChange}
      hidden
      // The MIME types matter on iOS: with only the extensions listed, the
      // Files picker greys spreadsheets out.
      accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12"
      type="file"
    />
  );

  if (compact) {
    return (
      <Tooltip title={uploadLabel}>
        <span>
          <IconButton
            component="label"
            disabled={busy}
            aria-label={uploadLabel}
            sx={{ flexShrink: 0 }}
          >
            <UploadFileIcon />
            {fileInput}
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="outlined"
      color="primary"
      component="label"
      disabled={busy}
      startIcon={<UploadFileIcon />}
      sx={{ flexShrink: 0 }}
    >
      {uploadLabel}
      {fileInput}
    </Button>
  );
}
