import { BeastCard } from "@/components/BeastCard";
import { generateBeastTraits } from "@/lib/beastTraits";
import { cn } from "@/lib/format";
import { safeTruncate } from "@/lib/hash";
import type { MockBeast } from "@/lib/mockData";

type BeastPreviewProps = {
  prompt: string;
  tokenId?: string | number;
  className?: string;
};

export function BeastPreview({ prompt, tokenId = "preview", className }: BeastPreviewProps) {
  const cleanPrompt = safeTruncate(prompt, 240);

  if (!cleanPrompt) {
    return (
      <div
        className={cn(
          "grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center",
          className
        )}
      >
        <div>
          <div className="mx-auto h-16 w-16 rounded-2xl border border-[rgba(131,110,249,0.45)] bg-[rgba(131,110,249,0.12)]" />
          <p className="mt-5 text-lg font-bold text-[var(--text-primary)]">
            Your beast will appear here.
          </p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--text-muted)]">
            Type a prompt to generate a 3D beast preview locally.
          </p>
        </div>
      </div>
    );
  }

  const traits = generateBeastTraits(cleanPrompt, tokenId);
  const beast: MockBeast = {
    id: tokenId === "preview" ? 777 : Number(tokenId),
    prompt: cleanPrompt,
    name: traits.name,
    owner: "0xPREVIEW000000000000000000000000000000000",
    level: 1,
    wins: 0,
    losses: 0,
    atk: 28,
    def: 24,
    hp: 26,
    spd: 22,
    locked: false,
    rarity: traits.rarity
  };

  return <BeastCard beast={beast} variant="full" className={className} />;
}
