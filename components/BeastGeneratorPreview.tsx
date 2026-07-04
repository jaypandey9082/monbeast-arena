"use client";

import { Copy, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { BeastPreview } from "@/components/BeastPreview";
import { build3DBeastTokenUri } from "@/lib/tokenMetadata";
import { safeTruncate } from "@/lib/hash";

const defaultPrompt = "chai thunder tiger with violet armor";

export function BeastGeneratorPreview() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [copied, setCopied] = useState(false);
  const cleanPrompt = safeTruncate(prompt, 240);
  const tokenURI = useMemo(
    () => (cleanPrompt ? build3DBeastTokenUri({ prompt: cleanPrompt, tokenId: "preview" }) : ""),
    [cleanPrompt]
  );

  async function copyTokenURI() {
    if (!tokenURI || typeof navigator === "undefined") {
      return;
    }

    await navigator.clipboard.writeText(tokenURI);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="border-t border-white/10 py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-black tracking-normal text-white">
            Beast Generator Preview
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            Preview only. Minting comes in Section 7.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-mon/25 bg-mon/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-mon">
          <Wand2 className="h-4 w-4" aria-hidden="true" />
          Local 3D
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
          <label
            htmlFor="beast-prompt"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45"
          >
            Prompt
          </label>
          <textarea
            id="beast-prompt"
            value={prompt}
            maxLength={240}
            onChange={(event) => setPrompt(event.target.value)}
            className="mt-3 min-h-32 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-4 text-base leading-7 text-white outline-none transition placeholder:text-white/25 focus:border-violetGlow/70"
            placeholder="Describe your beast..."
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/45">{cleanPrompt.length}/240 characters</p>
            <button
              type="button"
              onClick={copyTokenURI}
              disabled={!tokenURI}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/75 transition hover:border-violetGlow/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Copy className="h-4 w-4 text-mon" aria-hidden="true" />
              {copied ? "Copied" : "Copy tokenURI"}
            </button>
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              Generated tokenURI length
            </p>
            <p className="mt-2 font-mono text-sm text-white/75">
              {tokenURI ? tokenURI.length.toLocaleString() : 0} characters
            </p>
          </div>
        </div>

        <BeastPreview prompt={cleanPrompt} tokenId="preview" />
      </div>
    </section>
  );
}
