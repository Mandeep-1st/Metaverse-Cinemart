import { useContext } from "react";
import { AppShellContext } from "../context/app-shell-context";

export function useAppShell() {
  const context = useContext(AppShellContext);

  if (!context) {
    throw new Error("useAppShell must be used within AppShellProvider");
  }

  return context;
}
