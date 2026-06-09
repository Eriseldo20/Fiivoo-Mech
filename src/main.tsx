import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import "./index.css"
import { AppShell } from "./components/app-shell"
import { EstimatesDemoPage } from "./pages/estimates-demo"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<EstimatesDemoPage />} />
          <Route path="/estimates" element={<EstimatesDemoPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  </StrictMode>,
)
