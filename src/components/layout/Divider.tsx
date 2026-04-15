import { cn } from "@/lib/utils";

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-t border-(--color-border)", className)} />;
}
