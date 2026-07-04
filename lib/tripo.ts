import "server-only";

export type CreateTripoTaskInput = {
  prompt: string;
  negativePrompt?: string;
};

export type NormalizedTripoTask = {
  configured: boolean;
  provider?: "tripo";
  taskId?: string;
  task_id?: string;
  status: string;
  progress?: number;
  modelUrl?: string;
  renderedImageUrl?: string;
  previewUrl?: string;
  message?: string;
  raw?: unknown;
};

const DEFAULT_TRIPO_API_BASE = "https://openapi.tripo3d.ai/v3";
const DEFAULT_TRIPO_MODEL = "v3.1-20260211";
const LEGACY_TRIPO_API_BASE = "https://api.tripo3d.ai/v2/openapi";

export async function createTripoTextToModelTask(
  input: string | CreateTripoTaskInput
): Promise<NormalizedTripoTask> {
  const prompt = (typeof input === "string" ? input : input.prompt).trim();
  const negativePrompt = typeof input === "string" ? undefined : input.negativePrompt?.trim();

  if (!process.env.TRIPO_API_KEY) {
    return tripoFallback("Tripo API key not configured. Procedural 3D fallback is available.");
  }

  if (!prompt) {
    return {
      configured: true,
      provider: "tripo",
      status: "failed",
      message: "Enter a prompt before requesting 3D generation."
    };
  }

  const currentBody = {
    prompt,
    model: process.env.TRIPO_MODEL || DEFAULT_TRIPO_MODEL,
    ...(negativePrompt ? { negative_prompt: negativePrompt } : {})
  };

  const current = await tryTripoRequests(
    currentCreateUrls(),
    currentBody,
    negativePrompt ? { prompt, model: process.env.TRIPO_MODEL || DEFAULT_TRIPO_MODEL } : undefined
  );

  if (current.ok) {
    return normalizeTripoStatus(current.data, "queued");
  }

  const legacy = await tryTripoRequests(legacyCreateUrls(), {
    type: "text_to_model",
    prompt,
    ...(negativePrompt ? { negative_prompt: negativePrompt } : {})
  });

  if (legacy.ok) {
    return normalizeTripoStatus(legacy.data, "queued");
  }

  return {
    configured: true,
    provider: "tripo",
    status: "failed",
    message: "Tripo task request failed. You can retry or use the local 3D fallback.",
    raw: legacy.data ?? current.data
  };
}

export async function getTripoTaskStatus(taskId: string): Promise<NormalizedTripoTask> {
  if (!process.env.TRIPO_API_KEY) {
    return tripoFallback("Tripo API key not configured. Procedural 3D fallback is available.");
  }

  if (!taskId.trim()) {
    return {
      configured: true,
      provider: "tripo",
      status: "failed",
      message: "Missing Tripo task id."
    };
  }

  const urls = [...currentStatusUrls(taskId), ...legacyStatusUrls(taskId)];

  for (const url of urls) {
    const response = await safeFetch(url, {
      method: "GET",
      headers: tripoHeaders()
    });

    if (response.ok) {
      return normalizeTripoStatus(response.data, "pending", taskId);
    }
  }

  return {
    configured: true,
    provider: "tripo",
    taskId,
    task_id: taskId,
    status: "failed",
    message: "Tripo status request failed. You can retry or use the local 3D fallback."
  };
}

export function normalizeTripoStatus(
  response: unknown,
  fallbackStatus = "pending",
  fallbackTaskId?: string
): NormalizedTripoTask {
  const taskId =
    getString(response, [
      "task_id",
      "taskId",
      "id",
      "data.task_id",
      "data.taskId",
      "data.id",
      "result.task_id",
      "result.taskId",
      "result.id"
    ]) || fallbackTaskId;
  const rawStatus =
    getString(response, [
      "data.status",
      "data.task_status",
      "result.status",
      "result.task_status",
      "status",
      "task_status"
    ]) || fallbackStatus;
  const progress = getNumber(response, [
    "progress",
    "task_progress",
    "data.progress",
    "data.task_progress",
    "result.progress",
    "result.task_progress"
  ]);
  const modelUrl =
    getUrl(response, modelUrlPaths(), "model") ||
    getUrl(response, modelUrlPaths(), "any") ||
    findDeepUrl(response, "model");
  const renderedImageUrl =
    getUrl(response, imageUrlPaths(), "image") ||
    getUrl(response, imageUrlPaths(), "any") ||
    findDeepUrl(response, "image");
  const status = normalizeStatusLabel(rawStatus, Boolean(modelUrl));

  return {
    configured: true,
    provider: "tripo",
    taskId,
    task_id: taskId,
    status,
    progress: status === "complete" ? 100 : progress,
    modelUrl,
    renderedImageUrl,
    previewUrl: renderedImageUrl,
    raw: response
  };
}

