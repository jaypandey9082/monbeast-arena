import { CircleDashed } from "lucide-react";
import { cn } from "@/lib/format";

type EmptyStateProps = {
  title: string;
  description: string;
  className?: string;
};

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid min-h-48 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center",
        className
      )}
    >
      <div>
        <CircleDashed className="mx-auto h-9 w-9 text-[var(--text-muted)]" aria-hidden="true" />
        <h3 className="mt-4 text-lg font-bold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-muted)]">{description}</p>
      </div>
    </div>
  );
}
