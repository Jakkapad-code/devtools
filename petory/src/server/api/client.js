import "server-only";
import { getServerEnv } from "@/shared/config/env";

const REQUEST_TIMEOUT_MS = 10_000;

export class BackendRequestError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "BackendRequestError";
    this.status = status;
    this.details = details;
  }
}

async function readResponseBody(response) {
  if (!(response.headers.get("content-type") ?? "").includes("application/json")) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** Server-side boundary for all future Petory backend calls. */
export async function backendFetch(path, options = {}) {
  const { BACKEND_URL } = getServerEnv();
  const { accessToken, headers, timeoutMs = REQUEST_TIMEOUT_MS, ...requestOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const requestId = crypto.randomUUID();

  try {
    const response = await fetch(new URL(path, BACKEND_URL), {
      ...requestOptions,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "X-Request-ID": requestId,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
    });
    const body = await readResponseBody(response);

    if (!response.ok) {
      const message = body?.message ?? body?.detail ?? `Backend request failed (${response.status})`;
      throw new BackendRequestError(message, response.status, body);
    }

    return body;
  } catch (error) {
    if (error instanceof BackendRequestError) throw error;
    const message = error?.name === "AbortError" ? "Backend request timed out" : "Backend request failed";
    throw new BackendRequestError(message, 503);
  } finally {
    clearTimeout(timeout);
  }
}
