import { Alert, Button, Card, CardActions, CardContent, CardHeader, TextField } from "@mui/material";
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
      <CardHeader title="VO" titleTypographyProps={{ variant: "h6" }} />
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
          minRows={10}
          maxRows={30}
          fullWidth
          sx={{
            "& textarea": {
              fontSize: "15px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            },
          }}
        />
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, justifyContent: "space-between" }}>
        <Button
          onClick={onGetCodes}
          variant="contained"
          disabled={!vo.trim()}
        >
          Match codes
        </Button>
        <CopyButton str={vo} />
      </CardActions>
    </Card>
  );
}
