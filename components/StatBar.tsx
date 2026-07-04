import { cn } from "@/lib/format";

type StatBarProps = {
  label: string;
  value: number;
  max?: number;
  accent?: string;
  className?: string;
};

export function StatBar({ label, value, max = 100, accent = "#836EF9", className }: StatBarProps) {
  const safeValue = Math.max(0, Math.min(max, value));
  const width = max === 0 ? 0 : (safeValue / max) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        <span>{label}</span>
        <span>{safeValue}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${accent}, #FBBF24)`
          }}
        />
      </div>
    </div>
  );
}
