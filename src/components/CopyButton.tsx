import React, { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Notification from "./Notification";

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
  const [time, setTime] = useState(false);

  useEffect(() => {
    if (time) {
      setTimeout(() => {
        setTime(false);
      }, 3000);
    }
  });

  return (
    <>
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
                allMaterialsList +=
                  m.padEnd(45, ".") + " " + prices[i] + " £" + "\n";
              });
              if (total) {
                allMaterialsList += `\nTotal: ${total} £ + "\n"`;
              }
            } else {
              materials.map((m) => {
                allMaterialsList += m + "\n";
              });
            }
          }

          navigator.clipboard.writeText(allMaterialsList);
          setTime(true);
        }}
      >
        <ContentCopyIcon />
        {txt ? <p>{txt}</p> : null}
      </IconButton>
      {time && <Notification text="Text successful copied" />}
    </>
  );
}

export default CopyButton;
