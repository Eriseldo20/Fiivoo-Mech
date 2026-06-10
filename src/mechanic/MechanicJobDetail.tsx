import { useRef, useState } from "react";
import {
  ArrowLeft,
  Car,
  Phone,
  Gauge,
  Hash,
  Camera,
  Trash2,
  Plus,
  LoaderCircle,
  CheckCircle2,
  PenLine,
  History,
  ClipboardList,
  X,
} from "lucide-react";
import { SignaturePad, type SignaturePadHandle } from "./SignaturePad";
import {
  useJob,
  useMechanicActions,
  type JobDetail,
  type JobId,
  type MechanicActions,
  type StatusValue,
} from "./data";

type JobDetailProps = {
  accessCode: string;
  jobCardId: JobId;
  onBack: () => void;
};

const STATUS_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "awaiting_parts", label: "Awaiting Parts" },
  { value: "complete", label: "Complete" },
];

const HISTORY_TYPES = [
  { value: "general", label: "General" },
  { value: "oil_change", label: "Oil Change" },
  { value: "tyre", label: "Tyre" },
  { value: "brake", label: "Brake" },
  { value: "service", label: "Service" },
  { value: "repair", label: "Repair" },
  { value: "inspection", label: "Inspection" },
] as const;

export function MechanicJobDetail({ accessCode, jobCardId, onBack }: JobDetailProps) {
  const job = useJob(accessCode, jobCardId);

  if (job === undefined) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
        <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
      </main>
    );
  }

  if (job === null) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-muted-foreground">This job isn&apos;t available.</p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Back to jobs
        </button>
      </main>
    );
  }

  return <JobDetailLoaded accessCode={accessCode} job={job} onBack={onBack} />;
}

