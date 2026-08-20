import { Link, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { APP_BAR_ACTIONS_ID, APP_BAR_CHIP_ID } from "./AppBarActions";
import ThemeMenu from "./ThemeMenu";

export default function AppBarMenu() {
  const { pathname } = useLocation();
  const current = pathname === "/vo" ? "/vo" : "/";

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        // Keeps the bar clear of the notch once the viewport covers it.
        pt: "env(safe-area-inset-top)",
      }}
    >
      <Toolbar
        sx={{
          gap: { xs: 0.5, md: 2 },
          minHeight: { xs: 56, md: 64 },
          px: { xs: 1.5, md: 3 },
          flexWrap: "nowrap",
        }}
      >
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            fontWeight: 600,
            color: "inherit",
            textDecoration: "none",
            flexShrink: 0,
            // The Materials tab already goes home, so the wordmark gives up its
            // space on narrow screens.
            display: { xs: "none", md: "block" },
          }}
        >
          Mat App
        </Typography>
        <Tabs
          value={current}
          aria-label="App pages"
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ minHeight: 48, flexShrink: 0 }}
        >
          <Tab label="Materials" value="/" to="/" component={Link} />
          <Tab label="VO" value="/vo" to="/vo" component={Link} />
        </Tabs>
        <Box sx={{ flexGrow: 1 }} />
        <ThemeMenu />
        <Box
          id={APP_BAR_ACTIONS_ID}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 0.5,
            minHeight: 32,
            minWidth: 0,
            flexShrink: 0,
            "&:empty": { display: "none" },
          }}
        />
      </Toolbar>
      <Box
        id={APP_BAR_CHIP_ID}
        sx={{
          display: "flex",
          justifyContent: "center",
          px: 2,
          py: 0.75,
          borderTop: 1,
          borderColor: "divider",
          "&:empty": { display: "none" },
        }}
      />
    </AppBar>
  );
}
