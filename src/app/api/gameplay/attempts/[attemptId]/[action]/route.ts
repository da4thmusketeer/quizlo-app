import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const runtime = "nodejs";

const baseAnswer = { questionId: z.string().min(1), timeSpent: z.number().finite().nonnegative() };
const answer = z.discriminatedUnion("type", [
  z.object({ ...baseAnswer, type: z.literal("Mcq"), selectedOptionId: z.string().min(1) }),
  z.object({ ...baseAnswer, type: z.literal("TrueFalse"), selectedOptionId: z.string().min(1) }),
  z.object({ ...baseAnswer, type: z.literal("MultipleSelect"), selectedOptionIds: z.array(z.string().min(1)).min(1) }),
  z.object({ ...baseAnswer, type: z.literal("OrderSequencing"), selectedOptionIds: z.array(z.string().min(1)).min(1) }),
  ...(["ShortAnswer", "FillInTheBlank", "Numeric", "LongAnswer"] as const).map(type => z.object({ ...baseAnswer, type: z.literal(type), textResponse: z.string().min(1) })),
  z.object({ ...baseAnswer, type: z.literal("Matching"), responseJson: z.record(z.string(), z.string()) }),
]);

export async function POST(request: NextRequest, { params }: { params: { attemptId: string; action: string } }) {
  if (!["submit-answer", "complete"].includes(params.action)) return NextResponse.json({ message: "Unknown gameplay action." }, { status: 404 });
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : request.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ message: "Please log in to play." }, { status: 401 });
  const base = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  if (!base) return NextResponse.json({ message: "The quiz service is not configured." }, { status: 503 });
  const key = request.headers.get("idempotency-key") ?? randomUUID();
  if (key.length > 200) return NextResponse.json({ message: "Invalid request key." }, { status: 400 });
  let payload;
  if (params.action === "submit-answer") {
    try {
      const parsed = answer.safeParse(await request.json());
      if (!parsed.success) return NextResponse.json({ message: "The answer payload is invalid." }, { status: 400 });
      payload = parsed.data;
    } catch { return NextResponse.json({ message: "The answer payload is invalid." }, { status: 400 }); }
  }
  try {
    const response = await fetch(`${base}/quiz/attempts/${encodeURIComponent(params.attemptId)}/${params.action}`, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(20000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "Idempotency-Key": key },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    const result = await response.json();
    const originalCompletion = params.action === "complete" && response.status === 409 && typeof result.data?.score === "number";
    if ((!response.ok || result.success === false) && !originalCompletion) {
      return NextResponse.json({ success: false, message: typeof result.message === "string" ? result.message : "The quiz request failed." }, { status: response.ok ? 400 : response.status });
    }
    // Do not forward answer keys from the per-answer grading endpoint.
    const data = params.action === "submit-answer" ? { accepted: true } : result.data ?? result;
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const timeout = error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
    return NextResponse.json({ success: false, message: timeout ? "The quiz service timed out. Your answers are saved; retry to continue." : "The quiz service is unreachable. Your answers are saved; reconnect to continue." }, { status: timeout ? 504 : 502 });
  }
}
