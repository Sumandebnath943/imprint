import { z } from "zod";
import { mentorAction } from "@/lib/mentors/server";

const input = z.object({ mentor_id: z.uuid(), message: z.string().max(1000).default("") });

export async function POST(request: Request) {
  return mentorAction(request, input, "request_mentorship", ({ mentor_id, message }) => ({ p_mentor: mentor_id, p_message: message }));
}
