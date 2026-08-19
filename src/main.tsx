import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// Provider before App so `@mui/material/styles` finishes initializing before
// the rest of the tree loads the `@mui/material` barrel.
import { ThemePreferenceProvider } from "./ThemePreferenceContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemePreferenceProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemePreferenceProvider>
  </React.StrictMode>,
);
