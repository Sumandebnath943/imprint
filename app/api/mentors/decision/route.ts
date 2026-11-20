import { z } from "zod";
import { mentorAction } from "@/lib/mentors/server";

export async function POST(request: Request) {
  return mentorAction(request, z.object({ id: z.uuid(), accept: z.boolean() }), "decide_mentorship_request", ({ id, accept }) => ({ p_request: id, p_accept: accept }));
}
