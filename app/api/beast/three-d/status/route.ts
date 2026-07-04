import { NextResponse } from "next/server";
import { getTripoTaskStatus } from "@/lib/tripo";

type StatusRequest = {
  taskId?: unknown;
  task_id?: unknown;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return handleStatus(searchParams.get("taskId") || searchParams.get("task_id"));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StatusRequest;
    const taskId =
      typeof body.taskId === "string"
        ? body.taskId
        : typeof body.task_id === "string"
          ? body.task_id
          : undefined;

    return handleStatus(taskId);
  } catch {
    return NextResponse.json({
      configured: false,
      status: "fallback",
      message: "Could not read Tripo status request. Using procedural 3D fallback."
    });
  }
}

async function handleStatus(taskId?: string | null) {
  if (!taskId) {
    return NextResponse.json(
      {
        configured: Boolean(process.env.TRIPO_API_KEY),
        status: "failed",
        message: "Missing Tripo task id."
      },
      { status: 400 }
    );
  }

  try {
    const result = await getTripoTaskStatus(taskId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("3D status route failed.", error);
    return NextResponse.json({
      ok: false,
      configured: true,
      taskId,
      task_id: taskId,
      status: "failed",
      message: "Tripo status failed. Retry status or use the local 3D fallback."
    });
  }
}
