import { useState } from "react";
import HistoryIcon from "@mui/icons-material/History";
import CheckIcon from "@mui/icons-material/Check";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { jobLabel, readSavedJobs, type SavedJob } from "../savedJob";

export default function SavedJobsMenu({
  currentId,
  onSelect,
}: {
  currentId: string | null;
  onSelect: (job: SavedJob) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const open = Boolean(anchor);

  return (
    <>
      <Tooltip title="Recent jobs">
        <IconButton
          aria-label="Recent jobs"
          aria-haspopup="true"
          aria-expanded={open ? true : undefined}
          onClick={(event) => {
            setJobs(readSavedJobs());
            setAnchor(event.currentTarget);
          }}
          sx={{ "&&": { minWidth: 40, minHeight: 40 } }}
        >
          <HistoryIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {jobs.length ? (
          jobs.map((job) => {
            const selected = job.id === currentId;
            return (
              <MenuItem
                key={job.id}
                selected={selected}
                onClick={() => {
                  onSelect(job);
                  setAnchor(null);
                }}
              >
                {selected ? (
                  <ListItemIcon>
                    <CheckIcon fontSize="small" />
                  </ListItemIcon>
                ) : null}
                <ListItemText
                  inset={!selected}
                  primary={jobLabel(job)}
                  secondary={job.fileName || undefined}
                />
              </MenuItem>
            );
          })
        ) : (
          <MenuItem disabled>No saved jobs yet</MenuItem>
        )}
      </Menu>
    </>
  );
}
