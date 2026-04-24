type EnvKey =
  | "VITE_API_URL"
  | "VITE_SOCKET_URL"
  | "VITE_WEB_MAIN_URL"
  | "VITE_WEB_ROOM_URL";

const API_SEGMENTS = ["api", "v1"] as const;

const normalizeUrl = (value: string) => value.trim().replace(/\/+$/, "");

const readEnv = (name: EnvKey) => {
  const value = (import.meta.env as Record<string, string | undefined>)[name];
  return typeof value === "string" && value.trim().length > 0
    ? normalizeUrl(value)
    : undefined;
};

const readRequiredUrl = (name: EnvKey) => {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const config = {
  get apiUrl() {
    return readRequiredUrl("VITE_API_URL");
  },
  get socketUrl() {
    return readRequiredUrl("VITE_SOCKET_URL");
  },
  get webMainUrl() {
    return readEnv("VITE_WEB_MAIN_URL");
  },
  get webRoomUrl() {
    return readEnv("VITE_WEB_ROOM_URL");
  },
} as const;

export const apiBasePath = `/${API_SEGMENTS.join("/")}`;

export const getApiBaseUrl = () => `${config.apiUrl}${apiBasePath}`;

export const buildApiUrl = (path: string) => {
  const normalizedPath = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${getApiBaseUrl()}${normalizedPath}`;
};
