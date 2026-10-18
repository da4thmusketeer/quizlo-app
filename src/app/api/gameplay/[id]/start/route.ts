import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { publicQuizSession } from "@/lib/sanitizeQuizSession";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : request.cookies.get("auth_token")?.value;
  if (!token)
    return NextResponse.json(
      { success: false, message: "Please log in to play." },
      { status: 401 },
    );
  const base = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  if (!base)
    return NextResponse.json(
      { success: false, message: "The quiz service is not configured." },
      { status: 503 },
    );
  const key = request.headers.get("idempotency-key") ?? randomUUID();
  if (key.length > 200)
    return NextResponse.json(
      { success: false, message: "Invalid request key." },
      { status: 400 },
    );
  try {
    const response = await fetch(
      `${base}/quiz/${encodeURIComponent(params.id)}/start`,
      {
        method: "POST",
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": key,
        },
      },
    );
    const result = await response.json();
    if (!response.ok || result.success === false) {
      return NextResponse.json(
        {
          success: false,
          message:
            typeof result.message === "string"
              ? result.message
              : "Unable to start this quiz.",
        },
        { status: response.ok ? 400 : response.status },
      );
    }
    return NextResponse.json(
      { success: true, data: publicQuizSession(result.data ?? result) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const timeout =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      {
        success: false,
        message: timeout
          ? "The quiz service timed out. Retry to recover your session."
          : "The quiz service could not prepare a safe gameplay session. Please retry.",
      },
      { status: timeout ? 504 : 502 },
    );
  }
}
