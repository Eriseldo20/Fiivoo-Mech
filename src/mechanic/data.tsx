import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { GenericId } from "convex/values";
import {
  ConvexProvider,
  ConvexReactClient,
  useConvex,
  useMutation,
  useQuery,
} from "convex/react";
import { anyApi } from "convex/server";

// ─────────────────────────────────────────────────────────────────────────────
// Environment switch
//
// In Hercules (or any deployed environment) VITE_CONVEX_URL is set and we wire
// the portal to the real Convex backend defined in mechanic.ts. In the v0
// preview there is no Convex deployment, so we fall back to an in-memory mock
// store with seed data so the UI is fully interactive.
// ─────────────────────────────────────────────────────────────────────────────

const CONVEX_URL =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_CONVEX_URL ?? "";
const REAL = Boolean(CONVEX_URL);
export const PREVIEW_MODE = !REAL;
export const DEMO_ACCESS_CODE = "DEMO-1234";

// ── Shared types ────────────────────────────────────────────────────────────

export type JobId = GenericId<"jobCards">;
export type TaskId = GenericId<"jobTasks">;
export type HistoryId = GenericId<"serviceHistory">;

export type StatusValue =
  | "pending"
  | "in_progress"
  | "awaiting_parts"
  | "complete";

export type MeResult = {
  id: string;
  name: string;
  role: string;
  shopName: string | null;
};

export type JobSummary = {
  _id: JobId;
  jobNumber: string;
  status: string;
  statusLabel: string;
  customerName: string;
  vehicle: string;
  description: string;
  taskCount: number;
  tasksDone: number;
  hasSignature: boolean;
  _creationTime: number;
};

export type JobDetail = {
  _id: JobId;
  jobNumber: string;
  status: string;
  statusLabel: string;
  customerName: string;
  customerPhone: string | null;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleVin: string | null;
  vehicleOdometer: number | null;
  description: string;
  notes: string | null;
  photoUrls: { storageId: string; url: string | null }[];
  tasks: { _id: TaskId; title: string; completed: boolean }[];
  history: {
    _id: HistoryId;
    odometerKm: number;
    description: string;
    type: string;
    _creationTime: number;
  }[];
  signatureUrl: string | null;
  signedByName: string | null;
  signedAt: number | null;
};

export type HistoryInput = {
  odometerKm: number;
  description: string;
  type: string;
};

export type MechanicActions = {
  validateCode: (code: string) => Promise<MeResult | null>;
  updateStatus: (
    accessCode: string,
    jobId: JobId,
    status: StatusValue,
  ) => Promise<void>;
  toggleTask: (
    accessCode: string,
    jobId: JobId,
    taskId: TaskId,
    completed: boolean,
  ) => Promise<void>;
  addHistoryEntry: (
    accessCode: string,
    jobId: JobId,
    entry: HistoryInput,
  ) => Promise<void>;
  uploadPhotos: (accessCode: string, jobId: JobId, files: File[]) => Promise<void>;
  removePhoto: (
    accessCode: string,
    jobId: JobId,
    storageId: string,
  ) => Promise<void>;
  saveSignatureImage: (
    accessCode: string,
    jobId: JobId,
    blob: Blob,
    signedByName: string,
  ) => Promise<void>;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  awaiting_parts: "Awaiting Parts",
  complete: "Complete",
  invoiced: "Invoiced",
};

function id<T extends string>(value: string): GenericId<T> {
  return value as unknown as GenericId<T>;
}

// ═════════════════════════════════════════════════════════════════════════════
// REAL (Convex) adapter
// ═════════════════════════════════════════════════════════════════════════════

function useRealMe(accessCode: string | null) {
  return useQuery(
    anyApi.mechanic.me,
    accessCode ? { accessCode } : "skip",
  ) as MeResult | null | undefined;
}

function useRealJobs(accessCode: string | null) {
  return useQuery(
    anyApi.mechanic.listJobs,
    accessCode ? { accessCode } : "skip",
  ) as JobSummary[] | undefined;
}

function useRealJob(accessCode: string | null, jobId: JobId | null) {
  return useQuery(
    anyApi.mechanic.getJob,
    accessCode && jobId ? { accessCode, jobCardId: jobId } : "skip",
  ) as JobDetail | null | undefined;
}

