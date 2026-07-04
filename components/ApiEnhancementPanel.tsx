"use client";

import { Box, ExternalLink, RefreshCcw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { generateBeastTraits } from "@/lib/beastTraits";
import { cn } from "@/lib/format";

type ApiEnhancementPanelProps = {
  prompt: string;
};

type LoreResponse = {
  configured?: boolean;
  name?: string;
  lore?: string;
  battleCry?: string;
  victoryLine?: string;
  tripoPrompt?: string;
  provider?: string;
};

type ThreeDResponse = {
  configured?: boolean;
  status?: string;
  message?: string;
  provider?: string;
  task_id?: string;
  prompt?: string;
  modelUrl?: string;
  previewUrl?: string;
};

type ThreeDHistoryItem = {
  taskId: string;
  prompt: string;
  status: string;
  modelUrl?: string;
  previewUrl?: string;
  createdAt: number;
  updatedAt: number;
};

const THREE_D_HISTORY_KEY = "monbeast:tripo-model-history";
const MAX_THREE_D_HISTORY = 12;

export function ApiEnhancementPanel({ prompt }: ApiEnhancementPanelProps) {
  const [lore, setLore] = useState<LoreResponse>();
  const [threeD, setThreeD] = useState<ThreeDResponse>();
  const [threeDHistory, setThreeDHistory] = useState<ThreeDHistoryItem[]>([]);
  const [recoverTaskId, setRecoverTaskId] = useState("");
  const [loading, setLoading] = useState<"lore" | "three-d" | "status" | undefined>();
  const [error, setError] = useState<string>();
  const cleanPrompt = prompt.trim();

  useEffect(() => {
    setThreeDHistory(readThreeDHistory());
  }, []);

  async function requestLore() {
    await requestOptional("lore", async () => {
      const response = await fetch("/api/beast/lore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanPrompt,
          traits: generateBeastTraits(cleanPrompt || "MonBeast Arena")
        })
      });
      setLore((await response.json()) as LoreResponse);
    });
  }

  async function requestThreeD() {
    const tripoPrompt = lore?.tripoPrompt || cleanPrompt;

    try {
      setLoading("three-d");
      setError(undefined);
      const response = await fetch("/api/beast/three-d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt, enhancedPrompt: lore?.tripoPrompt })
      });
      const data = (await response.json()) as ThreeDResponse;
      setThreeD(data);
      rememberThreeD(data, tripoPrompt);

      if (data.configured && data.task_id) {
        setLoading("status");
        await pollThreeDTask(data.task_id, tripoPrompt);
      }
    } catch {
      setError("Optional API request failed. Using procedural 3D fallback.");
    } finally {
      setLoading(undefined);
    }
  }

  async function requestThreeDStatus() {
    if (!threeD?.task_id) {
      return;
    }

    await requestOptional("status", async () => {
      const response = await fetch("/api/beast/three-d/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: threeD.task_id })
      });
      const data = (await response.json()) as ThreeDResponse;
      setThreeD(data);
      rememberThreeD(data, threeD.prompt || cleanPrompt);
    });
  }

  async function recoverThreeDTask() {
    const taskId = recoverTaskId.trim();
    if (!taskId) {
      return;
    }

    await requestOptional("status", async () => {
      const response = await fetch("/api/beast/three-d/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId })
      });
      const data = (await response.json()) as ThreeDResponse;
      setThreeD(data);
      rememberThreeD(data, data.prompt || "Recovered Tripo model");
      if (data.configured && data.task_id) {
        setRecoverTaskId("");
      }
    });
  }

  async function pollThreeDTask(taskId: string, tripoPrompt: string) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (attempt > 0) {
        await sleep(2_000);
      }

      const response = await fetch("/api/beast/three-d/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId })
      });
      const data = (await response.json()) as ThreeDResponse;
      setThreeD(data);
      rememberThreeD(data, tripoPrompt);

      if (data.status === "success" || data.status === "failed" || data.status === "cancelled") {
        return;
      }
    }
  }

  function rememberThreeD(response: ThreeDResponse, fallbackPrompt: string) {
    const item = historyItemFromResponse(response, fallbackPrompt);
    if (!item) {
      return;
    }

    setThreeDHistory((current) => writeThreeDHistory(upsertThreeDHistory(current, item)));
  }

  async function requestOptional(
    kind: "lore" | "three-d" | "status",
    action: () => Promise<void>
  ) {
    try {
      setLoading(kind);
      setError(undefined);
      await action();
    } catch {
      setError("Optional API request failed. Using procedural 3D fallback.");
    } finally {
      setLoading(undefined);
    }
  }

  return (
    <details className="mt-5 rounded-2xl border border-[var(--border)] bg-black/20 p-4">
      <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.16em] text-[var(--text-primary)]">
        Enhance with AI / 3D
      </summary>

      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
        Tripo 3D is the primary generated model path. Claude and Tripo only run when server-side keys are
        present in .env.local, and missing keys never block preview or minting.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={requestLore}
          disabled={loading !== undefined || !cleanPrompt}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-[var(--text-primary)] transition hover:border-[var(--monad-purple)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]"
        >
          <Sparkles className="h-4 w-4 text-[var(--gold)]" aria-hidden="true" />
          {loading === "lore" ? "Checking Claude..." : "Generate Lore with Claude"}
        </button>
        <button
          type="button"
          onClick={requestThreeD}
          disabled={loading !== undefined || !cleanPrompt}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-[var(--text-primary)] transition hover:border-[var(--monad-purple)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]"
        >
          <Box className="h-4 w-4 text-[var(--monad-purple)]" aria-hidden="true" />
          {loading === "three-d" ? "Checking Tripo..." : "Generate 3D Beast with Tripo"}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/10 p-3 text-sm text-[#FDE68A]">
          {error}
        </p>
      )}

      {lore && (
        <ApiResult
          configured={Boolean(lore.configured)}
          title={lore.name ?? "Fallback lore"}
          detail={lore.lore ?? "Claude API not configured. Using fallback lore."}
          meta={`${lore.provider ?? "fallback"} · ${lore.battleCry ?? "Winner takes all."} · ${
            lore.victoryLine ?? "Your beast is mine now."
          }`}
        />
      )}

      {threeD && (
        <div>
          <ApiResult
            configured={Boolean(threeD.configured)}
            title={getThreeDTitle(threeD)}
            detail={getThreeDDetail(threeD)}
            meta={
              threeD.task_id
                ? `${threeD.status ?? "submitted"} · ${threeD.task_id}`
                : threeD.status ?? "fallback"
            }
            href={threeD.modelUrl}
            imageUrl={threeD.previewUrl}
          />

          {threeD.configured && threeD.task_id && threeD.status !== "success" && (
            <button
              type="button"
              onClick={requestThreeDStatus}
              disabled={loading !== undefined}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-[var(--text-primary)] transition hover:border-[#22C55E]/50 disabled:cursor-not-allowed disabled:text-[var(--text-muted)]"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              {loading === "status" ? "Building 3D model..." : "Check 3D status"}
            </button>
          )}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Track existing task
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={recoverTaskId}
            onChange={(event) => setRecoverTaskId(event.target.value)}
            placeholder="Paste Tripo task id"
            className="min-h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--monad-purple)]"
          />
          <button
            type="button"
            onClick={recoverThreeDTask}
            disabled={loading !== undefined || !recoverTaskId.trim()}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-bold text-[var(--text-primary)] transition hover:border-[#22C55E]/50 disabled:cursor-not-allowed disabled:text-[var(--text-muted)]"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Track
          </button>
        </div>
      </div>

      <ThreeDHistoryList
        items={threeDHistory}
        onRefresh={(item) => {
          setThreeD({
            configured: true,
            provider: "tripo",
            task_id: item.taskId,
            prompt: item.prompt,
            status: item.status,
            modelUrl: item.modelUrl,
            previewUrl: item.previewUrl
          });
          void requestOptional("status", async () => {
            const response = await fetch("/api/beast/three-d/status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ task_id: item.taskId })
            });
            const data = (await response.json()) as ThreeDResponse;
            setThreeD(data);
            rememberThreeD(data, item.prompt);
          });
        }}
      />
    </details>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function historyItemFromResponse(
  response: ThreeDResponse,
  fallbackPrompt: string
): ThreeDHistoryItem | undefined {
  if (!response.configured || !response.task_id) {
    return undefined;
  }

  const now = Date.now();

  return {
    taskId: response.task_id,
    prompt: response.prompt || fallbackPrompt || "Untitled Tripo beast",
    status: response.status || "submitted",
    modelUrl: response.modelUrl,
    previewUrl: response.previewUrl,
    createdAt: now,
    updatedAt: now
  };
}

function readThreeDHistory() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(THREE_D_HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const value = JSON.parse(raw) as ThreeDHistoryItem[];
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item) => item.taskId).slice(0, MAX_THREE_D_HISTORY);
  } catch {
    return [];
  }
}

