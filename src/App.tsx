import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@usehercules/auth/react";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { JobCardsPage } from "@/pages/JobCardsPage";
import { EstimatesPage } from "@/pages/EstimatesPage";
import { VehiclesPage } from "@/pages/VehiclesPage";
import { EmployeesPage } from "@/pages/EmployeesPage";
import { MaintenancePage } from "@/pages/MaintenancePage";
import { CalendarPage } from "@/pages/CalendarPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { LoginPage } from "@/pages/LoginPage";

function UserSync() {
  const { isAuthenticated } = useAuth();
  const updateUser = useMutation(api.users.updateCurrentUser);
  useEffect(() => {
    if (isAuthenticated) {
      updateUser().catch(console.error);
    }
  }, [isAuthenticated, updateUser]);
  return null;
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <>
      <UserSync />
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/jobs" element={<JobCardsPage />} />
          <Route path="/estimates" element={<EstimatesPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    </>
  );
}
