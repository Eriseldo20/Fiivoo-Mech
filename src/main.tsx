import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CalendarPage } from "@/CalendarPage";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CalendarPage />
  </StrictMode>,
);
