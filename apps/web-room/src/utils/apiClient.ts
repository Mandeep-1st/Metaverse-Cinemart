/* eslint-disable @typescript-eslint/no-explicit-any */
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const DEFAULT_HTTP_SERVER_URL = "http://localhost:8001";

const httpServerUrl =
  import.meta.env.VITE_HTTP_SERVER_URL || DEFAULT_HTTP_SERVER_URL;

const apiBaseUrl = `${httpServerUrl.replace(/\/$/, "")}/api/v1`;

export async function apiRequest<T>(
  path: string,
  opts?: {
    method?: HttpMethod;
    query?: Record<string, string | number | boolean | undefined>;
    body?: any;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  },
): Promise<T> {
  const method = opts?.method ?? "GET";

  const queryString =
    opts?.query &&
    Object.keys(opts.query)
      .filter((k) => opts.query?.[k] !== undefined && opts.query?.[k] !== null)
      .map(
        (k) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(String(opts.query?.[k]))}`,
      )
      .join("&");

  const url = `${apiBaseUrl}${path}${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts?.signal,
  });

  if (!res.ok) {
    let details = "";
    try {
      details = await res.text();
    } catch {
      details = res.statusText;
    }
    throw new Error(`HTTP ${res.status} for ${url}: ${details}`);
  }

  return (await res.json()) as T;
}

export const apiGet = <T,>(path: string, query?: Record<string, any>) =>
  apiRequest<T>(path, { method: "GET", query });

export const apiPost = <T,>(path: string, body?: any) =>
  apiRequest<T>(path, { method: "POST", body });

