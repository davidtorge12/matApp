import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { CodeType } from "../types";
import { updateCodeMaterials } from "../api";
import CopyButton from "./CopyButton";

const updateMaterials = async (id: string, materials: string) => {
  await updateCodeMaterials(id, materials);
};

export default function BasicTable({
  data,
  setData,
  width,
}: {
  data: CodeType[];
  setData: (data: CodeType[]) => void;
  width: number;
}) {
  const onUpdateMaterialsList = (
    e: { target: { value: string } },
    id?: string
  ) => {
    const value = e.target.value.trim();
    if (id) {
      updateMaterials(id, value).catch((err) => {
        console.error(err);
      });
    }
  };

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
            {data.map((row: CodeType, i) => (
              <TableRow
                key={`${i}_${row._id}`}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell sx={{ fontWeight: "700" }} align="left">
                  {row.code}
                </TableCell>
                {width > 750 ? (
                  <TableCell
                    sx={{ fontSize: "12px" }}
                    component="th"
                    scope="row"
                  >
                    <span>{row.description}</span>
                  </TableCell>
                ) : null}
                <TableCell align="center" sx={{ color: "#860000" }}>
                  {row.comments}
                </TableCell>
                <TableCell align="right" sx={{ position: "relative" }}>
                  <TextField
                    multiline
                    onBlur={(e) => {
                      setData([
                        ...data.map((d: CodeType) => {
                          if (d._id === row._id) {
                            return { ...d, materials: e.target.value };
                          }
                          return d;
                        }),
                      ]);
                      onUpdateMaterialsList(e, row._id);
                    }}
                    sx={{
                      fontSize: "12px",
                      "& textarea": { fontSize: "12px" },
                    }}
                    minRows={5}
                    maxRows={10}
                    size="small"
                    fullWidth
                    placeholder="add materials"
                    defaultValue={row.materials}
                  />
                </TableCell>
                <TableCell align="center">
                  <CopyButton str={row.materials} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
