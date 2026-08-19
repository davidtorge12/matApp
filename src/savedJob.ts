import { CodeType, MaterialsType } from "./types";

export const SAVED_JOBS_KEY = "matapp-saved-jobs";
export const MAX_SAVED_JOBS = 5;

export type SavedJob = {
  id: string;
  fileName: string;
  address: string;
  savedAt: string;
  codes: CodeType[];
  materials: MaterialsType[];
};

export function jobIdentity(job: Pick<SavedJob, "fileName" | "address">): string {
  return `${job.fileName}\0${job.address}`;
}

export function jobLabel(job: Pick<SavedJob, "fileName" | "address">): string {
  const fromAddress = job.address
    .replace(/^Address:\s*/i, "")
    .trim()
    .split("\n")[0]
    ?.trim();
  if (fromAddress) {
    return fromAddress;
  }
  const fileName = job.fileName.trim();
  return fileName || "Saved job";
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseCode(raw: unknown): CodeType | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const _id = text(row._id).trim();
  const code = text(row.code).trim();
  if (!_id || !code) {
    return null;
  }
  const parsed: CodeType = {
    _id,
    code,
    description: text(row.description),
    createdAt: text(row.createdAt),
    updatedAt: text(row.updatedAt),
    materials: text(row.materials),
  };
  if (typeof row.comments === "string") {
    parsed.comments = row.comments;
  }
  if (typeof row.unit === "string") {
    parsed.unit = row.unit;
  }
  if (typeof row.price === "string") {
    parsed.price = row.price;
  }
  if (typeof row.info === "string") {
    parsed.info = row.info;
  }
  return parsed;
}

function parseMaterial(raw: unknown): MaterialsType | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = text(row.id).trim();
  const material = text(row.material).trim();
  const price = typeof row.price === "number" ? row.price : Number(row.price);
  const units = typeof row.units === "number" ? row.units : Number(row.units);
  if (!id || !Number.isFinite(price) || !Number.isFinite(units)) {
    return null;
  }
  if (!material && units === 0 && price === 0) {
    return null;
  }
  return { id, material, price, units };
}

export function parseSavedJob(raw: unknown): SavedJob | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const row = raw as Record<string, unknown>;
  if (!Array.isArray(row.codes) || !Array.isArray(row.materials)) {
    return null;
  }

  const id = text(row.id).trim();
  const fileName = text(row.fileName);
  if (!id) {
    return null;
  }

  const codes = row.codes
    .map(parseCode)
    .filter((code): code is CodeType => code !== null);
  const materials = row.materials
    .map(parseMaterial)
    .filter((item): item is MaterialsType => item !== null);

  return {
    id,
    fileName,
    address: text(row.address),
    savedAt: text(row.savedAt) || new Date().toISOString(),
    codes,
    materials,
  };
}

export function parseSavedJobs(raw: unknown): SavedJob[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(parseSavedJob).filter((job): job is SavedJob => job !== null);
}

export function upsertSavedJob(
  jobs: SavedJob[],
  next: SavedJob,
  max = MAX_SAVED_JOBS,
): SavedJob[] {
  const identity = jobIdentity(next);
  const without = jobs.filter(
    (job) => job.id !== next.id && jobIdentity(job) !== identity,
  );
  return [next, ...without].slice(0, max);
}

export function readSavedJobs(): SavedJob[] {
  try {
    const stored = localStorage.getItem(SAVED_JOBS_KEY);
    if (!stored) {
      return [];
    }
    return parseSavedJobs(JSON.parse(stored));
  } catch {
    return [];
  }
}

export function writeSavedJobs(jobs: SavedJob[]): void {
  try {
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(jobs));
  } catch {
    // Quota or privacy errors must not break the live job.
  }
}
