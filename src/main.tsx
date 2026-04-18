import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initSeedData, applyShouryaPandeyMigration } from "./lib/data";
import { initCommunitySeedData } from "./lib/community";
import { initSocialSeedData, getOpsProfile } from "./lib/social";

// Initialize app data
initSeedData();
applyShouryaPandeyMigration();
initCommunitySeedData();
initSocialSeedData();
getOpsProfile(); // ensure ops profile always exists

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
