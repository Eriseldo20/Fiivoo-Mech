import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Plus, FileText, Trash2, ChevronDown, ArrowRight } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/ui-extras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

type LineItem = { description: string; quantity: number; unitPrice: number; type: "labour" | "part" };

function LineItemEditor({ items, onChange }: { items: LineItem[]; onChange: (items: LineItem[]) => void }) {
  function update(i: number, key: keyof LineItem, value: string | number) {
    const next = items.map((li, idx) => idx === i ? { ...li, [key]: value } : li);
    onChange(next);
  }
  function add() {
    onChange([...items, { description: "", quantity: 1, unitPrice: 0, type: "part" }]);
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  const total = items.reduce((s, li) => s + li.quantity * li.unitPrice, 0);

  return (
    <div className="space-y-2">
      {items.map((li, i) => (
        <div key={i} className="grid grid-cols-[1fr,60px,80px,80px,28px] gap-1.5 items-center">
          <Input
            className="h-8 text-xs"
            placeholder="Description"
            value={li.description}
            onChange={(e) => update(i, "description", e.target.value)}
          />
          <Input
            className="h-8 text-xs text-center"
            type="number"
            min={1}
            value={li.quantity}
            onChange={(e) => update(i, "quantity", Number(e.target.value))}
          />
          <Input
            className="h-8 text-xs"
            type="number"
            min={0}
            step={0.01}
            placeholder="0.00"
            value={li.unitPrice}
            onChange={(e) => update(i, "unitPrice", Number(e.target.value))}
          />
          <Select value={li.type} onValueChange={(v) => update(i, "type", v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="part">Part</SelectItem>
              <SelectItem value="labour">Labour</SelectItem>
            </SelectContent>
          </Select>
          <button onClick={() => remove(i)} className="flex items-center justify-center text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={add}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add line
        </Button>
        {total > 0 && (
          <span className="text-sm font-mono font-semibold text-primary">{formatCurrency(total)}</span>
        )}
      </div>
    </div>
  );
}

function CreateEstimateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useMutation(api.estimates.create);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", vehicleMake: "", vehicleModel: "", vehicleYear: "", notes: "" });
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0, type: "part" }]);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName || !form.vehicleMake || !form.vehicleModel || !form.vehicleYear) {
      toast.error("Fill in required fields");
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
        lineItems,
        notes: form.notes || undefined,
      });
      toast.success("Estimate created");
      onClose();
    } catch {
      toast.error("Failed to create estimate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Estimate</DialogTitle>
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
              <Input value={form.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} />
            </div>
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
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="grid grid-cols-[1fr,60px,80px,80px,28px] gap-1.5 text-xs text-muted-foreground px-0.5">
              <span>Description</span><span className="text-center">Qty</span><span>Unit Price</span><span>Type</span><span />
            </div>
            <LineItemEditor items={lineItems} onChange={setLineItems} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea placeholder="Additional notes…" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create Estimate"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EstimateDetailSheet({ estimateId, onClose }: { estimateId: Id<"estimates"> | null; onClose: () => void }) {
  const estimate = useQuery(api.estimates.get, estimateId ? { id: estimateId } : "skip");
  const updateStatus = useMutation(api.estimates.updateStatus);
  const convertToJob = useMutation(api.estimates.convertToJobCard);
  const remove = useMutation(api.estimates.remove);
  const [converting, setConverting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!estimateId) return null;

  const total = estimate?.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0) ?? 0;

  async function handleConvert() {
    if (!estimateId) return;
    setConverting(true);
    try {
      await convertToJob({ id: estimateId });
      toast.success("Converted to job card");
      onClose();
    } catch {
      toast.error("Failed to convert");
    } finally {
      setConverting(false);
    }
  }

  async function handleDelete() {
    if (!estimateId) return;
    try {
      await remove({ id: estimateId });
      toast.success("Estimate deleted");
      onClose();
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <Sheet open={!!estimateId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        {!estimate ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{estimate.estimateNumber}</span>
                  <StatusBadge status={estimate.status} />
                </div>
                <SheetTitle className="text-base">{estimate.customerName}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {estimate.vehicleYear} {estimate.vehicleMake} {estimate.vehicleModel}
                </p>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto divide-y">
              {/* Status */}
              <div className="p-4 flex items-center gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={estimate.status} onValueChange={(v) => updateStatus({ id: estimateId, status: v }).catch(() => toast.error("Failed to update"))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["draft","sent","accepted","declined"].map((s) => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(estimate.status === "accepted" || estimate.status === "draft" || estimate.status === "sent") && !estimate.jobCardId && (
                  <div className="space-y-1.5 pt-5">
                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleConvert} disabled={converting}>
                      {converting ? "Converting…" : <>Convert to Job <ArrowRight className="h-3.5 w-3.5" /></>}
                    </Button>
                  </div>
                )}
              </div>

              {/* Customer */}
              <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {estimate.customerPhone && (
                  <><span className="text-muted-foreground">Phone</span><span className="font-mono">{estimate.customerPhone}</span></>
                )}
                {estimate.customerEmail && (
                  <><span className="text-muted-foreground">Email</span><span className="truncate">{estimate.customerEmail}</span></>
                )}
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(estimate._creationTime)}</span>
              </div>

              {/* Line items */}
              <div className="p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Line Items</h3>
                <div className="rounded-md border divide-y text-sm">
                  <div className="grid grid-cols-[1fr,40px,80px,50px] gap-2 px-3 py-1.5 text-xs text-muted-foreground">
                    <span>Description</span><span className="text-center">Qty</span><span className="text-right">Price</span><span className="text-right">Total</span>
                  </div>
                  {estimate.lineItems.map((li, i) => (
                    <div key={i} className="grid grid-cols-[1fr,40px,80px,50px] gap-2 px-3 py-2 text-xs">
                      <div>
                        <span>{li.description}</span>
                        <span className={cn("ml-1.5 px-1 rounded text-[10px]", li.type === "labour" ? "text-blue-400" : "text-amber-500")}>
                          {li.type}
                        </span>
                      </div>
                      <span className="text-center text-muted-foreground">{li.quantity}</span>
                      <span className="text-right font-mono">{formatCurrency(li.unitPrice)}</span>
                      <span className="text-right font-mono">{formatCurrency(li.quantity * li.unitPrice)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-3 py-2 font-semibold">
                    <span className="text-xs">Total</span>
                    <span className="font-mono text-sm text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {estimate.notes && (
                <div className="p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</h3>
                  <p className="text-sm text-foreground">{estimate.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t p-4 flex items-center justify-between">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Delete this estimate?</span>
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

const ESTIMATE_STATUSES = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

export function EstimatesPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"estimates"> | null>(null);

  const estimates = useQuery(api.estimates.list, { status: statusFilter === "all" ? undefined : statusFilter }) ?? [];
  const filtered = estimates.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.customerName.toLowerCase().includes(q) || e.estimateNumber.toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader title="Estimates" description={`${estimates.length} total estimates`}>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Estimate
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Search by customer or estimate #…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-1 flex-wrap">
          {ESTIMATE_STATUSES.map((s) => (
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

      <div className="rounded-lg border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No estimates found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((est) => {
              const total = est.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
              return (
                <button
                  key={est._id}
                  onClick={() => setSelectedId(est._id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-muted-foreground">{est.estimateNumber}</span>
                      <StatusBadge status={est.status} />
                    </div>
                    <p className="font-medium text-sm text-foreground">{est.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {est.vehicleYear} {est.vehicleMake} {est.vehicleModel}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-mono font-semibold text-foreground">{formatCurrency(total)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(est._creationTime)}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground/40 -rotate-90 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <CreateEstimateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EstimateDetailSheet estimateId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