function normalizeStatusLabel(status: string, hasModel: boolean) {
  if (hasModel) {
    return "complete";
  }

  const normalized = status.toLowerCase();
  if (["success", "succeeded", "complete", "completed", "done", "finished"].includes(normalized)) {
    return "complete";
  }
  if (["failed", "failure", "error", "cancelled", "canceled"].includes(normalized)) {
    return "failed";
  }
  if (["queued", "submitted", "created"].includes(normalized)) {
    return "queued";
  }

  return "pending";
}

async function tryTripoRequests(urls: string[], body: object, retryBody?: object) {
  let lastData: unknown;

  for (const url of urls) {
    const first = await postTripo(url, body);
    lastData = first.data;

    if (first.ok) {
      return first;
    }

    if (retryBody) {
      const retry = await postTripo(url, retryBody);
      lastData = retry.data;
      if (retry.ok) {
        return retry;
      }
    }
  }

  return { ok: false, data: lastData };
}

async function postTripo(url: string, body: object) {
  return safeFetch(url, {
    method: "POST",
    headers: tripoHeaders(),
    body: JSON.stringify(body)
  });
}

async function safeFetch(url: string, init: RequestInit) {
  try {
    const response = await fetchWithTimeout(url, init);
    const data = await safeJson(response);
    return { ok: response.ok && !hasTripoError(data), data };
  } catch (error) {
    console.error("Tripo request failed.", sanitizeError(error));
    return { ok: false, data: undefined };
  }
}

function currentCreateUrls() {
  return uniqueUrls(
    baseCandidates().map((base) => `${base}/generation/text-to-model`)
  );
}

function legacyCreateUrls() {
  return uniqueUrls([`${LEGACY_TRIPO_API_BASE}/task`]);
}

function currentStatusUrls(taskId: string) {
  const id = encodeURIComponent(taskId);
  return uniqueUrls(baseCandidates().flatMap((base) => [`${base}/tasks/${id}`, `${base}/task/${id}`]));
}

function legacyStatusUrls(taskId: string) {
  return uniqueUrls([`${LEGACY_TRIPO_API_BASE}/task/${encodeURIComponent(taskId)}`]);
}

function baseCandidates() {
  const configured = (process.env.TRIPO_API_BASE || DEFAULT_TRIPO_API_BASE).replace(/\/$/, "");
  const bases = configured.includes("/v2/openapi")
    ? [DEFAULT_TRIPO_API_BASE, configured]
    : [configured, DEFAULT_TRIPO_API_BASE];

  return uniqueUrls(bases);
}

function uniqueUrls(urls: string[]) {
  return [...new Set(urls.map((url) => url.replace(/\/$/, "")))];
}

function tripoFallback(message: string): NormalizedTripoTask {
  return {
    configured: false,
    status: "fallback",
    message
  };
}

function tripoHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.TRIPO_API_KEY ?? ""}`
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 60_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function hasTripoError(value: unknown) {
  const code = getNumber(value, ["code", "data.code", "error.code"]);
  if (code !== undefined && code !== 0) {
    return true;
  }

  const status = getString(value, ["status", "data.status"]);
  const message = getString(value, ["message", "error", "error.message"]);

  return Boolean(status?.toLowerCase() === "error" || message?.toLowerCase().includes("unauthorized"));
}

function getString(value: unknown, paths: string[]) {
  for (const path of paths) {
    const found = getPath(value, path);
    if (typeof found === "string" && found) {
      return found;
    }
  }

  return undefined;
}

function getNumber(value: unknown, paths: string[]) {
  for (const path of paths) {
    const found = getPath(value, path);
    if (typeof found === "number") {
      return found;
    }
    if (typeof found === "string" && found && !Number.isNaN(Number(found))) {
      return Number(found);
    }
  }

  return undefined;
}

function getUrl(value: unknown, paths: string[], kind: "model" | "image" | "any" = "any") {
  for (const path of paths) {
    const found = getPath(value, path);
    const url = extractUrl(found, kind);
    if (url) {
      return url;
    }
  }

  return undefined;
}

function extractUrl(value: unknown, kind: "model" | "image" | "any" = "any"): string | undefined {
  if (typeof value === "string" && value) {
    return kind === "any" || matchesUrlKind(value, kind) ? value : undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = extractUrl(item, kind);
      if (url) {
        return url;
      }
    }
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      extractUrl(record.url, kind) ||
      extractUrl(record.href, kind) ||
      extractUrl(record.link, kind) ||
      extractUrl(record.download_url, kind) ||
      extractUrl(record.downloadUrl, kind) ||
      extractUrl(record.original, kind)
    );
  }

  return undefined;
}

function findDeepUrl(value: unknown, kind: "model" | "image") {
  const seen = new Set<unknown>();

  function visit(current: unknown, keyHint = ""): string | undefined {
    if (!current || seen.has(current)) {
      return undefined;
    }

    if (typeof current === "string") {
      const keyLooksRight =
        kind === "model" ? /model|glb|gltf|mesh|asset/i.test(keyHint) : /image|preview|render|thumb/i.test(keyHint);
      return matchesUrlKind(current, kind) || (keyLooksRight && /^https?:\/\//i.test(current))
        ? current
        : undefined;
    }

    if (typeof current !== "object") {
      return undefined;
    }

    seen.add(current);

    if (Array.isArray(current)) {
      for (const item of current) {
        const found = visit(item, keyHint);
        if (found) {
          return found;
        }
      }
      return undefined;
    }

    const record = current as Record<string, unknown>;
    const preferredKeys =
      kind === "model"
        ? ["model", "model_url", "modelUrl", "pbr_model", "base_model", "mesh", "asset", "url", "href"]
        : ["rendered_image", "generated_image", "preview_url", "previewUrl", "thumbnail", "image", "url", "href"];

    for (const key of preferredKeys) {
      const found = visit(record[key], key);
      if (found) {
        return found;
      }
    }

    for (const [key, item] of Object.entries(record)) {
      const found = visit(item, key);
      if (found) {
        return found;
      }
    }

    return undefined;
  }

  return visit(value);
}

function matchesUrlKind(value: string, kind: "model" | "image") {
  if (!/^https?:\/\//i.test(value)) {
    return false;
  }

  const clean = value.split("?")[0]?.toLowerCase() ?? value.toLowerCase();
  if (kind === "model") {
    return /\.(glb|gltf|fbx|obj|usdz|zip)$/i.test(clean);
  }

  return /\.(png|jpe?g|webp|gif|avif)$/i.test(clean);
}

function getPath(value: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[part];
  }, value);
}

function modelUrlPaths() {
  return [
    "model_url",
    "modelUrl",
    "model",
    "pbr_model",
    "base_model",
    "output.model_url",
    "output.model",
    "output.pbr_model",
    "output.base_model",
    "output.model_urls",
    "data.model_url",
    "data.modelUrl",
    "data.model",
    "data.pbr_model",
    "data.base_model",
    "data.output.model_url",
    "data.output.modelUrl",
    "data.output.model",
    "data.output.pbr_model",
    "data.output.base_model",
    "data.output.model_urls",
    "data.result.model_url",
    "data.result.modelUrl",
    "data.result.model",
    "data.result.pbr_model",
    "data.result.base_model",
    "result.model_url",
    "result.modelUrl",
    "result.model",
    "result.pbr_model",
    "result.base_model"
  ];
}

function imageUrlPaths() {
  return [
    "rendered_image",
    "renderedImageUrl",
    "preview_url",
    "previewUrl",
    "thumbnail",
    "image",
    "data.rendered_image",
    "data.renderedImageUrl",
    "data.preview_url",
    "data.previewUrl",
    "data.thumbnail",
    "data.image",
    "data.output.rendered_image",
    "data.output.renderedImageUrl",
    "data.output.generated_image",
    "data.output.image",
    "data.output.thumbnail",
    "data.output.preview_url",
    "data.output.previewUrl",
    "data.result.rendered_image",
    "data.result.generated_image",
    "data.result.image",
    "data.result.thumbnail",
    "data.result.preview_url",
    "data.result.previewUrl",
    "result.rendered_image",
    "result.generated_image",
    "result.image",
    "result.thumbnail",
    "result.preview_url",
    "result.previewUrl"
  ];
}

function sanitizeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { message: "Unknown Tripo error" };
}
