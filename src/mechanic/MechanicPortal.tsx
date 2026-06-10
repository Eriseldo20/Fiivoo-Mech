import { useState } from "react";
import { useMechanicAuth } from "./useMechanicAuth";
import { MechanicLogin } from "./MechanicLogin";
import { MechanicJobList } from "./MechanicJobList";
import { MechanicJobDetail } from "./MechanicJobDetail";
import { MechanicDataProvider, type JobId } from "./data";

/**
 * Self-contained mechanic portal. Mount this at a route (e.g. /mechanic) in the
 * app router. It manages its own access-code session and internal navigation
 * between the job list and a job's detail view.
 *
 *   import { MechanicPortal } from "@/mechanic/MechanicPortal";
 *   <Route path="/mechanic" element={<MechanicPortal />} />
 *
 * Data layer: when VITE_CONVEX_URL is set (e.g. in Hercules) it talks to the
 * real Convex `mechanic.*` backend; otherwise it runs against an in-memory mock
 * store so the portal is fully interactive in preview environments.
 */
function MechanicPortalInner() {
  const { accessCode, signIn, signOut } = useMechanicAuth();
  const [openJobId, setOpenJobId] = useState<JobId | null>(null);

  if (!accessCode) {
    return <MechanicLogin onSignedIn={signIn} />;
  }

  if (openJobId) {
    return (
      <MechanicJobDetail
        accessCode={accessCode}
        jobCardId={openJobId}
        onBack={() => setOpenJobId(null)}
      />
    );
  }

  return (
    <MechanicJobList
      accessCode={accessCode}
      onSignOut={() => {
        setOpenJobId(null);
        signOut();
      }}
      onOpenJob={(id) => setOpenJobId(id)}
    />
  );
}

export function MechanicPortal() {
  return (
    <MechanicDataProvider>
      <MechanicPortalInner />
    </MechanicDataProvider>
  );
}
