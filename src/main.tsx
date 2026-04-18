import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initSeedData, applyShouryaPandeyMigration } from "./lib/data";
import { initCommunitySeedData } from "./lib/community";

// Initialize app data
initSeedData();
applyShouryaPandeyMigration();
initCommunitySeedData();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
