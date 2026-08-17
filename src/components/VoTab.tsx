import { Button, TextField } from "@mui/material";
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
    <div className="App">
      {error ? <p style={{ color: "#860000" }}>{error}</p> : null}
      <TextField
        multiline
        placeholder={`Paste here the VO with form like:
    x renew Bath panel
    x Bonding coat in patch 
    x Bonding coat & Skimming 
`}
        value={vo}
        onChange={(e) => onChange(e.target.value)}
        minRows={10}
        maxRows={30}
        sx={{
          width: "50vw",
          minWidth: "300px",
          maxWidth: "600px",
          "& textarea": {
            fontSize: "15px",
            fontWeight: 500,
          },
        }}
      />
      <div
        style={{
          width: "50vw",
          minWidth: "300px",
          maxWidth: "600px",
          display: "flex",
          justifyContent: "space-between",
          gap: "15px",
          padding: "15px",
        }}
      >
        <Button
          onClick={onGetCodes}
          variant="contained"
          disabled={!vo.trim()}
        >
          Get Codes from Vo
        </Button>
        <CopyButton str={vo} />
      </div>
    </div>
  );
}
