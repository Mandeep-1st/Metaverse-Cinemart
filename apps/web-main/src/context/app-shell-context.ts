import { createContext } from "react";

export type AppShellProfileSection =
  | "overview"
  | "username"
  | "password"
  | "avatar"
  | "photo"
  | "feedback"
  | "logout";

export type AppShellContextValue = {
  openCommandPalette: () => void;
  openProfilePanel: (section?: AppShellProfileSection) => void;
};

export const AppShellContext = createContext<AppShellContextValue | null>(null);
