import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Plus, Wrench, Trash2, Check } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/ui-extras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SERVICE_TYPES = [
  { value: "oil_change", label: "Oil Change" },
  { value: "tyre_rotation", label: "Tyre Rotation" },
  { value: "brake_service", label: "Brake Service" },
  { value: "full_service", label: "Full Service" },
  { value: "inspection", label: "Inspection" },
  { value: "timing_belt", label: "Timing Belt" },
  { value: "coolant_flush", label: "Coolant Flush" },
  { value: "transmission_service", label: "Transmission Service" },
  { value: "other", label: "Other" },
];

function CreateReminderDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useMutation(api.maintenance.create);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "", vehicleMake: "", vehicleModel: "", vehicleYear: "",
    vehicleVin: "", serviceType: "oil_change", dueDate: "", notes: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName || !form.vehicleMake || !form.vehicleModel || !form.vehicleYear || !form.dueDate) {
      toast.error("Fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      await create({
        customerName: form.customerName,
        vehicleMake: form.vehicleMake,
        vehicleModel: form.vehicleModel,
        vehicleYear: form.vehicleYear,
        vehicleVin: form.vehicleVin || undefined,
        serviceType: form.serviceType as Parameters<typeof create>[0]["serviceType"],
        dueDate: form.dueDate,
        notes: form.notes || undefined,
      });
      toast.success("Reminder created");
      onClose();
    } catch {
      toast.error("Failed to create reminder");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Maintenance Reminder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Customer Name *</Label>
            <Input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
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
              <Label>VIN</Label>
              <Input placeholder="Optional" value={form.vehicleVin} onChange={(e) => set("vehicleVin", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Service Type</Label>
            <Select value={form.serviceType} onValueChange={(v) => set("serviceType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Due Date *</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MaintenancePage() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [createOpen, setCreateOpen] = useState(false);
  const reminders = useQuery(api.maintenance.list, { status: statusFilter === "all" ? undefined : statusFilter }) ?? [];
  const updateStatus = useMutation(api.maintenance.updateStatus);
  const remove = useMutation(api.maintenance.remove);

  async function handleComplete(id: Id<"maintenanceReminders">) {
    try {
      await updateStatus({ reminderId: id, status: "completed" });
      toast.success("Marked as completed");
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleDelete(id: Id<"maintenanceReminders">) {
    try {
      await remove({ reminderId: id });
      toast.success("Reminder deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  const STATUS_TABS = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const serviceTypeLabel = (t: string) =>
    SERVICE_TYPES.find((s) => s.value === t)?.label ?? t;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title="Maintenance Reminders" description={`${reminders.length} reminder${reminders.length !== 1 ? "s" : ""}`}>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Reminder
        </Button>
      </PageHeader>

      <div className="flex gap-1 flex-wrap mb-4">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors border",
              statusFilter === t.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Wrench className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No reminders found</p>
          </div>
        ) : (
          <div className="divide-y">
            {reminders.map((r) => {
              const isOverdue = r.status === "pending" && r.dueDate < today;
              const isDueSoon = r.status === "pending" && r.dueDate >= today && r.dueDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
              return (
                <div key={r._id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <StatusBadge status={r.status} />
                      {isOverdue && <span className="text-xs text-red-400 font-medium">Overdue</span>}
                      {isDueSoon && !isOverdue && <span className="text-xs text-yellow-500 font-medium">Due soon</span>}
                    </div>
                    <p className="font-medium text-sm">{r.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.vehicleYear} {r.vehicleMake} {r.vehicleModel}
                      {r.vehicleVin && <span className="ml-1 font-mono">· {r.vehicleVin}</span>}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-primary">{serviceTypeLabel(r.serviceType)}</span>
                      <span className="text-xs text-muted-foreground">Due: {r.dueDate}</span>
                    </div>
                    {r.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{r.notes}</p>}
                  </div>
                  {r.status === "pending" && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-400 hover:text-green-300"
                        onClick={() => handleComplete(r._id)}
                        aria-label="Mark complete"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(r._id)}
                        aria-label="Delete reminder"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateReminderDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
