import { TxChip, type TxStatus } from "@/components/TxChip";
import { cn } from "@/lib/format";

type TxStep = {
  label: string;
  status: TxStatus;
  hash?: string;
  error?: string;
};

type TxStatusPanelProps = {
  title: string;
  description?: string;
  steps?: TxStep[];
  compact?: boolean;
};

export function TxStatusPanel({
  title,
  description,
  steps = [],
  compact = false
}: TxStatusPanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-black/20",
        compact ? "p-4" : "p-5"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[var(--text-primary)]">
            {title}
          </h3>
          {description && (
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
          )}
        </div>
        {!steps.length && <TxChip status="idle" />}
      </div>

      {steps.length > 0 && (
        <div className={cn("mt-4 grid gap-3", compact ? "" : "sm:grid-cols-3")}>
          {steps.map((step) => (
            <div
              key={`${step.label}-${step.hash ?? step.status}`}
              className="rounded-xl border border-white/10 bg-white/[0.035] p-3"
            >
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {step.label}
              </p>
              <TxChip
                status={step.status}
                label={step.status === "failed" ? step.error ?? step.label : undefined}
                hash={step.hash}
                error={step.error}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