function useRealActions(): MechanicActions {
  const convex = useConvex();
  const meQuery = anyApi.mechanic.me;
  const updateStatus = useMutation(anyApi.mechanic.updateStatus);
  const toggleTask = useMutation(anyApi.mechanic.toggleTask);
  const addHistory = useMutation(anyApi.mechanic.addHistoryEntry);
  const addPhoto = useMutation(anyApi.mechanic.addPhoto);
  const removePhotoFn = useMutation(anyApi.mechanic.removePhoto);
  const saveSignature = useMutation(anyApi.mechanic.saveSignature);
  const generateUploadUrl = useMutation(anyApi.mechanic.generateUploadUrl);

  return useMemo<MechanicActions>(
    () => ({
      validateCode: async (code) => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) return null;
        return (await convex.query(meQuery, { accessCode: trimmed })) as
          | MeResult
          | null;
      },
      updateStatus: async (accessCode, jobId, status) => {
        await updateStatus({ accessCode, jobCardId: jobId, status });
      },
      toggleTask: async (accessCode, jobId, taskId, completed) => {
        await toggleTask({ accessCode, jobCardId: jobId, taskId, completed });
      },
      addHistoryEntry: async (accessCode, jobId, entry) => {
        await addHistory({ accessCode, jobCardId: jobId, ...entry });
      },
      uploadPhotos: async (accessCode, jobId, files) => {
        for (const file of files) {
          const url = (await generateUploadUrl({ accessCode })) as string;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });
          const { storageId } = await res.json();
          await addPhoto({ accessCode, jobCardId: jobId, storageId });
        }
      },
      removePhoto: async (accessCode, jobId, storageId) => {
        await removePhotoFn({ accessCode, jobCardId: jobId, storageId });
      },
      saveSignatureImage: async (accessCode, jobId, blob, signedByName) => {
        const url = (await generateUploadUrl({ accessCode })) as string;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "image/png" },
          body: blob,
        });
        const { storageId } = await res.json();
        await saveSignature({
          accessCode,
          jobCardId: jobId,
          storageId,
          signedByName,
        });
      },
    }),
    [
      convex,
      meQuery,
      updateStatus,
      toggleTask,
      addHistory,
      addPhoto,
      removePhotoFn,
      saveSignature,
      generateUploadUrl,
    ],
  );
}

function RealProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new ConvexReactClient(CONVEX_URL));
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}

// ═════════════════════════════════════════════════════════════════════════════
// MOCK (in-memory) adapter — used in the v0 preview
// ═════════════════════════════════════════════════════════════════════════════

type MockTask = { _id: string; title: string; completed: boolean };
type MockHistory = {
  _id: string;
  odometerKm: number;
  description: string;
  type: string;
  _creationTime: number;
};
type MockJob = {
  _id: string;
  jobNumber: string;
  status: string;
  customerName: string;
  customerPhone: string | null;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleVin: string | null;
  vehicleOdometer: number | null;
  description: string;
  notes: string | null;
  tasks: MockTask[];
  history: MockHistory[];
  photos: { storageId: string; url: string }[];
  signatureUrl: string | null;
  signedByName: string | null;
  signedAt: number | null;
  _creationTime: number;
};
type MockStore = {
  employee: { id: string; name: string; role: string; code: string };
  shopName: string;
  jobs: MockJob[];
};

let counter = 1;
const uid = (prefix: string) => `${prefix}_${counter++}_${Date.now()}`;

