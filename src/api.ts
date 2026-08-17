import { config, REQUEST_TIMEOUT_MS } from "./config";
import { latestCodesPath } from "./pagination";
import { CodeType } from "./types";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function messageFor(status: number, statusText: string, data: unknown): string {
  if (data && typeof data === "object" && "error" in data) {
    return String((data as { error: unknown }).error);
  }
  if (status === 401) {
    return "Not authorised. Check the API key.";
  }
  return `${status} ${statusText}`.trim();
}

/** Marks an abort as ours, so a timeout reads differently from a cancelled page. */
const TIMED_OUT = { reason: "timeout" } as const;

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Forwards a caller's cancellation to the internal controller. Returns a detacher. */
function link(
  source: AbortSignal | null | undefined,
  controller: AbortController,
): () => void {
  if (!source) {
    return () => {};
  }
  if (source.aborted) {
    controller.abort(source.reason);
    return () => {};
  }

  const forward = () => controller.abort(source.reason);
  source.addEventListener("abort", forward, { once: true });
  return () => source.removeEventListener("abort", forward);
}

function parseBody(text: string): unknown {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (config.apiKey) {
    headers.set("X-API-Key", config.apiKey);
  }

  // Without a timeout a request on a weak site connection hangs indefinitely and
  // the list is stuck on skeletons with no way to retry. Composed by hand rather
  // than with `AbortSignal.any`, which is too recent to rely on for phones that
  // are a few OS versions behind.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(TIMED_OUT), REQUEST_TIMEOUT_MS);
  const unlink = link(init?.signal, controller);

  let response: Response;
  try {
    response = await fetch(`${config.serverUrl}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.reason === TIMED_OUT) {
      throw new ApiError(0, "The request timed out. Check your connection.");
    }
    // A caller-cancelled request is not a failure to report; it is rethrown so
    // the caller's own `cancelled` check can swallow it.
    if (isAbort(error)) {
      throw error;
    }
    throw new ApiError(0, "Could not reach the server.");
  } finally {
    clearTimeout(timer);
    unlink();
  }

  const data = parseBody(await response.text());

  if (!response.ok) {
    throw new ApiError(
      response.status,
      messageFor(response.status, response.statusText, data),
    );
  }

  return data as T;
}

export type PaginatedCodes = {
  items: CodeType[];
  total: number;
  page: number;
  pageSize: number;
};

export type JobCodeUpload = {
  code: string;
  description: string;
  comments: string;
};

export function getLatestCodes(page = 1, signal?: AbortSignal) {
  return api<PaginatedCodes>(latestCodesPath(page), { signal });
}

export function setMaterialPrice(material: string, price: number) {
  return api("/set-price", {
    method: "POST",
    body: JSON.stringify({ material, price }),
  });
}

export function getMaterialPrices(
  obj: Record<string, number>,
  signal?: AbortSignal,
) {
  // The API answers with numbers. `string` stays in the type because a server that
  // has not been redeployed yet still returns the old stringly prices, and the
  // caller coerces either way.
  return api<Record<string, string | number>>("/get-prices", {
    method: "POST",
    body: JSON.stringify({ obj }),
    signal,
  });
}

export function getVOCodes(vo: string) {
  return api<{ vo: string }>("/vo", {
    method: "POST",
    body: JSON.stringify({ vo }),
  });
}

export function upsertCodes(chunk: JobCodeUpload[]) {
  return api<CodeType[]>("/codes", {
    method: "POST",
    body: JSON.stringify(chunk),
  });
}

export function updateCodeMaterials(id: string, materials: string) {
  return api("/code", {
    method: "POST",
    body: JSON.stringify({ param: { id, materials } }),
  });
}
