import { useState } from "react";
import BrightnessAutoIcon from "@mui/icons-material/BrightnessAuto";
import CheckIcon from "@mui/icons-material/Check";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  SvgIcon,
  Tooltip,
} from "@mui/material";
import { useThemePreference } from "../ThemePreferenceContext";
import type { ThemePreference } from "../themePreference";

const OPTIONS: {
  value: ThemePreference;
  label: string;
  Icon: typeof SvgIcon;
}[] = [
  { value: "light", label: "Light", Icon: LightModeIcon },
  { value: "dark", label: "Dark", Icon: DarkModeIcon },
  { value: "system", label: "System", Icon: BrightnessAutoIcon },
];

export default function ThemeMenu() {
  const { preference, setPreference } = useThemePreference();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const current = OPTIONS.find((option) => option.value === preference);
  const CurrentIcon = current?.Icon ?? BrightnessAutoIcon;
  const currentLabel = current?.label ?? "System";

  return (
    <>
      <Tooltip title="Theme">
        <IconButton
          aria-label={`Theme: ${currentLabel}`}
          aria-haspopup="true"
          aria-expanded={open ? true : undefined}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{ flexShrink: 0 }}
        >
          <CurrentIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {OPTIONS.map(({ value, label, Icon }) => {
          const active = preference === value;
          return (
            <MenuItem
              key={value}
              selected={active}
              onClick={() => {
                setPreference(value);
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{label}</ListItemText>
              {/* Always present so labels do not shift when the check moves. */}
              <ListItemIcon sx={{ minWidth: 36, justifyContent: "flex-end" }}>
                {active ? <CheckIcon fontSize="small" /> : null}
              </ListItemIcon>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
