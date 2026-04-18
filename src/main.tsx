import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initSeedData, applyShouryaPandeyMigration } from "./lib/data";
import { initCommunitySeedData } from "./lib/community";
import { initSocialSeedIfNeeded } from "./lib/social";

// Sync init for localStorage fallback
initSeedData();
applyShouryaPandeyMigration();
initCommunitySeedData();

// Async init — seeds Supabase social tables if empty
initSocialSeedIfNeeded().catch(console.warn);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
