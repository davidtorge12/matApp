import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { PAGE_SIZE, pageRows } from "../pagination";
import { CodeType } from "../types";
import { updateCodeMaterials } from "../api";
import { isWarningLine } from "../warningLine";
import CopyButton from "./CopyButton";

const TABLE_SKELETON_ROWS = 8;

const updateMaterials = async (id: string, materials: string) => {
  await updateCodeMaterials(id, materials);
};

function pageSummary(page: number, count: number): string {
  if (!count) {
    return "0 of 0";
  }
  const from = page * PAGE_SIZE + 1;
  const to = Math.min(count, (page + 1) * PAGE_SIZE);
  return `${from}–${to} of ${count}`;
}

export default function BasicTable({
  data,
  setData,
  page,
  count,
  serverPaged,
  onPageChange,
  loading = false,
}: {
  data: CodeType[];
  setData: (data: CodeType[]) => void;
  page: number;
  count: number;
  serverPaged: boolean;
  onPageChange: (page: number) => void;
  loading?: boolean;
}) {
  const theme = useTheme();
  const showDescription = useMediaQuery(theme.breakpoints.up(750));

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

  const rows = pageRows(data, page, { serverPaged });
  const empty = !loading && !count;

  return (
    <Card variant="outlined" sx={{ width: "100%" }}>
      <CardHeader
        title="Job codes"
        subheader={empty ? undefined : pageSummary(page, count)}
        titleTypographyProps={{ variant: "h6" }}
      />
      {empty ? (
        <Typography color="text.secondary" sx={{ px: 3, pb: 3 }}>
          Upload a job file or wait for the latest codes.
        </Typography>
      ) : (
        <>
          <TableContainer sx={{ maxHeight: "calc(100vh - 220px)" }}>
            <Table stickyHeader sx={{ minWidth: 200 }} aria-label="codes table" size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="left">
                    <strong>Code</strong>
                  </TableCell>
                  {showDescription ? (
                    <TableCell>
                      <strong>Description</strong>
                    </TableCell>
                  ) : null}
                  <TableCell align="center">
                    <strong>Comments</strong>
                  </TableCell>
                  <TableCell width={280} align="center">
                    <strong>Materials</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Copy</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading
                  ? Array.from({ length: TABLE_SKELETON_ROWS }, (_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell>
                          <Skeleton variant="text" width={72} />
                        </TableCell>
                        {showDescription ? (
                          <TableCell>
                            <Skeleton variant="text" width="80%" />
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <Skeleton variant="text" width="60%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton
                            variant="rectangular"
                            height={56}
                            sx={{ borderRadius: 1 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton
                            variant="rectangular"
                            width={36}
                            height={36}
                            sx={{ borderRadius: 1, mx: "auto" }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  : rows.map((row: CodeType, i) => (
                      <TableRow
                        key={`${i}_${row._id}`}
                        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      >
                        <TableCell sx={{ fontWeight: 700 }} align="left">
                          {row.code}
                        </TableCell>
                        {showDescription ? (
                          <TableCell
                            sx={{ fontSize: "12px" }}
                            component="th"
                            scope="row"
                          >
                            <span>{row.description}</span>
                          </TableCell>
                        ) : null}
                        <TableCell align="center">
                          {row.comments ? (
                            isWarningLine(row.comments) ? (
                              <Chip label={row.comments} color="warning" />
                            ) : (
                              row.comments
                            )
                          ) : null}
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
                            minRows={2}
                            maxRows={4}
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
          {loading && !count ? null : (
            <TablePagination
              component="div"
              count={count}
              page={page}
              onPageChange={(_event, nextPage) => onPageChange(nextPage)}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
            />
          )}
        </>
      )}
    </Card>
  );
}
