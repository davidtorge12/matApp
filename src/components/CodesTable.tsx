import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
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
import { lastPageIndex, PAGE_SIZE, pageRows } from "../pagination";
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

/** Autocorrect and spellcheck get in the way of trade terms and code strings. */
const materialsInputProps = {
  autoCorrect: "off",
  spellCheck: false,
} as const;

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
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const showDescription = useMediaQuery(theme.breakpoints.up(750));

  const onUpdateMaterialsList = (
    e: { target: { value: string } },
    id?: string,
  ) => {
    const value = e.target.value.trim();
    if (id) {
      updateMaterials(id, value).catch((err) => {
        console.error(err);
      });
    }
  };

  const onMaterialsBlur = (
    e: { target: { value: string } },
    row: CodeType,
  ) => {
    setData([
      ...data.map((d: CodeType) =>
        d._id === row._id ? { ...d, materials: e.target.value } : d,
      ),
    ]);
    onUpdateMaterialsList(e, row._id);
  };

  const rows = pageRows(data, page, { serverPaged });
  const empty = !loading && !count;
  const lastPage = lastPageIndex(count);

  const commentsCell = (comments?: string) => {
    if (!comments) {
      return null;
    }
    return isWarningLine(comments) ? (
      <Chip label={comments} color="warning" />
    ) : (
      <Typography variant="body2" component="span">
        {comments}
      </Typography>
    );
  };

  return (
    <Card variant="outlined" sx={{ width: "100%" }}>
      <CardHeader
        title="Job codes"
        subheader={empty ? undefined : pageSummary(page, count)}
        titleTypographyProps={{ variant: "h6", component: "h2" }}
      />
      {empty ? (
        <Typography color="text.secondary" sx={{ px: 3, pb: 3 }}>
          Upload a job file or wait for the latest codes.
        </Typography>
      ) : (
        <>
          {compact ? (
            /* Stacked cards rather than a table inside its own scroll box: a
               nested scroller wrapped around editable text is awkward by touch,
               and the table columns cannot fit a phone. */
            <Stack spacing={1} sx={{ px: 1, pb: 1 }}>
              {loading
                ? Array.from({ length: TABLE_SKELETON_ROWS }, (_, i) => (
                    <Skeleton
                      key={`skeleton-${i}`}
                      variant="rectangular"
                      height={160}
                      sx={{ borderRadius: 2 }}
                    />
                  ))
                : rows.map((row: CodeType, i) => (
                    <Box
                      key={`${i}_${row._id}`}
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                          mb: row.description || row.comments ? 0.5 : 1,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          component="h3"
                          sx={{ fontWeight: 700 }}
                        >
                          {row.code}
                        </Typography>
                        {commentsCell(row.comments)}
                      </Box>
                      {row.description ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {row.description}
                        </Typography>
                      ) : null}
                      <TextField
                        multiline
                        minRows={2}
                        maxRows={6}
                        fullWidth
                        placeholder="Add materials"
                        label="Materials"
                        InputLabelProps={{ shrink: true }}
                        defaultValue={row.materials}
                        onBlur={(e) => onMaterialsBlur(e, row)}
                        inputProps={{
                          ...materialsInputProps,
                          "aria-label": `Materials for code ${row.code}`,
                        }}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          mt: 1,
                        }}
                      >
                        <CopyButton
                          str={row.materials}
                          variant="button"
                          txt="Copy materials"
                          disabled={!row.materials}
                        />
                      </Box>
                    </Box>
                  ))}
            </Stack>
          ) : (
            <TableContainer
              sx={{
                // dvh tracks the real viewport; vh overshoots it on phones and
                // tablets where the browser chrome hides and reappears.
                maxHeight: "calc(100dvh - 220px)",
                overscrollBehavior: "contain",
              }}
            >
              <Table
                stickyHeader
                sx={{ minWidth: 200 }}
                aria-label="codes table"
                size="small"
              >
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
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 700 }} align="left">
                            {row.code}
                          </TableCell>
                          {showDescription ? (
                            <TableCell component="th" scope="row">
                              <Typography variant="body2" component="span">
                                {row.description}
                              </Typography>
                            </TableCell>
                          ) : null}
                          <TableCell align="center">
                            {commentsCell(row.comments)}
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              multiline
                              minRows={2}
                              maxRows={4}
                              fullWidth
                              placeholder="add materials"
                              defaultValue={row.materials}
                              onBlur={(e) => onMaterialsBlur(e, row)}
                              inputProps={{
                                ...materialsInputProps,
                                "aria-label": `Materials for code ${row.code}`,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <CopyButton
                              str={row.materials}
                              txt={`Copy materials for ${row.code}`}
                              disabled={!row.materials}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {loading && !count ? null : compact ? (
            /* TablePagination's controls are too small and too cramped to hit
               reliably with a thumb. */
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                px: 2,
                pt: 1,
                pb: "calc(12px + env(safe-area-inset-bottom))",
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              <Button
                startIcon={<ChevronLeftIcon />}
                disabled={page <= 0}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              <Typography variant="body2" color="text.secondary">
                {pageSummary(page, count)}
              </Typography>
              <Button
                endIcon={<ChevronRightIcon />}
                disabled={page >= lastPage}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </Box>
          ) : (
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
