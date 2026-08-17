import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import AppBar from "./components/AppBar";
import "./App.css";

// Note: no re-exports of types, regexes or config live here any more. They were
// left over from an earlier layout and meant importing a page component pulled in
// the API module for anything that wanted a type.
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