function seed(): MockStore {
  const now = Date.now();
  return {
    employee: {
      id: "emp_demo",
      name: "Alex Rivera",
      role: "mechanic",
      code: DEMO_ACCESS_CODE,
    },
    shopName: "Fiivoo Mech — Downtown",
    jobs: [
      {
        _id: "job_1",
        jobNumber: "JC-1042",
        status: "in_progress",
        customerName: "Maria Gonzalez",
        customerPhone: "+1 555 0142",
        vehicleMake: "Toyota",
        vehicleModel: "Corolla",
        vehicleYear: 2019,
        vehicleVin: "JTDBR32E430098765",
        vehicleOdometer: 84200,
        description:
          "Customer reports squealing when braking and a vibration at highway speed. Inspect front brakes and rotate tyres.",
        notes: "Customer needs the car back by 5pm.",
        tasks: [
          { _id: "t1", title: "Inspect front brake pads", completed: true },
          { _id: "t2", title: "Replace front rotors", completed: false },
          { _id: "t3", title: "Rotate & balance tyres", completed: false },
          { _id: "t4", title: "Road test", completed: false },
        ],
        history: [
          {
            _id: "h1",
            odometerKm: 78000,
            description: "Full service + oil change",
            type: "service",
            _creationTime: now - 1000 * 60 * 60 * 24 * 120,
          },
        ],
        photos: [],
        signatureUrl: null,
        signedByName: null,
        signedAt: null,
        _creationTime: now - 1000 * 60 * 60 * 3,
      },
      {
        _id: "job_2",
        jobNumber: "JC-1043",
        status: "pending",
        customerName: "David Chen",
        customerPhone: "+1 555 0188",
        vehicleMake: "Honda",
        vehicleModel: "Civic",
        vehicleYear: 2021,
        vehicleVin: null,
        vehicleOdometer: 41500,
        description:
          "Scheduled 40,000 km service. Oil and filter change, cabin filter, multi-point inspection.",
        notes: null,
        tasks: [
          { _id: "t5", title: "Oil & filter change", completed: false },
          { _id: "t6", title: "Replace cabin air filter", completed: false },
          { _id: "t7", title: "Multi-point inspection", completed: false },
        ],
        history: [],
        photos: [],
        signatureUrl: null,
        signedByName: null,
        signedAt: null,
        _creationTime: now - 1000 * 60 * 60 * 26,
      },
      {
        _id: "job_3",
        jobNumber: "JC-1039",
        status: "complete",
        customerName: "Sarah Johnson",
        customerPhone: "+1 555 0107",
        vehicleMake: "Ford",
        vehicleModel: "Ranger",
        vehicleYear: 2018,
        vehicleVin: "MNBRR12C880011223",
        vehicleOdometer: 119800,
        description: "Replace worn serpentine belt and check tensioner.",
        notes: null,
        tasks: [
          { _id: "t8", title: "Replace serpentine belt", completed: true },
          { _id: "t9", title: "Check belt tensioner", completed: true },
        ],
        history: [
          {
            _id: "h2",
            odometerKm: 119800,
            description: "Replaced serpentine belt, tensioner within spec",
            type: "repair",
            _creationTime: now - 1000 * 60 * 60 * 48,
          },
        ],
        photos: [],
        signatureUrl: null,
        signedByName: "Sarah Johnson",
        signedAt: now - 1000 * 60 * 60 * 47,
        _creationTime: now - 1000 * 60 * 60 * 50,
      },
    ],
  };
}

const MockCtx = createContext<{
  store: MockStore;
  setStore: React.Dispatch<React.SetStateAction<MockStore>>;
} | null>(null);

function MockProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<MockStore>(seed);
  const value = useMemo(() => ({ store, setStore }), [store]);
  return <MockCtx.Provider value={value}>{children}</MockCtx.Provider>;
}

function useMockCtx() {
  const ctx = useContext(MockCtx);
  if (!ctx) throw new Error("Mechanic mock provider missing");
  return ctx;
}

function codeMatches(store: MockStore, accessCode: string | null) {
  if (!accessCode) return false;
  return accessCode.trim().toUpperCase() === store.employee.code;
}

function toSummary(j: MockJob): JobSummary {
  return {
    _id: id<"jobCards">(j._id),
    jobNumber: j.jobNumber,
    status: j.status,
    statusLabel: STATUS_LABELS[j.status] ?? j.status,
    customerName: j.customerName,
    vehicle: `${j.vehicleYear} ${j.vehicleMake} ${j.vehicleModel}`.trim(),
    description: j.description,
    taskCount: j.tasks.length,
    tasksDone: j.tasks.filter((t) => t.completed).length,
    hasSignature: Boolean(j.signatureUrl),
    _creationTime: j._creationTime,
  };
}

function toDetail(j: MockJob): JobDetail {
  return {
    _id: id<"jobCards">(j._id),
    jobNumber: j.jobNumber,
    status: j.status,
    statusLabel: STATUS_LABELS[j.status] ?? j.status,
    customerName: j.customerName,
    customerPhone: j.customerPhone,
    vehicleMake: j.vehicleMake,
    vehicleModel: j.vehicleModel,
    vehicleYear: j.vehicleYear,
    vehicleVin: j.vehicleVin,
    vehicleOdometer: j.vehicleOdometer,
    description: j.description,
    notes: j.notes,
    photoUrls: j.photos.map((p) => ({ storageId: p.storageId, url: p.url })),
    tasks: j.tasks.map((t) => ({
      _id: id<"jobTasks">(t._id),
      title: t.title,
      completed: t.completed,
    })),
    history: j.history
      .slice()
      .sort((a, b) => b._creationTime - a._creationTime)
      .map((h) => ({
        _id: id<"serviceHistory">(h._id),
        odometerKm: h.odometerKm,
        description: h.description,
        type: h.type,
        _creationTime: h._creationTime,
      })),
    signatureUrl: j.signatureUrl,
    signedByName: j.signedByName,
    signedAt: j.signedAt,
  };
}

