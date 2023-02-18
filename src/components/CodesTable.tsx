import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Textarea from "@mui/joy/Textarea";
import { CodeType, env } from "./../App";
import { IconButton, Button } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

function createData(name: string, calories: number, fat: number, carbs: number, protein: number) {
  return { name, calories, fat, carbs, protein };
}

const updateMaterials = async (id: string, materials: [string]) => {
  const response = await fetch(`${env.VITE_SERVER_URL}/code`, {
    method: "POST",
    body: JSON.stringify({ param: { id, materials } }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  const data = response.json();
};

export default function BasicTable({ data }: { data: any }) {
  const onUpdateMaterialsList = (e: any, id?: string, isEmpty?: false) => {
    if (id) {
      updateMaterials(id, e.target.value);
    }
  };

  const [width, setWidth] = useState(window.innerWidth);

  const listener = () => {
    setWidth(window.innerWidth);
  };

  useEffect(() => {
    window.addEventListener("resize", listener);

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  return (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 200 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="left">
                <strong>Code</strong>
              </TableCell>
              {width > 750 ? (
                <TableCell>
                  <strong>Description</strong>
                </TableCell>
              ) : null}
              <TableCell align="center">
                <strong>Comments</strong>
              </TableCell>
              <TableCell width={300} align="center">
                <strong>Materials</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Copy materials</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row: CodeType) => (
              <TableRow key={row._id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell sx={{ fontWeight: "700" }} align="left">
                  {row.code}
                </TableCell>
                {width > 750 ? (
                  <TableCell sx={{ fontSize: "12px" }} component="th" scope="row">
                    <span>{row.description}</span>
                  </TableCell>
                ) : null}
                <TableCell align="center" sx={{ color: "#860000" }}>
                  {row.comments}
                </TableCell>
                <TableCell align="right" sx={{ position: "relative" }}>
                  <Textarea
                    onBlur={(e) => onUpdateMaterialsList(e, row._id)}
                    sx={{ fontSize: "12px" }}
                    minRows={5}
                    size="sm"
                    placeholder="add materials"
                    defaultValue={row.materials}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      navigator.clipboard.writeText(row.materials);
                    }}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
