import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  TextField,
} from "@mui/material";
import CopyButton from "./CopyButton";

export default function VoTab({
  vo,
  error,
  onChange,
  onGetCodes,
}: {
  vo: string;
  error: string;
  onChange: (value: string) => void;
  onGetCodes: () => void;
}) {
  return (
    <Card variant="outlined" sx={{ width: "100%", maxWidth: 720, mx: "auto" }}>
      <CardHeader
        title="VO"
        titleTypographyProps={{ variant: "h6", component: "h1" }}
      />
      <CardContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <TextField
          multiline
          placeholder={`Paste here the VO with form like:
    x renew Bath panel
    x Bonding coat in patch
    x Bonding coat & Skimming
`}
          helperText="Paste VO lines, then match SOR codes."
          value={vo}
          onChange={(e) => onChange(e.target.value)}
          // Ten rows fills a whole phone screen before the buttons come into
          // view, so the box starts smaller and grows.
          minRows={6}
          maxRows={30}
          fullWidth
          inputProps={{
            "aria-label": "VO lines",
            autoCorrect: "off",
            spellCheck: false,
          }}
          sx={{
            "& textarea": {
              // 16px keeps phone browsers from zooming in on focus.
              fontSize: "1rem",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            },
          }}
        />
      </CardContent>
      <CardActions
        disableSpacing
        sx={{
          px: 2,
          pb: 2,
          gap: 1,
          // Plain `column`, not `column-reverse`: reversing would leave the tab
          // order disagreeing with what is on screen.
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Button onClick={onGetCodes} variant="contained" disabled={!vo.trim()}>
          Match codes
        </Button>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CopyButton str={vo} variant="button" txt="Copy VO" disabled={!vo} />
        </Box>
      </CardActions>
    </Card>
  );
}
