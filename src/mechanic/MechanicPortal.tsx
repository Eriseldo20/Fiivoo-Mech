import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { useMechanicAuth } from "./useMechanicAuth";
import { MechanicLogin } from "./MechanicLogin";
import { MechanicJobList } from "./MechanicJobList";
import { MechanicJobDetail } from "./MechanicJobDetail";

/**
 * Self-contained mechanic portal. Mount this at a route (e.g. /mechanic) in the
 * app router. It manages its own access-code session and internal navigation
 * between the job list and a job's detail view.
 *
 *   import { MechanicPortal } from "@/mechanic/MechanicPortal";
 *   <Route path="/mechanic" element={<MechanicPortal />} />
 */
export function MechanicPortal() {
  const { accessCode, signIn, signOut } = useMechanicAuth();
  const [openJobId, setOpenJobId] = useState<Id<"jobCards"> | null>(null);

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
