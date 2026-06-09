import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Car, ChevronDown } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/ui-extras";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate } from "@/lib/utils";

function VehicleDetailSheet({ vehicleId, onClose }: { vehicleId: Id<"vehicles"> | null; onClose: () => void }) {
  const profile = useQuery(api.vehicles.getProfile, vehicleId ? { vehicleId } : "skip");

  if (!vehicleId) return null;

  return (
    <Sheet open={!!vehicleId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        {!profile ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="flex items-start gap-4 pr-8">
                {profile.photoUrls.length > 0 ? (
                  <img
                    src={profile.photoUrls[0].url ?? ""}
                    alt={`${profile.make} ${profile.model}`}
                    className="h-16 w-24 shrink-0 rounded-md object-cover border"
                  />
                ) : (
                  <div className="h-16 w-24 shrink-0 rounded-md bg-muted flex items-center justify-center border">
                    <Car className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <div>
                  <SheetTitle>{profile.year} {profile.make} {profile.model}</SheetTitle>
                  <p className="text-sm font-mono text-muted-foreground mt-0.5">{profile.vin}</p>
                  <p className="text-xs text-muted-foreground mt-1">{profile.jobs.length} job{profile.jobs.length !== 1 ? "s" : ""} on record</p>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto divide-y">
              {/* All photos */}
              {profile.photoUrls.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {profile.photoUrls.map((p) => (
                    <img
                      key={p.storageId}
                      src={p.url ?? ""}
                      alt="Vehicle"
                      className="h-20 w-28 shrink-0 rounded-md object-cover border"
                    />
                  ))}
                </div>
              )}

              {/* Job history */}
              {profile.jobs.length > 0 && (
                <div className="p-4 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job History</h3>
                  <div className="space-y-2">
                    {profile.jobs.map((job) => (
                      <div key={job._id} className="rounded-md border bg-muted/20 p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{job.jobNumber}</span>
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="text-sm font-medium">{job.customerName}</p>
                        <p className="text-xs text-muted-foreground">{job.description.slice(0, 80)}{job.description.length > 80 ? "…" : ""}</p>
                        {job.employeeName && (
                          <p className="text-xs text-primary/70 mt-1">Assigned: {job.employeeName}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full service history */}
              {profile.allHistory.length > 0 && (
                <div className="p-4 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service History</h3>
                  <div className="space-y-1.5">
                    {profile.allHistory.map((h) => (
                      <div key={h._id} className="flex items-start gap-2 text-xs">
                        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                        <div className="flex-1">
                          <span className="font-mono text-muted-foreground">{h.odometerKm.toLocaleString()} km</span>
                          <span className="mx-1.5 text-muted-foreground/40">·</span>
                          <span>{h.description}</span>
                          {h.jobNumber && (
                            <span className="ml-1 text-muted-foreground/60">({h.jobNumber})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function VehiclesPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<Id<"vehicles"> | null>(null);

  const vehicles = useQuery(api.vehicles.list) ?? [];
  const filtered = vehicles.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.vin.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader title="Vehicles" description={`${vehicles.length} vehicle profiles`} />

      <div className="mb-4">
        <Input
          placeholder="Search by make, model, or VIN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Car className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {vehicles.length === 0 ? "No vehicles yet — vehicles are added automatically when creating job cards." : "No vehicles match your search"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((v) => (
              <button
                key={v._id}
                onClick={() => setSelectedId(v._id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="h-10 w-14 shrink-0 rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                  {v.photoUrl ? (
                    <img src={v.photoUrl} alt={`${v.make} ${v.model}`} className="h-full w-full object-cover" />
                  ) : (
                    <Car className="h-5 w-5 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{v.year} {v.make} {v.model}</p>
                  <p className="text-xs font-mono text-muted-foreground">{v.vin}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">{v.jobCount} job{v.jobCount !== 1 ? "s" : ""}</p>
                  {v.lastServiceDate && (
                    <p className="text-xs text-muted-foreground">Last: {formatDate(v.lastServiceDate)}</p>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground/40 -rotate-90 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <VehicleDetailSheet vehicleId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