function writeThreeDHistory(items: ThreeDHistoryItem[]) {
  const next = items.slice(0, MAX_THREE_D_HISTORY);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THREE_D_HISTORY_KEY, JSON.stringify(next));
  }

  return next;
}

function upsertThreeDHistory(items: ThreeDHistoryItem[], item: ThreeDHistoryItem) {
  const existing = items.find((value) => value.taskId === item.taskId);
  const merged = existing
    ? {
        ...existing,
        ...item,
        createdAt: existing.createdAt,
        previewUrl: item.previewUrl || existing.previewUrl,
        modelUrl: item.modelUrl || existing.modelUrl
      }
    : item;

  return [merged, ...items.filter((value) => value.taskId !== item.taskId)].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
}

function getThreeDTitle(response: ThreeDResponse) {
  if (!response.configured) {
    return "3D API not configured";
  }
  if (response.status === "success") {
    return "3D beast ready";
  }
  if (response.status === "running" || response.status === "queued") {
    return "Tripo task processing";
  }

  return "Tripo task submitted";
}

function getThreeDDetail(response: ThreeDResponse) {
  if (!response.configured) {
    return response.message ?? "Tripo API key not configured. Using procedural 3D fallback.";
  }
  if (response.status === "success") {
    return "Tripo generated a 3D model preview and GLB file. Open the model or mint it as animation_url metadata.";
  }
  if (response.status === "running" || response.status === "queued") {
    return "Tripo is generating the 3D model. Check status again in a moment.";
  }

  return "Tripo accepted the request and created a generation task.";
}

