import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { MechanicPortal } from "./mechanic/MechanicPortal";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MechanicPortal />
  </StrictMode>,
);
