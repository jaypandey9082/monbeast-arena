import type { ReactNode } from "react";
import { StarfieldBackground } from "@/components/StarfieldBackground";
import { TopNav } from "@/components/TopNav";
import { cn } from "@/lib/format";

type PageFrameProps = {
  children: ReactNode;
  className?: string;
  fullHeight?: boolean;
};

export function PageFrame({ children, className, fullHeight = false }: PageFrameProps) {
  return (
    <main
      className={cn(
        "relative overflow-hidden bg-[#07050d] text-white",
        fullHeight ? "h-dvh min-h-[620px]" : "min-h-screen",
        className
      )}
    >
      <StarfieldBackground />
      <div className="relative z-10 flex min-h-full flex-col">
        <TopNav />
        {children}
      </div>
    </main>
  );
}
