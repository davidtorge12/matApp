import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import AppBar from "./components/AppBar";
import "./App.css";

export type { CodeType, MaterialsType } from "./types";
export { REG_EXP_MATERIAL } from "./parseMaterials";
export { env } from "./api";

const MaterialsPage = lazy(() => import("./pages/MaterialsPage"));
const VoPage = lazy(() => import("./pages/VoPage"));

function PageFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
      <CircularProgress />
    </Box>
  );
}

function App() {
  return (
    <div className="container">
      <AppBar />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<MaterialsPage />} />
          <Route path="/vo" element={<VoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
