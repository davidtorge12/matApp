import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  TextField,
} from "@mui/material";
import CopyButton from "./CopyButton";
import { serializeVo } from "../serializeVo";

const SAMPLE_VO = `renew Bath panel
Bonding coat in patch
Bonding coat & Skimming`;

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
  const applySerialize = () => onChange(serializeVo(vo));

  return (
    <Card variant="outlined" sx={{ width: "100%", maxWidth: 720, mx: "auto" }}>
      <CardHeader
        title="VO"
        titleTypographyProps={{ variant: "h6", component: "h1" }}
        action={<CopyButton text={vo} label="Copy VO" disabled={!vo} />}
      />
      <CardContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <TextField
          multiline
          placeholder={`Paste here the VO list then press the Serialize button to automatically add x - in front of each work name:
  Example:
  ${SAMPLE_VO.split("\n").join("\n  ")}
`}
          helperText={
            <Button
              onClick={applySerialize}
              variant="text"
              disabled={!vo.trim()}
            >
              Serialize
            </Button>
          }
          FormHelperTextProps={{
            component: "div",
            sx: { display: "flex", justifyContent: "flex-end", mx: 0, mt: 0.5 },
          }}
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
        }}
      >
        <Button
          onClick={() => {
            applySerialize();
            onGetCodes();
          }}
          variant="contained"
          disabled={!vo.trim()}
        >
          Match codes
        </Button>
        <Button
          onClick={() => onChange(SAMPLE_VO)}
          variant="text"
          sx={{ ml: { sm: "auto" } }}
        >
          Use sample
        </Button>
      </CardActions>
    </Card>
  );
}