function useMockMe(accessCode: string | null): MeResult | null | undefined {
  const { store } = useMockCtx();
  if (!codeMatches(store, accessCode)) return null;
  return {
    id: store.employee.id,
    name: store.employee.name,
    role: store.employee.role,
    shopName: store.shopName,
  };
}

function useMockJobs(accessCode: string | null): JobSummary[] | undefined {
  const { store } = useMockCtx();
  if (!codeMatches(store, accessCode)) return [];
  const rank = (s: string) => (s === "complete" || s === "invoiced" ? 1 : 0);
  return store.jobs
    .slice()
    .sort(
      (a, b) =>
        rank(a.status) - rank(b.status) || b._creationTime - a._creationTime,
    )
    .map(toSummary);
}

function useMockJob(
  accessCode: string | null,
  jobId: JobId | null,
): JobDetail | null | undefined {
  const { store } = useMockCtx();
  if (!codeMatches(store, accessCode) || !jobId) return null;
  const job = store.jobs.find((j) => j._id === (jobId as unknown as string));
  return job ? toDetail(job) : null;
}

function useMockActions(): MechanicActions {
  const { store, setStore } = useMockCtx();

  const patchJob = useCallback(
    (jobId: JobId, fn: (j: MockJob) => MockJob) => {
      setStore((prev) => ({
        ...prev,
        jobs: prev.jobs.map((j) =>
          j._id === (jobId as unknown as string) ? fn(j) : j,
        ),
      }));
    },
    [setStore],
  );

  return useMemo<MechanicActions>(
    () => ({
      validateCode: async (code) => {
        if (!codeMatches(store, code)) return null;
        return {
          id: store.employee.id,
          name: store.employee.name,
          role: store.employee.role,
          shopName: store.shopName,
        };
      },
      updateStatus: async (_accessCode, jobId, status) => {
        patchJob(jobId, (j) => ({ ...j, status }));
      },
      toggleTask: async (_accessCode, jobId, taskId, completed) => {
        patchJob(jobId, (j) => ({
          ...j,
          tasks: j.tasks.map((t) =>
            t._id === (taskId as unknown as string) ? { ...t, completed } : t,
          ),
        }));
      },
      addHistoryEntry: async (_accessCode, jobId, entry) => {
        patchJob(jobId, (j) => ({
          ...j,
          history: [
            ...j.history,
            { _id: uid("h"), _creationTime: Date.now(), ...entry },
          ],
        }));
      },
      uploadPhotos: async (_accessCode, jobId, files) => {
        const added = files.map((f) => ({
          storageId: uid("ph"),
          url: URL.createObjectURL(f),
        }));
        patchJob(jobId, (j) => ({ ...j, photos: [...j.photos, ...added] }));
      },
      removePhoto: async (_accessCode, jobId, storageId) => {
        patchJob(jobId, (j) => ({
          ...j,
          photos: j.photos.filter((p) => p.storageId !== storageId),
        }));
      },
      saveSignatureImage: async (_accessCode, jobId, blob, signedByName) => {
        const url = URL.createObjectURL(blob);
        patchJob(jobId, (j) => ({
          ...j,
          signatureUrl: url,
          signedByName,
          signedAt: Date.now(),
        }));
      },
    }),
    [store, patchJob],
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Public hooks — branch on the (constant) environment switch
// ═════════════════════════════════════════════════════════════════════════════

export function useMe(accessCode: string | null) {
  return REAL ? useRealMe(accessCode) : useMockMe(accessCode);
}

export function useJobs(accessCode: string | null) {
  return REAL ? useRealJobs(accessCode) : useMockJobs(accessCode);
}

export function useJob(accessCode: string | null, jobId: JobId | null) {
  return REAL ? useRealJob(accessCode, jobId) : useMockJob(accessCode, jobId);
}

export function useMechanicActions(): MechanicActions {
  return REAL ? useRealActions() : useMockActions();
}

export function MechanicDataProvider({ children }: { children: ReactNode }) {
  if (REAL) return <RealProvider>{children}</RealProvider>;
  return <MockProvider>{children}</MockProvider>;
}
