import { cn } from "../lib/utils";

export function LoadingSpinner({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent",
        className,
      )}
    />
  );
}
