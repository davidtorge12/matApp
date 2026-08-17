import { useState } from "react";
import Box from "@mui/material/Box";
import VoTab from "../components/VoTab";
import { getVOCodes } from "../api";

export default function VoPage() {
  const [vo, setVo] = useState("");
  const [error, setError] = useState("");

  const fetchVOCodes = async (voString: string) => {
    setError("");
    try {
      const { vo: voWithCodes } = await getVOCodes(voString);
      if (voWithCodes) {
        setVo(voWithCodes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to match VO codes");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <VoTab
        vo={vo}
        error={error}
        onChange={setVo}
        onGetCodes={() => fetchVOCodes(vo)}
      />
    </Box>
  );
}
