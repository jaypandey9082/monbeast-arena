"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/format";

type GeneratingCreatureStageProps = {
  prompt?: string;
  progress?: number;
  status?: string;
  className?: string;
};

export function GeneratingCreatureStage({
  prompt,
  progress,
  status = "generating",
  className
}: GeneratingCreatureStageProps) {
  const percent = progress === undefined ? undefined : Math.max(0, Math.min(99, Math.round(progress)));

  return (
    <div
      className={cn(
        "relative grid h-full min-h-[260px] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(131,110,249,0.20),rgba(5,5,14,0.94)_58%)]",
        className
      )}
    >
      <div className="absolute inset-0 opacity-70">
        {Array.from({ length: 28 }).map((_, index) => (
          <span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-[#dfffa3] shadow-[0_0_10px_rgba(183,255,74,0.8)] animate-[stageTwinkle_2.8s_ease-in-out_infinite]"
            style={{
              left: `${(index * 41) % 100}%`,
              top: `${(index * 59) % 100}%`,
              animationDelay: `${(index % 8) * 0.2}s`,
              transform: `scale(${0.5 + (index % 4) * 0.22})`
            }}
          />
        ))}
      </div>

      <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 animate-[stageOrbit_18s_linear_infinite] rounded-full border border-transparent border-t-[rgba(183,255,74,0.38)]" />
      <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 animate-[stageOrbit_25s_linear_infinite_reverse] rounded-full border border-transparent border-r-[rgba(131,110,249,0.48)]" />
      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(131,110,249,0.18)] blur-2xl" />

      <div className="relative z-10 max-w-sm px-6 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[rgba(131,110,249,0.45)] bg-black/35">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--monad-purple)]" aria-hidden="true" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-[var(--monad-purple)]">
          {status}
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          Building your 3D beast
        </h3>
        {prompt && <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/50">{prompt}</p>}
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--monad-purple)] to-[#c4b5fd] transition-[width] duration-500"
            style={{ width: `${percent ?? 18}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-bold text-white/42">
          {percent === undefined ? "Task submitted" : `${percent}% complete`}
        </p>
      </div>
    </div>
  );
}
