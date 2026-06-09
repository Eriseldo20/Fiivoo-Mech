import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Plus, Users, Pencil } from "lucide-react";
import { PageHeader } from "@/components/ui-extras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  mechanic: "Mechanic",
  service_advisor: "Service Advisor",
  admin: "Admin",
};

function EmployeeDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: { _id: Id<"employees">; name: string; role: string; email?: string; phone?: string };
}) {
  const create = useMutation(api.employees.create);
  const update = useMutation(api.employees.update);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    role: existing?.role ?? "mechanic",
    email: existing?.email ?? "",
    phone: existing?.phone ?? "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    setLoading(true);
    try {
      if (existing) {
        await update({
          id: existing._id,
          name: form.name,
          role: form.role as "mechanic" | "service_advisor" | "admin",
          email: form.email || undefined,
          phone: form.phone || undefined,
        });
        toast.success("Employee updated");
      } else {
        await create({
          name: form.name,
          role: form.role as "mechanic" | "service_advisor" | "admin",
          email: form.email || undefined,
          phone: form.phone || undefined,
        });
        toast.success("Employee added");
      }
      onClose();
    } catch {
      toast.error("Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input placeholder="Jane Doe" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => set("role", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mechanic">Mechanic</SelectItem>
                <SelectItem value="service_advisor">Service Advisor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : existing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EmployeesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ _id: Id<"employees">; name: string; role: string; email?: string; phone?: string } | null>(null);
  const employees = useQuery(api.employees.list) ?? [];
  const setActive = useMutation(api.employees.setActive);
  const remove = useMutation(api.employees.remove);
  const [confirmDelete, setConfirmDelete] = useState<Id<"employees"> | null>(null);

  const active = employees.filter((e) => e.active);
  const inactive = employees.filter((e) => !e.active);

  async function handleToggleActive(id: Id<"employees">, active: boolean) {
    try {
      await setActive({ id, active });
      toast.success(active ? "Employee activated" : "Employee deactivated");
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleDelete(id: Id<"employees">) {
    try {
      await remove({ id });
      toast.success("Employee removed");
      setConfirmDelete(null);
    } catch {
      toast.error("Failed to remove");
    }
  }

  function EmployeeCard({ emp }: { emp: typeof employees[number] }) {
    return (
      <div className={cn("rounded-lg border bg-card p-4 flex items-start gap-3", !emp.active && "opacity-60")}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-semibold">
          {emp.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{emp.name}</p>
            <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              {ROLE_LABELS[emp.role] ?? emp.role}
            </span>
            {emp.activeJobCount > 0 && (
              <span className="text-xs rounded-full bg-primary/15 text-primary px-2 py-0.5">
                {emp.activeJobCount} active job{emp.activeJobCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {emp.email && <p className="text-xs text-muted-foreground mt-0.5 truncate">{emp.email}</p>}
          {emp.phone && <p className="text-xs text-muted-foreground font-mono">{emp.phone}</p>}
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setEditTarget(emp)}
            aria-label="Edit employee"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {confirmDelete === emp._id ? (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleDelete(emp._id)}>Delete</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => emp.active ? handleToggleActive(emp._id, false) : setConfirmDelete(emp._id)}
            >
              {emp.active ? "Deactivate" : "Reactivate"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Employees" description={`${active.length} active · ${inactive.length} inactive`}>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </PageHeader>

      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16">
          <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No employees yet</p>
          <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>Add your first employee</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {active.map((emp) => <EmployeeCard key={emp._id} emp={emp} />)}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inactive</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {inactive.map((emp) => (
                  <div key={emp._id} className="opacity-60 rounded-lg border bg-card p-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-semibold">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{ROLE_LABELS[emp.role] ?? emp.role}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0" onClick={() => handleToggleActive(emp._id, true)}>
                      Reactivate
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <EmployeeDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {editTarget && (
        <EmployeeDialog open={!!editTarget} onClose={() => setEditTarget(null)} existing={editTarget} />
      )}
    </div>
  );
}
