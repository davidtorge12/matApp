import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SettingsIcon from "@mui/icons-material/Settings";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import CopyButton from "./CopyButton";
import { updateCodeMaterials } from "../api";
import {
  CODE_COLUMNS,
  readCodeColumnVisibility,
  toggleCodeColumn,
  writeCodeColumnVisibility,
  type CodeColumnId,
} from "../codeColumns";
import { lastPageIndex, PAGE_SIZE, pageRows } from "../pagination";
import { CodeType } from "../types";
import { isWarningLine } from "../warningLine";

const SKELETON_ROWS = 8;

/** Autocorrect and spellcheck get in the way of trade terms and code strings. */
const materialsInputProps = {
  autoCorrect: "off",
  spellCheck: false,
} as const;

function pageSummary(page: number, count: number): string {
  if (!count) {
    return "0 of 0";
  }
  const from = page * PAGE_SIZE + 1;
  const to = Math.min(count, (page + 1) * PAGE_SIZE);
  return `${from}–${to} of ${count}`;
}

/** Comments flagged for attention read as a chip; the rest as plain text. */
function CommentsCell({ comments }: { comments?: string }) {
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
}

export default function CodesTable({
  data,
  setData,
  page,
  count,
  serverPaged,
  onPageChange,
  onError,
  loading = false,
}: {
  data: CodeType[];
  setData: (data: CodeType[]) => void;
  page: number;
  count: number;
  serverPaged: boolean;
  onPageChange: (page: number) => void;
  /** Surfaces a failed save. Without it a lost edit looked like a successful one. */
  onError?: (message: string) => void;
  loading?: boolean;
}) {
  const theme = useTheme();
  // `noSsr` resolves the query before the first paint. Without it the query reads
  // false initially, so a phone rendered the desktop table for one frame and then
  // reflowed into cards.
  const compact = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
  const [columnsAnchor, setColumnsAnchor] = useState<HTMLElement | null>(null);
  const [visibility, setVisibility] = useState(readCodeColumnVisibility);
  const columnsOpen = Boolean(columnsAnchor);

  const handleToggleColumn = (id: CodeColumnId) => {
    const next = toggleCodeColumn(visibility, id);
    setVisibility(next);
    writeCodeColumnVisibility(next);
  };

  const saveMaterials = (row: CodeType, value: string) => {
    const materials = value.trim();
    if (materials === (row.materials ?? "").trim()) {
      return;
    }

    // Local state and the server are given the same trimmed value; they used to
    // diverge, the page keeping the untrimmed text and the API the trimmed one.
    setData(data.map((d) => (d._id === row._id ? { ...d, materials } : d)));

    updateCodeMaterials(row._id, materials).catch((err: unknown) => {
      onError?.(
        err instanceof Error
          ? `Could not save materials for ${row.code}: ${err.message}`
          : `Could not save materials for ${row.code}`,
      );
    });
  };

  /** One materials editor, shared by the table and the phone cards. */
  const materialsField = (row: CodeType, maxRows: number) => (
    <TextField
      multiline
      minRows={2}
      maxRows={maxRows}
      fullWidth
      placeholder="Add materials"
      // Uncontrolled on purpose: a controlled field would re-render the whole
      // page on every keystroke. `key` forces a fresh field when the row changes.
      defaultValue={row.materials}
      onBlur={(e) => saveMaterials(row, e.target.value)}
      inputProps={{
        ...materialsInputProps,
        "aria-label": `Materials for code ${row.code}`,
      }}
    />
  );

  const rows = pageRows(data, page, { serverPaged });
  const empty = !loading && !count;
  const lastPage = lastPageIndex(count);

  const columnsMenu = (
    <>
      <Tooltip title="Columns">
        <IconButton
          aria-label="Columns"
          aria-haspopup="true"
          aria-expanded={columnsOpen ? true : undefined}
          onClick={(event) => setColumnsAnchor(event.currentTarget)}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={columnsAnchor}
        open={columnsOpen}
        onClose={(_event, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            setColumnsAnchor(null);
          }
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <ListSubheader>Visible columns</ListSubheader>
        {CODE_COLUMNS.map(({ id, label }) => (
          <MenuItem key={id} onClick={() => handleToggleColumn(id)}>
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={visibility[id]}
                tabIndex={-1}
                disableRipple
                inputProps={{ "aria-labelledby": `code-column-${id}` }}
              />
            </ListItemIcon>
            <ListItemText id={`code-column-${id}`}>{label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );

  return (
    <Card variant="outlined" sx={{ width: "100%" }}>
      <CardHeader
        title="Job codes"
        subheader={empty ? undefined : pageSummary(page, count)}
        titleTypographyProps={{ variant: "h6", component: "h2" }}
        action={columnsMenu}
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
                ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                    <Skeleton
                      key={`skeleton-${i}`}
                      variant="rectangular"
                      height={160}
                      sx={{ borderRadius: 2 }}
                    />
                  ))
                : rows.map((row) => (
                    <Box
                      key={row._id}
                      sx={{
                        position: "relative",
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 1.5,
                        pr: visibility.copy ? 6 : 1.5,
                      }}
                    >
                      {visibility.copy ? (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                          }}
                        >
                          <CopyButton
                            text={row.materials}
                            label={`Copy materials for ${row.code}`}
                            disabled={!row.materials}
                          />
                        </Box>
                      ) : null}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                          mb:
                            (visibility.description && row.description) ||
                            (visibility.comments && row.comments)
                              ? 0.5
                              : 1,
                          pr: visibility.copy ? 1 : 0,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          component="h3"
                          sx={{ fontWeight: 700 }}
                        >
                          {row.code}
                        </Typography>
                        {visibility.comments ? (
                          <CommentsCell comments={row.comments} />
                        ) : null}
                      </Box>
                      {visibility.description && row.description ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {row.description}
                        </Typography>
                      ) : null}
                      {visibility.materials ? materialsField(row, 6) : null}
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
                    {visibility.description ? (
                      <TableCell>
                        <strong>Description</strong>
                      </TableCell>
                    ) : null}
                    {visibility.comments ? (
                      <TableCell align="center">
                        <strong>Comments</strong>
                      </TableCell>
                    ) : null}
                    {visibility.materials ? (
                      <TableCell width={280} align="center">
                        <strong>Materials</strong>
                      </TableCell>
                    ) : null}
                    {visibility.copy ? (
                      <TableCell align="center">
                        <strong>Copy</strong>
                      </TableCell>
                    ) : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading
                    ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                        <TableRow key={`skeleton-${i}`}>
                          <TableCell>
                            <Skeleton variant="text" width={72} />
                          </TableCell>
                          {visibility.description ? (
                            <TableCell>
                              <Skeleton variant="text" width="80%" />
                            </TableCell>
                          ) : null}
                          {visibility.comments ? (
                            <TableCell>
                              <Skeleton variant="text" width="60%" />
                            </TableCell>
                          ) : null}
                          {visibility.materials ? (
                            <TableCell>
                              <Skeleton
                                variant="rectangular"
                                height={56}
                                sx={{ borderRadius: 1 }}
                              />
                            </TableCell>
                          ) : null}
                          {visibility.copy ? (
                            <TableCell align="center">
                              <Skeleton
                                variant="rectangular"
                                width={36}
                                height={36}
                                sx={{ borderRadius: 1, mx: "auto" }}
                              />
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))
                    : rows.map((row) => (
                        <TableRow
                          key={row._id}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 700 }} align="left">
                            {row.code}
                          </TableCell>
                          {visibility.description ? (
                            <TableCell component="th" scope="row">
                              <Typography variant="body2" component="span">
                                {row.description}
                              </Typography>
                            </TableCell>
                          ) : null}
                          {visibility.comments ? (
                            <TableCell align="center">
                              <CommentsCell comments={row.comments} />
                            </TableCell>
                          ) : null}
                          {visibility.materials ? (
                            <TableCell align="right">
                              {materialsField(row, 4)}
                            </TableCell>
                          ) : null}
                          {visibility.copy ? (
                            <TableCell align="center">
                              <CopyButton
                                text={row.materials}
                                label={`Copy materials for ${row.code}`}
                                disabled={!row.materials}
                              />
                            </TableCell>
                          ) : null}
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
