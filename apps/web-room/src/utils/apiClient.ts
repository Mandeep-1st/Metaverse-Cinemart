/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildApiUrl } from "@repo/config";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

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

  const url = `${buildApiUrl(path)}${queryString ? `?${queryString}` : ""}`;

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

