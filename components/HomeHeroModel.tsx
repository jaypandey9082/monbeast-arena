"use client";

import dynamic from "next/dynamic";
import { Box } from "lucide-react";
import { cn } from "@/lib/format";

const ModelViewer3D = dynamic(
  () => import("@/components/ModelViewer3D").then((module) => module.ModelViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[420px] place-items-center rounded-3xl border border-white/10 bg-black/30 text-[var(--text-muted)]">
        <Box className="h-6 w-6 animate-pulse" aria-hidden="true" />
      </div>
    )
  }
);

type HomeHeroModelProps = {
  prompt?: string;
  className?: string;
};

export function HomeHeroModel({
  prompt = "cyberpunk vada pav dragon",
  className
}: HomeHeroModelProps) {
  const modelUrl = process.env.NEXT_PUBLIC_FEATURED_MONBEAST_MODEL_URL;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-[var(--panel-elevated)] p-4 shadow-[0_32px_100px_rgba(0,0,0,0.42)]",
        className
      )}
    >
      <ModelViewer3D
        modelUrl={modelUrl}
        prompt={prompt}
        className="min-h-[430px] rounded-2xl"
        autoRotate
      />
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--monad-purple)]">
            Live 3D beast preview
          </p>
          <h3 className="mt-2 text-2xl font-black text-[var(--text-primary)]">Dragon Drake</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Procedural fallback active until a Tripo sample URL is configured.
          </p>
        </div>
        <span className="rounded-full border border-[#22C55E]/25 bg-[#22C55E]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#86EFAC]">
          Available
        </span>
      </div>
    </div>
  );
}
