import { NextResponse } from "next/server";
import { z } from "zod";
import { reflect } from "@/lib/ai/mirror";
import { rateLimit } from "@/lib/api/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { ADULT_ONLY_MESSAGE, hasConfirmedAdultAge } from "@/lib/auth/eligibility";

export const maxDuration = 30;

const requestSchema = z.object({
  message: z.string().max(1500).optional().default(""),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "mirror", "assistant", "system"]),
    content: z.string().max(2500),
  })).max(80).default([]),
  sessionContext: z.string().max(150).default("Open reflection"),
  mode: z.enum(["question", "summary"]).default("question"),
});

const unavailable = "Mirror is temporarily unavailable. Your reflection can wait or you can end the session.";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ response: "Sign in to use Mirror." }, { status: 401 });
    if (!hasConfirmedAdultAge(user)) return NextResponse.json({ response: ADULT_ONLY_MESSAGE }, { status: 403 });
    const limit = rateLimit(`mirror:${user.id}`, 30, 300000);
    if (!limit.allowed) return NextResponse.json({ response: "Mirror has reached its request limit. Try again shortly." }, {
      status: 429, headers: { "Retry-After": String(limit.retryAfter) },
    });
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ response: "That message could not be read." }, { status: 400 });
    const { message, conversationHistory, sessionContext, mode } = parsed.data;
    const history = conversationHistory.flatMap(({ role, content }) => role === "system" ? [] : [{ role, content }]).slice(-16);
    return NextResponse.json(await reflect({ message, history, topic: sessionContext, mode }));
  } catch (error) {
    console.error("Mirror request failed", error instanceof Error ? error.name : "request error");
    return NextResponse.json({ response: unavailable }, { status: 503 });
  }
}
