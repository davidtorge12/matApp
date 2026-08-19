import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { IconButton, Tooltip } from "@mui/material";
import { useThemePreference } from "../ThemePreferenceContext";

export default function ThemeMenu() {
  const { preference, setPreference } = useThemePreference();
  const next = preference === "light" ? "dark" : "light";
  const label = `Switch to ${next}`;
  const Icon = preference === "light" ? LightModeIcon : DarkModeIcon;

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        onClick={() => setPreference(next)}
        sx={{ flexShrink: 0 }}
      >
        <Icon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
