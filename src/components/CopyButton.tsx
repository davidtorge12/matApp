import React from "react";
import { IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

function CopyButton({
  materials,
  prices,
  total,
  address,
  str,
  txt,
}: {
  materials?: string[];
  prices?: number[];
  total?: number;
  address?: string;
  str?: string;
  txt?: string;
}) {
  return (
    <IconButton
      size="small"
      color="primary"
      onClick={() => {
        if (str) {
          navigator.clipboard.writeText(str);
        }

        let allMaterialsList = "";
        if (address) {
          allMaterialsList += address;
        }

        if (materials) {
          if (prices) {
            materials.map((m, i) => {
              allMaterialsList += m.padEnd(45, ".") + " " + prices[i] + " £" + "\n";
            });
            if (total) {
              allMaterialsList += `\nTotal: ${total} £`;
            }
          } else {
            materials.map((m) => {
              allMaterialsList += m + "\n";
            });
          }
        }

        navigator.clipboard.writeText(allMaterialsList);
      }}
    >
      <ContentCopyIcon />
      {txt ? <p>{txt}</p> : null}
    </IconButton>
  );
}

export default CopyButton;
