import { useState } from "react";
import { Button, IconButton, Snackbar, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

/**
 * Copies text to the clipboard. The text is passed in rather than assembled here,
 * so the button does not need to know anything about materials or prices.
 */
export default function CopyButton({
  text,
  label,
  disabled,
  variant = "icon",
}: {
  /** Either the string to copy, or a function called at click time. */
  text: string | (() => string);
  /** Spoken (and, for the button variant, visible) name. */
  label?: string;
  disabled?: boolean;
  variant?: "icon" | "button";
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        typeof text === "function" ? text() : text,
      );
      setError(false);
    } catch {
      // Clipboard access is refused on a non-secure origin and in some in-app
      // browsers. Saying so beats a button that silently does nothing.
      setError(true);
    }
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
          {label || "Copy"}
        </Button>
      ) : (
        // The tooltip stays short for pointer users; `label` carries the longer
        // spoken name, since a tooltip is invisible on touch anyway.
        <Tooltip title="Copy">
          <span>
            <IconButton
              disabled={disabled}
              color="primary"
              onClick={onCopy}
              aria-label={label || "Copy"}
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
        message={error ? "Could not copy" : "Copied"}
        // Bottom centre: clear of the sticky app bar and nearer the thumb.
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: "env(safe-area-inset-bottom)" }}
      />
    </>
  );
}