function ApiResult({
  configured,
  title,
  detail,
  meta,
  href,
  imageUrl
}: {
  configured: boolean;
  title: string;
  detail: string;
  meta: string;
  href?: string;
  imageUrl?: string;
}) {
  return (
    <div
      className={cn(
        "mt-4 rounded-xl border p-3",
        configured
          ? "border-[#22C55E]/20 bg-[#22C55E]/10"
          : "border-[#FBBF24]/20 bg-[#FBBF24]/10"
      )}
    >
      {imageUrl && (
        <div
          role="img"
          aria-label={`${title} preview`}
          className="mb-3 aspect-square overflow-hidden rounded-xl border border-white/10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${imageUrl}")` }}
        />
      )}
      <p className="text-sm font-black text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{detail}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {configured ? "Configured" : "API not configured"} · {meta}
      </p>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#22C55E]/25 px-3 text-sm font-bold text-[#86EFAC] transition hover:border-[#22C55E]/60 hover:text-white"
        >
          Open 3D model
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

function ThreeDHistoryList({
  items,
  onRefresh
}: {
  items: ThreeDHistoryItem[];
  onRefresh: (item: ThreeDHistoryItem) => void;
}) {
  if (!items.length) {
    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Generated 3D Models
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          New Tripo generations will appear here with previews and model links.
        </p>
      </div>
    );
  }

  return (
    <section className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--text-primary)]">
          Generated 3D Models
        </p>
        <p className="text-xs font-bold text-[var(--text-muted)]">{items.length}</p>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <article
            key={item.taskId}
            className="grid gap-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[92px_1fr]"
          >
            <div
              role="img"
              aria-label={`${item.prompt} preview`}
              className={cn(
                "aspect-square rounded-lg border border-white/10 bg-black/40 bg-cover bg-center bg-no-repeat",
                !item.previewUrl && "grid place-items-center"
              )}
              style={item.previewUrl ? { backgroundImage: `url("${item.previewUrl}")` } : undefined}
            >
              {!item.previewUrl && <Box className="h-5 w-5 text-[var(--text-muted)]" />}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[var(--text-primary)]">
                {item.prompt}
              </p>
              <p className="mt-1 truncate text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                {item.status} · {shortTaskId(item.taskId)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onRefresh(item)}
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-bold text-[var(--text-secondary)] transition hover:border-[#22C55E]/50 hover:text-white"
                >
                  <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Status
                </button>
                {item.modelUrl && (
                  <a
                    href={item.modelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#22C55E]/25 px-3 text-xs font-bold text-[#86EFAC] transition hover:border-[#22C55E]/60 hover:text-white"
                  >
                    Model
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function shortTaskId(taskId: string) {
  return `${taskId.slice(0, 8)}...${taskId.slice(-4)}`;
}
