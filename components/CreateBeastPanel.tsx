"use client";

import { Box, CheckCircle2, Loader2, RefreshCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { decodeEventLog, type Hash } from "viem";
import {
  useAccount,
  useBalance,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi";
import { EmptyCreatureStage } from "@/components/EmptyCreatureStage";
import { GeneratingCreatureStage } from "@/components/GeneratingCreatureStage";
import { ModelViewer3D } from "@/components/ModelViewer3D";
import type { TxStatus } from "@/components/TxChip";
import {
  hasContractAddress,
  isContractAddressConfigured,
  isContractAddressValid,
  MONBEAST_CONTRACT_ADDRESS,
  monbeastAbi
} from "@/lib/contract";
import { safeTruncate } from "@/lib/hash";
import {
  createSeriousBeastPosterDataUri,
  makeLocalCreature,
  updateLocalCreatureMint,
  upsertLocalCreature,
  type LocalCreatureStatus
} from "@/lib/localCreatures";
import { build3DBeastTokenUri } from "@/lib/tokenMetadata";
import { MINT_FEE_MON, MINT_FEE_WEI, formatWalletError } from "@/lib/mint";
import { MONAD_TESTNET_CHAIN_ID, isMonadTestnet } from "@/lib/monad";

const examples = [
  "cyberpunk vada pav dragon",
  "chai-powered tiger monk",
  "Pune traffic demon",
  "frog boxer with diamond gloves"
];

type MintStatus = Extract<TxStatus, "idle" | "wallet" | "pending" | "confirmed" | "failed">;
type GenerationStatus =
  | "idle"
  | "queued"
  | "generating"
  | "waiting"
  | "complete"
  | "failed"
  | "fallback";

type ThreeDResponse = {
  ok?: boolean;
  configured?: boolean;
  taskId?: string;
  task_id?: string;
  status?: string;
  progress?: number;
  prompt?: string;
  message?: string;
  modelUrl?: string;
  renderedImageUrl?: string;
  previewUrl?: string;
};

type LoreResponse = {
  configured?: boolean;
  provider?: "fallback" | "anthropic" | "claude";
  name?: string;
  lore?: string;
  battleCry?: string;
  victoryLine?: string;
  tripoPrompt?: string;
  negativePrompt?: string;
};

type Generate3DResponse = Omit<ThreeDResponse, "configured"> &
  LoreResponse & {
    stage?: string;
    rawPrompt?: string;
    configured?: {
      claude?: boolean;
      tripo?: boolean;
    };
    providers?: {
      claude?: string;
      tripo?: string;
    };
  };

export function CreateBeastPanel() {
  const [prompt, setPrompt] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generatedTokenURI, setGeneratedTokenURI] = useState("");
  const [threeDTaskId, setThreeDTaskId] = useState<string>();
  const [threeDModelUrl, setThreeDModelUrl] = useState<string>();
  const [threeDImageUrl, setThreeDImageUrl] = useState<string>();
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [generationMessage, setGenerationMessage] = useState("Generate a 3D beast to reveal it on the stage.");
  const [generationProgress, setGenerationProgress] = useState<number>();
  const [fallbackConfirmed, setFallbackConfirmed] = useState(false);
  const [enhancedLore, setEnhancedLore] = useState<LoreResponse>();
  const [mintStatus, setMintStatus] = useState<MintStatus>("idle");
  const [latestTxHash, setLatestTxHash] = useState<Hash | undefined>();
  const [latestMintedId, setLatestMintedId] = useState<string>();
  const [localError, setLocalError] = useState<string>();
  const handledReceiptHash = useRef<Hash | undefined>(undefined);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const onMonad = isMonadTestnet(chainId);
  const { writeContractAsync, isPending: isWaitingForWallet } = useWriteContract();
  const cleanPrompt = safeTruncate(prompt.trim(), 240);
  const previewPrompt = cleanPrompt || generatedPrompt;
  const previewReady = Boolean(generatedTokenURI && generatedPrompt === cleanPrompt);
  const generationReady = Boolean(threeDModelUrl) || fallbackConfirmed;
  const hasGeneratedCreature = Boolean(previewPrompt && (threeDModelUrl || threeDImageUrl || fallbackConfirmed));
  const hasPendingCreature = Boolean(threeDTaskId && previewPrompt && !hasGeneratedCreature);

  const { data: balance } = useBalance({
    address,
    chainId: MONAD_TESTNET_CHAIN_ID,
    query: {
      enabled: Boolean(address) && onMonad
    }
  });

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError
  } = useWaitForTransactionReceipt({
    hash: latestTxHash,
    chainId: MONAD_TESTNET_CHAIN_ID,
    query: {
      enabled: Boolean(latestTxHash)
    }
  });

  const disabledReason = getMintDisabledReason({
    isConnected,
    onMonad,
    contractConfigured: isContractAddressConfigured,
    contractValid: isContractAddressValid,
    prompt: cleanPrompt,
    balance: balance?.value,
    generationReady
  });

  const canMint = !disabledReason && !isWaitingForWallet && !isConfirming;

  useEffect(() => {
    if (!receipt || !latestTxHash || handledReceiptHash.current === latestTxHash) {
      return;
    }

    handledReceiptHash.current = latestTxHash;
    setMintStatus("confirmed");
    setLocalError(undefined);
    setLatestMintedId(extractMintedBeastId(receipt.logs));
  }, [latestTxHash, receipt]);

  useEffect(() => {
    if (receiptError) {
      setMintStatus("failed");
      setLocalError(formatWalletError(receiptError));
    }
  }, [receiptError]);

  useEffect(() => {
    if (!latestMintedId || !generatedTokenURI || !generatedPrompt) {
      return;
    }

    updateLocalCreatureMint({
      prompt: generatedPrompt,
      modelUrl: threeDModelUrl,
      tokenURI: generatedTokenURI,
      mintedTokenId: latestMintedId
    });
  }, [generatedPrompt, generatedTokenURI, latestMintedId, threeDModelUrl]);

  function buildTokenURI() {
    if (!cleanPrompt) {
      setLocalError("Enter a prompt first.");
      return "";
    }

    const tokenURI = build3DBeastTokenUri({
      prompt: cleanPrompt,
      name: enhancedLore?.name,
      lore: enhancedLore?.lore,
      modelUrl: threeDModelUrl,
      renderedImageUrl: threeDImageUrl
    });
    setGeneratedPrompt(cleanPrompt);
    setGeneratedTokenURI(tokenURI);
    setLocalError(undefined);
    saveLocalCreature({
      tokenURI,
      source: threeDModelUrl ? "tripo" : "fallback"
    });

    return tokenURI;
  }

  async function generateThreeDBeast() {
    if (!cleanPrompt) {
      setLocalError("Enter a prompt first.");
      return;
    }

    try {
      resetGenerationForPrompt(false);
      setGenerationStatus("queued");
      setGenerationProgress(4);
      setGenerationMessage("Enhancing your prompt with Claude.");
      setLocalError(undefined);

      const data = await fetchJsonWithTimeout<Generate3DResponse>("/api/beast/generate-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt })
      }, 75_000);

      if (data.ok === false) {
        throw new Error(data.message || "Generation request failed.");
      }

      const lore = generationLoreFromResponse(data);
      setEnhancedLore(lore);
      setGenerationProgress(data.progress ?? 18);
      setGenerationMessage("Tripo task submitted. Forging the 3D beast.");

      applyThreeDResponse(
        {
          configured: data.configured?.tripo,
          taskId: data.taskId,
          task_id: data.task_id,
          status: data.status || data.stage,
          progress: data.progress,
          message: data.message,
          modelUrl: data.modelUrl,
          renderedImageUrl: data.renderedImageUrl,
          previewUrl: data.previewUrl
        },
        lore
      );

      const taskId = data.taskId || data.task_id;
      if (data.configured?.tripo && taskId && !hasUsableThreeDModel(data) && !isFailedThreeD(data)) {
        await pollThreeDTask(taskId, lore);
      }
    } catch {
      setGenerationStatus("failed");
      setGenerationProgress(undefined);
      setGenerationMessage("Generation request failed. Retry, or use the local 3D fallback.");
      setLocalError("The 3D generation request did not complete. This can be a provider/network issue.");
    }
  }

  async function pollThreeDTask(taskId: string, lore?: LoreResponse) {
    for (let attempt = 0; attempt < 18; attempt += 1) {
      await sleep(attempt === 0 ? 1_500 : 5_000);
      const data = await fetchJsonWithTimeout<ThreeDResponse>("/api/beast/three-d/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId })
      }, 65_000);
      applyThreeDResponse(data, lore);

      if (hasUsableThreeDModel(data) || isFailedThreeD(data)) {
        return;
      }
    }

    setGenerationStatus("waiting");
    setGenerationMessage("Tripo is still building. Check status again in a moment.");
    saveLocalCreature({
      tokenURI: generatedTokenURI || buildPendingTokenURI(lore),
      taskId,
      source: "tripo",
      status: "waiting",
      progress: generationProgress,
      message: "Tripo is still finalizing. Check status again."
    });
  }

  async function checkThreeDStatus() {
    if (!threeDTaskId) {
      return;
    }

    try {
      setGenerationStatus("generating");
      setGenerationMessage("Checking Tripo task status.");
      const data = await fetchJsonWithTimeout<ThreeDResponse>("/api/beast/three-d/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: threeDTaskId })
      }, 65_000);
      applyThreeDResponse(data, enhancedLore);
      if (!hasUsableThreeDModel(data) && !isFailedThreeD(data)) {
        setGenerationStatus("waiting");
        setGenerationMessage("Still finalizing. Check again in a moment, or use local 3D fallback.");
      }
    } catch {
      setGenerationStatus("failed");
      setGenerationMessage("Could not refresh Tripo status. Procedural fallback is available.");
    }
  }

  function applyThreeDResponse(data: ThreeDResponse, lore = enhancedLore) {
    const taskId = data.taskId || data.task_id;
    const renderedImageUrl = data.renderedImageUrl || data.previewUrl;

    setThreeDTaskId(taskId);
    setGenerationProgress(data.progress);

    if (!data.configured) {
      applyProceduralFallback(
        lore,
        data.message || "Tripo is unavailable. Showing fast local 3D fallback."
      );
      return;
    }

    if (data.modelUrl) {
      const tokenURI = build3DBeastTokenUri({
        prompt: cleanPrompt,
        name: lore?.name,
        lore: lore?.lore,
        modelUrl: data.modelUrl,
        renderedImageUrl
      });

      setThreeDModelUrl(data.modelUrl);
      setThreeDImageUrl(renderedImageUrl);
      setGenerationStatus("complete");
      setGenerationMessage("3D beast ready. Mint metadata will include animation_url.");
      setFallbackConfirmed(false);
      setGeneratedPrompt(cleanPrompt);
      setGeneratedTokenURI(tokenURI);
      saveLocalCreature({
        tokenURI,
        modelUrl: data.modelUrl,
        renderedImageUrl,
        taskId,
        source: "tripo",
        status: "complete",
        progress: 100,
        message: "3D model ready.",
        enhancedPrompt: lore?.tripoPrompt
      });
      return;
    }

    if (isFailedThreeD(data)) {
      const tokenURI = buildPendingTokenURI(lore, renderedImageUrl);
      setGeneratedPrompt(cleanPrompt);
      setGeneratedTokenURI(tokenURI);
      setGenerationStatus("failed");
      setGenerationProgress(data.progress);
      setGenerationMessage(data.message || "Tripo failed. Retry, or use the local 3D fallback.");
      saveLocalCreature({
        tokenURI,
        renderedImageUrl,
        taskId,
        source: "tripo",
        status: "failed",
        progress: data.progress,
        message: data.message || "Tripo failed. Retry, or use the local 3D fallback.",
        enhancedPrompt: lore?.tripoPrompt
      });
      return;
    }

    if (isCompleteThreeD(data)) {
      if (renderedImageUrl) {
        setThreeDImageUrl(renderedImageUrl);
      }
      setGeneratedPrompt(cleanPrompt);
      const tokenURI = buildPendingTokenURI(lore, renderedImageUrl);
      setGeneratedTokenURI(tokenURI);
      saveLocalCreature({
        tokenURI,
        renderedImageUrl,
        taskId,
        source: "tripo",
        status: "waiting",
        progress: data.progress ?? 99,
        message: "Tripo completed but model URL is not available yet.",
        enhancedPrompt: lore?.tripoPrompt
      });
      setGenerationStatus("waiting");
      setGenerationMessage("Tripo says the task is complete, but no model URL is ready yet. Check again.");
      return;
    }

    if (taskId) {
      if (renderedImageUrl) {
        setThreeDImageUrl(renderedImageUrl);
      }
      setGeneratedPrompt(cleanPrompt);
      const tokenURI = buildPendingTokenURI(lore, renderedImageUrl);
      setGeneratedTokenURI(tokenURI);
      saveLocalCreature({
        tokenURI,
        renderedImageUrl,
        taskId,
        source: "tripo",
        status: "generating",
        progress: data.progress,
        message: data.message || "Tripo is building the 3D model.",
        enhancedPrompt: lore?.tripoPrompt
      });
    }

    setGenerationStatus("generating");
    setGenerationMessage(
      data.progress !== undefined
        ? `Tripo is building the 3D model. ${Math.round(data.progress)}%`
        : "Tripo is building the 3D model."
    );
  }

  function useProceduralFallback() {
    if (!cleanPrompt) {
      setLocalError("Enter a prompt first.");
      return;
    }

    applyProceduralFallback(enhancedLore, "Fast local 3D fallback selected.");
  }

  function applyProceduralFallback(lore = enhancedLore, message = "Fast local 3D fallback ready.") {
    if (!cleanPrompt) {
      return;
    }

    setFallbackConfirmed(true);
    setGenerationStatus("fallback");
    setGenerationProgress(100);
    setGenerationMessage(message);
    const fallbackImageUrl = createSeriousBeastPosterDataUri({
      prompt: cleanPrompt,
      name: lore?.name
    });
    setThreeDModelUrl(undefined);
    setThreeDImageUrl(undefined);
    setGeneratedPrompt(cleanPrompt);
    const tokenURI = build3DBeastTokenUri({
      prompt: cleanPrompt,
      name: lore?.name,
      lore: lore?.lore,
      renderedImageUrl: fallbackImageUrl
    });
    setGeneratedTokenURI(tokenURI);
    saveLocalCreature({
      tokenURI,
      renderedImageUrl: fallbackImageUrl,
      source: "fallback",
      status: "fallback",
      progress: 100,
      message
    });
    setLocalError(undefined);
  }

  function resetGenerationForPrompt(clearToken = true) {
    setThreeDTaskId(undefined);
    setThreeDModelUrl(undefined);
    setThreeDImageUrl(undefined);
    setGenerationProgress(undefined);
    setFallbackConfirmed(false);
    setEnhancedLore(undefined);
    setGeneratedPrompt("");
    setGeneratedTokenURI("");
    if (clearToken) {
      setGenerationStatus("idle");
      setGenerationMessage("Generate a 3D beast to reveal it on the stage.");
    }
  }

  function saveLocalCreature({
    tokenURI,
    modelUrl = threeDModelUrl,
    renderedImageUrl = threeDImageUrl,
    taskId = threeDTaskId,
    source,
    status,
    progress,
    message,
    enhancedPrompt
  }: {
    tokenURI: string;
    modelUrl?: string;
    renderedImageUrl?: string;
    taskId?: string;
    source: "tripo" | "fallback";
    status?: LocalCreatureStatus;
    progress?: number;
    message?: string;
    enhancedPrompt?: string;
  }) {
    if (!cleanPrompt) {
      return;
    }

    upsertLocalCreature(
      makeLocalCreature({
        prompt: cleanPrompt,
        modelUrl,
        renderedImageUrl,
        tokenURI,
        taskId,
        source,
        status,
        progress,
        message,
        enhancedPrompt
      })
    );
  }

  function buildPendingTokenURI(lore?: LoreResponse, renderedImageUrl?: string) {
    return build3DBeastTokenUri({
      prompt: cleanPrompt,
      name: lore?.name,
      lore: lore?.lore,
      renderedImageUrl
    });
  }

  async function mintBeast() {
    if (disabledReason) {
      setLocalError(disabledReason);
      return;
    }
    if (!MONBEAST_CONTRACT_ADDRESS) {
      setLocalError("Real minting needs a deployed MonBeastArena address in NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS.");
      return;
    }

    const tokenURI = previewReady ? generatedTokenURI : buildTokenURI();
    if (!tokenURI) {
      return;
    }

    try {
      setLatestTxHash(undefined);
      setLatestMintedId(undefined);
      setLocalError(undefined);
      setMintStatus("wallet");

      const hash = await writeContractAsync({
        address: MONBEAST_CONTRACT_ADDRESS,
        abi: monbeastAbi,
        functionName: "mintBeast",
        args: [cleanPrompt, tokenURI],
        value: MINT_FEE_WEI,
        chainId: MONAD_TESTNET_CHAIN_ID
      });

      setLatestTxHash(hash);
      setMintStatus("pending");
    } catch (error) {
      setMintStatus("failed");
      setLocalError(formatWalletError(error));
    }
  }

  const generationBusy = generationStatus === "queued" || generationStatus === "generating";
  const generationPercent = generationProgress ?? (generationStatus === "queued" ? 4 : undefined);

  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden md:flex-row">
      <div className="relative flex min-h-[calc(100dvh-61px)] min-w-0 flex-1 items-center justify-center border-r border-white/[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(131,110,249,0.16),transparent_42%)]" />
        <div className="relative z-10 h-[min(68vh,620px)] w-full max-w-[820px] px-5">
          {hasGeneratedCreature ? (
            <ModelViewer3D
              modelUrl={threeDModelUrl}
              posterUrl={threeDImageUrl}
              prompt={previewPrompt}
              className="h-full min-h-[340px] rounded-none border-0 bg-transparent"
              autoRotate
            />
          ) : hasPendingCreature ? (
            <GeneratingCreatureStage
              prompt={previewPrompt}
              progress={generationProgress}
              status={generationStatus}
              className="h-full min-h-[340px] rounded-none border-0 bg-transparent"
            />
          ) : (
            <EmptyCreatureStage />
          )}
        </div>

        {generationBusy && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-7 bg-[#080610]/68 px-6 text-center backdrop-blur-sm">
            <div className="relative grid h-32 w-32 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-[rgba(131,110,249,0.25)]" />
              <span className="absolute inset-4 animate-spin rounded-full border-2 border-transparent border-r-[#a78bfa] border-t-[var(--monad-purple)]" />
              <span className="absolute inset-10 rounded-full bg-[var(--monad-purple)] blur-lg" />
              <span className="relative text-2xl font-black tabular-nums">
                {generationPercent !== undefined ? `${Math.round(generationPercent)}%` : "..."}
              </span>
            </div>
            <div className="w-full max-w-xs">
              <p className="text-sm font-semibold text-white/80">{generationPhase(generationPercent)}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--monad-purple)] to-[#c4b5fd] transition-[width] duration-500"
                  style={{ width: `${Math.min(Math.max(generationPercent ?? 8, 4), 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

      </div>

      <aside className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-t border-white/[0.06] bg-black/28 p-4 backdrop-blur md:w-[340px] lg:w-[360px] md:border-l md:border-t-0">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/45">Your prompt</p>
          <textarea
            id="create-prompt"
            value={prompt}
            maxLength={240}
            placeholder="a storm dragon made of violet glass"
            onChange={(event) => {
              setPrompt(event.target.value);
              setLocalError(undefined);
              resetGenerationForPrompt();
              if (mintStatus !== "pending") {
                setMintStatus("idle");
              }
            }}
            className="mt-3 min-h-28 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-[var(--monad-purple)]"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[11px] text-white/38">{240 - cleanPrompt.length} characters remaining</span>
            <span className="shrink-0 text-[11px] font-semibold text-white/38">Mint fee: {MINT_FEE_MON} MON</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setPrompt(example);
                setLocalError(undefined);
                resetGenerationForPrompt();
              }}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-white/45 transition hover:border-[var(--monad-purple)] hover:text-white"
            >
              {example}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={generateThreeDBeast}
          disabled={generationBusy || !cleanPrompt}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--monad-purple)] px-4 text-sm font-bold text-white transition hover:bg-[var(--purple-hover)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {generationBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Box className="h-4 w-4" aria-hidden="true" />
          )}
          {generationBusy ? "Generating creature" : "Generate creature"}
        </button>

        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/42">
                Generation
              </p>
              <p className="mt-2 text-sm leading-6 text-white/58">{generationMessage}</p>
            </div>
            <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white/48">
              {generationProgress !== undefined ? `${Math.round(generationProgress)}%` : generationStatus}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {threeDTaskId && generationStatus !== "complete" && (
              <button
                type="button"
                onClick={checkThreeDStatus}
                className="inline-flex min-h-8 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/55 transition hover:border-[#22C55E]/50 hover:text-white"
              >
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Check status
              </button>
            )}
            {(generationStatus === "fallback" ||
              generationStatus === "failed" ||
              generationStatus === "idle" ||
              generationStatus === "waiting") && (
              <button
                type="button"
                onClick={useProceduralFallback}
                className="inline-flex min-h-8 items-center justify-center rounded-lg border border-[rgba(131,110,249,0.28)] px-3 text-xs font-semibold text-white/70 transition hover:border-[var(--monad-purple)] hover:text-white"
              >
                Use fallback
              </button>
            )}
          </div>
        </div>

        {(threeDModelUrl || fallbackConfirmed || latestTxHash || localError || latestMintedId) && (
          <div className="rounded-xl border border-white/10 bg-black/35 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/42">
              Mint on Monad
            </p>
            <button
              type="button"
              disabled={!canMint}
              onClick={mintBeast}
              className="mt-3 min-h-12 w-full rounded-xl bg-white text-sm font-black text-black transition hover:bg-white/86 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
            >
              {disabledReason ?? (isWaitingForWallet ? "Confirm in wallet" : isConfirming ? "Confirming mint" : "Mint 3D Beast")}
            </button>

            <p className="mt-3 text-sm leading-6 text-white/45">
              {isConfirmed
                ? "Your beast exists as an ERC-721 NFT on Monad."
                : "Stats are finalized by the contract after mint."}
            </p>

            {latestMintedId && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#22C55E]/25 bg-[#22C55E]/10 p-3 text-sm font-bold text-[#86EFAC]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Minted token #{latestMintedId}
              </div>
            )}
            {localError && (
              <p className="mt-3 rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/10 p-3 text-sm leading-6 text-[#FCA5A5]">
                {localError}
              </p>
            )}
          </div>
        )}
      </aside>
    </section>
  );
}

function getMintDisabledReason({
  isConnected,
  onMonad,
  contractConfigured,
  contractValid,
  prompt,
  balance,
  generationReady
}: {
  isConnected: boolean;
  onMonad: boolean;
  contractConfigured: boolean;
  contractValid: boolean;
  prompt: string;
  balance?: bigint;
  generationReady: boolean;
}) {
  if (!isConnected) {
    return "Connect wallet";
  }
  if (!onMonad) {
    return "Switch to Monad Testnet";
  }
  if (!contractConfigured) {
    return "Add contract address to mint";
  }
  if (!contractValid || !hasContractAddress) {
    return "Invalid contract address";
  }
  if (!prompt) {
    return "Enter a prompt";
  }
  if (prompt.length > 240) {
    return "Prompt too long";
  }
  if (balance !== undefined && balance < MINT_FEE_WEI) {
    return "Insufficient MON";
  }
  if (!generationReady) {
    return "Generate 3D beast first";
  }

  return "";
}

function generationLoreFromResponse(response: Generate3DResponse): LoreResponse {
  return {
    configured: Boolean(response.configured?.claude),
    provider: response.provider || (response.providers?.claude === "claude" ? "claude" : "fallback"),
    name: response.name,
    lore: response.lore,
    battleCry: response.battleCry,
    victoryLine: response.victoryLine,
    tripoPrompt: response.tripoPrompt,
    negativePrompt: response.negativePrompt
  };
}

function isCompleteThreeD(response: ThreeDResponse) {
  const status = response.status?.toLowerCase();
  return Boolean(response.modelUrl) || status === "success" || status === "completed" || status === "complete";
}

function hasUsableThreeDModel(response: ThreeDResponse) {
  return Boolean(response.modelUrl);
}

function isFailedThreeD(response: ThreeDResponse) {
  const status = response.status?.toLowerCase();
  return status === "failed" || status === "cancelled" || status === "canceled" || status === "error";
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchJsonWithTimeout<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

function generationPhase(progress?: number) {
  if (progress === undefined || progress < 12) {
    return "Reading your prompt...";
  }
  if (progress < 45) {
    return "Sculpting the beast...";
  }
  if (progress < 75) {
    return "Texturing the armor...";
  }
  if (progress < 99) {
    return "Preparing the arena...";
  }

  return "Beast incoming...";
}

function extractMintedBeastId(logs: readonly unknown[]) {
  for (const log of logs) {
    const value = log as { data?: `0x${string}`; topics?: readonly [`0x${string}`, ...`0x${string}`[]] };

    if (!value.data || !value.topics) {
      continue;
    }

    try {
      const topics = [...value.topics] as [`0x${string}`, ...`0x${string}`[]];
      const decoded = decodeEventLog({
        abi: monbeastAbi,
        data: value.data,
        topics
      });

      if (decoded.eventName === "BeastMinted") {
        const args = decoded.args as { beastId?: bigint };
        return args.beastId?.toString();
      }
    } catch {
      // Ignore non-MonBeast logs in the receipt.
    }
  }

  return undefined;
}