function JobDetailLoaded({
  accessCode,
  job,
  onBack,
}: {
  accessCode: string;
  job: JobDetail;
  onBack: () => void;
}) {
  const actions = useMechanicActions();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const jobCardId = job._id;

  const onStatusChange = async (status: StatusValue) => {
    await actions.updateStatus(accessCode, jobCardId, status);
  };

  const onUploadPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      await actions.uploadPhotos(accessCode, jobCardId, Array.from(files));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-background pb-12">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
          aria-label="Back to job list"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <div className="leading-tight">
          <p className="font-mono text-xs text-muted-foreground">{job.jobNumber}</p>
          <h1 className="font-semibold text-foreground">{job.customerName}</h1>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-4 py-5">
        {/* Status */}
        <section>
          <SectionTitle icon={CheckCircle2}>Status</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const active = job.status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onStatusChange(opt.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-ring/60"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Vehicle & customer */}
        <section className="rounded-lg border border-border bg-card p-4">
          <SectionTitle icon={Car}>Vehicle &amp; customer</SectionTitle>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Field label="Vehicle">
              {job.vehicleYear} {job.vehicleMake} {job.vehicleModel}
            </Field>
            <Field label="Customer">{job.customerName}</Field>
            {job.vehicleVin && (
              <Field label="VIN" icon={Hash}>
                <span className="font-mono text-xs">{job.vehicleVin}</span>
              </Field>
            )}
            {job.vehicleOdometer && (
              <Field label="Odometer" icon={Gauge}>
                {job.vehicleOdometer} km
              </Field>
            )}
            {job.customerPhone && (
              <Field label="Phone" icon={Phone}>
                <a href={`tel:${job.customerPhone}`} className="text-primary underline-offset-2 hover:underline">
                  {job.customerPhone}
                </a>
              </Field>
            )}
          </dl>
        </section>

        {/* Work details */}
        <section>
          <SectionTitle icon={ClipboardList}>Work to do</SectionTitle>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="whitespace-pre-wrap text-sm text-foreground">{job.description}</p>
            {job.notes && (
              <p className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm text-muted-foreground">
                {job.notes}
              </p>
            )}
          </div>
        </section>

        {/* Tasks */}
        {job.tasks.length > 0 && (
          <section>
            <SectionTitle icon={CheckCircle2}>Tasks</SectionTitle>
            <ul className="flex flex-col gap-2">
              {job.tasks.map((task) => (
                <li key={task._id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) =>
                        actions.toggleTask(accessCode, jobCardId, task._id, e.target.checked)
                      }
                      className="size-5 shrink-0 accent-primary"
                    />
                    <span
                      className={`text-sm ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
                    >
                      {task.title}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Photos */}
        <section>
          <SectionTitle icon={Camera}>Photos</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {job.photoUrls.map((photo) => (
              <div key={photo.storageId} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
                {photo.url && (
                  <img
                    src={photo.url || "/placeholder.svg"}
                    alt="Job documentation"
                    className="size-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => actions.removePhoto(accessCode, jobCardId, photo.storageId)}
                  className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-md bg-background/80 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-card text-muted-foreground hover:border-ring/60 hover:text-foreground disabled:opacity-50"
            >
              {uploading ? (
                <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <Camera className="size-6" aria-hidden="true" />
                  <span className="text-xs">Add</span>
                </>
              )}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => onUploadPhotos(e.target.files)}
          />
        </section>

        {/* Service history */}
        <ServiceHistory accessCode={accessCode} jobCardId={jobCardId} history={job.history} actions={actions} />

        {/* Signature */}
        <SignatureSection
          accessCode={accessCode}
          jobCardId={jobCardId}
          existingUrl={job.signatureUrl}
          signedByName={job.signedByName}
          signedAt={job.signedAt}
          actions={actions}
        />
      </div>
    </main>
  );
}

// ── Sub-sections ─────────────────────────────────────────────────────────────

function ServiceHistory({
  accessCode,
  jobCardId,
  history,
  actions,
}: {
  accessCode: string;
  jobCardId: JobId;
  history: JobDetail["history"];
  actions: MechanicActions;
}) {
  const [open, setOpen] = useState(false);
  const [odo, setOdo] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<(typeof HISTORY_TYPES)[number]["value"]>("general");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;
    setSaving(true);
    try {
      await actions.addHistoryEntry(accessCode, jobCardId, {
        odometerKm: Number(odo.replace(/[^0-9]/g, "")) || 0,
        description: desc.trim(),
        type,
      });
      setOdo("");
      setDesc("");
      setType("general");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <SectionTitle icon={History} noMargin>
          Service history
        </SectionTitle>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-ring/60"
        >
          {open ? <X className="size-3.5" aria-hidden="true" /> : <Plus className="size-3.5" aria-hidden="true" />}
          {open ? "Cancel" : "Add note"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mb-3 flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex gap-3">
            <input
              value={odo}
              onChange={(e) => setOdo(e.target.value)}
              inputMode="numeric"
              placeholder="Odometer (km)"
              className="w-36 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
            >
              {HISTORY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="What was done..."
            rows={2}
            className="resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
          />
          <button
            type="submit"
            disabled={saving || !desc.trim()}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            Save note
          </button>
        </form>
      )}

      {history.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          No service records yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {history.map((h) => (
            <li key={h._id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium capitalize text-foreground">{h.type.replace(/_/g, " ")}</span>
                <span>{h.odometerKm.toLocaleString()} km</span>
              </div>
              <p className="mt-1 text-sm text-foreground">{h.description}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SignatureSection({
  accessCode,
  jobCardId,
  existingUrl,
  signedByName,
  signedAt,
  actions,
}: {
  accessCode: string;
  jobCardId: JobId;
  existingUrl: string | null;
  signedByName: string | null;
  signedAt: number | null;
  actions: MechanicActions;
}) {
  const padRef = useRef<SignaturePadHandle | null>(null);
  const [name, setName] = useState("");
  const [hasInk, setHasInk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [redo, setRedo] = useState(false);

  const showForm = !existingUrl || redo;

  const submit = async () => {
    if (!padRef.current || padRef.current.isEmpty() || !name.trim()) return;
    setSaving(true);
    try {
      const blob = await padRef.current.toBlob();
      if (!blob) return;
      await actions.saveSignatureImage(accessCode, jobCardId, blob, name.trim());
      setRedo(false);
      setName("");
      setHasInk(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <SectionTitle icon={PenLine}>Customer sign-off</SectionTitle>

      {existingUrl && !redo && (
        <div className="rounded-lg border border-border bg-card p-4">
          <img
            src={existingUrl || "/placeholder.svg"}
            alt={`Signature of ${signedByName ?? "customer"}`}
            className="h-32 w-full rounded-md border border-border bg-white object-contain"
          />
          <div className="mt-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium text-foreground">{signedByName}</p>
              {signedAt && (
                <p className="text-xs text-muted-foreground">
                  {new Date(signedAt).toLocaleString()}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setRedo(true)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-ring/60"
            >
              Re-sign
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer name"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
          />
          <SignaturePad innerRef={padRef} onChange={setHasInk} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={saving || !hasInk || !name.trim()}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              Save signature
            </button>
            {redo && (
              <button
                type="button"
                onClick={() => setRedo(false)}
                className="inline-flex h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Small presentational helpers ───────────────────────────────────────────────

function SectionTitle({
  icon: Icon,
  children,
  noMargin,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  noMargin?: boolean;
}) {
  return (
    <h2 className={`flex items-center gap-2 text-sm font-semibold text-foreground ${noMargin ? "" : "mb-3"}`}>
      <Icon className="size-4 text-muted-foreground" />
      {children}
    </h2>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3" />}
        {label}
      </dt>
      <dd className="mt-0.5 text-foreground">{children}</dd>
    </div>
  );
}
