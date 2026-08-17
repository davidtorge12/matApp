import { CodeType } from "./types";

export const env = import.meta.env;

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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

  const key = env.VITE_API_KEY;
  if (key) {
    headers.set("X-API-Key", key);
  }

  const response = await fetch(`${env.VITE_SERVER_URL}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `${response.status} ${response.statusText}`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export function getLatestCodes() {
  return api<CodeType[]>("/latest");
}

export function setMaterialPrice(material: string, price: string) {
  return api("/set-price", {
    method: "POST",
    body: JSON.stringify({ material, price }),
  });
}

export function getMaterialPrices(obj: Record<string, number>) {
  return api<Record<string, string | number>>("/get-prices", {
    method: "POST",
    body: JSON.stringify({ obj }),
  });
}

export function getVOCodes(vo: string) {
  return api<{ vo: string }>("/vo", {
    method: "POST",
    body: JSON.stringify({ vo }),
  });
}

export function upsertCodes(
  chunk: Array<{ code: string; description: string; comments: string }>
) {
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
