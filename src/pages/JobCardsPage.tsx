import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Plus, Car, Trash2, ChevronDown } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/ui-extras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

const JOB_STATUSES = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "awaiting_parts", label: "Awaiting Parts" },
  { value: "complete", label: "Complete" },
  { value: "invoiced", label: "Invoiced" },
];

function CreateJobDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const employees = useQuery(api.employees.listActive) ?? [];
  const create = useMutation(api.jobCards.create);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleVin: "",
    vehicleOdometer: "",
    description: "",
    notes: "",
    assignedEmployeeId: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName || !form.vehicleMake || !form.vehicleModel || !form.vehicleYear || !form.description || !form.vehicleVin) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      await create({
        customerName: form.customerName,
        customerPhone: form.customerPhone || undefined,
        customerEmail: form.customerEmail || undefined,
        vehicleMake: form.vehicleMake,
        vehicleModel: form.vehicleModel,
        vehicleYear: form.vehicleYear,
        vehicleVin: form.vehicleVin,
        vehicleOdometer: form.vehicleOdometer || undefined,
        description: form.description,
        notes: form.notes || undefined,
        assignedEmployeeId: form.assignedEmployeeId ? form.assignedEmployeeId as Id<"employees"> : undefined,
      });
      toast.success("Job card created");
      onClose();
      setForm({ customerName: "", customerPhone: "", customerEmail: "", vehicleMake: "", vehicleModel: "", vehicleYear: "", vehicleVin: "", vehicleOdometer: "", description: "", notes: "", assignedEmployeeId: "" });
    } catch {
      toast.error("Failed to create job card");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Job Card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Customer Name *</Label>
              <Input placeholder="John Smith" value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="+27 …" value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input placeholder="email@example.com" value={form.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} />
            </div>
          </div>

          <div className="border-t pt-4 grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Make *</Label>
              <Input placeholder="Toyota" value={form.vehicleMake} onChange={(e) => set("vehicleMake", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Model *</Label>
              <Input placeholder="Hilux" value={form.vehicleModel} onChange={(e) => set("vehicleModel", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Year *</Label>
              <Input placeholder="2022" value={form.vehicleYear} onChange={(e) => set("vehicleYear", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>VIN *</Label>
              <Input placeholder="JTEHB3FJ…" value={form.vehicleVin} onChange={(e) => set("vehicleVin", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Odometer (km)</Label>
              <Input placeholder="85,000" value={form.vehicleOdometer} onChange={(e) => set("vehicleOdometer", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Assigned Mechanic</Label>
              <Select value={form.assignedEmployeeId} onValueChange={(v) => set("assignedEmployeeId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea placeholder="What needs to be done?" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Internal Notes</Label>
              <Textarea placeholder="Workshop notes…" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create Job Card"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JobDetailSheet({ jobId, onClose }: { jobId: Id<"jobCards"> | null; onClose: () => void }) {
  const job = useQuery(api.jobCards.get, jobId ? { id: jobId } : "skip");
  const updateStatus = useMutation(api.jobCards.updateStatus);
  const togglePaid = useMutation(api.jobCards.togglePaid);
  const remove = useMutation(api.jobCards.remove);
  const addTask = useMutation(api.jobCards.addTask);
  const toggleTask = useMutation(api.jobCards.toggleTask);
  const removeTask = useMutation(api.jobCards.removeTask);
  const [newTask, setNewTask] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!jobId) return null;

  async function handleStatusChange(status: string) {
    if (!jobId) return;
    try {
      await updateStatus({ id: jobId, status });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleTogglePaid() {
    if (!job || !jobId) return;
    try {
      await togglePaid({ id: jobId, paid: !job.paid });
      toast.success(job.paid ? "Marked unpaid" : "Marked paid");
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!jobId || !newTask.trim()) return;
    try {
      await addTask({ jobCardId: jobId, title: newTask.trim() });
      setNewTask("");
    } catch {
      toast.error("Failed to add task");
    }
  }

  async function handleDelete() {
    if (!jobId) return;
    try {
      await remove({ id: jobId });
      toast.success("Job card deleted");
      onClose();
    } catch {
      toast.error("Failed to delete");
    }
  }

  const estimate = job?.estimate;
  const total = estimate
    ? estimate.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0)
    : null;

  return (
    <Sheet open={!!jobId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        {!job ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{job.jobNumber}</span>
                    <StatusBadge status={job.status} />
                    {job.paid && (
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-green-500/15 text-green-400 border-green-500/20">Paid</span>
                    )}
                  </div>
                  <SheetTitle className="text-base">{job.customerName}</SheetTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {job.vehicleYear} {job.vehicleMake} {job.vehicleModel}
                    {job.vehicleVin && <span className="ml-1 font-mono text-xs">· {job.vehicleVin}</span>}
                  </p>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto divide-y">
              {/* Vehicle photos */}
              {job.photoUrls && job.photoUrls.length > 0 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {job.photoUrls.map((p) => (
                    <img
                      key={p.storageId}
                      src={p.url ?? ""}
                      alt="Vehicle"
                      className="h-20 w-28 shrink-0 rounded-md object-cover border"
                    />
                  ))}
                </div>
              )}

              {/* Status & Actions */}
              <div className="p-4 grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={job.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_STATUSES.filter((s) => s.value !== "all").map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Payment</Label>
                  <Button
                    variant={job.paid ? "secondary" : "outline"}
                    size="sm"
                    className="w-full text-xs h-8"
                    onClick={handleTogglePaid}
                  >
                    {job.paid ? "Mark Unpaid" : "Mark Paid"}
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h3>
                <p className="text-sm text-foreground">{job.description}</p>
                {job.notes && (
                  <p className="text-xs text-muted-foreground border-l-2 border-muted pl-2">{job.notes}</p>
                )}
              </div>

              {/* Details */}
              <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {job.customerPhone && (
                  <><span className="text-muted-foreground text-xs">Phone</span><span className="font-mono text-xs">{job.customerPhone}</span></>
                )}
                {job.customerEmail && (
                  <><span className="text-muted-foreground text-xs">Email</span><span className="text-xs truncate">{job.customerEmail}</span></>
                )}
                {job.vehicleOdometer && (
                  <><span className="text-muted-foreground text-xs">Odometer</span><span className="font-mono text-xs">{job.vehicleOdometer} km</span></>
                )}
                {job.employee && (
                  <><span className="text-muted-foreground text-xs">Assigned to</span><span className="text-xs">{job.employee.name}</span></>
                )}
              </div>

              {/* Estimate / Total */}
              {estimate && (
                <div className="p-4 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Estimate · {estimate.estimateNumber}
                  </h3>
                  <div className="rounded-md border divide-y text-sm">
                    {estimate.lineItems.map((li, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-xs">{li.description}</span>
                          <span className="ml-2 text-xs text-muted-foreground">×{li.quantity}</span>
                          <span className={cn("ml-2 text-xs px-1 rounded", li.type === "labour" ? "text-blue-400" : "text-amber-500")}>
                            {li.type}
                          </span>
                        </div>
                        <span className="font-mono text-xs ml-3">{formatCurrency(li.quantity * li.unitPrice)}</span>
                      </div>
                    ))}
                    {total !== null && (
                      <div className="flex items-center justify-between px-3 py-2 font-semibold">
                        <span className="text-xs">Total</span>
                        <span className="font-mono text-sm text-primary">{formatCurrency(total)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tasks */}
              <div className="p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tasks</h3>
                {job.tasks && job.tasks.length > 0 && (
                  <div className="space-y-1">
                    {job.tasks.map((task) => (
                      <div key={task._id} className="flex items-center gap-2 group">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask({ taskId: task._id, completed: !task.completed })}
                          className="h-3.5 w-3.5 rounded border-muted accent-primary"
                        />
                        <span className={cn("flex-1 text-sm", task.completed && "line-through text-muted-foreground")}>
                          {task.title}
                        </span>
                        <button
                          onClick={() => removeTask({ taskId: task._id })}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                          aria-label="Remove task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <Input
                    className="h-8 text-xs"
                    placeholder="Add task…"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                  />
                  <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs shrink-0">Add</Button>
                </form>
              </div>

              {/* Service history */}
              {job.history && job.history.length > 0 && (
                <div className="p-4 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service History</h3>
                  <div className="space-y-2">
                    {job.history.slice(0, 5).map((h) => (
                      <div key={h._id} className="flex items-start gap-2 text-xs">
                        <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                        <div className="flex-1 min-w-0">
                          <span className="text-muted-foreground font-mono">{h.odometerKm.toLocaleString()} km</span>
                          <span className="mx-1.5 text-muted-foreground/40">·</span>
                          <span className="text-foreground">{h.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 flex items-center justify-between">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Delete this job card?</span>
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleDelete}>Confirm</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function JobCardsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"jobCards"> | null>(null);

  const jobs = useQuery(api.jobCards.list, { status: statusFilter === "all" ? undefined : statusFilter }) ?? [];

  const filtered = jobs.filter((j) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      j.customerName.toLowerCase().includes(q) ||
      j.jobNumber.toLowerCase().includes(q) ||
      j.vehicleMake.toLowerCase().includes(q) ||
      j.vehicleModel.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader title="Job Cards" description={`${jobs.length} total jobs`}>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Job
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Search by customer, job #, or vehicle…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-1 flex-wrap">
          {JOB_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors border",
                statusFilter === s.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Car className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No job cards found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((job) => (
              <button
                key={job._id}
                onClick={() => setSelectedId(job._id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{job.jobNumber}</span>
                    <StatusBadge status={job.status} />
                    {job.paid && (
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-green-500/15 text-green-400 border-green-500/20">Paid</span>
                    )}
                  </div>
                  <p className="font-medium text-sm text-foreground">{job.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.vehicleYear} {job.vehicleMake} {job.vehicleModel}
                    {job.employeeName && <span className="ml-2 text-primary/70">— {job.employeeName}</span>}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {job.totalCharge !== null && job.totalCharge !== undefined && (
                    <p className="text-sm font-mono font-semibold text-foreground">{formatCurrency(job.totalCharge)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{formatDate(job._creationTime)}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground/40 -rotate-90 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <CreateJobDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <JobDetailSheet jobId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
