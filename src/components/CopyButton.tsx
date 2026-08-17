import { useState } from "react";
import { Button, IconButton, Snackbar, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export function buildCopyText({
  materials,
  prices,
  total,
  address,
  str,
  units,
}: {
  materials?: string[];
  prices?: number[];
  units?: number[];
  total?: number;
  address?: string;
  str?: string;
}): string {
  if (str) {
    return str;
  }

  let allMaterialsList = "";
  if (address) {
    allMaterialsList += address;
  }

  if (materials) {
    if (prices) {
      materials.forEach((m, i) => {
        if (units && units[i]) {
          allMaterialsList += `${units[i]}x ${m.padEnd(45, ".")} ${
            prices[i]
          } £ \n`;
        } else {
          allMaterialsList +=
            m.padEnd(45, ".") + " " + prices[i] + " £" + "\n";
        }
      });
      if (total) {
        allMaterialsList += `\nTotal: ${total} £ \n`;
      }
    } else {
      materials.forEach((m, i) => {
        if (units && units[i]) {
          allMaterialsList += `${units[i]}x  ${m}` + "\n";
        } else {
          allMaterialsList += m + "\n";
        }
      });
    }
  }

  return allMaterialsList;
}

function CopyButton({
  materials,
  prices,
  total,
  address,
  str,
  txt,
  units,
  disabled,
  variant = "icon",
}: {
  materials?: string[];
  prices?: number[];
  units?: number[];
  total?: number;
  address?: string;
  str?: string;
  txt?: string;
  disabled?: boolean;
  variant?: "icon" | "button";
}) {
  const [open, setOpen] = useState(false);

  const onCopy = () => {
    void navigator.clipboard.writeText(
      buildCopyText({ materials, prices, total, address, str, units })
    );
    setOpen(true);
  };

  return (
    <>
      {variant === "button" ? (
        <Button
          disabled={disabled}
          onClick={onCopy}
          startIcon={<ContentCopyIcon fontSize="small" />}
        >
          {txt || "Copy"}
        </Button>
      ) : (
        // The tooltip stays short for pointer users; `txt` carries the longer
        // spoken name, since a tooltip is invisible on touch anyway.
        <Tooltip title="Copy">
          <span>
            <IconButton
              disabled={disabled}
              color="primary"
              onClick={onCopy}
              aria-label={txt || "Copy"}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={() => setOpen(false)}
        message="Copied"
        // Bottom centre: clear of the sticky app bar and nearer the thumb.
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: "env(safe-area-inset-bottom)" }}
      />
    </>
  );
}

export default CopyButton;
