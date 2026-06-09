import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { HerculesAuthProvider } from "@usehercules/auth/react";
import { ThemeProvider } from "next-themes";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const root = document.getElementById("root")!;

createRoot(root).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <HerculesAuthProvider
        authority={import.meta.env.VITE_HERCULES_OIDC_AUTHORITY as string}
        client_id={import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID as string}
      >
        <ConvexProvider client={convex}>
          <BrowserRouter>
            <App />
            <Toaster position="bottom-right" />
          </BrowserRouter>
        </ConvexProvider>
      </HerculesAuthProvider>
    </ThemeProvider>
  </StrictMode>
);
