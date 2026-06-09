import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "@/convex/_generated/api";
import { ClipboardList, FileText, Users, TrendingUp, Car } from "lucide-react";
import { PageHeader, StatCard, StatusBadge } from "@/components/ui-extras";
import { formatRelative } from "@/lib/utils";

export function DashboardPage() {
  const stats = useQuery(api.dashboard.getStats);

  if (stats === undefined) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Overview of your shop" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const openJobsWithDetails = stats.openJobsWithDetails ?? [];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your shop activity" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total Jobs"
          value={stats.totalJobs}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgressJobs}
          icon={<TrendingUp className="h-4 w-4" />}
          sub="Active job cards"
        />
        <StatCard
          label="Open Estimates"
          value={stats.openEstimates}
          icon={<FileText className="h-4 w-4" />}
          sub="Draft or sent"
        />
        <StatCard
          label="Employees"
          value={stats.totalEmployees}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Open jobs */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Open Job Cards</h2>
          <Link
            to="/jobs"
            className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
          >
            View all
          </Link>
        </div>

        {openJobsWithDetails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No open job cards</p>
            <Link
              to="/jobs"
              className="mt-2 text-xs text-primary hover:underline"
            >
              Create your first job card
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {openJobsWithDetails.map((job) => (
              <Link
                key={job._id}
                to="/jobs"
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                {/* Vehicle thumbnail */}
                <div className="h-10 w-10 shrink-0 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                  {job.firstPhotoUrl ? (
                    <img
                      src={job.firstPhotoUrl}
                      alt={`${job.vehicleMake} ${job.vehicleModel}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Car className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{job.jobNumber}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{job.customerName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {job.vehicleYear} {job.vehicleMake} {job.vehicleModel}
                    {job.employeeName && (
                      <span className="ml-2 text-primary/80">— {job.employeeName}</span>
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent jobs */}
      {stats.recentJobs.length > 0 && (
        <div className="mt-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
          </div>
          <div className="divide-y">
            {stats.recentJobs.map((job) => (
              <div key={job._id} className="flex items-center gap-3 px-4 py-2.5">
                <StatusBadge status={job.status} />
                <span className="flex-1 min-w-0 text-sm truncate">{job.customerName}</span>
                <span className="text-xs text-muted-foreground shrink-0">{formatRelative(job._creationTime)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
