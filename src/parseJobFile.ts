export type JobRow = {
  code: string;
  description: string;
  comments: string;
};

const CODE_PATTERN = /^(?=.*\d)[A-Za-z\d]{4,7}$/;

function cell(row: unknown[], index: number): string {
  const value = row[index];
  return value == null ? "" : String(value);
}

function isCode(value: string): boolean {
  return CODE_PATTERN.test(value);
}

export function pickSheetName(sheets: string[]): string {
  if (sheets[2] === "Auto Pop SPEC") {
    return sheets[2];
  }
  if (sheets[0] === "COPY" && sheets[1]?.includes("Price")) {
    return sheets[1];
  }
  return sheets[0];
}

function detectJobType(
  row: unknown[],
  sheets: string[],
): { jobType: number; after: boolean } | null {
  if (row[0] === "Code") {
    const commentsHeader = cell(row, 7).toLowerCase() === "specification comments";
    return { jobType: commentsHeader ? 2 : 1, after: true };
  }
  if (row[0] === "SoR Code") {
    return { jobType: 3, after: true };
  }
  if (sheets[2] === "Auto Pop SPEC" && row[2] === "Job Code") {
    return { jobType: 4, after: true };
  }
  if (row[0] === "CODE") {
    return { jobType: 5, after: true };
  }
  if (row[1] === "SOR No" && row[3] === "Description") {
    return { jobType: 6, after: true };
  }
  if (row[2] === "Code") {
    return { jobType: 7, after: true };
  }
  return null;
}

function readAddress(row: unknown[], current: string): string {
  if (current) {
    return current;
  }

  let address = current;

  if (row[0] && cell(row, 0).toLowerCase().includes("address")) {
    if (row[2]) {
      address = cell(row, 2);
    } else if (row[0] && !row[2]) {
      address = cell(row, 1);
    }
  }

  if (row[1] && cell(row, 1) === "Property Address:") {
    address = cell(row, 3);
  } else if (row[1] && cell(row, 1).includes("Void Address:")) {
    address = cell(row, 1).split("Void Address:")[1] || "";
  } else if (row[2] && cell(row, 2).includes("ADDRESS:")) {
    address = cell(row, 2).split("ADDRESS:")[1] || "";
  } else if (row[1] && cell(row, 1).toLowerCase().includes("address")) {
    address = cell(row, 1);
  }

  return address;
}

function pushRow(
  rows: JobRow[],
  code: string,
  description: string,
  comments: string,
) {
  rows.push({ code, description, comments });
}

export function parseJobSheet(
  sheets: string[],
  data: unknown[][],
): { address: string; rows: JobRow[] } {
  let address = "";
  let after = false;
  let jobType = 0;
  const rows: JobRow[] = [];

  data.forEach((row, i, array) => {
    address = readAddress(row, address);

    if (!jobType) {
      const detected = detectJobType(row, sheets);
      if (detected) {
        jobType = detected.jobType;
        after = detected.after;
      }
    }

    if (after && cell(row, 0).toLowerCase() !== "code" && row[2] !== "Job Code") {
      const col0 = cell(row, 0);
      const col1 = cell(row, 1);
      const col2 = cell(row, 2);

      if (col0 && isCode(col0)) {
        if (jobType === 1) {
          pushRow(rows, col0, cell(row, 1), cell(row, 8));
        } else if (jobType === 2) {
          pushRow(rows, col0, cell(row, 1), cell(row, 7));
        } else if (jobType === 5) {
          pushRow(rows, col0, cell(row, 1), cell(row, 6));
        } else if (jobType === 3 && row[1]) {
          pushRow(rows, col0, cell(row, 1), cell(row, 11));
        }
      } else if (col1 && isCode(col1)) {
        if (jobType === 6) {
          pushRow(rows, col1, cell(row, 2), "");
        }
      } else if (col2 && isCode(col2) && col2 !== "Code" && jobType === 7) {
        pushRow(rows, col2, cell(row, 1), cell(row, 6));
      } else if (
        jobType === 1 &&
        row[1] &&
        col1 === col1.toUpperCase() &&
        array[i - 1] &&
        array[i - 1][0] &&
        parseInt(cell(array[i - 1], 0), 10)
      ) {
        pushRow(rows, cell(array[i - 1], 0), cell(array[i - 1], 1), col1);
      } else if (col2 && jobType === 4 && isCode(col2)) {
        pushRow(rows, col2, cell(row, 4), cell(row, 9));
      }
    }
  });

  return { address, rows };
}
