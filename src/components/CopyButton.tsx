import React from "react";
import { IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

function CopyButton({ materials }: { materials: string }) {
  return (
    <IconButton
      size="small"
      color="primary"
      onClick={() => {
        navigator.clipboard.writeText(materials);
      }}
    >
      <ContentCopyIcon />
    </IconButton>
  );
}

export default CopyButton;
