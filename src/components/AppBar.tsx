import { Link, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { APP_BAR_ACTIONS_ID } from "./AppBarActions";

export default function AppBarMenu() {
  const { pathname } = useLocation();
  const current = pathname === "/vo" ? "/vo" : "/";

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar sx={{ gap: 2, minHeight: { xs: 56, sm: 64 }, flexWrap: "wrap" }}>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            fontWeight: 600,
            color: "inherit",
            textDecoration: "none",
          }}
        >
          Mat App
        </Typography>
        <Tabs value={current} aria-label="App pages" sx={{ minHeight: 48 }}>
          <Tab label="Materials" value="/" to="/" component={Link} />
          <Tab label="VO" value="/vo" to="/vo" component={Link} />
        </Tabs>
        <Box sx={{ flexGrow: 1 }} />
        <Box
          id={APP_BAR_ACTIONS_ID}
          sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 32 }}
        />
      </Toolbar>
    </AppBar>
  );
}
