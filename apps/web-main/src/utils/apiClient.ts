type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";


const httpServerUrl =
  import.meta.env.VITE_HTTP_SERVER_URL;

const apiBaseUrl = `${httpServerUrl.replace(/\/$/, "")}/api/v1`;

type ApiRequestOptions = {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | undefined>;
  body?: any;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  silent?: boolean;
};

type ErrorContext = {
  path: string;
  method: HttpMethod;
  status: number;
  serverMessage: string;
};

export class ApiClientError extends Error {
  status?: number;
  path: string;
  serverMessage?: string;

  constructor(message: string, options: { status?: number; path: string; serverMessage?: string }) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.path = options.path;
    this.serverMessage = options.serverMessage;
  }
}

function normalizeServerMessage(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function deriveFriendlyMessage({ path, status, serverMessage }: ErrorContext) {
  const normalizedMessage = normalizeServerMessage(serverMessage);
  const lowerMessage = normalizedMessage.toLowerCase();

  if (path === "/users/signin" || path === "/users/google") {
    if (
      status === 401 ||
      status === 404 ||
      lowerMessage.includes("password is invalid") ||
      lowerMessage.includes("signup first")
    ) {
      return "Invalid credentials";
    }

    if (lowerMessage.includes("not verified")) {
      return "Please verify your account before signing in.";
    }
  }

  if (path === "/users/register" && lowerMessage.includes("username is already taken")) {
    return "That username is already taken.";
  }

  if (path === "/users/verifyotp") {
    if (lowerMessage.includes("expired")) {
      return "That OTP has expired. Request a fresh code and try again.";
    }

    return "That OTP code is invalid. Check it and try again.";
  }

  if (path === "/users/requestotp") {
    return "We couldn't resend the OTP right now. Try again.";
  }

  if (path === "/users/password" && lowerMessage.includes("incorrect")) {
    return "Current password is incorrect.";
  }

  if (lowerMessage.includes("profile photo upload failed")) {
    return "We couldn't update your profile photo. Try another image.";
  }

  if (lowerMessage.includes("avatar is required")) {
    return "Choose an avatar before saving.";
  }

  if (lowerMessage.includes("feedback message is required")) {
    return "Add a message before sending feedback.";
  }

  if (lowerMessage.includes("google credential")) {
    return "Google sign-in couldn't be completed. Try again.";
  }

  if (path.startsWith("/rooms/") && status === 404) {
    return "We couldn't find that room.";
  }

  if (normalizedMessage && !lowerMessage.includes("internal server error")) {
    return normalizedMessage;
  }

  if (status === 400) {
    return "Please review the information you entered and try again.";
  }

  if (status === 401) {
    return "Please sign in and try again.";
  }

  if (status === 403) {
    return "You don't have permission to do that right now.";
  }

  if (status === 404) {
    return "We couldn't find what you were looking for.";
  }

  if (status === 409) {
    return "That action conflicts with something that already exists.";
  }

  return "Something went wrong, try again.";
}

function extractServerMessage(payload: unknown, fallbackText: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallbackText;
}

export async function apiRequest<T>(
  path: string,
  opts?: ApiRequestOptions,
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

  let res: Response;

  try {
    res = await fetch(url, {
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
  } catch {
    const error = new ApiClientError("Something went wrong, try again.", {
      path,
    });

    if (!opts?.silent) {
      const { toast } = await import("./toast");
      toast.error(error.message);
    }

    throw error;
  }

  if (!res.ok) {
    let payload: unknown = null;
    let details = "";
    const contentType = res.headers.get("content-type") || "";

    try {
      if (contentType.includes("application/json")) {
        payload = await res.json();
      } else {
        details = await res.text();
      }
    } catch {
      details = res.statusText;
    }

    const serverMessage = extractServerMessage(payload, details);
    const friendlyMessage = deriveFriendlyMessage({
      path,
      method,
      status: res.status,
      serverMessage,
    });
    const error = new ApiClientError(friendlyMessage, {
      status: res.status,
      path,
      serverMessage,
    });

    if (!opts?.silent) {
      const { toast } = await import("./toast");
      toast.error(friendlyMessage);
    }

    throw error;
  }

  return (await res.json()) as T;
}

export const apiGet = <T,>(
  path: string,
  query?: Record<string, any>,
  opts?: Omit<ApiRequestOptions, "method" | "query">,
) => apiRequest<T>(path, { method: "GET", query, ...opts });

export const apiPost = <T,>(
  path: string,
  body?: any,
  opts?: Omit<ApiRequestOptions, "method" | "body">,
) => apiRequest<T>(path, { method: "POST", body, ...opts });

export const apiPatch = <T,>(
  path: string,
  body?: any,
  opts?: Omit<ApiRequestOptions, "method" | "body">,
) => apiRequest<T>(path, { method: "PATCH", body, ...opts });

