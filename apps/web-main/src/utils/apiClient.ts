type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// const DEFAULT_HTTP_SERVER_URL = "http://localhost:3002";

const httpServerUrl =
  import.meta.env.VITE_HTTP_SERVER_URL;

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
  const isFormData = opts?.body instanceof FormData;

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
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(opts?.headers ?? {}),
    },
    body:
      opts?.body !== undefined
        ? isFormData
          ? opts.body
          : JSON.stringify(opts.body)
        : undefined,
    signal: opts?.signal,
  });

  if (!res.ok) {
    // Try to get a useful message; fallback to status text.
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

export const apiPatch = <T,>(path: string, body?: any) =>
  apiRequest<T>(path, { method: "PATCH", body });

