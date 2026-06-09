import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { HerculesAuthProvider } from "@usehercules/auth/react";
import { ThemeProvider } from "next-themes";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const authority = import.meta.env.VITE_HERCULES_OIDC_AUTHORITY as string | undefined;
const clientId = import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID as string | undefined;

const missingVars = [
  !convexUrl && "VITE_CONVEX_URL",
  !authority && "VITE_HERCULES_OIDC_AUTHORITY",
  !clientId && "VITE_HERCULES_OIDC_CLIENT_ID",
].filter(Boolean);

const root = document.getElementById("root")!;

if (missingVars.length > 0) {
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0f0f0f;color:#f5f5f5;font-family:system-ui,sans-serif;gap:16px;padding:24px;text-align:center;">
      <div style="font-size:32px;font-weight:700;color:#f97316;">Fiivoo Mech</div>
      <div style="font-size:16px;color:#a1a1aa;">Missing required environment variables:</div>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">
        ${missingVars.map(v => `<li style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;padding:8px 16px;font-family:monospace;color:#f97316;">${v}</li>`).join("")}
      </ul>
      <div style="font-size:14px;color:#71717a;max-width:400px;">
        Add these to your <code style="background:#1a1a1a;padding:2px 6px;border-radius:4px;">.env</code> file or Vercel environment variables, then restart the dev server.
      </div>
    </div>
  `;
} else {
  const convex = new ConvexReactClient(convexUrl!);

  createRoot(root).render(
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
        <HerculesAuthProvider authority={authority!} client_id={clientId!}>
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
}
